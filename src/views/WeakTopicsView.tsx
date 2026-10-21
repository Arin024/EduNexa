import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sliders,
  RotateCcw,
  BookOpen,
  ArrowUpDown,
  Search,
  Filter,
  Flame,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  History,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  WeakTopicAnalysis,
  WeaknessThresholds,
  PerformanceLevel,
  LearningPriority,
  QuestionAttempt,
  Subject,
} from '../types';

export const WeakTopicsView: React.FC = () => {
  const { profile, setActiveTab, setTargetPracticeSubject, addToast, openTutorWithPrompt } = useApp();

  const [weakTopics, setWeakTopics] = useState<WeakTopicAnalysis[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Configurable thresholds
  const [thresholds, setThresholds] = useState<WeaknessThresholds>({
    strongThreshold: 80,
    developingThreshold: 60,
  });
  const [tempThresholds, setTempThresholds] = useState<WeaknessThresholds>({
    strongThreshold: 80,
    developingThreshold: 60,
  });
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);
  const [isUpdatingThresholds, setIsUpdatingThresholds] = useState<boolean>(false);

  // Filters & Sorting
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'wrong' | 'accuracy_asc' | 'accuracy_desc' | 'alphabetical'>('priority');

  // Attempt History Audit Modal / Tab
  const [showAttemptHistory, setShowAttemptHistory] = useState<boolean>(false);
  const [attemptHistory, setAttemptHistory] = useState<QuestionAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topicsData, thresholdsData, subjectsData] = await Promise.all([
        api.getWeakTopics(),
        api.getWeaknessThresholds().catch(() => ({ strongThreshold: 80, developingThreshold: 60 })),
        api.getSubjects().catch(() => []),
      ]);
      setWeakTopics(topicsData);
      setThresholds(thresholdsData);
      setTempThresholds(thresholdsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Failed to load weak topics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    if (tempThresholds.developingThreshold >= tempThresholds.strongThreshold) {
      addToast({
        title: 'Invalid Thresholds',
        message: 'Developing threshold must be strictly lower than Strong threshold.',
        type: 'info',
      });
      return;
    }

    setIsUpdatingThresholds(true);
    try {
      const updated = await api.updateWeaknessThresholds(tempThresholds);
      setThresholds(updated);
      setTempThresholds(updated);

      // Re-fetch topics with updated thresholds
      const refreshedTopics = await api.getWeakTopics({
        strongThreshold: updated.strongThreshold,
        developingThreshold: updated.developingThreshold,
      });
      setWeakTopics(refreshedTopics);

      setShowThresholdConfig(false);
      addToast({
        title: 'Thresholds Updated',
        message: `Strong: ≥${updated.strongThreshold}%, Developing: ${updated.developingThreshold}–${updated.strongThreshold - 1}%, Needs Attention: <${updated.developingThreshold}%`,
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to update thresholds:', err);
      addToast({
        title: 'Update Failed',
        message: 'Could not save thresholds to server.',
        type: 'info',
      });
    } finally {
      setIsUpdatingThresholds(false);
    }
  };

  const handleResetThresholds = async () => {
    const defaults = { strongThreshold: 80, developingThreshold: 60 };
    setTempThresholds(defaults);
    setIsUpdatingThresholds(true);
    try {
      const updated = await api.updateWeaknessThresholds(defaults);
      setThresholds(updated);
      const refreshedTopics = await api.getWeakTopics(defaults);
      setWeakTopics(refreshedTopics);
      addToast({
        title: 'Reset to Defaults',
        message: 'Thresholds restored to 80% (Strong) and 60% (Developing).',
        type: 'info',
      });
    } catch (err) {
      console.error('Failed to reset thresholds:', err);
    } finally {
      setIsUpdatingThresholds(false);
    }
  };

  const loadAttemptHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await api.getAttemptsHistory(50);
      setAttemptHistory(history);
      setShowAttemptHistory(true);
    } catch (err) {
      console.error('Failed to load attempts history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filter & Sort Topics
  const filteredTopics = weakTopics.filter((topic) => {
    if (selectedSubject !== 'all' && topic.subjectId !== selectedSubject) return false;
    if (selectedLevel !== 'all' && topic.performanceLevel !== selectedLevel) return false;
    if (selectedPriority !== 'all' && topic.learningPriority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = topic.topicName.toLowerCase().includes(q);
      const matchSubject = topic.subjectName.toLowerCase().includes(q);
      const matchAction = topic.recommendedAction.toLowerCase().includes(q);
      if (!matchName && !matchSubject && !matchAction) return false;
    }
    return true;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (sortBy === 'priority') {
      // Deterministic learning priority order
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      if (b.numberWrong !== a.numberWrong) {
        return b.numberWrong - a.numberWrong;
      }
      return a.accuracyRate - b.accuracyRate;
    }
    if (sortBy === 'wrong') {
      return b.numberWrong - a.numberWrong;
    }
    if (sortBy === 'accuracy_asc') {
      return a.accuracyRate - b.accuracyRate;
    }
    if (sortBy === 'accuracy_desc') {
      return b.accuracyRate - a.accuracyRate;
    }
    if (sortBy === 'alphabetical') {
      return a.topicName.localeCompare(b.topicName);
    }
    return 0;
  });

  // Summary counts
  const strongCount = weakTopics.filter((t) => t.performanceLevel === 'Strong').length;
  const developingCount = weakTopics.filter((t) => t.performanceLevel === 'Developing').length;
  const needsAttentionCount = weakTopics.filter((t) => t.performanceLevel === 'Needs Attention').length;
  const urgentPriorityCount = weakTopics.filter((t) => t.learningPriority === 'Urgent').length;

  const totalAttempted = weakTopics.reduce((acc, t) => acc + t.numberAttempted, 0);
  const totalCorrect = weakTopics.reduce((acc, t) => acc + t.numberCorrect, 0);
  const totalWrong = weakTopics.reduce((acc, t) => acc + t.numberWrong, 0);
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const getPriorityBadgeStyle = (priority: LearningPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-600 text-white animate-pulse';
      case 'High':
        return 'bg-amber-600 text-white';
      case 'Medium':
        return 'bg-blue-600 text-white';
      case 'Low':
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPerformanceBadgeStyle = (level: PerformanceLevel) => {
    switch (level) {
      case 'Strong':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Developing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Needs Attention':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 1. Header & Hero Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Deterministic Weakness-Analysis Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-attempts-log-btn"
              onClick={loadAttemptHistory}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/15 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-300" />
              <span>Tracked Question Attempts</span>
            </button>

            <button
              id="configure-thresholds-btn"
              onClick={() => setShowThresholdConfig(!showThresholdConfig)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/15 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configurable Thresholds</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            My Weak Topics
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Every question you attempt across CBT mocks and topic practices is deterministically evaluated.
            Topics are ranked by <strong>Learning Priority</strong> so you focus energy where marks are gained fastest.
          </p>
        </div>

        {/* Performance Levels & Overall Health Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Strong */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === 'Strong' ? 'all' : 'Strong')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === 'Strong'
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
              <span>Strong</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                ≥{thresholds.strongThreshold}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{strongCount} Topics</div>
            <p className="text-[10px] text-emerald-200/80 mt-1">Ready for exam speed & retention</p>
          </div>

          {/* Developing */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === 'Developing' ? 'all' : 'Developing')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === 'Developing'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span>Developing</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                {thresholds.developingThreshold}–{thresholds.strongThreshold - 1}%
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400">{developingCount} Topics</div>
            <p className="text-[10px] text-amber-200/80 mt-1">Needs speed & pacing refinement</p>
          </div>

          {/* Needs Attention */}
          <div
            onClick={() => setSelectedLevel(selectedLevel === 'Needs Attention' ? 'all' : 'Needs Attention')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              selectedLevel === 'Needs Attention'
                ? 'bg-red-500/20 border-red-400 ring-2 ring-red-400/50'
                : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-red-300 font-semibold mb-1">
              <span>Needs Attention</span>
              <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded font-mono">
                &lt;{thresholds.developingThreshold}%
              </span>
            </div>
            <div className="text-2xl font-black text-red-400">{needsAttentionCount} Topics</div>
            <p className="text-[10px] text-red-200/80 mt-1">High mark recovery opportunity</p>
          </div>

          {/* Cumulative Attempt Stats */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Overall Accuracy</span>
              <span className="text-[10px] font-mono text-slate-400">{totalAttempted} Attempts</span>
            </div>
            <div className="text-2xl font-black text-white">{overallAccuracy}%</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-1">
              <span className="text-emerald-400 font-bold">{totalCorrect} correct</span>
              <span>•</span>
              <span className="text-red-400 font-bold">{totalWrong} wrong</span>
            </div>
          </div>
        </div>

        {/* 2. Threshold Configuration Drawer / Expandable Panel */}
        {showThresholdConfig && (
          <div className="bg-slate-900/90 border border-emerald-500/40 p-5 rounded-2xl space-y-4 animate-fade-in mt-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Configurable Performance Thresholds</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Default: Strong ≥80%, Developing 60–79%, Needs Attention &lt;60%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strong Threshold Slider & Input */}
              <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">Strong Mastery Threshold</span>
                  <span className="font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    ≥ {tempThresholds.strongThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="95"
                  step="1"
                  value={tempThresholds.strongThreshold}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      strongThreshold: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Scores equal to or above this mark are categorized as &apos;Strong&apos;.
                </p>
              </div>

              {/* Developing Threshold Slider & Input */}
              <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">Developing Lower Bound</span>
                  <span className="font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                    ≥ {tempThresholds.developingThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max={Math.max(45, tempThresholds.strongThreshold - 5)}
                  step="1"
                  value={tempThresholds.developingThreshold}
                  onChange={(e) =>
                    setTempThresholds({
                      ...tempThresholds,
                      developingThreshold: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Scores between {tempThresholds.developingThreshold}% and {tempThresholds.strongThreshold - 1}% are Developing. Below is Needs Attention.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetThresholds}
                disabled={isUpdatingThresholds}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults (80% / 60%)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowThresholdConfig(false)}
                  className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveThresholds}
                  disabled={isUpdatingThresholds}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isUpdatingThresholds ? 'Applying...' : 'Apply Thresholds & Recalculate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Learning Priority Explanation Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-emerald-900">
            Ranked by Learning Priority (Not Merely Alphabetical)
          </p>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            The deterministic engine computes an urgency score factoring in your error rate, mistake volume, syllabus frequency, and performance level.
            Resolving topics with <strong>Urgent</strong> or <strong>High</strong> priority yields the quickest score jump on exam day.
          </p>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search topic or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Performance Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Performance Levels</option>
              <option value="Needs Attention">Needs Attention (&lt;{thresholds.developingThreshold}%)</option>
              <option value="Developing">Developing ({thresholds.developingThreshold}–{thresholds.strongThreshold - 1}%)</option>
              <option value="Strong">Strong (≥{thresholds.strongThreshold}%)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="priority">Sort by: Learning Priority (Urgency)</option>
              <option value="wrong">Sort by: Most Wrong Answers</option>
              <option value="accuracy_asc">Sort by: Lowest Accuracy</option>
              <option value="accuracy_desc">Sort by: Highest Accuracy</option>
              <option value="alphabetical">Sort by: Topic Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Weak Topics Table & Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-3" />
            Analyzing your topic performance deterministically...
          </div>
        ) : sortedTopics.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No topics match the chosen criteria.</p>
            <p className="text-xs text-slate-400">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 px-6 py-3.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Subject & Topic</div>
              <div className="col-span-2 text-center">Accuracy</div>
              <div className="col-span-2 text-center">Attempt Stats</div>
              <div className="col-span-3">Recommended Action</div>
              <div className="col-span-1 text-right">Drill</div>
            </div>

            {/* Topic Rows */}
            {sortedTopics.map((item) => {
              const isNeedsAttention = item.performanceLevel === 'Needs Attention';
              const isDeveloping = item.performanceLevel === 'Developing';
              const isStrong = item.performanceLevel === 'Strong';

              return (
                <div
                  key={item.topicId}
                  className={`p-4 sm:px-6 transition-colors hover:bg-slate-50/80 ${
                    item.learningPriority === 'Urgent'
                      ? 'bg-red-50/20'
                      : item.learningPriority === 'High'
                      ? 'bg-amber-50/20'
                      : ''
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Subject & Topic */}
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.subjectName}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${getPriorityBadgeStyle(
                            item.learningPriority
                          )}`}
                        >
                          Priority: {item.learningPriority}
                        </span>

                        {/* Performance Level Badge */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPerformanceBadgeStyle(
                            item.performanceLevel
                          )}`}
                        >
                          {item.performanceLevel}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {item.topicName}
                      </h4>

                      {item.frequencyInExam && (
                        <p className="text-[10px] text-slate-500">
                          Exam Frequency: <strong className="text-slate-700 capitalize">{item.frequencyInExam} Yield</strong>
                        </p>
                      )}
                    </div>

                    {/* Accuracy Rate */}
                    <div className="md:col-span-2 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`text-xl font-black ${
                            isNeedsAttention
                              ? 'text-red-600'
                              : isDeveloping
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.accuracyRate}%
                        </span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[120px] mx-auto overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isNeedsAttention
                              ? 'bg-red-500'
                              : isDeveloping
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, item.accuracyRate))}%` }}
                        />
                      </div>
                    </div>

                    {/* Attempt Counts: Attempted, Correct, Wrong */}
                    <div className="md:col-span-2 text-center">
                      <div className="inline-grid grid-cols-3 gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-600 uppercase">Attempted</span>
                          <span className="font-bold text-slate-800">{item.numberAttempted}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-emerald-800 uppercase">Correct</span>
                          <span className="font-bold text-emerald-800">{item.numberCorrect}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-red-800 uppercase">Wrong</span>
                          <span className="font-bold text-red-800">{item.numberWrong}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div className="md:col-span-3">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                          Recommended Action:
                        </span>
                        {item.recommendedAction}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-1 text-right flex md:flex-col justify-end gap-1.5 mt-2 md:mt-0">
                      <button
                        onClick={() => {
                          setTargetPracticeSubject(item.subjectId);
                          setActiveTab('practice');
                        }}
                        title={`Practice ${item.topicName}`}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1"
                      >
                        <span>Drill</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          openTutorWithPrompt(
                            `Teach me ${item.topicName} in ${item.subjectName} from scratch. I scored ${item.accuracyRate}% on it recently. Please break it down with simple Nigerian examples and give me a checking question.`
                          )
                        }
                        title={`Ask Gemini AI Tutor to teach ${item.topicName}`}
                        className="text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2 py-1 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Tutor</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Tracked Question Attempts Audit Modal */}
      {showAttemptHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Tracked Question Attempts Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit trail of all recorded question attempts tracked deterministically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAttemptHistory(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Attempt Items */}
            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading attempts history...
                </div>
              ) : attemptHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No question attempts logged yet. Take a practice drill or CBT mock exam to generate attempt logs!
                </div>
              ) : (
                attemptHistory.map((att) => (
                  <div key={att.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-800">{att.studentName || profile?.fullName || 'Student'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-600">{att.examType}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {att.subjectName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">{att.topicName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            att.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {att.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(att.date || att.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Difficulty</span>
                        <span className="font-semibold capitalize text-slate-800">{att.difficulty || 'medium'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Selected Answer</span>
                        <span className="font-bold text-slate-900">{att.selectedAnswer || att.chosenAnswer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Correct Answer</span>
                        <span className="font-bold text-emerald-800">{att.correctAnswer || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Number of Attempts</span>
                        <span className="font-bold text-slate-800">#{att.attemptNumber || 1}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowAttemptHistory(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
