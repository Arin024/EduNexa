import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Play,
  Filter,
  Search,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  X,
  Award,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MistakeItem, Question, Subject } from '../types';

export const MistakeBankView: React.FC = () => {
  const { addToast, triggerConfetti, openTutorWithPrompt } = useApp();

  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'mastered'>('unresolved');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Single Question Quick Retry
  const [retryingItem, setRetryingItem] = useState<MistakeItem | null>(null);
  const [retryAnswer, setRetryAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [retryResult, setRetryResult] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [isSubmittingRetry, setIsSubmittingRetry] = useState<boolean>(false);

  // Practice My Mistakes Interactive Session
  const [isPracticingSession, setIsPracticingSession] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [sessionSubmitted, setSessionSubmitted] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [sessionReviewVisible, setSessionReviewVisible] = useState<boolean>(false);

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = async () => {
    setIsLoading(true);
    try {
      const [mistakesList, subjectsList] = await Promise.all([
        api.getMistakes(),
        api.getSubjects().catch(() => []),
      ]);
      setMistakes(mistakesList);
      setSubjects(subjectsList);
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start "Practice My Mistakes" Session
  const handleStartPracticeSession = async () => {
    try {
      const res = await api.generateMistakePracticeSession({
        subjectId: subjectFilter !== 'all' ? subjectFilter : undefined,
        limit: 20,
      });

      if (!res.questions || res.questions.length === 0) {
        addToast({
          title: 'No Mistakes to Practice',
          message: 'All mistakes in this category are already mastered! Try switching subjects.',
          type: 'info',
        });
        return;
      }

      setPracticeQuestions(res.questions);
      setCurrentIndex(0);
      setSessionAnswers({});
      setSessionSubmitted(false);
      setSessionScore(0);
      setSessionReviewVisible(false);
      setIsPracticingSession(true);
    } catch (err) {
      console.error('Failed to start practice session:', err);
      addToast({
        title: 'Could Not Start Session',
        message: 'Error generating practice session from previous mistakes.',
        type: 'info',
      });
    }
  };

  // Answer selection in Practice Session
  const handleSelectSessionOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (sessionSubmitted) return;
    const currentQ = practiceQuestions[currentIndex];
    if (!currentQ) return;

    setSessionAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));

    // Submit attempt to backend to evaluate and update mistake bank
    try {
      const res = await api.submitAnswer({
        questionId: currentQ.id,
        chosenAnswer: option,
        timeSpentSec: 20,
        mode: 'mistake_retry',
      });

      if (res.isCorrect) {
        triggerConfetti();
        addToast({
          title: 'Conquered! +20 XP',
          message: 'Mistake mastered and updated in your bank.',
          type: 'achievement',
        });
      }
    } catch (e) {
      console.error('Error submitting mistake retry answer:', e);
    }
  };

  const handleFinishPracticeSession = () => {
    let score = 0;
    practiceQuestions.forEach((q) => {
      if (sessionAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });
    setSessionScore(score);
    setSessionSubmitted(true);
    setSessionReviewVisible(true);
    loadMistakes(); // refresh state
  };

  // Quick Retry Modal Handlers
  const startSingleRetry = (item: MistakeItem) => {
    setRetryingItem(item);
    setRetryAnswer(null);
    setRetryResult(null);
  };

  const submitSingleRetry = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (!retryingItem || isSubmittingRetry) return;
    setRetryAnswer(option);
    setIsSubmittingRetry(true);

    try {
      const result = await api.submitAnswer({
        questionId: retryingItem.questionId,
        chosenAnswer: option,
        timeSpentSec: 25,
        mode: 'mistake_retry',
      });

      setRetryResult({
        isCorrect: result.isCorrect,
        explanation: retryingItem.question.explanation || retryingItem.explanation,
      });

      if (result.isCorrect) {
        triggerConfetti();
        addToast({
          title: 'Mastered! +20 XP Bonus',
          message: 'You resolved this previous mistake!',
          type: 'achievement',
        });
        loadMistakes();
      } else {
        addToast({
          title: 'Still not quite right',
          message: 'Carefully study the step-by-step marking guide below.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRetry(false);
    }
  };

  // Filtered mistakes list
  const filteredMistakes = mistakes.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && m.subjectId !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = m.question.questionText.toLowerCase().includes(q);
      const matchTopic = (m.topicName || '').toLowerCase().includes(q);
      const matchSubject = (m.subjectName || '').toLowerCase().includes(q);
      if (!matchText && !matchTopic && !matchSubject) return false;
    }
    return true;
  });

  const unresolvedCount = mistakes.filter((m) => m.status === 'unresolved').length;
  const masteredCount = mistakes.filter((m) => m.status === 'mastered').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 1. Header Overview */}
      <div className="bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Deterministic Mistake Bank</span>
          </div>

          <button
            id="practice-my-mistakes-header-btn"
            onClick={handleStartPracticeSession}
            disabled={mistakes.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Practice My Mistakes</span>
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Mistake Bank
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Every meaningful incorrect answer across your CBT mocks and practice drills is preserved here.
            Review what you selected versus the correct answer and practice targeted sets to eliminate recurring errors.
          </p>
        </div>

        {/* Counter Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Needs Mastery Tab Button */}
          <div
            onClick={() => setStatusFilter('unresolved')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'unresolved'
                ? 'bg-red-500/20 border-red-400 ring-2 ring-red-400/50'
                : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-red-300 font-semibold mb-1">
              <span>Needs Mastery</span>
              <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded font-bold">Unresolved</span>
            </div>
            <div className="text-2xl font-black text-red-400">{unresolvedCount} Questions</div>
            <p className="text-[10px] text-red-200/80 mt-1">Requires re-attempt and understanding</p>
          </div>

          {/* Mastered Tab Button */}
          <div
            onClick={() => setStatusFilter('mastered')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'mastered'
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
              <span>Mastered</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Resolved</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{masteredCount} Questions</div>
            <p className="text-[10px] text-emerald-200/80 mt-1">Retried and conquered successfully</p>
          </div>

          {/* Total Banked */}
          <div
            onClick={() => setStatusFilter('all')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-700/50 border-slate-400 ring-2 ring-slate-400/50'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Total Banked</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-bold">All History</span>
            </div>
            <div className="text-2xl font-black text-white">{mistakes.length} Questions</div>
            <p className="text-[10px] text-slate-400 mt-1">Full mistake archive & tracking</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Practice Session Runner (When Active) */}
      {isPracticingSession && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {currentIndex + 1}
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Practice My Mistakes Session
                </h3>
                <p className="text-xs text-slate-500">
                  Question {currentIndex + 1} of {practiceQuestions.length} • Previous mistakes drill
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPracticingSession(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl"
            >
              Exit Session
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Current Question */}
          {practiceQuestions[currentIndex] && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    {practiceQuestions[currentIndex].examType} {practiceQuestions[currentIndex].year}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {subjects.find((s) => s.id === practiceQuestions[currentIndex].subjectId)?.name || 'General'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Topic ID: {practiceQuestions[currentIndex].topicId}
                  </span>
                </div>

                {practiceQuestions[currentIndex].passage && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto italic font-serif">
                    {practiceQuestions[currentIndex].passage}
                  </div>
                )}

                <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                  {practiceQuestions[currentIndex].questionText}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const optText = practiceQuestions[currentIndex].options[optKey];
                  const chosen = sessionAnswers[practiceQuestions[currentIndex].id];
                  const isSelected = chosen === optKey;
                  const isCorrect = practiceQuestions[currentIndex].correctAnswer === optKey;

                  let styleClass = 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-800';

                  if (chosen) {
                    if (isCorrect) {
                      styleClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                    } else if (isSelected) {
                      styleClass = 'bg-red-50 border-red-500 text-red-950 font-bold';
                    } else {
                      styleClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectSessionOption(optKey)}
                      disabled={!!chosen}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${styleClass}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {optKey}
                      </span>
                      <span className="text-xs sm:text-sm leading-relaxed">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Result after answering */}
              {sessionAnswers[practiceQuestions[currentIndex].id] && (
                <div
                  className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-2 animate-fade-in ${
                    sessionAnswers[practiceQuestions[currentIndex].id] ===
                    practiceQuestions[currentIndex].correctAnswer
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {sessionAnswers[practiceQuestions[currentIndex].id] ===
                    practiceQuestions[currentIndex].correctAnswer ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span>
                      {sessionAnswers[practiceQuestions[currentIndex].id] ===
                      practiceQuestions[currentIndex].correctAnswer
                        ? 'Mastered! You solved your previous mistake!'
                        : 'Not quite. Here is the marking guide explanation:'}
                    </span>
                  </div>
                  <p>{practiceQuestions[currentIndex].explanation}</p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 px-4 py-2 rounded-xl transition-colors"
                >
                  ← Previous
                </button>

                {currentIndex < practiceQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <span>Next Mistake</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishPracticeSession}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl shadow-md transition-colors"
                  >
                    Finish Session ({Object.keys(sessionAnswers).length}/{practiceQuestions.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Session Summary Card */}
          {sessionSubmitted && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 animate-fade-in text-center">
              <Award className="w-12 h-12 text-yellow-400 mx-auto" />
              <h4 className="text-xl font-bold font-serif">Mistakes Practice Completed!</h4>
              <p className="text-slate-300 text-sm">
                You mastered <strong className="text-emerald-400">{sessionScore}</strong> out of{' '}
                <strong>{practiceQuestions.length}</strong> previous mistakes.
              </p>
              <button
                onClick={() => setIsPracticingSession(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl"
              >
                Back to Mistake Bank
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search question, topic or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Statuses ({mistakes.length})</option>
              <option value="unresolved">Needs Mastery ({unresolvedCount})</option>
              <option value="mastered">Mastered ({masteredCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Single Question Quick Retry Modal */}
      {retryingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-emerald-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                🎯 Instant Mistake Retry Drill
              </span>
              <button
                onClick={() => setRetryingItem(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800">{retryingItem.subjectName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">{retryingItem.topicName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded">
                  Attempted {retryingItem.attemptCount || 1} time{retryingItem.attemptCount > 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-base font-bold text-slate-900 leading-relaxed font-sans">
                {retryingItem.question.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => submitSingleRetry(opt)}
                  disabled={isSubmittingRetry || retryResult !== null}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-colors ${
                    retryAnswer === opt
                      ? retryResult?.isCorrect
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-red-50 border-red-500 font-bold text-red-950'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">
                    {opt}
                  </span>
                  <span className="leading-relaxed">{retryingItem.question.options[opt]}</span>
                </button>
              ))}
            </div>

            {/* Result feedback */}
            {retryResult && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-2 animate-fade-in ${
                  retryResult.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {retryResult.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>
                    {retryResult.isCorrect ? 'Mastered! Excellent correction.' : 'Still incorrect. Review the rule:'}
                  </span>
                </div>
                <p>{retryResult.explanation}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setRetryingItem(null)}
                    className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Done with Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Banked Mistakes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto mb-3" />
            Loading your mistake bank...
          </div>
        ) : filteredMistakes.length > 0 ? (
          filteredMistakes.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                item.status === 'mastered'
                  ? 'border-emerald-200/80 bg-emerald-50/10'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Card Meta Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                    {item.question.examType} {item.question.year || 2024}
                  </span>

                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {item.subjectName}
                  </span>

                  <span className="text-[11px] text-slate-600 font-medium">
                    Topic: <strong>{item.topicName}</strong>
                  </span>

                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    Attempted {item.attemptCount || 1} time{item.attemptCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.date || item.lastAttempted || Date.now()).toLocaleDateString()}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.status === 'mastered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status === 'mastered' ? '✓ Mastered' : 'Needs Mastery'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed font-sans">
                {item.question.questionText}
              </p>

              {/* Comparison Box: Selected Answer vs Correct Answer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* What Candidate Selected */}
                <div className="p-3 rounded-2xl bg-red-50/60 border border-red-200 text-red-950 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-red-800">
                    <span>You Selected ({item.selectedAnswer})</span>
                    <span className="text-[10px] uppercase font-mono">Incorrect</span>
                  </div>
                  <p className="font-semibold">
                    {item.question.options[item.selectedAnswer] || 'Answer option recorded'}
                  </p>
                </div>

                {/* Correct Marking Key */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                    <span>Correct Answer ({item.correctAnswer})</span>
                    <span className="text-[10px] uppercase font-mono">Standard Key</span>
                  </div>
                  <p className="font-semibold">
                    {item.question.options[item.correctAnswer]}
                  </p>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-1">
                <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider text-slate-500">
                  Marking Scheme Explanation:
                </span>
                <p>{item.explanation || item.question.explanation}</p>
              </div>

              {/* AI Tutor On-Demand Triggers */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() =>
                    openTutorWithPrompt(
                      `In ${item.subjectName}, for the question: "${item.question.questionText.slice(0, 100)}...", why is Option (${item.selectedAnswer}) wrong and Option (${item.correctAnswer}) correct? Please explain the distractor trap and provide a memory rule.`
                    )
                  }
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <span>⚠️</span>
                  <span>Why was Option ({item.selectedAnswer}) wrong?</span>
                </button>

                <button
                  onClick={() =>
                    openTutorWithPrompt(
                      `Teach me ${item.topicName} in ${item.subjectName} from scratch. Make it simple with a Nigerian example and a checking question.`
                    )
                  }
                  className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                  <span>Teach me {item.topicName}</span>
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Earn +20 XP when mastered
                </span>

                <button
                  onClick={() => startSingleRetry(item)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry & Master</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">
              {statusFilter === 'unresolved' ? 'No unresolved mistakes!' : 'No mistakes found.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter === 'unresolved'
                ? 'Great work! All incorrect answers have been mastered. Keep attempting practice questions and CBT exams to challenge yourself.'
                : 'Any missed question in practice drills will be added here automatically for structured correction.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
