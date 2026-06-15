import { useState, useEffect } from 'react';
import {
  Package,
  Download,
  Send,
  RefreshCw,
  Eye,
  FileText,
  Clock,
  FileDown,
  History,
  CheckCircle,
  AlertCircle,
  User,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Select from '@/components/Select';
import type { SelectOption } from '@/components/Select';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatusBadge from '@/components/business/StatusBadge';
import { DocumentService } from '@/services';
import { useOrderStore, useDocumentStore } from '@/store';
import type { Order, Document, DocumentType } from '@/types';

interface PackageInfo {
  packageName: string;
  packageUrl: string;
  generatedAt: string;
  documentCount: number;
  downloadCount: number;
  sentToImporter: boolean;
  sentAt?: string;
}

interface PackageHistory {
  id: string;
  packageName: string;
  generatedAt: string;
  documentCount: number;
  action: 'generated' | 'downloaded' | 'sent';
  operator: string;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    bill_of_lading: '提单',
    packing_list: '箱单',
    commercial_invoice: '商业发票',
    certificate_of_origin: '原产地证',
    insurance_policy: '保险单',
    other: '其他',
  };
  return labels[type] || type;
};

const getDocumentTypeIcon = (type: DocumentType) => {
  const icons: Record<DocumentType, string> = {
    bill_of_lading: '📄',
    packing_list: '📦',
    commercial_invoice: '🧾',
    certificate_of_origin: '🏛️',
    insurance_policy: '🛡️',
    other: '📋',
  };
  return icons[type] || '📄';
};

export default function DocumentPackage() {
  const { orders, getOrders } = useOrderStore();
  const { documents, getDocuments } = useDocumentStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDocuments, setOrderDocuments] = useState<Document[]>([]);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderOptions, setOrderOptions] = useState<SelectOption[]>([]);
  const [packageHistory, setPackageHistory] = useState<PackageHistory[]>([]);

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
      setPackageInfo(null);
    }
  }, [selectedOrderId, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      await getOrders();
      const options = orders
        .filter(
          (o) =>
            o.documents &&
            o.documents.length > 0 &&
            o.documents.some((d) => d.status === 'verified')
        )
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
      setOrderDocuments(docs.filter((d) => d.status === 'verified'));

      const mockPackageInfo: PackageInfo | null = docs.some((d) => d.status === 'verified')
        ? {
            packageName: `电子单证包_${orderId.slice(-8)}.zip`,
            packageUrl: `/api/packages/${orderId}/documents.zip`,
            generatedAt: new Date(Date.now() - 86400000).toISOString(),
            documentCount: docs.filter((d) => d.status === 'verified').length,
            downloadCount: Math.floor(Math.random() * 5) + 1,
            sentToImporter: Math.random() > 0.5,
            sentAt:
              Math.random() > 0.5
                ? new Date(Date.now() - 43200000).toISOString()
                : undefined,
          }
        : null;
      setPackageInfo(mockPackageInfo);

      if (mockPackageInfo) {
        generateMockHistory(orderId, mockPackageInfo);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = (orderId: string, packageInfo: PackageInfo) => {
    const history: PackageHistory[] = [
      {
        id: '1',
        packageName: packageInfo.packageName,
        generatedAt: packageInfo.generatedAt,
        documentCount: packageInfo.documentCount,
        action: 'generated',
        operator: '出口商操作员',
      },
      {
        id: '2',
        packageName: packageInfo.packageName,
        generatedAt: new Date(Date.now() - 80000000).toISOString(),
        documentCount: packageInfo.documentCount,
        action: 'downloaded',
        operator: '出口商操作员',
      },
    ];
    if (packageInfo.sentToImporter && packageInfo.sentAt) {
      history.push({
        id: '3',
        packageName: packageInfo.packageName,
        generatedAt: packageInfo.sentAt,
        documentCount: packageInfo.documentCount,
        action: 'sent',
        operator: '出口商操作员',
      });
    }
    setPackageHistory(history);
  };

  const handleGeneratePackage = async () => {
    if (!selectedOrderId) return;

    setGenerating(true);
    try {
      const result = await DocumentService.generateElectronicPackage(selectedOrderId);
      const newPackageInfo: PackageInfo = {
        packageName: result.packageName,
        packageUrl: result.packageUrl,
        generatedAt: new Date().toISOString(),
        documentCount: orderDocuments.length,
        downloadCount: 0,
        sentToImporter: false,
      };
      setPackageInfo(newPackageInfo);

      setPackageHistory((prev) => [
        {
          id: String(Date.now()),
          packageName: newPackageInfo.packageName,
          generatedAt: newPackageInfo.generatedAt,
          documentCount: newPackageInfo.documentCount,
          action: 'generated',
          operator: '出口商操作员',
        },
        ...prev,
      ]);

      alert('电子交单包已生成！');
    } catch (error) {
      console.error('生成交单包失败:', error);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPackage = () => {
    if (!packageInfo) return;

    console.log('下载交单包:', packageInfo.packageUrl);
    const link = document.createElement('a');
    link.href = packageInfo.packageUrl;
    link.download = packageInfo.packageName;
    link.click();

    setPackageInfo((prev) =>
      prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null
    );

    setPackageHistory((prev) => [
      {
        id: String(Date.now()),
        packageName: packageInfo.packageName,
        generatedAt: new Date().toISOString(),
        documentCount: packageInfo.documentCount,
        action: 'downloaded',
        operator: '出口商操作员',
      },
      ...prev,
    ]);
  };

  const handleSendToImporter = async () => {
    if (!selectedOrderId || !packageInfo) return;

    setSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const sentAt = new Date().toISOString();
      setPackageInfo((prev) =>
        prev ? { ...prev, sentToImporter: true, sentAt } : null
      );

      setPackageHistory((prev) => [
        {
          id: String(Date.now()),
          packageName: packageInfo.packageName,
          generatedAt: sentAt,
          documentCount: packageInfo.documentCount,
          action: 'sent',
          operator: '出口商操作员',
        },
        ...prev,
      ]);

      alert('电子交单包已发送给进口商！');
    } catch (error) {
      console.error('发送失败:', error);
      alert('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const handlePreviewDocument = (document: Document) => {
    console.log('预览单证:', document.id);
    window.open(document.fileUrl, '_blank');
  };

  const getActionLabel = (action: PackageHistory['action']) => {
    const labels = {
      generated: '生成交单包',
      downloaded: '下载交单包',
      sent: '发送给进口商',
    };
    return labels[action];
  };

  const getActionIcon = (action: PackageHistory['action']) => {
    switch (action) {
      case 'generated':
        return <Package className="h-4 w-4 text-indigo-600" />;
      case 'downloaded':
        return <Download className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <PageContainer
      title="电子交单包"
      subTitle="生成、下载和发送电子交单包，跟踪交单历史记录"
      breadcrumb={[
        { title: '出口商工作台', href: '/exporter' },
        { title: '电子交单包' },
      ]}
    >
      <div className="space-y-6">
        <Card>
          <div className="max-w-xl">
            <Select
              label="选择订单"
              placeholder="请选择已通过单证校验的订单"
              options={orderOptions}
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            />
          </div>
        </Card>

        {selectedOrderId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {packageInfo ? (
                <Card title="交单包信息" subtitle="电子交单包的详细信息">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-lg bg-indigo-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm text-gray-600">包名称</span>
                      </div>
                      <p className="font-semibold text-gray-900">{packageInfo.packageName}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">生成时间</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatDate(packageInfo.generatedAt)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-600">包含单证数量</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {packageInfo.documentCount} 份
                      </p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileDown className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-gray-600">下载次数</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {packageInfo.downloadCount} 次
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      icon={<Download className="h-4 w-4" />}
                      onClick={handleDownloadPackage}
                    >
                      下载交单包 (ZIP)
                    </Button>
                    <Button
                      variant="success"
                      icon={<Send className="h-4 w-4" />}
                      onClick={handleSendToImporter}
                      loading={sending}
                      disabled={packageInfo.sentToImporter || sending}
                    >
                      {packageInfo.sentToImporter ? '已发送' : '发送给进口商'}
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<RefreshCw className="h-4 w-4" />}
                      onClick={handleGeneratePackage}
                      loading={generating}
                    >
                      重新生成
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card title="生成电子交单包" subtitle="校验通过后可生成电子交单包">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">
                      请先通过单证校验
                    </p>
                    <p className="text-sm text-gray-400 mt-1 mb-6">
                      所有单证校验通过后，可生成电子交单包
                    </p>
                    <Button
                      variant="primary"
                      icon={<Package className="h-4 w-4" />}
                      onClick={handleGeneratePackage}
                      loading={generating}
                      disabled={orderDocuments.length === 0 || generating}
                    >
                      生成电子交单包
                    </Button>
                  </div>
                </Card>
              )}

              <Card
                title="单证列表"
                subtitle={`共 ${orderDocuments.length} 份已校验通过的单证`}
              >
                {orderDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {orderDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                            {getDocumentTypeIcon(doc.documentType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {getDocumentTypeLabel(doc.documentType)}
                              </span>
                              <StatusBadge status={doc.status} />
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                              <span>{doc.fileName}</span>
                              <span>({formatFileSize(doc.fileSize)})</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handlePreviewDocument(doc)}
                        >
                          预览
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">暂无已校验单证</p>
                    <p className="text-sm text-gray-400 mt-1">
                      请先上传单证并完成校验
                    </p>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="交单记录历史" subtitle="交单包的操作历史记录">
                {packageHistory.length > 0 ? (
                  <div className="space-y-4">
                    {packageHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            {getActionIcon(record.action)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">
                              {getActionLabel(record.action)}
                            </span>
                            {record.action === 'sent' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {record.packageName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <User className="h-3 w-3" />
                            <span>{record.operator}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(record.generatedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <History className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-600">暂无历史记录</p>
                    <p className="text-xs text-gray-400 mt-1">
                      生成交单包后将显示操作历史
                    </p>
                  </div>
                )}
              </Card>

              {packageInfo && selectedOrder && (
                <Card title="订单概览" subtitle="关联订单的简要信息">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">订单号</span>
                      <span className="font-medium text-gray-900">{selectedOrder.orderNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">货物描述</span>
                      <span className="font-medium text-gray-900 text-right truncate max-w-[180px]">
                        {selectedOrder.goodsDescription}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">总金额</span>
                      <span className="font-medium text-gray-900">
                        {selectedOrder.totalAmount.toLocaleString()} {selectedOrder.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">状态</span>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
