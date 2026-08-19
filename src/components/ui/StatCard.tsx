import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'gov' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'gov',
  onClick,
}) => {
  const accentBorders = {
    gov: 'border-l-4 border-l-gov-600',
    emerald: 'border-l-4 border-l-emerald-600',
    amber: 'border-l-4 border-l-amber-500',
    rose: 'border-l-4 border-l-rose-500',
    purple: 'border-l-4 border-l-purple-600',
  };

  const iconBg = {
    gov: 'bg-gov-50 text-gov-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={cn('p-5 flex items-start justify-between cursor-default', accentBorders[accentColor], onClick && 'cursor-pointer')}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className={cn('p-2.5 rounded-lg shrink-0', iconBg[accentColor])}>
        {icon}
      </div>
    </Card>
  );
};
