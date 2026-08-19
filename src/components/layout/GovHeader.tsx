import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { UserRole, ROLE_CONFIGS } from '../../types';
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
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const GovHeader: React.FC<{ onNavigateToChat?: () => void }> = ({ onNavigateToChat }) => {
  const { user, currentRole, switchRole, signOut } = useAuth();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const availableRoles: UserRole[] = ['ADMIN', 'OFFICER'];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-gov-700 to-gov-900 flex items-center justify-center text-white shadow-sm border border-gov-600/50">
            <Building2 className="w-6 h-6 text-amber-300" />
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
        <div className="flex items-center gap-3 sm:gap-4">
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

          {/* Database Connection State */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
            <Database className="w-3.5 h-3.5 text-gov-600" />
            <span>ระบบฐานข้อมูล:</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              เชื่อมต่อสมบูรณ์ (Online)
            </span>
          </div>

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
