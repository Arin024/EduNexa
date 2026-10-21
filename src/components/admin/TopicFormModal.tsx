import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Layers, Plus, Trash2 } from 'lucide-react';
import { Topic, Subject, QuestionDifficulty } from '../../types';

interface TopicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Topic>) => Promise<void>;
  initialData?: Topic | null;
  subjects: Subject[];
  defaultSubjectId?: string;
  isSubmitting: boolean;
}

export const TopicFormModal: React.FC<TopicFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjects,
  defaultSubjectId,
  isSubmitting,
}) => {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || 'sub_eng');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [frequencyInExam, setFrequencyInExam] = useState<'high' | 'medium' | 'low'>('high');
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSubjectId(initialData.subjectId);
      setName(initialData.name);
      setDescription(initialData.description || '');
      setDifficulty(initialData.difficulty || 'medium');
      setFrequencyInExam(initialData.frequencyInExam || 'high');
      setSubtopics(Array.isArray(initialData.subtopics) ? [...initialData.subtopics] : []);
    } else {
      setSubjectId(defaultSubjectId || subjects[0]?.id || 'sub_eng');
      setName('');
      setDescription('');
      setDifficulty('medium');
      setFrequencyInExam('high');
      setSubtopics([]);
    }
    setError(null);
  }, [initialData, isOpen, defaultSubjectId, subjects]);

  const handleAddSubtopic = () => {
    const trimmed = newSubtopicInput.trim();
    if (!trimmed) return;
    if (subtopics.includes(trimmed)) {
      setError('Subtopic already in list.');
      return;
    }
    setSubtopics([...subtopics, trimmed]);
    setNewSubtopicInput('');
    setError(null);
  };

  const handleRemoveSubtopic = (sub: string) => {
    setSubtopics(subtopics.filter((s) => s !== sub));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Topic title is required.');
      return;
    }
    if (!subjectId) {
      setError('Please choose a valid subject.');
      return;
    }

    try {
      await onSubmit({
        subjectId,
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty,
        frequencyInExam,
        subtopics,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save topic.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 my-8 space-y-4 animate-fade-in text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg font-serif">
                {initialData ? 'Edit Syllabus Topic' : 'Add New Syllabus Topic'}
              </h3>
              <p className="text-xs text-slate-500">
                Structure: Subject → Topic → Optional Subtopics for adaptive learning diagnostics.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Parent Subject *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Topic Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quadratic Equations & Polynomials"
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Typical Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Exam Frequency Weight</label>
              <select
                value={frequencyInExam}
                onChange={(e) => setFrequencyInExam(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
              >
                <option value="high">High Frequency (Appears Annually)</option>
                <option value="medium">Medium Frequency</option>
                <option value="low">Low Frequency / Optional</option>
              </select>
            </div>
          </div>

          {/* Subtopics manager */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Optional Subtopics <span className="font-normal text-slate-500">(For granular weak area detection)</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">{subtopics.length} defined</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtopicInput}
                onChange={(e) => setNewSubtopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtopic();
                  }
                }}
                placeholder="Type subtopic name and click Add"
                className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSubtopic}
                className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {subtopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subtopics.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtopic(sub)}
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Topic Diagnostic Note</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Master the rules governing factorizations, completing squares and the quadratic formula."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Update Topic' : 'Create Topic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
