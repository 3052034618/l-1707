import React from 'react';
import { cn } from '@/lib/utils';

export type TimelineMode = 'left' | 'right' | 'alternate';

export interface TimelineItem {
  time: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  color?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  mode?: TimelineMode;
  className?: string;
}

const defaultDotColor = 'bg-primary-500';

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>((
  { items, mode = 'left', className },
  ref
) => {
  const getItemPosition = (index: number): 'left' | 'right' => {
    if (mode === 'left') return 'right';
    if (mode === 'right') return 'left';
    return index % 2 === 0 ? 'left' : 'right';
  };

  return (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
    >
      {mode === 'alternate' ? (
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-neutral-200 dark:bg-neutral-700" />
          {items.map((item, index) => {
            const position = getItemPosition(index);
            const isLast = index === items.length - 1;

            return (
              <div
                key={index}
                className={cn(
                  'relative flex items-start',
                  position === 'left' ? 'justify-start pr-[50%]' : 'justify-end pl-[50%]'
                )}
              >
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 flex flex-col items-center',
                    position === 'left' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 z-10',
                      item.color || defaultDotColor
                    )}
                    style={{ backgroundColor: item.color || undefined }}
                  />
                  {!isLast && (
                    <div className="w-px h-full bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </div>

                <div
                  className={cn(
                    'pb-8',
                    position === 'left' ? 'pr-8 text-right' : 'pl-8 text-left'
                  )}
                >
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    {item.time}
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              'absolute top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700',
              mode === 'left' ? 'left-3' : 'right-3'
            )}
          />
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <div
                key={index}
                className={cn(
                  'relative flex items-start pb-8',
                  mode === 'left' ? 'pl-10' : 'pr-10 justify-end'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0 flex flex-col items-center',
                    mode === 'left' ? 'left-0' : 'right-0'
                  )}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 z-10',
                      item.color || defaultDotColor
                    )}
                    style={{ backgroundColor: item.color || undefined }}
                  />
                  {!isLast && (
                    <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </div>

                <div
                  className={cn(
                    'flex-1',
                    mode === 'right' ? 'text-right' : 'text-left'
                  )}
                >
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    {item.time}
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;
