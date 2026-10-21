import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PersonalizedStudyPlan, ExamDateConfig } from '../types';
import { api } from '../services/api';
import { MyStudyPlanDashboard } from '../components/study-plan/MyStudyPlanDashboard';

export const StudyPlanView: React.FC = () => {
  const [personalizedPlan, setPersonalizedPlan] = useState<PersonalizedStudyPlan | null>(null);
  const [examConfigs, setExamConfigs] = useState<ExamDateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [planData, datesData] = await Promise.all([
        api.getPersonalizedStudyPlan(),
        api.getOfficialExamDates(),
      ]);
      setPersonalizedPlan(planData);
      setExamConfigs(datesData);
    } catch (err: any) {
      console.error('Failed to load study plan:', err);
      setError(err.message || 'Failed to load your personalized study plan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExamConfigUpdated = (updated: ExamDateConfig) => {
    setExamConfigs((prev) =>
      prev.map((c) => (c.examType === updated.examType ? updated : c))
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Calibrating Personalized Syllabus Plan...
        </p>
      </div>
    );
  }

  if (error || !personalizedPlan) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-3xl border border-red-200 text-center space-y-4 my-10 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Study Plan Unavailable</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {error || 'Could not load your personalized study plan. Please verify your connection.'}
        </p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <MyStudyPlanDashboard
      plan={personalizedPlan}
      onPlanUpdated={(newPlan) => setPersonalizedPlan(newPlan)}
      examConfigs={examConfigs}
      onExamConfigUpdated={handleExamConfigUpdated}
    />
  );
};
