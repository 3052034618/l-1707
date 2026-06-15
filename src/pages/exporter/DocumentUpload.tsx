import { useState, useEffect } from 'react';
import { Send, Eye, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Select from '@/components/Select';
import type { SelectOption } from '@/components/Select';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import StatusBadge from '@/components/business/StatusBadge';
import DocumentUploadZone from '@/components/business/DocumentUploadZone';
import type { UploadedFile } from '@/components/business/DocumentUploadZone';
import { DocumentService } from '@/services';
import { useOrderStore } from '@/store';
import type { Document, DocumentType, Order } from '@/types';

const documentTypeOptions: SelectOption[] = [
  { value: 'bill_of_lading', label: '提单 (B/L)' },
  { value: 'packing_list', label: '箱单 (Packing List)' },
  { value: 'commercial_invoice', label: '商业发票 (Commercial Invoice)' },
  { value: 'certificate_of_origin', label: '原产地证 (CO)' },
  { value: 'insurance_policy', label: '保险单 (Insurance Policy)' },
  { value: 'other', label: '其他单证' },
];

interface UploadedDocument {
  file: File;
  documentType: DocumentType;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: Record<string, any>;
  document?: Document;
}

const detectDocumentType = (fileName: string): DocumentType | null => {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('bl') || lowerName.includes('提单') || lowerName.includes('bill of lading')) {
    return 'bill_of_lading';
  }
  if (lowerName.includes('packing') || lowerName.includes('箱单') || lowerName.includes('pack')) {
    return 'packing_list';
  }
  if (lowerName.includes('invoice') || lowerName.includes('发票') || lowerName.includes('inv')) {
    return 'commercial_invoice';
  }
  if (lowerName.includes('origin') || lowerName.includes('原产地') || lowerName.includes('co.')) {
    return 'certificate_of_origin';
  }
  if (lowerName.includes('insurance') || lowerName.includes('保险')) {
    return 'insurance_policy';
  }
  return null;
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

export default function DocumentUpload() {
  const { orders, getOrders } = useOrderStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderOptions, setOrderOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const order = orders.find((o) => o.id === selectedOrderId);
    setSelectedOrder(order || null);
  }, [selectedOrderId, orders]);

  const loadOrders = async () => {
    await getOrders();
    const options = orders.map((o) => ({
      value: o.id,
      label: `${o.orderNo} - ${o.goodsDescription.slice(0, 20)}`,
    }));
    setOrderOptions(options);
  };

  const handleFileUpload = (files: File[]) => {
    const newDocs: UploadedDocument[] = files.map((file) => {
      const detectedType = detectDocumentType(file.name);
      return {
        file,
        documentType: detectedType || 'other',
        ocrStatus: 'pending',
      };
    });
    setUploadedDocs((prev) => [...prev, ...newDocs]);

    newDocs.forEach((doc, index) => {
      setTimeout(() => {
        simulateOCR(doc, index);
      }, 1000 + index * 500);
    });
  };

  const simulateOCR = (doc: UploadedDocument, index: number) => {
    setUploadedDocs((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ocrStatus: 'processing' } : d))
    );

    setTimeout(() => {
      const success = Math.random() > 0.1;
      setUploadedDocs((prev) =>
        prev.map((d, i) =>
          i === index
            ? {
                ...d,
                ocrStatus: success ? 'completed' : 'failed',
                ocrData: success
                  ? {
                      invoiceNo: `INV-${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      totalAmount: '15,000.00',
                      currency: 'USD',
                    }
                  : undefined,
              }
            : d
        )
      );
    }, 2000);
  };

  const handleDocumentTypeChange = (index: number, type: DocumentType) => {
    setUploadedDocs((prev) =>
      prev.map((d, i) => (i === index ? { ...d, documentType: type } : d))
    );
  };

  const handleRemoveDocument = (index: number) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreview = (doc: UploadedDocument) => {
    if (doc.document?.fileUrl) {
      window.open(doc.document.fileUrl, '_blank');
    } else {
      const url = URL.createObjectURL(doc.file);
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      alert('请先选择订单');
      return;
    }
    if (uploadedDocs.length === 0) {
      alert('请至少上传一个单证文件');
      return;
    }

    setSubmitting(true);
    try {
      for (const doc of uploadedDocs) {
        if (!doc.document) {
          const uploaded = await DocumentService.uploadDocument(
            selectedOrderId,
            doc.file,
            doc.documentType
          );
          doc.document = uploaded;
        }
      }

      await DocumentService.verifyDocuments(selectedOrderId);
      alert('单证提交成功，已自动触发校验！');
      setUploadedDocs([]);
    } catch (error) {
      console.error('提交单证失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getOcrStatusIcon = (status: UploadedDocument['ocrStatus']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getOcrStatusText = (status: UploadedDocument['ocrStatus']) => {
    const texts: Record<UploadedDocument['ocrStatus'], string> = {
      pending: '等待识别',
      processing: 'OCR识别中...',
      completed: '识别完成',
      failed: '识别失败',
    };
    return texts[status];
  };

  const canSubmit =
    selectedOrderId &&
    uploadedDocs.length > 0 &&
    uploadedDocs.every((d) => d.ocrStatus !== 'processing');

  return (
    <PageContainer
      title="单证上传"
      subTitle="上传出口单证并自动识别内容，支持批量上传和类型自动识别"
      breadcrumb={[
        { title: '出口商工作台', href: '/exporter' },
        { title: '单证上传' },
      ]}
    >
      <div className="space-y-6">
        <Card title="选择订单" subtitle="请选择需要上传单证的关联订单">
          <div className="max-w-xl">
            <Select
              label="关联订单"
              placeholder="请选择订单"
              options={orderOptions}
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            />
          </div>
          {selectedOrder && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="font-medium text-gray-900">{selectedOrder.orderNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">贸易术语：</span>
                  <span className="font-medium text-gray-900">{selectedOrder.tradeTerm}</span>
                </div>
                <div>
                  <span className="text-gray-500">货物描述：</span>
                  <span className="font-medium text-gray-900">{selectedOrder.goodsDescription}</span>
                </div>
                <div>
                  <span className="text-gray-500">总金额：</span>
                  <span className="font-medium text-gray-900">
                    {selectedOrder.totalAmount.toLocaleString()} {selectedOrder.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">状态：</span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="上传单证" subtitle="支持拖拽上传，系统将自动识别单证类型">
          <DocumentUploadZone onUpload={handleFileUpload} multiple />
        </Card>

        {uploadedDocs.length > 0 && (
          <Card
            title="已上传文件"
            subtitle={`共 ${uploadedDocs.length} 个文件，OCR识别处理中...`}
          >
            <div className="space-y-3">
              {uploadedDocs.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900">{doc.file.name}</p>
                        <span className="text-xs text-gray-400">
                          ({formatFileSize(doc.file.size)})
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          上传时间：{formatDate(new Date().toISOString())}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {getOcrStatusIcon(doc.ocrStatus)}
                          <span>{getOcrStatusText(doc.ocrStatus)}</span>
                        </div>
                      </div>
                      {doc.ocrStatus === 'completed' && doc.ocrData && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(doc.ocrData).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                            >
                              <span className="text-green-500">✓</span>
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-40">
                      <Select
                        value={doc.documentType}
                        onChange={(e) =>
                          handleDocumentTypeChange(index, e.target.value as DocumentType)
                        }
                        options={documentTypeOptions}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => handlePreview(doc)}
                    >
                      预览
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setUploadedDocs([])}>
                清空全部
              </Button>
              <Button
                variant="primary"
                icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                loading={submitting}
              >
                {submitting ? '提交中...' : '提交并校验'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
