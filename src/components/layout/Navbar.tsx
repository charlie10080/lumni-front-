import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Bell, Sun, Moon, Smartphone } from 'lucide-react';
import { UserDropdown } from '../auth/UserDropdown';
import { InstallAppModal } from './InstallAppModal';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = () => {
  const { role } = useAuth();
  const { schoolInfo, notices } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-brand">
                    LUMNI
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30 uppercase">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate max-w-xs">
                  {schoolInfo.nombre} • Ciclo {schoolInfo.ciclo}
                </p>
              </div>
            </div>
          </div>

          {/* Center: System Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {role === 'teacher' ? '👨‍🏫 Espacio del Docente' : '👨‍👩‍👧 Portal de Consulta Familiar'}
            </span>
          </div>

          {/* Right Actions: App Install, Theme Toggle, Notifications & User Profile */}
          <div className="flex items-center gap-2">
            {/* Install Mobile App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              title="Descargar / Instalar App Móvil"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 shadow-xs transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>

            {/* Theme Toggle Button (Modo Claro / Modo Oscuro) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Notifications Button */}
            <button
              title="Avisos escolares"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
};

