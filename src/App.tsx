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
import { Login } from './pages/Login';
import { Spinner } from './components/ui/Spinner';

import { LiffRouter } from './pages/liff/LiffRouter';
import { RichMenuManager } from './pages/RichMenuManager';

export function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (window.location.pathname.startsWith('/liff')) {
    return <LiffRouter />;
  }

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
