import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AttendanceStatus, UserRole } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-full border tracking-wide uppercase',
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const AttendanceBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  switch (status) {
    case 'presente':
      return <Badge variant="success">✓ Presente</Badge>;
    case 'retardo':
      return <Badge variant="warning">⏳ Retardo</Badge>;
    case 'falta':
      return <Badge variant="danger">✕ Falta</Badge>;
    case 'justificada':
      return <Badge variant="info">📄 Justificada</Badge>;
    default:
      return <Badge variant="default">Pendiente</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case 'teacher':
      return <Badge variant="info">👨‍🏫 Maestro</Badge>;
    case 'parent':
      return <Badge variant="warning">👨‍👩‍👧 Tutor</Badge>;
  }
};
