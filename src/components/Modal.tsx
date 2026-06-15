import React, { forwardRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  onOk?: () => void;
  okText?: string;
  cancelText?: string;
  width?: number | string;
  centered?: boolean;
  maskClosable?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const Modal = forwardRef(function Modal(
  {
    open,
    title,
    onClose,
    onOk,
    okText = '确定',
    cancelText = '取消',
    width = 520,
    centered = false,
    maskClosable = true,
    footer,
    children,
    className,
  }: ModalProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  const handleOk = () => {
    onOk?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={handleMaskClick}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          'absolute inset-0 overflow-y-auto',
          centered ? 'flex items-center justify-center' : 'flex items-start justify-center pt-16'
        )}
      >
        <div
          className={cn(
            'relative w-full mx-4 bg-white rounded-lg shadow-modal dark:bg-neutral-800',
            'animate-fade-in transition-all duration-300',
            className
          )}
          style={{ maxWidth: typeof width === 'number' ? `${width}px` : width }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {title !== undefined && (
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
              <button
                type="button"
                className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="px-6 py-5 text-neutral-700 dark:text-neutral-200">{children}</div>
          {footer !== null && (
            <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              {footer ?? (
                <>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                    onClick={handleOk}
                  >
                    {okText}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Modal;
