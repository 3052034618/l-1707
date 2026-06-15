import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProgressStatus = 'normal' | 'success' | 'exception';

export interface ProgressProps {
  percent: number;
  status?: ProgressStatus;
  strokeWidth?: number;
  showInfo?: boolean;
  className?: string;
}

const statusColorMap: Record<ProgressStatus, string> = {
  normal: 'bg-primary-500',
  success: 'bg-success-500',
  exception: 'bg-danger-500',
};

const statusTextColorMap: Record<ProgressStatus, string> = {
  normal: 'text-primary-500',
  success: 'text-success-500',
  exception: 'text-danger-500',
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>((
  { percent, status = 'normal', strokeWidth = 8, showInfo = true, className },
  ref
) => {
  const [displayPercent, setDisplayPercent] = useState(0);
  const animationRef = useRef<number | null>(null);
  const prevPercentRef = useRef(0);

  const safePercent = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    const startValue = prevPercentRef.current;
    const endValue = safePercent;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayPercent(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevPercentRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safePercent]);

  const renderInfo = () => {
    if (!showInfo) return null;

    if (status === 'success') {
      return (
        <span className={cn('ml-2 inline-flex items-center text-sm', statusTextColorMap[status])}>
          <CheckCircle size={16} className="mr-1" />
          完成
        </span>
      );
    }

    if (status === 'exception') {
      return (
        <span className={cn('ml-2 inline-flex items-center text-sm', statusTextColorMap[status])}>
          <XCircle size={16} className="mr-1" />
          失败
        </span>
      );
    }

    return (
      <span className={cn('ml-2 text-sm font-medium tabular-nums', statusTextColorMap[status])}>
        {displayPercent}%
      </span>
    );
  };

  return (
    <div
      ref={ref}
      className={cn('flex items-center w-full', className)}
      role="progressbar"
      aria-valuenow={safePercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="relative flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-full"
        style={{ height: strokeWidth }}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-colors duration-300',
            statusColorMap[status]
          )}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      {renderInfo()}
    </div>
  );
});

Progress.displayName = 'Progress';

export default Progress;
