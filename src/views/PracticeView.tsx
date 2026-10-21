import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  ArrowRight,
  Filter,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Brain,
  Zap,
  TrendingUp,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Subject, Topic, Question, AdaptivePracticeSession } from '../types';

export const PracticeView: React.FC = () => {
  const { profile, triggerConfetti, addToast, targetPracticeSubject, setTargetPracticeSubject, openTutorWithPrompt } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub_eng');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>(profile?.targetExam || 'JAMB');

  // Adaptive Learning Mode
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(true);
  const [adaptiveData, setAdaptiveData] = useState<AdaptivePracticeSession | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  const [chosenAnswer, setChosenAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gemini AI Tutor interactive states
  const [tutorMode, setTutorMode] = useState<'why_wrong' | 'more_explanation' | 'teach_topic' | null>(null);
  const [tutorConversation, setTutorConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [followUpText, setFollowUpText] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Session stats
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  useEffect(() => {
    api.getSubjects(selectedExamType).then((subs) => {
      setSubjects(subs);
      if (targetPracticeSubject && subs.some((s) => s.id === targetPracticeSubject)) {
        setSelectedSubjectId(targetPracticeSubject);
        setTargetPracticeSubject(null);
      } else if (subs.length > 0 && !subs.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subs[0].id);
      }
    });
  }, [selectedExamType]);

  useEffect(() => {
    if (selectedSubjectId) {
      api.getTopics(selectedSubjectId).then(setTopics);
      fetchQuestions();
    }
  }, [selectedSubjectId, selectedTopicId, selectedExamType, isAdaptiveMode]);

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      if (isAdaptiveMode) {
        const session = await api.getAdaptivePracticeSession({
          subjectId: selectedSubjectId,
          topicId: selectedTopicId || undefined,
          limit: 20,
        });
        setAdaptiveData(session);
        setQuestions(session.questions);
      } else {
        setAdaptiveData(null);
        const qList = await api.getQuestions({
          examType: selectedExamType,
          subjectId: selectedSubjectId,
          topicId: selectedTopicId || undefined,
          limit: 25,
        });
        setQuestions(qList);
      }
      setCurrentIndex(0);
      resetQuestionState();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const resetQuestionState = () => {
    setChosenAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setAiExplanation(null);
    setTutorMode(null);
    setTutorConversation([]);
    setFollowUpText('');
  };

  const currentQ = questions[currentIndex];

  const handleChooseOption = async (option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || !currentQ) return;
    setChosenAnswer(option);
    setIsAnswered(true);

    const result = await api.submitAnswer({
      questionId: currentQ.id,
      chosenAnswer: option,
      timeSpentSec: 15,
      mode: 'practice',
    });

    setIsCorrect(result.isCorrect);
    setSessionTotal((prev) => prev + 1);

    if (result.isCorrect) {
      setSessionCorrect((prev) => prev + 1);
      triggerConfetti();
      addToast({
        title: `Correct! +${result.xpEarned} XP`,
        type: 'xp',
      });
    } else {
      addToast({
        title: `Incorrect (+5 XP attempt)`,
        message: `Saved to your Mistake Bank for review`,
        type: 'info',
      });
    }

    if (result.levelUp) {
      addToast({
        title: `Level Up! Level ${result.profile.currentLevel} Achieved! 🎉`,
        type: 'achievement',
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetQuestionState();
    } else {
      fetchQuestions();
    }
  };

  // 1. "Why is my answer wrong?" - Diagnoses distractor trap
  const handleAskWhyWrong = async () => {
    if (!currentQ || !chosenAnswer) return;
    setIsLoadingAi(true);
    setTutorMode('why_wrong');
    try {
      const data = await api.askAiWhyWrong(currentQ.id, chosenAnswer);
      setAiExplanation(data.diagnosis);
      setTutorConversation([
        { role: 'user', content: `Why is Option (${chosenAnswer}) wrong?` },
        { role: 'assistant', content: data.diagnosis },
      ]);
    } catch (e) {
      console.error(e);
      addToast({
        title: 'Tutor Notice',
        message: 'Could not connect to tutor service right now.',
        type: 'info',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 2. Step-by-step deeper explanation with speed shortcuts
  const handleAskAi = async () => {
    if (!currentQ) return;
    setIsLoadingAi(true);
    setTutorMode('more_explanation');
    try {
      const data = await api.askAiExplain(currentQ.id, chosenAnswer);
      setAiExplanation(data.explanation);
      setTutorConversation([
        { role: 'user', content: 'Can you give me a deeper Socratic breakdown and speed shortcuts for this question?' },
        { role: 'assistant', content: data.explanation },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 3. Teach topic from scratch
  const handleAskTeachTopic = async () => {
    if (!currentQ) return;
    const curTopic = topics.find((t) => t.id === currentQ.topicId);
    const curSub = subjects.find((s) => s.id === currentQ.subjectId);
    const topicName = curTopic?.name || currentQ.topicId;

    setIsLoadingAi(true);
    setTutorMode('teach_topic');
    try {
      const data = await api.askAiTeachTopic(topicName, curSub?.name);
      setAiExplanation(data.lesson);
      setTutorConversation([
        { role: 'user', content: `Teach me ${topicName} from scratch.` },
        { role: 'assistant', content: data.lesson },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 4. Interactive reply to tutor checking question
  const handleSendTutorFollowUp = async () => {
    if (!followUpText.trim() || isSubmittingFollowUp) return;
    const text = followUpText.trim();
    setFollowUpText('');
    setIsSubmittingFollowUp(true);

    const updated = [
      ...tutorConversation,
      { role: 'user' as const, content: text },
    ];
    setTutorConversation(updated);

    try {
      const res = await api.chatWithCoach(updated);
      setTutorConversation((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ]);
    } catch (err) {
      addToast({
        title: 'Tutor connection issue',
        message: 'Could not send reply to tutor.',
        type: 'info',
      });
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Exam Type Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
          {(['JAMB', 'WAEC', 'NECO'] as const).map((type) => (
            <button
              key={type}
              id={`practice-exam-${type}`}
              onClick={() => setSelectedExamType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedExamType === type
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Subject & Topic Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Adaptive Mode Toggle */}
          <button
            id="practice-toggle-adaptive-mode"
            onClick={() => setIsAdaptiveMode(!isAdaptiveMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isAdaptiveMode
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Deterministic Adaptive Learning Engine"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Adaptive Engine: {isAdaptiveMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Subject Dropdown */}
          <select
            id="practice-subject-select"
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedTopicId('');
            }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Topic Dropdown */}
          <select
            id="practice-topic-select"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px]"
          >
            <option value="">All Syllabus Topics (Auto-Paced)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 1B. Adaptive Learning Engine Insight Bar */}
      {isAdaptiveMode && adaptiveData && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-800/50 rounded-2xl p-4 text-white shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Brain className="w-4 h-4" />
              </span>
              <span className="font-extrabold uppercase tracking-wider text-emerald-300">
                Deterministic Adaptive Engine Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                Overall Accuracy: <strong className="text-white">{adaptiveData.overallAccuracy}%</strong>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30">
                {adaptiveData.foundationalCount} Foundational • {adaptiveData.mediumCount} Standard • {adaptiveData.advancedCount} Hard
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {adaptiveData.adaptationSummary}
          </p>

          {/* Topic Weights Distribution Pills */}
          {adaptiveData.topicWeights && adaptiveData.topicWeights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {adaptiveData.topicWeights.slice(0, 4).map((tw) => (
                <span
                  key={tw.topicId}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    tw.adaptationMode === 'foundational_revision'
                      ? 'bg-red-500/20 text-red-200 border-red-500/40'
                      : tw.adaptationMode === 'advanced_challenge'
                      ? 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                  }`}
                  title={tw.reason}
                >
                  <span>{tw.topicName}: {tw.accuracyRate}%</span>
                  <span className="opacity-75">({tw.allocatedCount}q)</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Session Progress Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800">
            Question {questions.length > 0 ? currentIndex + 1 : 0} of {questions.length}
          </span>
          {currentQ && (
            <>
              {currentQ.sourceType === 'verified_past_question' ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  Verified {currentQ.examType} {currentQ.year ? `(${currentQ.year})` : ''} Past Question
                </span>
              ) : currentQ.sourceType === 'original_practice' ? (
                <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  Original Practice Question
                </span>
              ) : (
                <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                  <span>AI Practice Drill</span>
                </span>
              )}

              {/* Adaptive Difficulty Badge */}
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                currentQ.difficulty === 'hard'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentQ.difficulty === 'medium'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentQ.difficulty === 'hard'
                  ? 'Hard • Distinction Challenge'
                  : currentQ.difficulty === 'medium'
                  ? 'Medium • Standard Pace'
                  : 'Easy • Foundational Revision'}
              </span>

              {currentQ.subtopic && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {currentQ.subtopic}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Session Accuracy:</span>
          <span className="font-extrabold text-emerald-700">
            {sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 100}% ({sessionCorrect}/{sessionTotal})
          </span>
        </div>
      </div>

      {/* 3. Question Card */}
      {currentQ ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Question Text */}
          <div className="space-y-3">
            {currentQ.passage && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm text-slate-700 italic leading-relaxed">
                <span className="font-bold not-italic block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Reading Passage / Comprehension Context:
                </span>
                &quot;{currentQ.passage}&quot;
              </div>
            )}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const optionText = currentQ.options[key];
              const isSelected = chosenAnswer === key;
              const isOptionCorrect = key === currentQ.correctAnswer;

              let btnStyle = 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800';

              if (isAnswered) {
                if (isOptionCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20';
                } else if (isSelected && !isOptionCorrect) {
                  btnStyle = 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-500/20';
                } else {
                  btnStyle = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={key}
                  id={`practice-option-${key}`}
                  disabled={isAnswered}
                  onClick={() => handleChooseOption(key)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAnswered && isOptionCorrect
                        ? 'bg-emerald-600 text-white'
                        : isAnswered && isSelected && !isOptionCorrect
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm font-medium pt-0.5 leading-snug">{optionText}</span>
                  {isAnswered && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />
                  )}
                  {isAnswered && isSelected && !isOptionCorrect && (
                    <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Standard Explanation */}
          {isAnswered && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
              <div
                className={`p-4 rounded-2xl border ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <h4 className="font-bold text-sm">
                    {isCorrect ? 'Correct! Standard Marking Note:' : `Correct Answer is (${currentQ.correctAnswer}):`}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{currentQ.explanation}</p>
              </div>

              {/* Action Buttons: On-demand AI Coach & Next Question */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {!isCorrect && chosenAnswer && (
                    <button
                      id="practice-why-wrong-btn"
                      onClick={handleAskWhyWrong}
                      disabled={isLoadingAi}
                      className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-3 py-2 rounded-xl text-xs transition-colors border border-amber-300"
                    >
                      <span>⚠️</span>
                      <span>Why is ({chosenAnswer}) wrong?</span>
                    </button>
                  )}

                  <button
                    id="practice-ask-ai-coach-btn"
                    onClick={handleAskAi}
                    disabled={isLoadingAi}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Explain in More Detail</span>
                  </button>

                  <button
                    id="practice-teach-topic-btn"
                    onClick={handleAskTeachTopic}
                    disabled={isLoadingAi}
                    className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                    <span>Teach Me This Topic</span>
                  </button>
                </div>

                <button
                  id="practice-next-btn"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors ml-auto"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Gemini AI Personal Tutor Box */}
              {(isLoadingAi || tutorConversation.length > 0) && (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-3xl border border-slate-700 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini AI • Personal Socratic Tutor</span>
                    </div>

                    <button
                      onClick={() =>
                        openTutorWithPrompt(
                          `Let's discuss this question from ${currentQ.subjectId}: "${currentQ.questionText.slice(0, 100)}..."`
                        )
                      }
                      className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Continue in Full Tutor Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {isLoadingAi && tutorConversation.length === 0 && (
                    <div className="flex items-center gap-3 py-3 text-xs text-slate-300">
                      <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>Personal Tutor is analyzing syllabus trap & drafting guidance...</span>
                    </div>
                  )}

                  {/* Conversation stream */}
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {tutorConversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-950/70 border border-emerald-700/50 text-emerald-200 ml-6'
                            : 'bg-slate-800/90 border border-slate-700 text-slate-200 mr-2 whitespace-pre-line font-sans'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>

                  {/* Socratic follow-up answer input */}
                  <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                    <input
                      type="text"
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendTutorFollowUp()}
                      placeholder="Reply to the Tutor's checking question..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      disabled={!followUpText.trim() || isSubmittingFollowUp}
                      onClick={handleSendTutorFollowUp}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                    >
                      {isSubmittingFollowUp ? 'Thinking...' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No questions found for this topic</h3>
          <p className="text-xs text-slate-500">Try selecting another topic or subject from the dropdown above.</p>
          <button
            onClick={() => {
              setSelectedTopicId('');
              fetchQuestions();
            }}
            className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
