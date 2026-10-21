import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  Timer,
  CalendarCheck,
  Bot,
  AlertCircle,
  Trophy,
  BarChart3,
  Share2,
  User,
  MoreHorizontal,
  X,
  Shield,
  CreditCard,
  Compass,
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, user } = useApp();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const mainNavItems: { id: NavTab; label: string; icon: React.ElementType; isSpecial?: boolean }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'cbt', label: 'CBT Exam', icon: Timer, isSpecial: true },
    { id: 'ai_tutor', label: 'AI Coach', icon: Bot },
  ];

  const secondaryNavItems = [
    { id: 'what_to_study' as NavTab, label: 'What Should I Study?', icon: Compass, desc: '5-pillar AI study diagnosis & prescription' },
    { id: 'study_plan' as NavTab, label: 'Weekly Study Plan', icon: CalendarCheck, desc: 'Personalized syllabus schedule & daily targets' },
    { id: 'weak_topics' as NavTab, label: 'My Weak Topics', icon: BarChart3, desc: 'Prioritized weakness engine & accuracy analysis' },
    { id: 'mistakes' as NavTab, label: 'Mistake Bank', icon: AlertCircle, desc: 'Practice & conquer previous mistakes' },
    { id: 'challenges' as NavTab, label: 'Challenges & Ranks', icon: Trophy, desc: 'UTME sprints & national leaderboard' },
    { id: 'referrals' as NavTab, label: 'Refer & Earn 20%', icon: Share2, desc: 'Invite classmates and earn ₦500+ commission' },
    { id: 'subscription' as NavTab, label: 'Eagle Pass (VIP)', icon: CreditCard, desc: 'Upgrade for 30 daily Snap & Solves via Bachs.io' },
    { id: 'profile_settings' as NavTab, label: 'Profile & Targets', icon: User, desc: 'Exam selection, target score & hours' },
    ...((user?.role === 'admin' || user?.email?.toLowerCase() === 'christianarinze024@gmail.com')
      ? [{ id: 'admin' as NavTab, label: 'Admin Portal', icon: Shield, desc: 'Curriculum, payments & platform (Christian)' }]
      : []),
  ];

  return (
    <>
      {/* Desktop / Tablet Top Sub-Navigation Bar */}
      <nav className="hidden lg:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center space-x-1">
            {[...mainNavItems, ...secondaryNavItems.slice(0, 4)].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1">
            {secondaryNavItems.slice(4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-subnav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Floating / Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                setShowMoreDrawer(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.isSpecial ? (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center -mt-3.5 shadow-md ${
                    isActive
                      ? 'bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-emerald-500/30'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
              )}
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Drawer Trigger */}
        <button
          id="mobile-nav-more"
          onClick={() => setShowMoreDrawer(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 ${
            secondaryNavItems.some((s) => s.id === activeTab) ? 'text-emerald-700 font-bold' : ''
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Modal */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Study Tools & Services</h3>
              <button
                id="close-more-drawer-btn"
                onClick={() => setShowMoreDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-3">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`drawer-item-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreDrawer(false);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-2xl text-left transition-colors ${
                      isActive ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-700">
                Built and Designed by Arinzechukwu Christian • Powered by Arinze Web Studios
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
