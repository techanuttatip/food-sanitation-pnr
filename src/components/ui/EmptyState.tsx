import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300', className)}>
      <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      )}
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
};
