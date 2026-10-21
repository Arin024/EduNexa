import {
  User,
  StudentProfile,
  Subject,
  Topic,
  Question,
  DailyMission,
  DailyStudyMission,
  WeeklyChallengeItem,
  Achievement,
  WeeklyStudyPlan,
  WeakTopicAnalysis,
  WeaknessThresholds,
  MistakeItem,
  QuestionAttempt,
  ReferralStats,
  SubscriptionPlan,
  LeaderboardEntry,
  Challenge,
  CbtResult,
  CbtActiveQuestion,
  CbtSessionState,
  OnboardingData,
  StudentGamificationSummary,
  GamificationConfig,
  UserLevelProgress,
  PersonalRecords,
  SubjectMastery,
  AdaptivePracticeSession,
  WhatShouldIStudyResponse,
  PersonalizedStudyPlan,
  ExamDateConfig,
  StudentLearningContext,
  TutorWhyWrongResponse,
  TutorTeachTopicResponse,
} from '../types';

const TOKEN_KEY = 'edunexa_session_token';
const LEGACY_TOKEN_KEY = 'prepmaster_session_token';
const REMEMBERED_KEY = 'edunexa_remembered_credentials';
const LEGACY_REMEMBERED_KEY = 'prepmaster_remembered_credentials';

export interface RememberedLoginDetails {
  email: string;
  rememberMe: boolean;
  savedAt: string;
}

export function getRememberedCredentials(): RememberedLoginDetails | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_KEY) || localStorage.getItem(LEGACY_REMEMBERED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRememberedCredentials(details: RememberedLoginDetails): void {
  try {
    if (details.rememberMe) {
      localStorage.setItem(REMEMBERED_KEY, JSON.stringify(details));
    } else {
      localStorage.removeItem(REMEMBERED_KEY);
      localStorage.removeItem(LEGACY_REMEMBERED_KEY);
    }
  } catch (e) {
    console.error('Failed to save credentials', e);
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to access localStorage', e);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-session-token', token);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data as T;
}

// Client-side cache for instant rendering on slow connections
const memoryCache = new Map<string, { data: any; timestamp: number }>();

async function cachedRequest<T>(endpoint: string, ttlMs = 180_000): Promise<T> {
  const cached = memoryCache.get(endpoint);
  const now = Date.now();
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  try {
    const raw = sessionStorage.getItem(`c_${endpoint}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (now - parsed.timestamp < ttlMs) {
        memoryCache.set(endpoint, parsed);
        return parsed.data as T;
      }
    }
  } catch {
    // ignore
  }

  try {
    const fresh = await request<T>(endpoint);
    memoryCache.set(endpoint, { data: fresh, timestamp: now });
    try {
      sessionStorage.setItem(`c_${endpoint}`, JSON.stringify({ data: fresh, timestamp: now }));
    } catch {
      // ignore
    }
    return fresh;
  } catch (err) {
    // If network fails (poor signal / offline), serve stale cache instead of failing!
    if (cached) {
      return cached.data as T;
    }
    try {
      const raw = sessionStorage.getItem(`c_${endpoint}`);
      if (raw) {
        return JSON.parse(raw).data as T;
      }
    } catch {
      // ignore
    }
    throw err;
  }
}

export const api = {
  // Token management
  getToken(): string | null {
    return getStoredToken();
  },
  setToken(token: string | null): void {
    setStoredToken(token);
  },

  // Auth & Profile
  async getMe(): Promise<{ user: User; profile: StudentProfile; token?: string; requiresOnboarding?: boolean }> {
    return request<{ user: User; profile: StudentProfile; token?: string; requiresOnboarding?: boolean }>('/api/auth/me');
  },

  async login(email: string, password: string): Promise<{ user: User; profile: StudentProfile; token: string; requiresOnboarding?: boolean }> {
    const data = await request<{ user: User; profile: StudentProfile; token: string; requiresOnboarding?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async register(params: {
    fullName: string;
    email: string;
    password?: string;
    phone?: string;
    targetExam?: 'JAMB' | 'WAEC' | 'NECO';
    examYear?: number;
    referralCode?: string;
  }): Promise<{ user: User; profile: StudentProfile; token: string; requiresOnboarding?: boolean }> {
    const data = await request<{ user: User; profile: StudentProfile; token: string; requiresOnboarding?: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; previewCode?: string; token?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(params: { tokenOrCode: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async submitOnboarding(data: OnboardingData): Promise<{ user: User; profile: StudentProfile; message: string }> {
    return request('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async switchRole(role: 'student' | 'admin'): Promise<{ user: User; profile: StudentProfile; token?: string }> {
    const data = await request<{ user: User; profile: StudentProfile; token?: string }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async updateProfile(data: Partial<StudentProfile>): Promise<{ user: User; profile: StudentProfile }> {
    return request<{ user: User; profile: StudentProfile }>('/api/profile/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Subjects & Questions (Cached for fast navigation on slow networks)
  async getSubjects(examType?: string, includeInactive = false): Promise<Subject[]> {
    const params = new URLSearchParams();
    if (examType && examType !== 'all') params.set('examType', examType);
    if (includeInactive) params.set('includeInactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return cachedRequest<Subject[]>(`/api/subjects${query}`, 300_000);
  },

  async getTopics(subjectId?: string): Promise<Topic[]> {
    const query = subjectId && subjectId !== 'all' ? `?subjectId=${subjectId}` : '';
    return cachedRequest<Topic[]>(`/api/topics${query}`, 300_000);
  },

  async getQuestions(params: {
    examType?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
    sourceType?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<Question[]> {
    const query = new URLSearchParams();
    if (params.examType && params.examType !== 'all') query.set('examType', params.examType);
    if (params.subjectId && params.subjectId !== 'all') query.set('subjectId', params.subjectId);
    if (params.topicId && params.topicId !== 'all') query.set('topicId', params.topicId);
    if (params.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);
    if (params.sourceType && params.sourceType !== 'all') query.set('sourceType', params.sourceType);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', params.limit.toString());
    return request<Question[]>(`/api/questions?${query.toString()}`);
  },

  // Practice & Deterministic grading
  async submitAnswer(params: {
    questionId: string;
    chosenAnswer: 'A' | 'B' | 'C' | 'D';
    timeSpentSec: number;
    mode?: 'practice' | 'cbt' | 'mistake_retry';
  }): Promise<{ isCorrect: boolean; xpEarned: number; newTotalXp: number; levelUp: boolean; profile: StudentProfile }> {
    return request<{ isCorrect: boolean; xpEarned: number; newTotalXp: number; levelUp: boolean; profile: StudentProfile }>(
      '/api/practice/submit-answer',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  // CBT Exam
  async startCbtExam(params: {
    examType: string;
    subjectIds: string[];
    questionCount: number;
    durationMinutes?: number;
  }): Promise<{ session: CbtSessionState; questions: CbtActiveQuestion[] }> {
    return request<{ session: CbtSessionState; questions: CbtActiveQuestion[] }>('/api/cbt/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getCbtSession(sessionId: string): Promise<{ session: CbtSessionState; questions: CbtActiveQuestion[] }> {
    return request<{ session: CbtSessionState; questions: CbtActiveQuestion[] }>(`/api/cbt/session/${sessionId}`);
  },

  async saveCbtProgress(params: {
    sessionId: string;
    answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
    flags?: Record<string, boolean>;
  }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/cbt/save-progress', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async submitCbtExam(params: {
    sessionId?: string;
    examType: string;
    answers: { questionId: string; chosenAnswer: 'A' | 'B' | 'C' | 'D' | null; timeSpentSec?: number }[];
    timeTakenSec: number;
  }): Promise<{ result: CbtResult; attempt?: any; profile: StudentProfile }> {
    return request<{ result: CbtResult; attempt?: any; profile: StudentProfile }>('/api/cbt/submit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getCbtAttempts(): Promise<any[]> {
    return request<any[]>('/api/cbt/attempts');
  },

  // Mistakes
  async getMistakes(): Promise<MistakeItem[]> {
    return request<MistakeItem[]>('/api/mistakes');
  },

  async generateMistakePracticeSession(options?: { subjectId?: string; limit?: number }): Promise<{
    totalMistakes: number;
    unresolvedCount: number;
    questions: Question[];
  }> {
    return request<{
      totalMistakes: number;
      unresolvedCount: number;
      questions: Question[];
    }>('/api/mistakes/practice-session', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  // Study Plan
  async getStudyPlan(): Promise<WeeklyStudyPlan> {
    return request<WeeklyStudyPlan>('/api/study-plan');
  },

  async toggleStudyPlanDay(day: string | number): Promise<{ plan: WeeklyStudyPlan; profile: StudentProfile }> {
    return request<{ plan: WeeklyStudyPlan; profile: StudentProfile }>('/api/study-plan/toggle', {
      method: 'POST',
      body: JSON.stringify({ day }),
    });
  },

  // Personalized Study Plan & Dynamic Adaptation Engine
  async getPersonalizedStudyPlan(): Promise<PersonalizedStudyPlan> {
    return request<PersonalizedStudyPlan>('/api/study-plan/personalized');
  },

  async toggleStudyPlanTodayTask(): Promise<{ plan: PersonalizedStudyPlan; completed: boolean; profile?: StudentProfile }> {
    return request<{ plan: PersonalizedStudyPlan; completed: boolean; profile?: StudentProfile }>(
      '/api/study-plan/toggle-today',
      { method: 'POST' }
    );
  },

  async activateComebackPlan(): Promise<{ plan: PersonalizedStudyPlan; profile?: StudentProfile }> {
    return request<{ plan: PersonalizedStudyPlan; profile?: StudentProfile }>(
      '/api/study-plan/activate-comeback',
      { method: 'POST' }
    );
  },

  async dismissComebackPlan(): Promise<{ plan: PersonalizedStudyPlan }> {
    return request<{ plan: PersonalizedStudyPlan }>(
      '/api/study-plan/dismiss-comeback',
      { method: 'POST' }
    );
  },

  async simulateMissedDays(days: number): Promise<{ plan: PersonalizedStudyPlan }> {
    return request<{ plan: PersonalizedStudyPlan }>(
      '/api/study-plan/simulate-missed-days',
      {
        method: 'POST',
        body: JSON.stringify({ days }),
      }
    );
  },

  // Official Exam Dates
  async getOfficialExamDates(): Promise<ExamDateConfig[]> {
    return request<ExamDateConfig[]>('/api/exam-dates');
  },

  async getOfficialExamDate(examType: string): Promise<ExamDateConfig> {
    return request<ExamDateConfig>(`/api/exam-dates/${examType}`);
  },

  async updateOfficialExamDate(examType: string, updates: Partial<ExamDateConfig>): Promise<ExamDateConfig> {
    return request<ExamDateConfig>(`/api/admin/exam-dates/${examType}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Deterministic Weakness Analysis & Attempts
  async getWeakTopics(params?: {
    subjectId?: string;
    strongThreshold?: number;
    developingThreshold?: number;
  }): Promise<WeakTopicAnalysis[]> {
    const searchParams = new URLSearchParams();
    if (params?.subjectId && params.subjectId !== 'all') searchParams.set('subjectId', params.subjectId);
    if (params?.strongThreshold) searchParams.set('strongThreshold', params.strongThreshold.toString());
    if (params?.developingThreshold) searchParams.set('developingThreshold', params.developingThreshold.toString());
    const queryStr = searchParams.toString();
    return request<WeakTopicAnalysis[]>(`/api/progress/weak-topics${queryStr ? `?${queryStr}` : ''}`);
  },

  async getWeaknessThresholds(): Promise<WeaknessThresholds> {
    return request<WeaknessThresholds>('/api/weakness/thresholds');
  },

  async updateWeaknessThresholds(thresholds: Partial<WeaknessThresholds>): Promise<WeaknessThresholds> {
    return request<WeaknessThresholds>('/api/weakness/thresholds', {
      method: 'POST',
      body: JSON.stringify(thresholds),
    });
  },

  async getAttemptsHistory(limit: number = 50): Promise<QuestionAttempt[]> {
    return request<QuestionAttempt[]>(`/api/attempts/history?limit=${limit}`);
  },

  // Adaptive Learning & "What Should I Study?"
  async getAdaptivePracticeSession(params?: {
    subjectId?: string;
    topicId?: string;
    limit?: number;
  }): Promise<AdaptivePracticeSession> {
    const searchParams = new URLSearchParams();
    if (params?.subjectId && params.subjectId !== 'all') searchParams.set('subjectId', params.subjectId);
    if (params?.topicId && params.topicId !== 'all') searchParams.set('topicId', params.topicId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const queryStr = searchParams.toString();
    return request<AdaptivePracticeSession>(`/api/adaptive/practice-session${queryStr ? `?${queryStr}` : ''}`);
  },

  async getStudyRecommendations(): Promise<WhatShouldIStudyResponse> {
    return request<WhatShouldIStudyResponse>('/api/recommendations/what-should-i-study');
  },

  // Gamification
  async getGamificationSummary(): Promise<StudentGamificationSummary> {
    return request<StudentGamificationSummary>('/api/gamification/summary');
  },

  async getGamificationConfig(): Promise<GamificationConfig> {
    return request<GamificationConfig>('/api/gamification/config');
  },

  async updateGamificationConfig(updates: Partial<GamificationConfig>): Promise<GamificationConfig> {
    return request<GamificationConfig>('/api/gamification/config', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  async getLevelProgress(): Promise<UserLevelProgress> {
    return request<UserLevelProgress>('/api/gamification/level-progress');
  },

  async getPersonalRecords(): Promise<PersonalRecords> {
    return request<PersonalRecords>('/api/gamification/personal-records');
  },

  async getSubjectMastery(): Promise<SubjectMastery[]> {
    return request<SubjectMastery[]>('/api/gamification/subject-mastery');
  },

  async recordStudyActivity(
    activityType: 'quiz' | 'cbt_exam' | 'daily_mission' | 'study_session' | 'practice_drill',
    metadata?: any
  ): Promise<{ streakExtended: boolean; currentStreak: number; longestStreak: number; bonusXpAwarded: number; profile: StudentProfile }> {
    return request<{ streakExtended: boolean; currentStreak: number; longestStreak: number; bonusXpAwarded: number; profile: StudentProfile }>(
      '/api/gamification/activity',
      {
        method: 'POST',
        body: JSON.stringify({ activityType, metadata }),
      }
    );
  },

  async claimDailyMission(missionId: string): Promise<{ success: boolean; xpEarned: number; mission: DailyMission; profile: StudentProfile }> {
    return request<{ success: boolean; xpEarned: number; mission: DailyMission; profile: StudentProfile }>(
      '/api/gamification/missions/claim',
      {
        method: 'POST',
        body: JSON.stringify({ missionId }),
      }
    );
  },

  async getDailyMissions(): Promise<DailyMission[]> {
    return request<DailyMission[]>('/api/gamification/missions');
  },

  async getDailyStudyMission(): Promise<DailyStudyMission> {
    return request<DailyStudyMission>('/api/gamification/daily-mission');
  },

  async getDailyMissionHistory(): Promise<DailyStudyMission[]> {
    return request<DailyStudyMission[]>('/api/gamification/daily-mission/history');
  },

  async getDailyMissionQuestions(): Promise<Question[]> {
    return request<Question[]>('/api/gamification/daily-mission/questions');
  },

  async claimDailyStudyMission(missionId: string): Promise<{ success: boolean; xpEarned: number; mission: DailyStudyMission; profile: StudentProfile }> {
    return request<{ success: boolean; xpEarned: number; mission: DailyStudyMission; profile: StudentProfile }>(
      '/api/gamification/daily-mission/claim',
      {
        method: 'POST',
        body: JSON.stringify({ missionId }),
      }
    );
  },

  async getWeeklyChallenges(): Promise<WeeklyChallengeItem[]> {
    return request<WeeklyChallengeItem[]>('/api/gamification/weekly-challenges');
  },

  async claimWeeklyChallenge(challengeId: string): Promise<{ success: boolean; xpEarned: number; challenge: WeeklyChallengeItem; profile: StudentProfile }> {
    return request<{ success: boolean; xpEarned: number; challenge: WeeklyChallengeItem; profile: StudentProfile }>(
      '/api/gamification/weekly-challenges/claim',
      {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
      }
    );
  },

  async getMissions(): Promise<DailyMission[]> {
    return this.getDailyMissions();
  },

  async getAchievements(): Promise<Achievement[]> {
    return request<Achievement[]>('/api/gamification/achievements');
  },

  async getLeaderboard(examType?: string): Promise<LeaderboardEntry[]> {
    const query = examType ? `?targetExam=${examType}` : '';
    return request<LeaderboardEntry[]>(`/api/gamification/leaderboard${query}`);
  },

  async getChallenges(): Promise<Challenge[]> {
    return request<Challenge[]>('/api/gamification/challenges');
  },

  // Referrals
  async getReferralStats(): Promise<ReferralStats> {
    return request<ReferralStats>('/api/referrals/stats');
  },

  async simulateReferral(
    friendName: string = 'Chinyere Eze',
    willPay: boolean = true
  ): Promise<{ message: string; stats: ReferralStats; profile: StudentProfile; commissionNgn: number; friendName: string }> {
    return request<{ message: string; stats: ReferralStats; profile: StudentProfile; commissionNgn: number; friendName: string }>(
      '/api/referrals/simulate-signup',
      {
        method: 'POST',
        body: JSON.stringify({ friendName, willPay }),
      }
    );
  },

  async simulateReferralUpgrade(
    friendName: string = 'Chinyere Eze'
  ): Promise<{ message: string; stats: ReferralStats; profile: StudentProfile; commissionNgn: number; friendName: string }> {
    return this.simulateReferral(friendName, true);
  },

  // Subscriptions
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return request<SubscriptionPlan[]>('/api/subscriptions/plans');
  },

  async upgradePlan(planId: string, amountNgn?: number): Promise<{ success: boolean; user: User; profile: StudentProfile }> {
    return request<{ success: boolean; user: User; profile: StudentProfile }>('/api/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, amountNgn }),
    });
  },

  async upgradeSubscription(planId: string, amountNgn?: number): Promise<{ success: boolean; user: User; profile: StudentProfile }> {
    return this.upgradePlan(planId, amountNgn);
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    return request<any[]>('/api/notifications');
  },

  // AI Tutor (Gemini AI Powered)
  async getAiTutorContext(): Promise<StudentLearningContext> {
    return request<StudentLearningContext>('/api/ai/context');
  },

  async askAiWhyWrong(questionId: string, chosenAnswer: 'A' | 'B' | 'C' | 'D'): Promise<TutorWhyWrongResponse> {
    return request<TutorWhyWrongResponse>('/api/ai/why-wrong', {
      method: 'POST',
      body: JSON.stringify({ questionId, chosenAnswer }),
    });
  },

  async askAiTeachTopic(topicName: string, subjectName?: string): Promise<TutorTeachTopicResponse> {
    return request<TutorTeachTopicResponse>('/api/ai/teach-topic', {
      method: 'POST',
      body: JSON.stringify({ topicName, subjectName }),
    });
  },

  async askAiExplain(questionId: string, chosenAnswer: string | null): Promise<{ explanation: string }> {
    return request<{ explanation: string }>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ questionId, chosenAnswer }),
    });
  },

  async chatWithCoach(messages: { role: string; content: string }[]): Promise<{ reply: string; contextSummary?: any }> {
    return request<{ reply: string; contextSummary?: any }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  },

  async getAiStudyAdvice(): Promise<{ advice: string }> {
    return request<{ advice: string }>('/api/ai/study-advice');
  },

  // Admin
  async getAdminMetrics(): Promise<any> {
    return request<any>('/api/admin/metrics');
  },

  async getAdminStats(): Promise<any> {
    return this.getAdminMetrics();
  },

  async getAdminQuestions(params: {
    examType?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
    sourceType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ questions: Question[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.examType && params.examType !== 'all') query.set('examType', params.examType);
    if (params.subjectId && params.subjectId !== 'all') query.set('subjectId', params.subjectId);
    if (params.topicId && params.topicId !== 'all') query.set('topicId', params.topicId);
    if (params.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);
    if (params.sourceType && params.sourceType !== 'all') query.set('sourceType', params.sourceType);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return request<{ questions: Question[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/admin/questions?${query.toString()}`
    );
  },

  async getAdminQuestion(id: string): Promise<Question> {
    return request<Question>(`/api/admin/questions/${id}`);
  },

  async addAdminQuestion(questionData: any): Promise<Question> {
    return request<Question>('/api/admin/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  },

  async createQuestion(questionData: any): Promise<Question> {
    return this.addAdminQuestion(questionData);
  },

  async updateQuestion(id: string, questionData: any): Promise<Question> {
    return request<Question>(`/api/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  },

  async toggleQuestionStatus(id: string, status?: string): Promise<Question> {
    return request<Question>(`/api/admin/questions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteQuestion(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/questions/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Subjects
  async createSubject(data: any): Promise<Subject> {
    return request<Subject>('/api/admin/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSubject(id: string, data: any): Promise<Subject> {
    return request<Subject>(`/api/admin/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleSubjectActive(id: string): Promise<Subject> {
    return request<Subject>(`/api/admin/subjects/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async deleteSubject(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Topics
  async createTopic(data: any): Promise<Topic> {
    return request<Topic>('/api/admin/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTopic(id: string, data: any): Promise<Topic> {
    return request<Topic>(`/api/admin/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTopic(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/topics/${id}`, {
      method: 'DELETE',
    });
  },

  // Snap & Solve Multimodal Vision
  async getSnapQuota(): Promise<{ dailyLimit: number; usedToday: number; remaining: number; isPremium: boolean }> {
    return request<{ dailyLimit: number; usedToday: number; remaining: number; isPremium: boolean }>('/api/ai/snap-quota');
  },

  async snapAndSolve(payload: {
    imageBase64: string;
    mediaType?: string;
    prompt?: string;
    subject?: string;
  }): Promise<{ solution: string; remaining: number; dailyLimit: number; usedToday: number; isPremium: boolean }> {
    return request<{ solution: string; remaining: number; dailyLimit: number; usedToday: number; isPremium: boolean }>(
      '/api/ai/snap-and-solve',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Real Payments (Live Bachs / Paystack)
  async createRealCheckout(data: {
    planId: string;
    amountNgn: number;
    email?: string;
    phone?: string;
  }): Promise<{ checkoutUrl: string; checkoutId: string; reference: string; provider: string }> {
    return request<{ checkoutUrl: string; checkoutId: string; reference: string; provider: string }>(
      '/api/subscriptions/create-checkout',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async verifyRealPayment(data: {
    reference: string;
    checkoutId?: string;
    planId?: string;
  }): Promise<{ success: boolean; isPro: boolean; user: any; profile: any }> {
    return request<{ success: boolean; isPro: boolean; user: any; profile: any }>(
      '/api/subscriptions/verify-payment',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async processBachsPayment(data: {
    planId: string;
    amountNgn: number;
    reference: string;
    paymentMethod: 'card' | 'transfer' | 'ussd';
    cardDetails?: { last4?: string; brand?: string };
  }): Promise<{ success: boolean; isPro: boolean; user: any; profile: any; payment: any }> {
    return request<{ success: boolean; isPro: boolean; user: any; profile: any; payment: any }>(
      '/api/subscriptions/process-bachs-payment',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getBachsStatus(): Promise<{ configured: boolean; keyMasked: string; apiUrl: string; hasWebhook: boolean }> {
    return request<{ configured: boolean; keyMasked: string; apiUrl: string; hasWebhook: boolean }>(
      '/api/subscriptions/bachs-status'
    );
  },

  async activateByReference(reference: string, planId?: string): Promise<{ success: boolean; isPro: boolean; user: any; profile: any; message: string }> {
    return request<{ success: boolean; isPro: boolean; user: any; profile: any; message: string }>(
      '/api/subscriptions/activate-by-reference',
      {
        method: 'POST',
        body: JSON.stringify({ reference, planId }),
      }
    );
  },

  async getBankTransferDetails(): Promise<{ success: boolean; bank: string; accountNumber: string; accountName: string; instructions: string }> {
    return request<{ success: boolean; bank: string; accountNumber: string; accountName: string; instructions: string }>(
      '/api/subscriptions/bank-transfer-details'
    );
  },

  async processBankTransfer(data: {
    planId: string;
    amountNgn: number;
    senderName?: string;
    narration?: string;
    reference?: string;
  }): Promise<{ success: boolean; isPro: boolean; pending: boolean; payment: any; message: string }> {
    return request<{ success: boolean; isPro: boolean; pending: boolean; payment: any; message: string }>(
      '/api/subscriptions/process-bank-transfer',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getMyBankTransfers(): Promise<{ success: boolean; transfers: any[] }> {
    return request<{ success: boolean; transfers: any[] }>('/api/subscriptions/my-bank-transfers');
  },

  async getAdminPendingTransfers(): Promise<{ success: boolean; pending: any[]; allTransfers: any[] }> {
    return request<{ success: boolean; pending: any[]; allTransfers: any[] }>('/api/admin/subscriptions/pending-transfers');
  },

  async adminConfirmTransfer(paymentId: string): Promise<{ success: boolean; message: string; payment: any; subscription: any }> {
    return request<{ success: boolean; message: string; payment: any; subscription: any }>(
      '/api/admin/subscriptions/confirm-transfer',
      {
        method: 'POST',
        body: JSON.stringify({ paymentId }),
      }
    );
  },

  async adminRejectTransfer(paymentId: string, reason?: string): Promise<{ success: boolean; message: string; payment: any }> {
    return request<{ success: boolean; message: string; payment: any }>(
      '/api/admin/subscriptions/reject-transfer',
      {
        method: 'POST',
        body: JSON.stringify({ paymentId, reason }),
      }
    );
  },
};
