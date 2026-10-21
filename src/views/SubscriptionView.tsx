import React, { useState, useEffect } from 'react';
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Zap,
  Building,
  Smartphone,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  ArrowUpRight,
  Award,
  AlertCircle,
  HelpCircle,
  Clock,
  UserCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const SubscriptionView: React.FC = () => {
  const { user, refreshUserData, addToast, triggerConfetti } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'termly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card' | 'ussd'>('transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [narration, setNarration] = useState('');

  // User's past transfer requests
  const [myTransfers, setMyTransfers] = useState<any[]>([]);

  // Admin section states (Christian Arinze)
  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'christianarinze024@gmail.com';
  const [adminPending, setAdminPending] = useState<any[]>([]);
  const [adminAllTransfers, setAdminAllTransfers] = useState<any[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState<string | null>(null);

  // Manual reference verification
  const [manualReference, setManualReference] = useState('');
  const [isVerifyingRef, setIsVerifyingRef] = useState(false);
  const [showRefInput, setShowRefInput] = useState(false);

  // Card form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardPin, setCardPin] = useState('');

  // Official Bank Account for Direct Bank Transfer
  const bankAccount = {
    bankName: 'Opay',
    accountNumber: '8160754659',
    accountName: 'Nwajiaku Arinzechukwu Christian',
  };

  // USSD
  const [ussdBank, setUssdBank] = useState('opay');

  // Bachs Gateway Status
  const [bachsStatus, setBachsStatus] = useState<{ configured: boolean; keyMasked: string; apiUrl: string } | null>(null);

  const loadMyTransfers = () => {
    api.getMyBankTransfers()
      .then((res) => setMyTransfers(res.transfers || []))
      .catch(() => {});
  };

  const loadAdminTransfers = () => {
    if (!isAdmin) return;
    setIsLoadingAdmin(true);
    api.getAdminPendingTransfers()
      .then((res) => {
        setAdminPending(res.pending || []);
        setAdminAllTransfers(res.allTransfers || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingAdmin(false));
  };

  useEffect(() => {
    api.getBachsStatus()
      .then((status) => setBachsStatus(status))
      .catch(() => {});

    loadMyTransfers();

    if (isAdmin) {
      loadAdminTransfers();
    }
  }, [user?.id, isAdmin]);

  // Check if returning from a real live payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSuccess =
      params.get('payment_success') === '1' ||
      params.get('status') === 'successful' ||
      params.get('status') === 'paid' ||
      params.get('checkout_session') !== null;

    if (hasSuccess) {
      const ref = params.get('ref') || params.get('reference') || params.get('checkout_id') || '';
      const planParam = (params.get('plan') as any) || 'monthly';

      if (ref) {
        api.verifyRealPayment({ reference: ref, checkoutId: params.get('checkout_session') || ref, planId: planParam })
          .then((res) => {
            if (res.isPro) {
              triggerConfetti();
              addToast({
                title: 'Payment Confirmed by Bachs! 👑',
                message: 'Your EduNexa VIP Eagle Pass is now ACTIVE!',
                type: 'achievement',
              });
              refreshUserData();
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              addToast({
                title: 'Payment Pending',
                message: 'Your payment was not confirmed as completed. Please check your bank debit status.',
                type: 'info',
              });
            }
          })
          .catch((err) => {
            addToast({
              title: 'Verification Failed',
              message: err?.message || 'Payment has not been confirmed by the payment switch.',
              type: 'info',
            });
          });
      }
    }
  }, []);

  const plans = [
    {
      id: 'weekly' as const,
      name: 'Weekly Sprint',
      priceNgn: 750,
      duration: '7 Days',
      badge: 'Sprint',
      savings: null,
      description: 'Full CBT mocks & AI Socratic tutor drills for quick 7-day revision.',
    },
    {
      id: 'monthly' as const,
      name: 'Monthly Pro',
      priceNgn: 2500,
      duration: '30 Days',
      badge: 'Popular',
      isFeatured: true,
      savings: null,
      description: 'Complete 1-month preparation with 30 daily Snap & Solves and syllabus study plan.',
    },
    {
      id: 'termly' as const,
      name: 'Eagle Pass (3-Mo)',
      priceNgn: 6500,
      duration: '3 Months',
      badge: 'Best Value',
      savings: 'Save ₦1,000',
      description: 'Full term mastery covering complete JAMB & WAEC syllabus and 20-year past questions.',
    },
    {
      id: 'annual' as const,
      name: 'Annual Distinction',
      priceNgn: 18000,
      duration: '1 Full Year',
      badge: 'Merit Scholar',
      savings: 'Save ₦12,000',
      description: '365 days of unlimited access for JAMB, WAEC, NECO & Post-UTME screening drills.',
    },
  ];

  const currentPlanObj = plans.find((p) => p.id === selectedPlan)!;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankAccount.accountNumber);
    setCopiedAccount(true);
    addToast({
      title: 'Account Number Copied! 📋',
      message: `${bankAccount.accountNumber} (${bankAccount.bankName}) copied to clipboard.`,
      type: 'info',
    });
    setTimeout(() => setCopiedAccount(false), 3000);
  };

  const handleFillTestCard = () => {
    setCardNumber('5399 4120 8910 2489');
    setCardExpiry('08/28');
    setCardCvv('712');
    setCardPin('1234');
  };

  // 1. SUBMIT BANK TRANSFER PROOF (Does NOT auto-activate, creates PENDING record for Christian)
  const handleSubmitBankTransfer = async () => {
    setIsProcessing(true);
    setProcessingStep('Recording transfer submission...');

    const reference = `TRF_OPAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      await new Promise((r) => setTimeout(r, 600));

      const res = await api.processBankTransfer({
        planId: selectedPlan,
        amountNgn: currentPlanObj.priceNgn,
        senderName: senderName.trim() || user?.fullName || 'Scholar',
        narration: narration.trim() || `PrepMaster ${currentPlanObj.name}`,
        reference,
      });

      setShowCheckoutModal(false);
      setPendingSubmission(res.payment || {
        reference,
        amountNgn: currentPlanObj.priceNgn,
        planId: selectedPlan,
        senderName: senderName.trim() || user?.fullName,
        createdAt: new Date().toISOString(),
      });
      setShowPendingModal(true);
      loadMyTransfers();

      if (isAdmin) {
        loadAdminTransfers();
      }

      addToast({
        title: 'Transfer Submitted for Confirmation ⏳',
        message: 'Your transfer was sent to Christian for verification. VIP will unlock once confirmed.',
        type: 'info',
      });
    } catch (e: any) {
      console.warn('Bank transfer submission error:', e);
      addToast({
        title: 'Submission Error',
        message: e?.message || 'Could not submit transfer details. Please retry.',
        type: 'info',
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // 2. ADMIN CONFIRMS BANK TRANSFER (Christian only)
  const handleAdminConfirmTransfer = async (paymentId: string) => {
    setAdminActionLoadingId(paymentId);
    try {
      const res = await api.adminConfirmTransfer(paymentId);
      triggerConfetti();
      addToast({
        title: 'Transfer Confirmed! 👑',
        message: res.message || 'VIP Pass activated for student!',
        type: 'achievement',
      });
      loadAdminTransfers();
      refreshUserData();
    } catch (e: any) {
      addToast({
        title: 'Confirmation Failed',
        message: e?.message || 'Could not confirm transfer.',
        type: 'info',
      });
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  // 3. ADMIN REJECTS BANK TRANSFER (Christian only)
  const handleAdminRejectTransfer = async (paymentId: string) => {
    const reason = window.prompt('Reason for rejection (e.g. Alert not seen, wrong amount):', 'Payment alert not received in Opay account');
    if (reason === null) return;

    setAdminActionLoadingId(paymentId);
    try {
      await api.adminRejectTransfer(paymentId, reason);
      addToast({
        title: 'Transfer Rejected',
        message: 'Student transfer marked as rejected.',
        type: 'info',
      });
      loadAdminTransfers();
    } catch (e: any) {
      addToast({
        title: 'Error',
        message: e?.message || 'Could not reject transfer.',
        type: 'info',
      });
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  // 4. LIVE BACHS.IO CHECKOUT REDIRECT
  const handleLaunchLiveBachsCheckout = async () => {
    setIsCreatingCheckout(true);
    try {
      const res = await api.createRealCheckout({
        planId: selectedPlan,
        amountNgn: currentPlanObj.priceNgn,
        email: user?.email,
        phone: user?.phone,
      });

      if (res.checkoutUrl && res.checkoutUrl.startsWith('http')) {
        addToast({
          title: 'Opening Bachs.io Gateway...',
          message: 'Redirecting to official checkout session.',
          type: 'info',
        });
        window.location.href = res.checkoutUrl;
      } else {
        setShowCheckoutModal(true);
      }
    } catch (e: any) {
      console.warn('Could not launch live Bachs checkout:', e);
      setShowCheckoutModal(true);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // 5. MANUAL REFERENCE ACTIVATION (Strict verification)
  const handleActivateByReference = async () => {
    if (!manualReference.trim()) {
      addToast({
        title: 'Missing Reference',
        message: 'Please paste your Bachs reference or bank transfer session ID.',
        type: 'info',
      });
      return;
    }

    setIsVerifyingRef(true);
    try {
      const res = await api.activateByReference(manualReference.trim(), selectedPlan);
      await refreshUserData();
      triggerConfetti();
      setCompletedPayment({
        reference: manualReference.trim(),
        amountNgn: currentPlanObj.priceNgn,
        planId: selectedPlan,
        provider: 'Confirmed Payment',
        paidAt: new Date().toISOString(),
        method: 'verified',
      });
      setShowReceiptModal(true);
      setShowRefInput(false);
      setManualReference('');

      addToast({
        title: 'Eagle Pass Activated! 🌟',
        message: res.message || 'Payment verified successfully.',
        type: 'achievement',
      });
    } catch (e: any) {
      addToast({
        title: 'Verification Error',
        message: e?.message || 'Payment has not been confirmed as paid yet. Please check with your bank.',
        type: 'info',
      });
    } finally {
      setIsVerifyingRef(false);
    }
  };

  const proFeatures = [
    '30 Snap & Solve visual photo drills daily (Free: 1/day)',
    'Unlimited AI Socratic tutor explanations for any past question',
    'Unlimited timed JAMB/WAEC CBT mocks with real scoring',
    '20-year past question bank with step-by-step marking schemes',
    'Weak-topic diagnostic radar tracking accuracy down to subtopics',
    'Dynamic weekly study plan personalized to your exam date',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-1 sm:px-3 min-w-0 pb-16">
      {/* 1. Mobile App Style Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-900/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>EduNexa VIP Eagle Pass</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Unlock All-Subject Exam Mastery
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              30 daily visual Snap & Solves, unlimited CBT mock exams, and 24/7 AI coaching.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
            {user?.isPro ? (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VIP ACTIVE 👑</span>
                </span>
                {user?.proExpiresAt && (
                  <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-lg">
                    {(() => {
                      const ms = new Date(user.proExpiresAt).getTime() - Date.now();
                      const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
                      const hours = Math.max(0, Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
                      if (ms <= 0) return 'Pass Expired';
                      return `${days}d ${hours}h left (until ${new Date(user.proExpiresAt).toLocaleDateString()})`;
                    })()}
                  </span>
                )}
              </div>
            ) : user?.proExpiresAt && new Date(user.proExpiresAt).getTime() <= Date.now() ? (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="inline-flex items-center gap-1.5 bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-2xl text-xs font-bold">
                  <span>Pass Expired</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Ended on {new Date(user.proExpiresAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-2xl text-xs font-semibold">
                <span>Free Tier (1 Snap/Day)</span>
              </span>
            )}
            <div className="text-[10px] text-emerald-300/80 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified OPay Bank Transfer & Bachs Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN REVIEW PANEL (Visible only to Christian Arinze) */}
      {isAdmin && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-slate-950 rounded-xl font-black text-xs">ADMIN</span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <span>Christian's Payment Review Portal</span>
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-xs font-bold">
                  {adminPending.length} Pending
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>{showAdminPanel ? 'Collapse' : 'Expand'}</span>
              {showAdminPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showAdminPanel && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <p>
                  Review student transfers to your OPay account (<strong>8160754659</strong>). Only confirmed payments activate VIP.
                </p>
                <button
                  type="button"
                  onClick={loadAdminTransfers}
                  disabled={isLoadingAdmin}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingAdmin ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {adminPending.length === 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                  <span>All caught up! No pending bank transfers awaiting confirmation.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {adminPending.map((pt) => (
                    <div
                      key={pt.id}
                      className="p-3.5 bg-white rounded-2xl border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {pt.studentName || pt.senderName || 'Student'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                            ₦{Number(pt.amountNgn).toLocaleString()}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {pt.planId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 font-mono">
                          <span>Sender: <strong>{pt.senderName || 'Not stated'}</strong></span>
                          <span>Ref: <strong>{pt.reference}</strong></span>
                          <span>Time: {new Date(pt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {pt.studentEmail && (
                          <div className="text-[10px] text-slate-500">
                            Email: {pt.studentEmail}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={adminActionLoadingId === pt.id}
                          onClick={() => handleAdminConfirmTransfer(pt.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                        >
                          {adminActionLoadingId === pt.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm Alert & Unlock VIP</span>
                        </button>
                        <button
                          type="button"
                          disabled={adminActionLoadingId === pt.id}
                          onClick={() => handleAdminRejectTransfer(pt.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STUDENT'S PENDING TRANSFER BANNER */}
      {myTransfers.some((t) => t.status === 'pending') && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">Bank Transfer Pending Confirmation</span>
              <p className="text-[11px] text-amber-800">
                Christian is verifying your transfer. VIP will unlock once confirmed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadMyTransfers}
            className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[10px] font-bold text-amber-800"
          >
            Check Status
          </button>
        </div>
      )}

      {/* 2. Compact 4-Plan Mobile Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                isSelected
                  ? 'border-emerald-600 bg-white shadow-lg ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {plan.savings && (
                <span className="absolute -top-2.5 right-2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                  {plan.savings}
                </span>
              )}
              {plan.isFeatured && !plan.savings && (
                <span className="absolute -top-2.5 right-2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                  Popular
                </span>
              )}

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  {plan.duration}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                    ₦{plan.priceNgn.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <div
                  className={`w-full py-1.5 rounded-xl text-center text-[11px] font-bold transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. PRIMARY PAYMENT METHOD: Direct Bank Transfer (Opay) */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/70">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wide">
              <Zap className="w-3 h-3" />
              <span>Recommended • 0% Fee • Most Popular in Nigeria</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-700" />
              <span>Pay via Bank Transfer to OPay</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Transfer to our dedicated Opay account from any Nigerian bank (OPay, PalmPay, Kuda, GTB, Zenith, etc.)
            </p>
          </div>
          <div className="text-left sm:text-right bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Exact Amount to Transfer:</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              ₦{currentPlanObj.priceNgn.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">({currentPlanObj.name})</span>
          </div>
        </div>

        {/* Bank Account Details Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-300/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bank Name */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Bank Name</span>
              <span className="text-base font-black text-slate-900">{bankAccount.bankName}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">OPay Digital Services</span>
            </div>

            {/* Account Number */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Account Number</span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-950 tracking-wider">
                  {bankAccount.accountNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="mt-1.5 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? 'Copied to Clipboard!' : 'Copy Account Number'}</span>
              </button>
            </div>

            {/* Account Name */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Beneficiary / Account Name</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block leading-snug">
                {bankAccount.accountName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Verified Account</span>
            </div>
          </div>

          {/* Quick steps */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
            <p>
              <strong>Step 1:</strong> Copy <strong>8160754659</strong> and open your banking app.
            </p>
            <p>
              <strong>Step 2:</strong> Transfer <strong>₦{currentPlanObj.priceNgn.toLocaleString()}</strong> to <strong>OPay - {bankAccount.accountName}</strong>.
            </p>
            <p>
              <strong>Step 3:</strong> Fill in your sender name below and tap <strong>"Submit Transfer Details"</strong>. Christian will confirm your payment and your VIP access will unlock!
            </p>
          </div>

          {/* Transfer Confirmation Inputs */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Your Sender Name / Account Name: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Chinedu Okafor"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Transfer Narration / Session ID (Optional):
              </label>
              <input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder={`EduNexa ${currentPlanObj.name}`}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Direct Bank Transfer Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSubmitBankTransfer}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processingStep || 'Submitting Details...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>I Have Sent ₦{currentPlanObj.priceNgn.toLocaleString()} — Submit Transfer Proof</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Alternative Online Payment (Bachs.io Live & Cards) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Alternative: Pay with Card on Bachs.io Live Switch
            </h4>
            <p className="text-xs text-slate-500">
              Need instant automated activation via ATM Card (Mastercard, Visa, Verve)? Use Bachs live gateway.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isCreatingCheckout}
            onClick={handleLaunchLiveBachsCheckout}
            className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isCreatingCheckout ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Opening Gateway...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Pay Online with Bachs Gateway</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentMethod('card');
              setShowCheckoutModal(true);
            }}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <CreditCard className="w-4 h-4 text-slate-600" />
            <span>ATM Card Details / USSD Dial</span>
          </button>
        </div>

        {/* "Already Paid / Verify Reference" Expandable Row */}
        <div className="pt-2">
          {!showRefInput ? (
            <button
              type="button"
              onClick={() => setShowRefInput(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Already paid or completed Bachs session? Enter Reference ID to verify</span>
            </button>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Verify Payment on Bachs Gateway</span>
                <button
                  type="button"
                  onClick={() => setShowRefInput(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualReference}
                  onChange={(e) => setManualReference(e.target.value)}
                  placeholder="Paste Bachs checkout ID or reference"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isVerifyingRef}
                  onClick={handleActivateByReference}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isVerifyingRef ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Verify</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Note: VIP will activate strictly if the transaction status is confirmed as PAID by the payment switch.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. What's Included in VIP Eagle Pass */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Everything Unlocked with Your VIP Pass</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {proFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Pending Transfer Modal (Student) */}
      {showPendingModal && pendingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-auto text-center min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Transfer Submitted
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
                Awaiting Admin Confirmation
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Christian Arinze will confirm your alert on OPay. Once confirmed, your VIP Eagle Pass will unlock automatically.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Reference:</span>
                <span className="font-mono font-bold text-slate-900 text-[10px] truncate max-w-[150px]">
                  {pendingSubmission.reference}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <strong className="text-emerald-700 font-mono">₦{pendingSubmission.amountNgn.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sender Name:</span>
                <strong className="text-slate-900">{pendingSubmission.senderName || 'Student'}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Pending Christian's Approval</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPendingModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
            >
              I Understand, Continue Studying
            </button>
          </div>
        </div>
      )}

      {/* 7. Modal for Card / USSD Options */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-auto min-w-0">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Payment Options
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {currentPlanObj.name} (₦{currentPlanObj.priceNgn.toLocaleString()})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Channels tab */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all border ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-transparent text-slate-600 hover:bg-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px]">ATM Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ussd')}
                className={`py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all border ${
                  paymentMethod === 'ussd'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-transparent text-slate-600 hover:bg-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px]">USSD Dial</span>
              </button>
            </div>

            {/* ATM Card Form */}
            {paymentMethod === 'card' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Nigerian ATM Card</span>
                  <button
                    type="button"
                    onClick={handleFillTestCard}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    Auto-Fill Test Verve
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number: 5399 •••• •••• ••••"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="CVV"
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="PIN"
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mastercard, Visa, and Verve supported on Bachs live switch.</span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLaunchLiveBachsCheckout}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Authorize on Live Gateway</span>
                  </button>
                </div>
              </div>
            )}

            {/* USSD Details */}
            {paymentMethod === 'ussd' && (
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
                <span className="font-bold text-amber-900 block">Dial USSD on Phone</span>
                <select
                  value={ussdBank}
                  onChange={(e) => setUssdBank(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                >
                  <option value="opay">OPay / PalmPay</option>
                  <option value="gtbank">GTBank (*737#)</option>
                  <option value="zenith">Zenith Bank (*966#)</option>
                  <option value="uba">UBA (*919#)</option>
                </select>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center font-mono font-black text-slate-900 text-xs">
                  {ussdBank === 'opay' && `Transfer to: ${bankAccount.accountNumber} (${bankAccount.bankName})`}
                  {ussdBank === 'gtbank' && `*737*000*${currentPlanObj.priceNgn}#`}
                  {ussdBank === 'zenith' && `*966*00*${currentPlanObj.priceNgn}#`}
                  {ussdBank === 'uba' && `*919*00*${currentPlanObj.priceNgn}#`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Verified Payment Receipt Modal */}
      {showReceiptModal && completedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-auto text-center min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Payment Confirmed
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1.5">Welcome to EduNexa VIP! 👑</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Eagle Pass activated. 30 daily visual Snap & Solves are ready.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Reference:</span>
                <span className="font-mono font-bold text-slate-900 text-[10px] truncate max-w-[150px]">
                  {completedPayment.reference}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Plan:</span>
                <strong className="text-slate-900">{currentPlanObj.name}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <strong className="text-emerald-700 font-mono">₦{completedPayment.amountNgn.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verification:</span>
                <span className="font-mono text-emerald-700 font-bold">Confirmed by Merchant</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              Start Practicing as VIP Scholar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
