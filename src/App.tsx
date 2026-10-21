import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { AuthGateView } from './components/auth/AuthGateView';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Keep critical path view eager for instant first-paint
import { HomeDashboard } from './views/HomeDashboard';

// Lazy-load non-critical views so mobile download size drops dramatically
const PracticeView = lazy(() => import('./views/PracticeView').then(m => ({ default: m.PracticeView })));
const CbtExamView = lazy(() => import('./views/CbtExamView').then(m => ({ default: m.CbtExamView })));
const StudyPlanView = lazy(() => import('./views/StudyPlanView').then(m => ({ default: m.StudyPlanView })));
const MistakeBankView = lazy(() => import('./views/MistakeBankView').then(m => ({ default: m.MistakeBankView })));
const WeakTopicsView = lazy(() => import('./views/WeakTopicsView').then(m => ({ default: m.WeakTopicsView })));
const WhatShouldIStudyView = lazy(() => import('./views/WhatShouldIStudyView').then(m => ({ default: m.WhatShouldIStudyView })));
const AiTutorView = lazy(() => import('./views/AiTutorView').then(m => ({ default: m.AiTutorView })));
const ChallengesView = lazy(() => import('./views/ChallengesView').then(m => ({ default: m.ChallengesView })));
const ReferralView = lazy(() => import('./views/ReferralView').then(m => ({ default: m.ReferralView })));
const SubscriptionView = lazy(() => import('./views/SubscriptionView').then(m => ({ default: m.SubscriptionView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const AdminView = lazy(() => import('./views/AdminView').then(m => ({ default: m.AdminView })));

// Ultra-fast lightweight view loader for mobile networks
const ViewLoadingFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center space-y-3">
    <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center animate-pulse border border-emerald-500/20">
      <span className="text-sm font-black">🇳🇬</span>
    </div>
    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className="w-1/2 h-full bg-emerald-500 rounded-full animate-ping"></div>
    </div>
    <p className="text-[11px] font-semibold text-slate-400">Loading module...</p>
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse text-white font-bold text-xl shadow-lg shadow-emerald-600/30">
          E
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Loading EduNexa AI Coach & Syllabus Engine...
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12 min-w-0">
      <Suspense fallback={<ViewLoadingFallback />}>
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'what_to_study' && (
          <ProtectedRoute>
            <WhatShouldIStudyView />
          </ProtectedRoute>
        )}
        {activeTab === 'practice' && <PracticeView />}
        {activeTab === 'cbt' && <CbtExamView />}
        {activeTab === 'study_plan' && (
          <ProtectedRoute>
            <StudyPlanView />
          </ProtectedRoute>
        )}
        {activeTab === 'mistakes' && (
          <ProtectedRoute>
            <MistakeBankView />
          </ProtectedRoute>
        )}
        {activeTab === 'weak_topics' && (
          <ProtectedRoute>
            <WeakTopicsView />
          </ProtectedRoute>
        )}
        {activeTab === 'ai_tutor' && (
          <ProtectedRoute>
            <AiTutorView />
          </ProtectedRoute>
        )}
        {activeTab === 'challenges' && (
          <ProtectedRoute>
            <ChallengesView />
          </ProtectedRoute>
        )}
        {activeTab === 'progress' && (
          <ProtectedRoute>
            <WeakTopicsView />
          </ProtectedRoute>
        )}
        {activeTab === 'referrals' && (
          <ProtectedRoute>
            <ReferralView />
          </ProtectedRoute>
        )}
        {activeTab === 'subscription' && <SubscriptionView />}
        {activeTab === 'profile_settings' && (
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        )}
        {activeTab === 'admin' && (
          <ProtectedRoute requireAdmin>
            <AdminView />
          </ProtectedRoute>
        )}
      </Suspense>
    </main>
  );
};

const AppShell: React.FC = () => {
  const { user, isLoading, isOnboarding, authModal } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse text-white font-bold text-2xl shadow-xl shadow-emerald-600/30">
          🇳🇬
        </div>
        <div className="space-y-1">
          <h2 className="text-white font-black text-lg">EduNexa AI</h2>
          <p className="text-xs font-semibold text-slate-400">
            Initializing your personal exam coach & study engine...
          </p>
        </div>
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // Enforce authentication gate: users must log in first before accessing site
  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-900 flex flex-col">
        <ToastContainer />
        <OfflineIndicator />
        <AuthGateView />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar />
      <BottomNav />
      <ToastContainer />
      <OfflineIndicator />
      {authModal && <AuthModal />}
      {isOnboarding && <OnboardingWizard />}
      <MainContent />
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
