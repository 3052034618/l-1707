import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Ship, Eye, Edit2, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import { StatusBadge } from '@/components/business';
import { useLogisticsStore } from '@/store';
import { LogisticsService } from '@/services';
import type { Shipment, ShipmentStatus } from '@/types';
import { format } from 'date-fns';

const statusOptions: SelectOption[] = [
  { value: 'pending', label: '待处理' },
  { value: 'container_loaded', label: '已装柜' },
  { value: 'departed', label: '已启运' },
  { value: 'in_transit', label: '运输中' },
  { value: 'arrived', label: '已到达' },
  { value: 'delivered', label: '已送达' },
  { value: 'delayed', label: '已延误' },
];

export default function ShipmentList() {
  const navigate = useNavigate();
  const { shipments, getShipments, updateShipment } = useLogisticsStore();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const [vesselName, setVesselName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; shipmentId: string; shipmentNo: string }>({
    visible: false,
    shipmentId: '',
    shipmentNo: '',
  });

  useEffect(() => {
    loadShipments();
  }, [pagination.current, pagination.pageSize]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      await getShipments({
        status: status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      const result = await LogisticsService.getShipments({
        status: status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setPagination((prev) => ({ ...prev, total: result.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadShipments();
  };

  const handleReset = () => {
    setSearchText('');
    setStatus('');
    setVesselName('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadShipments();
  };

  const handleDeleteConfirm = async () => {
    await updateShipment(deleteModal.shipmentId, { status: 'cancelled' as any });
    setDeleteModal({ visible: false, shipmentId: '', shipmentNo: '' });
    loadShipments();
  };

  const filteredShipments = shipments.filter((shipment) => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchNo = shipment.id.toLowerCase().includes(searchLower);
      const matchContainer = shipment.containerNo.toLowerCase().includes(searchLower);
      const matchOrder = shipment.orderId.toLowerCase().includes(searchLower);
      if (!matchNo && !matchContainer && !matchOrder) return false;
    }
    if (vesselName) {
      if (!shipment.vesselName.toLowerCase().includes(vesselName.toLowerCase())) return false;
    }
    if (startDate && shipment.createdAt < startDate) return false;
    if (endDate && shipment.createdAt > endDate) return false;
    return true;
  });

  const getEstimatedArrival = (shipment: Shipment) => {
    const lastSegment = shipment.segments[shipment.segments.length - 1];
    return lastSegment?.estimatedArrivalTime || '-';
  };

  const columns: TableColumn<Shipment>[] = [
    {
      title: '运输单号',
      dataIndex: 'id',
      key: 'id',
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
        <span className="text-gray-700">{value as string}</span>
      ),
    },
    {
      title: '集装箱号',
      dataIndex: 'containerNo',
      key: 'containerNo',
      width: 140,
      render: (value) => (
        <span className="font-mono text-gray-700">{value as string}</span>
      ),
    },
    {
      title: '船名航次',
      dataIndex: 'vesselName',
      key: 'vesselName',
      width: 180,
      render: (value, record) => (
        <div>
          <div className="text-gray-900 font-medium">{value as string}</div>
          <div className="text-sm text-gray-500">{record.voyageNo}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as ShipmentStatus} />,
    },
    {
      title: '预计到港',
      dataIndex: 'segments',
      key: 'estimatedArrival',
      width: 120,
      render: (_, record) => (
        <span className="text-gray-600">
          {format(new Date(getEstimatedArrival(record)), 'yyyy-MM-dd')}
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
            onClick={() => navigate(`/logistics/shipments/${record.id}/track`)}
          >
            追踪
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/logistics/shipments/${record.id}/plan`)}
          >
            计划
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => setDeleteModal({ visible: true, shipmentId: record.id, shipmentNo: record.id })}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="运输管理"
      subTitle="管理所有运输单，查看运输状态，执行新增、追踪等操作"
      breadcrumb={[
        { title: '物流商工作台' },
        { title: '运输管理' },
        { title: '运输列表', active: true },
      ]}
      extra={
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/logistics/shipments/new')}
        >
          新增运输
        </Button>
      }
    >
      <Card className="mb-4">
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <Input
                label="搜索"
                placeholder="输入运输单号、集装箱号或订单号搜索"
                icon={<Search className="w-4 h-4" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-44">
              <Select
                label="运输状态"
                placeholder="全部状态"
                value={status}
                onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                options={statusOptions}
              />
            </div>
            <div className="w-44">
              <Input
                label="船名"
                placeholder="输入船名"
                icon={<Ship className="w-4 h-4" />}
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 whitespace-nowrap">日期：</span>
            </div>
            <div className="w-40">
              <Input
                type="date"
                label="开始日期"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-gray-400">至</span>
            <div className="w-40">
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
        dataSource={filteredShipments}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => navigate(`/logistics/shipments/${record.id}/track`)}
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
              确定要删除运输单 <span className="font-medium text-gray-900">{deleteModal.shipmentNo}</span> 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteModal({ visible: false, shipmentId: '', shipmentNo: '' })}>
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
