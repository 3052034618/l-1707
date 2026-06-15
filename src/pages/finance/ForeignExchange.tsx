import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  Download,
  RefreshCw,
  FileText,
  Globe,
  TrendingUp,
  Calendar,
  Search,
  FileCheck,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import { useFinanceStore } from '@/store';
import type { ForeignExchangeDeclaration, ForeignExchangeDeclarationStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const currencyPairs: SelectOption[] = [
  { value: 'USD-CNY', label: '美元 / 人民币 (USD/CNY)' },
  { value: 'EUR-CNY', label: '欧元 / 人民币 (EUR/CNY)' },
  { value: 'JPY-CNY', label: '日元 / 人民币 (JPY/CNY)' },
  { value: 'GBP-CNY', label: '英镑 / 人民币 (GBP/CNY)' },
  { value: 'AUD-CNY', label: '澳元 / 人民币 (AUD/CNY)' },
];

const generateExchangeRateHistory = (baseRate: number, days: number) => {
  const data = [];
  let rate = baseRate;
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const fluctuation = (Math.random() - 0.5) * 0.02 * rate;
    rate = Number((rate + fluctuation).toFixed(4));
    data.push({
      date: format(date, 'MM-dd'),
      rate: rate,
    });
  }
  return data;
};

export default function ForeignExchange() {
  const [searchParams] = useSearchParams();
  const { 
    getExchangeRate, 
    generateForeignExchangeDeclaration, 
    foreignExchangeDeclarations, 
    paymentApplications,
    generateElectronicReceipt 
  } = useFinanceStore();
  const [selectedDeclaration, setSelectedDeclaration] = useState<ForeignExchangeDeclaration | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currencyPair, setCurrencyPair] = useState('USD-CNY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentRate, setCurrentRate] = useState<{ rate: number; date: string } | null>(null);
  const [rateHistory, setRateHistory] = useState<any[]>([]);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    if (paymentId) {
      handleGenerateDeclaration(paymentId);
    }
    loadCurrentRate();
    loadRateHistory();
  }, [currencyPair]);

  const loadCurrentRate = async () => {
    setLoadingRate(true);
    try {
      const [from, to] = currencyPair.split('-');
      const rate = await getExchangeRate(from, to);
      setCurrentRate(rate);
    } finally {
      setLoadingRate(false);
    }
  };

  const loadRateHistory = () => {
    const baseRates: Record<string, number> = {
      'USD-CNY': 7.2568,
      'EUR-CNY': 7.8945,
      'JPY-CNY': 0.0485,
      'GBP-CNY': 9.1234,
      'AUD-CNY': 4.7823,
    };
    const history = generateExchangeRateHistory(baseRates[currencyPair] || 1, 30);
    setRateHistory(history);
  };

  const handleGenerateDeclaration = async (paymentId: string) => {
    const declaration = await generateForeignExchangeDeclaration(paymentId);
    await generateElectronicReceipt(declaration.id);
    setSelectedDeclaration(declaration);
    setShowReceipt(true);
  };

  const handleQueryRate = () => {
    loadRateHistory();
  };

  const handleDownloadReceipt = () => {
    if (selectedDeclaration) {
      alert(`正在下载回单：${selectedDeclaration.declarationNo}.pdf`);
    }
  };

  const getPaymentInfo = (paymentAppId: string) => {
    const paymentApp = paymentApplications.find((p) => p.id === paymentAppId);
    if (paymentApp) {
      return {
        no: paymentApp.applicationNo,
        payee: paymentApp.payee,
        purpose: paymentApp.purpose,
      };
    }
    return { no: paymentAppId, payee: '-', purpose: '-' };
  };

  const columns: TableColumn<ForeignExchangeDeclaration>[] = [
    {
      title: '申报编号',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
      width: 160,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-gray-900">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">
          {value as string}
        </span>
      ),
    },
    {
      title: '汇率',
      dataIndex: 'exchangeRate',
      key: 'exchangeRate',
      width: 120,
      render: (value) => (
        <span className="font-medium text-gray-700">{value as number}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => {
        const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
          pending: { label: '待申报', variant: 'warning' },
          submitted: { label: '已申报', variant: 'info' },
          approved: { label: '已批准', variant: 'success' },
          rejected: { label: '已驳回', variant: 'danger' },
        };
        const config = statusMap[value as string] || { label: value, variant: 'info' };
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              {
                'bg-yellow-50 text-yellow-700 border-yellow-200': config.variant === 'warning',
                'bg-blue-50 text-blue-700 border-blue-200': config.variant === 'info',
                'bg-green-50 text-green-700 border-green-200': config.variant === 'success',
                'bg-red-50 text-red-700 border-red-200': config.variant === 'danger',
              }
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', {
                'bg-yellow-500': config.variant === 'warning',
                'bg-blue-500': config.variant === 'info',
                'bg-green-500': config.variant === 'success',
                'bg-red-500': config.variant === 'danger',
              })}
            />
            {config.label}
          </span>
        );
      },
    },
    {
      title: '申报日期',
      dataIndex: 'declarationDate',
      key: 'declarationDate',
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
            onClick={() => {
              setSelectedDeclaration(record);
              setShowReceipt(true);
            }}
          >
            详情
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadReceipt}
          >
            回单
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="外汇申报"
      subTitle="管理外汇申报，查看申报详情，下载电子回单，查询汇率趋势"
      breadcrumb={[
        { title: '财务工作台' },
        { title: '外汇申报', active: true },
      ]}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="当前汇率"
            value={currentRate?.rate || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="primary"
            trend="up"
            trendValue={0.12}
          />
          <StatCard
            title="本月申报笔数"
            value={foreignExchangeDeclarations.length}
            icon={<FileCheck className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="本月申报总额"
            value={foreignExchangeDeclarations.reduce((sum, d) => sum + d.amount * d.exchangeRate, 0)}
            icon={<Globe className="w-6 h-6" />}
            color="warning"
          />
        </div>

        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>外汇申报列表</span>
            </div>
          }
        >
          <Card.Body className="p-0">
            <Table
              columns={columns}
              dataSource={foreignExchangeDeclarations}
              rowKey="id"
              onRowClick={(record) => {
                setSelectedDeclaration(record);
                setShowReceipt(true);
              }}
              pagination={{
                current: 1,
                pageSize: 10,
                total: foreignExchangeDeclarations.length,
                onChange: () => {},
              }}
            />
          </Card.Body>
        </Card>

        {selectedDeclaration && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-green-500" />
                <span>申报详情</span>
              </div>
            }
          >
            <Card.Body>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">付汇信息</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">付款申请编号</span>
                      <span className="font-medium text-gray-900">
                        {getPaymentInfo(selectedDeclaration.paymentApplicationId).no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">收款人</span>
                      <span className="text-gray-700">
                        {getPaymentInfo(selectedDeclaration.paymentApplicationId).payee}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">付汇用途</span>
                      <span className="text-gray-700">
                        {getPaymentInfo(selectedDeclaration.paymentApplicationId).purpose}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">付汇金额</span>
                      <span className="font-semibold text-gray-900">
                        {selectedDeclaration.currency} {selectedDeclaration.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">汇率换算</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">申报汇率</span>
                      <span className="font-semibold text-blue-600">
                        {selectedDeclaration.currency} / CNY = {selectedDeclaration.exchangeRate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">折合人民币</span>
                      <span className="font-semibold text-green-600">
                        ¥ {(selectedDeclaration.amount * selectedDeclaration.exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">申报日期</span>
                      <span className="text-gray-700">
                        {format(new Date(selectedDeclaration.declarationDate), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">电子回单</span>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => setShowReceipt(true)}
                        >
                          预览
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          onClick={handleDownloadReceipt}
                        >
                          下载
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {showReceipt && selectedDeclaration && (
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>电子回单预览</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => window.print()}
                  >
                    打印
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleDownloadReceipt}
                  >
                    下载PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReceipt(false)}
                  >
                    关闭
                  </Button>
                </div>
              </div>
            }
          >
            <Card.Body>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-8 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">外汇业务电子回单</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    FOREIGN EXCHANGE ELECTRONIC RECEIPT
                  </p>
                </div>

                <div className="border-t border-b border-gray-200 py-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">回单编号</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedDeclaration.declarationNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">打印日期</p>
                      <p className="font-medium text-gray-700">{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">业务类型</p>
                      <p className="font-medium text-gray-900">境外汇款申报</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">申报状态</p>
                      <p className="font-medium text-green-600">已完成</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">收款人</p>
                      <p className="font-medium text-gray-900">
                        {getPaymentInfo(selectedDeclaration.paymentApplicationId).payee}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">付款人</p>
                      <p className="font-medium text-gray-900">华盛进出口贸易有限公司</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">汇款金额（外币）</p>
                      <p className="font-bold text-lg text-gray-900">
                        {selectedDeclaration.currency} {selectedDeclaration.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">折合人民币</p>
                      <p className="font-bold text-lg text-green-600">
                        ¥ {(selectedDeclaration.amount * selectedDeclaration.exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">汇率</p>
                      <p className="font-medium text-blue-600">
                        {selectedDeclaration.exchangeRate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">交易日期</p>
                      <p className="font-medium text-gray-700">
                        {format(new Date(selectedDeclaration.declarationDate), 'yyyy-MM-dd')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">付汇用途</p>
                    <p className="font-medium text-gray-700">
                      {getPaymentInfo(selectedDeclaration.paymentApplicationId).purpose}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">本回单由系统自动生成</p>
                    <p className="text-xs text-gray-400">
                      验证码：{selectedDeclaration.id.slice(-12).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center mb-2">
                      <span className="text-xs text-gray-400">业务章</span>
                    </div>
                    <p className="text-xs text-gray-400">外汇业务专用章</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>汇率查询工具</span>
            </div>
          }
        >
          <Card.Body>
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div className="w-64">
                <Select
                  label="货币对"
                  value={currencyPair}
                  onChange={(e) => setCurrencyPair(e.target.value)}
                  options={currencyPairs}
                />
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
              <Button
                variant="primary"
                icon={<Search className="w-4 h-4" />}
                onClick={handleQueryRate}
              >
                查询
              </Button>
              <Button
                variant="secondary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadCurrentRate}
                loading={loadingRate}
              >
                刷新
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">当前汇率</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currencyPair.replace('-', ' / ')} = {currentRate?.rate || '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    更新时间：{currentRate?.date ? format(new Date(currentRate.date), 'yyyy-MM-dd HH:mm') : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">30天走势</p>
                  <p className="text-lg font-semibold text-green-600">+0.85%</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rateHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number) => [value.toFixed(4), '汇率']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name={currencyPair}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 6, fill: '#6366f1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </PageContainer>
  );
}
