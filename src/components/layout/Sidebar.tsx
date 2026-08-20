import React from 'react';
import {
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  FolderOpen,
  ClipboardCheck,
  CreditCard,
  Award,
  QrCode,
  History,
  Database,
  Users,
  MessageSquare,
  Bell,
  Settings,
  Smartphone,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

export const Sidebar: React.FC<{ activeTab: string; onSelectTab: (tabId: string) => void }> = ({
  activeTab,
  onSelectTab,
}) => {
  const { currentRole } = useAuth();

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'ภาพรวมระบบสาธารณสุข',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'businesses',
      label: 'ทะเบียนสถานที่สะสมอาหาร',
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: 'applications',
      label: 'คำขอและ Workflow',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: '1 รอตรวจ',
      roles: ['ADMIN', 'SUPER_ADMIN', 'OFFICER', 'REGISTRATION_OFFICER', 'INSPECTION_OFFICER', 'APPROVER'],
    },
    {
      id: 'documents',
      label: 'ศูนย์จัดการเอกสารสาธารณสุข',
      icon: <FolderOpen className="w-4 h-4" />,
      roles: ['ADMIN', 'OFFICER', 'REGISTRATION_OFFICER'],
    },
    {
      id: 'appointments',
      label: 'ตารางนัดตรวจสุขาภิบาล',
      icon: <ClipboardCheck className="w-4 h-4" />,
      roles: ['ADMIN', 'OFFICER', 'INSPECTION_OFFICER', 'REGISTRATION_OFFICER'],
    },
    {
      id: 'inspections',
      label: 'การตรวจสุขาภิบาล (Checklist)',
      icon: <ClipboardCheck className="w-4 h-4" />,
      roles: ['ADMIN', 'OFFICER', 'INSPECTION_OFFICER'],
    },
    {
      id: 'line-oa',
      label: 'LINE OA & Flex Message',
      icon: <QrCode className="w-4 h-4" />,
      badge: 'LIVE',
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      id: 'rich-menu',
      label: 'Rich Menu & LIFF ประชาชน',
      icon: <Smartphone className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPER_ADMIN', 'OFFICER'],
    },
    {
      id: 'live-chat',
      label: 'แชทสดประชาชน (LINE)',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: '1 ใหม่',
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      id: 'fees',
      label: 'ค่าธรรมเนียม & ชำระเงิน',
      icon: <CreditCard className="w-4 h-4" />,
      roles: ['ADMIN', 'OFFICER', 'REGISTRATION_OFFICER', 'APPROVER'],
    },
    {
      id: 'licenses',
      label: 'พิมพ์ใบอนุญาตให้นายกเซ็น',
      icon: <Award className="w-4 h-4" />,
      roles: ['ADMIN', 'APPROVER', 'OFFICER'],
    },
    {
      id: 'verification',
      label: 'ตรวจสอบใบอนุญาต (QR)',
      icon: <QrCode className="w-4 h-4" />,
    },
    {
      id: 'ai-assistant',
      label: 'AI ผู้ช่วย & กฎหมาย (RAG)',
      icon: <Bot className="w-4 h-4" />,
      badge: '✨ AI',
      roles: ['ADMIN', 'SUPER_ADMIN', 'OFFICER', 'REGISTRATION_OFFICER', 'INSPECTION_OFFICER', 'APPROVER', 'EXECUTIVE'],
    },
    {
      id: 'notifications',
      label: 'ศูนย์แจ้งเตือน Notification',
      icon: <Bell className="w-4 h-4" />,
      roles: ['ADMIN', 'OFFICER'],
    },
    {
      id: 'settings',
      label: 'ตั้งค่าระบบ',
      icon: <Settings className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'users',
      label: 'จัดการเจ้าหน้าที่และสิทธิ์',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'audit-logs',
      label: 'บันทึกประวัติ (Audit Log)',
      icon: <History className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'schema-viewer',
      label: 'โครงสร้างฐานข้อมูล (21 Tables)',
      icon: <Database className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
  ];

  const visibleItems = allNavItems.filter((item) => {
    if (!item.roles) return true;
    if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') return true;
    return item.roles.includes(currentRole);
  });

  const groupedItems = [
    { title: 'ระบบหลัก', items: visibleItems.filter((i) => ['dashboard', 'businesses', 'applications', 'ai-assistant'].includes(i.id)) },
    { title: 'งานสุขาภิบาล & LINE', items: visibleItems.filter((i) => ['documents', 'appointments', 'inspections', 'line-oa', 'rich-menu', 'live-chat', 'notifications'].includes(i.id)) },
    { title: 'ใบอนุญาต & การเงิน', items: visibleItems.filter((i) => ['fees', 'licenses', 'verification'].includes(i.id)) },
    { title: 'ผู้ดูแลระบบ', items: visibleItems.filter((i) => ['settings', 'users', 'audit-logs', 'schema-viewer'].includes(i.id)) },
  ].filter((g) => g.items.length > 0);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'ผู้ดูแลระบบสูงสุด';
      case 'ADMIN': return 'ผู้ดูแลระบบ (Admin)';
      case 'REGISTRATION_OFFICER': return 'เจ้าหน้าที่งานทะเบียน';
      case 'INSPECTION_OFFICER': return 'เจ้าหน้าที่ตรวจสุขาภิบาล';
      case 'APPROVER': return 'ผู้อนุมัติ (ปลัด/นายก)';
      case 'EXECUTIVE': return 'ผู้บริหาร อบต.';
      default: return 'เจ้าหน้าที่สาธารณสุข';
    }
  };

  return (
    <aside className="w-60 bg-slate-900 text-slate-200 shrink-0 min-h-[calc(100vh-61px)] flex flex-col p-3 border-r border-slate-800/80 overflow-y-auto">
      <nav className="flex-1 space-y-4">
        {groupedItems.map((group) => (
          <div key={group.title}>
            <p className="px-2 mb-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group text-left',
                      isActive
                        ? 'bg-gov-600 text-white shadow-md shadow-gov-900/40'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')}>
                        {item.icon}
                      </span>
                      <span className="leading-tight">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                          isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
