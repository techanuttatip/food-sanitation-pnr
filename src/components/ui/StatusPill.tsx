import React from 'react';
import {
  BusinessStatus,
  ApplicationStatus,
  DocumentStatus,
  RiskLevel,
  BUSINESS_STATUS_MAP,
  APPLICATION_STATUS_MAP,
  DOCUMENT_STATUS_MAP,
  RISK_LEVEL_MAP
} from '../../types';
import { cn } from '../../lib/utils';

export const BusinessStatusPill: React.FC<{ status: BusinessStatus; className?: string }> = ({
  status,
  className,
}) => {
  const meta = BUSINESS_STATUS_MAP[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs',
        meta.color,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dotColor)} />
      {meta.label}
    </span>
  );
};

export const ApplicationStatusPill: React.FC<{ status: ApplicationStatus; className?: string }> = ({
  status,
  className,
}) => {
  const meta = APPLICATION_STATUS_MAP[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
        meta.color,
        className
      )}
    >
      {meta.label}
    </span>
  );
};

export const DocumentStatusPill: React.FC<{ status: DocumentStatus; className?: string }> = ({
  status,
  className,
}) => {
  const meta = DOCUMENT_STATUS_MAP[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
        meta.color,
        className
      )}
    >
      {meta.label}
    </span>
  );
};

export const RiskLevelPill: React.FC<{ level: RiskLevel; className?: string }> = ({
  level,
  className,
}) => {
  const meta = RISK_LEVEL_MAP[level] || {
    label: level,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
};
