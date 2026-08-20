import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleBadge } from './RoleBadge';
import { UserRole, ROLE_CONFIGS } from '../../types';
import { demoPresetService } from '../../services/demoPresetService';
import {
  Building2,
  ChevronDown,
  UserCircle,
  Database,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Bell,
  MessageSquare,
  Sparkles,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const GovHeader: React.FC<{ onNavigateToChat?: () => void }> = ({ onNavigateToChat }) => {
  const { user, currentRole, switchRole, signOut } = useAuth();
  const { success, info } = useToast();
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  const handleLoadDemoPreset = () => {
    demoPresetService.loadPresentationDemoPreset();
    success('โหลดชุดข้อมูลนำเสนอเรียบร้อย ✨', 'เพิ่มร้านค้า 4 แห่ง พร้อมพิกัดดาวเทียมและคำขอตัวอย่างแล้ว');
    setIsPresetMenuOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleClearAllData = () => {
    if (window.confirm('ต้องการล้างข้อมูลตัวอย่างทั้งหมดกลับเป็นสถานะเริ่มต้น (Clean Slate) หรือไม่?')) {
      demoPresetService.clearAllData();
      info('ล้างข้อมูลเรียบร้อย 🧹', 'ระบบกลับสู่สถานะว่างพร้อมใช้งานจริง');
      setIsPresetMenuOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs border border-slate-200 overflow-hidden p-0.5 shrink-0">
            <img src="/logo_obt_pnr.png" alt="ตรา อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gov-700 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                อบต. โป่งน้ำร้อน อ.ฝาง
              </span>
              <span className="text-xs text-slate-500 hidden md:inline">
                งานสาธารณสุขและสิ่งแวดล้อม
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
              ระบบบริหารจัดการสถานที่สะสมอาหาร (พ.ร.บ. สาธารณสุข ๒๕๓๕)
            </h1>
          </div>
        </div>

        {/* Right User & System Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Field App Dedicated Link */}
          <a
            href="/field"
            target="_blank"
            rel="noreferrer"
            title="เปิดแอปมือถือสำหรับเจ้าหน้าที่ลงพื้นที่ (/field)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">📱 เปิดแอปภาคสนาม (/field)</span>
            <span className="md:hidden">แอปภาคสนาม</span>
          </a>

          {/* Presentation Demo Preset Helper */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">ชุดข้อมูลนำเสนอ</span>
              <ChevronDown className="w-3 h-3 text-amber-600" />
            </button>

            {isPresetMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in">
                <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  เครื่องมือสำหรับพรีเซนต์งาน:
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoPreset}
                  className="w-full p-2 text-left rounded-xl hover:bg-amber-50 flex items-start gap-2 text-xs text-slate-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">✨ โหลดชุดข้อมูลจำลอง</p>
                    <p className="text-[10px] text-slate-500">ร้านค้า 4 แห่ง + แผนที่ GIS + ใบอนุญาต</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="w-full p-2 text-left rounded-xl hover:bg-rose-50 flex items-start gap-2 text-xs text-rose-700 transition-colors mt-1"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">🧹 ล้างข้อมูลทั้งหมด</p>
                    <p className="text-[10px] text-slate-500">คืนค่าว่างพร้อมใช้งานจริง</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell / Chat Shortcut */}
          {onNavigateToChat && (
            <button
              type="button"
              onClick={onNavigateToChat}
              title="ข้อความเข้าจาก LINE ประชาชน"
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                1
              </span>
            </button>
          )}

          {/* User Profile display */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gov-100 border border-gov-300 flex items-center justify-center text-gov-800 font-bold text-xs">
              {user?.first_name?.slice(0, 1) || <UserCircle className="w-5 h-5" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-900 leading-tight">
                {user ? `${user.first_name} ${user.last_name}` : 'เจ้าหน้าที่สาธารณสุข'}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                {currentRole === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข'}
              </span>
            </div>
            <button
              onClick={signOut}
              title="ออกจากระบบ"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
