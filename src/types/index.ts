export type ExamType = 'JAMB' | 'WAEC' | 'NECO';
export type PreferredStudyTime = 'morning' | 'afternoon' | 'evening' | 'night';
export type AcademicLevel = 'SS1' | 'SS2' | 'SS3' | 'remedial' | 'university_aspirant';

export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  role: 'student' | 'admin';
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  lastLoginAt?: string;
  isPro: boolean;
  proExpiresAt?: string;
  hasCompletedOnboarding?: boolean;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  targetExam: ExamType;
  examYear: number;
  selectedSubjects: string[];
  targetScore: number; // e.g. 320 for JAMB, 8 (A1s) for WAEC
  dailyStudyHours: number; // e.g. 2.5 hours
  preferredStudyTime: PreferredStudyTime;
  academicLevel: AcademicLevel;
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

export interface OnboardingData {
  targetExam: ExamType;
  examYear: number;
  selectedSubjects: string[];
  targetScore: number;
  targetCourse?: string;
  targetUniversity?: string;
  dailyStudyHours: number;
  preferredStudyTime: PreferredStudyTime;
  difficultTopics: string[];
  academicLevel?: AcademicLevel;
}

export type QuestionSourceType = 'verified_past_question' | 'original_practice' | 'ai_generated';
export type QuestionStatus = 'active' | 'inactive' | 'draft';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  examTypes: ExamType[];
  category?: 'Sciences' | 'Arts' | 'Commercial' | 'General';
  isActive?: boolean;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
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

export interface Question {
  id: string;
  examType: ExamType;
  subjectId: string;
  subjectName?: string;
  topicId: string;
  topicName?: string;
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

export interface QuestionAttempt {
  id: string;
  userId: string;
  studentName?: string;
  questionId: string;
  examType: ExamType;
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

export interface MistakeItem {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  difficulty?: QuestionDifficulty;
  date: string;
  lastAttempted?: string;
  attemptCount: number;
  mistakeCount?: number;
  status: 'unresolved' | 'mastered';
}

export interface DailyMission {
  id: string;
  userId: string;
  title: string;
  description: string;
  rewardXp: number;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  category: 'practice' | 'cbt' | 'mistake' | 'ai';
}

export interface DailyMissionSegment {
  id: string;
  label: string; // e.g. "Mathematics", "Chemistry", "Weak-topic revision: Probability"
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

export interface DailyStudyMission {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  segments: DailyMissionSegment[];
  totalQuestions: number;
  completedQuestions: number;
  totalCorrect: number;
  currentAccuracy: number; // 0 - 100%
  targetAccuracy: number; // e.g. 80%
  recommendedTimeMinutes: number; // e.g. 25
  rewardXp: number; // e.g. 150
  status: 'in_progress' | 'completed';
  isClaimed: boolean;
  completedAt?: string;
  streakAtCompletion?: number;
}

export interface WeeklyChallengeItem {
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

export type AchievementCategory = 'milestones' | 'streaks' | 'accuracy' | 'mastery' | 'community';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
  unlockedAt?: string;
  isUnlocked: boolean;
  category?: AchievementCategory;
  requirementType?: string;
  requirementValue?: number;
  currentProgress?: number;
  progressPercent?: number;
  badgeTier?: BadgeTier;
}

export interface LevelConfig {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
  badgeColor: string;
  tagline: string;
  perks: string[];
}

export interface UserLevelProgress {
  currentLevel: number;
  levelTitle: string;
  tagline: string;
  totalXp: number;
  currentLevelMinXp: number;
  nextLevelXp: number;
  levelXpEarned: number;
  levelXpRequired: number;
  progressPercent: number;
  xpToNextLevel: number;
  badgeColor: string;
}

export interface PersonalRecords {
  highestCbtScore: number;
  highestCbtExamType: ExamType;
  highestCbtPercentage: number;
  bestAccuracySession: number;
  fastestAvgSpeedSec: number;
  longestStreak: number;
  totalQuestionsAnswered: number;
  totalCorrectQuestions: number;
  overallAccuracyRate: number;
  totalStudyMinutes: number;
  mistakesMastered: number;
  referralsCompleted: number;
  cbtExamsCompleted: number;
  lastStudyDate: string;
}

export interface SubjectMastery {
  subjectId: string;
  subjectName: string;
  code: string;
  icon: string;
  totalQuestionsAnswered: number;
  correctCount: number;
  accuracyRate: number;
  topicsMasteredCount: number;
  totalTopicsCount: number;
  masteryPercent: number; // 0 - 100
  status: 'novice' | 'developing' | 'proficient' | 'mastered';
}

export interface GamificationConfig {
  xpPerCorrectAnswer: number;
  xpPerAttempt: number;
  xpPerDailyMission: number;
  xpPerCbtExam: number;
  xpPerMistakeMastered: number;
  xp7DayStreakBonus: number;
  xp30DayStreakBonus: number;
  xpPerReferralSignup: number;
  xpPerReferralSubscription: number;
  xpStudyPlanDayCompleted: number;
  levels: LevelConfig[];
}

export interface StudentGamificationSummary {
  profile: StudentProfile;
  levelProgress: UserLevelProgress;
  personalRecords: PersonalRecords;
  subjectMastery: SubjectMastery[];
  achievements: Achievement[];
  dailyMissions: DailyMission[];
  challenges: Challenge[];
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string;
    isActiveToday: boolean;
    freezeAvailable: number;
    daysActiveThisWeek: string[]; // e.g. ['Mon', 'Tue', 'Wed']
  };
}

export interface ExamDateConfig {
  id: string; // 'JAMB' | 'WAEC' | 'NECO'
  examType: ExamType;
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

export type StudyPlanPhase =
  | 'FOUNDATION'
  | 'PRACTICE'
  | 'INTENSIVE_PRACTICE'
  | 'MOCK_EXAMS'
  | 'FINAL_REVISION';

export interface StudyPlanPhaseInfo {
  phase: StudyPlanPhase;
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

export interface StudyPlanTodayTask {
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

export interface StudyPlanWeekTarget {
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

export interface StudyPlanTopicItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  frequencyInExam: 'high' | 'medium' | 'low';
  isWeakTopic: boolean;
  accuracyRate: number;
  status: 'unstarted' | 'studying' | 'improving' | 'mastered';
  priority: 'high' | 'medium' | 'low';
  phaseAssigned: StudyPlanPhase;
  totalAttempts: number;
}

export interface ComebackPlan {
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

export interface PersonalizedStudyPlan {
  id: string;
  userId: string;
  examType: ExamType;
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
  currentPhase: StudyPlanPhase;
  phases: StudyPlanPhaseInfo[];
  todayTask: StudyPlanTodayTask;
  weekTarget: StudyPlanWeekTarget;
  topicsToStudy: StudyPlanTopicItem[];
  items: StudyPlanItem[];
  comebackPlan?: ComebackPlan;
  lastAdjustedAt: string;
  adaptationReason: string;
}

export interface StudyPlanItem {
  day: string; // e.g., 'Monday', 'Tuesday'
  subjectId: string;
  topicName: string;
  recommendedDurationMinutes: number;
  targetQuestions: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyStudyPlan {
  userId: string;
  targetExam: ExamType;
  generatedDate: string;
  items: StudyPlanItem[];
  weeklyTargetQuestions: number;
  completedQuestionsThisWeek: number;
}

export type PerformanceLevel = 'Strong' | 'Developing' | 'Needs Attention';

export interface WeaknessThresholds {
  strongThreshold: number; // default: 80 (80-100% = Strong)
  developingThreshold: number; // default: 60 (60-79% = Developing, <60% = Needs Attention)
}

export type LearningPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface WeakTopicAnalysis {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  accuracyRate: number; // 0 - 100
  numberAttempted: number;
  numberCorrect: number;
  numberWrong: number;
  performanceLevel: PerformanceLevel;
  learningPriority: LearningPriority;
  priorityScore: number;
  recommendedAction: string;
  frequencyInExam?: 'high' | 'medium' | 'low';
  totalAttempts?: number; // backwards compatibility
  correctAttempts?: number; // backwards compatibility
  status?: 'weak' | 'improving' | 'mastered'; // backwards compatibility
}

export interface CbtSessionConfig {
  examType: ExamType;
  subjects: string[];
  totalQuestions: number;
  durationMinutes: number;
}

export interface CbtActiveQuestion {
  id: string;
  examType: ExamType;
  subjectId: string;
  subjectName?: string;
  topicId: string;
  topicName?: string;
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
  // Note: correctAnswer and explanation are strictly OMITTED from active test questions for security
  difficulty: QuestionDifficulty;
  sourceType: QuestionSourceType;
  tags?: string[];
}

export interface CbtSessionState {
  sessionId: string;
  userId: string;
  examType: ExamType;
  subjectIds: string[];
  totalQuestions: number;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  questions: CbtActiveQuestion[];
  savedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  savedFlags: Record<string, boolean>;
  isSubmitted: boolean;
  resultAttemptId?: string;
}

export interface SubjectScoreBreakdown {
  subjectId: string;
  subjectName: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
}

export interface TopicScoreBreakdown {
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  total: number;
  percentage: number;
  status: 'weak' | 'improving' | 'mastered';
}

export interface CbtQuestionReview {
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
  sourceType?: QuestionSourceType;
}

export interface CbtResult {
  id: string;
  userId: string;
  examType: ExamType;
  totalScore: number;
  maxScore: number;
  percentage: number;
  numberCorrect: number;
  numberWrong: number;
  numberUnanswered: number;
  timeTakenSec: number;
  date: string;
  subjectScores: SubjectScoreBreakdown[];
  topicScores?: TopicScoreBreakdown[];
  studyRecommendations?: string[];
  detailedReview?: CbtQuestionReview[];
  weakTopicsDetected?: string[];
  xpEarned: number;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalClicks: number;
  totalSignups: number;
  totalPayingSubscribers: number;
  totalCommissionEarnedNgn: number;
  walletBalanceNgn: number;
  commissionRate: number; // 20%
  recentReferrals: {
    id: string;
    friendName: string;
    date: string;
    status: 'registered' | 'subscribed';
    commissionNgn: number;
  }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceNgn: number;
  durationDays: number;
  tagline: string;
  features: string[];
  isPopular?: boolean;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  questionContext?: {
    questionId: string;
    examType: ExamType;
    subjectName: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  examType: ExamType;
  subjectName: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  rewardXp: number;
  participantsCount: number;
  badgeName?: string;
  badgeReward?: string;
  endDate: string;
}

export interface AdminStats {
  totalStudents: number;
  activeSubscribers: number;
  totalAttempts: number;
  overallAccuracy: number;
  totalRevenueNgn: number;
  totalReferralPayoutsNgn: number;
  totalQuestions: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  targetExam: ExamType;
  level: number;
  totalXp: number;
  streak: number;
  isCurrentUser?: boolean;
}

// --- ADAPTIVE LEARNING & DETERMINISTIC STUDY RECOMMENDATIONS ---
export type AdaptationMode = 'foundational_revision' | 'maintain_pace' | 'advanced_challenge';

export interface AdaptiveTopicWeight {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  accuracyRate: number;
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  adaptationMode: AdaptationMode;
  allocatedCount: number;
  reason: string;
}

export interface AdaptivePracticeSession {
  questions: Question[];
  subjectId?: string;
  subjectName?: string;
  overallAccuracy: number;
  adaptationSummary: string;
  topicWeights: AdaptiveTopicWeight[];
  foundationalCount: number;
  mediumCount: number;
  advancedCount: number;
}

export interface StudyActivityRecommendation {
  id: string;
  title: string;
  subtitle: string;
  activityType: 'weak_topic_drill' | 'mistake_revision' | 'cbt_mock' | 'foundational_revision' | 'advanced_challenge';
  urgency: 'critical' | 'high' | 'medium' | 'maintenance';
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  targetDifficulty: 'easy' | 'medium' | 'hard';
  recommendedDurationMinutes: number;
  questionCount: number;
  // The 5 Deterministic Pillars:
  reasons: {
    weakTopicFactor: string;
    recentMistakesFactor: string;
    recentPerformanceFactor: string;
    upcomingExamFactor: string;
    studyHistoryFactor: string;
  };
  keyStat: string;
  actionLabel: string;
}

export interface WhatShouldIStudyResponse {
  primaryRecommendation: StudyActivityRecommendation;
  secondaryRecommendations: StudyActivityRecommendation[];
  diagnosticSnapshot: {
    weakestTopic: { name: string; accuracy: number; subject: string; topicId: string };
    unresolvedMistakesCount: number;
    recentAccuracy: number;
    targetExam: ExamType;
    daysUntilExam: number;
    daysSinceLastActive: number;
    currentStreak: number;
    neglectedSubject?: { id: string; name: string; daysSinceStudied: number };
    strongestSubject?: { id: string; name: string; accuracy: number };
  };
  explanation: string;
}

export interface StudentLearningContext {
  targetExam: 'JAMB' | 'WAEC' | 'NECO';
  targetScore: number;
  subjects: string[];
  weakTopics: string[];
  recentMistakes: {
    subject: string;
    topic: string;
    questionSnippet: string;
    studentChose: string;
    correctOption: string;
  }[];
  currentLevel: number;
  levelTitle: string;
  recentPerformance: {
    overallAccuracy: number;
    recentAccuracy: number;
    studyStreak: number;
    questionsAnswered: number;
  };
}

export interface TutorWhyWrongResponse {
  diagnosis: string;
  questionId: string;
  chosenAnswer: string;
}

export interface TutorTeachTopicResponse {
  lesson: string;
  topicName: string;
  subjectName?: string;
}

