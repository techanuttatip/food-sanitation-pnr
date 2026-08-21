import React, { useState } from 'react';
import { GovHeader } from './GovHeader';
import { Sidebar } from './Sidebar';
import { LayoutDashboard, Store, FileSpreadsheet, MessageSquare, Award, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AppLayoutProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isFixedViewport = activeTab === 'dashboard' || activeTab === 'live-chat';

  const bottomNavItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'businesses', label: 'ทะเบียน', icon: Store },
    { id: 'applications', label: 'คำขอ', icon: FileSpreadsheet },
    { id: 'live-chat', label: 'แชท LINE', icon: MessageSquare },
    { id: 'licenses', label: 'ใบอนุญาต', icon: Award },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      <GovHeader
        onNavigateToChat={() => onSelectTab('live-chat')}
        onToggleMobileMenu={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        onNavigateToCitizenPortal={() => onSelectTab('citizen-portal')}
      />

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-[calc(100vh-61px)]">
          <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
        </div>

        {/* Mobile Slide-Over Drawer with Backdrop Blur */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-10 w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  onSelectTab(tab);
                  setIsMobileDrawerOpen(false);
                }}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area with Bottom Padding for Mobile Nav */}
        {isFixedViewport ? (
          <main className="flex-1 overflow-hidden relative flex flex-col h-[calc(100vh-61px)] pb-16 md:pb-0">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-61px)] pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
              {children}
            </div>
          </main>
        )}
      </div>

      {/* Mobile Bottom Quick-Action Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around safe-area-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-center',
                isActive
                  ? 'text-gov-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                  isActive ? 'bg-gov-50 text-gov-700 ring-2 ring-gov-200 shadow-2xs' : 'text-slate-500'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
        {/* Mobile All Menus Button */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-slate-500 hover:text-slate-800 font-medium"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">เมนูทั้งหมด</span>
        </button>
      </nav>
    </div>
  );
};
