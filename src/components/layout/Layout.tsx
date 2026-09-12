import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileAppBanner } from './MobileAppBanner';
import { InstallAppModal } from './InstallAppModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  Users,
  Bell,
  MessageSquare,
  MoreHorizontal,
  CheckSquare,
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  Settings,
  X,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { role } = useAuth();
  const { threads, notices, tasks, projects } = useData();
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);


  const totalUnreadMessages = threads.reduce((acc, t) => acc + (t.mensajesNoLeidos || 0), 0);

  // Primary 5 Bottom Tabs for Mobile
  const teacherBottomTabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'attendance', label: 'Asistencia', icon: CalendarCheck2 },
    { id: 'grades', label: 'Notas', icon: GraduationCap },
    { id: 'students', label: 'Alumnos', icon: Users },
    { id: 'messages', label: 'Chat', icon: MessageSquare, badge: totalUnreadMessages },
  ];

  const parentBottomTabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'grades', label: 'Boleta', icon: GraduationCap },
    { id: 'attendance', label: 'Asistencia', icon: CalendarCheck2 },
    { id: 'messages', label: 'Chat', icon: MessageSquare, badge: totalUnreadMessages },
  ];

  const primaryMobileTabs = role === 'teacher' ? teacherBottomTabs : parentBottomTabs;

  // Secondary items for the "Más" Drawer on Mobile
  const moreDrawerItems = [
    { id: 'tasks', label: 'Tareas Escolares', icon: CheckSquare, badge: tasks.length, roles: ['teacher', 'parent'] },
    { id: 'projects', label: 'Proyectos Grupales', icon: FolderKanban, badge: projects.length, roles: ['teacher', 'parent'] },
    { id: 'notices', label: 'Avisos & Comunicados', icon: Bell, badge: notices.length, roles: ['teacher', 'parent'] },
    { id: 'reports', label: 'Boletas & Reportes Oficiales', icon: FileSpreadsheet, roles: ['teacher'] },
    { id: 'calendar', label: 'Calendario Escolar', icon: Calendar, roles: ['teacher', 'parent'] },
    { id: 'settings', label: 'Configuración del Aula', icon: Settings, roles: ['teacher'] },
  ].filter((item) => item.roles.includes(role));

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMoreDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isMoreActive = moreDrawerItems.some((item) => item.id === currentTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-app-primary flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200 relative">
      {/* Top Mobile & Desktop Navbar */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Estilo App Nativa iOS/Android) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around">
        {primaryMobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && !isMoreDrawerOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* More Options Button for Mobile */}
        <button
          onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer relative ${
            isMoreActive || isMoreDrawerOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {moreDrawerItems.some((i) => i.badge && i.badge > 0) && (
              <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-950" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">Más</span>
          {(isMoreActive || isMoreDrawerOpen) && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>
      </nav>

      {/* Mobile "Más Módulos" Bottom Sheet Drawer */}
      {isMoreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreDrawerOpen(false)}
          />

          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-10 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Más Módulos y Herramientas</h3>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreDrawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{item.label}</p>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {item.badge} {item.badge === 1 ? 'activo' : 'activos'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Install Mobile App Direct Option in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  setIsInstallModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold">Descargar / Instalar en Celular</p>
                    <p className="text-[10px] text-indigo-100/80">Acceso rápido en tu pantalla de inicio</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
                  Instalar
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Mobile Installation Prompt Banner */}
      <MobileAppBanner />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};

