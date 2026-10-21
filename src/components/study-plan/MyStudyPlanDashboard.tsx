import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  Search,
  RotateCcw,
  Zap,
  Shield,
  HelpCircle,
  Sliders,
  ChevronRight,
  Bot,
  BrainCircuit,
  Settings,
  BellRing,
  Info,
} from 'lucide-react';
import {
  PersonalizedStudyPlan,
  StudyPlanPhase,
  ExamDateConfig,
  ExamType,
} from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { ExamDateAdminModal } from './ExamDateAdminModal';

interface MyStudyPlanDashboardProps {
  plan: PersonalizedStudyPlan;
  onPlanUpdated: (updatedPlan: PersonalizedStudyPlan) => void;
  examConfigs: ExamDateConfig[];
  onExamConfigUpdated: (updated: ExamDateConfig) => void;
}

export const MyStudyPlanDashboard: React.FC<MyStudyPlanDashboardProps> = ({
  plan,
  onPlanUpdated,
  examConfigs,
  onExamConfigUpdated,
}) => {
  const { user, profile, addToast, triggerConfetti, setActiveTab, openTutorWithPrompt } = useApp();

  // Admin exam date modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Topics to study filter & search
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [weakTopicsOnly, setWeakTopicsOnly] = useState(false);

  // Loading states
  const [isTogglingTask, setIsTogglingTask] = useState(false);
  const [isTogglingComeback, setIsTogglingComeback] = useState(false);
  const [isSimulatingDays, setIsSimulatingDays] = useState(false);

  // Optional AI Advice
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // 1. Toggle Today's Task
  const handleToggleTodayTask = async () => {
    setIsTogglingTask(true);
    try {
      const res = await api.toggleStudyPlanTodayTask();
      onPlanUpdated(res.plan);
      if (res.completed) {
        triggerConfetti();
        addToast({
          title: "🎯 Today's Task Completed! +50 XP",
          message: `Great job mastering ${plan.todayTask.topicName}! Your study phase progress has advanced.`,
          type: 'xp',
        });
      } else {
        addToast({
          title: "Task Marked Incomplete",
          message: "Progress status updated.",
          type: 'info',
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Error updating task',
        message: err.message || 'Could not update task status.',
        type: 'info',
      });
    } finally {
      setIsTogglingTask(false);
    }
  };

  // 2. Activate Realistic Comeback Plan
  const handleActivateComeback = async () => {
    setIsTogglingComeback(true);
    try {
      const res = await api.activateComebackPlan();
      onPlanUpdated(res.plan);
      triggerConfetti();
      addToast({
        title: "🛡️ Realistic Comeback Plan Activated!",
        message: "Your daily quota has been gently adjusted (+15 min, +5 questions) for the next 4 days without stress.",
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not activate comeback plan.',
        type: 'info',
      });
    } finally {
      setIsTogglingComeback(false);
    }
  };

  // 3. Dismiss Comeback Plan
  const handleDismissComeback = async () => {
    setIsTogglingComeback(true);
    try {
      const res = await api.dismissComebackPlan();
      onPlanUpdated(res.plan);
      addToast({
        title: "Comeback Plan Dismissed",
        message: "Standard syllabus pace resumed.",
        type: 'info',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsTogglingComeback(false);
    }
  };

  // 4. Simulate Missed Days (Live Interactive Testing)
  const handleSimulateMissedDays = async (days: number) => {
    setIsSimulatingDays(true);
    try {
      const res = await api.simulateMissedDays(days);
      onPlanUpdated(res.plan);
      addToast({
        title: `Simulated ${days} Inactive Days`,
        message: "Realistic comeback engine automatically detected the inactivity gap!",
        type: 'info',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSimulatingDays(false);
    }
  };

  // 5. Fetch AI Advice (Optional enhancement, functions without AI)
  const handleFetchAiAdvice = async () => {
    setIsLoadingAi(true);
    try {
      const data = await api.getAiStudyAdvice();
      setAiAdvice(data.advice);
    } catch (err) {
      setAiAdvice(
        "AI assistant is currently offline or unreachable, but your deterministic study planner, syllabus phases, and progress tracking continue operating at 100% full capacity!"
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Filter topics
  const filteredTopics = plan.topicsToStudy.filter((item) => {
    const matchesSearch =
      item.topicName.toLowerCase().includes(topicSearch.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(topicSearch.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'all' || item.subjectId === selectedSubjectFilter;
    const matchesPriority = selectedPriorityFilter === 'all' || item.priority === selectedPriorityFilter;
    const matchesWeak = !weakTopicsOnly || item.isWeakTopic;
    return matchesSearch && matchesSubject && matchesPriority && matchesWeak;
  });

  const subjectsList = Array.from(
    new Set(plan.topicsToStudy.map((t) => JSON.stringify({ id: t.subjectId, name: t.subjectName })))
  ).map((s) => JSON.parse(s) as { id: string; name: string });

  const currentPhaseInfo = plan.phases.find((p) => p.phase === plan.currentPhase) || plan.phases[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ========================================================= */}
      {/* 1. MASTER HEADER & EXAM COUNTDOWN HERO */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>MY STUDY PLAN</span>
            </span>
            <span className="text-xs text-slate-400">
              Personalized Syllabus Calibrator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 font-bold transition-colors"
              title="Official examination dates configured by board administration"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configure Exam Dates</span>
            </button>
            <span className="text-xs bg-emerald-900/60 text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-700 font-bold">
              Target: {plan.targetScoreLabel}
            </span>
          </div>
        </div>

        {/* Title & Core Inputs Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
              {plan.examTitle}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Dynamically adapted to your <strong className="text-emerald-300">{plan.dailyStudyHours} hrs/day</strong> target,
              diagnostic weak topics, and current baseline accuracy of{' '}
              <strong className="text-yellow-300">{plan.currentPerformanceSummary.overallAccuracy}%</strong>.
            </p>

            {/* Adaptation alert note */}
            {plan.adaptationReason && (
              <div className="flex items-start gap-2 text-xs bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-2xl text-emerald-200">
                <BrainCircuit className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-emerald-300 block">Automatic Pacing Logic:</strong>
                  <span>{plan.adaptationReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* EXAM COUNTDOWN CARD */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-5 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Exam Countdown
              </span>
              {plan.isOfficialDate ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Official Timetable
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {plan.examDateStatus === 'tentative' ? 'Tentative Window' : 'Pending Announcement'}
                </span>
              )}
            </div>

            {plan.countdown ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-2xl font-black text-white block">
                      {plan.countdown.days}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Days</span>
                  </div>
                  <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-2xl font-black text-white block">
                      {plan.countdown.weeks}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Weeks</span>
                  </div>
                  <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-2xl font-black text-white block">
                      {plan.countdown.hours}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Hours</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-tight pt-1">
                  📅 Exam Date: <strong className="text-slate-200">{plan.examDate}</strong>
                  {plan.announcedBy && (
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Source: {plan.announcedBy}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-bold text-amber-300">Official Exam Date Pending Announcement</p>
                <p className="text-[11px] text-slate-400">
                  Study plan is adaptively paced by syllabus mastery readiness. Timetable will activate as soon as the board announces the official date.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* OVERALL PROGRESS BAR */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Syllabus Readiness Score
            </span>
            <span className="text-white">
              {plan.overallProgressPercent}% Mastered ({plan.currentPerformanceSummary.totalQuestionsAnswered} Questions Logged)
            </span>
          </div>
          <div className="w-full bg-slate-800/90 rounded-full h-3 overflow-hidden border border-slate-700 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${plan.overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REALISTIC COMEBACK PLAN BANNER (MISSING DAYS DETECTED) */}
      {/* ========================================================= */}
      {plan.comebackPlan?.isNeeded && (
        <div
          id="comeback-plan-banner"
          className={`p-6 rounded-3xl border transition-all space-y-4 animate-scale-up ${
            plan.comebackPlan.isActivated
              ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950 border-emerald-500/50 text-white'
              : 'bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 border-amber-300/60 text-slate-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  plan.comebackPlan.isActivated
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      plan.comebackPlan.isActivated
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {plan.comebackPlan.isActivated ? 'COMEBACK MODE ACTIVE' : 'REALISTIC COMEBACK PLAN READY'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Gap: {plan.comebackPlan.missedDaysCount} Days Inactive
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  {plan.comebackPlan.isActivated
                    ? 'Gentle 4-Day Catch-Up Active'
                    : `Welcome Back! Rebuild Momentum Without Overwhelming Cramming`}
                </h3>
                <p className="text-xs leading-relaxed max-w-2xl opacity-90">
                  {plan.comebackPlan.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {!plan.comebackPlan.isActivated ? (
                <button
                  id="activate-comeback-btn"
                  onClick={handleActivateComeback}
                  disabled={isTogglingComeback}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Activate Realistic Catch-Up</span>
                </button>
              ) : (
                <button
                  onClick={handleDismissComeback}
                  disabled={isTogglingComeback}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  Dismiss / Return to Normal
                </button>
              )}
            </div>
          </div>

          {/* Comeback Strategy Specs */}
          <div
            className={`p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
              plan.comebackPlan.isActivated
                ? 'bg-slate-950/60 border border-slate-800 text-slate-300'
                : 'bg-white/80 border border-amber-200 text-slate-700'
            }`}
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                ⏱️ Gentle Daily Quota:
              </span>
              <span>{plan.comebackPlan.adjustedDailyMinutes} mins/day (+15 min buffer)</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                🎯 Adjusted Practice:
              </span>
              <span>{plan.comebackPlan.adjustedDailyQuestions} questions/day (+5 questions)</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                📅 Redistribution:
              </span>
              <span>Smoothly spread over {plan.comebackPlan.redistributedDaysCount} days</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CURRENT PHASE ROADMAP */}
      {/* ========================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 text-lg">Current Phase & Roadmap</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5-Phase Syllabus Progression automatically adjusted as you master concepts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Active Phase:</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-200">
              {currentPhaseInfo.shortName}
            </span>
          </div>
        </div>

        {/* Phase Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {plan.phases.map((p, idx) => {
            const isCurrent = p.isCurrent;
            const isCompleted = p.isCompleted;

            return (
              <div
                key={p.phase}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative ${
                  isCurrent
                    ? 'bg-gradient-to-b from-emerald-50 to-teal-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-slate-50 border-emerald-200'
                    : 'bg-slate-50/60 border-slate-200 opacity-70'
                }`}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </span>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCurrent ? 'ACTIVE' : isCompleted ? 'DONE' : 'NEXT'}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                    {p.shortName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.focus}
                  </p>
                </div>

                {/* Completion meter */}
                <div className="space-y-1 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span>{p.completionPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isCurrent
                          ? 'bg-emerald-600'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${p.completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Phase Deep Dive Card */}
        <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                Phase Focus Spotlight
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">{currentPhaseInfo.title}</h3>
            </div>
            <span className="text-xs bg-white text-emerald-800 font-bold px-3 py-1 rounded-xl border border-emerald-200 shadow-xs self-start sm:self-auto">
              Target Difficulty: {currentPhaseInfo.recommendedQuestionDifficulty.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            {currentPhaseInfo.description}
          </p>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 pt-1 border-t border-emerald-200/60">
            <Target className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Phase Milestone:</strong> {currentPhaseInfo.milestoneGoal}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. TODAY'S TASK & THIS WEEK'S TARGET */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY'S TASK */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Today&apos;s Task</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {plan.todayTask.dayLabel}, {plan.todayTask.date}
              </span>
            </div>

            {/* Task Card Body */}
            <div
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                plan.todayTask.isCompleted
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                  {plan.todayTask.subjectName}
                </span>

                <div className="flex items-center gap-1.5">
                  {plan.todayTask.isWeakTopicRevision && (
                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Weak Topic Revision
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {plan.todayTask.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              <div>
                <h4
                  className={`text-base font-extrabold text-slate-900 ${
                    plan.todayTask.isCompleted ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {plan.todayTask.topicName}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{plan.todayTask.notes}</p>
              </div>

              {/* Targets spec */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>{plan.todayTask.recommendedDurationMinutes}</strong> Mins Study
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span>
                    <strong>{plan.todayTask.targetQuestions}</strong> Practice Questions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for Today's Task */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              id="toggle-today-task-btn"
              onClick={handleToggleTodayTask}
              disabled={isTogglingTask}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                plan.todayTask.isCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {plan.todayTask.isCompleted ? 'Marked Completed (Tap to Uncheck)' : "Mark Today's Task Completed (+50 XP)"}
              </span>
            </button>

            <button
              onClick={() =>
                openTutorWithPrompt(
                  `Teach me ${plan.todayTask.topicName} in ${plan.todayTask.subjectName} from scratch. This is my assigned task for today in my ${plan.examType} syllabus plan. Please explain it simply with a Nigerian example and a checking question.`
                )
              }
              title="Ask Gemini AI Tutor to teach today's topic"
              className="px-3.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('practice')}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* THIS WEEK'S TARGET */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">{plan.weekTarget.title}</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Target Accuracy: {plan.weekTarget.targetAccuracy}%
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {plan.weekTarget.focusSummary}
            </p>

            {/* Questions Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Questions Completed</span>
                <span className="text-slate-900">
                  {plan.weekTarget.completedQuestions} of {plan.weekTarget.targetQuestions} Questions
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((plan.weekTarget.completedQuestions / plan.weekTarget.targetQuestions) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Study Minutes Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Study Time Invested</span>
                <span className="text-slate-900">
                  {plan.weekTarget.completedStudyMinutes} of {plan.weekTarget.targetStudyMinutes} Mins
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((plan.weekTarget.completedStudyMinutes / plan.weekTarget.targetStudyMinutes) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Key Topics To Master List */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-slate-800 block">
                Key Topics to Master This Week:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {plan.weekTarget.keyTopicsToMaster.map((kt) => (
                  <div
                    key={kt.topicId}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between"
                  >
                    <span className="font-bold text-slate-800 line-clamp-1">{kt.topicName}</span>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{kt.subjectName}</span>
                      <span className="font-bold text-emerald-700">{kt.accuracy}% acc</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled CBT Mocks quota */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
            <span className="font-bold text-emerald-900">
              📊 Timed CBT Mock Target:
            </span>
            <span className="font-extrabold text-emerald-800">
              {plan.weekTarget.mockExamsCompleted} of {plan.weekTarget.mockExamsScheduled} Completed
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. TOPICS TO STUDY (SEARCH, FILTER & ACCURACY TRACKER) */}
      {/* ========================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 text-lg">Topics to Study</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive topic syllabus sorted by exam frequency and diagnostic weakness
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing {filteredTopics.length} of {plan.topicsToStudy.length} Topics
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Search topic or subject..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Enrolled Subjects</option>
            {subjectsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority / Weak Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeakTopicsOnly(!weakTopicsOnly)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                weakTopicsOnly
                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {weakTopicsOnly ? '⚠️ Weak Topics' : 'Show Weak First'}
            </button>
          </div>
        </div>

        {/* Topics Table List */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => (
              <div
                key={topic.topicId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {topic.subjectName}
                    </span>

                    {topic.isWeakTopic && (
                      <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                        Needs Attention
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        topic.frequencyInExam === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {topic.frequencyInExam.toUpperCase()} EXAM FREQUENCY
                    </span>

                    <span className="text-[10px] text-slate-400 font-medium">
                      Phase: {topic.phaseAssigned}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{topic.topicName}</h4>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Accuracy & Status */}
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">
                      {topic.accuracyRate}% Accuracy
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        topic.status === 'mastered'
                          ? 'text-emerald-600'
                          : topic.status === 'improving'
                          ? 'text-teal-600'
                          : topic.status === 'studying'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        openTutorWithPrompt(
                          `Teach me ${topic.topicName} in ${topic.subjectName} from scratch. My current accuracy on it is ${topic.accuracyRate}%. Explain it simply with a Nigerian example and give me a checking question.`
                        )
                      }
                      title="Ask Gemini AI Tutor to teach this topic"
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span className="hidden sm:inline">Teach Me</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('practice')}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                    >
                      <span>Practice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No topics matched your search filter.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. CURRENT PERFORMANCE SUMMARY & DIAGNOSTICS */}
      {/* ========================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Current Diagnostic Performance
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-slate-900 block">
              {plan.currentPerformanceSummary.overallAccuracy}%
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Overall Accuracy</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-slate-900 block">
              {plan.currentPerformanceSummary.totalQuestionsAnswered}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Questions Solved</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-red-600 block">
              {plan.currentPerformanceSummary.weakTopicsCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Weak Topics Flagged</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-amber-600 block">
              {plan.currentPerformanceSummary.unresolvedMistakesCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mistakes In Bank</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-emerald-600 block">
              🔥 {plan.currentPerformanceSummary.currentStreak}d
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Study Streak</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. DEMO / SIMULATION TEST BENCH & AI ADVICE */}
      {/* ========================================================= */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Pedagogical Adaptation Test Controls
              </h4>
              <p className="text-[11px] text-slate-500">
                Test the realistic comeback plan and AI Socratic strategy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateMissedDays(3)}
              disabled={isSimulatingDays}
              className="text-xs bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-xl font-bold transition-colors shadow-2xs"
            >
              Simulate 3 Missed Days
            </button>
            <button
              onClick={() => handleSimulateMissedDays(0)}
              disabled={isSimulatingDays}
              className="text-xs bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-xl font-bold transition-colors shadow-2xs"
            >
              Reset Inactivity
            </button>
          </div>
        </div>

        {/* Optional AI Study Advice */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              Socratic AI Study Advice (Optional)
            </span>
            <button
              onClick={handleFetchAiAdvice}
              disabled={isLoadingAi}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              {isLoadingAi ? 'Consulting...' : 'Request AI Revision Tip'}
            </button>
          </div>

          {aiAdvice && (
            <div className="p-3 bg-emerald-50 text-slate-800 rounded-xl text-xs leading-relaxed whitespace-pre-line border border-emerald-200 animate-fade-in font-sans">
              {aiAdvice}
            </div>
          )}
        </div>
      </div>

      {/* Admin Exam Date Modal */}
      <ExamDateAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        examConfigs={examConfigs}
        onConfigUpdated={(updated) => {
          onExamConfigUpdated(updated);
          // Reload plan
          api.getPersonalizedStudyPlan().then(onPlanUpdated).catch(console.error);
        }}
        defaultExamType={plan.examType}
      />
    </div>
  );
};
