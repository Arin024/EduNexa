import React from 'react';
import { ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 pt-12 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-tight font-serif">
                EduNexa <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Nigeria
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Empowering Nigerian secondary school and university candidates with visual Snap & Solve, intelligent CBT simulations,
              real-time AI tutoring, weak-topic diagnostics, and personalized study pacing for JAMB UTME, WAEC SSCE, and NECO.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                <Sparkles className="w-3.5 h-3.5" /> High-Yield Past Questions
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Offline-Friendly Architecture
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Exam Modules
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => setActiveTab('practice')} className="hover:text-emerald-400 transition-colors">
                  Topic Practice Bank
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('cbt')} className="hover:text-emerald-400 transition-colors">
                  Timed CBT Mock Exam
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('study_plan')} className="hover:text-emerald-400 transition-colors">
                  Personalized Study Planner
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('mistakes')} className="hover:text-emerald-400 transition-colors">
                  Mistake Bank & Mastery
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('ai_tutor')} className="hover:text-emerald-400 transition-colors">
                  AI Socratic Exam Coach
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Rewards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Rewards & Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => setActiveTab('referrals')} className="hover:text-emerald-400 transition-colors">
                  Referral Program (20% Cash)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('challenges')} className="hover:text-emerald-400 transition-colors">
                  National Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('subscription')} className="hover:text-emerald-400 transition-colors">
                  Eagle Pass Pro Upgrade
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/?text=Check%20out%20PrepMaster%20AI%20to%20practice%20for%20JAMB%2C%20WAEC%20and%20NECO"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Study Tribe
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Studio Attribution & Legal Disclaimer */}
        <div className="pt-8 mt-8 border-t border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="font-semibold text-slate-300">
              Built and Designed by <span className="text-emerald-400 font-bold">Arinzechukwu Christian</span>
            </p>
            <p className="font-medium text-slate-400">
              Powered by <span className="text-white font-semibold">Arinze Web Studios</span>
            </p>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <strong>Important Disclaimer:</strong> PrepMaster AI is an independent educational technology platform designed to facilitate student learning, past question revision, and CBT test familiarity. It is not affiliated with, endorsed by, or sponsored by the Joint Admissions and Matriculation Board (JAMB), the West African Examinations Council (WAEC), or the National Examinations Council (NECO). All examination acronyms and subject syllabuses remain property of their respective examining bodies.
          </p>
        </div>
      </div>
    </footer>
  );
};
