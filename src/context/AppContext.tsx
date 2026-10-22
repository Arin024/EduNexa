import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { User, StudentProfile, OnboardingData } from '../types';
import { api, saveRememberedCredentials } from '../services/api';

export type NavTab =
  | 'home'
  | 'what_to_study'
  | 'practice'
  | 'cbt'
  | 'study_plan'
  | 'mistakes'
  | 'weak_topics'
  | 'ai_tutor'
  | 'challenges'
  | 'progress'
  | 'referrals'
  | 'subscription'
  | 'profile_settings'
  | 'admin';

export type AuthModalMode = 'login' | 'register' | 'forgot_password' | null;

interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'xp' | 'streak' | 'achievement' | 'success' | 'info';
}

interface AppContextType {
  user: User | null;
  profile: StudentProfile | null;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  setIsOnboarding: (val: boolean) => void;
  authModal: AuthModalMode;
  setAuthModal: (mode: AuthModalMode) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isLoading: boolean;
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
  refreshUserData: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (params: {
    fullName: string;
    email: string;
    password?: string;
    phone?: string;
    targetExam?: 'JAMB' | 'WAEC' | 'NECO';
    examYear?: number;
    referralCode?: string;
    rememberMe?: boolean;
  }) => Promise<{ requiresOnboarding?: boolean }>;
  logout: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  switchUserRole: (role: 'student' | 'admin') => Promise<void>;
  targetPracticeSubject: string | null;
  setTargetPracticeSubject: (subId: string | null) => void;
  tutorInitialPrompt: string | null;
  setTutorInitialPrompt: (prompt: string | null) => void;
  openTutorWithPrompt: (prompt: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const VALID_TABS: NavTab[] = [
  'home',
  'practice',
  'cbt',
  'study_plan',
  'mistakes',
  'weak_topics',
  'what_to_study',
  'ai_tutor',
  'challenges',
  'referrals',
  'subscription',
  'profile_settings',
  'admin',
  'progress',
];

const getStoredTab = (): NavTab => {
  try {
    const hash = window.location.hash.replace('#', '') as NavTab;
    if (VALID_TABS.includes(hash)) return hash;
    const stored = (localStorage.getItem('edunexa_active_tab') || sessionStorage.getItem('edunexa_active_tab')) as NavTab;
    if (VALID_TABS.includes(stored)) return stored;
  } catch {}
  return 'home';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTabState] = useState<NavTab>(getStoredTab);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [targetPracticeSubject, setTargetPracticeSubject] = useState<string | null>(null);
  const [tutorInitialPrompt, setTutorInitialPrompt] = useState<string | null>(null);

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('edunexa_active_tab', tab);
      sessionStorage.setItem('edunexa_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.pushState({ tab }, '', `#${tab}`);
      }
    } catch {}
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If the back event was triggered by dismissing an in-app modal or picker state
      if (e.state?.modal || e.state?.picker) {
        return;
      }
      const hash = window.location.hash.replace('#', '') as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
      } else if (e.state?.tab && VALID_TABS.includes(e.state.tab)) {
        setActiveTabState(e.state.tab);
      } else {
        // Fall back to the stored tab rather than dumping the user back to home
        const stored = (sessionStorage.getItem('edunexa_active_tab') || localStorage.getItem('edunexa_active_tab')) as NavTab;
        if (stored && VALID_TABS.includes(stored)) {
          setActiveTabState(stored);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const openTutorWithPrompt = (prompt: string) => {
    setTutorInitialPrompt(prompt);
    setActiveTab('ai_tutor');
  };

  const refreshUserData = async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const data = await api.getMe();
      if (data?.user) {
        const isActuallyPro = Boolean(
          data.user.isPro &&
          (!data.user.proExpiresAt || new Date(data.user.proExpiresAt).getTime() > Date.now())
        );
        const resolvedUser = { ...data.user, isPro: isActuallyPro };
        setUser(resolvedUser);

        if (data.user.hasCompletedOnboarding === false) {
          setIsOnboarding(true);
        }
      }
      if (data?.profile) {
        const isActuallyPro = Boolean(
          data.profile.isPro &&
          (!data.user?.proExpiresAt || new Date(data.user.proExpiresAt).getTime() > Date.now())
        );
        setProfile({ ...data.profile, isPro: isActuallyPro });
      }
    } catch (e) {
      console.warn('Session expired or not logged in:', e);
      api.setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#10B981', '#F59E0B', '#3B82F6'],
      });
    } catch {
      // fallback
    }
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setProfile(data.profile);
      setAuthModal(null);

      // Remember login details
      saveRememberedCredentials({
        email: email.trim(),
        rememberMe,
        savedAt: new Date().toISOString(),
      });

      if (data.requiresOnboarding || data.user.hasCompletedOnboarding === false) {
        setIsOnboarding(true);
      } else {
        setIsOnboarding(false);
        setActiveTab(data.user.role === 'admin' ? 'admin' : 'home');
      }

      addToast({
        title: `Welcome back, ${data.user.displayName || data.user.fullName}!`,
        message: 'Your study streak and daily missions are active.',
        type: 'success',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: {
    fullName: string;
    email: string;
    password?: string;
    phone?: string;
    targetExam?: 'JAMB' | 'WAEC' | 'NECO';
    examYear?: number;
    referralCode?: string;
    rememberMe?: boolean;
  }) => {
    setIsLoading(true);
    try {
      const data = await api.register(params);
      setUser(data.user);
      setProfile(data.profile);
      setAuthModal(null);
      setIsOnboarding(true);

      // Remember login details
      saveRememberedCredentials({
        email: params.email.trim(),
        rememberMe: params.rememberMe ?? true,
        savedAt: new Date().toISOString(),
      });

      addToast({
        title: 'Account Created Successfully! 🇳🇬',
        message: "Let's personalize your targets and study plan.",
        type: 'success',
      });

      return { requiresOnboarding: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setProfile(null);
      setIsOnboarding(false);
      setActiveTab('home');
      setAuthModal('login');
      addToast({
        title: 'Signed Out',
        message: 'You have been safely logged out.',
        type: 'info',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    setIsLoading(true);
    try {
      const result = await api.submitOnboarding(data);
      setUser(result.user);
      setProfile(result.profile);
      setIsOnboarding(false);
      setActiveTab('home');
      triggerConfetti();

      addToast({
        title: 'Mission Initialized! 🎯',
        message: '+50 XP awarded! Your study plan is live.',
        type: 'xp',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserRole = async (role: 'student' | 'admin') => {
    setIsLoading(true);
    try {
      const data = await api.switchRole(role);
      setUser(data.user);
      setProfile(data.profile);
      setIsOnboarding(false);
      if (role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('home');
      }
      addToast({
        title: `Switched to ${role === 'admin' ? 'Admin Portal' : 'Student Experience'}`,
        message: `Active user: ${data.user.fullName} (${data.user.role})`,
        type: 'info',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isOnboarding,
        setIsOnboarding,
        authModal,
        setAuthModal,
        activeTab,
        setActiveTab,
        isLoading,
        toasts,
        addToast,
        removeToast,
        triggerConfetti,
        refreshUserData,
        login,
        register,
        logout,
        completeOnboarding,
        switchUserRole,
        targetPracticeSubject,
        setTargetPracticeSubject,
        tutorInitialPrompt,
        setTutorInitialPrompt,
        openTutorWithPrompt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
