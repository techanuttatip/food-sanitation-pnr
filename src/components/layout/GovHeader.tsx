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
  const { user, currentRole, switchRole, updateProfile, signOut } = useAuth();
  const { success, info, error } = useToast();
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    position: '',
    phone_number: '',
    email: '',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.first_name.trim()) {
      error('กรุณากรอกชื่อจริง');
      return;
    }
    try {
      await updateProfile(profileData);
      setIsProfileModalOpen(false);
      success('บันทึกข้อมูลส่วนตัวสำเร็จ ✨', `ยินดีต้อนรับ ${profileData.first_name} ${profileData.last_name}`);
    } catch (err: any) {
      error('บันทึกไม่สำเร็จ', err.message);
    }
  };

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

          {/* User Profile display with Edit Profile Modal */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => {
                setProfileData({
                  first_name: user?.first_name || '',
                  last_name: user?.last_name || '',
                  position: user?.position || '',
                  phone_number: user?.phone_number || '',
                  email: user?.email || '',
                });
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-xl transition-colors text-left group"
              title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว"
            >
              {(() => {
                let firstName = user?.first_name || 'เจ้าหน้าที่';
                let lastName = user?.last_name || '';

                if (firstName.toLowerCase().includes('rungthiwa') || user?.email?.toLowerCase().includes('rungthiwa')) {
                  firstName = 'รุ่งทิวา';
                  if (lastName.includes('อบต.') || lastName.includes('@') || lastName.includes(',')) {
                    lastName = '';
                  }
                } else {
                  if (firstName.includes('@') || firstName.includes(',')) {
                    firstName = firstName.replace(/^[^a-zA-Z0-9ก-๙]+/, '').split('@')[0];
                  }
                  if (lastName.includes('อบต.') || lastName.includes('@') || lastName.includes(',')) {
                    lastName = '';
                  }
                }

                const fullName = `${firstName} ${lastName}`.trim();
                const initial = firstName.slice(0, 1) || 'จ';
                const position = user?.position || (currentRole === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข');

                return (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gov-700 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                      {initial}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-gov-700 transition-colors">
                        {fullName}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        {position}
                      </span>
                    </div>
                  </>
                );
              })()}
            </button>
            <button
              onClick={signOut}
              title="ออกจากระบบ"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gov-100 text-gov-800 flex items-center justify-center font-bold">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลส่วนตัวเจ้าหน้าที่</h3>
                  <p className="text-xs text-slate-500">ปรับปรุงข้อมูลบัญชีผู้ใช้ของคุณ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ชื่อจริง:</label>
                  <input
                    type="text"
                    required
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">นามสกุล:</label>
                  <input
                    type="text"
                    required
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ตำแหน่งหน้าที่:</label>
                <input
                  type="text"
                  required
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  placeholder="เช่น นักวิชาการสาธารณสุขชำนาญการ, ปลัด อบต."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">เบอร์โทรศัพท์:</label>
                  <input
                    type="text"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    placeholder="053-123001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">อีเมลราชการ:</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gov-700 hover:bg-gov-800 rounded-xl shadow-sm"
                >
                  💾 บันทึกข้อมูลส่วนตัว
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
