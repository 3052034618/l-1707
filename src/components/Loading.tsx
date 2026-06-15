import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const Loading = forwardRef(function Loading(
  { size = 'md', text, fullScreen = false, className }: LoadingProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const content = (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'fixed inset-0 z-50 bg-white/80 dark:bg-neutral-900/80' : 'py-8',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-primary-500 border-t-transparent',
          sizeMap[size]
        )}
      />
      {text && (
        <span className={cn('font-medium text-neutral-600 dark:text-neutral-400', textSizeMap[size])}>
          {text}
        </span>
      )}
    </div>
  );

  return content;
});

export default Loading;
