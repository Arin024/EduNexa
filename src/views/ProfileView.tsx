import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Target,
  Clock,
  BookOpen,
  Save,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  Flame,
  Award,
  Zap,
  Gift,
  Share2,
  RefreshCw,
  ShieldCheck,
  Building2,
  Trophy,
  Sliders,
  ChevronRight,
  Star,
  Lock,
  BarChart3,
  Layers,
  Info,
  Check,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ExamType,
  PreferredStudyTime,
  AcademicLevel,
  StudentGamificationSummary,
  GamificationConfig,
  Achievement,
  AVAILABLE_EXAM_YEARS,
} from '../types';

export const ProfileView: React.FC = () => {
  const { user, profile, refreshUserData, addToast, logout, setIsOnboarding } = useApp();

  // Navigation tab inside Profile
  const [activeTab, setActiveTab] = useState<'progress' | 'achievements' | 'mastery' | 'settings' | 'xp_config'>('progress');

  // Gamification Data State
  const [summary, setSummary] = useState<StudentGamificationSummary | null>(null);
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'milestones' | 'mastery' | 'streaks' | 'community'>('all');
  const [isLoadingGamification, setIsLoadingGamification] = useState(false);
  const [isVerifyingActivity, setIsVerifyingActivity] = useState(false);

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExam, setTargetExam] = useState<ExamType>('JAMB');
  const [examYear, setExamYear] = useState<number>(2025);
  const [targetScore, setTargetScore] = useState<number>(320);
  const [dailyHours, setDailyHours] = useState<number>(2.5);
  const [preferredStudyTime, setPreferredStudyTime] = useState<PreferredStudyTime>('evening');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('university_aspirant');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetCourse, setTargetCourse] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'sub_eng',
    'sub_math',
    'sub_phy',
    'sub_chm',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Editable XP Config State
  const [editableConfig, setEditableConfig] = useState<Partial<GamificationConfig>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Fetch gamification summary and config
  const fetchGamificationData = async () => {
    setIsLoadingGamification(true);
    try {
      const [sumRes, cfgRes] = await Promise.all([
        api.getGamificationSummary(),
        api.getGamificationConfig(),
      ]);
      setSummary(sumRes);
      setConfig(cfgRes);
      setEditableConfig(cfgRes);
    } catch (err: any) {
      console.error('Failed to load gamification data', err);
    } finally {
      setIsLoadingGamification(false);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || user?.fullName || '');
      setPhone(profile.phone || user?.phone || '');
      setTargetExam(profile.targetExam || 'JAMB');
      setExamYear(profile.examYear || 2025);
      setTargetScore(profile.targetScore || (profile.targetExam === 'JAMB' ? 320 : 8));
      setDailyHours(profile.dailyStudyHours || 2.5);
      setPreferredStudyTime(profile.preferredStudyTime || 'evening');
      setAcademicLevel(profile.academicLevel || 'university_aspirant');
      setTargetUniversity(profile.targetUniversity || '');
      setTargetCourse(profile.targetCourse || '');
      if (profile.selectedSubjects && profile.selectedSubjects.length > 0) {
        setSelectedSubjects(profile.selectedSubjects);
      }
    }
  }, [profile, user]);

  const availableSubjectOptions = [
    { id: 'sub_eng', name: 'Use of English (Compulsory for JAMB)', icon: '📖' },
    { id: 'sub_math', name: 'General Mathematics', icon: '📐' },
    { id: 'sub_phy', name: 'Physics', icon: '⚡' },
    { id: 'sub_chm', name: 'Chemistry', icon: '🧪' },
    { id: 'sub_bio', name: 'Biology', icon: '🧬' },
    { id: 'sub_eco', name: 'Economics', icon: '📊' },
    { id: 'sub_gov', name: 'Government', icon: '🏛️' },
    { id: 'sub_lit', name: 'Literature in English', icon: '📚' },
    { id: 'sub_crk', name: 'Christian Religious Studies', icon: '🕊️' },
  ];

  const handleToggleSubject = (id: string) => {
    if (id === 'sub_eng' && targetExam === 'JAMB') return;
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 2) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
      } else {
        addToast({
          title: 'Minimum 2 subjects required',
          type: 'info',
        });
      }
    } else {
      if (targetExam === 'JAMB' && selectedSubjects.length >= 4) {
        addToast({
          title: 'JAMB UTME consists of 4 subjects',
          message: 'Deselect a subject first to swap in a new one.',
          type: 'info',
        });
        return;
      }
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({
        displayName,
        phone,
        targetExam,
        examYear,
        targetScore,
        dailyStudyHours: dailyHours,
        preferredStudyTime,
        academicLevel,
        targetUniversity,
        targetCourse,
        selectedSubjects,
      });
      await refreshUserData();
      addToast({
        title: 'Student Profile & Targets Updated! 🎯',
        message: 'Your weekly study planner has been synchronized.',
        type: 'success',
      });
    } catch (e: any) {
      addToast({
        title: 'Failed to update profile',
        message: e.message || 'Please verify changes.',
        type: 'info',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveXpConfig = async () => {
    setIsSavingConfig(true);
    try {
      const updated = await api.updateGamificationConfig(editableConfig);
      setConfig(updated);
      await fetchGamificationData();
      addToast({
        title: 'XP & Level Calibration Updated! ⚙️',
        message: 'Configurable XP parameters are now active across the platform.',
        type: 'success',
      });
    } catch (e: any) {
      addToast({
        title: 'Failed to update config',
        message: e.message || 'Could not save parameters.',
        type: 'info',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleVerifyMeaningfulActivity = async () => {
    setIsVerifyingActivity(true);
    try {
      const res = await api.recordStudyActivity('study_session', { sessionDurationSec: 1200 });
      await refreshUserData();
      await fetchGamificationData();
      if (res.streakExtended) {
        addToast({
          title: `🔥 Daily Study Streak Extended to ${res.currentStreak} Days!`,
          message: res.bonusXpAwarded > 0 ? `+${res.bonusXpAwarded} Milestone Bonus XP awarded!` : 'Consistent daily study verified.',
          type: 'success',
        });
      } else {
        addToast({
          title: 'Daily Study Already Logged Today! 🛡️',
          message: 'Your streak is safe. Meaningful study was already recorded for today.',
          type: 'info',
        });
      }
    } catch (e: any) {
      addToast({
        title: 'Error verifying study session',
        message: e.message,
        type: 'info',
      });
    } finally {
      setIsVerifyingActivity(false);
    }
  };

  const copyReferralLink = () => {
    const code = profile?.referralCode || user?.referralCode || 'NAIJA-PREP';
    const link = `https://naijaprep.ng/join?ref=${code}`;
    navigator.clipboard?.writeText(link);
    addToast({
      title: 'Referral link copied! 📋',
      message: `Share ${code} with friends to earn free access and cash commissions.`,
      type: 'success',
    });
  };

  // Filtered achievements
  const achievements = summary?.achievements || [];
  const filteredAchievements = achievements.filter((a) => {
    if (achievementFilter === 'all') return true;
    return a.category === achievementFilter;
  });

  const levelProgress = summary?.levelProgress;
  const personalRecords = summary?.personalRecords;
  const subjectMastery = summary?.subjectMastery || [];
  const streakInfo = summary?.streakInfo;

  // Level Badge Colors
  const getBadgeColorClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'blue':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'teal':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-950 border-yellow-400';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* 1. Header Student Scholar Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg border-2 border-white">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={user?.fullName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                user?.fullName.charAt(0) || 'S'
              )}
            </div>
            {user?.isPro && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-white shadow-sm flex items-center gap-0.5">
                PRO
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{user?.fullName}</h2>
              {profile?.displayName && profile.displayName !== user?.fullName && (
                <span className="text-xs text-slate-500 font-medium">({profile.displayName})</span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
              </span>
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm ${getBadgeColorClasses(
                  levelProgress?.badgeColor
                )}`}
              >
                <Award className="w-3.5 h-3.5" /> Level {levelProgress?.currentLevel || 1} • {levelProgress?.levelTitle || 'Scholar'}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {streakInfo?.currentStreak || profile?.currentStreak || 1} Day Streak
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                {levelProgress?.totalXp || profile?.totalXp || 0} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <button
            id="profile_verify_activity_btn"
            onClick={handleVerifyMeaningfulActivity}
            disabled={isVerifyingActivity}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            title="Log meaningful study activity to protect and advance your streak"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isVerifyingActivity ? 'Verifying...' : 'Verify Today’s Study'}</span>
          </button>
          <button
            id="rerun_onboarding_btn"
            onClick={() => setIsOnboarding(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-calibrate Onboarding</span>
          </button>
          <button
            id="profile_logout_btn"
            onClick={logout}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'progress'
              ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Progress & Records</span>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'achievements'
              ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Achievements ({achievements.filter((a) => a.isUnlocked).length}/{achievements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mastery')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'mastery'
              ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subject Mastery</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Target & Subjects</span>
        </button>
        <button
          onClick={() => setActiveTab('xp_config')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'xp_config'
              ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>XP & Level Rules</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {/* ============================================================== */}
      {/* TAB A: PROGRESS & METRICS */}
      {/* ============================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Level Progression Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
                  <Award className="w-4 h-4" /> Scholar Rank Progression
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-0.5">
                  Level {levelProgress?.currentLevel || 1}: {levelProgress?.levelTitle || 'Beginner'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-lg">
                  {levelProgress?.tagline || 'Building the foundation for academic distinction.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Cumulative Score</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {levelProgress?.totalXp || 0} XP
                </span>
              </div>
            </div>

            {/* Progress Bar to Next Level */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">
                  {levelProgress?.progressPercent || 0}% toward Next Level
                </span>
                <span className="text-emerald-300 font-mono">
                  {levelProgress?.xpToNextLevel} XP needed
                </span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, levelProgress?.progressPercent || 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                <span>Current: {levelProgress?.currentLevelMinXp || 0} XP</span>
                <span>Target: {levelProgress?.nextLevelXp || 400} XP</span>
              </div>
            </div>
          </div>

          {/* Key Study Metrics Quad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Current Streak */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {streakInfo?.currentStreak || profile?.currentStreak || 1}
                </span>
                <span className="text-xs font-bold text-amber-600">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                {streakInfo?.isActiveToday ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Studied today
                  </span>
                ) : (
                  <span>Study today to keep active</span>
                )}
              </p>
            </div>

            {/* Longest Streak */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Longest Streak</span>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {streakInfo?.longestStreak || personalRecords?.longestStreak || profile?.longestStreak || 1}
                </span>
                <span className="text-xs font-bold text-yellow-600">Days PR</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {streakInfo?.freezeAvailable ? `${streakInfo.freezeAvailable} streak freeze available` : 'Unbreakable momentum'}
              </p>
            </div>

            {/* Overall Accuracy */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {personalRecords?.overallAccuracyRate || 76}%
                </span>
                <span className="text-xs font-bold text-slate-500">All tests</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {personalRecords?.totalCorrectQuestions || 18} correct answers
              </p>
            </div>

            {/* Questions Answered */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Questions</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {personalRecords?.totalQuestionsAnswered || 24}
                </span>
                <span className="text-xs font-bold text-blue-600">Answered</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                ~{personalRecords?.fastestAvgSpeedSec || 35}s avg speed
              </p>
            </div>
          </div>

          {/* Personal Records Showcase */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Verified Personal Records (PRs)
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated deterministically from your genuine CBT mocks and practice attempts
                </p>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                Official Records
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block">Highest CBT Mock Score</span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {personalRecords?.highestCbtScore || 285} {targetExam === 'JAMB' ? '/ 400' : 'Marks'}
                </span>
                <span className="text-[10px] text-slate-500 block">({personalRecords?.highestCbtPercentage || 71}%)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block">Best Session Accuracy</span>
                <span className="text-base font-black text-blue-800 font-mono">
                  {personalRecords?.bestAccuracySession || 88}%
                </span>
                <span className="text-[10px] text-slate-500 block">High diagnostic focus</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block">Mistakes Mastered</span>
                <span className="text-base font-black text-purple-800 font-mono">
                  {personalRecords?.mistakesMastered || 3} Questions
                </span>
                <span className="text-[10px] text-slate-500 block">Conquered in Mistake Bank</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Study Time</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {Math.floor((personalRecords?.totalStudyMinutes || 45) / 60)}h{' '}
                  {(personalRecords?.totalStudyMinutes || 45) % 60}m
                </span>
                <span className="text-[10px] text-slate-500 block">Syllabus engagement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB B: ACHIEVEMENTS & BADGES */}
      {/* ============================================================== */}
      {activeTab === 'achievements' && (
        <div className="space-y-5">
          {/* Achievement Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Badges' },
                  { id: 'milestones', label: 'Milestones' },
                  { id: 'mastery', label: 'Mastery & Accuracy' },
                  { id: 'streaks', label: 'Streaks & Consistency' },
                  { id: 'community', label: 'Community & Referrals' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAchievementFilter(f.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    achievementFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Unlocked:{' '}
              <span className="font-extrabold text-emerald-700">
                {achievements.filter((a) => a.isUnlocked).length}
              </span>{' '}
              / {achievements.length} Badges
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAchievements.map((ach) => {
              const isUnlocked = ach.isUnlocked;
              return (
                <div
                  key={ach.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isUnlocked
                      ? 'bg-white border-emerald-300 shadow-sm hover:shadow-md'
                      : 'bg-slate-50/80 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-sm ${
                        isUnlocked
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border border-emerald-400'
                          : 'bg-slate-200 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {ach.icon || '🏅'}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{ach.title}</span>
                          {isUnlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </h4>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          +{ach.xpBonus} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{ach.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>
                        {isUnlocked ? 'Unlocked' : `Progress: ${ach.currentProgress ?? 0} / ${ach.requirementValue}`}
                      </span>
                      <span>{ach.progressPercent ?? (isUnlocked ? 100 : 0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(2, ach.progressPercent ?? (isUnlocked ? 100 : 0))}%` }}
                      />
                    </div>
                    {isUnlocked && ach.unlockedAt && (
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Achieved on {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB C: SUBJECT MASTERY */}
      {/* ============================================================== */}
      {activeTab === 'mastery' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Syllabus Subject Mastery
            </h3>
            <p className="text-xs text-slate-500">
              Visual diagnostic indicators based on your practice accuracy and syllabus topic coverage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectMastery.map((sub) => {
              const statusColor =
                sub.status === 'mastered'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : sub.status === 'proficient'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : sub.status === 'developing'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300';

              return (
                <div
                  key={sub.subjectId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{sub.icon || '📚'}</span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{sub.subjectName}</h4>
                        <span className="text-[11px] text-slate-400 font-semibold">{sub.code}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Overall Mastery</span>
                      <span className="font-mono text-emerald-700">{sub.masteryPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${Math.max(5, sub.masteryPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block font-medium">Diagnostic Accuracy</span>
                      <span className="font-bold text-slate-900">{sub.accuracyRate}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block font-medium">Topics Mastered</span>
                      <span className="font-bold text-slate-900">
                        {sub.topicsMasteredCount} / {sub.totalTopicsCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB D: TARGET EXAM & SUBJECTS */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Target Exam, Year & Tertiary Ambition */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Exam Target & Career Aspiration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'JAMB', label: 'JAMB UTME', desc: '4 Subjects • 400 Mark Scale' },
                  { id: 'WAEC', label: 'WAEC (WASSCE)', desc: 'Senior School Certificate • A1-F9' },
                  { id: 'NECO', label: 'NECO (SSCE)', desc: 'National Examinations Council' },
                ] as const
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setTargetExam(item.id);
                    if (item.id === 'JAMB') setTargetScore(320);
                    else setTargetScore(8);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    targetExam === item.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <h4 className="font-extrabold text-sm text-slate-900">{item.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Year
                </label>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  {AVAILABLE_EXAM_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} Examination Session
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Institution
                </label>
                <input
                  type="text"
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  placeholder="e.g. UNILAG, UI, OAU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course of Study
                </label>
                <input
                  type="text"
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  placeholder="e.g. Medicine, Law, Software Eng."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Score Target & Daily Hours Pacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  {targetExam === 'JAMB' ? 'Target Score (/400)' : 'Target A1 Distinctions'}
                </h4>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {targetExam === 'JAMB' ? `${targetScore} / 400` : `${targetScore} A1s`}
                </span>
              </div>
              <input
                type="range"
                min={targetExam === 'JAMB' ? 200 : 4}
                max={targetExam === 'JAMB' ? 380 : 9}
                step={targetExam === 'JAMB' ? 5 : 1}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                <span>{targetExam === 'JAMB' ? '200 (Cut-off)' : '4 Credits'}</span>
                <span>{targetExam === 'JAMB' ? '300+ (National Merit)' : '9 Distinctions'}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">Available Study Time</h4>
                <span className="text-xl font-black text-blue-700 font-mono">{dailyHours} hrs / day</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                <span>1 Hour (Light)</span>
                <span>2.5 Hours (Recommended)</span>
                <span>6 Hours (Bootcamp)</span>
              </div>
            </div>
          </div>

          {/* Subject Selection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Selected Subjects ({selectedSubjects.length} chosen)
              </h3>
              <span className="text-xs text-slate-500">
                {targetExam === 'JAMB' ? 'JAMB requires 4 subject combination' : 'Select your SSCE subjects'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {availableSubjectOptions.map((subj) => {
                const isChecked = selectedSubjects.includes(subj.id);
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => handleToggleSubject(subj.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{subj.icon}</span>
                      <span className="text-xs">{subj.name}</span>
                    </div>
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Profile Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Academic Targets'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB E: CONFIGURABLE XP & LEVEL RULES */}
      {/* ============================================================== */}
      {activeTab === 'xp_config' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Configurable Gamification & XP System
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Customizable Rules
              </span>
            </div>
            <p className="text-xs text-slate-500">
              XP values and level thresholds are dynamically configurable. You can adjust reward parameters here without permanent hardcoding.
            </p>
          </div>

          {/* XP Parameters Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Reward Values (XP per Activity)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correct Answer (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xpPerCorrectAnswer ?? 10}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xpPerCorrectAnswer: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +10 XP</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Mission Complete (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xpPerDailyMission ?? 50}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xpPerDailyMission: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +50 XP</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Mock Exam (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xpPerCbtExam ?? 100}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xpPerCbtExam: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +100 XP</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7-Day Streak Milestone Bonus (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xp7DayStreakBonus ?? 200}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xp7DayStreakBonus: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +200 XP</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Milestone (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xpPerReferralSignup ?? 100}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xpPerReferralSignup: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +100 XP per referral</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mistake Mastered Bonus (+XP)
                </label>
                <input
                  type="number"
                  value={editableConfig.xpPerMistakeMastered ?? 25}
                  onChange={(e) =>
                    setEditableConfig({ ...editableConfig, xpPerMistakeMastered: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold text-emerald-800"
                />
                <span className="text-[11px] text-slate-400">Default: +25 XP</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveXpConfig}
                disabled={isSavingConfig}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Saving...' : 'Apply XP Configuration'}</span>
              </button>
            </div>
          </div>

          {/* Configured Level Progression Ladder */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Level Progression Ladder</h4>
            <div className="space-y-2.5">
              {(config?.levels || []).map((lvl) => {
                const isCurrent = levelProgress?.currentLevel === lvl.level;
                return (
                  <div
                    key={lvl.level}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        L{lvl.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-slate-900">{lvl.title}</h5>
                          {isCurrent && (
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Active Rank
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{lvl.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-slate-700">
                      {lvl.minXp} - {lvl.maxXp} XP
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Referral & Rewards System Card (Always accessible) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">Your Referral Code & Earnings</h4>
              <p className="text-xs text-slate-600">
                Earn ₦500 or 1 free month for every friend who signs up with your code.
              </p>
            </div>
          </div>
          <button
            onClick={copyReferralLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Referral Code</span>
            <span className="text-sm font-black text-emerald-800 font-mono">
              {profile?.referralCode || user?.referralCode || 'NAIJA-2025'}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Referrals</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {profile?.referralStats?.totalSignups || 0} Students
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Active Subscriptions</span>
            <span className="text-sm font-black text-emerald-700 font-mono">
              {profile?.referralStats?.totalPayingSubscribers || 0} Paid
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Earnings in Wallet</span>
            <span className="text-sm font-black text-amber-700 font-mono">
              ₦{(profile?.walletBalanceNgn || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
