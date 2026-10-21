import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Wallet,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ReferralStats } from '../types';

export const ReferralView: React.FC = () => {
  const { user, profile, addToast, triggerConfetti, refreshUserData } = useApp();
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: user?.referralCode || 'PREP2025',
    referralLink: `https://naijaprep.ai/?ref=${user?.referralCode || 'PREP2025'}`,
    totalClicks: 12,
    totalSignups: 4,
    totalPayingSubscribers: 2,
    totalCommissionEarnedNgn: 1500,
    walletBalanceNgn: profile?.walletBalanceNgn || 1500,
    commissionRate: 0.2,
    recentReferrals: [],
  });

  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: 'Access Bank',
    accountName: '',
  });

  useEffect(() => {
    api.getReferralStats().then(setStats).catch(console.error);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    addToast({
      title: 'Referral link copied to clipboard!',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateReferral = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateReferralUpgrade();
      triggerConfetti();
      addToast({
        title: `₦${res.commissionNgn.toLocaleString()} Commission Earned! 🎉`,
        message: `${res.friendName} upgraded to Eagle Pass! You received 20% cash!`,
        type: 'achievement',
      });
      await refreshUserData();
      const updated = await api.getReferralStats();
      setStats(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRequestWithdrawal = () => {
    if (stats.walletBalanceNgn < 1000) {
      addToast({
        title: 'Minimum withdrawal is ₦1,000',
        message: 'Share your link with more classmates to reach the threshold.',
        type: 'info',
      });
      return;
    }
    setShowWithdrawModal(false);
    addToast({
      title: `Withdrawal of ₦${stats.walletBalanceNgn.toLocaleString()} Queued!`,
      message: `Transfer processing to ${bankDetails.bankName} (${bankDetails.accountNumber || '0123456789'}).`,
      type: 'success',
    });
  };

  const whatsappMessage = encodeURIComponent(
    `Hey classmate! 👋 I'm using NaijaPrep AI to study for ${profile?.targetExam || 'JAMB'} 2025. It has authentic CBT mocks, instant AI explanations, and weak-topic tracking. Sign up with my link and let's conquer UTME together: ${stats.referralLink}`
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Hero / Commission Intro */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-yellow-300 font-bold text-xs uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            <span>NaijaPrep Ambassador Program</span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-bold">
            20% Lifetime Cash Commission
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-serif">Refer Classmates. Earn Real Naira.</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Invite fellow secondary school and university candidates. Every time a friend upgrades to{' '}
            <strong className="text-yellow-300">Eagle Pass</strong>, you instantly receive 20% of their subscription in cash directly to your wallet!
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-emerald-200 block font-semibold">Available Wallet Balance:</span>
            <div className="text-3xl font-black text-white font-mono mt-0.5">
              ₦{stats.walletBalanceNgn.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-300">
              Total Lifetime Earned: ₦{stats.totalCommissionEarnedNgn.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              id="withdraw-funds-btn"
              onClick={() => setShowWithdrawModal(true)}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              Withdraw to Bank
            </button>
          </div>
        </div>
      </div>

      {/* 2. Referral Link & Share Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Your Exclusive Referral Link</h3>
        <p className="text-xs text-slate-500">
          Share this link across WhatsApp study groups, school forums, and lesson centers:
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl font-mono text-xs text-slate-800 break-all select-all">
            {stats.referralLink}
          </div>

          <button
            id="copy-ref-link-btn"
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            id="share-whatsapp-btn"
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>
        </div>

        {/* Commission simulation for testing preview */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
          <div>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Preview Interactive Demo
            </span>
            <p className="text-xs text-amber-800 mt-0.5">
              Click to simulate an invited friend subscribing to Pro and observe your 20% commission (+₦500) credit immediately.
            </p>
          </div>

          <button
            id="simulate-friend-upgrade-btn"
            onClick={handleSimulateReferral}
            disabled={isSimulating}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 shadow-sm"
          >
            {isSimulating ? 'Processing...' : 'Simulate Friend Upgrade'}
          </button>
        </div>
      </div>

      {/* 3. Referral Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Friends Registered</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats.totalSignups}</span>
          <p className="text-[11px] text-slate-500 mt-1">Classmates on free accounts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Eagle Pass Upgrades</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-2xl font-black text-emerald-700">{stats.totalPayingSubscribers}</span>
          <p className="text-[11px] text-slate-500 mt-1">Converted friends generating 20%</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Commission Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">20%</span>
          <p className="text-[11px] text-slate-500 mt-1">₦500 to ₦3,000 per upgrade</p>
        </div>
      </div>

      {/* 4. Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Withdraw to Nigerian Bank
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Bank</label>
                <select
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl"
                >
                  <option>Access Bank</option>
                  <option>GTBank (Guaranty Trust)</option>
                  <option>Zenith Bank</option>
                  <option>First Bank of Nigeria</option>
                  <option>UBA (United Bank for Africa)</option>
                  <option>Kuda Microfinance Bank</option>
                  <option>OPay / PalmPay</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">10-Digit NUBAN Account Number</label>
                <input
                  type="text"
                  placeholder="0123456789"
                  maxLength={10}
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder={user?.fullName || 'Full Legal Name'}
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800">
                Withdrawing: <strong>₦{stats.walletBalanceNgn.toLocaleString()}</strong>.
                Payouts are handled within 12-24 hours via automated NIP transfer.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestWithdrawal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
