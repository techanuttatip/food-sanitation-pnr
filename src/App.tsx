import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { BusinessRegistry } from './pages/BusinessRegistry';
import { ApplicationWorkflow } from './pages/ApplicationWorkflow';
import { DocumentCenter } from './pages/DocumentCenter';
import { AppointmentManager } from './pages/AppointmentManager';
import { Inspections } from './pages/Inspections';
import { LineIntegration } from './pages/LineIntegration';
import { CitizenLiveChat } from './pages/CitizenLiveChat';
import { FeesAndPayments } from './pages/FeesAndPayments';
import { LicenseManagement } from './pages/LicenseManagement';
import { PublicVerification } from './pages/PublicVerification';
import { AuditLogs } from './pages/AuditLogs';
import { DatabaseSchemaViewer } from './pages/DatabaseSchemaViewer';
import { UserManagement } from './pages/UserManagement';
import { NotificationCenter } from './pages/NotificationCenter';
import { SystemSettings } from './pages/SystemSettings';
import { AiAssistant } from './pages/AiAssistant';
import { Login } from './pages/Login';
import { Spinner } from './components/ui/Spinner';

import { LiffRouter } from './pages/liff/LiffRouter';
import { RichMenuManager } from './pages/RichMenuManager';
import { MobileFieldApp } from './pages/mobile/MobileFieldApp';
import { CitizenMobileApp } from './pages/mobile/CitizenMobileApp';

export function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const pathname = window.location.pathname.toLowerCase();

  // 1. Dedicated Officer Mobile Field App (Primary Mobile Application)
  if (
    pathname.startsWith('/field') ||
    pathname.startsWith('/mobile') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/inspector') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/liff') ||
    pathname.startsWith('/citizen')
  ) {
    return <MobileFieldApp />;
  }

  // 3. Auto-route to Field App if opened from installed PWA App icon on home screen
  const isPWAStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  const urlParams = new URLSearchParams(window.location.search);
  const isDesktopExplicit = urlParams.get('view') === 'desktop';

  if (isPWAStandalone && !isDesktopExplicit && pathname === '/') {
    return <MobileFieldApp />;
  }

  // 4. Full Desktop Admin Dashboard System
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" text="กำลังโหลดระบบสารสนเทศ อบต...." />
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
      {activeTab === 'businesses' && (
        <BusinessRegistry onNavigateToWorkflow={() => setActiveTab('applications')} />
      )}
      {activeTab === 'applications' && (
        <ApplicationWorkflow onNavigateToInspections={() => setActiveTab('inspections')} />
      )}
      {activeTab === 'ai-assistant' && <AiAssistant />}
      {activeTab === 'documents' && <DocumentCenter />}
      {activeTab === 'appointments' && (
        <AppointmentManager onNavigateToInspections={() => setActiveTab('inspections')} />
      )}
      {activeTab === 'inspections' && <Inspections />}
      {activeTab === 'line-oa' && <LineIntegration />}
      {activeTab === 'live-chat' && <CitizenLiveChat />}
      {activeTab === 'rich-menu' && <RichMenuManager />}

      {activeTab === 'fees' && <FeesAndPayments />}
      {activeTab === 'licenses' && <LicenseManagement />}
      {activeTab === 'verification' && <PublicVerification />}
      {activeTab === 'notifications' && <NotificationCenter />}
      {activeTab === 'settings' && <SystemSettings />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'audit-logs' && <AuditLogs />}
      {activeTab === 'schema-viewer' && <DatabaseSchemaViewer />}
    </AppLayout>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
