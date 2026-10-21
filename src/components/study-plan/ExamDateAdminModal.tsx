import React, { useState } from 'react';
import {
  Calendar,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { ExamDateConfig, ExamType } from '../../types';
import { api } from '../../services/api';

interface ExamDateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  examConfigs: ExamDateConfig[];
  onConfigUpdated: (updated: ExamDateConfig) => void;
  defaultExamType?: ExamType;
}

export const ExamDateAdminModal: React.FC<ExamDateAdminModalProps> = ({
  isOpen,
  onClose,
  examConfigs,
  onConfigUpdated,
  defaultExamType = 'JAMB',
}) => {
  const [selectedExam, setSelectedExam] = useState<ExamType>(defaultExamType);
  const currentConfig = examConfigs.find((c) => c.examType === selectedExam) || examConfigs[0];

  const [examDate, setExamDate] = useState<string>(currentConfig?.examDate || '');
  const [status, setStatus] = useState<ExamDateConfig['status']>(currentConfig?.status || 'announced');
  const [isOfficial, setIsOfficial] = useState<boolean>(currentConfig?.isOfficial ?? true);
  const [registrationDeadline, setRegistrationDeadline] = useState<string>(
    currentConfig?.registrationDeadline || ''
  );
  const [announcementBody, setAnnouncementBody] = useState<string>(
    currentConfig?.announcementBody || ''
  );
  const [announcedBy, setAnnouncedBy] = useState<string>(currentConfig?.announcedBy || '');
  const [notes, setNotes] = useState<string>(currentConfig?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when selectedExam changes
  React.useEffect(() => {
    const config = examConfigs.find((c) => c.examType === selectedExam);
    if (config) {
      setExamDate(config.examDate || '');
      setStatus(config.status);
      setIsOfficial(config.isOfficial);
      setRegistrationDeadline(config.registrationDeadline || '');
      setAnnouncementBody(config.announcementBody || '');
      setAnnouncedBy(config.announcedBy || '');
      setNotes(config.notes || '');
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [selectedExam, examConfigs]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await api.updateOfficialExamDate(selectedExam, {
        examDate: examDate ? examDate : null,
        status,
        isOfficial,
        registrationDeadline: registrationDeadline ? registrationDeadline : null,
        announcementBody,
        announcedBy,
        notes,
      });

      setSaveSuccess(true);
      onConfigUpdated(updated);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update exam date configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Configure Official Exam Dates</h3>
              <p className="text-xs text-slate-300">
                Calibrate national examination timetables and official candidate countdowns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Integrity Banner */}
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">Strict Exam Integrity Rule:</strong> Do not invent official exam
            dates. Only configure confirmed or tentative dates published by official examination boards
            (JAMB, WAEC, NECO). If an exam date is awaiting ministerial announcement, set status to{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Pending Announcement</code>.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
          {/* Exam Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Examination Board
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['JAMB', 'WAEC', 'NECO'] as ExamType[]).map((type) => {
                const isSelected = selectedExam === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedExam(type)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Exam Start Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Leave blank if date is pending announcement
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Schedule Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExamDateConfig['status'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="announced">Official & Confirmed</option>
                <option value="tentative">Tentative Proposed Window</option>
                <option value="pending_announcement">Pending Official Announcement</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Visible to all candidates in countdown
              </span>
            </div>
          </div>

          {/* Registration Deadline & Official Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registration Deadline (Optional)
              </label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Announced By Authority
              </label>
              <input
                type="text"
                value={announcedBy}
                onChange={(e) => setAnnouncedBy(e.target.value)}
                placeholder="e.g. Joint Admissions and Matriculation Board (JAMB)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              id="is-official-checkbox"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="is-official-checkbox" className="text-xs font-bold text-slate-800 cursor-pointer">
              Mark as Verified Official Gazette Date (Displays verified badge on candidate dashboard)
            </label>
          </div>

          {/* Announcement Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Official Timetable Summary / Gazette Excerpt
            </label>
            <textarea
              rows={3}
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Paste official examination board announcement text or press circular summary..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
            />
          </div>

          {/* Candidate Advisory / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Candidate Advisory & Pacing Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Computer-Based Test (CBT) across accredited centres nationwide."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {selectedExam} official exam date successfully updated! Countdown and study plans recalibrated.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Official {selectedExam} Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
