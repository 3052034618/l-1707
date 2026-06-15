import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn<T extends object> {
  title: React.ReactNode;
  dataIndex: keyof T;
  key: string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  width?: number | string;
}

export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number, pageSize: number) => void;
}

export interface TableProps<T extends object> {
  columns: TableColumn<T>[];
  dataSource: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: TablePagination | false;
  onRowClick?: (record: T, index: number) => void;
  className?: string;
}

const Table = forwardRef(function Table<T extends object>(
  { columns, dataSource, rowKey, loading = false, pagination, onRowClick, className }: TableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    if (rowKey) {
      return String(record[rowKey] as string) || String(index);
    }
    return String((record as Record<string, unknown>).id as string) || String(index);
  };

  return (
    <div ref={ref} className={cn('w-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800', className)}>
      <div className="overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-200"
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  className={cn(
                    'transition-colors',
                    index % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-800/50',
                    'hover:bg-primary-50 dark:hover:bg-neutral-700',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(record, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200"
                      style={{ width: column.width }}
                    >
                      {column.render
                        ? column.render(record[column.dataIndex], record, index)
                        : (record[column.dataIndex] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            共 {pagination.total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.current <= 1}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                pagination.current <= 1
                  ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
              )}
              onClick={() => pagination.onChange?.(pagination.current - 1, pagination.pageSize)}
            >
              上一页
            </button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              type="button"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                pagination.current >= Math.ceil(pagination.total / pagination.pageSize)
                  ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
              )}
              onClick={() => pagination.onChange?.(pagination.current + 1, pagination.pageSize)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}) as <T extends object>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export default Table;
