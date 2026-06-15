import React, { forwardRef, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  message?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const variantConfig = {
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    icon: CheckCircle,
    iconColor: 'text-success-500 dark:text-success-400',
    titleColor: 'text-success-800 dark:text-success-200',
    messageColor: 'text-success-700 dark:text-success-300',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-800',
    icon: AlertTriangle,
    iconColor: 'text-warning-500 dark:text-warning-400',
    titleColor: 'text-warning-800 dark:text-warning-200',
    messageColor: 'text-warning-700 dark:text-warning-300',
  },
  error: {
    bg: 'bg-danger-50 dark:bg-danger-900/20',
    border: 'border-danger-200 dark:border-danger-800',
    icon: XCircle,
    iconColor: 'text-danger-500 dark:text-danger-400',
    titleColor: 'text-danger-800 dark:text-danger-200',
    messageColor: 'text-danger-700 dark:text-danger-300',
  },
  info: {
    bg: 'bg-info-50 dark:bg-info-900/20',
    border: 'border-info-200 dark:border-info-800',
    icon: Info,
    iconColor: 'text-info-500 dark:text-info-400',
    titleColor: 'text-info-800 dark:text-info-200',
    messageColor: 'text-info-700 dark:text-info-300',
  },
};

const Alert = forwardRef(function Alert(
  { variant = 'info', title, message, closable = false, onClose, className }: AlertProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex w-full gap-3 rounded-lg border px-4 py-3',
        'transition-all duration-200',
        isClosing && 'opacity-0 -translate-y-1',
        config.bg,
        config.border,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-semibold text-sm mb-1', config.titleColor)}>{title}</h4>
        )}
        {message && (
          <div className={cn('text-sm', config.messageColor)}>{message}</div>
        )}
      </div>
      {closable && (
        <button
          type="button"
          className={cn(
            'flex-shrink-0 rounded p-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10',
            config.messageColor
          )}
          onClick={handleClose}
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

export default Alert;
