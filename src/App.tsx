import React, { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
const DashboardView = lazy(() => import('./pages/DashboardView').then((m) => ({ default: m.DashboardView })));
const ParentPortalView = lazy(() => import('./pages/ParentPortalView').then((m) => ({ default: m.ParentPortalView })));
const StudentsView = lazy(() => import('./pages/StudentsView').then((m) => ({ default: m.StudentsView })));
const AttendanceView = lazy(() => import('./pages/AttendanceView').then((m) => ({ default: m.AttendanceView })));
const GradesView = lazy(() => import('./pages/GradesView').then((m) => ({ default: m.GradesView })));
const NoticesView = lazy(() => import('./pages/NoticesView').then((m) => ({ default: m.NoticesView })));
const MessagesView = lazy(() => import('./pages/MessagesView').then((m) => ({ default: m.MessagesView })));
const ReportsView = lazy(() => import('./pages/ReportsView').then((m) => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./pages/SettingsView').then((m) => ({ default: m.SettingsView })));
const ProjectsView = lazy(() => import('./pages/ProjectsView').then((m) => ({ default: m.ProjectsView })));
const TasksView = lazy(() => import('./pages/TasksView').then((m) => ({ default: m.TasksView })));
const AdminView = lazy(() => import('./pages/AdminView').then((m) => ({ default: m.AdminView })));
const CalendarView = lazy(() => import('./pages/CalendarView').then((m) => ({ default: m.CalendarView })));

export const AppContent: React.FC = () => {
  const { isAuthenticated, role, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (role === 'parent') return <ParentPortalView onNavigate={(tab) => setCurrentTab(tab)} />;
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'students':
        return <StudentsView />;
      case 'attendance':
        return <AttendanceView />;
      case 'grades':
        return <GradesView />;
      case 'projects':
        return <ProjectsView />;
      case 'tasks':
        return <TasksView />;
      case 'notices':
        return <NoticesView />;
      case 'messages':
        return <MessagesView />;
      case 'reports':
        return <ReportsView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return isAdmin ? <AdminView /> : <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando...</div>}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
