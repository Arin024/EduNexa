import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Copy,
  Check,
  Camera,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  X,
  Crown,
  Lock,
  RefreshCw,
  Maximize2,
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
  const [, setContextLoading] = useState<boolean>(true);
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

  // Native file input refs for fallback / gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // In-App Live Camera Modal States
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Stop active camera stream tracks
  const stopStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      try {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {}
    }
  }, []);

  // Close in-app camera modal safely without leaving EduNexa
  const closeCameraModal = useCallback(() => {
    stopStream(cameraStream);
    setCameraStream(null);
    setShowCameraModal(false);
    setCapturedFrame(null);
    setCameraError(null);
    setIsCapturing(false);
    try {
      window.history.replaceState({ tab: 'ai_tutor' }, '', '#ai_tutor');
    } catch {}
  }, [cameraStream, stopStream]);

  // Start in-app camera viewfinder stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError(null);
    setIsCapturing(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('In-app live camera is not supported on this browser. You can use your gallery or system camera picker below.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings, or choose an existing photo from your gallery.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera hardware was detected on this device. You can pick an existing question photo from your gallery.');
      } else {
        setCameraError('Could not start live camera preview. You can pick from your gallery or use your device camera application.');
      }
    }
  }, []);

  // Open in-app camera modal
  const openInAppCamera = useCallback(() => {
    setShowCameraModal(true);
    setCapturedFrame(null);
    setCameraError(null);
    try {
      sessionStorage.setItem('edunexa_active_tab', 'ai_tutor');
      window.history.pushState({ modal: 'in_app_camera', tab: 'ai_tutor' }, '', '#ai_tutor');
    } catch {}
    startCamera(cameraFacing);
  }, [cameraFacing, startCamera]);

  // Flip camera between environment and user
  const toggleCameraFacing = useCallback(() => {
    stopStream(cameraStream);
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  }, [cameraFacing, cameraStream, startCamera, stopStream]);

  // Capture frame from video stream
  const captureFrameFromVideo = useCallback(() => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedFrame(dataUrl);
        stopStream(cameraStream);
        setCameraStream(null);
      }
    } catch (err) {
      console.error('Frame capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [cameraStream, stopStream]);

  // Accept and use captured photo
  const acceptCapturedPhoto = useCallback(() => {
    if (!capturedFrame) return;

    // Convert dataUrl to File
    try {
      const arr = capturedFrame.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], `exam_snap_${Date.now()}.jpg`, { type: mime });

      setSelectedImage({
        file,
        previewUrl: capturedFrame,
        base64: capturedFrame,
        mediaType: mime,
      });

      closeCameraModal();

      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      addToast({
        title: 'Question Snapped! 📸',
        message: 'Photo loaded. Choose your subject and click Send to solve!',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to convert captured photo:', err);
    }
  }, [capturedFrame, closeCameraModal, addToast]);

  // Retake photo inside modal
  const retakePhoto = useCallback(() => {
    setCapturedFrame(null);
    startCamera(cameraFacing);
  }, [cameraFacing, startCamera]);

  // Open phone gallery with back button / popstate protection
  const openGalleryPicker = useCallback(() => {
    try {
      sessionStorage.setItem('edunexa_active_tab', 'ai_tutor');
      localStorage.setItem('edunexa_active_tab', 'ai_tutor');
      window.history.pushState({ picker: 'gallery', tab: 'ai_tutor' }, '', '#ai_tutor');
    } catch {}
    galleryInputRef.current?.click();
  }, []);

  // System camera fallback with back button protection
  const openSystemCameraPicker = useCallback(() => {
    try {
      sessionStorage.setItem('edunexa_active_tab', 'ai_tutor');
      localStorage.setItem('edunexa_active_tab', 'ai_tutor');
      window.history.pushState({ picker: 'system_camera', tab: 'ai_tutor' }, '', '#ai_tutor');
    } catch {}
    cameraInputRef.current?.click();
  }, []);

  // Intercept back button when camera modal is open
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showCameraModal) {
        e.preventDefault();
        closeCameraModal();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopStream(cameraStream);
    };
  }, [showCameraModal, closeCameraModal, cameraStream, stopStream]);

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

  // Handle Photo Selection from file inputs
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
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      addToast({
        title: 'Photo Attached! 🖼️',
        message: 'Photo loaded. Choose your subject and click Send to solve!',
        type: 'success',
      });
    };
    reader.readAsDataURL(file);

    // Reset input
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
          : 'Free users get 1 Snap & Solve daily. Upgrade to VIP Eagle Pass for 30 daily solves!',
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
          message: 'Free quota (1 solve/day) exhausted. Upgrade to VIP Eagle Pass for 30 daily solves!',
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({
      title: 'Copied to Clipboard',
      type: 'success',
    });
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      addToast({
        title: 'Audio Not Supported',
        message: 'Text-to-speech is not supported on your browser.',
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
    <div className="w-full max-w-4xl mx-auto h-[calc(100dvh-180px)] min-h-[460px] sm:min-h-[560px] flex flex-col space-y-2.5 sm:space-y-3 animate-fade-in overflow-hidden relative">
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

      {/* =========================================================================
          IN-APP CAMERA VIEWFINDER MODAL (Fixes: Going back never exits app/home)
          ========================================================================= */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between text-white animate-fade-in overflow-hidden">
          {/* Top Camera Controls */}
          <div className="px-4 py-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
            <button
              type="button"
              onClick={closeCameraModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-white/20 transition-all active:scale-95 shadow-md"
              title="Return to EduNexa AI Tutor"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Tutor</span>
            </button>

            <span className="text-xs font-bold tracking-wide uppercase text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Snap Exam Question</span>
            </span>

            <button
              type="button"
              onClick={toggleCameraFacing}
              disabled={Boolean(capturedFrame)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-white/20 transition-all disabled:opacity-30"
              title="Switch camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Flip</span>
            </button>
          </div>

          {/* Viewfinder / Preview Body */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {cameraError ? (
              <div className="p-6 max-w-sm text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Live Camera Notice</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeCameraModal();
                      openGalleryPicker();
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Choose from Photo Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeCameraModal();
                      openSystemCameraPicker();
                    }}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Use System Camera App</span>
                  </button>
                </div>
              </div>
            ) : capturedFrame ? (
              /* Review Captured Snapshot */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <img
                  src={capturedFrame}
                  alt="Captured Question"
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl border border-white/20 shadow-2xl"
                />
                <div className="absolute top-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  ✓ Photo Ready to Solve
                </div>
              </div>
            ) : (
              /* Live Camera Viewfinder */
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target Guide Framing Overlay */}
                <div className="absolute inset-x-8 inset-y-16 pointer-events-none border-2 border-emerald-400/70 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg"></span>
                    <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg"></span>
                  </div>
                  <div className="text-center">
                    <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-400/40">
                      Align Question Inside Box
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg"></span>
                    <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-lg"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Shutter & Action Bar */}
          <div className="px-6 py-5 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-around z-10">
            {capturedFrame ? (
              /* Review actions */
              <div className="w-full max-w-md flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake / Snap Again</span>
                </button>
                <button
                  type="button"
                  onClick={acceptCapturedPhoto}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/40"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Question</span>
                </button>
              </div>
            ) : (
              /* Live camera shutter bar */
              <div className="w-full max-w-md flex items-center justify-between px-2">
                {/* Pick from Gallery shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    closeCameraModal();
                    openGalleryPicker();
                  }}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white text-[11px] font-semibold p-2"
                  title="Choose from photo library"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>Gallery</span>
                </button>

                {/* Big Capture Shutter Button */}
                <button
                  type="button"
                  disabled={Boolean(cameraError) || isCapturing}
                  onClick={captureFrameFromVideo}
                  className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-all disabled:opacity-40 shadow-xl"
                  title="Take Photo"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center">
                    <Camera className="w-6 h-6 text-slate-950" />
                  </div>
                </button>

                {/* Cancel / Close button */}
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="flex flex-col items-center gap-1 text-slate-300 hover:text-white text-[11px] font-semibold p-2"
                  title="Cancel and return"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    <X className="w-5 h-5 text-rose-400" />
                  </div>
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          1. Header Toolbar with Snap & Solve Quota & Back to Dashboard Button
          ========================================================================= */}
      <div className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Back to Dashboard Button */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
            title="Return to EduNexa Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span className="hidden xs:inline">Dashboard</span>
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-xs sm:text-base leading-tight">
                EduNexa Socratic AI Tutor
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Gemini Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Instant photo question solver & Socratic examination coach
            </p>
          </div>
        </div>

        {/* Quota Badge & Upgrade Prompt */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold ${
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
              In-App Camera or Gallery
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Snap an exam past question or pick an existing photo to receive step-by-step working.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Snap with live in-app camera */}
          <button
            type="button"
            onClick={openInAppCamera}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Question</span>
          </button>

          {/* Pick from gallery */}
          <button
            type="button"
            onClick={openGalleryPicker}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
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
                      <button
                        onClick={() => handleSpeak(m.id, m.content)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                        title={speakingId === m.id ? 'Stop audio' : 'Listen with AI voice'}
                      >
                        {speakingId === m.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
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
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-none space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                <span>EduNexa Vision Coach is deriving solution...</span>
              </div>
              <div className="space-y-1.5 w-48 sm:w-64">
                <div className="h-2 bg-slate-200 rounded animate-pulse w-full"></div>
                <div className="h-2 bg-slate-200 rounded animate-pulse w-3/4"></div>
              </div>
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
              <strong>Free Limit Reached (1/1):</strong> Upgrade to EduNexa VIP Eagle Pass for 30 daily photo solves!
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
          onClick={openGalleryPicker}
          className="text-slate-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Pick photo from gallery"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Quick Camera button in composer */}
        <button
          type="button"
          onClick={openInAppCamera}
          className="text-slate-500 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Snap photo with in-app camera"
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
