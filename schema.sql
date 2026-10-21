-- PrepMaster AI schema (PostgreSQL / Supabase)
-- Run once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- users
create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  phone            text not null unique,              -- WhatsApp wa_id, digits only e.g. 2348012345678
  name             text,                              -- WhatsApp profile name (may be null)
  referral_code    text not null unique,              -- 12-char code used in START_REF_<code>
  referred_by      uuid references users(id) on delete set null,
  bonus_questions  integer not null default 0 check (bonus_questions >= 0),
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

-- ------------------------------------------------------------ referrals
-- referred_id is UNIQUE: a person can only ever be referred once.
create table if not exists referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references users(id) on delete cascade,
  referred_id  uuid not null unique references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on referrals (referrer_id);

-- --------------------------------------------------------- transactions
create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  reference     text not null unique,                 -- our own reference sent to the payment provider
  plan          text not null check (plan in ('WEEKLY','MONTHLY','QUARTERLY')),
  amount_kobo   bigint not null check (amount_kobo > 0),
  currency      text not null default 'NGN',
  status        text not null default 'PENDING'
                check (status in ('PENDING','SUCCESS','FAILED','AMOUNT_MISMATCH')),
  opay_order_no text,
  cashier_url   text,
  raw_webhook   jsonb,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);
create index if not exists transactions_user_idx on transactions (user_id);

-- -------------------------------------------------------- subscriptions
create table if not exists subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  plan            text not null check (plan in ('WEEKLY','MONTHLY','QUARTERLY','REFERRAL_3DAY')),
  source          text not null check (source in ('PAYMENT','REFERRAL')),
  transaction_id  uuid references transactions(id) on delete set null,
  starts_at       timestamptz not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  check (expires_at > starts_at)
);
create index if not exists subscriptions_user_active_idx on subscriptions (user_id, expires_at desc);

-- ---------------------------------------------------------- withdrawals
-- Commission payouts are manual at first: the admin pays the user, then replies PAID <reference> in WhatsApp.
-- payout_details is free text typed by the user (OPay number or bank + account number). Restrict access
-- to this table and clear old rows once paid.
create table if not exists withdrawals (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,               -- e.g. WD1A2B3C
  user_id         uuid not null references users(id) on delete cascade,
  amount_kobo     bigint not null check (amount_kobo > 0),
  payout_details  text not null,
  status          text not null default 'PENDING' check (status in ('PENDING','PAID','REJECTED')),
  created_at      timestamptz not null default now(),
  processed_at    timestamptz
);
create index if not exists withdrawals_user_idx on withdrawals (user_id);

-- ----------------------------------------------------------- commissions
-- One row per commission. referred_id is UNIQUE => commission on a friend's FIRST payment only.
-- (To pay on every purchase instead, drop that unique constraint.)
-- status: EARNED (in balance, withdrawable once available_at passes) -> WITHDRAWN (requested/paid) | VOID (refund).
create table if not exists commissions (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references users(id) on delete cascade,
  referred_id     uuid not null unique references users(id) on delete cascade,
  transaction_id  uuid not null unique references transactions(id) on delete cascade,
  amount_kobo     bigint not null check (amount_kobo > 0),
  rate_percent    integer not null,
  status          text not null default 'EARNED' check (status in ('EARNED','WITHDRAWN','VOID')),
  available_at    timestamptz not null,
  withdrawal_id   uuid references withdrawals(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists commissions_referrer_idx on commissions (referrer_id, status);

-- ------------------------------------------------------------- security
-- The bot connects with the database owner role (DATABASE_URL), which bypasses RLS.
-- Enabling RLS with no policies blocks anyone using Supabase's public anon/authenticated API keys.
alter table users          enable row level security;
alter table referrals      enable row level security;
alter table transactions   enable row level security;
alter table subscriptions  enable row level security;
alter table withdrawals    enable row level security;
alter table commissions    enable row level security;

-- ====================================================================
-- Phase 1: onboarding profile + study plan (Coach features)
-- ====================================================================

-- One row per student. Populated by the onboarding wizard in WhatsApp.
-- exam_date is what the STUDENT tells us, never an official date we invent.
create table if not exists student_profiles (
  user_id           uuid primary key references users(id) on delete cascade,
  exam              text check (exam in ('JAMB','WAEC','NECO','POST-UTME')),
  exam_date         date,
  subjects          text[] not null default '{}',  -- ALOC subject slugs, e.g. {mathematics,english,physics}
  weak_subject      text,                           -- one of `subjects`
  strong_subject    text,                           -- one of `subjects`
  confidence_level  smallint check (confidence_level between 1 and 5),
  daily_minutes     integer check (daily_minutes between 5 and 480),
  target_course     text,
  onboarded         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- History of generated plans (a new row each time the plan is (re)generated,
-- e.g. after onboarding, or later when performance data changes it).
create table if not exists study_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  plan          jsonb not null,   -- structured plan (see studyPlanService.ts for shape)
  generated_at  timestamptz not null default now()
);
create index if not exists study_plans_user_idx on study_plans (user_id, generated_at desc);

alter table student_profiles enable row level security;
alter table study_plans      enable row level security;

-- ====================================================================
-- Phase 2: topic tagging, attempt history, weakness/mistake bank
-- ====================================================================

-- One row per answered practice/drill question. Topic is detected locally (keyword match) at
-- answer time — no question text is stored here, only what subject/topic/exam it belongs to and
-- whether the student got it right. This is what the weakness engine and mistake bank read from.
create table if not exists question_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  exam        text not null,
  subject     text not null,   -- ALOC subject slug, e.g. 'mathematics'
  topic       text not null,   -- locally detected topic, e.g. 'Quadratic Equations', or 'General'
  correct     boolean not null,
  source      text not null default 'practice' check (source in ('practice','drill','mistake_revision')),
  created_at  timestamptz not null default now()
);
create index if not exists question_attempts_user_idx on question_attempts (user_id, subject, topic);
create index if not exists question_attempts_user_time_idx on question_attempts (user_id, created_at desc);

alter table question_attempts enable row level security;

-- ====================================================================
-- Phase 3: XP, streaks, levels, daily mission
-- ====================================================================

-- One row per student. Updated every time they answer a question (see statsService.ts).
create table if not exists student_stats (
  user_id          uuid primary key references users(id) on delete cascade,
  xp               integer not null default 0,
  level            integer not null default 1,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_study_date  date,
  total_questions  integer not null default 0,
  total_correct    integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- One row per student per calendar day (Africa/Lagos), generated the first time they interact
-- that day. No push notifications are sent for this — it's shown when the student asks (MISSION,
-- or the header on MENU), which keeps this feature at zero infrastructure cost.
create table if not exists daily_missions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  mission_date     date not null,
  subject          text not null,   -- ALOC subject slug
  topic            text,            -- locally-detected weak topic, if one was known yet
  target_count     integer not null default 10,
  target_accuracy  integer not null default 80,
  asked_count      integer not null default 0,
  correct_count    integer not null default 0,
  completed        boolean not null default false,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, mission_date)
);
create index if not exists daily_missions_user_idx on daily_missions (user_id, mission_date desc);

alter table student_stats  enable row level security;
alter table daily_missions enable row level security;

-- ====================================================================
-- Phase 4a: multi-provider AI usage tracking + daily quota
-- ====================================================================

-- One row per AI call attempt (not per question — only when AI is actually invoked, which is now
-- gated behind an explicit student request). Used for the daily quota check and the ADMIN AIUSAGE
-- command; never stores the prompt or response text, just what happened.
create table if not exists ai_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  provider       text not null,   -- 'groq' | 'gemini' | 'openrouter' | 'anthropic'
  request_type   text not null,   -- see AIRequestType in aiService.ts
  success        boolean not null,
  fallback_used  boolean not null default false,
  latency_ms     integer,
  error          text,
  created_at     timestamptz not null default now()
);
create index if not exists ai_usage_user_time_idx on ai_usage (user_id, created_at desc);
create index if not exists ai_usage_time_idx on ai_usage (created_at desc);

alter table ai_usage enable row level security;

-- ====================================================================
-- Phase 5: spaced revision + XP log (for weekly reports)
-- ====================================================================

-- Lightweight Leitner-style scheduler, tracked per (user, subject, topic) rather than per question
-- (question text is never stored — see architecture note at the top of this file). A row is only
-- created the first time a topic is answered WRONG; each correct answer on a topic that's due grows
-- the interval (1 -> 3 -> 7 -> 14 days); a wrong answer resets it. 4 consecutive correct = mastered.
create table if not exists topic_reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  subject            text not null,
  topic              text not null,
  interval_days      integer not null default 1,
  consecutive_correct integer not null default 0,
  next_review_date   date not null,
  mastered           boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, subject, topic)
);
create index if not exists topic_reviews_due_idx on topic_reviews (user_id, next_review_date) where not mastered;

-- One row per XP award (correct/incorrect answer, streak milestone, mission completion). Lets the
-- weekly report show "XP earned this week" without recomputing from student_stats' running total.
create table if not exists xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  amount      integer not null,
  reason      text not null,  -- 'correct_answer' | 'wrong_answer' | 'streak_milestone' | 'mission_complete' | ...
  created_at  timestamptz not null default now()
);
create index if not exists xp_events_user_time_idx on xp_events (user_id, created_at desc);

alter table topic_reviews enable row level security;
alter table xp_events     enable row level security;

-- ====================================================================
-- Phase 6: mock exams (timed simulation) + personal records
-- ====================================================================

-- One row per COMPLETED mock exam. Used for the post-exam "previous score" comparison and for
-- personal records (RECORDS command). elapsed_seconds is real wall-clock time the student spent
-- answering (summed per-question), not a fixed timer — see mockExamService.ts.
create table if not exists mock_exams (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  exam             text not null,
  subject          text not null,
  total            integer not null,
  correct          integer not null,
  elapsed_seconds  integer not null,
  created_at       timestamptz not null default now()
);
create index if not exists mock_exams_user_subject_idx on mock_exams (user_id, subject, created_at desc);

alter table mock_exams enable row level security;

-- Widen question_attempts.source to also accept 'mock' (mock-exam questions still feed the
-- weakness engine / mistake bank, same as practice and drill questions do).
DO $$ BEGIN
  ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_source_check;
  ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_source_check
    CHECK (source IN ('practice','drill','mistake_revision','mock'));
END $$;

-- ====================================================================
-- Phase 7: web application — auth (email+password, linked to the same
-- user record WhatsApp already created by phone number)
-- ====================================================================

alter table users add column if not exists email text unique;
alter table users add column if not exists password_hash text;
alter table users add column if not exists reset_code_hash text;
alter table users add column if not exists reset_code_expires timestamptz;

-- ====================================================================
-- Phase 9: switch payments to Bachs.io (was Paystack, was OPay before that)
-- ====================================================================

-- Generic provider-side reference (Bachs's checkout_id) used to match a webhook delivery back to
-- this row. Named generically rather than "bachs_..." since this is now the third payment provider
-- this column has needed to support — a future switch won't need another migration.
alter table transactions add column if not exists provider_reference text;
create index if not exists transactions_provider_reference_idx on transactions (provider_reference);
