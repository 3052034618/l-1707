import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Edit2, Eye, FileText, ChevronDown } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import { StatusBadge } from '@/components/business';
import { useCustomsStore } from '@/store';
import { CustomsService } from '@/services';
import type { CustomsDeclaration, CustomsStatus } from '@/types';
import { format } from 'date-fns';

const statusOptions: SelectOption[] = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待处理' },
  { value: 'license_missing', label: '缺少许可证' },
  { value: 'ready_to_submit', label: '准备提交' },
  { value: 'submitted', label: '已提交' },
  { value: 'accepted', label: '已受理' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cleared', label: '已放行' },
];

export default function DeclarationList() {
  const navigate = useNavigate();
  const { declarations, loading, getDeclarations, generateDeclarationMessage } = useCustomsStore();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<CustomsStatus | ''>('');
  const [hsCode, setHsCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadDeclarations();
  }, [pagination.current, pagination.pageSize]);

  const loadDeclarations = async () => {
    const result = await CustomsService.getDeclarations({
      status: status || undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    setTotalCount(result.total);
    await getDeclarations({
      status: status || undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadDeclarations();
  };

  const handleReset = () => {
    setSearchText('');
    setStatus('');
    setHsCode('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadDeclarations();
  };

  const handleGenerateMessage = async (id: string) => {
    await generateDeclarationMessage(id);
  };

  const filteredDeclarations = declarations.filter((declaration) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchNo = declaration.declarationNo.toLowerCase().includes(searchLower);
      const matchGoods = declaration.goodsDescription.toLowerCase().includes(searchLower);
      if (!matchNo && !matchGoods) return false;
    }
    if (hsCode && !declaration.hsCode.includes(hsCode)) return false;
    if (startDate && declaration.createdAt < startDate) return false;
    if (endDate && declaration.createdAt > endDate) return false;
    return true;
  });

  const columns: TableColumn<CustomsDeclaration>[] = [
    {
      title: '报关单号',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
      width: 180,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      render: (value) => (
        <span className="text-gray-700 truncate block" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      title: 'HS编码',
      dataIndex: 'hsCode',
      key: 'hsCode',
      width: 120,
      render: (value) => (
        <span className="font-mono text-sm text-gray-700">
          {value as string}
        </span>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'goodsDescription',
      key: 'goodsDescription',
      render: (value) => (
        <span className="text-gray-700 truncate block max-w-xs" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      title: '申报金额',
      dataIndex: 'declaredValue',
      key: 'declaredValue',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-gray-900">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as CustomsStatus} />,
    },
    {
      title: '申报日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd')}
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 220,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/customs/declarations/${record.id}`)}
          >
            查看
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/customs/declarations/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => handleGenerateMessage(record.id)}
          >
            生成报文
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="报关单列表"
      subTitle="管理所有报关单，执行新增、查看、编辑和生成报文等操作"
      breadcrumb={[
        { title: '报关行工作台' },
        { title: '报关单管理' },
        { title: '报关单列表', active: true },
      ]}
      extra={
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/customs/declarations/new')}
        >
          新增报关单
        </Button>
      }
    >
      <Card className="mb-4">
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <Input
                label="搜索"
                placeholder="输入报关单号或商品名称搜索"
                icon={<Search className="w-4 h-4" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-44">
              <Select
                label="状态"
                placeholder="全部状态"
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomsStatus)}
                options={statusOptions}
              />
            </div>
            <div className="w-44">
              <Input
                label="HS编码"
                placeholder="输入HS编码"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
              />
            </div>
            <Button variant="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
            <Button
              variant="ghost"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              日期筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilter ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showAdvancedFilter && (
            <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="w-44">
                <Input
                  type="date"
                  label="开始日期"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-gray-400">至</span>
              <div className="w-44">
                <Input
                  type="date"
                  label="结束日期"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredDeclarations}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => navigate(`/customs/declarations/${record.id}`)}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: totalCount,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: totalCount });
          },
        }}
      />
    </PageContainer>
  );
}
