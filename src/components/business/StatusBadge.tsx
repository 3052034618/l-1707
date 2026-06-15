import { cn } from '@/lib/utils';
import type {
  OrderStatus,
  CustomsStatus,
  ShipmentStatus,
  SettlementStatus,
  DocumentStatus,
  LCStatus,
} from '@/types';

type StatusType = OrderStatus | CustomsStatus | ShipmentStatus | SettlementStatus | DocumentStatus | LCStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

interface StatusConfig {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
}

const statusConfig: Record<StatusType, StatusConfig> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_confirmation: { label: '待确认', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'success' },
  documents_uploaded: { label: '单证已上传', variant: 'info' },
  customs_declared: { label: '已报关', variant: 'primary' },
  in_transit: { label: '运输中', variant: 'info' },
  delivered: { label: '已送达', variant: 'success' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  pending_exporter_confirm: { label: '待出口商确认', variant: 'warning' },
  exporter_confirmed: { label: '出口商已确认', variant: 'success' },
  exporter_rejected: { label: '出口商已拒绝', variant: 'danger' },
  issued: { label: '已开立', variant: 'success' },
  amended: { label: '已修改', variant: 'info' },
  expired: { label: '已过期', variant: 'danger' },
  uploaded: { label: '已上传', variant: 'info' },
  verifying: { label: '校验中', variant: 'warning' },
  verified: { label: '已校验', variant: 'success' },
  discrepancy_found: { label: '发现不符点', variant: 'danger' },
  re_uploaded: { label: '已重新上传', variant: 'info' },
  pending: { label: '待处理', variant: 'warning' },
  license_missing: { label: '缺少许可证', variant: 'danger' },
  ready_to_submit: { label: '准备提交', variant: 'info' },
  submitted: { label: '已提交', variant: 'primary' },
  accepted: { label: '已受理', variant: 'info' },
  rejected: { label: '已驳回', variant: 'danger' },
  cleared: { label: '已放行', variant: 'success' },
  container_loaded: { label: '已装柜', variant: 'info' },
  departed: { label: '已启运', variant: 'primary' },
  arrived: { label: '已到达', variant: 'info' },
  delayed: { label: '已延误', variant: 'danger' },
  calculated: { label: '已计算', variant: 'info' },
  invoiced: { label: '已开票', variant: 'primary' },
  payment_pending: { label: '待付款', variant: 'warning' },
  payment_processing: { label: '付款处理中', variant: 'info' },
  paid: { label: '已付款', variant: 'success' },
};

const variantClasses: Record<StatusConfig['variant'], string> = {
  success: 'bg-green-50 text-green-700 border-green-200 ring-green-600/20',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-600/20',
  danger: 'bg-red-50 text-red-700 border-red-200 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20',
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-600/20',
};

const dotClasses: Record<StatusConfig['variant'], string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  primary: 'bg-indigo-500',
  neutral: 'bg-gray-500',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'neutral' as const };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[config.variant],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[config.variant])} />
      {config.label}
    </span>
  );
}

export { statusConfig };
export type { StatusType, StatusBadgeProps };
