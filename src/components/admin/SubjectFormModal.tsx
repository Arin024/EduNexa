import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { Subject, ExamType } from '../../types';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Subject>) => Promise<void>;
  initialData?: Subject | null;
  isSubmitting: boolean;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'General' | 'Sciences' | 'Commercial' | 'Arts'>('Sciences');
  const [description, setDescription] = useState('');
  const [examTypes, setExamTypes] = useState<ExamType[]>(['JAMB', 'WAEC', 'NECO']);
  const [icon, setIcon] = useState('BookOpen');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setCategory(initialData.category || 'Sciences');
      setDescription(initialData.description || '');
      setExamTypes(initialData.examTypes || ['JAMB', 'WAEC', 'NECO']);
      setIcon(initialData.icon || 'BookOpen');
      setIsActive(initialData.isActive !== false);
    } else {
      setName('');
      setCode('');
      setCategory('Sciences');
      setDescription('');
      setExamTypes(['JAMB', 'WAEC', 'NECO']);
      setIcon('BookOpen');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  const toggleExamType = (type: ExamType) => {
    if (examTypes.includes(type)) {
      if (examTypes.length === 1) {
        setError('Subject must belong to at least one examination syllabus.');
        return;
      }
      setExamTypes(examTypes.filter((t) => t !== type));
    } else {
      setExamTypes([...examTypes, type]);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Subject title is required.');
      return;
    }
    if (!code.trim()) {
      setError('Subject code is required (e.g. MTH, PHY, ENG).');
      return;
    }
    if (examTypes.length === 0) {
      setError('Select at least one applicable exam body (JAMB, WAEC, or NECO).');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        description: description.trim(),
        examTypes,
        icon,
        isActive,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save subject.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 my-8 space-y-4 animate-fade-in text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg font-serif">
                {initialData ? 'Edit Syllabus Subject' : 'Add New Examination Subject'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure subject syllabus mapping and examination availability.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Further Mathematics"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject Code (3-4 letters) *</label>
              <input
                type="text"
                value={code}
                maxLength={5}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FMT"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono uppercase font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Academic Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold text-slate-900"
              >
                <option value="General">General / Core</option>
                <option value="Sciences">Sciences</option>
                <option value="Commercial">Commercial / Social Sciences</option>
                <option value="Arts">Arts & Humanities</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Lucide Icon Name</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-900"
              >
                <option value="BookOpen">BookOpen</option>
                <option value="Calculator">Calculator</option>
                <option value="Zap">Zap</option>
                <option value="FlaskConical">FlaskConical</option>
                <option value="Dna">Dna</option>
                <option value="TrendingUp">TrendingUp</option>
                <option value="Landmark">Landmark</option>
                <option value="Feather">Feather</option>
                <option value="ShoppingBag">ShoppingBag</option>
                <option value="Receipt">Receipt</option>
                <option value="Sprout">Sprout</option>
                <option value="Compass">Compass</option>
                <option value="Shield">Shield</option>
                <option value="Sigma">Sigma</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Applicable Examination Boards</label>
            <div className="flex gap-2">
              {(['JAMB', 'WAEC', 'NECO'] as ExamType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleExamType(type)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    examTypes.includes(type)
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Syllabus Scope Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Core mechanics, wave theory, thermal physics and atomic models."
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="subject-is-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="subject-is-active" className="font-bold text-slate-700 cursor-pointer">
              Active in Candidate Syllabus (Candidates can select and practice this subject)
            </label>
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Update Subject' : 'Create Subject'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
