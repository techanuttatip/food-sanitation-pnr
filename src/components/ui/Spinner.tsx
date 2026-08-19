import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string; text?: string }> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 gap-2 text-gov-700', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
};
