import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/Badge';
import {
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const UserDropdown: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
          {currentUser.nombre.charAt(0)}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
            {currentUser.nombre} {currentUser.apellidos || ''}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <RoleBadge role={role} />
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-in">
          {/* User Details Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {currentUser.nombre} {currentUser.apellidos || ''}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[140px]">
                {currentUser.colegio}
              </span>
              <RoleBadge role={role} />
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
