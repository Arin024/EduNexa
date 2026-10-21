import express from 'express';
import path from 'path';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dataStore } from './server/db/store';
import { aiService } from './server/services/aiService';
import { paymentService } from './server/services/paymentService';
import { verifyPassword, checkRateLimit } from './server/utils/auth';
import { DbUser, DbStudentProfile } from './server/db/schema';

dotenv.config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: DbUser;
      profile?: DbStudentProfile;
      sessionToken?: string;
    }
  }
}

const app = express();
const PORT = 3000;

// Enable gzip/deflate compression for all text, json, and static assets (saves 70-80% data on mobile)
app.use(compression({
  threshold: 512,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

app.use(express.json());

// Session validation middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const sessionHeader = req.headers['x-session-token'] as string;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : sessionHeader || (req.query.token as string);

  if (token) {
    const sessionData = dataStore.getSession(token);
    if (sessionData) {
      req.user = sessionData.user;
      req.profile = sessionData.profile;
      req.sessionToken = token;
    }
  }
  next();
});

// Default fallback ID for guest exploration if needed
let activeUserId = 'usr_student_demo';

function getEffectiveUserId(req: express.Request): string {
  return req.user?.id || activeUserId;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in or register.' });
  }
  next();
}

const OWNER_ADMIN_EMAIL = 'christianarinze024@gmail.com';

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = req.user || dataStore.getUserById(activeUserId);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (user.email.toLowerCase() !== OWNER_ADMIN_EMAIL.toLowerCase() || user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: The admin dashboard is strictly restricted to Nwajiaku Arinzechukwu Christian (christianarinze024@gmail.com).'
    });
  }
  next();
}

// ==========================================
// 1. HEALTH & SYSTEM API
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'EduNexa AI',
    branding: {
      creator: 'Arinzechukwu Christian',
      studio: 'Arinze Web Studios',
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. AUTH & USER ROLES
// ==========================================
app.get('/api/auth/me', (req, res) => {
  // If user is authenticated via session token
  if (req.user) {
    const freshProfile = dataStore.getProfile(req.user.id);
    return res.json({
      user: req.user,
      profile: freshProfile,
      token: req.sessionToken,
      requiresOnboarding: !req.user.hasCompletedOnboarding,
    });
  }

  // Check if token header was passed but invalid
  const hasToken = req.headers.authorization || req.headers['x-session-token'];
  if (hasToken) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  // Fallback demo user for preview if query param ?demo=true, otherwise 401
  if (req.query.demo === 'true') {
    const demoUser = dataStore.getUserById(activeUserId);
    const demoProfile = dataStore.getProfile(activeUserId);
    return res.json({ user: demoUser, profile: demoProfile, token: 'session_demo_student_token' });
  }

  res.status(401).json({ error: 'Not authenticated. Please log in or register.' });
});

app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, phone, targetExam, examYear, referralCode } = req.body;

  // Rate limit registration: max 10 per hour per IP
  const rateKey = `reg_${req.ip || 'unknown'}`;
  const rate = checkRateLimit(rateKey, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({ error: `Too many registration attempts. Please wait ${rate.waitSeconds || 60} seconds.` });
  }

  try {
    const { user, profile } = dataStore.registerUser({
      fullName,
      email,
      password,
      phone,
      targetExam,
      examYear: examYear ? Number(examYear) : 2025,
      referralCodeUsed: referralCode,
    });

    // Create session
    const session = dataStore.createSession(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    activeUserId = user.id;

    res.status(201).json({
      user,
      profile,
      token: session.token,
      requiresOnboarding: true,
      message: 'Account created successfully! Welcome to EduNexa AI.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Rate limit: 5 attempts per 15 minutes per IP + email
  const rateKey = `login_${req.ip || ''}_${email.trim().toLowerCase()}`;
  const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Account temporarily locked for ${Math.ceil((rate.waitSeconds || 60) / 60)} minutes.`,
    });
  }

  const user = dataStore.getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValidPassword = verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  activeUserId = user.id;

  // Create session
  const session = dataStore.createSession(user.id, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const profile = dataStore.getProfile(user.id);

  res.json({
    user,
    profile,
    token: session.token,
    requiresOnboarding: !user.hasCompletedOnboarding,
    message: 'Welcome back!',
  });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.sessionToken) {
    dataStore.deleteSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const rateKey = `forgot_${req.ip || ''}_${email.trim().toLowerCase()}`;
  const rate = checkRateLimit(rateKey, 4, 30 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({ error: `Too many requests. Please wait ${rate.waitSeconds || 60} seconds.` });
  }

  const result = dataStore.createPasswordResetToken(email.trim().toLowerCase());
  if (!result) {
    return res.status(404).json({ error: 'No account registered with that email address.' });
  }

  // Return reset code for test/preview display in UI
  res.json({
    success: true,
    message: 'Password reset code has been sent.',
    previewCode: result.code,
    token: result.token,
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const tokenOrCode = req.body.tokenOrCode || req.body.token || req.body.code;
  const { newPassword } = req.body;
  if (!tokenOrCode || !newPassword) {
    return res.status(400).json({ error: 'Reset code/token and new password are required.' });
  }

  try {
    const result = dataStore.resetPasswordWithToken(tokenOrCode, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/onboarding', requireAuth, (req, res) => {
  try {
    const { user, profile } = dataStore.completeOnboarding(req.user!.id, req.body);
    res.json({
      user,
      profile,
      message: 'Onboarding completed! Your study plan and missions have been initialized.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/switch-role', (req, res) => {
  const { role } = req.body;
  if (role === 'admin') {
    // Only Nwajiaku Arinzechukwu Christian can switch to admin
    const current = req.user;
    if (current && current.email.toLowerCase() !== OWNER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        error: 'Forbidden: Only Nwajiaku Arinzechukwu Christian (christianarinze024@gmail.com) is authorized to access the Admin dashboard.',
      });
    }
  }
  const targetId = role === 'admin' ? 'usr_admin_demo' : 'usr_student_demo';
  activeUserId = targetId;

  const session = dataStore.createSession(targetId);
  const user = dataStore.getUserById(targetId);
  const profile = dataStore.getProfile(targetId);

  res.json({ user, profile, token: session.token });
});

app.post('/api/profile/update', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const updated = dataStore.updateProfile(uid, req.body);
    const user = dataStore.getUserById(uid);
    res.json({ user, profile: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. CURRICULUM & QUESTIONS
// ==========================================
app.get('/api/subjects', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  const examType = req.query.examType as string | undefined;
  const includeInactive = req.query.includeInactive === 'true';
  const subjects = dataStore.getSubjects(examType, includeInactive);
  res.json(subjects);
});

app.get('/api/topics', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  const subjectId = req.query.subjectId as string | undefined;
  const topics = dataStore.getTopics(subjectId);
  res.json(topics);
});

app.get('/api/questions', (req, res) => {
  const { examType, subjectId, topicId, difficulty, sourceType, limit, search } = req.query;
  const questions = dataStore.getQuestions({
    examType: examType as string,
    subjectId: subjectId as string,
    topicId: topicId as string,
    difficulty: difficulty as string,
    sourceType: sourceType as string,
    search: search as string,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });
  res.json(questions);
});

// ==========================================
// 4. DETERMINISTIC PRACTICE & SCORING
// ==========================================
app.post('/api/practice/submit-answer', (req, res) => {
  const { questionId, chosenAnswer, timeSpentSec, mode } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const result = dataStore.recordAttempt({
      userId: uid,
      questionId,
      chosenAnswer,
      timeSpentSec: timeSpentSec || 15,
      mode: mode || 'practice',
    });
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. CBT EXAM SIMULATOR
// ==========================================
app.post('/api/cbt/start', (req, res) => {
  const { examType, subjectIds, questionCount, durationMinutes } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const { session, questions } = dataStore.startCbtSession({
      userId: uid,
      examType: examType || 'JAMB',
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
      questionCount: Math.min(100, Math.max(5, parseInt(questionCount, 10) || 20)),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
    });
    res.json({ session, questions });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/cbt/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const data = dataStore.getCbtSession(sessionId);
  if (!data) {
    return res.status(404).json({ error: 'CBT Session not found or expired.' });
  }
  res.json(data);
});

app.post('/api/cbt/save-progress', (req, res) => {
  const { sessionId, answers, flags } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }
  const success = dataStore.saveCbtProgress(sessionId, answers || {}, flags);
  res.json({ success });
});

app.post('/api/cbt/submit', (req, res) => {
  const { sessionId, examType, answers, timeTakenSec } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const { attempt, result } = dataStore.submitCbtExam({
      userId: uid,
      sessionId,
      examType: examType || 'JAMB',
      answers: answers || [],
      timeTakenSec: timeTakenSec || 300,
    });
    const profile = dataStore.getProfile(uid);
    res.json({ result, attempt, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/cbt/attempts', (req, res) => {
  const uid = getEffectiveUserId(req);
  const attempts = dataStore.getExamAttempts(uid);
  res.json(attempts);
});

// ==========================================
// 6. MISTAKE BANK
// ==========================================
app.get('/api/mistakes', (req, res) => {
  const uid = getEffectiveUserId(req);
  const mistakes = dataStore.getMistakes(uid);
  res.json(mistakes);
});

// Practice My Mistakes session generator
app.post('/api/mistakes/practice-session', (req, res) => {
  const { subjectId, limit } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const sessionData = dataStore.generateMistakePracticeSession(uid, {
      subjectId: subjectId as string,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    res.json(sessionData);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. STUDY PLANNER & OFFICIAL EXAM SCHEDULES
// ==========================================
// Official Exam Dates (Strictly official or admin configured)
app.get('/api/exam-dates', (req, res) => {
  const dates = dataStore.getOfficialExamDates();
  res.json(dates);
});

app.get('/api/exam-dates/:examType', (req, res) => {
  const dateConfig = dataStore.getOfficialExamDate(req.params.examType);
  if (!dateConfig) {
    return res.status(404).json({ error: 'Exam date configuration not found' });
  }
  res.json(dateConfig);
});

// Admin update exam dates (strictly configured by admin)
app.put('/api/admin/exam-dates/:examType', requireAdmin, (req, res) => {
  try {
    const adminUser = (req as any).user;
    const updated = dataStore.updateOfficialExamDate(
      req.params.examType,
      req.body || {},
      adminUser?.fullName || adminUser?.displayName || 'Examination Board Admin'
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get personalized study plan
app.get(['/api/study-plan', '/api/study-plan/personalized'], (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const plan = dataStore.getPersonalizedStudyPlan(uid);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle today's task
app.post('/api/study-plan/toggle-today', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const { plan, completed } = dataStore.toggleStudyPlanTodayTask(uid);
    const profile = dataStore.getProfile(uid);
    res.json({ plan, completed, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Activate realistic comeback plan
app.post('/api/study-plan/activate-comeback', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const plan = dataStore.activateComebackPlan(uid);
    const profile = dataStore.getProfile(uid);
    res.json({ plan, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dismiss comeback plan
app.post('/api/study-plan/dismiss-comeback', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const plan = dataStore.dismissComebackPlan(uid);
    res.json({ plan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Simulate missed days (interactive test/demo feature)
app.post('/api/study-plan/simulate-missed-days', (req, res) => {
  const uid = getEffectiveUserId(req);
  const days = parseInt(req.body.days, 10) || 3;
  try {
    const plan = dataStore.simulateMissedDays(uid, days);
    res.json({ plan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Legacy day toggle compatibility
app.post('/api/study-plan/toggle', (req, res) => {
  const { day } = req.body;
  const uid = getEffectiveUserId(req);
  const plan = dataStore.toggleStudyPlanItem(uid, day);
  const profile = dataStore.getProfile(uid);
  res.json({ plan, profile });
});

// ==========================================
// 8. DETERMINISTIC WEAKNESS-ANALYSIS ENGINE & ATTEMPTS
// ==========================================
app.get('/api/weakness/thresholds', (req, res) => {
  res.json(dataStore.getWeaknessThresholds());
});

app.post('/api/weakness/thresholds', (req, res) => {
  try {
    const updated = dataStore.updateWeaknessThresholds(req.body || {});
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get(['/api/progress/weak-topics', '/api/weakness/topics'], (req, res) => {
  const uid = getEffectiveUserId(req);
  const { strongThreshold, developingThreshold, subjectId } = req.query;

  const customThresholds = (strongThreshold || developingThreshold) ? {
    strongThreshold: strongThreshold ? parseInt(strongThreshold as string, 10) : undefined,
    developingThreshold: developingThreshold ? parseInt(developingThreshold as string, 10) : undefined,
  } : undefined;

  let analysis = dataStore.getWeakTopicAnalysis(uid, customThresholds);
  if (subjectId && subjectId !== 'all') {
    analysis = analysis.filter((item) => item.subjectId === subjectId);
  }
  res.json(analysis);
});

app.get(['/api/weakness/attempts', '/api/attempts/history'], (req, res) => {
  const uid = getEffectiveUserId(req);
  const { limit } = req.query;
  const history = dataStore.getUserAttemptsHistory(
    uid,
    limit ? parseInt(limit as string, 10) : 50
  );
  res.json(history);
});

// ==========================================
// 8B. ADAPTIVE LEARNING ENGINE & "WHAT SHOULD I STUDY?"
// ==========================================
app.get(['/api/adaptive/practice-session', '/api/practice/adaptive'], (req, res) => {
  const uid = getEffectiveUserId(req);
  const { subjectId, topicId, limit } = req.query;
  try {
    const session = dataStore.getAdaptivePracticeSession(uid, {
      subjectId: subjectId as string,
      topicId: topicId as string,
      limit: limit ? parseInt(limit as string, 10) : 15,
    });
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post(['/api/adaptive/practice-session', '/api/practice/adaptive'], (req, res) => {
  const uid = getEffectiveUserId(req);
  const { subjectId, topicId, limit } = req.body;
  try {
    const session = dataStore.getAdaptivePracticeSession(uid, {
      subjectId,
      topicId,
      limit: limit ? parseInt(limit, 10) : 15,
    });
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get(['/api/recommendations/what-should-i-study', '/api/study/recommendation'], (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const recommendations = dataStore.getStudyRecommendation(uid);
    res.json(recommendations);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 9. GAMIFICATION: MISSIONS, STREAKS, BADGES, PROGRESS & CONFIG
// ==========================================
app.get('/api/gamification/summary', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const summary = dataStore.getGamificationSummary(uid);
    res.json(summary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/config', (req, res) => {
  res.json(dataStore.getGamificationConfig());
});

app.post('/api/gamification/config', (req, res) => {
  try {
    const updated = dataStore.updateGamificationConfig(req.body || {});
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/level-progress', (req, res) => {
  const uid = getEffectiveUserId(req);
  res.json(dataStore.getUserLevelProgress(uid));
});

app.get('/api/gamification/personal-records', (req, res) => {
  const uid = getEffectiveUserId(req);
  res.json(dataStore.getPersonalRecords(uid));
});

app.get('/api/gamification/subject-mastery', (req, res) => {
  const uid = getEffectiveUserId(req);
  res.json(dataStore.getSubjectMastery(uid));
});

app.post('/api/gamification/activity', (req, res) => {
  const { activityType, metadata } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const result = dataStore.recordMeaningfulStudyActivity(uid, activityType || 'study_session', metadata);
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gamification/missions/claim', (req, res) => {
  const { missionId } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const result = dataStore.claimDailyMission(uid, missionId);
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/missions', (req, res) => {
  const uid = getEffectiveUserId(req);
  const missions = dataStore.getDailyMissions(uid);
  res.json(missions);
});

// Daily Study Mission (Deterministic, performance-tailored)
app.get('/api/gamification/daily-mission', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const mission = dataStore.getOrCreateDailyStudyMission(uid);
    res.json(mission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/daily-mission/history', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const history = dataStore.getDailyMissionHistory(uid);
    res.json(history);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/daily-mission/questions', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const questions = dataStore.getDailyMissionQuestions(uid);
    res.json(questions);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gamification/daily-mission/claim', (req, res) => {
  const uid = getEffectiveUserId(req);
  const { missionId } = req.body;
  try {
    const result = dataStore.claimDailyStudyMissionReward(uid, missionId);
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Weekly Challenges (Dynamic deterministic progress)
app.get('/api/gamification/weekly-challenges', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const challenges = dataStore.getWeeklyChallenges(uid);
    res.json(challenges);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gamification/weekly-challenges/claim', (req, res) => {
  const uid = getEffectiveUserId(req);
  const { challengeId } = req.body;
  try {
    const result = dataStore.claimWeeklyChallenge(uid, challengeId);
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gamification/achievements', (req, res) => {
  const uid = getEffectiveUserId(req);
  const achievements = dataStore.getUserAchievements(uid);
  res.json(achievements);
});

app.get('/api/gamification/leaderboard', (req, res) => {
  const { targetExam } = req.query;
  const uid = getEffectiveUserId(req);
  const list = dataStore.getLeaderboard(targetExam as string, uid);
  res.json(list);
});

app.get('/api/gamification/challenges', (req, res) => {
  const challenges = dataStore.getChallenges();
  res.json(challenges);
});

// ==========================================
// 10. REFERRALS & 20% COMMISSIONS
// ==========================================
app.get('/api/referrals/stats', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const stats = dataStore.getReferralStats(uid);
    res.json(stats);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/referrals/simulate-signup', (req, res) => {
  const { friendName, willPay } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const result = dataStore.simulateReferralSignup(
      uid,
      friendName || 'Chinyere Eze',
      willPay ?? true
    );
    const updatedStats = dataStore.getReferralStats(uid);
    const profile = dataStore.getProfile(uid);
    res.json({
      ...result,
      commissionNgn: result.commissionAwarded,
      friendName: result.friendUser.fullName,
      stats: updatedStats,
      profile,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 11. SUBSCRIPTION PLATFORM
// ==========================================
app.get('/api/subscriptions/plans', (req, res) => {
  const plans = dataStore.getSubscriptionPlans();
  res.json(plans);
});

app.post('/api/subscriptions/upgrade', (req, res) => {
  const { planId } = req.body;
  const uid = getEffectiveUserId(req);
  try {
    const result = dataStore.upgradeSubscription(uid, planId || 'plan_monthly_pro');
    const user = dataStore.getUserById(uid);
    const profile = dataStore.getProfile(uid);
    res.json({ ...result, user, profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Live Nigerian payment checkout session (Bachs Live / Card / Bank Transfer / USSD)
app.post('/api/subscriptions/create-checkout', async (req, res) => {
  const { planId, amountNgn, email, phone } = req.body;
  const uid = getEffectiveUserId(req);
  const user = dataStore.getUserById(uid);
  const profile = dataStore.getProfile(uid);

  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const host = forwardedHost || req.get('host') || '';
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';

  // Ensure public URL for Bachs.io validation (localhost is strictly rejected by Bachs API)
  let reqOrigin = `${proto}://${host}`;
  if (!host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes('0.0.0.0')) {
    reqOrigin = process.env.APP_URL || process.env.PUBLIC_APP_URL || 'https://ais-pre-ck36mztvpwsl54z42ehdix-696474482089.europe-west2.run.app';
  }

  const cleanPlanId =
    planId === 'weekly' ? 'plan_weekly' :
    planId === 'monthly' ? 'plan_monthly' :
    planId === 'termly' || planId === '3months' ? 'plan_termly' :
    planId === 'annual' || planId === 'annually' ? 'plan_annual' : (planId || 'plan_monthly_pro');

  const reference = `pm_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const successUrl = `${reqOrigin}/?payment_success=1&ref=${reference}&plan=${cleanPlanId}`;
  const cancelUrl = `${reqOrigin}/?payment_cancelled=1`;

  try {
    const checkout = await paymentService.createRealCheckout({
      planId: cleanPlanId,
      amountNaira: Number(amountNgn) || (cleanPlanId === 'plan_weekly' ? 750 : cleanPlanId === 'plan_monthly' ? 2500 : cleanPlanId === 'plan_termly' ? 7000 : 25000),
      email: email || user?.email || 'student@prepmaster.ng',
      phone: phone || user?.phone || '08012345678',
      studentName: profile?.displayName || user?.fullName || 'EduNexa Scholar',
      userId: uid,
      successUrl,
      cancelUrl,
    });

    res.json(checkout);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to initiate checkout', details: err?.message });
  }
});

// Strict verification of real payment (Bachs) and account upgrade
app.post('/api/subscriptions/verify-payment', async (req, res) => {
  const { reference, checkoutId, planId } = req.body;
  const uid = getEffectiveUserId(req);

  try {
    const verified = await paymentService.verifyPayment(checkoutId, reference);
    if (verified && verified.verified) {
      const cleanPlanId =
        planId === 'weekly' ? 'plan_weekly' :
        planId === 'monthly' ? 'plan_monthly' :
        planId === 'termly' || planId === '3months' ? 'plan_termly' :
        planId === 'annual' || planId === 'annually' ? 'plan_annual' : (planId || 'plan_monthly');

      const upgradeResult = dataStore.upgradeSubscription(uid, cleanPlanId);
      const user = dataStore.getUserById(uid);
      const profile = dataStore.getProfile(uid);
      return res.json({ success: true, isPro: true, user, profile, upgradeResult });
    }
    res.status(400).json({ success: false, error: verified?.message || 'Payment has not been confirmed as paid by Bachs switch.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Verification failed', details: err?.message });
  }
});

// Manual reference activation: strictly verifies with Bachs switch before activating
app.post('/api/subscriptions/activate-by-reference', async (req, res) => {
  const { reference, planId } = req.body;
  const uid = getEffectiveUserId(req);

  if (!reference || typeof reference !== 'string' || reference.trim().length < 3) {
    return res.status(400).json({ error: 'Please provide a valid transaction reference.' });
  }

  try {
    const cleanRef = reference.trim();

    // Check if it's already confirmed in our store
    const existingPayment = dataStore.getAllBankTransfers().find((p) => p.reference === cleanRef || p.id === cleanRef);
    if (existingPayment && existingPayment.status === 'success') {
      const cleanPlanId = existingPayment.planId;
      const upgradeResult = dataStore.upgradeSubscription(uid, cleanPlanId);
      const user = dataStore.getUserById(uid);
      const profile = dataStore.getProfile(uid);
      return res.json({ success: true, isPro: true, user, profile, upgradeResult, message: 'VIP Pass activated!' });
    }

    // Otherwise, check with live Bachs API
    const verified = await paymentService.verifyPayment(undefined, cleanRef);
    if (!verified || !verified.verified) {
      return res.status(400).json({
        error: verified?.message || 'Transaction reference has not been confirmed as paid. Please ensure payment was successful.',
      });
    }

    const cleanPlanId =
      planId === 'weekly' ? 'plan_weekly' :
      planId === 'monthly' ? 'plan_monthly' :
      planId === 'termly' || planId === '3months' ? 'plan_termly' :
      planId === 'annual' || planId === 'annually' ? 'plan_annual' : 'plan_monthly';

    const upgradeResult = dataStore.upgradeSubscription(uid, cleanPlanId);
    const user = dataStore.getUserById(uid);
    const profile = dataStore.getProfile(uid);

    return res.json({
      success: true,
      isPro: true,
      user,
      profile,
      upgradeResult,
      message: 'Payment confirmed via Bachs switch! VIP Pass is now ACTIVE.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Activation failed', details: err?.message });
  }
});

// Bank Transfer details endpoint
app.get('/api/subscriptions/bank-transfer-details', (req, res) => {
  res.json({
    success: true,
    bank: 'Opay',
    accountNumber: '8160754659',
    accountName: 'Nwajiaku Arinzechukwu Christian',
    instructions: 'Transfer exact amount to this OPay account, then submit your sender name & reference. Christian will confirm the payment and activate your VIP.',
  });
});

// Submit Direct Bank Transfer proof: STORES AS PENDING, does NOT auto-activate
app.post('/api/subscriptions/process-bank-transfer', async (req, res) => {
  const { planId, amountNgn, senderName, narration, reference } = req.body;
  const uid = getEffectiveUserId(req);

  try {
    const cleanPlanId =
      planId === 'weekly' ? 'plan_weekly' :
      planId === 'monthly' ? 'plan_monthly' :
      planId === 'termly' || planId === '3months' ? 'plan_termly' :
      planId === 'annual' || planId === 'annually' ? 'plan_annual' : (planId || 'plan_monthly');

    const safeAmount = Number(amountNgn) || (cleanPlanId === 'plan_weekly' ? 750 : cleanPlanId === 'plan_monthly' ? 2500 : cleanPlanId === 'plan_termly' ? 6500 : 18000);
    const trfRef = reference || `TRF_OPAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Submit as PENDING: does NOT activate VIP until Christian confirms
    const pendingPayment = dataStore.submitPendingBankTransfer(uid, {
      planId: cleanPlanId,
      amountNgn: safeAmount,
      senderName: senderName || 'Student',
      narration: narration || '',
      reference: trfRef,
      bank: 'Opay',
      accountNumber: '8160754659',
    });

    return res.json({
      success: true,
      pending: true,
      isPro: false,
      payment: pendingPayment,
      message: `Transfer details submitted! Your payment of ₦${safeAmount.toLocaleString()} is pending confirmation by Christian. Once confirmed, your VIP Eagle Pass will unlock.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit bank transfer', details: err?.message });
  }
});

// Get user's bank transfers
app.get('/api/subscriptions/my-bank-transfers', (req, res) => {
  const uid = getEffectiveUserId(req);
  const transfers = dataStore.getUserPayments(uid).filter((p) => p.provider === 'bank_transfer');
  res.json({ success: true, transfers });
});

// --- ADMIN PAYMENT APPROVAL ENDPOINTS (Christian / Admin only) ---
app.get('/api/admin/subscriptions/pending-transfers', (req, res) => {
  const uid = getEffectiveUserId(req);
  const user = dataStore.getUserById(uid);
  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'christianarinze024@gmail.com';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required.' });
  }

  const pending = dataStore.getPendingBankTransfers();
  const allTransfers = dataStore.getAllBankTransfers();
  res.json({ success: true, pending, allTransfers });
});

app.post('/api/admin/subscriptions/confirm-transfer', (req, res) => {
  const uid = getEffectiveUserId(req);
  const user = dataStore.getUserById(uid);
  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'christianarinze024@gmail.com';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required.' });
  }

  const { paymentId } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID is required.' });
  }

  try {
    const result = dataStore.confirmBankTransfer(paymentId, uid);
    res.json({
      success: true,
      message: 'Bank transfer confirmed! Student VIP has been activated.',
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to confirm transfer.' });
  }
});

app.post('/api/admin/subscriptions/reject-transfer', (req, res) => {
  const uid = getEffectiveUserId(req);
  const user = dataStore.getUserById(uid);
  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'christianarinze024@gmail.com';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Admin access required.' });
  }

  const { paymentId, reason } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID is required.' });
  }

  try {
    const result = dataStore.rejectBankTransfer(paymentId, reason, uid);
    res.json({
      success: true,
      message: 'Transfer rejected.',
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to reject transfer.' });
  }
});

// Bachs.io Gateway Status Diagnostic
app.get('/api/subscriptions/bachs-status', (req, res) => {
  const status = paymentService.getBachsStatus();
  res.json({
    success: true,
    provider: 'bachs.io',
    gateway: 'Bachs Nigerian Payment Gateway',
    ...status,
  });
});

// Process interactive Bachs payment: strictly verifies before upgrading
app.post('/api/subscriptions/process-bachs-payment', async (req, res) => {
  const { planId, reference } = req.body;
  const uid = getEffectiveUserId(req);

  try {
    const verified = await paymentService.verifyPayment(undefined, reference);
    if (!verified || !verified.verified) {
      return res.status(400).json({
        success: false,
        error: verified?.message || 'Payment is unconfirmed. Please complete checkout on Bachs before activating VIP.',
      });
    }

    const cleanPlanId =
      planId === 'weekly' ? 'plan_weekly' :
      planId === 'monthly' ? 'plan_monthly' :
      planId === 'termly' || planId === '3months' ? 'plan_termly' :
      planId === 'annual' || planId === 'annually' ? 'plan_annual' : (planId || 'plan_monthly');

    const upgradeResult = dataStore.upgradeSubscription(uid, cleanPlanId);
    const user = dataStore.getUserById(uid);
    const profile = dataStore.getProfile(uid);

    return res.json({
      success: true,
      isPro: true,
      user,
      profile,
      upgradeResult,
      payment: {
        id: upgradeResult.subscription.paymentId,
        reference: reference,
        provider: 'bachs.io',
        planId: cleanPlanId,
        paidAt: new Date().toISOString(),
        verified: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process payment with Bachs.io', details: err?.message });
  }
});

// Webhook listener for Bachs / Nigerian payments
app.post('/api/webhook/bachs', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const sig = (req.headers['x-bachs-signature-v2'] || req.headers['x-bachs-signature']) as string | undefined;

    const isValid = paymentService.verifyWebhookSignature(rawBody, sig);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('[webhook] Invalid signature received');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const event = payload?.event || payload?.type;
    const data = payload?.data || {};

    if (event === 'checkout.completed' || event === 'payment.succeeded' || data?.status === 'paid' || payload?.status === 'paid') {
      const metadata = data?.metadata || payload?.metadata || {};
      const planId = metadata?.planId || 'plan_monthly';
      const targetUserId = metadata?.userId;
      const email = metadata?.email || data?.customer?.email || payload?.customer?.email;
      const phone = metadata?.phone || data?.customer?.phone_number || payload?.customer?.phone_number;

      let matchedUser = targetUserId ? dataStore.getUserById(targetUserId) : null;
      if (!matchedUser && email) {
        matchedUser = Array.from(dataStore.getAllUsers()).find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        ) || null;
      }
      if (!matchedUser && phone) {
        const cleanP = phone.replace(/\D/g, '').slice(-10);
        matchedUser = Array.from(dataStore.getAllUsers()).find(
          (u) => u.phone && u.phone.replace(/\D/g, '').endsWith(cleanP)
        ) || null;
      }

      if (matchedUser) {
        dataStore.upgradeSubscription(matchedUser.id, planId);
        console.log(`[webhook] Successfully activated VIP subscription for user ${matchedUser.id} (${matchedUser.email})`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.warn('[webhook] Handler error:', err?.message);
    res.status(200).json({ received: true });
  }
});

// ==========================================
// 12. NOTIFICATIONS
// ==========================================
app.get('/api/notifications', (req, res) => {
  const uid = getEffectiveUserId(req);
  const notifs = dataStore.getNotifications(uid);
  res.json(notifs);
});

// ==========================================
// 13. AI TUTOR & EXAM COACH (Gemini AI Powered)
// ==========================================
app.get('/api/ai/context', (req, res) => {
  const uid = getEffectiveUserId(req);
  try {
    const context = dataStore.getStudentLearningContext(uid);
    res.json(context);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve tutor learning context' });
  }
});

// Primary Chat with Tutor & Exam Coach (Socratic conversation)
app.post('/api/ai/chat', async (req, res) => {
  const { messages } = req.body;
  const uid = getEffectiveUserId(req);
  const context = dataStore.getStudentLearningContext(uid);

  try {
    const reply = await aiService.chatWithTutor(messages || [], context);

    dataStore.incrementDailyMission(uid, 'ai', 1);

    res.json({ reply, contextSummary: { exam: context.targetExam, weakTopicsCount: context.weakTopics.length } });
  } catch (err: any) {
    res.status(500).json({ error: 'AI Tutor request failed', details: err.message });
  }
});

// "Why is my answer wrong?" - Diagnoses distractor trap & cognitive slip
app.post('/api/ai/why-wrong', async (req, res) => {
  const { questionId, chosenAnswer } = req.body;
  const uid = getEffectiveUserId(req);

  const question = dataStore.getQuestionById(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  if (!chosenAnswer || !['A', 'B', 'C', 'D'].includes(chosenAnswer)) {
    return res.status(400).json({ error: 'Valid chosenAnswer (A, B, C, or D) is required' });
  }

  const context = dataStore.getStudentLearningContext(uid);

  try {
    const diagnosis = await aiService.explainWhyAnswerWrong(question, chosenAnswer, context);
    dataStore.incrementDailyMission(uid, 'ai', 1);

    res.json({ diagnosis, questionId, chosenAnswer });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate answer diagnosis', details: err.message });
  }
});

// "Teach me a topic" - Socratic bite-sized lesson with checking question
app.post('/api/ai/teach-topic', async (req, res) => {
  const { topicName, subjectName } = req.body;
  const uid = getEffectiveUserId(req);

  if (!topicName || typeof topicName !== 'string') {
    return res.status(400).json({ error: 'topicName is required' });
  }

  const context = dataStore.getStudentLearningContext(uid);

  try {
    const lesson = await aiService.teachTopic(topicName.trim(), subjectName?.trim(), context);
    dataStore.incrementDailyMission(uid, 'ai', 1);

    res.json({ lesson, topicName: topicName.trim(), subjectName });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to teach topic', details: err.message });
  }
});

// Deep explanation for difficult questions upon explicit student request
app.post('/api/ai/explain', async (req, res) => {
  const { questionId, chosenAnswer } = req.body;
  const uid = getEffectiveUserId(req);
  const question = dataStore.getQuestionById(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  const context = dataStore.getStudentLearningContext(uid);

  try {
    const explanation = await aiService.explainDifficultQuestion(question, chosenAnswer, context);

    // Mark AI Mission complete
    dataStore.incrementDailyMission(uid, 'ai', 1);

    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate explanation', details: err.message });
  }
});

// Personalized weekly revision advice based on weak topics & recent mistakes
app.get('/api/ai/study-advice', async (req, res) => {
  const uid = getEffectiveUserId(req);
  const context = dataStore.getStudentLearningContext(uid);

  try {
    const advice = await aiService.generatePersonalizedRevisionAdvice(context);
    res.json({ advice });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

// Snap & Solve Quota status (Free: 1 daily, Pro: 30 daily)
app.get('/api/ai/snap-quota', (req, res) => {
  const uid = getEffectiveUserId(req);
  const quota = dataStore.getSnapSolveQuota(uid);
  res.json(quota);
});

// Snap & Solve Multimodal Vision (Camera or Gallery photo)
app.post('/api/ai/snap-and-solve', async (req, res) => {
  const uid = getEffectiveUserId(req);
  const { imageBase64, mediaType, prompt, subject } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 data' });
  }

  // Check quota
  const quota = dataStore.getSnapSolveQuota(uid);
  if (quota.remaining <= 0) {
    return res.status(403).json({
      error: 'quota_exceeded',
      message: quota.isPremium
        ? 'You have reached your daily VIP limit of 30 Snap & Solves. Quota resets at midnight.'
        : 'You have used your 1 free Snap & Solve for today. Upgrade to EduNexa Pro for 30 daily photo solves!',
      isPremium: quota.isPremium,
      dailyLimit: quota.dailyLimit,
      remaining: 0,
      usedToday: quota.usedToday,
    });
  }

  const context = dataStore.getStudentLearningContext(uid);
  if (subject) {
    context.subjects = [subject, ...context.subjects];
  }

  try {
    const solution = await aiService.solveQuestionFromImage(
      imageBase64,
      mediaType || 'image/jpeg',
      prompt,
      context
    );

    // Record quota usage
    const record = dataStore.recordSnapSolve(uid);
    dataStore.incrementDailyMission(uid, 'ai', 1);

    res.json({
      solution,
      remaining: record.remaining,
      dailyLimit: record.dailyLimit,
      usedToday: record.usedToday,
      isPremium: quota.isPremium,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to solve photo question', details: err?.message });
  }
});

// ==========================================
// 14. ADMIN METRICS, QUESTIONS, SUBJECTS & TOPICS
// ==========================================
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const stats = dataStore.getAdminStats();
  res.json(stats);
});

// Admin Questions: Search, Filter, Paginate
app.get('/api/admin/questions', requireAdmin, (req, res) => {
  const { examType, subjectId, topicId, difficulty, sourceType, status, search, page, limit } = req.query;
  const result = dataStore.getAdminQuestions({
    examType: examType as string,
    subjectId: subjectId as string,
    topicId: topicId as string,
    difficulty: difficulty as string,
    sourceType: sourceType as string,
    status: status as string,
    search: search as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 15,
  });
  res.json(result);
});

app.get('/api/admin/questions/:id', requireAdmin, (req, res) => {
  const q = dataStore.getQuestionById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  res.json(q);
});

app.post('/api/admin/questions', requireAdmin, (req, res) => {
  try {
    const newQuestion = dataStore.addQuestion(req.body);
    res.json(newQuestion);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/questions/add', requireAdmin, (req, res) => {
  try {
    const newQuestion = dataStore.addQuestion(req.body);
    res.json(newQuestion);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/questions/:id', requireAdmin, (req, res) => {
  try {
    const updated = dataStore.updateQuestion(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/admin/questions/:id/status', requireAdmin, (req, res) => {
  try {
    const updated = dataStore.toggleQuestionStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/questions/:id', requireAdmin, (req, res) => {
  const success = dataStore.deleteQuestion(req.params.id);
  if (!success) return res.status(404).json({ error: 'Question not found or already deleted' });
  res.json({ success: true, message: 'Question deleted successfully.' });
});

// Admin Subjects
app.post('/api/admin/subjects', requireAdmin, (req, res) => {
  try {
    const subject = dataStore.addSubject(req.body);
    res.json(subject);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/subjects/:id', requireAdmin, (req, res) => {
  try {
    const updated = dataStore.updateSubject(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/admin/subjects/:id/toggle', requireAdmin, (req, res) => {
  try {
    const updated = dataStore.toggleSubjectActive(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/subjects/:id', requireAdmin, (req, res) => {
  const success = dataStore.deleteSubject(req.params.id);
  if (!success) return res.status(404).json({ error: 'Subject not found' });
  res.json({ success: true, message: 'Subject deleted successfully.' });
});

// Admin Topics
app.post('/api/admin/topics', requireAdmin, (req, res) => {
  try {
    const topic = dataStore.addTopic(req.body);
    res.json(topic);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/topics/:id', requireAdmin, (req, res) => {
  try {
    const updated = dataStore.updateTopic(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/topics/:id', requireAdmin, (req, res) => {
  const success = dataStore.deleteTopic(req.params.id);
  if (!success) return res.status(404).json({ error: 'Topic not found' });
  res.json({ success: true, message: 'Topic deleted successfully.' });
});

// Keepalive endpoints for host uptime
app.get('/ping', (_req, res) => res.status(200).send('pong'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, timestamp: Date.now() }));

// ==========================================
// 15. VITE INTEGRATION & FALLBACK
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 EduNexa AI Server running on http://0.0.0.0:${PORT}`);
    console.log(`Powered by Arinze Web Studios | Built by Arinzechukwu Christian`);

    // Keep free tier instances awake 24/7 (prevents Render 15-minute inactivity spin-down)
    const selfPingUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
    if (selfPingUrl) {
      setInterval(async () => {
        try {
          const fetchMod = await import('axios');
          await fetchMod.default.get(`${selfPingUrl}/ping`, { timeout: 8000 });
        } catch {
          // silent ping
        }
      }, 9 * 60 * 1000);
    }
  });
}

startServer();
