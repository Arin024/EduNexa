import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Calculator as CalcIcon,
  Send,
  RotateCcw,
  Sparkles,
  Trophy,
  BarChart3,
  X,
  Target,
  Check,
  BookOpen,
  Layers,
  Clock,
  Flag,
  AlertTriangle,
  TrendingUp,
  Award,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Subject,
  CbtActiveQuestion,
  CbtResult,
  CbtSessionState,
  SubjectScoreBreakdown,
  TopicScoreBreakdown,
  CbtQuestionReview,
} from '../types';

const SESSION_STORAGE_KEY = 'naijaprep_active_cbt_session_v1';

export const CbtExamView: React.FC = () => {
  const { user, profile, triggerConfetti, addToast, setActiveTab, refreshUserData } = useApp();

  // Test states
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [examResult, setExamResult] = useState<CbtResult | null>(null);
  const [activeSession, setActiveSession] = useState<CbtSessionState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration state
  const [examType, setExamType] = useState<'JAMB' | 'WAEC' | 'NECO'>(profile?.targetExam || 'JAMB');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [showPastAttempts, setShowPastAttempts] = useState(false);

  // Active examination state
  const [examQuestions, setExamQuestions] = useState<CbtActiveQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(1200);
  const [initialTimeSec, setInitialTimeSec] = useState<number>(1200);

  // Modals & Tools
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Results review filter
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');

  // Load available subjects when examType changes
  useEffect(() => {
    let isMounted = true;
    const loadSubjects = async () => {
      try {
        setIsLoadingConfig(true);
        const subs = await api.getSubjects(examType);
        if (!isMounted) return;
        setAvailableSubjects(subs);

        // Pre-select subjects based on candidate profile or defaults
        const defaultIds: string[] = [];
        if (profile?.selectedSubjects && profile.selectedSubjects.length > 0) {
          const profileMatched = subs.filter((s) => profile.selectedSubjects.includes(s.id)).map((s) => s.id);
          if (profileMatched.length > 0) {
            defaultIds.push(...profileMatched);
          }
        }

        if (defaultIds.length === 0) {
          // Default to first 4 subjects (or all if fewer)
          defaultIds.push(...subs.slice(0, 4).map((s) => s.id));
        }

        setSelectedSubjectIds(defaultIds);
      } catch (err) {
        console.error('Failed to load subjects for CBT', err);
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    };
    loadSubjects();
    return () => {
      isMounted = false;
    };
  }, [examType, profile]);

  // Load past CBT attempts for history
  useEffect(() => {
    const loadPast = async () => {
      try {
        const attempts = await api.getCbtAttempts();
        setPastAttempts(attempts || []);
      } catch {
        // ignore
      }
    };
    loadPast();
  }, [examFinished]);

  // Check for saved active session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedSessionId) return;

        const data = await api.getCbtSession(savedSessionId);
        if (data && data.session && !data.session.isSubmitted) {
          const expiresAtMs = new Date(data.session.expiresAt).getTime();
          const nowMs = Date.now();
          const remainingSec = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));

          if (remainingSec > 0) {
            setActiveSession(data.session);
            setExamType(data.session.examType);
            setExamQuestions(data.questions);
            setUserAnswers(data.session.savedAnswers || {});
            setFlaggedQuestions(data.session.savedFlags || {});
            setTimeLeftSec(remainingSec);
            setInitialTimeSec(data.session.durationMinutes * 60);
            setExamStarted(true);
            setExamFinished(false);
            addToast({
              title: 'CBT Session Resumed',
              message: 'Your active exam in progress has been restored.',
              type: 'info',
            });
          } else {
            // Expired session
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error recovering CBT session', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    checkExistingSession();
  }, []);

  // Sync answers with backend & localStorage periodically
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = (answers: Record<string, 'A' | 'B' | 'C' | 'D'>, flags: Record<string, boolean>) => {
    if (!activeSession) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveCbtProgress({
          sessionId: activeSession.sessionId,
          answers,
          flags,
        });
      } catch {
        // ignore background save errors
      }
    }, 1500);
  };

  // Timer countdown
  useEffect(() => {
    if (!examStarted || examFinished) return;

    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, examFinished]);

  // Keyboard navigation shortcuts (JAMB 8-key standard: A, B, C, D, N, P, R, S)
  useEffect(() => {
    if (!examStarted || examFinished || showSubmitModal || showCalculator) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const currentQ = examQuestions[currentIndex];
        if (currentQ) {
          handleSelectAnswer(currentQ.id, key as 'A' | 'B' | 'C' | 'D');
        }
      } else if (key === 'N' || e.key === 'ArrowRight') {
        handleNext();
      } else if (key === 'P' || e.key === 'ArrowLeft') {
        handlePrev();
      } else if (key === 'R') {
        toggleFlag();
      } else if (key === 'S') {
        setShowSubmitModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examStarted, examFinished, currentIndex, examQuestions, showSubmitModal, showCalculator]);

  // Start CBT Examination
  const handleStartExam = async () => {
    if (selectedSubjectIds.length === 0) {
      addToast({
        title: 'Select at least one subject',
        message: 'Please choose which subject(s) you want to include in this examination.',
        type: 'info',
      });
      return;
    }

    const finalCount = customQuestionCount ? parseInt(customQuestionCount, 10) || 20 : questionCount;
    const calcDuration = durationMinutes || Math.max(10, Math.round(finalCount * 1));

    try {
      setIsLoadingConfig(true);
      const data = await api.startCbtExam({
        examType,
        subjectIds: selectedSubjectIds,
        questionCount: finalCount,
        durationMinutes: calcDuration,
      });

      if (!data.questions || data.questions.length === 0) {
        addToast({
          title: 'No Questions Found',
          message: 'No active questions found for the selected examination criteria.',
          type: 'info',
        });
        return;
      }

      setActiveSession(data.session);
      setExamQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      const totalSec = calcDuration * 60;
      setTimeLeftSec(totalSec);
      setInitialTimeSec(totalSec);
      setExamStarted(true);
      setExamFinished(false);
      setExamResult(null);

      // Save session id in localStorage for reload safety
      localStorage.setItem(SESSION_STORAGE_KEY, data.session.sessionId);

      addToast({
        title: `${examType} CBT Exam Started`,
        message: `${data.questions.length} questions loaded. Timer set to ${calcDuration} minutes. Good luck!`,
        type: 'info',
      });
    } catch (err: any) {
      addToast({
        title: 'Could not launch examination',
        message: err.message || 'Please check your connection and retry.',
        type: 'info',
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Answer selection
  const handleSelectAnswer = (qId: string, option: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: option };
      triggerAutoSave(updated, flaggedQuestions);
      return updated;
    });
  };

  // Flag for review toggle
  const toggleFlag = () => {
    const currentQ = examQuestions[currentIndex];
    if (!currentQ) return;
    setFlaggedQuestions((prev) => {
      const updated = { ...prev, [currentQ.id]: !prev[currentQ.id] };
      triggerAutoSave(userAnswers, updated);
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Auto-submit when time expires
  const handleAutoSubmitOnExpiry = async () => {
    addToast({
      title: 'Time Expired!',
      message: 'Your examination time has elapsed. Submitting responses now...',
      type: 'info',
    });
    await executeSubmission();
  };

  // Candidate confirmation submit
  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    await executeSubmission();
  };

  // Core submission execution
  const executeSubmission = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = Math.max(1, initialTimeSec - timeLeftSec);
    const avgTimePerQuestion = Math.round(timeSpent / Math.max(1, examQuestions.length));

    const answersPayload = examQuestions.map((q) => ({
      questionId: q.id,
      chosenAnswer: userAnswers[q.id] || null,
      timeSpentSec: avgTimePerQuestion,
    }));

    try {
      const data = await api.submitCbtExam({
        sessionId: activeSession?.sessionId,
        examType,
        answers: answersPayload,
        timeTakenSec: timeSpent,
      });

      setExamResult(data.result);
      setExamFinished(true);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      await refreshUserData();
      triggerConfetti();

      addToast({
        title: `CBT Exam Complete! Score: ${data.result.totalScore}/${data.result.maxScore}`,
        message: `+${data.result.xpEarned} XP awarded! Results recorded.`,
        type: 'achievement',
      });
    } catch (err: any) {
      addToast({
        title: 'Submission Error',
        message: err.message || 'Error grading examination. Please retry.',
        type: 'info',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculator button handler
  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === '=') {
      try {
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(res));
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      if (calcDisplay === '0' && val !== '.') {
        setCalcDisplay(val);
      } else {
        setCalcDisplay((prev) => prev + val);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Derived counts
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = Math.max(0, examQuestions.length - answeredCount);
  const currentQ = examQuestions[currentIndex];

  // Subject groups for tabs if multi-subject
  const subjectGroups = useMemo(() => {
    const map = new Map<string, { count: number; name: string; firstIndex: number }>();
    examQuestions.forEach((q, idx) => {
      const sId = q.subjectId;
      const sName = q.subjectName || 'General';
      if (!map.has(sId)) {
        map.set(sId, { count: 0, name: sName, firstIndex: idx });
      }
      map.get(sId)!.count += 1;
    });
    return Array.from(map.entries()).map(([subjectId, data]) => ({
      subjectId,
      ...data,
    }));
  }, [examQuestions]);

  // Filtered review questions
  const filteredReviewList = useMemo(() => {
    if (!examResult?.detailedReview) return [];
    return examResult.detailedReview.filter((item) => {
      if (reviewFilter === 'correct') return item.isCorrect;
      if (reviewFilter === 'wrong') return !item.isCorrect && item.chosenAnswer !== null;
      if (reviewFilter === 'unanswered') return item.chosenAnswer === null;
      return true;
    });
  }, [examResult, reviewFilter]);

  // ==========================================
  // VIEW 1: CBT SETUP & SELECTION SCREEN
  // ==========================================
  if (!examStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Header Hero Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
              <Timer className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
                  National CBT Examination Simulator
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  JAMB • WAEC • NECO
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Authentic full-fidelity computer-based testing simulation with deterministic server-side grading,
                real-time countdowns, Nigerian 8-key keyboard controls, and comprehensive diagnostic breakdowns.
              </p>
            </div>
          </div>

          {/* Active Session Recovery Alert if present */}
          {activeSession && !activeSession.isSubmitted && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PlayIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block text-sm">Active Exam Session Detected</span>
                  <span className="text-emerald-800">
                    You have an in-progress {activeSession.examType} mock test ({activeSession.totalQuestions} questions).
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExamStarted(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                Resume Active Exam
              </button>
            </div>
          )}

          {/* STEP 1: Select Examination */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                <span>Select Examination Body</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { type: 'JAMB', title: 'JAMB UTME', subtitle: '4 Subjects • 400 Scale • High Speed' },
                  { type: 'WAEC', title: 'WAEC SSCE', subtitle: 'Senior Secondary • A1 - F9 Scale' },
                  { type: 'NECO', title: 'NECO SSCE', subtitle: 'National Examination Council Standard' },
                ] as const
              ).map((item) => {
                const isSelected = examType === item.type;
                return (
                  <button
                    key={item.type}
                    id={`cbt-select-exam-${item.type}`}
                    type="button"
                    onClick={() => setExamType(item.type)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-base font-extrabold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Subject(s) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                <span>Select Subject(s) for Mock Exam</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectIds(availableSubjects.map((s) => s.id))}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedSubjectIds([])}
                  className="text-[11px] text-slate-500 font-semibold hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {isLoadingConfig ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                Loading available curriculum subjects...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      id={`cbt-subject-check-${sub.id}`}
                      onClick={() => {
                        setSelectedSubjectIds((prev) =>
                          isChecked ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold truncate pr-1">{sub.name}</span>
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                          isChecked ? 'bg-white text-emerald-700 font-black' : 'border border-slate-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Selected: <strong className="text-slate-800">{selectedSubjectIds.length}</strong> subject(s)
              {examType === 'JAMB' && selectedSubjectIds.length !== 4 && (
                <span className="text-amber-700 ml-1">(JAMB UTME typically tests 4 registered subjects)</span>
              )}
            </p>
          </div>

          {/* STEP 3: Select Number of Questions & Duration */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">3</span>
              <span>Question Count & Timer Allocation</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { count: 10, label: '10 Questions', duration: 10, tag: 'Rapid Sprint' },
                { count: 20, label: '20 Questions', duration: 20, tag: 'Standard Drill' },
                { count: 40, label: '40 Questions', duration: 40, tag: 'Half Mock' },
                { count: 60, label: '60 Questions', duration: 60, tag: 'Full Subject Exam' },
              ].map((opt) => {
                const isSelected = !customQuestionCount && questionCount === opt.count;
                return (
                  <button
                    key={opt.count}
                    id={`cbt-opt-${opt.count}`}
                    type="button"
                    onClick={() => {
                      setQuestionCount(opt.count);
                      setCustomQuestionCount('');
                      setDurationMinutes(opt.duration);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-extrabold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{opt.duration} Minutes</span>
                      <span className="font-semibold text-emerald-700">{opt.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Question Count & Duration */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="text-slate-600 font-semibold">Or custom questions:</span>
              <input
                type="number"
                min="5"
                max="100"
                placeholder="e.g. 30"
                value={customQuestionCount}
                onChange={(e) => {
                  setCustomQuestionCount(e.target.value);
                  const num = parseInt(e.target.value, 10);
                  if (num > 0) {
                    setDurationMinutes(Math.max(5, num));
                  }
                }}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {customQuestionCount && (
                <span className="text-slate-500">
                  Allocated time: <strong>{durationMinutes} minutes</strong>
                </span>
              )}
            </div>
          </div>

          {/* Examination Rules & Pro Keyboard Shortcuts */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between text-yellow-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Official Examination Rules & Controls
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Authentic Nigerian CBT
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              • <strong>Deterministic Grading:</strong> Scoring is verified server-side against official examination answer keys. Correct answers are kept secure until final submission.
            </p>
            <p className="text-slate-300 leading-relaxed">
              • <strong>Pro 8-Key Shortcuts:</strong> Press <strong>A, B, C, D</strong> to pick options • <strong>N</strong> or <strong>Right Arrow</strong> for Next • <strong>P</strong> or <strong>Left Arrow</strong> for Previous • <strong>R</strong> to flag for review • <strong>S</strong> to submit.
            </p>
          </div>

          {/* Launch Exam Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              id="start-cbt-exam-btn"
              type="button"
              disabled={isLoadingConfig || selectedSubjectIds.length === 0}
              onClick={handleStartExam}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Launch {examType} CBT Exam Simulation</span>
            </button>

            {pastAttempts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPastAttempts(!showPastAttempts)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{showPastAttempts ? 'Hide Past Mock History' : `View Past Mock Scores (${pastAttempts.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Past Attempts Drawer / List if toggled */}
        {showPastAttempts && pastAttempts.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Your CBT Mock Exam History
            </h3>
            <div className="divide-y divide-slate-100">
              {pastAttempts.map((att: any) => (
                <div key={att.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{att.examType} Mock Examination</span>
                    <span className="text-slate-500 block text-[11px]">
                      {new Date(att.timestamp).toLocaleDateString()} • {Math.round(att.timeTakenSec / 60)} mins used
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 text-sm">
                      {att.totalScore} / {att.maxScore}
                    </span>
                    <span className="text-slate-500 block text-[10px] font-bold">
                      {att.percentage}% Accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: CBT RESULTS & DIAGNOSTIC SLIP
  // ==========================================
  if (examFinished && examResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Results Banner & Official Slip Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-5 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-yellow-300 font-bold text-xs uppercase tracking-wider">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Official {examResult.examType} CBT Examination Result Slip</span>
            </div>
            <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Completed in {Math.round(examResult.timeTakenSec / 60)} mins {examResult.timeTakenSec % 60}s
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-6 pt-1">
            <div>
              <span className="text-xs text-emerald-300 block uppercase font-bold tracking-wider">
                Total Scaled Score:
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl sm:text-6xl font-black text-white font-serif tracking-tight">
                  {examResult.totalScore}
                </span>
                <span className="text-emerald-300 text-xl font-bold">/ {examResult.maxScore}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Candidate: <strong className="text-white">{user?.fullName || 'Candidate'}</strong> • Verified Server Evaluation
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-700 sm:pl-6 space-y-1">
              <span className="text-xs text-emerald-300 block uppercase font-bold tracking-wider">
                Accuracy & Performance:
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-yellow-300">
                {examResult.percentage}%
              </span>
              <p className="text-xs text-emerald-100 max-w-xs leading-relaxed">
                {examResult.percentage >= 70
                  ? '🌟 Outstanding! Exceeds competitive university cut-offs.'
                  : 'Good mock effort! Focus on your detected weak topics below to achieve 300+.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges: Correct, Wrong, Unanswered */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10 text-xs">
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-2xl text-center">
              <span className="text-emerald-300 block font-semibold text-[11px]">Correct Answers</span>
              <span className="text-xl font-black text-emerald-200">{examResult.numberCorrect}</span>
            </div>
            <div className="bg-red-950/60 border border-red-500/30 p-3 rounded-2xl text-center">
              <span className="text-red-300 block font-semibold text-[11px]">Incorrect Answers</span>
              <span className="text-xl font-black text-red-200">{examResult.numberWrong}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/30 p-3 rounded-2xl text-center">
              <span className="text-amber-300 block font-semibold text-[11px]">Unanswered</span>
              <span className="text-xl font-black text-amber-200">{examResult.numberUnanswered}</span>
            </div>
            <div className="bg-purple-950/60 border border-purple-500/30 p-3 rounded-2xl text-center">
              <span className="text-purple-300 block font-semibold text-[11px]">XP Earned</span>
              <span className="text-xl font-black text-purple-200">+{examResult.xpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* Action Recommendations Box */}
        {examResult.studyRecommendations && examResult.studyRecommendations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-2">
            <h3 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-700" />
              <span>Targeted Study Recommendations (Weakness Engine)</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-900">
              {examResult.studyRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Subject-by-Subject Breakdown */}
        {examResult.subjectScores && examResult.subjectScores.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Subject Performance Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {examResult.subjectScores.map((sub: SubjectScoreBreakdown) => (
                <div
                  key={sub.subjectId}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{sub.subjectName}</h4>
                    <span className="text-base font-black text-emerald-700">
                      {sub.score} <span className="text-xs text-slate-400 font-normal">/ {sub.total}</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>
                      {sub.correct} Correct • {sub.wrong} Wrong • {sub.unanswered} Blank
                    </span>
                    <strong className="text-slate-700">{sub.percentage}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Breakdown */}
        {examResult.topicScores && examResult.topicScores.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Topic Diagnostics & Mastery</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {examResult.topicScores.map((topic: TopicScoreBreakdown) => {
                let badgeClass = 'bg-red-50 text-red-700 border-red-200';
                if (topic.status === 'mastered') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                else if (topic.status === 'improving') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div key={topic.topicId} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate pr-1">{topic.topicName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badgeClass}`}>
                        {topic.status === 'weak' ? 'Weak Topic' : topic.status === 'improving' ? 'Improving' : 'Mastered'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{topic.subjectName}</p>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-slate-600">
                        {topic.score} / {topic.total} Correct
                      </span>
                      <strong className="text-slate-800">{topic.percentage}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question-by-Question Review with Filter Tabs */}
        {examResult.detailedReview && examResult.detailedReview.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Comprehensive Question Review</span>
              </h3>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                {(
                  [
                    { key: 'all', label: 'All Questions' },
                    { key: 'correct', label: `Correct (${examResult.numberCorrect})` },
                    { key: 'wrong', label: `Incorrect (${examResult.numberWrong})` },
                    { key: 'unanswered', label: `Unanswered (${examResult.numberUnanswered})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setReviewFilter(tab.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      reviewFilter === tab.key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3.5">
              {filteredReviewList.map((item: CbtQuestionReview, idx: number) => {
                const isSkipped = item.chosenAnswer === null;
                const isRight = item.isCorrect;

                return (
                  <div
                    key={item.questionId}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2.5 transition-all ${
                      isRight
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isSkipped
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-red-50/40 border-red-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">Question {idx + 1}</span>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {item.subjectName} • {item.topicName}
                        </span>
                        {item.year && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            {item.year} Past Question
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isRight
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isSkipped
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {isRight
                          ? '✓ Correct'
                          : isSkipped
                          ? '⚠️ Unanswered (Skipped)'
                          : `✗ Wrong (Chose ${item.chosenAnswer})`}
                      </span>
                    </div>

                    {item.passage && (
                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs italic text-slate-700">
                        {item.passage}
                      </div>
                    )}

                    <p className="font-bold text-slate-900 leading-relaxed">{item.questionText}</p>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const isCorrectOption = item.correctAnswer === opt;
                        const isUserOption = item.chosenAnswer === opt;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isCorrectOption) {
                          optClass = 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400';
                        } else if (isUserOption && !item.isCorrect) {
                          optClass = 'bg-red-100/80 border-red-400 text-red-950 font-bold line-through';
                        }

                        return (
                          <div
                            key={opt}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${optClass}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                isCorrectOption
                                  ? 'bg-emerald-600 text-white'
                                  : isUserOption
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt}
                            </span>
                            <span className="truncate">{item.options[opt]}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Marking note */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/90 text-xs space-y-1">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-emerald-800">
                        Examiner's Explanation & Marking Note:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{item.explanation}</p>
                      {!isRight && (
                        <span className="text-[10px] text-amber-700 font-semibold block pt-1">
                          📌 Auto-logged to your Mistake Bank for spaced revision drills.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              setExamStarted(false);
              setExamFinished(false);
              setExamResult(null);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Launch Another Mock Exam</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow transition-all hover:scale-105"
          >
            <span>Review Mistake Bank ({examResult.numberWrong + examResult.numberUnanswered} items)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE CBT EXAMINATION INTERFACE
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in select-none pb-12">
      {/* 1. Official CBT Header */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
            {examType}
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 flex items-center gap-2">
              <span>{user?.fullName || 'Candidate'}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                ID: {profile?.userId.slice(-6) || '2025'}
              </span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">
              Official Computer-Based Testing Interface • Verified Answer Key
            </span>
          </div>
        </div>

        {/* Countdown Timer Display */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm tracking-wider shadow-inner ${
              timeLeftSec < 180
                ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                : timeLeftSec < 300
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-slate-900 text-emerald-300 border-slate-700'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>{formatTimer(timeLeftSec)}</span>
          </div>

          {/* Calculator Trigger */}
          <button
            id="cbt-calc-btn"
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
            title="JAMB Standard Calculator"
          >
            <CalcIcon className="w-4 h-4" />
          </button>

          {/* Submit Test Trigger */}
          <button
            id="cbt-submit-btn"
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Grading...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Tabs for Multi-Subject Mock Tests */}
      {subjectGroups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {subjectGroups.map((grp) => {
            const isCurrentSubject = currentQ?.subjectId === grp.subjectId;
            return (
              <button
                key={grp.subjectId}
                type="button"
                onClick={() => setCurrentIndex(grp.firstIndex)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all ${
                  isCurrentSubject
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{grp.name}</span>
                <span className="text-[10px] ml-1.5 opacity-80">({grp.count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Main Exam Arena: Question Area + Palette Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column (3 cols): Question & Options */}
        <div className="lg:col-span-3 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[480px]">
          {currentQ ? (
            <div className="space-y-5">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Question {currentIndex + 1} of {examQuestions.length}
                  </span>

                  <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                    {currentQ.subjectName}
                  </span>

                  {currentQ.sourceType === 'verified_past_question' ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      Verified {currentQ.examType} {currentQ.year ? `(${currentQ.year})` : ''} Past Question
                    </span>
                  ) : currentQ.sourceType === 'original_practice' ? (
                    <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      Original Practice Question
                    </span>
                  ) : (
                    <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      <span>AI Practice Drill</span>
                    </span>
                  )}

                  {currentQ.topicName && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {currentQ.topicName}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleFlag}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border transition-colors ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      flaggedQuestions[currentQ.id] ? 'fill-amber-600 text-amber-600' : ''
                    }`}
                  />
                  <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review (R)' : 'Flag Question (R)'}</span>
                </button>
              </div>

              {/* Passage if reading comprehension / English novel */}
              {currentQ.passage && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 italic leading-relaxed">
                  {currentQ.passage}
                </div>
              )}

              {/* Question Text */}
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                {currentQ.questionText}
              </p>

              {/* Four Options: A, B, C, D */}
              <div className="space-y-2.5 pt-2">
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const isSelected = userAnswers[currentQ.id] === key;
                  return (
                    <button
                      key={key}
                      id={`cbt-option-${key}`}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQ.id, key)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {key}
                      </span>
                      <span className="text-sm font-medium pt-0.5 leading-snug">
                        {currentQ.options[key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Navigation Controls: Previous & Next */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              id="cbt-prev-btn"
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous (P)</span>
            </button>

            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              Answered: <strong className="text-emerald-700">{answeredCount}</strong> • Unanswered:{' '}
              <strong className="text-slate-800">{unansweredCount}</strong>
            </span>

            {currentIndex === examQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
              >
                <span>Final Submit (S)</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="cbt-next-btn"
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                <span>Next (N)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Question Palette Grid & Legend */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Question Palette</h4>
            <span className="text-[11px] font-extrabold text-emerald-700">
              {answeredCount} / {examQuestions.length}
            </span>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-1.5 max-h-72 overflow-y-auto pr-1">
            {examQuestions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id];
              const isFlagged = !!flaggedQuestions[q.id];
              const isCurrent = idx === currentIndex;

              let cellColor = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isFlagged) {
                cellColor = 'bg-amber-400 text-slate-950 font-bold border-amber-500';
              } else if (isAnswered) {
                cellColor = 'bg-emerald-600 text-white font-bold border-emerald-700';
              }

              return (
                <button
                  key={q.id}
                  id={`cbt-palette-q-${idx + 1}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl text-xs flex items-center justify-center border transition-all ${cellColor} ${
                    isCurrent ? 'ring-2 ring-slate-900 ring-offset-1 font-black scale-105 shadow-sm' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="text-[11px] space-y-2 pt-2 border-t border-slate-100 text-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600" />
                <span>Answered</span>
              </div>
              <strong className="text-emerald-700">{answeredCount}</strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-200" />
                <span>Unanswered</span>
              </div>
              <strong className="text-slate-800">{unansweredCount}</strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-400" />
                <span>Flagged (R)</span>
              </div>
              <strong className="text-amber-800">
                {Object.values(flaggedQuestions).filter(Boolean).length}
              </strong>
            </div>
          </div>

          {/* Quick Submit Button in Palette */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-center border border-slate-200"
            >
              Submit Examination
            </button>
          </div>
        </div>
      </div>

      {/* On-Screen Standard JAMB 8-Function Calculator */}
      {showCalculator && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 z-50 bg-slate-950 text-white p-4 rounded-3xl shadow-2xl border border-slate-800 w-72 max-w-[calc(100vw-1rem)] animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="text-xs font-bold text-slate-300">JAMB Standard Calculator</span>
            <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl text-right font-mono text-xl mb-3 overflow-x-auto text-emerald-400 border border-slate-800 shadow-inner">
            {calcDisplay}
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {['C', '(', ')', '/'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleCalcButton(b)}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
              >
                {b}
              </button>
            ))}
            {['7', '8', '9', '*'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleCalcButton(b)}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                {b}
              </button>
            ))}
            {['4', '5', '6', '-'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleCalcButton(b)}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                {b}
              </button>
            ))}
            {['1', '2', '3', '+'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleCalcButton(b)}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                {b}
              </button>
            ))}
            {['0', '.', '=', ' '].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => b !== ' ' && handleCalcButton(b)}
                className={`p-2.5 rounded-lg ${
                  b === '='
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white col-span-2'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900">Confirm Exam Submission</h3>
              <p className="text-xs text-slate-500">
                Are you ready to submit your answers for deterministic server grading?
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{examQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unanswered Questions:</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
                  {unansweredCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time Remaining:</span>
                <span className="font-bold text-slate-800 font-mono">{formatTimer(timeLeftSec)}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center leading-relaxed">
                ⚠️ You have <strong>{unansweredCount} unanswered questions</strong>! In JAMB & WAEC, unanswered questions earn 0 marks; there is no negative marking, so never leave any question blank.
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Return to Exam
              </button>
              <button
                id="cbt-confirm-submit-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Grading...' : 'Yes, Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
