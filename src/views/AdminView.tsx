import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CreditCard,
  BookOpen,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  Database,
  Cpu,
  Search,
  Filter,
  Layers,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  Award,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AdminStats, Question, Subject, Topic, ExamType, QuestionDifficulty, QuestionSourceType, QuestionStatus, ExamDateConfig } from '../types';
import { QuestionFormModal } from '../components/admin/QuestionFormModal';
import { SubjectFormModal } from '../components/admin/SubjectFormModal';
import { TopicFormModal } from '../components/admin/TopicFormModal';
import { ExamDateAdminModal } from '../components/study-plan/ExamDateAdminModal';

export const AdminView: React.FC = () => {
  const { addToast } = useApp();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'questions' | 'curriculum' | 'exam-dates' | 'metrics'>('questions');

  // Stats & Master Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [examConfigs, setExamConfigs] = useState<ExamDateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Exam Date Admin Modal
  const [examDateModalOpen, setExamDateModalOpen] = useState(false);
  const [editingExamType, setEditingExamType] = useState<ExamType>('JAMB');

  // Question Bank State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterSourceType, setFilterSourceType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Curriculum active selection
  const [selectedCurriculumSubject, setSelectedCurriculumSubject] = useState<string>('');

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'question' | 'subject' | 'topic';
    id: string;
    title: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload questions whenever filters or page changes
  useEffect(() => {
    if (activeTab === 'questions') {
      fetchAdminQuestions();
    }
  }, [
    activeTab,
    currentPage,
    searchQuery,
    filterExam,
    filterSubject,
    filterTopic,
    filterDifficulty,
    filterSourceType,
    filterStatus,
  ]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [statsData, subjectsData, topicsData, examDatesData] = await Promise.all([
        api.getAdminStats(),
        api.getSubjects(undefined, true), // include inactive
        api.getTopics(),
        api.getOfficialExamDates(),
      ]);
      setStats(statsData);
      setSubjects(subjectsData);
      setTopics(topicsData);
      setExamConfigs(examDatesData);
      if (subjectsData.length > 0 && !selectedCurriculumSubject) {
        setSelectedCurriculumSubject(subjectsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminQuestions = async () => {
    setIsQuestionLoading(true);
    try {
      const res = await api.getAdminQuestions({
        search: searchQuery.trim() || undefined,
        examType: filterExam !== 'all' ? filterExam : undefined,
        subjectId: filterSubject !== 'all' ? filterSubject : undefined,
        topicId: filterTopic !== 'all' ? filterTopic : undefined,
        difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
        sourceType: filterSourceType !== 'all' ? filterSourceType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        page: currentPage,
        limit: 12,
      });
      setQuestions(res.questions);
      setTotalQuestions(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch admin questions', err);
    } finally {
      setIsQuestionLoading(false);
    }
  };

  // ==========================================
  // QUESTION HANDLERS
  // ==========================================
  const handleSaveQuestion = async (data: Partial<Question>) => {
    setIsSubmitting(true);
    try {
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, data);
        addToast({
          title: 'Question Updated Successfully',
          message: 'Changes have taken immediate effect across all live candidate pools.',
          type: 'success',
        });
      } else {
        await api.createQuestion(data);
        addToast({
          title: 'New Exam Question Published',
          message: 'Added to national curriculum syllabus bank.',
          type: 'success',
        });
      }
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      fetchAdminQuestions();
      loadInitialData();
    } catch (err: any) {
      addToast({
        title: 'Error Saving Question',
        message: err.message || 'Check question parameters and retry.',
        type: 'info',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleQuestionStatus = async (q: Question) => {
    try {
      const newStatus = q.status === 'active' ? 'inactive' : 'active';
      await api.toggleQuestionStatus(q.id, newStatus);
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, status: newStatus } : item))
      );
      addToast({
        title: `Question marked as ${newStatus.toUpperCase()}`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      if (deleteConfirm.type === 'question') {
        await api.deleteQuestion(deleteConfirm.id);
        addToast({ title: 'Question deleted successfully', type: 'info' });
        fetchAdminQuestions();
      } else if (deleteConfirm.type === 'subject') {
        await api.deleteSubject(deleteConfirm.id);
        addToast({ title: 'Subject deleted successfully', type: 'info' });
        loadInitialData();
      } else if (deleteConfirm.type === 'topic') {
        await api.deleteTopic(deleteConfirm.id);
        addToast({ title: 'Topic deleted successfully', type: 'info' });
        loadInitialData();
      }
      setDeleteConfirm(null);
    } catch (err: any) {
      addToast({ title: 'Failed to delete item', message: err.message, type: 'info' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SUBJECT HANDLERS
  // ==========================================
  const handleSaveSubject = async (data: Partial<Subject>) => {
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, data);
        addToast({ title: 'Subject Updated', type: 'success' });
      } else {
        await api.createSubject(data);
        addToast({ title: 'New Subject Added to Syllabus', type: 'success' });
      }
      setSubjectModalOpen(false);
      setEditingSubject(null);
      loadInitialData();
    } catch (err: any) {
      addToast({ title: 'Failed to save subject', message: err.message, type: 'info' });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubjectActive = async (sub: Subject) => {
    try {
      await api.toggleSubjectActive(sub.id);
      addToast({
        title: `Subject ${sub.name} is now ${sub.isActive === false ? 'Active' : 'Inactive'}`,
        type: 'success',
      });
      loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // TOPIC HANDLERS
  // ==========================================
  const handleSaveTopic = async (data: Partial<Topic>) => {
    setIsSubmitting(true);
    try {
      if (editingTopic) {
        await api.updateTopic(editingTopic.id, data);
        addToast({ title: 'Topic Updated', type: 'success' });
      } else {
        await api.createTopic(data);
        addToast({ title: 'New Topic Added to Subject', type: 'success' });
      }
      setTopicModalOpen(false);
      setEditingTopic(null);
      loadInitialData();
    } catch (err: any) {
      addToast({ title: 'Failed to save topic', message: err.message, type: 'info' });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper mappings
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>PrepMaster National Syllabus & Question Engine</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-mono normal-case">
              Admin: christianarinze024@gmail.com
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif">Curriculum Administration</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Authoritative management console for Nwajiaku Arinzechukwu Christian. Manage JAMB UTME, WAEC WASSCE, and NECO SSCE questions, verified past papers, and curriculum taxonomy.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700/80 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Question Bank</span>
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'curriculum'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Subjects & Topics</span>
          </button>
          <button
            onClick={() => setActiveTab('exam-dates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'exam-dates'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Official Exam Dates</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Engine & Metrics</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: QUESTION BANK MANAGEMENT */}
      {/* ========================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Quick Integrity Standard Notice */}
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Strict Question Integrity Rule:</span>
                <span>
                  Verified past questions preserve genuine exam years. Original practice drills are curated by subject specialists. AI-generated drills are never labeled as official past questions.
                </span>
              </div>
            </div>

            <button
              id="admin-add-question-btn"
              onClick={() => {
                setEditingQuestion(null);
                setQuestionModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search question stem, options, explanation, or tags..."
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Reset filters button */}
              {(filterExam !== 'all' ||
                filterSubject !== 'all' ||
                filterTopic !== 'all' ||
                filterDifficulty !== 'all' ||
                filterSourceType !== 'all' ||
                filterStatus !== 'all' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterExam('all');
                    setFilterSubject('all');
                    setFilterTopic('all');
                    setFilterDifficulty('all');
                    setFilterSourceType('all');
                    setFilterStatus('all');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-2xl transition-all shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Exam Type
                </label>
                <select
                  value={filterExam}
                  onChange={(e) => {
                    setFilterExam(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Exams</option>
                  <option value="JAMB">JAMB (UTME)</option>
                  <option value="WAEC">WAEC (WASSCE)</option>
                  <option value="NECO">NECO (SSCE)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => {
                    setFilterSubject(e.target.value);
                    setFilterTopic('all');
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Subjects ({subjects.length})</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Topic
                </label>
                <select
                  value={filterTopic}
                  onChange={(e) => {
                    setFilterTopic(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Topics</option>
                  {topics
                    .filter((t) => filterSubject === 'all' || t.subjectId === filterSubject)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Difficulty
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => {
                    setFilterDifficulty(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Source Type
                </label>
                <select
                  value={filterSourceType}
                  onChange={(e) => {
                    setFilterSourceType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Sources</option>
                  <option value="verified_past_question">Verified Past Paper</option>
                  <option value="original_practice">Original Practice</option>
                  <option value="ai_generated">AI Practice Drill</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900">{questions.length}</strong> of{' '}
              <strong className="text-slate-900">{totalQuestions}</strong> questions in database
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {/* Questions Table / Cards */}
          {isQuestionLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Filtering examination questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No questions match your filter criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms or selecting a different subject or difficulty.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterExam('all');
                  setFilterSubject('all');
                  setFilterTopic('all');
                  setFilterDifficulty('all');
                  setFilterSourceType('all');
                  setFilterStatus('all');
                }}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => {
                const sub = subjectMap.get(q.subjectId);
                const top = topicMap.get(q.topicId);

                // Source type badge colors
                let sourceBadge = (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified {q.examType} {q.year ? `(${q.year})` : ''}</span>
                  </span>
                );

                if (q.sourceType === 'original_practice') {
                  sourceBadge = (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                      <Award className="w-3 h-3 text-blue-600" />
                      <span>Original Practice</span>
                    </span>
                  );
                } else if (q.sourceType === 'ai_generated') {
                  sourceBadge = (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>AI Practice Drill</span>
                    </span>
                  );
                }

                // Difficulty badge
                const diffColor =
                  q.difficulty === 'easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : q.difficulty === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800';

                return (
                  <div
                    key={q.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs space-y-3"
                  >
                    {/* Top Row: Badges & Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          {q.examType}
                        </span>

                        {sourceBadge}

                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${diffColor}`}>
                          {q.difficulty}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                            q.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : q.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleQuestionStatus(q)}
                          title={q.status === 'active' ? 'Deactivate question' : 'Activate question'}
                          className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                            q.status === 'active'
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {q.status === 'active' ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setQuestionModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all"
                          title="Edit question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'question',
                              id: q.id,
                              title: `Question: "${q.questionText.substring(0, 45)}..."`,
                            })
                          }
                          className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Taxonomy Path */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800">{sub?.name || 'Subject'}</span>
                      <span>→</span>
                      <span className="text-slate-700 font-semibold">{top?.name || 'Topic'}</span>
                      {q.subtopic && (
                        <>
                          <span>→</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium text-[10px]">
                            {q.subtopic}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Question Body */}
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {q.questionText}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <div
                          key={opt}
                          className={`p-2 rounded-xl border flex items-start gap-2 ${
                            q.correctAnswer === opt
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50/50 border-slate-200/70 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                              q.correctAnswer === opt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt}
                          </span>
                          <span className="flex-1">{q.options[opt]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation snippet */}
                    <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-600 border border-slate-200/60 space-y-1">
                      <span className="font-bold text-slate-800 text-[11px] block">
                        Marking Note / Official Explanation:
                      </span>
                      <p className="line-clamp-2 text-slate-600">{q.explanation}</p>
                    </div>

                    {/* Tags */}
                    {Array.isArray(q.tags) && q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {q.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-semibold text-slate-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: SUBJECTS & TOPICS (CURRICULUM) */}
      {/* ========================================== */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black font-serif text-slate-900">Syllabus Taxonomy Hierarchy</h3>
              <p className="text-xs text-slate-500">
                Configurable subjects and topic sub-breakdowns across JAMB, WAEC, and NECO boards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Subject</span>
              </button>
              <button
                onClick={() => {
                  setEditingTopic(null);
                  setTopicModalOpen(true);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Topic</span>
              </button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Configured Examination Subjects ({subjects.length})</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">Click a subject to manage its topics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((sub) => {
                const isSelected = selectedCurriculumSubject === sub.id;
                const subTopics = topics.filter((t) => t.subjectId === sub.id);

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedCurriculumSubject(sub.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                          {sub.code}
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">{sub.name}</h5>
                          <span className="text-[10px] text-slate-500 font-semibold">{sub.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleSubjectActive(sub)}
                          title={sub.isActive !== false ? 'Active' : 'Inactive'}
                          className={`p-1 rounded-lg text-xs ${
                            sub.isActive !== false ? 'text-emerald-700 bg-emerald-100' : 'text-slate-400 bg-slate-200'
                          }`}
                        >
                          {sub.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingSubject(sub);
                            setSubjectModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-600 hover:bg-slate-200"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'subject',
                              id: sub.id,
                              title: `Subject "${sub.name}"`,
                            })
                          }
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <div className="flex gap-1">
                        {sub.examTypes.map((ex) => (
                          <span key={ex} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-700">
                            {ex}
                          </span>
                        ))}
                      </div>
                      <span className="font-bold text-emerald-800">
                        {subTopics.length} Topics • {sub.questionCount || 0} Qs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topics for Selected Subject */}
          {selectedCurriculumSubject && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Topics in {subjectMap.get(selectedCurriculumSubject)?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Granular breakdown enabling student weak topic diagnostics and adaptive question selection.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Topic to This Subject</span>
                </button>
              </div>

              {topics.filter((t) => t.subjectId === selectedCurriculumSubject).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No topics registered under this subject yet. Click "Add Topic" to initialize syllabus units.
                </div>
              ) : (
                <div className="space-y-3">
                  {topics
                    .filter((t) => t.subjectId === selectedCurriculumSubject)
                    .map((top) => (
                      <div
                        key={top.id}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{top.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                top.difficulty === 'hard'
                                  ? 'bg-rose-100 text-rose-800'
                                  : top.difficulty === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {top.difficulty || 'medium'}
                            </span>
                            {top.frequencyInExam && (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                {top.frequencyInExam} frequency
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTopic(top);
                                setTopicModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-600 hover:bg-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'topic',
                                  id: top.id,
                                  title: `Topic "${top.name}"`,
                                })
                              }
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {top.description && (
                          <p className="text-[11px] text-slate-600">{top.description}</p>
                        )}

                        {Array.isArray(top.subtopics) && top.subtopics.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-bold text-slate-400">Subtopics:</span>
                            {top.subtopics.map((subt) => (
                              <span
                                key={subt}
                                className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              >
                                {subt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB: OFFICIAL EXAM DATES & TIMETABLES */}
      {/* ========================================== */}
      {activeTab === 'exam-dates' && (
        <div className="space-y-6">
          {/* Integrity Banner */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-3xl flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm block mb-1">
                Official Examination Board Integrity Standard
              </strong>
              <span>
                Do not invent official exam dates. Only configure confirmed or tentative dates published by official examination boards (JAMB, WAEC, NECO). If an exam date has not yet been announced in an official circular, set status to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Pending Announcement</code>. Changes made here instantly recalibrate candidate study plans, countdowns, and phase pacing nationwide.
              </span>
            </div>
          </div>

          {/* Exam Dates Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {examConfigs.map((cfg) => {
              const hasDate = !!cfg.examDate;
              let daysLeft: number | null = null;
              if (hasDate) {
                const diffMs = new Date(cfg.examDate + 'T08:00:00Z').getTime() - Date.now();
                daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              }

              return (
                <div
                  key={cfg.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono">
                        {cfg.examType}
                      </span>
                      {cfg.isOfficial ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Official
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          {cfg.status === 'tentative' ? 'Tentative Proposed' : 'Pending Announcement'}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {cfg.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {cfg.announcementBody}
                      </p>
                    </div>

                    {/* Date Details Box */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Exam Date:</span>
                        <strong className="text-slate-900">
                          {cfg.examDate ? cfg.examDate : 'Pending Announcement'}
                        </strong>
                      </div>
                      {daysLeft !== null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Countdown:</span>
                          <span className="font-extrabold text-emerald-700">{daysLeft} Days Remaining</span>
                        </div>
                      )}
                      {cfg.registrationDeadline && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-semibold">Reg Deadline:</span>
                          <span className="text-slate-700">{cfg.registrationDeadline}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 line-clamp-1">
                        Source: {cfg.announcedBy || 'Official Examination Board'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingExamType(cfg.examType);
                      setExamDateModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Configure {cfg.examType} Date</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: PLATFORM METRICS & ENGINE STATUS */}
      {/* ========================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Candidates</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-black text-slate-900">{stats?.totalStudents || 0}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                <strong className="text-emerald-700">{stats?.activeSubscribers || 0}</strong> on Eagle Pass
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Practice Attempts</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-slate-900">
                {(stats?.totalAttempts || 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Deterministic scoring active
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Platform Revenue</span>
                <CreditCard className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl font-black text-emerald-800 font-mono">
                ₦{(stats?.totalRevenueNgn || 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Eagle Pass subscriptions</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Referral Payouts</span>
                <BarChart3 className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-2xl font-black text-slate-900 font-mono">
                ₦{(stats?.totalReferralPayoutsNgn || 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">20% ambassador commission</p>
            </div>
          </div>

          {/* Engine & Database Architecture */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>NaijaPrep Core Engine Health & Reliability Matrix</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>Deterministic Scoring</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  Scoring is strictly 100% deterministic using stored answer keys. Zero AI hallucination on candidate marks or percentiles.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Primary AI Engine (Groq)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-blue-700 leading-relaxed">
                  Lightning-fast Llama-3 70B/8B provides Socratic explanations, exam tips, and study schedules in milliseconds.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span>Secondary Failover (Gemini)</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-purple-700 leading-relaxed">
                  Automatic failover to Gemini 2.5 Flash guarantees uninterrupted 24/7 coaching access during exam periods.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}
      <QuestionFormModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSaveQuestion}
        initialData={editingQuestion}
        subjects={subjects}
        topics={topics}
        isSubmitting={isSubmitting}
      />

      <SubjectFormModal
        isOpen={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onSubmit={handleSaveSubject}
        initialData={editingSubject}
        isSubmitting={isSubmitting}
      />

      <TopicFormModal
        isOpen={topicModalOpen}
        onClose={() => {
          setTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleSaveTopic}
        initialData={editingTopic}
        subjects={subjects}
        defaultSubjectId={selectedCurriculumSubject}
        isSubmitting={isSubmitting}
      />

      <ExamDateAdminModal
        isOpen={examDateModalOpen}
        onClose={() => setExamDateModalOpen(false)}
        examConfigs={examConfigs}
        defaultExamType={editingExamType}
        onConfigUpdated={(updated) => {
          setExamConfigs((prev) =>
            prev.map((c) => (c.examType === updated.examType ? updated : c))
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-fade-in text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black font-serif text-slate-900">Confirm Permanent Deletion</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete: <br />
                <strong className="text-slate-900">{deleteConfirm.title}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
