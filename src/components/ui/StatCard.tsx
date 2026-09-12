import React from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorVariant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  badge?: {
    text: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = 'indigo',
  badge,
}) => {
  const colorStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  };

  return (
    <Card hoverEffect className="relative overflow-hidden">
      {/* Subtle background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorStyles[colorVariant]} blur-xl pointer-events-none opacity-50`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${colorStyles[colorVariant]} border`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              badge.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {badge.text}
          </span>
        </div>
      )}
    </Card>
  );
};
