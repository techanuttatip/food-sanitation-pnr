import React, { useState, useEffect } from 'react';
import { liffService } from '../../lib/liff';
import { CitizenTracker } from './CitizenTracker';
import { CitizenMobileApp } from '../mobile/CitizenMobileApp';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-b from-purple-800 via-indigo-900 to-purple-950 flex flex-col items-center justify-center">
    <Loader2 className="w-12 h-12 text-pink-300 animate-spin mb-4" />
    <p className="text-purple-100 font-medium text-sm">กำลังเชื่อมต่อระบบบริการสุขาภิบาล อบต.โป่งน้ำร้อน...</p>
  </div>
);

export const LiffRouter: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const pathname = window.location.pathname;
  
  useEffect(() => {
    liffService.init().then(() => setIsReady(true));
  }, []);
  
  if (!isReady) return <LoadingScreen />;
  
  if (pathname.includes('/liff/track')) return <CitizenTracker />;
  
  return (
    <CitizenMobileApp
      onSwitchToDesktop={() => {
        window.location.href = '/?view=desktop';
      }}
    />
  );
};

