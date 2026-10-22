import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AVAILABLE_EXAM_YEARS } from '../../types';

export const AuthModal: React.FC = () => {
  const { authModal, setAuthModal, login, register, switchUserRole } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    authModal === 'register' ? 'register' : authModal === 'forgot_password' ? 'forgot' : 'login'
  );

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExam, setTargetExam] = useState<'JAMB' | 'WAEC' | 'NECO'>('JAMB');
  const [examYear, setExamYear] = useState('2025');
  const [referralCode, setReferralCode] = useState('');

  // Password reset states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewGeneratedCode, setPreviewGeneratedCode] = useState<string | null>(null);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModal) return null;

  const handleClose = () => {
    setError(null);
    setSuccessMsg(null);
    setAuthModal(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        phone,
        targetExam,
        examYear: parseInt(examYear, 10),
        referralCode,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.previewCode) {
        setPreviewGeneratedCode(res.previewCode);
        setResetCode(res.previewCode);
      }
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword({ tokenOrCode: resetCode, newPassword });
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        setPassword(newPassword);
        setSuccessMsg('Password updated! You can now log in.');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'student' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      await switchUserRole(role);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        id="auth_modal_card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {mode === 'login' && 'Sign in to NaijaPrep AI'}
                {mode === 'register' && 'Create Your Student Account'}
                {mode === 'forgot' && 'Reset Your Password'}
                {mode === 'reset' && 'Set New Password'}
              </h3>
              <p className="text-xs text-emerald-200">
                {mode === 'login' && 'Access CBT past questions, study planner, and AI tutor'}
                {mode === 'register' && 'Join 45,000+ Nigerian students preparing for JAMB, WAEC & NECO'}
                {mode === 'forgot' && 'Enter your registered email to receive a reset code'}
                {mode === 'reset' && 'Enter your verification code and chosen password'}
              </p>
            </div>
          </div>
          <button
            id="auth_modal_close_btn"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs">
          <span className="text-emerald-800 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Instant Demo Access:
          </span>
          <div className="flex gap-2">
            <button
              id="quick_demo_student_btn"
              type="button"
              onClick={() => handleQuickDemo('student')}
              className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-200 font-semibold text-emerald-800 transition-colors"
            >
              Demo Student
            </button>
            <button
              id="quick_demo_admin_btn"
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-200 font-semibold text-purple-700 transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="login_email_input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@naijaprep.ng"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="login_password_input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
              </div>

              <button
                id="login_submit_btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In to Account'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (First & Last)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="reg_fullname_input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Amina Bello"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      id="reg_email_input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone (Optional for WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      id="reg_phone_input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="reg_password_input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Exam
                  </label>
                  <select
                    id="reg_target_exam_select"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                  >
                    <option value="JAMB">JAMB (UTME)</option>
                    <option value="WAEC">WAEC (SSCE)</option>
                    <option value="NECO">NECO (SSCE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Year
                  </label>
                  <select
                    id="reg_exam_year_select"
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                  >
                    {AVAILABLE_EXAM_YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <Gift className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="reg_referral_input"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CHIDU-2024"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                id="register_submit_btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue to Personal Onboarding'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="forgot_email_input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@naijaprep.ng"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                id="forgot_submit_btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {previewGeneratedCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold">Test Preview Code: </span>
                  <span className="font-mono text-sm px-2 py-0.5 bg-amber-200/70 rounded ml-1 font-bold">
                    {previewGeneratedCode}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="reset_code_input"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="e.g. 123456"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    id="reset_new_password_input"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="min. 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                id="reset_submit_btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Reset & Save Password'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
