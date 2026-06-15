import { useState, useEffect } from 'react';
import { Search, Upload, Eye, Download, RefreshCw } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Table from '@/components/Table';
import type { TableColumn } from '@/components/Table';
import Pagination from '@/components/Pagination';
import Input from '@/components/Input';
import Select from '@/components/Select';
import type { SelectOption } from '@/components/Select';
import Button from '@/components/Button';
import StatusBadge from '@/components/business/StatusBadge';
import { useDocumentStore } from '@/store';
import type { Document, DocumentType, DocumentStatus } from '@/types';

const documentTypeOptions: SelectOption[] = [
  { value: '', label: '全部类型' },
  { value: 'bill_of_lading', label: '提单' },
  { value: 'packing_list', label: '箱单' },
  { value: 'commercial_invoice', label: '商业发票' },
  { value: 'certificate_of_origin', label: '原产地证' },
  { value: 'insurance_policy', label: '保险单' },
  { value: 'other', label: '其他' },
];

const statusOptions: SelectOption[] = [
  { value: '', label: '全部状态' },
  { value: 'uploaded', label: '已上传' },
  { value: 'verifying', label: '校验中' },
  { value: 'verified', label: '已校验' },
  { value: 'discrepancy_found', label: '发现不符点' },
  { value: 're_uploaded', label: '已重新上传' },
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

export default function DocumentList() {
  const { documents, getDocuments } = useDocumentStore();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    orderNo: '',
    documentType: '',
    uploadDateStart: '',
    uploadDateEnd: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filteredData, setFilteredData] = useState<Document[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      await getDocuments('all');
    } catch (error) {
      console.error('加载单证列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...documents];

    if (filters.orderNo) {
      result = result.filter((d) => d.orderId.includes(filters.orderNo));
    }
    if (filters.documentType) {
      result = result.filter((d) => d.documentType === filters.documentType);
    }
    if (filters.status) {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters.uploadDateStart) {
      result = result.filter((d) => new Date(d.createdAt) >= new Date(filters.uploadDateStart));
    }
    if (filters.uploadDateEnd) {
      const endDate = new Date(filters.uploadDateEnd);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((d) => new Date(d.createdAt) <= endDate);
    }

    setFilteredData(result);
    setPagination((prev) => ({ ...prev, total: result.length }));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({
      orderNo: '',
      documentType: '',
      uploadDateStart: '',
      uploadDateEnd: '',
      status: '',
    });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize, total: pagination.total });
  };

  const handlePreview = (doc: Document) => {
    console.log('预览单证:', doc.id);
    window.open(doc.fileUrl, '_blank');
  };

  const handleDownload = (doc: Document) => {
    console.log('下载单证:', doc.id);
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.click();
  };

  const handleReUpload = (doc: Document) => {
    console.log('重新上传单证:', doc.id);
  };

  const handleBatchUpload = () => {
    console.log('批量上传');
  };

  const columns: TableColumn<Document>[] = [
    {
      title: '单证编号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (value) => (
        <span className="font-mono text-sm text-gray-700">{String(value).slice(0, 12)}...</span>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
      render: (value) => (
        <span className="text-sm text-gray-700">{String(value).slice(0, 10)}...</span>
      ),
    },
    {
      title: '单证类型',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 100,
      render: (value) => (
        <span className="text-sm font-medium text-gray-700">
          {getDocumentTypeLabel(value as DocumentType)}
        </span>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-gray-700">{String(value)}</span>
          <span className="text-xs text-gray-400">({formatFileSize(record.fileSize)})</span>
        </div>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => (
        <span className="text-sm text-gray-600">{formatDate(String(value))}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as DocumentStatus} />,
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => handleReUpload(record)}
          >
            重新上传
          </Button>
        </div>
      ),
    },
  ];

  const paginatedData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <PageContainer
      title="单证管理"
      subTitle="管理和跟踪所有出口单证的上传、校验和流转状态"
      extra={
        <Button
          variant="primary"
          icon={<Upload className="h-4 w-4" />}
          onClick={handleBatchUpload}
        >
          批量上传
        </Button>
      }
      breadcrumb={[
        { title: '出口商工作台', href: '/exporter' },
        { title: '单证管理' },
      ]}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              label="订单号"
              placeholder="请输入订单号"
              icon={<Search className="h-4 w-4" />}
              value={filters.orderNo}
              onChange={(e) => handleFilterChange('orderNo', e.target.value)}
            />
            <Select
              label="单证类型"
              options={documentTypeOptions}
              value={filters.documentType}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
            />
            <Input
              label="上传日期（起）"
              type="date"
              value={filters.uploadDateStart}
              onChange={(e) => handleFilterChange('uploadDateStart', e.target.value)}
            />
            <Input
              label="上传日期（止）"
              type="date"
              value={filters.uploadDateEnd}
              onChange={(e) => handleFilterChange('uploadDateEnd', e.target.value)}
            />
            <Select
              label="状态"
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
            <Button variant="primary" onClick={applyFilters}>
              查询
            </Button>
          </div>
        </div>

        <Table<Document>
          columns={columns}
          dataSource={paginatedData}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <div className="flex justify-end">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
          />
        </div>
      </div>
    </PageContainer>
  );
}
