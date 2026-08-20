import React, { useState, useEffect } from 'react';
import { liffService } from '../../lib/liff';
import { CitizenTracker } from './CitizenTracker';
import { Building2, Search, Phone, Info, Loader2 } from 'lucide-react';
import liff from '@line/liff';

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-950 flex flex-col items-center justify-center">
    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
    <p className="text-green-100 font-medium">กำลังเชื่อมต่อ LINE...</p>
  </div>
);

const LiffHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl p-2 overflow-hidden">
        <img src="/logo_obt_pnr.png" alt="ตรา อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2">อบต. โป่งน้ำร้อน</h1>
      <p className="text-green-200 mb-10">ระบบบริการประชาชน (งานสุขาภิบาล)</p>
      
      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => window.location.href = '/liff/track'}
          className="w-full bg-white text-green-800 rounded-xl p-4 font-bold flex items-center shadow-lg active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Search className="w-5 h-5 text-green-700" />
          </div>
          <span className="text-lg">ตรวจสถานะคำขอ</span>
        </button>
        
        <button 
          onClick={() => {
            if (liff.isInClient()) {
              liff.openWindow({ url: 'https://line.me/ti/p/@634eafmr', external: false });
            } else {
              window.open('https://line.me/ti/p/@634eafmr', '_blank');
            }
          }}
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl p-4 font-bold flex items-center backdrop-blur-sm active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg">ติดต่อเจ้าหน้าที่</span>
        </button>
        
        <button 
          onClick={() => alert('ข้อมูลการเตรียมเอกสาร...')}
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl p-4 font-bold flex items-center backdrop-blur-sm active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <Info className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg">ข้อมูลการยื่นคำขอ</span>
        </button>
      </div>
    </div>
  );
};

export const LiffRouter: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const pathname = window.location.pathname;
  
  useEffect(() => {
    liffService.init().then(() => setIsReady(true));
  }, []);
  
  if (!isReady) return <LoadingScreen />;
  
  if (pathname.includes('/liff/track')) return <CitizenTracker />;
  
  return <LiffHome />;
};
