import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  GraduationCap,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  CreditCard,
  QrCode,
  FolderKanban,
  CheckSquare,
  Calendar,
} from 'lucide-react';

export interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { role, currentUser } = useAuth();
  const { threads, notices, tasks, projects } = useData();

  const totalUnreadMessages = threads.reduce((acc, t) => acc + (t.mensajesNoLeidos || 0), 0);

  const navItems = [
    { id: 'dashboard', label: role === 'teacher' ? 'Dashboard Maestro' : 'Portal Familiar', icon: LayoutDashboard, roles: ['teacher', 'parent'] },
    { id: 'attendance', label: 'Asistencias & QR', icon: CalendarCheck2, roles: ['teacher'] },
    { id: 'grades', label: role === 'teacher' ? 'Calificaciones' : 'Boleta de Calificaciones', icon: GraduationCap, roles: ['teacher', 'parent'] },
    { id: 'students', label: 'Alumnos & Grupos', icon: Users, roles: ['teacher'] },
    { id: 'messages', label: role === 'teacher' ? 'Bandeja de Mensajes' : 'Chat con el Docente', icon: MessageSquare, badge: totalUnreadMessages, roles: ['teacher', 'parent'] },
    { id: 'tasks', label: 'Tareas Escolares', icon: CheckSquare, badge: tasks.length, roles: ['teacher', 'parent'] },
    { id: 'projects', label: 'Proyectos', icon: FolderKanban, badge: projects.length, roles: ['teacher', 'parent'] },
    { id: 'notices', label: 'Avisos Escolares', icon: Bell, badge: notices.length, roles: ['teacher', 'parent'] },
    { id: 'reports', label: 'Boletas & Reportes', icon: FileSpreadsheet, roles: ['teacher'] },
    { id: 'calendar', label: 'Calendario Escolar', icon: Calendar, roles: ['teacher', 'parent'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['teacher'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between bg-white/95 dark:bg-slate-900/90 border-r border-app p-4 min-h-[calc(100vh-65px)] transition-colors">
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-app-muted mb-2">
            Módulos del Sistema
          </p>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                    : 'text-app-secondary hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-app-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick QR Scanner Action for Teacher */}
        {role === 'teacher' && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 mb-1.5">
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Pase con QR</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5 leading-relaxed">
              Registra la entrada matutina con la cámara del dispositivo.
            </p>
            <button
              onClick={() => setCurrentTab('attendance')}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              Abrir Escáner
            </button>
          </div>
        )}
      </div>

      {/* Subscription or School Status Footer */}
      {role === 'teacher' && currentUser?.suscripcion && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Plan {currentUser.suscripcion.plan}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Próx: {currentUser.suscripcion.proximoPago}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
              Activa
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
