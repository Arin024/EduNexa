import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api, getRememberedCredentials } from '../../services/api';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Gift,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';
import { PWAInstallButton } from '../PWAInstallButton';
import { AVAILABLE_EXAM_YEARS } from '../../types';

export const AuthGateView: React.FC = () => {
  const { login, register, switchUserRole } = useApp();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExam, setTargetExam] = useState<'JAMB' | 'WAEC' | 'NECO'>('JAMB');
  const [examYear, setExamYear] = useState('2025');
  const [referralCode, setReferralCode] = useState('');

  // Password reset
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewGeneratedCode, setPreviewGeneratedCode] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasRememberedCreds, setHasRememberedCreds] = useState(false);

  useEffect(() => {
    const remembered = getRememberedCredentials();
    if (remembered?.email) {
      setEmail(remembered.email);
      setRememberMe(remembered.rememberMe);
      setHasRememberedCreds(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide your full name and email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        targetExam,
        examYear: parseInt(examYear, 10),
        referralCode: referralCode.trim(),
        rememberMe,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMsg(res.message);
      if (res.previewCode) {
        setPreviewGeneratedCode(res.previewCode);
        setResetCode(res.previewCode);
      }
      setTab('reset');
    } catch (err: any) {
      setError(err?.message || 'Could not send reset code.');
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
        setTab('login');
        setPassword(newPassword);
        setSuccessMsg('Password updated! You can now log in.');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const autofillAdmin = () => {
    setEmail('christianarinze024@gmail.com');
    setPassword('admin123');
    setTab('login');
    setError(null);
  };

  const autofillStudent = () => {
    setEmail('student@edunexa.ng');
    setPassword('student123');
    setTab('login');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between py-6 px-3 sm:px-6 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background aesthetic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-teal-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top bar with install button */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 z-10 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
            <span>🇳🇬</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-tight flex items-center gap-1.5">
              <span>EduNexa</span>
              <span className="text-emerald-400 font-serif">AI</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              National Syllabus & CBT Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton compact />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-4 min-w-0">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl space-y-5">
          {/* Header text */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sign in to access CBT mocks & AI coach</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
              {tab === 'login' && 'Welcome Back, Scholar'}
              {tab === 'register' && 'Create Your Student Account'}
              {tab === 'forgot' && 'Reset Your Password'}
              {tab === 'reset' && 'Enter Verification Code'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {tab === 'login' && 'Log in to continue your streak, CBT tests, and personalized study targets.'}
              {tab === 'register' && 'Join thousands of Nigerian scholars prepping for JAMB, WAEC & NECO.'}
              {tab === 'forgot' && 'Enter your registered email to receive an instant verification reset token.'}
              {tab === 'reset' && 'Enter the reset code sent to your account and set a new password.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {tab !== 'reset' && (
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  tab === 'login'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  tab === 'register'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 break-words">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 break-words">{successMsg}</div>
            </div>
          )}

          {hasRememberedCreds && tab === 'login' && (
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-700/30 rounded-xl px-3 py-1.5 text-[11px] text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Saved credentials remembered on this device</span>
              </span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@edunexa.ng"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span className="font-semibold text-xs">Remember my details on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In & Access Study Engine</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick autofill test helpers */}
              <div className="pt-2 border-t border-slate-700/60 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 text-center">
                  Quick Testing Accounts (1-Click Fill)
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={autofillStudent}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Demo Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={autofillAdmin}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/60 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin (Christian)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chinedu Okeke"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chinedu@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Target Exam
                  </label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="JAMB">JAMB (UTME)</option>
                    <option value="WAEC">WAEC (SSCE)</option>
                    <option value="NECO">NECO (SSCE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Exam Year
                  </label>
                  <select
                    value={examYear}
                    onChange={(e) => setExamYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
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
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Referral Code
                  </label>
                  <div className="relative">
                    <Gift className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ARINZE-9"
                      className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                  />
                  <span>Remember details on this device for future logins</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account & Start Prepping</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@edunexa.ng"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="flex-1 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  {loading ? 'Sending...' : 'Get Reset Code'}
                </button>
              </div>
            </form>
          )}

          {/* 4. RESET CODE SUBMISSION FORM */}
          {tab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {previewGeneratedCode && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-bold">Instant OTP Preview:</span>
                  <div className="font-mono text-base font-black tracking-widest text-amber-400">
                    {previewGeneratedCode}
                  </div>
                  <p className="text-[10px] text-amber-200/80">Code pre-filled for your convenience.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="e.g. 849201"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer attribution & copyright */}
      <footer className="max-w-5xl w-full mx-auto text-center pt-4 border-t border-slate-800 text-[11px] text-slate-500 z-10 min-w-0">
        <p>
          EduNexa AI • Designed & Built by{' '}
          <strong className="text-slate-400">Arinzechukwu Christian</strong> •{' '}
          <span className="text-emerald-500 font-semibold">Arinze Web Studios</span>
        </p>
      </footer>
    </div>
  );
};
