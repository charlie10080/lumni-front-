import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './pages/DashboardView';
import { ParentPortalView } from './pages/ParentPortalView';
import { StudentsView } from './pages/StudentsView';
import { AttendanceView } from './pages/AttendanceView';
import { GradesView } from './pages/GradesView';
import { NoticesView } from './pages/NoticesView';
import { MessagesView } from './pages/MessagesView';
import { ReportsView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { ProjectsView } from './pages/ProjectsView';
import { TasksView } from './pages/TasksView';
import { CalendarView } from './pages/CalendarView';

export const AppContent: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
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
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderContent()}
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
