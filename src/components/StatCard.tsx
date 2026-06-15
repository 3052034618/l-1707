import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatCardTrend = 'up' | 'down' | 'none';
export type StatCardColor = 'primary' | 'success' | 'warning' | 'danger';

export interface StatCardProps {
  title: string;
  value: number;
  trend?: StatCardTrend;
  trendValue?: number;
  icon?: React.ReactNode;
  color?: StatCardColor;
  className?: string;
}

const colorBgMap: Record<StatCardColor, string> = {
  primary: 'bg-primary-50 dark:bg-primary-900/20',
  success: 'bg-success-50 dark:bg-success-900/20',
  warning: 'bg-warning-50 dark:bg-warning-900/20',
  danger: 'bg-danger-50 dark:bg-danger-900/20',
};

const colorIconMap: Record<StatCardColor, string> = {
  primary: 'text-primary-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  danger: 'text-danger-500',
};

const trendIconMap: Record<StatCardTrend, React.ReactNode> = {
  up: <TrendingUp size={14} />,
  down: <TrendingDown size={14} />,
  none: <Minus size={14} />,
};

const trendColorMap: Record<StatCardTrend, string> = {
  up: 'text-success-500',
  down: 'text-danger-500',
  none: 'text-neutral-500',
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>((
  { title, value, trend = 'none', trendValue, icon, color = 'primary', className },
  ref
) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 bg-white dark:bg-neutral-800 shadow-card hover:shadow-card-hover transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatNumber(displayValue)}
          </p>
          {trendValue !== undefined && (
            <div className={cn('mt-2 inline-flex items-center gap-1 text-sm', trendColorMap[trend])}>
              {trendIconMap[trend]}
              <span className="font-medium">
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 ml-1">
                较上期
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              colorBgMap[color],
              colorIconMap[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
