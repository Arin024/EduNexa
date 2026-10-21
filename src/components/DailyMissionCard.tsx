import React, { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  RotateCcw,
  Calendar,
  X,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailyStudyMission, WeeklyChallengeItem, Question } from '../types';

export const DailyMissionCard: React.FC = () => {
  const { profile, refreshUserData, setActiveTab } = useApp();
  const [mission, setMission] = useState<DailyStudyMission | null>(null);
  const [history, setHistory] = useState<DailyStudyMission[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  // Interactive Mission Runner State
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [runnerQuestions, setRunnerQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [lastGradeResult, setLastGradeResult] = useState<{ isCorrect: boolean; xpEarned: number } | null>(null);
  const [runnerCompleted, setRunnerCompleted] = useState(false);

  const fetchMissionData = async () => {
    try {
      setLoading(true);
      const [m, h, wc] = await Promise.all([
        api.getDailyStudyMission(),
        api.getDailyMissionHistory(),
        api.getWeeklyChallenges(),
      ]);
      setMission(m);
      setHistory(h);
      setWeeklyChallenges(wc);
    } catch (err) {
      console.error('Failed to load daily mission:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissionData();
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    } catch (e) {
      // Ignore in non-browser environments
    }
  };

  const handleClaimMission = async () => {
    if (!mission || mission.isClaimed || mission.status !== 'completed' || claiming) return;
    try {
      setClaiming(true);
      const res = await api.claimDailyStudyMission(mission.id);
      refreshUserData();
      setMission(res.mission);
      triggerConfetti();
      setClaimedNotice(`+${res.xpEarned} XP claimed successfully!`);
      setTimeout(() => setClaimedNotice(null), 4000);
      // Refresh history
      const updatedHistory = await api.getDailyMissionHistory();
      setHistory(updatedHistory);
    } catch (err: any) {
      alert(err.message || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimWeeklyChallenge = async (challengeId: string) => {
    try {
      const res = await api.claimWeeklyChallenge(challengeId);
      refreshUserData();
      triggerConfetti();
      setClaimedNotice(`+${res.xpEarned} XP claimed for "${res.challenge.title}"!`);
      setTimeout(() => setClaimedNotice(null), 4000);
      const updatedChallenges = await api.getWeeklyChallenges();
      setWeeklyChallenges(updatedChallenges);
    } catch (err: any) {
      alert(err.message || 'Failed to claim weekly challenge');
    }
  };

  // Launch interactive mission drill session
  const startMissionSession = async () => {
    try {
      setLoading(true);
      const questions = await api.getDailyMissionQuestions();
      setRunnerQuestions(questions);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setLastGradeResult(null);
      setRunnerCompleted(false);
      setIsRunnerOpen(true);
    } catch (err) {
      console.error('Failed to load mission questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunnerSubmitAnswer = async () => {
    if (!selectedOption || isAnswerSubmitted || currentQIndex >= runnerQuestions.length) return;
    const q = runnerQuestions[currentQIndex];
    try {
      setIsAnswerSubmitted(true);
      const res = await api.submitAnswer({
        questionId: q.id,
        chosenAnswer: selectedOption,
        timeSpentSec: 20,
        mode: 'practice',
      });
      setLastGradeResult({ isCorrect: res.isCorrect, xpEarned: res.xpEarned });
      refreshUserData();

      // Re-fetch mission to get updated state
      const updatedM = await api.getDailyStudyMission();
      setMission(updatedM);
      if (updatedM.status === 'completed' && !mission?.status) {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleRunnerNextQuestion = () => {
    if (currentQIndex + 1 < runnerQuestions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setLastGradeResult(null);
    } else {
      setRunnerCompleted(true);
      triggerConfetti();
    }
  };

  if (loading && !mission) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-20 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!mission) return null;

  const isCompleted = mission.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {claimedNotice && (
        <div className="bg-emerald-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>{claimedNotice}</span>
          </div>
          <button onClick={() => setClaimedNotice(null)}>
            <X className="w-4 h-4 text-emerald-200 hover:text-white" />
          </button>
        </div>
      )}

      {/* Main Daily Mission Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div
          className={`p-6 sm:p-7 text-white ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900'
              : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
              <Flame className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
              <span>{isCompleted ? '🎉 MISSION COMPLETE' : "🔥 TODAY'S MISSION"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20 text-slate-200">
                {new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full border border-white/20 transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Previous Missions ({history.length})</span>
              </button>
            </div>
          </div>

          {/* If Completed: Celebration Showcase */}
          {isCompleted ? (
            <div className="space-y-4 pt-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-2">
                  <span className="text-xs text-emerald-200 font-semibold block uppercase tracking-wider">Questions</span>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {mission.completedQuestions}/{mission.totalQuestions}
                  </span>
                </div>
                <div className="p-2">
                  <span className="text-xs text-emerald-200 font-semibold block uppercase tracking-wider">Accuracy</span>
                  <span className="text-2xl sm:text-3xl font-black text-yellow-300 font-mono">
                    {mission.currentAccuracy}%
                  </span>
                </div>
                <div className="p-2">
                  <span className="text-xs text-emerald-200 font-semibold block uppercase tracking-wider">XP Earned</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    +{mission.rewardXp}
                  </span>
                </div>
                <div className="p-2">
                  <span className="text-xs text-emerald-200 font-semibold block uppercase tracking-wider">Streak</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono flex items-center justify-center gap-1">
                    <Flame className="w-6 h-6 fill-amber-400" />
                    {profile?.currentStreak || mission.streakAtCompletion || 12} days
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs sm:text-sm text-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Syllabus quota satisfied with distinction-level accuracy!</span>
                </p>
                {mission.isClaimed ? (
                  <span className="text-xs font-black bg-emerald-500/30 text-emerald-100 border border-emerald-300/40 px-4 py-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Reward Claimed (+{mission.rewardXp} XP)
                  </span>
                ) : (
                  <button
                    onClick={handleClaimMission}
                    disabled={claiming}
                    className="text-xs sm:text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{claiming ? 'Claiming...' : `Claim ${mission.rewardXp} XP`}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* In Progress View */
            <div className="space-y-3 pt-1">
              <h3 className="text-xl sm:text-2xl font-black text-white font-serif">
                Complete Your Daily Diagnostic Quota
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Deterministic daily mission engineered to reinforce your weak topics and maintain high exam readiness.
              </p>

              {/* Targets Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <span className="text-[11px] text-slate-300 block font-medium">Target Accuracy:</span>
                  <span className="text-base font-extrabold text-amber-300">{mission.targetAccuracy}%</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <span className="text-[11px] text-slate-300 block font-medium">Recommended Time:</span>
                  <span className="text-base font-extrabold text-white flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-300" />
                    {mission.recommendedTimeMinutes} mins
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <span className="text-[11px] text-slate-300 block font-medium">Reward:</span>
                  <span className="text-base font-extrabold text-emerald-300">+{mission.rewardXp} XP</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <span className="text-[11px] text-slate-300 block font-medium">Active Streak:</span>
                  <span className="text-base font-extrabold text-yellow-300 flex items-center gap-1">
                    <Flame className="w-4 h-4 fill-yellow-400" />
                    {profile?.currentStreak || 12} days
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mission Components Breakdown */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Study Mission Quota ({mission.completedQuestions}/{mission.totalQuestions} Questions)
            </h4>
            <span className="text-xs font-bold text-slate-700">
              Current Accuracy: <span className="font-extrabold text-emerald-600">{mission.currentAccuracy}%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {mission.segments.map((seg, idx) => {
              const progressPct = Math.min(100, Math.round((seg.completedQuestions / seg.targetQuestions) * 100));
              const isWeak = seg.type === 'weak_topic_revision';

              return (
                <div
                  key={seg.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    seg.isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : isWeak
                      ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isWeak
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isWeak ? 'Priority Weak Area' : `Component 0${idx + 1}`}
                      </span>
                      <h5 className="font-extrabold text-slate-900 text-sm mt-1.5 line-clamp-1">
                        {seg.label}
                      </h5>
                    </div>
                    {seg.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-bold text-slate-800">
                        {seg.completedQuestions} / {seg.targetQuestions} questions
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {progressPct}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          seg.isCompleted
                            ? 'bg-emerald-500'
                            : isWeak
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          {!isCompleted && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>
                  Hit <strong>{mission.targetAccuracy}%</strong> accuracy across all 20 questions to unlock +{mission.rewardXp} XP and extend your streak.
                </span>
              </div>
              <button
                onClick={startMissionSession}
                className="w-full sm:w-auto text-xs sm:text-sm font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Start Today&apos;s Mission (20 Qs)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- WEEKLY CHALLENGES SECTION --- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Weekly Challenges
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reset every Sunday midnight. Complete challenging milestones to earn rare merit badges & massive XP.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            {weeklyChallenges.filter((c) => c.isCompleted).length} / {weeklyChallenges.length} Complete
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weeklyChallenges.map((ch) => {
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  ch.isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {ch.badgeReward || 'Scholar Medal'}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{ch.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{ch.description}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg shrink-0">
                    +{ch.rewardXp} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold">
                      Progress: {ch.currentValue} / {ch.targetValue} {ch.unit}
                    </span>
                    <span className="font-mono text-xs">{ch.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ch.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${ch.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Claim / Status Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {ch.expiresInDays} days remaining
                  </span>

                  {ch.isCompleted ? (
                    ch.isClaimed ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimWeeklyChallenge(ch.id)}
                        className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-3 py-1 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Claim +{ch.rewardXp} XP
                      </button>
                    )
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-xl">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- PREVIOUS COMPLETED MISSIONS MODAL --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col animate-fade-in">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Previous Completed Missions</h3>
                  <p className="text-xs text-slate-500">Your historical streak archive and performance track record</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No mission records yet. Complete today&apos;s mission to initiate your historical archive!
                </div>
              ) : (
                history.map((hist) => {
                  const histCompleted = hist.status === 'completed';
                  return (
                    <div
                      key={hist.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        histCompleted
                          ? 'bg-slate-50/80 border-slate-200'
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {new Date(hist.date).toLocaleDateString('en-NG', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {histCompleted ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-600">
                            Accuracy: <strong className="text-slate-900">{hist.currentAccuracy}%</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">+{hist.rewardXp} XP</span>
                        </div>
                      </div>

                      {/* Segments summary */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {hist.segments.map((s) => (
                          <div
                            key={s.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs"
                          >
                            <span className="text-[10px] font-bold text-slate-400 block line-clamp-1">
                              {s.label}
                            </span>
                            <span className="font-extrabold text-slate-800 mt-0.5 block">
                              {s.completedQuestions} / {s.targetQuestions} Qs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-bold bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE 20-QUESTION MISSION RUNNER MODAL --- */}
      {isRunnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                <Flame className="w-5 h-5 fill-amber-400" />
                <span>Today&apos;s Study Mission Session</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-mono">
                  Question {currentQIndex + 1} of {runnerQuestions.length}
                </span>
                <button
                  onClick={() => setIsRunnerOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Runner Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {runnerCompleted || currentQIndex >= runnerQuestions.length ? (
                /* Completion screen in runner */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                    🎉
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Mission Session Finished!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    You have answered all questions for today&apos;s study mission. Check your accuracy and claim your merit rewards!
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 inline-block text-center space-y-1">
                    <span className="text-xs text-emerald-800 font-semibold block">Total Accuracy</span>
                    <span className="text-3xl font-black text-emerald-700 font-mono">
                      {mission.currentAccuracy}%
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsRunnerOpen(false)}
                      className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                /* Question Card */
                <div className="space-y-4">
                  {/* Category & Segment tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      {runnerQuestions[currentQIndex].subjectName || 'Syllabus Focus'}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {runnerQuestions[currentQIndex].topicName}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      {runnerQuestions[currentQIndex].questionText}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const text = runnerQuestions[currentQIndex].options[opt];
                      if (!text) return null;
                      const isSelected = selectedOption === opt;
                      const isCorrectAnswer = runnerQuestions[currentQIndex].correctAnswer === opt;

                      let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';
                      if (isAnswerSubmitted) {
                        if (isCorrectAnswer) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                        } else if (isSelected && !isCorrectAnswer) {
                          btnStyle = 'bg-red-50 border-red-500 text-red-950 font-bold';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold';
                      }

                      return (
                        <button
                          key={opt}
                          disabled={isAnswerSubmitted}
                          onClick={() => setSelectedOption(opt)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">
                              {opt}
                            </span>
                            <span>{text}</span>
                          </div>
                          {isAnswerSubmitted && isCorrectAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback and Explanation */}
                  {isAnswerSubmitted && lastGradeResult && (
                    <div
                      className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 animate-fade-in ${
                        lastGradeResult.isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        {lastGradeResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Correct! (+{lastGradeResult.xpEarned} XP)</span>
                          </>
                        ) : (
                          <>
                            <span>Incorrect. Correct answer is option {runnerQuestions[currentQIndex].correctAnswer}.</span>
                          </>
                        )}
                      </div>
                      {runnerQuestions[currentQIndex].explanation && (
                        <p className="text-slate-600 pt-1">
                          <strong>Explanation:</strong> {runnerQuestions[currentQIndex].explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {!runnerCompleted && currentQIndex < runnerQuestions.length && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Target: {mission.targetAccuracy}%
                </span>
                {!isAnswerSubmitted ? (
                  <button
                    disabled={!selectedOption}
                    onClick={handleRunnerSubmitAnswer}
                    className="text-xs sm:text-sm font-extrabold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl transition-all"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleRunnerNextQuestion}
                    className="text-xs sm:text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
