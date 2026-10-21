import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Question, Subject, Topic, ExamType, QuestionDifficulty, QuestionSourceType, QuestionStatus } from '../../types';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Question>) => Promise<void>;
  initialData?: Question | null;
  subjects: Subject[];
  topics: Topic[];
  isSubmitting: boolean;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjects,
  topics,
  isSubmitting,
}) => {
  const [examType, setExamType] = useState<ExamType>('JAMB');
  const [subjectId, setSubjectId] = useState<string>('sub_eng');
  const [topicId, setTopicId] = useState<string>('');
  const [subtopic, setSubtopic] = useState<string>('');
  const [sourceType, setSourceType] = useState<QuestionSourceType>('verified_past_question');
  const [year, setYear] = useState<number | ''>(2024);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [status, setStatus] = useState<QuestionStatus>('active');
  const [questionText, setQuestionText] = useState<string>('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync initial data when editing or opening
  useEffect(() => {
    if (initialData) {
      setExamType(initialData.examType);
      setSubjectId(initialData.subjectId);
      setTopicId(initialData.topicId);
      setSubtopic(initialData.subtopic || '');
      setSourceType(initialData.sourceType || 'verified_past_question');
      setYear(initialData.year ?? '');
      setDifficulty(initialData.difficulty || 'medium');
      setStatus(initialData.status || 'active');
      setQuestionText(initialData.questionText);
      setOptions({
        A: initialData.options?.A || '',
        B: initialData.options?.B || '',
        C: initialData.options?.C || '',
        D: initialData.options?.D || '',
      });
      setCorrectAnswer(initialData.correctAnswer || 'A');
      setExplanation(initialData.explanation || '');
      setTagsInput(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '');
    } else {
      // Default new question state
      const defaultSub = subjects[0]?.id || 'sub_eng';
      setExamType('JAMB');
      setSubjectId(defaultSub);
      setTopicId('');
      setSubtopic('');
      setSourceType('verified_past_question');
      setYear(2024);
      setDifficulty('medium');
      setStatus('active');
      setQuestionText('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setCorrectAnswer('A');
      setExplanation('');
      setTagsInput('past_paper, high_yield');
    }
    setValidationError(null);
  }, [initialData, isOpen, subjects]);

  // When subject changes, automatically pick first valid topic or reset
  const filteredTopics = topics.filter((t) => t.subjectId === subjectId);

  useEffect(() => {
    if (!initialData && filteredTopics.length > 0 && !topicId) {
      setTopicId(filteredTopics[0].id);
    }
  }, [subjectId, filteredTopics, topicId, initialData]);

  // Auto-manage year field based on sourceType rule:
  // "Never label AI-generated questions as official JAMB, WAEC or NECO questions."
  // "Never fabricate an official examination source or year."
  const handleSourceTypeChange = (newType: QuestionSourceType) => {
    setSourceType(newType);
    if (newType === 'ai_generated') {
      setYear('');
    } else if (newType === 'verified_past_question' && !year) {
      setYear(2024);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validations
    if (!questionText.trim()) {
      setValidationError('Question text is required.');
      return;
    }
    if (!options.A.trim() || !options.B.trim() || !options.C.trim() || !options.D.trim()) {
      setValidationError('All 4 answer options (A, B, C, D) must be provided.');
      return;
    }
    if (!explanation.trim()) {
      setValidationError('An explanation/marking guide note is required to help students learn.');
      return;
    }

    if (sourceType === 'verified_past_question') {
      if (!year || Number(year) < 1980 || Number(year) > new Date().getFullYear()) {
        setValidationError('Verified past questions require a valid examination year between 1980 and current year.');
        return;
      }
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: Partial<Question> = {
      examType,
      subjectId,
      topicId: topicId || (filteredTopics[0]?.id ?? 'top_general'),
      subtopic: subtopic.trim() || undefined,
      sourceType,
      year: sourceType === 'ai_generated' ? undefined : (year ? Number(year) : undefined),
      difficulty,
      status,
      questionText: questionText.trim(),
      options: {
        A: options.A.trim(),
        B: options.B.trim(),
        C: options.C.trim(),
        D: options.D.trim(),
      },
      correctAnswer,
      explanation: explanation.trim(),
      tags: parsedTags,
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save question.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto space-y-5 animate-fade-in text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg font-serif">
                {initialData ? 'Edit Exam Question' : 'Add New Exam Question'}
              </h3>
              <p className="text-xs text-slate-500">
                Official syllabus taxonomy: Subject → Topic → Optional Subtopic with verified metadata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Exam Type, Subject, Topic, Subtopic */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
              1. Syllabus Classification
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Examination Body</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="JAMB">JAMB (UTME)</option>
                  <option value="WAEC">WAEC (WASSCE)</option>
                  <option value="NECO">NECO (SSCE)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Topic</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {filteredTopics.length > 0 ? (
                    filteredTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  ) : (
                    <option value="">General Curriculum Topic</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Subtopic <span className="font-normal text-slate-400">(Optional for adaptive tracking)</span>
                </label>
                <input
                  type="text"
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  placeholder="e.g. Proximity Rule, Sine Rule, First Law"
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="easy">Easy (Foundational)</option>
                  <option value="medium">Medium (Standard Exam Pace)</option>
                  <option value="hard">Hard (Advanced Distinction Level)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Source Integrity & Status */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
              2. Source Type & Exam Integrity
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => handleSourceTypeChange(e.target.value as QuestionSourceType)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="verified_past_question">Verified Past Question</option>
                  <option value="original_practice">Original Practice Question</option>
                  <option value="ai_generated">AI-Generated Practice Drill</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Examination Year{' '}
                  {sourceType === 'ai_generated' && (
                    <span className="text-amber-600 font-normal">(Never set for AI)</span>
                  )}
                  {sourceType === 'verified_past_question' && (
                    <span className="text-emerald-700 font-bold">*Required</span>
                  )}
                </label>
                <input
                  type="number"
                  disabled={sourceType === 'ai_generated'}
                  value={year}
                  onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder={sourceType === 'ai_generated' ? 'N/A (AI generated)' : 'e.g. 2024'}
                  className={`w-full border px-3 py-2 rounded-xl font-mono text-slate-900 ${
                    sourceType === 'ai_generated'
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
                      : 'bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status in Candidate Pools</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuestionStatus)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active (Available to Students)</option>
                  <option value="draft">Draft (Review Pending)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            {sourceType === 'ai_generated' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Exam integrity standard: AI-generated questions are strictly labelled as practice drills and never fabricated as official examination past papers.
                </span>
              </p>
            )}
          </div>

          {/* 3. Question Body */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Question Body / Stem *</label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the full question text clearly. Formulae and passages can be included here..."
              className="w-full bg-white border border-slate-200 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm leading-relaxed"
            />
          </div>

          {/* 4. Options A, B, C, D */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Options A, B, C, D *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs ${
                      correctAnswer === opt
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt}
                  </span>
                  <input
                    type="text"
                    value={options[opt]}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        [opt]: e.target.value,
                      })
                    }
                    placeholder={`Option ${opt} text`}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 5. Correct Answer & Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="font-bold text-slate-700 block mb-1">Correct Answer *</label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value as 'A' | 'B' | 'C' | 'D')}
                className="w-full bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">
                Tags <span className="font-normal text-slate-400">(comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. jamb_2024, mechanics, friction, high_yield"
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Official Marking Guide Explanation & Step-by-Step Rationale *
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the definitive rule, formula, or grammar concord reason so students understand immediately..."
              className="w-full bg-white border border-slate-200 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData ? 'Update Question' : 'Save & Publish Question'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
