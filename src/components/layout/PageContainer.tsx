import React from 'react';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/Breadcrumb';
import type { BreadcrumbItem } from '@/components/Breadcrumb';

export interface PageContainerProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
  contentClassName?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subTitle,
  extra,
  children,
  breadcrumb,
  className,
  contentClassName,
}) => {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-4">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          {title && (
            <h1 className="text-2xl font-semibold text-neutral-900">
              {title}
            </h1>
          )}
          {subTitle && (
            <p className="mt-1 text-sm text-neutral-500">
              {subTitle}
            </p>
          )}
        </div>
        {extra && (
          <div className="flex items-center gap-3">
            {extra}
          </div>
        )}
      </div>

      <div className={cn('flex-1 min-h-0', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
