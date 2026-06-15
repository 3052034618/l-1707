import React, { forwardRef } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyProps {
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const Empty = forwardRef(function Empty(
  { description = '暂无数据', icon, action, className }: EmptyProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 text-neutral-300 dark:text-neutral-600">
        {icon ?? <Inbox className="h-20 w-20" strokeWidth={1} />}
      </div>
      <p className="text-base font-medium text-neutral-500 dark:text-neutral-400 mb-4">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
});

export default Empty;
