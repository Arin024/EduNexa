import React, { useState, useEffect } from 'react';
import {
  Flame,
  Target,
  Sparkles,
  BookOpen,
  Timer,
  Bot,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Crown,
  Compass,
  Zap,
  Camera,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailyMission, WeakTopicAnalysis, WeeklyStudyPlan, WhatShouldIStudyResponse } from '../types';
import { DailyMissionCard } from '../components/DailyMissionCard';

export const HomeDashboard: React.FC = () => {
  const { user, profile, setActiveTab, setTargetPracticeSubject } = useApp();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);
  const [studyPlan, setStudyPlan] = useState<WeeklyStudyPlan | null>(null);
  const [recommendationData, setRecommendationData] = useState<WhatShouldIStudyResponse | null>(null);
  const [activeSegment, setActiveSegment] = useState<'target' | 'missions' | 'weaknesses'>('target');

  useEffect(() => {
    api.getMissions().then(setMissions).catch(console.error);
    api.getWeakTopics().then(setWeakTopics).catch(console.error);
    api.getStudyPlan().then(setStudyPlan).catch(console.error);
    api.getStudyRecommendations().then(setRecommendationData).catch(console.error);
  }, []);

  const examName = profile?.targetExam || 'JAMB';
  const targetScoreText = examName === 'JAMB' ? `${profile?.targetScore || 320}/400` : `${profile?.targetScore || 8} A1s`;
  const firstName = user?.fullName?.split(' ')[0] || user?.displayName || 'Scholar';

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-fade-in px-1 sm:px-2 min-w-0 pb-16">
      {/* 1. Mobile Status Bar & Greeting */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-900/50">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{examName} 2025/2026 Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Hello, {firstName}!</span>
              <span>🇳🇬</span>
            </h1>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              onClick={() => setActiveTab('profile_settings')}
              className="flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer hover:bg-amber-500/25 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{profile?.currentStreak || 1}d</span>
            </div>

            <div
              onClick={() => setActiveTab('profile_settings')}
              className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer hover:bg-emerald-500/25 transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>{targetScoreText}</span>
            </div>

            {user?.isPro ? (
              <div
                onClick={() => setActiveTab('subscription')}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-2 py-1 rounded-xl text-xs font-black cursor-pointer shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                <span className="hidden sm:inline">VIP</span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('subscription')}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Crown className="w-3 h-3 text-yellow-300" />
                <span>Go VIP</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4-Icon Native App Launcher (Thumb-friendly 2x2 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* CBT Mock Test */}
        <button
          id="home-cbt-cta-btn"
          onClick={() => setActiveTab('cbt')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Timer className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <h3 className="font-extrabold text-slate-900 text-sm">CBT Mock Test</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Authentic timed exam</p>
          </div>
        </button>

        {/* Practice Questions */}
        <button
          id="home-practice-cta-btn"
          onClick={() => setActiveTab('practice')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Practice Drills</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Topic past questions</p>
          </div>
        </button>

        {/* Snap & Solve Camera */}
        <button
          id="home-snap-solve-btn"
          onClick={() => setActiveTab('ai_tutor')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Camera className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Snap & Solve</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Visual AI photo solver</p>
          </div>
        </button>

        {/* What Should I Study? */}
        <button
          id="home-what-should-i-study-cta-btn"
          onClick={() => setActiveTab('what_to_study')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <h3 className="font-extrabold text-slate-900 text-sm">What to Study?</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">AI study prescription</p>
          </div>
        </button>
      </div>

      {/* 3. Native App Segmented Control Tabs */}
      <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveSegment('target')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'target'
              ? 'bg-white text-emerald-900 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Today&apos;s Target</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('missions')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'missions'
              ? 'bg-white text-emerald-900 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Missions ({missions.length || 3})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('weaknesses')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'weaknesses'
              ? 'bg-white text-emerald-900 shadow-sm font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Weak Topics ({weakTopics.length})</span>
        </button>
      </div>

      {/* 4. Tab Panels (Instant tap without vertical scrolling!) */}
      {/* PANEL 1: TODAY'S TARGET & SYLLABUS PRESCRIPTION */}
      {activeSegment === 'target' && (
        <div className="space-y-3 animate-fade-in">
          {recommendationData?.primaryRecommendation ? (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {recommendationData.primaryRecommendation.urgency} Priority Focus
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {recommendationData.primaryRecommendation.subjectName}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {recommendationData.primaryRecommendation.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {recommendationData.primaryRecommendation.reasons.weakTopicFactor}{' '}
                  {recommendationData.primaryRecommendation.reasons.recentMistakesFactor}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const rec = recommendationData.primaryRecommendation;
                    if (rec.activityType === 'mistake_revision') {
                      setActiveTab('mistakes');
                    } else if (rec.activityType === 'cbt_mock') {
                      setActiveTab('cbt');
                    } else {
                      setTargetPracticeSubject(rec.subjectId);
                      setActiveTab('practice');
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{recommendationData.primaryRecommendation.actionLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('what_to_study')}
                  className="py-3 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  Full Radar →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-2">
              <Compass className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Diagnosis Engine Ready</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Practice 10 questions to unlock personalized weakness prescriptions.
              </p>
              <button
                onClick={() => setActiveTab('practice')}
                className="mt-2 py-2 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Start Practice Drill
              </button>
            </div>
          )}

          {/* Quick Schedule Row */}
          {studyPlan && studyPlan.items.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Weekly Study Milestones</span>
                </span>
                <button
                  onClick={() => setActiveTab('study_plan')}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  View Plan
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {studyPlan.items.slice(0, 2).map((item) => (
                  <div key={item.day} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase">{item.day}</span>
                    <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{item.topicName}</p>
                    <span className="text-[10px] text-slate-500">{item.recommendedDurationMinutes} mins</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL 2: DAILY STUDY MISSIONS */}
      {activeSegment === 'missions' && (
        <div className="space-y-3 animate-fade-in">
          <DailyMissionCard />
        </div>
      )}

      {/* PANEL 3: WEAK TOPICS RADAR */}
      {activeSegment === 'weaknesses' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Prioritized Learning Deficits</span>
            </span>
            <button
              onClick={() => setActiveTab('weak_topics')}
              className="text-[11px] font-bold text-emerald-600 hover:underline"
            >
              Full Diagnostics
            </button>
          </div>

          <div className="space-y-2.5">
            {weakTopics.slice(0, 3).map((item) => (
              <div key={item.topicId} className="p-3 bg-red-50/70 border border-red-200/80 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{item.topicName}</span>
                  <span className="font-black text-red-700">{item.accuracyRate}%</span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-1.5 mb-1.5">
                  <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${item.accuracyRate}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-600">
                  <span>{item.subjectName}</span>
                  <button
                    onClick={() => {
                      setTargetPracticeSubject(item.subjectId);
                      setActiveTab('practice');
                    }}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Drill Topic →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setActiveTab('mistakes')}
              className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Mistake Bank
            </button>
            <button
              onClick={() => setActiveTab('weak_topics')}
              className="py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Full Radar View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
