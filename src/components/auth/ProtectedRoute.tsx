import React from 'react';
import { Lock, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, setAuthModal, switchUserRole, setActiveTab } = useApp();

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-8 space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Student Authentication Required
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please log in or create your student profile to access your personalized syllabus, CBT mock analytics, and study missions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setAuthModal('login')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Log In to Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAuthModal('register')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl transition-all"
          >
            Create New Account
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin) {
    const isOwnerAdmin =
      user?.email?.toLowerCase() === 'christianarinze024@gmail.com' && user?.role === 'admin';

    if (!isOwnerAdmin) {
      return (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-8 space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
              Restricted Administrator Access
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              This dashboard is strictly private and exclusively accessible by{' '}
              <strong className="text-slate-900 font-bold">Nwajiaku Arinzechukwu Christian</strong>{' '}
              (<span className="text-emerald-700 font-mono text-xs">christianarinze024@gmail.com</span>).
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('home')}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Study Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {user?.email?.toLowerCase() !== 'christianarinze024@gmail.com' && (
              <button
                onClick={() => setAuthModal('login')}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl transition-all"
              >
                Sign in with Admin Credentials
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
