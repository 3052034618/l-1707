import { Check, Clock, Package, FileText, FileCheck, Plane, DollarSign, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderTimelineProps {
  orderId: string;
  status: OrderStatus;
  className?: string;
}

interface TimelineNode {
  key: OrderStatus | 'start';
  label: string;
  icon: React.ElementType;
  description: string;
}

const timelineNodes: TimelineNode[] = [
  {
    key: 'start',
    label: '创建订单',
    icon: Package,
    description: '订单已创建，等待确认',
  },
  {
    key: 'confirmed',
    label: '确认信用证',
    icon: Award,
    description: '信用证已确认生效',
  },
  {
    key: 'documents_uploaded',
    label: '单证上传',
    icon: FileText,
    description: '所有单证已上传',
  },
  {
    key: 'customs_declared',
    label: '单证校验',
    icon: FileCheck,
    description: '单证校验通过',
  },
  {
    key: 'customs_declared',
    label: '报关申报',
    icon: FileCheck,
    description: '报关申报已提交',
  },
  {
    key: 'in_transit',
    label: '物流运输',
    icon: Plane,
    description: '货物运输中',
  },
  {
    key: 'delivered',
    label: '财务结算',
    icon: DollarSign,
    description: '财务结算完成',
  },
  {
    key: 'completed',
    label: '订单完成',
    icon: Check,
    description: '订单全部流程完成',
  },
];

const statusOrder: OrderStatus[] = [
  'draft',
  'pending_confirmation',
  'confirmed',
  'documents_uploaded',
  'customs_declared',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
];

function getNodeStatus(nodeIndex: number, currentStatus: OrderStatus): 'completed' | 'current' | 'pending' {
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentStatus === 'cancelled') {
    return nodeIndex < currentIndex ? 'completed' : 'pending';
  }

  if (nodeIndex < currentIndex) {
    return 'completed';
  } else if (nodeIndex === currentIndex) {
    return 'current';
  } else {
    return 'pending';
  }
}

export default function OrderTimeline({ orderId, status, className }: OrderTimelineProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">订单进度</h3>
        <span className="text-xs text-gray-500">订单号: {orderId}</span>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-4 h-[calc(100%-32px)] w-px bg-gray-200" />

        <ol className="space-y-6">
          {timelineNodes.map((node, index) => {
            const nodeStatus = getNodeStatus(index, status);
            const Icon = node.icon;

            return (
              <li key={`${node.key}-${index}`} className="relative pl-10">
                <div
                  className={cn(
                    'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2',
                    nodeStatus === 'completed' && 'border-green-500 bg-green-500',
                    nodeStatus === 'current' && 'border-indigo-500 bg-indigo-500 animate-pulse',
                    nodeStatus === 'pending' && 'border-gray-300 bg-white'
                  )}
                >
                  {nodeStatus === 'completed' ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : nodeStatus === 'current' ? (
                    <Clock className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                <div
                  className={cn(
                    'rounded-lg border p-3 transition-all duration-300',
                    nodeStatus === 'completed' && 'border-green-100 bg-green-50/50',
                    nodeStatus === 'current' && 'border-indigo-200 bg-indigo-50/80 shadow-sm',
                    nodeStatus === 'pending' && 'border-gray-100 bg-gray-50/30'
                  )}
                >
                  <p
                    className={cn(
                      'text-sm font-medium',
                      nodeStatus === 'completed' && 'text-green-700',
                      nodeStatus === 'current' && 'text-indigo-700',
                      nodeStatus === 'pending' && 'text-gray-500'
                    )}
                  >
                    {node.label}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs',
                      nodeStatus === 'completed' && 'text-green-600',
                      nodeStatus === 'current' && 'text-indigo-600',
                      nodeStatus === 'pending' && 'text-gray-400'
                    )}
                  >
                    {node.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export type { OrderTimelineProps };
