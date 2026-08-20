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
  // Fixed viewport pages that should not scroll the outer page (only internal panels scroll)
  const isFixedViewport = activeTab === 'dashboard' || activeTab === 'live-chat';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      <GovHeader onNavigateToChat={() => onSelectTab('live-chat')} />
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
        {isFixedViewport ? (
          <main className="flex-1 overflow-hidden relative flex flex-col h-[calc(100vh-61px)]">
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
