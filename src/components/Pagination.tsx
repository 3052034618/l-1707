import React, { forwardRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  className?: string;
}

const pageSizeOptions = [10, 20, 50, 100];

const Pagination = forwardRef(function Pagination(
  {
    current,
    pageSize,
    total,
    onChange,
    showSizeChanger = false,
    showQuickJumper = false,
    className,
  }: PaginationProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [jumpInput, setJumpInput] = useState('');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pages = useMemo(() => {
    const result: (number | 'ellipsis')[] = [];
    const showPages = 7;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          result.push(i);
        }
        result.push('ellipsis');
        result.push(totalPages);
      } else if (current >= totalPages - 3) {
        result.push(1);
        result.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          result.push(i);
        }
      } else {
        result.push(1);
        result.push('ellipsis');
        for (let i = current - 1; i <= current + 1; i++) {
          result.push(i);
        }
        result.push('ellipsis');
        result.push(totalPages);
      }
    }

    return result;
  }, [current, totalPages]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange?.(page, pageSize);
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    const newPage = Math.min(current, Math.ceil(total / newSize));
    onChange?.(newPage, newSize);
  };

  const handleJump = () => {
    const page = Number(jumpInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setJumpInput('');
    }
  };

  const handleJumpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJump();
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center justify-end gap-4 text-sm',
        className
      )}
    >
      <span className="text-neutral-600 dark:text-neutral-400">
        共 {total} 条
      </span>

      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-400">每页</span>
          <select
            value={pageSize}
            onChange={handleSizeChange}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-neutral-600 dark:text-neutral-400">条</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={current <= 1}
          className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-md px-2 transition-colors',
            current <= 1
              ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
          )}
          onClick={() => handlePageChange(current - 1)}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <span className="flex h-8 min-w-8 items-center justify-center px-2 text-neutral-500 dark:text-neutral-400">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                type="button"
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-md px-2 transition-colors',
                  page === current
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
                )}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          type="button"
          disabled={current >= totalPages}
          className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-md px-2 transition-colors',
            current >= totalPages
              ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
          )}
          onClick={() => handlePageChange(current + 1)}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {showQuickJumper && (
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 dark:text-neutral-400">跳至</span>
          <input
            type="text"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={handleJumpKeyDown}
            className="h-8 w-16 rounded-md border border-neutral-300 bg-white px-2 text-center text-neutral-700 focus:border-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
          />
          <span className="text-neutral-600 dark:text-neutral-400">页</span>
        </div>
      )}
    </div>
  );
});

export default Pagination;
