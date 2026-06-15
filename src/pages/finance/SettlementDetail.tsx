import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText, CreditCard, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import { StatusBadge } from '@/components/business';
import { useFinanceStore } from '@/store';
import type { Settlement, FinanceItem, SettlementStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SettlementDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentSettlement, getSettlement, createPaymentApplication } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      loadSettlementDetail();
    }
  }, [id]);

  const loadSettlementDetail = async () => {
    if (id) {
      setLoading(true);
      try {
        await getSettlement(id);
      } finally {
        setLoading(false);
      }
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

  const handleCreatePaymentApplication = async () => {
    if (!currentSettlement) return;
    setCreatingPayment(true);
    try {
      const payment = await createPaymentApplication(currentSettlement.id, {
        amount: currentSettlement.totalPayable,
        currency: currentSettlement.currency,
      });
      navigate(`/finance/payments/${payment.id}`);
    } finally {
      setCreatingPayment(false);
    }
  };

  const receivableColumns: TableColumn<FinanceItem>[] = [
    {
      title: '费用类型',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 150,
      render: (value) => {
        const typeMap: Record<string, string> = {
          'goods_value': '货物价值',
          'service_fee': '服务费',
          'commission': '佣金',
          'refund': '退款',
        };
        return <span className="text-gray-700">{typeMap[value as string] || value}</span>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value) => <span className="text-gray-600">{value as string}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-green-600">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '到账状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as SettlementStatus} />,
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd')}
        </span>
      ),
    },
  ];

  const payableColumns: TableColumn<FinanceItem>[] = [
    {
      title: '费用类型',
      dataIndex: 'itemType',
      key: 'itemType',
      width: 150,
      render: (value) => {
        const typeMap: Record<string, string> = {
          'freight_fee': '海运费',
          'insurance_fee': '保险费',
          'customs_duty': '进口关税',
          'import_vat': '进口增值税',
          'customs_fee': '报关代理费',
          'logistics_fee': '物流费',
          'bank_fee': '银行手续费',
          'service_fee': '服务费',
        };
        return <span className="text-gray-700">{typeMap[value as string] || value}</span>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value) => <span className="text-gray-600">{value as string}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-red-600">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '支付状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as SettlementStatus} />,
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd')}
        </span>
      ),
    },
  ];

  if (loading || !currentSettlement) {
    return (
      <PageContainer title="结算详情">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/finance/settlements')}
          >
            返回
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold">结算单详情</span>
              <StatusBadge status={currentSettlement.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              结算单号：{currentSettlement.id}
            </p>
          </div>
        </div>
      }
      breadcrumb={[
        { title: '财务工作台' },
        { title: '费用结算', href: '/finance/settlements' },
        { title: '结算详情', active: true },
      ]}
      extra={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Printer className="w-4 h-4" />}
          >
            打印
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
          >
            导出
          </Button>
          <Button
            variant="primary"
            icon={<CreditCard className="w-4 h-4" />}
            loading={creatingPayment}
            onClick={handleCreatePaymentApplication}
          >
            生成付款申请
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="应收合计"
            value={currentSettlement.totalReceivable}
            icon={<TrendingUp className="w-6 h-6" />}
            color="success"
            trend="up"
            trendValue={0}
          />
          <StatCard
            title="应付合计"
            value={currentSettlement.totalPayable}
            icon={<TrendingDown className="w-6 h-6" />}
            color="danger"
            trend="down"
            trendValue={0}
          />
          <StatCard
            title="净额"
            value={currentSettlement.netAmount}
            icon={<RefreshCw className="w-6 h-6" />}
            color={currentSettlement.netAmount >= 0 ? 'success' : 'danger'}
            trend={currentSettlement.netAmount >= 0 ? 'up' : 'down'}
            trendValue={0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="订单信息">
            <Card.Body>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">关联订单</span>
                  <span className="font-medium text-blue-600 cursor-pointer">
                    {getOrderNo(currentSettlement.orderId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">创建日期</span>
                  <span className="text-gray-700">
                    {format(new Date(currentSettlement.createdAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">提单日期</span>
                  <span className="text-gray-700">
                    {currentSettlement.billOfLadingDate
                      ? format(new Date(currentSettlement.billOfLadingDate), 'yyyy-MM-dd')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">货币</span>
                  <span className="text-gray-700">{currentSettlement.currency}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card title="汇率信息">
            <Card.Body>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">汇率</span>
                  <span className="font-semibold text-gray-900">
                    {currentSettlement.currency} / CNY = {currentSettlement.exchangeRate || 7.2568}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">换算日期</span>
                  <span className="text-gray-700">
                    {format(new Date(currentSettlement.updatedAt), 'yyyy-MM-dd')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">应收金额（CNY）</span>
                  <span className="font-semibold text-green-600">
                    ¥ {(currentSettlement.totalReceivable * (currentSettlement.exchangeRate || 7.2568)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">应付金额（CNY）</span>
                  <span className="font-semibold text-red-600">
                    ¥ {(currentSettlement.totalPayable * (currentSettlement.exchangeRate || 7.2568)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>应收明细</span>
            </div>
          }
        >
          <Card.Body className="p-0">
            <Table
              columns={receivableColumns}
              dataSource={currentSettlement.receivables}
              rowKey="id"
              pagination={false}
            />
          </Card.Body>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span>应付明细</span>
            </div>
          }
        >
          <Card.Body className="p-0">
            <Table
              columns={payableColumns}
              dataSource={currentSettlement.payables}
              rowKey="id"
              pagination={false}
            />
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex flex-col items-end gap-2 pr-8">
              <div className="flex items-center gap-4 text-lg">
                <span className="text-gray-500">应收合计：</span>
                <span className="font-semibold text-green-600">
                  {currentSettlement.currency} {currentSettlement.totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <span className="text-gray-500">应付合计：</span>
                <span className="font-semibold text-red-600">
                  {currentSettlement.currency} {currentSettlement.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-px w-full bg-gray-200 my-2" />
              <div className="flex items-center gap-4 text-xl">
                <span className="text-gray-700 font-medium">净额：</span>
                <span className={cn(
                  'font-bold',
                  currentSettlement.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {currentSettlement.currency} {currentSettlement.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </PageContainer>
  );
}
