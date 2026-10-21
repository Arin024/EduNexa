import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-emerald-400 animate-bounce">
        <Wifi className="w-3.5 h-3.5" />
        <span>Internet connection restored! Syncing...</span>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-amber-400">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Low / No Internet • Working from Offline Cache</span>
    </div>
  );
};
