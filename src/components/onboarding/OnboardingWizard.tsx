import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamType, PreferredStudyTime, AcademicLevel, OnboardingData, AVAILABLE_EXAM_YEARS } from '../../types';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Target,
  Clock,
  Sun,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const NIGERIAN_UNIVERSITIES = [
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'Ahmadu Bello University (ABU Zaria)',
  'University of Nigeria, Nsukka (UNN)',
  'Federal University of Technology, Akure (FUTA)',
  'University of Benin (UNIBEN)',
  'University of Ilorin (UNILORIN)',
  'Covenant University',
  'Lagos State University (LASU)',
];

const POPULAR_COURSES = [
  'Medicine & Surgery',
  'Computer Science',
  'Law',
  'Mechanical Engineering',
  'Electrical/Electronic Engineering',
  'Accounting & Finance',
  'Pharmacy',
  'Nursing Science',
  'Economics',
  'Mass Communication',
];

const CURRICULUM_SUBJECTS = [
  { id: 'sub_eng', name: 'Use of English', required: true, icon: '📖' },
  { id: 'sub_math', name: 'Mathematics', required: false, icon: '📐' },
  { id: 'sub_phy', name: 'Physics', required: false, icon: '⚡' },
  { id: 'sub_chm', name: 'Chemistry', required: false, icon: '🧪' },
  { id: 'sub_bio', name: 'Biology', required: false, icon: '🧬' },
  { id: 'sub_eco', name: 'Economics', required: false, icon: '📊' },
  { id: 'sub_gov', name: 'Government', required: false, icon: '🏛️' },
  { id: 'sub_lit', name: 'Literature in English', required: false, icon: '📚' },
  { id: 'sub_crk', name: 'Christian Religious Studies', required: false, icon: '🕊️' },
];

const COMMON_DIFFICULT_TOPICS = [
  'Mechanics & Motion',
  'Calculus & Coordinate Geometry',
  'Organic Chemistry & Hydrocarbons',
  'Genetics & Heredity',
  'Electromagnetism & Waves',
  'Concord & Lexis Structure',
  'National Income Accounting',
  'Chemical Equilibrium & Thermodynamics',
  'Trigonometry & Surds',
  'Constitutional Development in Nigeria',
];

export const OnboardingWizard: React.FC = () => {
  const { user, profile, completeOnboarding } = useApp();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form fields
  const [targetExam, setTargetExam] = useState<ExamType>(profile?.targetExam || 'JAMB');
  const [examYear, setExamYear] = useState<number>(profile?.examYear || 2025);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('university_aspirant');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    profile?.selectedSubjects && profile.selectedSubjects.length > 0
      ? profile.selectedSubjects
      : ['sub_eng', 'sub_math', 'sub_phy', 'sub_chm']
  );
  const [targetScore, setTargetScore] = useState<number>(
    profile?.targetScore || (targetExam === 'JAMB' ? 320 : 8)
  );
  const [targetUniversity, setTargetUniversity] = useState<string>(profile?.targetUniversity || '');
  const [targetCourse, setTargetCourse] = useState<string>(profile?.targetCourse || '');
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(profile?.dailyStudyHours || 2.5);
  const [preferredStudyTime, setPreferredStudyTime] = useState<PreferredStudyTime>(
    profile?.preferredStudyTime || 'evening'
  );
  const [difficultTopics, setDifficultTopics] = useState<string[]>(
    profile?.difficultTopics || ['Mechanics & Motion', 'Calculus & Coordinate Geometry']
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSubject = (subId: string) => {
    if (subId === 'sub_eng') return; // English is compulsory in JAMB/WAEC
    if (selectedSubjects.includes(subId)) {
      if (selectedSubjects.length <= 2) {
        setError('Please select at least 2 subjects.');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subId));
    } else {
      if (targetExam === 'JAMB' && selectedSubjects.length >= 4) {
        // JAMB UTME has strictly 4 subjects
        setError('JAMB UTME consists of exactly 4 subjects. Deselect one to add another.');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subId]);
    }
    setError(null);
  };

  const toggleDifficultTopic = (topic: string) => {
    if (difficultTopics.includes(topic)) {
      setDifficultTopics(difficultTopics.filter((t) => t !== topic));
    } else {
      setDifficultTopics([...difficultTopics, topic]);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 2 && selectedSubjects.length < (targetExam === 'JAMB' ? 4 : 5)) {
      setError(
        targetExam === 'JAMB'
          ? 'JAMB UTME requires 4 subjects (including Use of English).'
          : 'WAEC / NECO typically requires at least 5 subjects.'
      );
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data: OnboardingData = {
        targetExam,
        examYear,
        selectedSubjects,
        targetScore,
        targetUniversity,
        targetCourse,
        dailyStudyHours,
        preferredStudyTime,
        difficultTopics,
        academicLevel,
      };
      await completeOnboarding(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="onboarding_wizard_container"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="onboarding_card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 px-6 sm:px-8 py-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Step {step} of {totalSteps}
              </span>
              <span className="text-xs text-emerald-200">Personal Exam Coach Setup</span>
            </div>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> +50 XP Welcome Bonus
            </span>
          </div>

          <div className="w-full bg-emerald-950/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mt-4">
            {step === 1 && `Welcome, ${user?.displayName || user?.fullName || 'Scholar'}! What's your goal?`}
            {step === 2 && 'Select Your Exam Subjects'}
            {step === 3 && 'Set Your Target Score & Dream Institution'}
            {step === 4 && 'Commitment & Preferred Study Time'}
            {step === 5 && 'Identify Weak Topics for the AI Tutor'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {step === 1 && 'Let NaijaPrep AI calibrate your study plan and daily mission roadmap.'}
            {step === 2 && 'Choose the exact subjects you will sit for in the exam hall.'}
            {step === 3 && 'We align past question drills with the cutoff mark of your dream course.'}
            {step === 4 && 'Personalize study reminders and daily missions to match your schedule.'}
            {step === 5 && 'Our AI tutor will build customized explanations for where you struggle most.'}
          </p>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: EXAM & YEAR */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  1. Which examination are you actively preparing for?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['JAMB', 'WAEC', 'NECO'] as ExamType[]).map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => {
                        setTargetExam(exam);
                        if (exam === 'JAMB') setTargetScore(320);
                        else setTargetScore(8);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        targetExam === exam
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-base text-slate-900">{exam}</span>
                        {targetExam === exam && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {exam === 'JAMB' && 'UTME (Computer Based Test, 400 Marks)'}
                        {exam === 'WAEC' && 'WASSCE (May/June or GCE Nov/Dec)'}
                        {exam === 'NECO' && 'Senior School Certificate Examination'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Exam Target Year
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={examYear}
                      onChange={(e) => setExamYear(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {AVAILABLE_EXAM_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} Academic Session
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Current Academic Standing
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="university_aspirant">University Aspirant / Jambite</option>
                      <option value="SS3">SS3 (Final Year High School)</option>
                      <option value="SS2">SS2</option>
                      <option value="SS1">SS1</option>
                      <option value="remedial">Remedial / Retaker</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUBJECTS SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {targetExam === 'JAMB'
                    ? `Selected: ${selectedSubjects.length} / 4 Subjects (UTME Standard)`
                    : `Selected: ${selectedSubjects.length} Subjects`}
                </span>
                <span className="text-xs text-emerald-700 font-medium">Use of English is required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                {CURRICULUM_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{sub.icon}</span>
                        <span className="text-xs font-medium leading-tight">{sub.name}</span>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 italic">
                Tip: You can refine or add subjects anytime later in your profile settings.
              </p>
            </div>
          )}

          {/* STEP 3: TARGET SCORE & UNIVERSITY */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    {targetExam === 'JAMB' ? 'Target UTME Score (out of 400)' : 'Target Number of A1 Grades'}
                  </label>
                  <span className="text-base font-extrabold text-emerald-700">
                    {targetExam === 'JAMB' ? `${targetScore} / 400` : `${targetScore} A1s`}
                  </span>
                </div>
                <input
                  type="range"
                  min={targetExam === 'JAMB' ? 200 : 4}
                  max={targetExam === 'JAMB' ? 380 : 9}
                  step={targetExam === 'JAMB' ? 5 : 1}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>{targetExam === 'JAMB' ? 'Average: 220' : 'Pass: 5 Credits'}</span>
                  <span>{targetExam === 'JAMB' ? 'Competitive: 280+' : 'Distinction: 7+ A1s'}</span>
                  <span className="text-emerald-700 font-bold">
                    {targetExam === 'JAMB' ? 'Merit List: 320+' : 'Top Scholar: 9 A1s'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Choice University / Polytechnic
                  </label>
                  <input
                    type="text"
                    list="nigerian-unis"
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="e.g. UNILAG or UI"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                  <datalist id="nigerian-unis">
                    {NIGERIAN_UNIVERSITIES.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Course of Study
                  </label>
                  <input
                    type="text"
                    list="nigerian-courses"
                    value={targetCourse}
                    onChange={(e) => setTargetCourse(e.target.value)}
                    placeholder="e.g. Medicine, Law, or CS"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                  <datalist id="nigerian-courses">
                    {POPULAR_COURSES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: STUDY TIME COMMITMENT */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Daily Available Study Time
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 2.5, 4].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDailyStudyHours(hours)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        dailyStudyHours === hours
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg font-black block">{hours}h</span>
                      <span className="text-[11px] text-slate-500 block">
                        {hours === 1 ? 'Quick review' : hours <= 2.5 ? 'Recommended' : 'Intensive'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  When do you retain concepts best?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'morning', label: 'Early Morning', sub: '5am - 9am', icon: '🌅' },
                    { id: 'afternoon', label: 'Afternoon', sub: '12pm - 4pm', icon: '☀️' },
                    { id: 'evening', label: 'Evening', sub: '5pm - 9pm', icon: '🌆' },
                    { id: 'night', label: 'Late Night', sub: '10pm - 2am', icon: '🌙' },
                  ].map((time) => (
                    <button
                      key={time.id}
                      type="button"
                      onClick={() => setPreferredStudyTime(time.id as PreferredStudyTime)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        preferredStudyTime === time.id
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl block mb-1">{time.icon}</span>
                      <span className="text-xs font-bold text-slate-800 block">{time.label}</span>
                      <span className="text-[10px] text-slate-500 block">{time.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: WEAK TOPICS */}
          {step === 5 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Select topics you currently find tricky or intimidating:
              </label>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                {COMMON_DIFFICULT_TOPICS.map((topic) => {
                  const isChecked = difficultTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleDifficultTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {topic}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                The AI Tutor will prioritize simplified breakdowns and mnemonic tricks for these areas.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              id="onboarding_back_btn"
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            id="onboarding_next_btn"
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Activating Personalized Plan...'
            ) : step === totalSteps ? (
              <>
                Finish Setup & Start Crushing Past Questions
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
