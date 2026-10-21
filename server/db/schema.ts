/**
 * Core Database Schema Definitions for NaijaPrep AI
 * Represents relational / document entities for:
 * - users, student_profiles, admin_users
 * - subjects, topics, questions, question_attempts, mistakes
 * - study_sessions, study_plans, daily_missions, streaks, weekly_reports
 * - achievements, xp_transactions, challenges, mock_exams, exam_attempts
 * - subscriptions, subscription_plans, payments
 * - referrals, referral_clicks, referral_commissions, referral_rewards
 * - ai_usage, ai_conversations, ai_messages
 * - notifications, system_settings
 */

export interface DbUser {
  id: string;
  email: string;
  phone?: string;
  passwordHash: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'student' | 'admin';
  referralCode: string;
  referredBy?: string; // inviter's referralCode or userId
  createdAt: string;
  lastLoginAt: string;
  isPro: boolean;
  proExpiresAt?: string;
  hasCompletedOnboarding?: boolean;
}

export interface DbStudentProfile {
  userId: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  targetExam: 'JAMB' | 'WAEC' | 'NECO';
  examYear: number;
  selectedSubjects: string[];
  targetScore: number;
  dailyStudyHours: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  academicLevel: 'SS1' | 'SS2' | 'SS3' | 'remedial' | 'university_aspirant';
  targetUniversity?: string;
  targetCourse?: string;
  difficultTopics?: string[];
  examDate?: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  bestStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  freezeAvailable: number;
  walletBalanceNgn: number;
  totalEarnedNgn?: number;
  isPro: boolean;
  referralCode: string;
  referralStats?: {
    totalSignups: number;
    totalPayingSubscribers: number;
    totalCommissionEarnedNgn: number;
  };
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DbPasswordResetToken {
  token: string;
  code: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export type QuestionSourceType = 'verified_past_question' | 'original_practice' | 'ai_generated';
export type QuestionStatus = 'active' | 'inactive' | 'draft';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface DbSubject {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  examTypes: ('JAMB' | 'WAEC' | 'NECO')[];
  category?: 'Sciences' | 'Arts' | 'Commercial' | 'General';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DbTopic {
  id: string;
  subjectId: string;
  name: string;
  subtopics?: string[];
  difficulty: QuestionDifficulty;
  frequencyInExam: 'high' | 'medium' | 'low';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DbQuestion {
  id: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjectId: string;
  topicId: string;
  subtopic?: string;
  year?: number;
  questionText: string;
  passage?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: QuestionDifficulty;
  sourceType: QuestionSourceType;
  tags: string[];
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DbQuestionAttempt {
  id: string;
  userId: string;
  studentName?: string;
  questionId: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty: QuestionDifficulty;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  chosenAnswer?: 'A' | 'B' | 'C' | 'D'; // backwards compatibility
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  date: string;
  timestamp: string;
  attemptNumber: number;
  timeSpentSec: number;
  mode: 'practice' | 'cbt' | 'mistake_retry';
}

export interface DbMistake {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty: QuestionDifficulty;
  date: string;
  lastAttempted: string;
  attemptCount: number;
  mistakeCount?: number;
  status: 'unresolved' | 'mastered';
}

export type PerformanceLevel = 'Strong' | 'Developing' | 'Needs Attention';

export interface WeaknessThresholds {
  strongThreshold: number; // default: 80
  developingThreshold: number; // default: 60
}

export type LearningPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface DbStudySession {
  id: string;
  userId: string;
  subjectId: string;
  durationMinutes: number;
  questionsAnswered: number;
  accuracy: number;
  createdAt: string;
}

export interface DbDailyMission {
  id: string;
  userId: string;
  title: string;
  description: string;
  rewardXp: number;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  category: 'practice' | 'cbt' | 'mistake' | 'ai';
  date: string;
}

export interface DbDailyMissionSegment {
  id: string;
  label: string;
  type: 'subject' | 'weak_topic_revision';
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  targetQuestions: number;
  completedQuestions: number;
  correctCount: number;
  isCompleted: boolean;
}

export interface DbDailyStudyMission {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  segments: DbDailyMissionSegment[];
  totalQuestions: number;
  completedQuestions: number;
  totalCorrect: number;
  currentAccuracy: number;
  targetAccuracy: number;
  recommendedTimeMinutes: number;
  rewardXp: number;
  status: 'in_progress' | 'completed';
  isClaimed: boolean;
  completedAt?: string;
  streakAtCompletion?: number;
}

export interface DbWeeklyChallenge {
  id: string;
  title: string;
  description: string;
  category: 'quiz_score' | 'questions_count' | 'study_days' | 'weak_topic_improvement';
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercent: number;
  rewardXp: number;
  badgeReward?: string;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresInDays?: number;
}

export interface DbStreak {
  userId: string;
  count: number;
  lastDate: string;
  freezeCount: number;
}

export interface DbAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category?: 'milestones' | 'streaks' | 'accuracy' | 'mastery' | 'community';
  requirementType:
    | 'questions_count'
    | 'streak_days'
    | 'cbt_score'
    | 'mistakes_mastered'
    | 'referrals_count'
    | 'first_quiz'
    | 'first_mock'
    | 'accuracy_rate'
    | 'weak_topic_improved'
    | 'perfect_quiz'
    | 'study_time_minutes';
  requirementValue: number;
  xpBonus: number;
  badgeTier?: 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite';
}

export interface DbUserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface DbXpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface DbChallenge {
  id: string;
  title: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjectName: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  rewardXp: number;
  badgeName: string;
  endDate: string;
  participantsCount?: number;
}

export interface DbMockExam {
  id: string;
  title: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjectIds: string[];
  durationMinutes: number;
  questionIds: string[];
}

export interface DbCbtSession {
  sessionId: string;
  userId: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjectIds: string[];
  questionIds: string[];
  totalQuestions: number;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  savedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  savedFlags: Record<string, boolean>;
  isSubmitted: boolean;
  resultAttemptId?: string;
  submittedAt?: string;
}

export interface DbExamAttempt {
  id: string;
  userId: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  subjects: string[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeTakenSec: number;
  numberCorrect: number;
  numberWrong: number;
  numberUnanswered: number;
  xpEarned: number;
  answersReview: {
    questionId: string;
    chosenAnswer: 'A' | 'B' | 'C' | 'D' | null;
    isCorrect: boolean;
  }[];
  subjectScores: {
    subjectId: string;
    subjectName: string;
    score: number;
    total: number;
    correct: number;
    wrong: number;
    unanswered: number;
    percentage: number;
  }[];
  topicScores?: {
    topicId: string;
    topicName: string;
    subjectName: string;
    score: number;
    total: number;
    percentage: number;
    status: 'weak' | 'improving' | 'mastered';
  }[];
  studyRecommendations?: string[];
  detailedReview?: {
    questionId: string;
    questionText: string;
    passage?: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    chosenAnswer: 'A' | 'B' | 'C' | 'D' | null;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    explanation: string;
    subjectName: string;
    topicName: string;
    year?: number;
    sourceType?: string;
  }[];
  timestamp: string;
}

export interface DbExamDateConfig {
  id: string; // 'JAMB' | 'WAEC' | 'NECO'
  examType: 'JAMB' | 'WAEC' | 'NECO';
  title: string;
  examDate: string | null; // 'YYYY-MM-DD' or null if pending official announcement
  registrationDeadline: string | null;
  status: 'announced' | 'tentative' | 'pending_announcement';
  isOfficial: boolean;
  announcementBody: string;
  announcedBy: string;
  notes?: string;
  lastUpdated: string;
  updatedBy?: string;
}

export type DbStudyPlanPhase =
  | 'FOUNDATION'
  | 'PRACTICE'
  | 'INTENSIVE_PRACTICE'
  | 'MOCK_EXAMS'
  | 'FINAL_REVISION';

export interface DbStudyPlanPhaseInfo {
  phase: DbStudyPlanPhase;
  title: string;
  shortName: string;
  description: string;
  focus: string;
  recommendedQuestionDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  startDayOffset: number;
  endDayOffset: number;
  isCurrent: boolean;
  isCompleted: boolean;
  completionPercent: number;
  milestoneGoal: string;
}

export interface DbStudyPlanTodayTask {
  id: string;
  date: string;
  dayLabel: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  targetQuestions: number;
  completedQuestions: number;
  recommendedDurationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  isWeakTopicRevision: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  isCompleted: boolean;
}

export interface DbStudyPlanWeekTarget {
  weekNumber: number;
  title: string;
  focusSummary: string;
  targetQuestions: number;
  completedQuestions: number;
  targetStudyMinutes: number;
  completedStudyMinutes: number;
  targetAccuracy: number;
  currentAccuracy: number;
  keyTopicsToMaster: {
    topicId: string;
    topicName: string;
    subjectName: string;
    isWeakTopic: boolean;
    isMastered: boolean;
    accuracy: number;
  }[];
  mockExamsScheduled: number;
  mockExamsCompleted: number;
}

export interface DbStudyPlanTopicItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  frequencyInExam: 'high' | 'medium' | 'low';
  isWeakTopic: boolean;
  accuracyRate: number;
  status: 'unstarted' | 'studying' | 'improving' | 'mastered';
  priority: 'high' | 'medium' | 'low';
  phaseAssigned: DbStudyPlanPhase;
  totalAttempts: number;
}

export interface DbComebackPlan {
  isNeeded: boolean;
  missedDaysCount: number;
  lastActiveDate: string;
  reason: string;
  message: string;
  catchUpStrategy: string;
  adjustedDailyMinutes: number;
  adjustedDailyQuestions: number;
  redistributedDaysCount: number;
  priorityFocusTopics: {
    topicId: string;
    topicName: string;
    subjectName: string;
    reason: string;
  }[];
  isActivated?: boolean;
}

export interface DbPersonalizedStudyPlan {
  id: string;
  userId: string;
  examType: 'JAMB' | 'WAEC' | 'NECO';
  examTitle: string;
  examDate: string | null;
  examDateStatus: 'announced' | 'tentative' | 'pending_announcement';
  isOfficialDate: boolean;
  announcedBy?: string;
  daysUntilExam: number | null;
  countdown: {
    days: number;
    hours: number;
    weeks: number;
    isPassed: boolean;
    formatted: string;
  } | null;
  targetScore: number;
  targetScoreLabel: string;
  dailyStudyHours: number;
  overallProgressPercent: number;
  currentPerformanceSummary: {
    overallAccuracy: number;
    totalQuestionsAnswered: number;
    unresolvedMistakesCount: number;
    weakTopicsCount: number;
    currentStreak: number;
    readinessScore: number;
  };
  currentPhase: DbStudyPlanPhase;
  phases: DbStudyPlanPhaseInfo[];
  todayTask: DbStudyPlanTodayTask;
  weekTarget: DbStudyPlanWeekTarget;
  topicsToStudy: DbStudyPlanTopicItem[];
  items: {
    day: string;
    subjectId: string;
    topicName: string;
    recommendedDurationMinutes: number;
    targetQuestions: number;
    isCompleted: boolean;
    priority: 'high' | 'medium' | 'low';
  }[];
  comebackPlan?: DbComebackPlan;
  lastAdjustedAt: string;
  adaptationReason: string;
}

export interface DbStudyPlan {
  userId: string;
  targetExam: 'JAMB' | 'WAEC' | 'NECO';
  generatedDate: string;
  items: {
    day: string;
    subjectId: string;
    topicName: string;
    recommendedDurationMinutes: number;
    targetQuestions: number;
    isCompleted: boolean;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface DbWeeklyReport {
  id: string;
  userId: string;
  weekEnding: string;
  totalStudyMinutes: number;
  questionsAttempted: number;
  overallAccuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  recommendation: string;
}

export interface DbSubscriptionPlan {
  id: string;
  name: string;
  priceNgn: number;
  durationDays: number;
  tagline: string;
  features: string[];
}

export interface DbSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string;
  paymentId: string;
}

export interface DbPayment {
  id: string;
  userId: string;
  planId: string;
  amountNgn: number;
  reference: string;
  status: 'success' | 'pending' | 'failed' | 'rejected';
  provider: 'bachs' | 'bachs.io' | 'paystack' | 'flutterwave' | 'manual' | 'bank_transfer';
  bank?: string;
  accountNumber?: string;
  senderName?: string;
  narration?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface DbReferralClick {
  id: string;
  referralCode: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DbReferralCommission {
  id: string;
  inviterUserId: string;
  inviteeUserId: string;
  paymentId: string;
  planAmountNgn: number;
  commissionRate: number; // 0.20
  commissionNgn: number; // e.g. 500 for 2,500
  status: 'credited' | 'paid_out';
  createdAt: string;
}

export interface DbAiUsage {
  id: string;
  userId: string;
  action: 'explain_question' | 'socratic_chat' | 'study_advice';
  promptTokens?: number;
  completionTokens?: number;
  timestamp: string;
}

export interface DbAiConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAiMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DbNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'achievement' | 'streak' | 'referral' | 'subscription' | 'exam_tip';
  createdAt: string;
}

export interface DbAdminUser {
  id: string;
  userId: string;
  permissions: string[];
  grantedAt: string;
}

export interface DbSystemSettings {
  announcement?: string;
  examRegistrationNotice?: string;
  jambDate: string;
  waecDate: string;
  necoDate: string;
  referralCommissionPercent: number; // 20
  freeDailyQuestionLimit: number;
}
