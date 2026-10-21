import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/60 flex items-start gap-3 cursor-pointer"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'streak' && <Flame className="w-5 h-5 text-amber-400 animate-pulse" />}
              {toast.type === 'xp' && <Sparkles className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'achievement' && <Sparkles className="w-5 h-5 text-yellow-400" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
