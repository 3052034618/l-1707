import { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  Receipt,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Clock,
  Filter,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Select from '@/components/Select';
import type { SelectOption } from '@/components/Select';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/business/StatusBadge';
import DiscrepancyCard from '@/components/business/DiscrepancyCard';
import { DocumentService } from '@/services';
import { useOrderStore, useDocumentStore } from '@/store';
import type {
  Order,
  Document,
  VerificationResult,
  Discrepancy,
  Discrepancy as DiscrepancyType,
} from '@/types';

const discrepancyFilterOptions: SelectOption[] = [
  { value: 'all', label: '全部不符点' },
  { value: 'unresolved', label: '未解决' },
  { value: 'resolved', label: '已解决' },
];

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface FieldComparison {
  label: string;
  blValue?: string;
  plValue?: string;
  invValue?: string;
  hasMismatch: boolean;
}

export default function DocumentVerify() {
  const { orders, getOrders } = useOrderStore();
  const { documents, getDocuments } = useDocumentStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDocuments, setOrderDocuments] = useState<Document[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>('all');
  const [orderOptions, setOrderOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const order = orders.find((o) => o.id === selectedOrderId);
    setSelectedOrder(order || null);
    if (selectedOrderId) {
      loadDocuments(selectedOrderId);
    } else {
      setOrderDocuments([]);
      setVerificationResult(null);
    }
  }, [selectedOrderId, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      await getOrders();
      const options = orders
        .filter((o) => o.documents && o.documents.length > 0)
        .map((o) => ({
          value: o.id,
          label: `${o.orderNo} - ${o.goodsDescription.slice(0, 20)}`,
        }));
      setOrderOptions(options);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (orderId: string) => {
    setLoading(true);
    try {
      const docs = await getDocuments(orderId);
      setOrderDocuments(docs);

      const verifiedDoc = docs.find((d) => d.verificationResult);
      if (verifiedDoc?.verificationResult) {
        setVerificationResult(verifiedDoc.verificationResult);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedOrderId) return;

    setVerifying(true);
    try {
      const result = await DocumentService.verifyDocuments(selectedOrderId);
      setVerificationResult(result);
      await loadDocuments(selectedOrderId);
    } catch (error) {
      console.error('单证校验失败:', error);
      alert('校验失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleResolveDiscrepancy = async (field: string, resolution: string) => {
    try {
      const blDoc = orderDocuments.find((d) => d.documentType === 'bill_of_lading');
      if (blDoc) {
        await DocumentService.resolveDiscrepancy(blDoc.id, field, resolution);
        await loadDocuments(selectedOrderId);
      }
    } catch (error) {
      console.error('解决不符点失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleGeneratePackage = async () => {
    if (!selectedOrderId) return;
    try {
      const result = await DocumentService.generateElectronicPackage(selectedOrderId);
      console.log('生成交单包:', result);
      alert(`电子交单包已生成：${result.packageName}`);
    } catch (error) {
      console.error('生成交单包失败:', error);
      alert('生成失败，请重试');
    }
  };

  const getDocumentByType = (type: string): Document | undefined => {
    return orderDocuments.find((d) => d.documentType === type);
  };

  const getFieldComparisons = (): FieldComparison[] => {
    const blDoc = getDocumentByType('bill_of_lading');
    const plDoc = getDocumentByType('packing_list');
    const invDoc = getDocumentByType('commercial_invoice');

    const blData = blDoc?.ocrData || {};
    const plData = plDoc?.ocrData || {};
    const invData = invDoc?.ocrData || {};

    const discrepancies = verificationResult?.discrepancies || [];
    const hasMismatch = (field: string) =>
      discrepancies.some((d) => d.field === field && !d.resolved);

    return [
      {
        label: '重量',
        blValue: blData.grossWeight,
        plValue: plData.totalGrossWeight,
        invValue: invData.totalWeight,
        hasMismatch: hasMismatch('grossWeight'),
      },
      {
        label: '件数',
        blValue: blData.noOfPackages,
        plValue: plData.totalPackages,
        invValue: invData.quantity,
        hasMismatch: hasMismatch('quantity'),
      },
      {
        label: '唛头',
        blValue: blData.marksAndNumbers,
        plValue: plData.marksAndNumbers,
        invValue: invData.marksAndNumbers,
        hasMismatch: hasMismatch('marksAndNumbers'),
      },
      {
        label: '货描',
        blValue: blData.descriptionOfGoods,
        plValue: plData.goodsDescription,
        invValue: invData.goodsDescription,
        hasMismatch: hasMismatch('goodsDescription'),
      },
      {
        label: '体积',
        blValue: blData.measurement,
        plValue: plData.totalMeasurement,
        invValue: invData.totalMeasurement,
        hasMismatch: hasMismatch('measurement'),
      },
      {
        label: '发票号',
        plValue: plData.invoiceNo,
        invValue: invData.invoiceNo,
        hasMismatch: hasMismatch('invoiceNo'),
      },
      {
        label: '受益人/卖方',
        blValue: blData.shipper,
        invValue: invData.seller,
        hasMismatch: hasMismatch('shipper/seller'),
      },
    ];
  };

  const getFilteredDiscrepancies = (): DiscrepancyType[] => {
    const all = verificationResult?.discrepancies || [];
    switch (discrepancyFilter) {
      case 'unresolved':
        return all.filter((d) => !d.resolved);
      case 'resolved':
        return all.filter((d) => d.resolved);
      default:
        return all;
    }
  };

  const filteredDiscrepancies = getFilteredDiscrepancies();
  const fieldComparisons = getFieldComparisons();

  return (
    <PageContainer
      title="单证校验"
      subTitle="对比提单、箱单、发票三单一致性，自动识别不符点"
      breadcrumb={[
        { title: '出口商工作台', href: '/exporter' },
        { title: '单证校验' },
      ]}
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="max-w-xl mb-4">
                <Select
                  label="选择订单"
                  placeholder="请选择需要校验的订单"
                  options={orderOptions}
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                />
              </div>
              {selectedOrder && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">订单号</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.orderNo}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">校验状态</p>
                    {verificationResult ? (
                      verificationResult.isPassed ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle className="h-4 w-4" />
                          校验通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="h-4 w-4" />
                          存在不符点
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400">未校验</span>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 mb-1">校验时间</p>
                    <p className="font-medium text-gray-700">
                      {verificationResult ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(verificationResult.checkedAt)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={handleVerify}
                loading={verifying}
                disabled={!selectedOrderId || verifying}
              >
                {verifying ? '校验中...' : '开始校验'}
              </Button>
              {verificationResult?.isPassed && (
                <Button
                  variant="success"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleGeneratePackage}
                >
                  生成电子交单包
                </Button>
              )}
            </div>
          </div>
        </Card>

        {selectedOrderId && (
          <>
            <Card title="三单对比视图" subtitle="对比提单、箱单、发票关键字段">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">提单 (B/L)</h3>
                      <p className="text-xs text-gray-500">Bill of Lading</p>
                    </div>
                    {getDocumentByType('bill_of_lading') && (
                      <StatusBadge
                        status={getDocumentByType('bill_of_lading')!.status}
                        className="ml-auto"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    {fieldComparisons.map((field, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-3 ${
                          field.hasMismatch && field.blValue
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                        <p
                          className={`font-mono text-sm ${
                            field.hasMismatch && field.blValue ? 'text-red-600' : 'text-gray-700'
                          }`}
                        >
                          {field.blValue || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">箱单 (P/L)</h3>
                      <p className="text-xs text-gray-500">Packing List</p>
                    </div>
                    {getDocumentByType('packing_list') && (
                      <StatusBadge
                        status={getDocumentByType('packing_list')!.status}
                        className="ml-auto"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    {fieldComparisons.map((field, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-3 ${
                          field.hasMismatch && field.plValue
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                        <p
                          className={`font-mono text-sm ${
                            field.hasMismatch && field.plValue ? 'text-red-600' : 'text-gray-700'
                          }`}
                        >
                          {field.plValue || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <Receipt className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">发票 (INV)</h3>
                      <p className="text-xs text-gray-500">Commercial Invoice</p>
                    </div>
                    {getDocumentByType('commercial_invoice') && (
                      <StatusBadge
                        status={getDocumentByType('commercial_invoice')!.status}
                        className="ml-auto"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    {fieldComparisons.map((field, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-3 ${
                          field.hasMismatch && field.invValue
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                        <p
                          className={`font-mono text-sm ${
                            field.hasMismatch && field.invValue ? 'text-red-600' : 'text-gray-700'
                          }`}
                        >
                          {field.invValue || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="不符点列表"
              subtitle={
                verificationResult
                  ? `共 ${verificationResult.discrepancies.length} 个不符点，${
                      verificationResult.discrepancies.filter((d) => d.resolved).length
                    } 个已解决`
                  : '请先执行校验'
              }
              extra={
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select
                    value={discrepancyFilter}
                    onChange={(e) => setDiscrepancyFilter(e.target.value)}
                    options={discrepancyFilterOptions}
                    className="w-40"
                  />
                </div>
              }
            >
              {verificationResult ? (
                filteredDiscrepancies.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDiscrepancies.map((discrepancy, index) => (
                      <DiscrepancyCard
                        key={index}
                        discrepancy={discrepancy}
                        onResolve={handleResolveDiscrepancy}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <p className="text-lg font-medium text-gray-900">没有不符点</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {discrepancyFilter === 'all'
                        ? '所有单证字段一致，校验通过'
                        : discrepancyFilter === 'unresolved'
                        ? '没有未解决的不符点'
                        : '没有已解决的不符点'}
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-600">请先点击"开始校验"按钮</p>
                  <p className="text-sm text-gray-400 mt-1">
                    系统将自动对比三单字段并识别不符点
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}
