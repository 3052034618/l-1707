import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  title: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>((
  { items, separator = <ChevronRight size={14} className="text-neutral-400" />, className },
  ref
) => {
  const renderItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === items.length - 1;
    const isActive = item.active ?? isLast;
    const content = (
      <span
        className={cn(
          'text-sm',
          isActive
            ? 'text-neutral-900 dark:text-neutral-100 font-medium'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors'
        )}
      >
        {item.title}
      </span>
    );

    if (!isLast && item.href) {
      return (
        <a
          key={index}
          href={item.href}
          className="inline-flex items-center hover:underline underline-offset-4"
        >
          {content}
        </a>
      );
    }

    return (
      <span key={index} className="inline-flex items-center">
        {content}
      </span>
    );
  };

  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <ol className="inline-flex items-center flex-wrap gap-2">
        {items.length > 0 && (
          <>
            {items.map((item, index) => (
              <li key={index} className="inline-flex items-center">
                {renderItem(item, index)}
                {index < items.length - 1 && (
                  <span className="mx-2 flex items-center">
                    {separator}
                  </span>
                )}
              </li>
            ))}
          </>
        )}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
