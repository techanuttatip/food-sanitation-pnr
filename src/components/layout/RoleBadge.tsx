import React from 'react';
import type { UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../types';
import { cn } from '../../lib/utils';
import { ShieldCheck } from 'lucide-react';

export const RoleBadge: React.FC<{ role: UserRole; className?: string; showIcon?: boolean }> = ({
  role,
  className,
  showIcon = true,
}) => {
  const config = ROLE_CONFIGS[role] || {
    label: role,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border shadow-2xs',
        config.badgeColor,
        className
      )}
    >
      {showIcon && <ShieldCheck className="w-3.5 h-3.5 opacity-80" />}
      {config.label}
    </span>
  );
};
