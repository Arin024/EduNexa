# PrepMaster AI: WhatsApp Exam Prep Bot

WhatsApp tutor for JAMB, WAEC, NECO and Post-UTME. Past questions come live from the **ALOC API** (nothing is stored locally), an AI tutor explains answers step by step, **Bachs** takes payments, and a **referral engine** drives free growth.

```
WhatsApp user ──► Meta Cloud API ──► /webhooks/whatsapp ──► intentParser
                                          │
              ┌───────────────┬───────────┼─────────────────┬──────────────┐
              ▼               ▼           ▼                 ▼              ▼
           ALOC API      AI providers   Redis (Upstash)   Postgres       Bachs Checkout
        (past questions) (explanations)  free quota +    (Supabase)    ──► /api/payments/bachs-webhook
                                        sessions        users, referrals,
                                                        subscriptions, transactions
```

## Project layout

| File | Purpose |
|---|---|
| `schema.sql` | Tables: `users`, `referrals`, `subscriptions`, `transactions` |
| `src/alocService.ts` | Fetch and normalise past questions (JAMB/WAEC/NECO/Post-UTME) |
| `src/claudeService.ts` | Tutor system prompt; answer explanations and photo/text solving |
| `src/bachsService.ts` | Checkout link creation, webhook signature verification (HMAC-SHA256) |
| `src/referralService.ts` | Referral codes, links, free-reward rules, scorecard text |
| `src/commissionService.ts` | 20% commission ledger, earnings, withdrawals, admin approval |
| `src/profileService.ts` | Onboarding profile (exam, exam date, subjects, weak/strong, study time) |
| `src/studyPlanService.ts` | Templated study-plan generator (no AI cost) and formatting |
| `src/topicService.ts` | Keyword-based topic tagging per subject (free, no AI call) |
| `src/attemptService.ts` | Logs every answered question; weak-topic and mistake-bank queries |
| `src/statsService.ts` | XP, levels, daily streaks (Africa/Lagos calendar day) — pure DB logic |
| `src/missionService.ts` | Daily mission: generation, progress tracking, completion |
| `src/aiService.ts` | Multi-provider AI abstraction: Groq/Gemini/OpenRouter with fallback, Anthropic optional |
| `src/aiUsageService.ts` | Logs every AI call; daily quota check (free vs premium); admin usage stats |
| `src/reviewService.ts` | Spaced revision scheduler (Leitner-style, per topic, no AI cost) |
| `src/reportService.ts` | Weekly performance report from stored data (no AI cost) |
| `src/mockExamService.ts` | Mock exam result storage, previous-score comparison, report formatting |
| `src/recordsService.ts` | Personal records (streak, best mock score, best day, best subject) |
| `src/authService.ts` | Web login: register/login, password reset via WhatsApp (no email provider needed) |
| `src/examEngine.ts` | Encrypted question tokens (answers never sent to the browser) + server-side grading |
| `src/webApi.ts` | REST API for the web app — mounted at `/api`, calls the SAME services WhatsApp uses |
| `public/` | The web app itself — plain HTML/CSS/JS, no build step, served from this same server |
| `public/privacy-policy.html`, `public/terms.html` | Legal pages — plain-language, not lawyer-reviewed |
| `src/adminService.ts` | Admin analytics: users, revenue, engagement, hardest topics — pure SQL |
| `src/whatsappController.ts` | Webhook router: messages, rate limits, referrals, drills |
| `src/accessService.ts` | Users + free-quota/bonus consumption (Redis) |
| `src/subscriptionService.ts` | Grant/check subscriptions |
| `src/intentParser.ts` | Understands "JAMB Physics 2019", "B", "why?", "STATUS"… |
| `src/whatsappClient.ts` | Send text/buttons/images/templates, download media, verify Meta signature |
| `src/config.ts`, `db.ts`, `redis.ts`, `index.ts` | Config, clients, server |

## Business rules implemented

- **5 free questions per rolling 24h** per phone number (Redis key `free:<phone>` with 24h TTL, started on the first question).
- Serving a past question, or solving a typed/photo question, uses 1 question. Explanations of an already-served question are free.
- After the free quota: **referral bonus questions**, then the **payment gate**.
- **Referrals:** each user gets `wa.me/<BOT_NUMBER>?text=START_REF_<CODE>`. When a *new* number messages with that code, the referrer is credited and notified. Every 2nd friend = +5 questions; the 5th friend = free 3-day pass. A person can only be counted once (`referrals.referred_id` is unique).
- **Scorecards:** a 10-question drill (`Drill JAMB Maths`) ends with a forwardable scorecard containing the referral link.
- **Commission:** when a referred friend makes their **first** successful payment, the referrer earns **20%** (Weekly ₦150, Monthly ₦500, 3-Month ₦1,400). One level only, with no commission on friends of friends. Commission is held for **7 days** (refund protection), then becomes withdrawable. Minimum withdrawal ₦1,000. It is credited only after Bachs confirms the payment.
- **Plans:** Weekly ₦750 (7 days), Monthly ₦2,500 (30 days), 3-Month ₦7,000 (90 days). Purchases stack on top of any active time. Paid plans have a fair-use cap of 100 questions per day (`fairUseDaily` in `config.ts`).

## Setup, step by step

### 1. Supabase (PostgreSQL)
1. Create a project at supabase.com.
2. **SQL Editor** → paste and run `schema.sql`.
3. **Project Settings → Database → Connection string** → copy the **pooler** URI → `DATABASE_URL`.

### 2. Upstash (Redis)
1. Create a Redis database at upstash.com (pick a region near Render/Railway).
2. Copy the **TCP** connection string that starts with `rediss://` → `REDIS_URL`.

### 3. ALOC and Anthropic keys
- Register at aloc.com.ng and get an API key → `ALOC_API_KEY`. Check ALOC's terms and rate limits for your expected traffic.
- Create a key at console.anthropic.com → `ANTHROPIC_API_KEY`. `CLAUDE_MODEL` defaults to `claude-sonnet-5`. (`claude-3-5-sonnet` has been retired, so it will fail.)

### 4. Meta WhatsApp Business Cloud API
1. developers.facebook.com → **Create App** → type *Business* → add the **WhatsApp** product.
2. Add and verify your business phone number. Copy the **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`. Set `BOT_NUMBER` to that number in international format without `+` (e.g. `2348012345678`).
3. Create a **System User** in Business Settings, give it the app with full control, and generate a **permanent token** with `whatsapp_business_messaging` and `whatsapp_business_management` → `WHATSAPP_TOKEN`. (The temporary token expires in 24h.)
4. **App settings → Basic → App secret** → `WHATSAPP_APP_SECRET`.
5. Choose any long random string as `WHATSAPP_VERIFY_TOKEN`.
6. After deploying (step 6): WhatsApp → **Configuration → Webhook**: Callback URL `https://YOUR-APP.onrender.com/webhooks/whatsapp`, Verify token = your value, then subscribe to the **messages** field.
7. Complete business verification and display-name approval before public launch.

> **24-hour rule:** free-form messages can only be sent within 24h of the user's last message. Referrer notifications to people who haven't messaged recently will fail unless you create an approved **template** (body with `{{1}}` = friend's name, `{{2}}` = progress text) and set `WHATSAPP_REFERRAL_TEMPLATE` to its name.

### 5. Bachs
1. Create a Bachs account and get your **API key** from the Developer Portal → API Keys. Start with the
   `sk_sandbox_...` key for testing — set it as `BACHS_SECRET_KEY`. The code picks sandbox vs live
   automatically from this prefix (`sk_sandbox_` vs `sk_live_`), so going live later is just swapping
   this one value.
2. In the Developer Portal, add a webhook endpoint pointing at
   `PUBLIC_URL/api/payments/bachs-webhook` (after step 6, once you have your Render URL), subscribed
   to the `collection.succeeded` event.
3. Copy that endpoint's **signing secret** → `BACHS_WEBHOOK_SECRET`. This is a *different* value from
   `BACHS_SECRET_KEY` — one authenticates API calls you make to Bachs, the other authenticates webhook
   calls Bachs makes to you. Mixing them up makes every webhook silently fail verification.
4. Test with Bachs's sandbox first. **Verify against Bachs's current docs on your first sandbox
   payment** (see "Things to verify" below) — this build was checked against their published API
   reference and webhook guide, but a young/fast-moving API's exact field names can still shift.

### 6. Uploading the `public/` folder on mobile (GitHub keeps folders, mobile upload doesn't)
The web app lives in `public/`, with two subfolders (`public/css/`, `public/js/`) — GitHub's mobile
"Upload files" only accepts loose files, it drops folder structure. Do this instead, all in the GitHub
app or mobile browser:
1. **Add file → Create new file.** In the filename box, type the full path **`public/css/style.css`**
   (typing the slashes creates the folder). Paste in that file's content, then commit.
2. Do the same for **`public/js/api.js`** and **`public/js/site.js`** — two more "create new file with a
   full path" commits.
3. Now the `public` folder exists. Open it in the repo (tap into the `public` folder), then use
   **Add file → Upload files** from *inside* that folder — this uploads flat files straight into
   `public/`, which is exactly what you want for every `.html` file (`index.html`, `dashboard.html`,
   `login.html`, and so on). Select and upload all of them together in one commit.
4. Double-check in the repo that `public/css/style.css` and `public/js/api.js` + `site.js` show up
   nested correctly, and every `.html` file sits directly inside `public/` (not inside `css/` or `js/`).
If you have access to a laptop or desktop at any point, dragging the whole `public` folder onto GitHub's
upload page in a desktop browser does this in one step — worth doing there instead if you can.

### 7. Deploy on Render
1. Push this folder to a GitHub repo (`.env` is git-ignored).
2. Render → **New → Web Service** → connect the repo.
   - Runtime: **Node**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Health check path: `/health`
3. Add every variable from `.env.example` under **Environment**. Set `PUBLIC_URL` to your Render URL.
   Generate `JWT_SECRET` the same way as `REFERRAL_SECRET`: `openssl rand -hex 32`.
4. Deploy, then finish the Meta webhook step (4.6). Your web app is now live at your Render URL itself
   (e.g. `https://prepmaster-ai.onrender.com/`) — no separate hosting needed.
5. Use at least the **Starter** (always-on) instance. Free instances sleep and will miss WhatsApp/Bachs
   webhooks, and will make the web app feel slow to the first visitor after a period of inactivity.

**Railway alternative:** New Project → Deploy from GitHub → set the same variables → Settings → generate a domain. Build and start commands are auto-detected from `package.json`.

### 8. Local development
```bash
cp .env.example .env      # fill in values
npm install
npm run dev
ngrok http 3000           # use the https URL as PUBLIC_URL and as the Meta webhook base
```

## Coach Phase 1: onboarding + study plan

New students (and any existing student who hasn't finished setup) are walked through a short WhatsApp
wizard the first time they type anything, or when they send `MENU`: exam type -> exam date (as THEY
tell it to you — the bot never invents an official date) -> subjects -> weakest subject -> strongest
subject -> daily study minutes -> confidence 1-5 -> (JAMB only) target course. At the end it saves a
`student_profiles` row and generates a study plan: a study-intensity phase based on days left (Foundation
-> Learning+Practice -> Intensive -> Mocks -> Revision -> Final Countdown), a subject priority list (weak
first), and a daily time split (20/25/10/5 ratio scaled to their minutes). Students can re-view it any
time with `STUDYPLAN`, or redo setup with `ONBOARD`.

**Cost: none.** The plan is pure template logic — no AI call. This is Phase 1 of the larger "exam coach"
build (XP/streaks, weakness engine, spaced revision, mock exams, tutor mode, admin dashboard are later
phases, each scoped to stay free except where explicitly marked otherwise).

## Coach Phase 2: topic tagging + weakness engine + mistake bank

ALOC doesn't tag questions by topic (only by subject), so `topicService.ts` detects a topic locally
with keyword matching against the question text — e.g. a Mathematics question mentioning "quadratic"
is tagged *Quadratic Equations*. **This costs nothing** (no AI call); it's approximate, not exact, and
falls back to "General <Subject>" when nothing matches. Coverage is included for Mathematics, English,
Physics, Chemistry, Biology, Government, Economics, Geography, Accounting and Commerce — extend the
lists in `topicService.ts` for other subjects.

Every answered practice or drill question is logged (subject, topic, correct/incorrect — not the
question text) to `question_attempts`. From that:
- **`MISTAKES`** shows a mistake bank grouped by subject and topic.
- After a normal drill, if a topic has 3+ attempts and under 50% accuracy, the coach offers a focused
  **mistake revision** session on just that topic (biased selection within the ALOC batch already
  fetched — ALOC can't be queried by topic directly, so this only works when the fetched batch happens
  to contain matching questions; otherwise it falls back to the normal subject mix).
- `MISTAKE_REVISION` (or the button after a drill) picks the single worst topic across all subjects
  and starts a 5-question focused drill on it.

Typed/photographed questions solved directly by Claude are **not** logged to the weakness engine
(there's no reliable subject/topic to attach), so `MISTAKES` only reflects ALOC-sourced practice.

## Coach Phase 5: spaced revision + weekly report

**Cost: none** — both features are database queries, same as Phases 1-3.

- **Spaced revision** (`reviewService.ts`) tracks topics per student in `topic_reviews`, Leitner-style.
  A topic is only added the first time the student gets it wrong — a topic they've never missed is
  never scheduled. From there: correct answer on a due topic -> interval grows (1 -> 3 -> 7 -> 14
  days); wrong answer -> resets to 1 day; 4 consecutive correct spaced answers -> marked *mastered* and
  drops out of rotation. This runs alongside every answered question automatically, no separate mode
  needed. `REVISE` starts a focused session on whichever topic is most overdue; `MENU` shows a
  "N topics due" hint once there's anything waiting.
- This is a different, complementary system to the Phase 2 mistake bank: the mistake bank is a
  historical log ("here's everywhere you've gone wrong"); spaced revision is a scheduler ("here's what
  to review *today* so it sticks"). `MISTAKE_REVISION` (Phase 2) always drills your worst all-time
  accuracy topic on demand; `REVISE` (this phase) only surfaces what's actually due today.
- **Weekly report** (`reportService.ts`) is a rolling 7-day summary — questions attempted, accuracy,
  study days, XP earned (from the new `xp_events` log, one row per XP award), strongest/weakest subject,
  biggest week-over-week improvement, and up to 3 weak topics with a nudge to `REVISE` them. Reachable
  any time via `REPORT`. Like the daily mission, this is **reactive, not pushed** — same zero-
  infrastructure reasoning as Phase 3: an auto-sent weekly summary would need an approved WhatsApp
  template and a scheduled job.

## Coach Phase 6: mock exams + personal records

**Cost: none** — no AI involved; it's ALOC questions plus database bookkeeping, same as every phase
except 4.

- **`MOCK <subject>`** (e.g. `Mock JAMB Physics`) starts a timed-feeling exam: 20
  questions, fetched from ALOC ONCE at the start (not per question — cheaper on ALOC's API and means
  the mock still works even if ALOC is briefly slow mid-exam), shuffled, held in the Redis session for
  the exam's duration. **No feedback between questions** — right/wrong/explanations only show up in
  the final report, which is the point of an exam simulation (see spec section 20). `STOP` ends it early
  and still generates a report from whatever was answered.
- **"Time used" is real elapsed time**, not a countdown timer WhatsApp can't render — it's the sum of
  the gaps between each question being sent and answered. Not lab-precise (a student could leave the
  chat mid-question), but a genuine, honest number rather than a fake average.
- The report compares against the **student's own previous mock** on that subject (score, %, change),
  and awards a flat +100 XP completion bonus (`missionCompletionXp`'s counterpart,
  `config.mockExamCompletionXp`) regardless of score — finishing a mock is the achievement being
  rewarded here, not the score itself.
- **Premium-only**, on purpose: a free student's 5-question daily quota running out mid-exam would be a
  bad experience, and "full mock exams" was already specified as a Premium feature (spec section 22).
  Free students keep unlimited `DRILL`/`PRACTICE`/`REVISE` within their daily quota.
- Every mock question still feeds the weakness engine and spaced-revision scheduler exactly like
  practice and drill questions do (a new `mock` value was added to `question_attempts.source`).
- **`RECORDS`** shows a personal-bests card: longest streak, most questions answered in one day, best
  mock score, and strongest subject overall (5+ attempts, highest accuracy). Deliberately kept to a
  handful of meaningful records rather than a long list, per the "don't overengineer" guidance in the
  original brief.
- **Known gap:** post-mock AI review ("explain my performance" / "what should I study next" from spec
  section 20) isn't wired up yet — `EXPLAIN` needs an active single question in session, which a
  finished mock doesn't leave behind. Worth adding if mocks turn out to be a heavily-used feature.

## Phase 7: web application (same backend, same database, same account)

**Architecture:** one Express server, two front doors. `/webhooks/*` is Meta (WhatsApp messages only —
payment webhooks live under `/api` instead, see Phase 9 below). `/api/*` is the REST API for the web app. `/*` (everything else) serves static files from
`public/` — plain HTML/CSS/vanilla JS, deliberately **no build step, no React, no bundler** — so
there's nothing extra to configure on Render and nothing that can fail to build. Both front doors call
the exact same service files (`profileService.ts`, `statsService.ts`, `attemptService.ts`,
`missionService.ts`, `reviewService.ts`, `subscriptionService.ts`, etc.) and read/write the exact same
Postgres tables. A student who does a drill on WhatsApp will see that streak and those weak topics on
the web dashboard a second later, and vice versa — there is exactly one student record, one XP system,
one weakness engine, not two parallel ones.

**Auth, without an email provider.** Registration asks for the student's WhatsApp phone number, so if
they already have a WhatsApp-created account (from using the bot), the web login is attached to that
*same* row rather than creating a duplicate — one account either way. Password reset sends a 6-digit
code **over WhatsApp**, not email — every account already has a WhatsApp number on file, so this needed
zero new infrastructure and zero cost, instead of signing up for a transactional email service. Sessions
are a JWT in an httpOnly cookie (`JWT_SECRET` — generate with `openssl rand -hex 32`, same pattern as
`REFERRAL_SECRET`).

**Practice/CBT security — this is the part worth understanding, not just copying.** The browser is not
trusted. When the web app fetches practice or mock-exam questions, the correct answer and ALOC's
solution are **encrypted** (AES-256-GCM, not just hidden or signed) into an opaque token sent alongside
each question; the browser never sees the answer in any form until it submits a choice and the server
decrypts the token to grade it. This is stateless (no database row needed to hold a "pending question"),
which keeps the API simple, but it does mean a token is single-purpose and expires in 2 hours. All
scoring, XP, streaks and mission progress happen in `examEngine.ts` / `webApi.ts` on the server — the
client only ever receives a result, never computes one.

**Known architectural debt, stated plainly:** `examEngine.ts` was written fresh for the web API rather
than refactoring WhatsApp's `handleAnswer` in `whatsappController.ts` to share it, to avoid touching
already-working, already-tested WhatsApp code in this pass. Practically, this means the "record one
answered question" logic exists in two places (WhatsApp's inline version, and `examEngine.ts` for web) —
they currently do the same thing, but a future change to one (e.g. new XP rules) needs to be mirrored in
the other until someone does the refactor to make WhatsApp call `examEngine.ts` too. Flagging this now so
it doesn't get forgotten.

**What's real and working:** landing page, register/login/forgot/reset-password, web onboarding (same
study-plan logic as WhatsApp), dashboard (real stats, mission, exam countdown, quick actions), practice
questions (server-graded, immediate feedback), a full CBT mock exam (question navigation, answered/
unanswered grid, running timer, submit confirmation, per-topic results, Premium-gated exactly like the
WhatsApp version), mistake bank + due-for-revision, study plan, weekly report + personal records
("Progress"), a referral dashboard (link, copy/share buttons, invited/converted counts, commission
balance), a Premium page with real Bachs checkout (the same `createBachsCheckout` call and the same webhook
that already activates subscriptions — a web purchase is confirmed exactly the same way a WhatsApp
one is, and as of Phase 9 there's only ONE payment webhook total, not one per channel), and a working AI Tutor chat (quota-gated, same daily limit as WhatsApp's `EXPLAIN`).

**What's deliberately deferred (not silently skipped):**
- **Admin dashboard.** Still the next phase — plan prices currently come from `config.ts` (one source
  of truth already, just not yet live-editable from a UI).
- **Streak Shields** (protecting a streak from breaking once) — a new gamification concept that doesn't
  exist anywhere in the system yet, WhatsApp included. Not invented here rather than faked in the UI.
- **Notifications and a Settings page** are not built.

**Update:** per-question AI explanations on the web are now built (`/api/practice/explain`) — a
"💬 Explain with AI" button appears after answering in `practice.html`, and each question in a
completed mock exam's review list in `mock.html` has its own "Explain" button. Same daily quota as
WhatsApp's `EXPLAIN` and the AI Tutor chat — all three share one counter per student per day.
- **Security is MVP-level, not audited:** no rate-limiting on login/register/forgot-password (a
  determined attacker could brute-force slowly), no CAPTCHA, cookies are `sameSite: 'lax'` which is
  reasonable CSRF protection for same-origin requests but not exhaustive hardening. Fine for launching
  and testing with real but modest traffic; revisit before heavy marketing spend.

## Phase 8: admin dashboard

**Access control, no new roles table:** whichever `users` row has the phone number in `ADMIN_PHONE`
(the same variable already used for WhatsApp withdrawal approvals) can open `/admin.html` and see an
"⚙️ Admin Dashboard" button on their own `/dashboard.html`. Everyone else gets a 403 from every
`/api/admin/*` route. Log in on the web with that same phone number to reach it.

**What it shows**, all pure SQL aggregates (zero AI cost): total/active/DAU/paying/free user counts,
lifetime and 7d/30d revenue, successful vs failed transactions, commission owed vs already paid out,
questions answered (total and today), site-wide average accuracy, average streak and how many students
have a 7+ day streak, a simple 30-day churn estimate (subscriptions that expired and weren't renewed),
exam and subject distribution, the **site-wide hardest topics** (not per-student — useful for spotting
where your content or AI tutor needs the most help), and the same AI-usage-by-provider/by-type numbers
the `AIUSAGE` WhatsApp command shows. Pending withdrawals can be marked Paid/Rejected right from the
page instead of replying to WhatsApp messages.

**What this deliberately doesn't do:** live-edit plan prices, XP values, or subject/topic keyword lists
— those still mean changing `config.ts` / `topicService.ts` and redeploying. Building a full settings-
editor UI for values that change rarely felt like the wrong place to spend effort against the "don't
overengineer" guidance in the original brief; the numbers are already centralized in one file each,
which was the main win worth having.

## Phase 9: payments on Bachs.io

Student premium payments run through Bachs (`bachsService.ts`), the third payment provider this
project has used (OPay, then Paystack, both fully removed rather than left as dead code).

- `createBachsCheckout()` builds a hosted checkout link — wired into both the WhatsApp `upgrade` flow
  and the web Premium page. Bachs prices in a **decimal string at full precision** ("2000.00"), not
  minor units like kobo, which is the one place a naira amount is *not* multiplied by 100.
- The webhook lives at `/api/payments/bachs-webhook`, listens for `collection.succeeded`, and matches
  it back to your own `transactions` row via a `provider_reference` column (Bachs's `checkout_id`) set
  when the checkout was created — not by trusting anything read out of the webhook's `metadata`,
  since Bachs's docs don't guarantee exactly where metadata appears on every event.
- **Two separate secrets, easy to mix up:** `BACHS_SECRET_KEY` authenticates calls *you* make to
  Bachs; a completely different **webhook signing secret** (Developer Portal → Webhooks → your
  endpoint), set as `BACHS_WEBHOOK_SECRET`, authenticates calls *Bachs* makes to *you*. Using one in
  place of the other makes every webhook fail signature verification with no obvious error.
- "Activating premium" reuses the existing `subscriptions` table (the one thing every other part of
  the app already reads for access checks) rather than adding a separate status column — one source
  of truth, not two that can drift apart.
- There is now exactly **one** payment webhook total, instead of one per channel — a WhatsApp- and a
  web-initiated purchase are both confirmed through the same handler.

## Phase 10: privacy policy, terms, sitemap, robots.txt

Added for Meta's app-publishing requirement (it asks for a Privacy Policy URL) and basic SEO hygiene:

- `/privacy-policy.html`, `/terms.html` — plain-language pages describing what's actually collected
  and how payments/referrals work. **Not lawyer-reviewed** — fine for launching and for Meta's review,
  worth a proper legal read before large-scale commercial use, especially re: NDPR in Nigeria.
- `/robots.txt`, `/sitemap.xml` — generated dynamically from `PUBLIC_URL` (in `index.ts`, not static
  files), so they never go stale if the domain changes. Only genuinely public pages are listed for
  indexing; every logged-in page and `/admin.html` are explicitly disallowed.
- Both legal pages are now linked from the shared footer on every page (`site.js`).

## Coach Phase 4: multi-provider AI + daily AI quota (lowest-cost architecture)

**The core idea:** most of what the bot does needs no AI at all — scoring, XP, streaks, levels,
subjects/topics, the mistake bank, the daily mission, subscriptions — and none of that changed in this
phase. What changed is the ~10% that genuinely needs a model: wrong-answer explanations and
typed/photographed custom questions.

**1. AI is no longer called automatically.** Answering a question — right or wrong — now costs nothing.
Wrong answers immediately show ALOC's own stored solution if it has one (free), plus the correct letter,
with a note to type **EXPLAIN** for the full AI walkthrough. Only that explicit request calls a model.
This alone is most of the cost cut described here — probably a bigger saving than the provider switch.

**2. Free-tier-first providers, not just Claude.** `aiService.ts` tries providers in order — by default
**Groq → Gemini → OpenRouter**, all free-tier — and only falls to the next one if a call fails, with a
single attempt per provider (never hammering a rate-limited one). Configure via `AI_PRIMARY_PROVIDER`
and `AI_FALLBACK_PROVIDER` in `.env`; you only need ONE key configured for AI to work, and none are
required to be set (with zero configured, AI features fail gracefully — see point 4). **Anthropic Claude
still exists but is not in the default order** — it's the one provider here that costs money, so it's
opt-in: add `anthropic` to `AI_FALLBACK_PROVIDER` if you ever want it as a paid top-up.

**3. Daily AI quota, separate from the daily question quota.** `FREE_AI_DAILY_LIMIT` (default 5) and
`PREMIUM_AI_DAILY_LIMIT` (default 30) cap **EXPLAIN** calls and custom-question solving per student per
day (Africa/Lagos calendar day) — practice and drills are unaffected even after the AI quota is used up.
Only successful AI calls count against it. Change the defaults in `.env`, or in `config.ts` if you want
to tune the underlying XP/streak numbers too — there's no live admin panel for these yet, so a config
change means a redeploy, which is the one honest gap versus asking for a fully dynamic admin dashboard.

**4. Failure never breaks the bot.** If every configured provider fails, or none is configured, students
see "*Your AI tutor is temporarily unavailable — you can still continue your practice, quizzes and
revision*" instead of an error, and everything else keeps working.

**5. Photo solving is free-tier too, as of this build.** Gemini and Groq's vision model (`GROQ_VISION_MODEL`
— different from `GROQ_MODEL`, which is text-only and can't see images) both handle photographed
questions through the same `callAI` fallback chain as everything else. `ANTHROPIC_API_KEY` is now a
last resort only, tried solely if every free provider fails on that image — it stays fully optional;
leave it blank and a failure just shows the graceful "photo solving isn't available right now" message
instead of trying Anthropic.

**6. Usage tracking, not a dashboard.** Every AI call (success/failure, which provider, whether it was a
fallback, latency — never the prompt or response text) is logged to `ai_usage`. Message the bot from
`ADMIN_PHONE` with **AIUSAGE** (last 24h) or **AIUSAGE 7d** to see totals by provider and by request
type. A visual dashboard is future work; this keeps it at zero extra infrastructure for now.

**Getting free API keys** (all free, no card):
- **Groq** — console.groq.com → API Keys → Create API Key. Fastest signup.
- **Gemini** — aistudio.google.com/apikey.
- **OpenRouter** — openrouter.ai/keys.

All three are OpenAI-style or REST APIs that change model names/endpoints over time — the defaults here
were current as of this build, but check each provider's docs if a call starts failing with a "model not
found" style error, and update `GROQ_MODEL` / `GEMINI_MODEL` / `OPENROUTER_MODEL` accordingly.

## Coach Phase 3: XP, streaks, daily mission

**Cost: none** — everything here is database arithmetic, no AI calls.

- Every answered ALOC question (practice, drill, mistake revision) awards XP: **+10 correct, +3
  incorrect** (so attempting is never worthless). Levels use triangular XP thresholds (`statsService.ts`
  `xpForLevel`), each with a title (Newcomer -> ... -> Exam Master at Level 10+).
- **Streaks** count consecutive Africa/Lagos calendar days with at least one answered question.
  Lagos is a fixed UTC+1 with no daylight saving, so this needs no timezone library. Hitting 3/7/14/30/
  60/100 days awards a one-time bonus. Missing a day resets the streak to 1, but `longest_streak` is
  kept forever.
- **Daily mission**: instead of a push notification (which would need an approved WhatsApp template and
  a cron job — real infrastructure, not free), the mission is generated **reactively**: the first time a
  student interacts on a new day, or types `MISSION`, one is created for a subject the weakness engine
  already flagged (or their onboarding "weakest subject" if there isn't enough data yet). Answering
  questions in that subject — however they got there — counts toward it automatically. Finishing it
  awards a **+50 XP bonus**. `MISSION_START` jumps straight into it.
- `XP` shows the full stats card: streak, level, progress bar to the next level, questions answered,
  accuracy. `MENU` and `STATUS` both show a one-line streak/level/XP header once a student has started.
- **Known trade-off:** because there's no proactive reminder, a student who stops opening the chat won't
  be nudged back (spec section 12's "I haven't seen you for 3 days..."). Adding that later needs an
  approved WhatsApp message template plus a scheduled job (e.g. Render Cron or a free external cron
  hitting a new endpoint) — flagged here as the first genuinely optional infrastructure cost, and worth
  doing once there are paying users to justify it.

## Commission payouts (manual at first)

1. Set `ADMIN_PHONE` to **your own WhatsApp number**, digits only with country code (e.g. `2348012345678`). Message the bot from that number now and then. WhatsApp only lets the bot message you freely within 24h of your last message.
2. A user types `EARNINGS` to see their balance and `WITHDRAW` to cash out, then sends their OPay number or bank details.
3. You get a WhatsApp message with the amount and payout details. Pay them from your OPay/bank app, then reply `PAID WD1A2B3C`. Reply `REJECT WD1A2B3C` if details are wrong (the money returns to their balance). Send `WITHDRAWALS` to list everything pending.
4. **Refunds:** if you refund a payment, cancel its commission: `UPDATE commissions SET status='VOID' WHERE transaction_id = '<id>' AND status='EARNED';`
5. Review the referrer and buyer before paying. Fake second numbers are the main fraud risk, and the 7-day hold plus your manual approval are your protection.

## Test checklist
1. Send `hi` → welcome menu.
2. `JAMB Physics 2019` → a question; reply `B` → ✅/❌ with explanation.
3. Send a photo of a textbook question → step-by-step solution.
4. Ask 6 questions in a row → payment gate on the 6th.
5. From a second phone, open another user's referral link → the referrer gets notified.
6. Tap **Weekly** → Bachs link → pay in sandbox → "Payment confirmed" message and unlimited access.
7. `Drill WAEC Chemistry` → 10 questions → scorecard.
8. Weakness engine: answer the same topic wrong 3+ times (e.g. repeatedly get Quadratic Equations
   questions wrong in Maths) → `MISTAKES` shows it in the mistake bank → `MISTAKE_REVISION` starts a
   focused session on it. Finishing a normal drill with a weak topic should also offer the same button.
9. Gamification: answer a few questions → `XP` shows streak/level/progress. Answer enough of one
   subject to hit the daily mission's target (`MISSION` to see it, `MISSION_START` to jump in) →
   completion message + bonus XP. Do this on 3 different days in a row → streak-milestone bonus message
   on day 3.
10. AI cost control: answer a question wrong → you get ALOC's stored solution immediately, no AI
    call. Type `EXPLAIN` → now it calls AI (check server logs or `AIUSAGE` for which provider handled
    it). Do that more than `FREE_AI_DAILY_LIMIT` times in a day → the quota message appears, but
    practice/drills keep working. Temporarily blank out every AI key in `.env` and redeploy → EXPLAIN
    and custom questions show the "AI tutor temporarily unavailable" message instead of crashing.
11. Spaced revision: get a topic wrong 3 times in one session (or across sessions) → `MENU` should
    show "N topics due for revision" → `REVISE` drills that topic → answer it right 4 times across
    separate revision sessions (spread over the 1/3/7/14-day schedule, or fake it by editing
    `next_review_date` in Supabase to `today` between attempts) → it should stop showing as due.
12. `REPORT` after a few days of mixed practice → sanity-check the numbers against what you actually
    did (questions/accuracy/study days should match `question_attempts`; XP should match `xp_events`).
13. Mock exam: with a Premium subscription active, `Mock JAMB Physics` → answer all questions with no
    per-question feedback → final report with score, time used, and (on a 2nd mock of the same
    subject) a comparison to the first. `STOP` mid-mock → still get a report for what was answered.
    Without a subscription, `MOCK` should show the upgrade prompt instead of starting. `RECORDS` after
    a mock or two → should reflect the best score.
14. Web app: register at `/register.html` with a phone number you've already messaged the WhatsApp
    bot from → your WhatsApp stats/streak should already show up on `/dashboard.html` (same account).
    Complete `/onboarding.html` → study plan appears. `/practice.html` → answer a question → immediate
    feedback + XP, and it should also show up if you check `STATUS` on WhatsApp. `/mock.html` without
    Premium → upgrade prompt; with Premium → full timed CBT flow → results page. `/premium.html` → Bachs
    checkout → after paying, both the web dashboard AND a WhatsApp message should confirm the same
    subscription. `/referrals.html` → link and commission numbers should match `EARNINGS` on WhatsApp.
15. Admin dashboard: log in on the web with the phone number set in `ADMIN_PHONE` → `/dashboard.html`
    should show an Admin button → `/admin.html` should load real numbers (they'll be small/zero on a
    fresh database, which is correct, not broken). Log in with any OTHER account → `/admin.html` should
    refuse access. Approve a withdrawal from the admin page → the student should get the same WhatsApp
    "withdrawal paid" message as when you approve it by replying `PAID <ref>` in chat.
16. Commission: phone B joins via phone A's link and buys Weekly in Bachs sandbox → phone A gets "Commission earned ₦150". `EARNINGS` shows it on hold. To test withdrawal without waiting 7 days, run `UPDATE commissions SET available_at = now();`, then `WITHDRAW` on phone A and `PAID <ref>` from the admin number.

## Things to verify before going live
- **Bachs webhook signature and amount format.** `verifyWebhookSignature` in `bachsService.ts` implements
  the HMAC-SHA256 scheme from Bachs's published webhook guide (`X-Bachs-Signature-V2`, falling back to
  the legacy `X-Bachs-Signature` + `X-Bachs-Timestamp` pair). Confirm it matches on your first sandbox
  payment — if Bachs has changed anything, that one function is the only place to update. Also note
  Bachs prices in a **decimal string at full precision** ("2000.00"), not minor units like kobo — the
  opposite convention from most Nigerian processors — `createBachsCheckout` and `parseCollectionSucceeded`
  are the only two places that conversion happens.
- **Where the webhook looks up the student.** The webhook matches Bachs's `checkout_id` against
  `transactions.provider_reference` (set when the checkout link was created) — not anything read out
  of the webhook's `metadata`, since Bachs's docs don't guarantee exactly where metadata appears on
  every event. `metadata.phone` is still sent and read as a secondary hint for your own logs, but it is
  never the deciding factor for which student gets upgraded.
- **ALOC exam `type` values.** `JAMB→utme`, `WAEC→wassce`, `POST-UTME→post-utme`, `NECO→neco`. Check ALOC's docs; NECO support in particular may differ. Edit `EXAM_TYPE_PARAM` in `alocService.ts`.
- **Money and tax.** Commission payouts are real money you owe. Keep records, talk to an accountant about tax, and mention the commission terms in your bot/website terms.
- **Existing database.** If you already ran an older `schema.sql`, drop the four old tables and run the new file again (only safe before you have real users).
- **Referral abuse.** Anyone can create extra WhatsApp numbers to farm rewards. Consider requiring a referred friend to answer at least one question before crediting, and cap total bonus questions per user.
- **Costs.** Every explanation and photo solve is a Claude API call. Watch your Anthropic usage while free quotas are generous.
- **Privacy.** You store phone numbers and WhatsApp profile names. Publish a privacy policy and honour deletion requests (`DELETE FROM users WHERE phone = '...'` cascades).
