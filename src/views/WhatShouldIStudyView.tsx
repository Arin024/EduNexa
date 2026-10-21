import React, { useState, useEffect } from 'react';
import {
  Compass,
  AlertTriangle,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Brain,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  BookOpen,
  Timer,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { WhatShouldIStudyResponse, StudyActivityRecommendation } from '../types';

export const WhatShouldIStudyView: React.FC = () => {
  const { setActiveTab, setTargetPracticeSubject } = useApp();
  const [data, setData] = useState<WhatShouldIStudyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setError(null);
      const res = await api.getStudyRecommendations();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load study recommendations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecommendations();
  };

  const handleExecuteActivity = (rec: StudyActivityRecommendation) => {
    if (rec.activityType === 'mistake_revision') {
      setActiveTab('mistakes');
    } else if (rec.activityType === 'cbt_mock') {
      setActiveTab('cbt');
    } else {
      // Weak topic drill or foundational revision
      setTargetPracticeSubject(rec.subjectId);
      setActiveTab('practice');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-spin text-white shadow-lg shadow-emerald-600/30">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-600">
          Evaluating 5 diagnostic pillars (Weak topics, Mistakes, Recent performance, Exam, History)...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-900 mb-1">Recommendation Engine Offline</h3>
        <p className="text-xs text-red-700 mb-4">{error || 'Unable to compute recommendations.'}</p>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const { primaryRecommendation: primary, secondaryRecommendations: secondaries, diagnosticSnapshot: snapshot } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Deterministic Recommendation Engine
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Strictly Zero AI Calculations
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            WHAT SHOULD I STUDY?
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Stop guessing what to revise next. Our deterministic syllabus algorithm evaluates your{' '}
            <strong className="text-emerald-400 font-semibold">weak topics</strong>,{' '}
            <strong className="text-amber-400 font-semibold">unresolved mistakes</strong>,{' '}
            <strong className="text-blue-400 font-semibold">recent accuracy</strong>,{' '}
            <strong className="text-purple-400 font-semibold">upcoming {snapshot.targetExam} countdown</strong>, and{' '}
            <strong className="text-teal-400 font-semibold">study intervals</strong> to prescribe your highest-impact action right now.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Targeting {snapshot.targetExam} ({snapshot.daysUntilExam} days remaining)</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Recalculate Priorities</span>
          </button>
        </div>
      </div>

      {/* 5 Deterministic Pillars Diagnostic Radar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Pillar 1: Weakest Topic */}
        <div className="bg-white p-4 rounded-2xl border border-red-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-red-700 mb-1">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> 1. Weakest Topic
            </span>
            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
              {snapshot.weakestTopic.accuracy}%
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={snapshot.weakestTopic.name}>
              {snapshot.weakestTopic.name}
            </h4>
            <p className="text-[11px] text-slate-500">{snapshot.weakestTopic.subject}</p>
          </div>
          <div className="w-full bg-red-100 rounded-full h-1.5 mt-2">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.max(8, snapshot.weakestTopic.accuracy)}%` }} />
          </div>
        </div>

        {/* Pillar 2: Recent Mistakes */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> 2. Bank Mistakes
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
              {snapshot.unresolvedMistakesCount} Pending
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              {snapshot.unresolvedMistakesCount === 0 ? 'All Mastered' : `${snapshot.unresolvedMistakesCount} In Bank`}
            </h4>
            <p className="text-[11px] text-slate-500">Unresolved Errors</p>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">
            {snapshot.unresolvedMistakesCount > 0 ? 'Retry for +20 XP each' : 'Mistake bank clean'}
          </p>
        </div>

        {/* Pillar 3: Recent Performance */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 3. Recent Accuracy
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
              {snapshot.recentAccuracy}%
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              {snapshot.recentAccuracy >= 85 ? 'Exceeding Target' : snapshot.recentAccuracy >= 60 ? 'Stable Pacing' : 'Remedial Needed'}
            </h4>
            <p className="text-[11px] text-slate-500">Last 20 attempts</p>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${snapshot.recentAccuracy}%` }} />
          </div>
        </div>

        {/* Pillar 4: Upcoming Exam */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> 4. Upcoming Exam
            </span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
              {snapshot.daysUntilExam} Days
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{snapshot.targetExam} UTME</h4>
            <p className="text-[11px] text-slate-500">Official Milestone</p>
          </div>
          <p className="text-[10px] text-purple-700 font-semibold mt-1">High-yield focus</p>
        </div>

        {/* Pillar 5: Study History & Balance */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-teal-700 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 5. History Balance
            </span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
              {snapshot.currentStreak}d Streak
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {snapshot.neglectedSubject ? snapshot.neglectedSubject.name : 'Balanced'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {snapshot.neglectedSubject ? `${snapshot.neglectedSubject.daysSinceStudied}d untouched` : 'All subjects active'}
            </p>
          </div>
          <p className="text-[10px] text-teal-700 font-semibold mt-1">Daily spaced review</p>
        </div>
      </div>

      {/* PRIMARY RECOMMENDATION CARD */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-lg overflow-hidden">
        <div className="bg-emerald-600 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white text-emerald-700 flex items-center justify-center font-extrabold text-xs">
              #1
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Prescribed Activity Right Now
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-semibold">
            {primary.keyStat}
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    primary.urgency === 'critical'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : primary.urgency === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {primary.urgency} Urgency
                </span>
                <span className="text-xs font-bold text-slate-500">{primary.subjectName}</span>
                {primary.topicName && (
                  <span className="text-xs text-slate-400">• Topic: {primary.topicName}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {primary.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{primary.subtitle}</p>
            </div>

            <button
              id="what-to-study-start-primary-btn"
              onClick={() => handleExecuteActivity(primary)}
              className="shrink-0 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <span>{primary.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Deterministic Reasons Grid */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-600" />
              Why the Deterministic Engine Recommends This:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  1
                </div>
                <div>
                  <span className="font-bold text-slate-800">Weak Topic Factor:</span>
                  <p className="text-slate-600 mt-0.5">{primary.reasons.weakTopicFactor}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  2
                </div>
                <div>
                  <span className="font-bold text-slate-800">Recent Mistakes Factor:</span>
                  <p className="text-slate-600 mt-0.5">{primary.reasons.recentMistakesFactor}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-800">Recent Performance Factor:</span>
                  <p className="text-slate-600 mt-0.5">{primary.reasons.recentPerformanceFactor}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  4
                </div>
                <div>
                  <span className="font-bold text-slate-800">Upcoming Exam Factor:</span>
                  <p className="text-slate-600 mt-0.5">{primary.reasons.upcomingExamFactor}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5 sm:col-span-2">
                <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  5
                </div>
                <div>
                  <span className="font-bold text-slate-800">Study History Factor:</span>
                  <p className="text-slate-600 mt-0.5">{primary.reasons.studyHistoryFactor}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Est. Duration: <strong>{primary.recommendedDurationMinutes} mins</strong>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Questions: <strong>{primary.questionCount} items</strong>
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Difficulty Level:{' '}
                <strong className="capitalize text-slate-700">{primary.targetDifficulty}</strong>
              </span>
            </div>

            <button
              onClick={() => handleExecuteActivity(primary)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Start Session Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY QUEUE: NEXT RECOMMENDED ACTIVITIES */}
      {secondaries && secondaries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Next in Your Study Queue
            </h3>
            <span className="text-xs text-slate-500">Ranked by Priority Score</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {secondaries.map((sec, idx) => (
              <div
                key={sec.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-extrabold text-slate-400 text-xs">#{idx + 2} Next</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {sec.keyStat}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{sec.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sec.subtitle}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{sec.recommendedDurationMinutes} mins</span>
                    <span>{sec.questionCount} questions</span>
                    <span className="capitalize font-semibold text-slate-700">{sec.targetDifficulty}</span>
                  </div>

                  <button
                    onClick={() => handleExecuteActivity(sec)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{sec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADAPTIVE ENGINE RULEBOOK EXPLAINER */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm sm:text-base font-bold text-emerald-950">
            How NaijaPrep&apos;s Deterministic Adaptive Engine Works
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
          Questions are never selected randomly. The engine evaluates your current accuracy and adjusts both{' '}
          <strong>difficulty</strong> and <strong>topic distribution</strong> in accordance with pedagogical rules:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-white rounded-2xl border border-emerald-200">
            <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 mb-1.5">
              Accuracy &gt; 85%
            </span>
            <h4 className="font-bold text-slate-900">Gradually Increase Difficulty</h4>
            <p className="text-slate-600 mt-1">
              Advances to <strong>hard past questions</strong> to stretch retention and build speed for JAMB 300+ / WAEC A1 distinctions.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200">
            <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 mb-1.5">
              Accuracy 60–85%
            </span>
            <h4 className="font-bold text-slate-900">Maintain Current Difficulty</h4>
            <p className="text-slate-600 mt-1">
              Provides <strong>medium difficulty questions</strong> to stabilize core formulas and maintain consistent pacing.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200">
            <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 mb-1.5">
              Accuracy &lt; 60%
            </span>
            <h4 className="font-bold text-slate-900">Foundational Questions & Revision</h4>
            <p className="text-slate-600 mt-1">
              Supplies <strong>foundational questions and step-by-step marking schemes</strong>, boosting question volume in weak topics (e.g. Probability 42% vs Math 81%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
