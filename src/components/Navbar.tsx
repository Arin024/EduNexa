import React, { useState } from 'react';
import {
  Flame,
  Crown,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  ChevronDown,
  UserCheck,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const { user, profile, isAuthenticated, setActiveTab, setAuthModal, logout, switchUserRole } =
    useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div
          id="nav_brand_btn"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight font-serif">
                EduNexa <span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {profile?.targetExam || 'JAMB'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              National Syllabus & CBT Engine
            </p>
          </div>
        </div>

        {/* Middle Stats Badges (Streak, XP, Level) - Responsive */}
        {profile && (
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Streak */}
            <div
              id="nav_streak_badge"
              onClick={() => setActiveTab('profile_settings')}
              title={`${profile.currentStreak} Day Study Streak`}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-800">{profile.currentStreak}d</span>
            </div>

            {/* XP & Level */}
            <div
              id="nav_xp_badge"
              onClick={() => setActiveTab('challenges')}
              title={`${profile.totalXp} Total XP`}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">
                Lvl {profile.currentLevel} • {profile.totalXp} XP
              </span>
            </div>
          </div>
        )}

        {/* Right CTA / Auth & Role switcher */}
        <div className="flex items-center gap-2">
          {/* Quick PWA Install for Fast & Offline Practice */}
          <PWAInstallButton />

          {/* Subscription Status or Upgrade */}
          {user?.isPro ? (
            <button
              id="nav_pro_active_btn"
              onClick={() => setActiveTab('subscription')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:opacity-95 transition-opacity"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Eagle Pass Active</span>
              <span className="xs:hidden">Pro</span>
            </button>
          ) : (
            <button
              id="nav_upgrade_btn"
              onClick={() => setActiveTab('subscription')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:shadow"
            >
              <Crown className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">Get Eagle Pass</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
          )}

          {/* Admin Portal - Strictly restricted to Nwajiaku Arinzechukwu Christian */}
          {user?.email?.toLowerCase() === 'christianarinze024@gmail.com' && (
            <button
              id="nav_admin_portal_btn"
              onClick={() => setActiveTab('admin')}
              title="Admin Portal (Nwajiaku Arinzechukwu Christian)"
              className="flex items-center gap-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}

          {/* User Account / Auth Buttons */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                id="nav_user_menu_btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:inline">
                  {user.displayName || user.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  id="nav_user_dropdown"
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile_settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" /> Student Profile
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="nav_login_btn"
                onClick={() => setAuthModal('login')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in</span>
              </button>
              <button
                id="nav_signup_btn"
                onClick={() => setAuthModal('register')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
