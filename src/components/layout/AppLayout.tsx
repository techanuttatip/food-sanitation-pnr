import React from 'react';
import { GovHeader } from './GovHeader';
import { Sidebar } from './Sidebar';

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
  const isFullscreen = activeTab === 'dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <GovHeader onNavigateToChat={() => onSelectTab('live-chat')} />
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
        {isFullscreen ? (
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-61px)]">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
