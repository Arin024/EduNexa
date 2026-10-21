import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Sparkles,
  Users,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Challenge, Achievement, LeaderboardEntry } from '../types';
import { DailyMissionCard } from '../components/DailyMissionCard';

export const ChallengesView: React.FC = () => {
  const { profile, setActiveTab } = useApp();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedExamTab, setSelectedExamTab] = useState<'JAMB' | 'WAEC' | 'NECO'>('JAMB');

  useEffect(() => {
    api.getChallenges().then(setChallenges).catch(console.error);
    api.getAchievements().then(setAchievements).catch(console.error);
  }, []);

  useEffect(() => {
    api.getLeaderboard(selectedExamTab).then(setLeaderboard).catch(console.error);
  }, [selectedExamTab]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. Header Hero */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-yellow-200 font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-5 h-5" />
            <span>National Scholar Arena</span>
          </div>
          <span className="text-xs bg-black/20 px-3 py-1 rounded-full border border-white/20 font-bold">
            Season 2025/2026
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-serif">Compete, Conquer & Level Up</h2>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Join national timed sprint challenges, earn exclusive merit badges, and compete with ambitious scholars across Nigeria for top spots on the UTME leaderboard.
          </p>
        </div>

        {/* User's Current Rank Card */}
        <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              #{profile?.currentLevel ? Math.max(1, 14 - profile.currentLevel) : 12}
            </div>
            <div>
              <span className="text-xs text-amber-200 block font-semibold">Your National Standing:</span>
              <h4 className="text-sm font-extrabold text-white">
                Level {profile?.currentLevel || 1} • {profile?.totalXp || 0} XP
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-amber-200 block font-semibold">Study Streak:</span>
            <span className="text-sm font-black text-yellow-300 flex items-center gap-1 justify-end">
              <Flame className="w-4 h-4 fill-yellow-400" />
              {profile?.currentStreak || 1} Days
            </span>
          </div>
        </div>
      </div>

      {/* Daily Study Mission & Weekly Challenges */}
      <DailyMissionCard />

      {/* 2. Active National Challenges */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Active Sprints & Tournaments
          </h3>
          <span className="text-xs text-slate-500 font-medium">Reset weekly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {c.badgeReward || 'Medal'}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +{c.rewardXp} XP
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {c.participantsCount.toLocaleString()} scholars joined
                </span>
                <button
                  onClick={() => setActiveTab('cbt')}
                  className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl transition-colors"
                >
                  Enter Challenge
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. National Leaderboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              National Leaderboard
            </h3>
            <p className="text-xs text-slate-500">Ranked by total validated XP, accuracy, and study streaks</p>
          </div>

          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            {(['JAMB', 'WAEC', 'NECO'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedExamTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedExamTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.userId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isTop3
                    ? 'bg-amber-50/60 border-amber-200/80 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      entry.rank === 1
                        ? 'bg-yellow-400 text-slate-950 shadow-sm'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : entry.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    #{entry.rank}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{entry.fullName}</h4>
                    <span className="text-[11px] text-slate-500">
                      Level {entry.level} • {entry.streak} day streak 🔥
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
                    {entry.totalXp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Merit Badges & Achievements */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Scholar Achievements & Merit Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all ${
                ach.isUnlocked
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{ach.icon}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    +{ach.xpBonus} XP
                  </span>
                  {ach.isUnlocked ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {ach.progressPercent ?? 0}%
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{ach.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">{ach.description}</p>
              {!ach.isUnlocked && typeof ach.progressPercent === 'number' && (
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.max(2, ach.progressPercent)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
