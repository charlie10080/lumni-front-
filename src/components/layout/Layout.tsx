import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  Users,
  Bell,
  MessageSquare,
} from 'lucide-react';

export interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Asistencias', icon: CalendarCheck2 },
    { id: 'grades', label: 'Notas', icon: GraduationCap },
    { id: 'students', label: 'Alumnos', icon: Users, hideFor: ['parent'] },
    { id: 'messages', label: 'Chat', icon: MessageSquare },
    { id: 'notices', label: 'Avisos', icon: Bell },
  ].filter((item) => !item.hideFor || !item.hideFor.includes(role));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-app-primary flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Sidebar for Desktop */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-slate-800 z-50 px-2 py-2 flex items-center justify-around">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
