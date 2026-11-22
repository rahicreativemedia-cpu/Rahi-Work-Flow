import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'p-12 text-center flex flex-col items-center justify-center space-y-2.5 text-slate-500',
        className
      )}
    >
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}
