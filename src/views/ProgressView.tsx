import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Bot,
  Clock,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { WeakTopicAnalysis } from '../types';

export const ProgressView: React.FC = () => {
  const { profile, setActiveTab, setTargetPracticeSubject } = useApp();
  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    api.getWeakTopics().then(setWeakTopics).catch(console.error);
  }, []);

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    try {
      const data = await api.getAiStudyAdvice();
      setAiReport(data.advice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const weakCount = weakTopics.filter((w) => w.status === 'weak').length;
  const improvingCount = weakTopics.filter((w) => w.status === 'improving').length;
  const masteredCount = weakTopics.filter((w) => w.status === 'mastered').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header Overview */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Syllabus Mastery & Diagnostic Analytics</span>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20">
            {profile?.targetExam || 'JAMB'} Prep Engine
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black font-serif">Diagnostic Topic Health Radar</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Real-time tracking of every syllabus topic based on your practice sessions, CBT mocks, and speed.
            Prioritize red &apos;Weak&apos; topics to rapidly elevate your score.
          </p>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl">
            <span className="text-xs font-semibold text-red-300 block">Needs Focus</span>
            <span className="text-2xl font-black text-red-400">{weakCount} Topics</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
            <span className="text-xs font-semibold text-amber-300 block">Improving</span>
            <span className="text-2xl font-black text-amber-400">{improvingCount} Topics</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
            <span className="text-xs font-semibold text-emerald-300 block">Mastered</span>
            <span className="text-2xl font-black text-emerald-400">{masteredCount} Topics</span>
          </div>
        </div>
      </div>

      {/* 2. Topics Diagnostic List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Syllabus Topic Health Breakdown
          </h3>
          <span className="text-xs text-slate-500">Sorted by urgency</span>
        </div>

        <div className="space-y-3">
          {weakTopics.map((topic) => {
            const isWeak = topic.status === 'weak';
            const isImproving = topic.status === 'improving';
            return (
              <div
                key={topic.topicId}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isWeak
                    ? 'bg-red-50/50 border-red-200'
                    : isImproving
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{topic.topicName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isWeak
                          ? 'bg-red-100 text-red-800'
                          : isImproving
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Subject: <strong className="text-slate-700">{topic.subjectName}</strong> •{' '}
                    {topic.totalAttempts} total questions answered
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-medium">Accuracy</span>
                    <span
                      className={`text-base font-extrabold ${
                        isWeak ? 'text-red-700' : isImproving ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {topic.accuracyRate}%
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setTargetPracticeSubject(null);
                      setActiveTab('practice');
                    }}
                    className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Practice Topic →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Diagnostic Performance Report Generator */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              NaijaPrep AI Diagnostic Coach Report
            </h3>
            <p className="text-xs text-slate-500">
              Personalized evaluation of syllabus readiness and test-taking speed
            </p>
          </div>

          <button
            id="generate-diagnostic-report-btn"
            onClick={handleGenerateReport}
            disabled={isLoadingReport}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            {isLoadingReport ? 'Synthesizing Analytics...' : 'Generate Diagnostic Report'}
          </button>
        </div>

        {aiReport ? (
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-2xl border border-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line animate-fade-in font-sans">
            {aiReport}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
            Generate an AI diagnostic report to view high-yield advice for your target {profile?.targetExam || 'JAMB'} cut-off score.
          </div>
        )}
      </div>
    </div>
  );
};
