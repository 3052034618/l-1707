import { useState } from 'react';
import { AlertTriangle, XCircle, Check, X, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Discrepancy } from '@/types';

interface DiscrepancyCardProps {
  discrepancy: Discrepancy;
  onResolve: (field: string, resolution: string) => void;
  className?: string;
}

const severityConfig = {
  warning: {
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    headerBg: 'bg-yellow-100',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    label: '警告',
    labelColor: 'text-yellow-700',
  },
  error: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    headerBg: 'bg-red-100',
    icon: XCircle,
    iconColor: 'text-red-600',
    label: '错误',
    labelColor: 'text-red-700',
  },
};

export default function DiscrepancyCard({ discrepancy, onResolve, className }: DiscrepancyCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const config = severityConfig[discrepancy.severity];
  const SeverityIcon = config.icon;

  const handleResolve = () => {
    if (resolution.trim()) {
      onResolve(discrepancy.field, resolution.trim());
      setIsResolving(false);
      setResolution('');
    }
  };

  const handleCancel = () => {
    setIsResolving(false);
    setResolution('');
  };

  const fieldLabels: Record<string, string> = {
    goodsDescription: '货物描述',
    quantity: '数量',
    unit: '单位',
    totalAmount: '总金额',
    hsCode: 'HS编码',
    originCountry: '原产国',
    destinationCountry: '目的国',
    weight: '重量',
    volume: '体积',
    containerNo: '集装箱号',
    vesselName: '船名',
    voyageNo: '航次号',
    invoiceNo: '发票号',
    billOfLadingNo: '提单号',
    date: '日期',
    beneficiary: '受益人',
    applicant: '申请人',
    currency: '货币',
    tradeTerm: '贸易术语',
  };

  const fieldLabel = fieldLabels[discrepancy.field] || discrepancy.field;

  return (
    <div
      className={cn(
        'rounded-lg border-2 shadow-sm transition-all duration-300 hover:shadow-md',
        config.border,
        config.bg,
        discrepancy.resolved && 'opacity-60',
        className
      )}
    >
      <div className={cn('flex items-center justify-between px-4 py-3', config.headerBg)}>
        <div className="flex items-center gap-2">
          <SeverityIcon className={cn('h-5 w-5', config.iconColor)} />
          <span className="text-sm font-semibold text-gray-900">{fieldLabel}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              discrepancy.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
            )}
          >
            {config.label}
          </span>
          {discrepancy.resolved && (
            <span className="flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
              <Check className="h-3 w-3" />
              已解决
            </span>
          )}
        </div>
        {!discrepancy.resolved && (
          <button
            onClick={() => setIsResolving(!isResolving)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white/50"
          >
            {isResolving ? (
              <>
                <X className="h-3.5 w-3.5" />
                取消
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                解决
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">{discrepancy.document1}</span>
            </div>
            <p className="text-sm font-mono text-gray-900">{discrepancy.value1}</p>
          </div>

          <div className="relative rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">{discrepancy.document2}</span>
            </div>
            <p className="text-sm font-mono text-gray-900">{discrepancy.value2}</p>
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-2 ring-gray-200">
                <span className="text-xs font-bold text-gray-400">≠</span>
              </div>
            </div>
          </div>
        </div>

        {isResolving && !discrepancy.resolved && (
          <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">解决方案</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请输入解决说明..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                确认解决
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { DiscrepancyCardProps };
