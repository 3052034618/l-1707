import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Calendar, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import { StatusBadge } from '@/components/business';
import { useOrderStore } from '@/store';
import type { Order, OrderStatus, TradeTerm } from '@/types';
import { format } from 'date-fns';

const tradeTermOptions: SelectOption[] = [
  { value: 'FOB', label: 'FOB 船上交货' },
  { value: 'CIF', label: 'CIF 成本加保险费加运费' },
  { value: 'CFR', label: 'CFR 成本加运费' },
  { value: 'EXW', label: 'EXW 工厂交货' },
  { value: 'FCA', label: 'FCA 货交承运人' },
  { value: 'CPT', label: 'CPT 运费付至' },
  { value: 'CIP', label: 'CIP 运费和保险费付至' },
  { value: 'DAP', label: 'DAP 目的地交货' },
  { value: 'DPU', label: 'DPU 卸货地交货' },
  { value: 'DDP', label: 'DDP 完税后交货' },
];

const statusOptions: SelectOption[] = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_confirmation', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'documents_uploaded', label: '单证已上传' },
  { value: 'customs_declared', label: '已报关' },
  { value: 'in_transit', label: '运输中' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const { orders, loading, getOrders, deleteOrder } = useOrderStore();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [tradeTerm, setTradeTerm] = useState<TradeTerm | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; orderId: string; orderNo: string }>({
    visible: false,
    orderId: '',
    orderNo: '',
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.current, pagination.pageSize]);

  const loadOrders = async () => {
    await getOrders({
      status: status || undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadOrders();
  };

  const handleReset = () => {
    setSearchText('');
    setStatus('');
    setTradeTerm('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadOrders();
  };

  const handleDeleteConfirm = async () => {
    await deleteOrder(deleteModal.orderId);
    setDeleteModal({ visible: false, orderId: '', orderNo: '' });
    loadOrders();
  };

  const filteredOrders = orders.filter((order) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchNo = order.orderNo.toLowerCase().includes(searchLower);
      const matchGoods = order.goodsDescription.toLowerCase().includes(searchLower);
      if (!matchNo && !matchGoods) return false;
    }
    if (tradeTerm && order.tradeTerm !== tradeTerm) return false;
    if (startDate && order.createdAt < startDate) return false;
    if (endDate && order.createdAt > endDate) return false;
    return true;
  });

  const columns: TableColumn<Order>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
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
      title: '贸易术语',
      dataIndex: 'tradeTerm',
      key: 'tradeTerm',
      width: 120,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">
          {value as string}
        </span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
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
      render: (value) => <StatusBadge status={value as OrderStatus} />,
    },
    {
      title: '创建日期',
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
      width: 180,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/importer/orders/${record.id}`)}
          >
            详情
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/importer/orders/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => setDeleteModal({ visible: true, orderId: record.id, orderNo: record.orderNo })}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="订单列表"
      subTitle="管理所有进口订单，查看订单状态，执行新增、编辑、删除等操作"
      breadcrumb={[
        { title: '进口商工作台' },
        { title: '订单管理' },
        { title: '订单列表', active: true },
      ]}
      extra={
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/importer/orders/new')}
        >
          新增订单
        </Button>
      }
    >
      <Card className="mb-4">
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <Input
                label="搜索"
                placeholder="输入订单号或商品名称搜索"
                icon={<Search className="w-4 h-4" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-44">
              <Select
                label="订单状态"
                placeholder="全部状态"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={statusOptions}
              />
            </div>
            <div className="w-44">
              <Select
                label="贸易术语"
                placeholder="全部术语"
                value={tradeTerm}
                onChange={(e) => setTradeTerm(e.target.value as TradeTerm)}
                options={tradeTermOptions}
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
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              高级筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilter ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showAdvancedFilter && (
            <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 whitespace-nowrap">日期范围：</span>
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
            </div>
          )}
        </Card.Body>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => navigate(`/importer/orders/${record.id}`)}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize, total: pagination.total });
          },
        }}
      />

      {deleteModal.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除订单 <span className="font-medium text-gray-900">{deleteModal.orderNo}</span> 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteModal({ visible: false, orderId: '', orderNo: '' })}>
                取消
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
