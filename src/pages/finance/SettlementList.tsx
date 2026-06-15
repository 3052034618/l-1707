import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Eye, FileText, Download } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import { StatusBadge } from '@/components/business';
import { useFinanceStore } from '@/store';
import type { Settlement, SettlementStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusOptions: SelectOption[] = [
  { value: 'pending', label: '待处理' },
  { value: 'calculated', label: '已计算' },
  { value: 'invoiced', label: '已开票' },
  { value: 'payment_pending', label: '待付款' },
  { value: 'payment_processing', label: '付款处理中' },
  { value: 'paid', label: '已付款' },
  { value: 'completed', label: '已完成' },
];

export default function SettlementList() {
  const navigate = useNavigate();
  const { settlements, getSettlements, generateSettlementList } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<SettlementStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSettlements();
  }, [pagination.current, pagination.pageSize, status]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      await getSettlements({
        status: status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadSettlements();
  };

  const handleReset = () => {
    setSearchText('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadSettlements();
  };

  const handleGenerateSettlement = async () => {
    setGenerating(true);
    try {
      await generateSettlementList('order_001');
      loadSettlements();
    } finally {
      setGenerating(false);
    }
  };

  const getOrderNo = (orderId: string) => {
    const orderMap: Record<string, string> = {
      'order_001': 'ORD-2026-06001',
      'order_002': 'ORD-2026-06002',
      'order_003': 'ORD-2026-06003',
    };
    return orderMap[orderId] || orderId;
  };

  const filteredSettlements = settlements.filter((settlement) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchId = settlement.id.toLowerCase().includes(searchLower);
      const matchOrder = getOrderNo(settlement.orderId).toLowerCase().includes(searchLower);
      if (!matchId && !matchOrder) return false;
    }
    if (startDate && settlement.createdAt < startDate) return false;
    if (endDate && settlement.createdAt > endDate) return false;
    return true;
  });

  const columns: TableColumn<Settlement>[] = [
    {
      title: '结算单号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {String(value).slice(0, 20)}...
        </span>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      render: (value) => (
        <span className="text-gray-700">{getOrderNo(value as string)}</span>
      ),
    },
    {
      title: '应收金额',
      dataIndex: 'totalReceivable',
      key: 'totalReceivable',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-green-600">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '应付金额',
      dataIndex: 'totalPayable',
      key: 'totalPayable',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-red-600">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '净额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 140,
      render: (value, record) => (
        <span className={cn(
          'font-semibold',
          Number(value) >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as SettlementStatus} />,
    },
    {
      title: '结算日期',
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
      width: 200,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/finance/settlements/${record.id}`)}
          >
            详情
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            导出
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="费用结算"
      subTitle="管理所有费用结算单，查看应收应付明细，生成结算单"
      breadcrumb={[
        { title: '财务工作台' },
        { title: '费用结算', active: true },
      ]}
      extra={
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          loading={generating}
          onClick={handleGenerateSettlement}
        >
          生成结算单
        </Button>
      }
    >
      <Card className="mb-4">
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <Input
                label="搜索"
                placeholder="输入结算单号或订单号搜索"
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
                onChange={(e) => setStatus(e.target.value as SettlementStatus)}
                options={statusOptions}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 whitespace-nowrap">日期：</span>
            </div>
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
            <Button variant="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredSettlements}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => navigate(`/finance/settlements/${record.id}`)}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
          },
        }}
      />
    </PageContainer>
  );
}
