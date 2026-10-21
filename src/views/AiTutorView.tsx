import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  Award,
  Target,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Camera,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  X,
  Crown,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StudentLearningContext } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imagePreview?: string;
}

export const AiTutorView: React.FC = () => {
  const { profile, user, addToast, tutorInitialPrompt, setTutorInitialPrompt, setActiveTab } = useApp();
  const [tutorContext, setTutorContext] = useState<StudentLearningContext | null>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Snap & Solve Quota State
  const [snapQuota, setSnapQuota] = useState<{
    dailyLimit: number;
    usedToday: number;
    remaining: number;
    isPremium: boolean;
  }>({
    dailyLimit: user?.isPro ? 30 : 1,
    usedToday: 0,
    remaining: user?.isPro ? 30 : 1,
    isPremium: Boolean(user?.isPro),
  });

  // Selected photo for Snap & Solve
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mediaType: string;
  } | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `👋 **Hello, ${profile?.targetExam || 'JAMB'} Scholar!**\n\nI am your **EduNexa Personal Tutor & Exam Specialist**, powered by Gemini AI.\n\n✨ **New: Visual Snap & Solve!**\nPick any past question paper or textbook photo from your **phone gallery** or **snap with camera** below to receive instant step-by-step working and CBT elimination shortcuts!\n\nOr ask me to explain any difficult concept. What are we tackling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load learning context and snap quota
  useEffect(() => {
    loadLearningContext();
    loadSnapQuota();
  }, [user?.isPro]);

  const loadLearningContext = async () => {
    setContextLoading(true);
    try {
      const ctx = await api.getAiTutorContext();
      setTutorContext(ctx);
    } catch (err) {
      console.warn('Could not load tutor context:', err);
    } finally {
      setContextLoading(false);
    }
  };

  const loadSnapQuota = async () => {
    try {
      const quota = await api.getSnapQuota();
      setSnapQuota(quota);
    } catch (err) {
      console.warn('Could not fetch snap quota:', err);
    }
  };

  // If redirected from another view with an initial prompt
  useEffect(() => {
    if (tutorInitialPrompt) {
      const promptToRun = tutorInitialPrompt;
      setTutorInitialPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [tutorInitialPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Photo Selection from Camera or Gallery
  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Invalid File',
        message: 'Please choose an image file (JPG, PNG, or WEBP).',
        type: 'info',
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        file,
        previewUrl,
        base64,
        mediaType: file.type || 'image/jpeg',
      });
      // Scroll to bottom
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Submit Photo for Snap & Solve
  const handleSolvePhoto = async () => {
    if (!selectedImage || isLoading) return;

    if (snapQuota.remaining <= 0) {
      addToast({
        title: 'Daily Limit Reached',
        message: snapQuota.isPremium
          ? 'You have used all 30 VIP photo solves today. Resets at midnight.'
          : 'Free users get 1 Snap & Solve daily. Upgrade to VIP for 30 daily solves!',
        type: 'info',
      });
      return;
    }

    const currentImage = selectedImage;
    const userPrompt = inputVal.trim() || `Solve this ${selectedSubject} question step-by-step with clear derivation and exam tips.`;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: currentImage.previewUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    setSelectedImage(null);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await api.snapAndSolve({
        imageBase64: currentImage.base64,
        mediaType: currentImage.mediaType,
        prompt: userPrompt,
        subject: selectedSubject,
      });

      const aiMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.solution,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setSnapQuota((prev) => ({
        ...prev,
        remaining: response.remaining,
        usedToday: response.usedToday,
      }));

      addToast({
        title: 'Question Solved! ✨',
        message: `Step-by-step solution ready. (${response.remaining} solves left today)`,
        type: 'achievement',
      });
    } catch (err: any) {
      console.error('Snap & solve error:', err);
      if (err.status === 403 || err.message?.includes('quota')) {
        addToast({
          title: 'Daily Limit Reached',
          message: 'Free quota (1 solve/day) exhausted. Upgrade to Pro for 30 solves!',
          type: 'info',
        });
      } else {
        addToast({
          title: 'Vision AI Notice',
          message: 'Could not process photo clearly. Please ensure text is well-lit and retry.',
          type: 'info',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    // If an image is selected, process it as a Snap & Solve
    if (selectedImage) {
      return handleSolvePhoto();
    }

    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await api.chatWithCoach(
        [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      );

      const aiMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      addToast({
        title: 'Network Issue',
        message: 'Reverting to offline Socratic tutor engine.',
        type: 'info',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Personalized Revision Advice
  const handleGetRevisionAdvice = async () => {
    setIsLoading(true);
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: 'Give me my personalized revision advice for this week based on my weak topics.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.getAiStudyAdvice();
      const aiMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: res.advice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      handleSendMessage('Give me my personalized revision advice for this week based on my weak topics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-to-Speech audio read-aloud
  const handleSpeakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      addToast({
        title: 'Audio Not Supported',
        message: 'Your browser does not support audio playback.',
        type: 'info',
      });
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Dynamic chips based on real learning context
  const dynamicChips: string[] = [];
  if (tutorContext?.weakTopics && tutorContext.weakTopics.length > 0) {
    const rawWeak = tutorContext.weakTopics[0].split('(')[0].trim();
    dynamicChips.push(`Teach me ${rawWeak} from scratch`);
  }
  if (tutorContext?.recentMistakes && tutorContext.recentMistakes.length > 0) {
    dynamicChips.push(`Why did I fail my recent question on ${tutorContext.recentMistakes[0].topic}?`);
  }
  dynamicChips.push('How do I eliminate options under 40s in JAMB?');

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100dvh-180px)] min-h-[460px] sm:min-h-[560px] flex flex-col space-y-2.5 sm:space-y-3 animate-fade-in overflow-hidden">
      {/* Hidden file inputs for Camera and Gallery picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      {/* 1. Header Toolbar with Snap & Solve Quota */}
      <div className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                EduNexa Socratic AI Tutor
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Gemini Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Instant photo question solver & Socratic examination coach
            </p>
          </div>
        </div>

        {/* Quota Badge & Upgrade Prompt */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              snapQuota.isPremium
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : snapQuota.remaining > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {snapQuota.isPremium ? (
              <Crown className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              Snap & Solve:{' '}
              <strong className="font-mono">
                {snapQuota.remaining}/{snapQuota.dailyLimit}
              </strong>{' '}
              left
            </span>
          </div>

          {!snapQuota.isPremium && (
            <button
              onClick={() => setActiveTab('subscription')}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              <span>Get 30/Day</span>
            </button>
          )}

          <button
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Snap & Solve Action Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-3.5 sm:p-4 rounded-2xl border border-emerald-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Visual Snap & Solve
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              Camera or Gallery
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Snap an exam paper or pick an existing photo from your device to get step-by-step derivations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Snap with camera */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Photo</span>
          </button>

          {/* Pick from gallery */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Pick from Gallery</span>
          </button>
        </div>
      </div>

      {/* 3. Messages List Area */}
      <div className="flex-1 min-h-0 bg-white p-3 sm:p-6 rounded-3xl border border-slate-200 shadow-sm overflow-y-auto space-y-3 sm:space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none font-sans'
                }`}
              >
                {/* Attached question photo */}
                {m.imagePreview && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20 max-w-xs shadow-sm bg-black/10">
                    <img
                      src={m.imagePreview}
                      alt="Uploaded question"
                      className="w-full h-auto max-h-48 object-contain bg-slate-950"
                    />
                    <div className="p-1.5 text-[10px] bg-slate-800 text-slate-300 flex items-center gap-1 font-mono">
                      <Camera className="w-3 h-3 text-emerald-400" />
                      <span>Exam Question Photo</span>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed font-sans">{m.content}</div>

                <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-200/50 text-[10px]">
                  <span className={isUser ? 'text-slate-400' : 'text-slate-400'}>
                    {m.timestamp}
                  </span>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      {/* Audio read-aloud TTS */}
                      <button
                        onClick={() => handleSpeakText(m.id, m.content)}
                        className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold transition-colors"
                        title="Listen to solution"
                      >
                        {speakingId === m.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            <span className="text-rose-600">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* Copy solution */}
                      <button
                        onClick={() => handleCopyText(m.id, m.content)}
                        className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold transition-colors"
                        title="Copy explanation"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>
                {selectedImage
                  ? 'Gemini Multimodal Vision is reading your question, checking syllabus patterns, and deriving the solution...'
                  : 'Personal Tutor is drafting Socratic guidance for you...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Selected Image Preview Tray */}
      {selectedImage && (
        <div className="bg-white p-3 rounded-2xl border-2 border-emerald-500/50 shadow-md flex items-center justify-between gap-3 animate-slide-up shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={selectedImage.previewUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedImage.file.name}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  {(selectedImage.file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ready to solve. Choose subject and tap Send!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Economics">Economics</option>
              <option value="English">English</option>
            </select>

            <button
              onClick={() => setSelectedImage(null)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Free Quota Warning (if 0 left) */}
      {!snapQuota.isPremium && snapQuota.remaining <= 0 && (
        <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Free Limit Reached (1/1):</strong> Upgrade to PrepMaster Pro for 30 daily photo solves!
            </span>
          </div>
          <button
            onClick={() => setActiveTab('subscription')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-xl shrink-0"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* 6. Quick Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        {dynamicChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="text-xs font-semibold whitespace-nowrap bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-full transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <span>💡</span>
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* 7. Input Composer Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 shrink-0">
        {/* Quick Gallery button in composer */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="text-slate-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Pick photo from gallery"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Quick Camera button in composer */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="text-slate-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Snap photo with camera"
        >
          <Camera className="w-5 h-5" />
        </button>

        <input
          id="ai-tutor-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={
            selectedImage
              ? 'Add instructions (optional, e.g. "Explain step-by-step") and click Send...'
              : `Ask Tutor anything or upload an exam photo above...`
          }
          className="flex-1 px-2 py-2 text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
        />

        <button
          id="ai-tutor-send-btn"
          disabled={(!inputVal.trim() && !selectedImage) || isLoading}
          onClick={() => handleSendMessage()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
