import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  RefreshCw,
  Download,
  Clock,
  CheckCircle,
  Zap,
  DollarSign,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Table from '@/components/Table';
import type { TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { usePerformanceStore } from '@/store';
import type { DepartmentMetric, OverallMetric } from '@/types';
import { cn } from '@/lib/utils';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', '#06B6D4', '#F97316'];

const timeRangeOptions = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季' },
];

const getDateRange = (range: string): { start: string; end: string } => {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = new Date();

  switch (range) {
    case 'today':
      start = now;
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    default:
      start = now;
  }

  return {
    start: start.toISOString().split('T')[0],
    end,
  };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const { getOverallMetrics, getDepartmentMetrics } = usePerformanceStore();

  const [overallMetrics, setOverallMetrics] = useState<OverallMetric | null>(null);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetric[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);
      const [overall, departments] = await Promise.all([
        getOverallMetrics(start, end),
        getDepartmentMetrics('', start, end),
      ]);
      setOverallMetrics(overall);
      setDepartmentMetrics(departments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const kpiCards = useMemo(() => {
    if (!overallMetrics) return [];
    return [
      {
        title: '平均单证处理时效',
        value: overallMetrics.avgDocumentProcessingTime,
        unit: '小时',
        icon: Clock,
        color: 'primary' as const,
        trend: 'down' as const,
        trendValue: 8.5,
      },
      {
        title: '平均报关通过率',
        value: overallMetrics.avgCustomsPassRate,
        unit: '%',
        icon: CheckCircle,
        color: 'success' as const,
        trend: 'up' as const,
        trendValue: 2.3,
      },
      {
        title: '平均订单执行率',
        value: overallMetrics.avgOrderExecutionRate,
        unit: '%',
        icon: Zap,
        color: 'primary' as const,
        trend: 'up' as const,
        trendValue: 5.1,
      },
      {
        title: '总营收',
        value: overallMetrics.totalRevenue,
        unit: '万元',
        icon: DollarSign,
        color: 'warning' as const,
        trend: 'up' as const,
        trendValue: 12.8,
      },
      {
        title: '成本节约',
        value: overallMetrics.costSaving,
        unit: '万元',
        icon: TrendingUp,
        color: 'success' as const,
        trend: 'up' as const,
        trendValue: 7.2,
      },
      {
        title: '效率提升',
        value: overallMetrics.efficiencyImprovement,
        unit: '%',
        icon: BarChart3,
        color: 'primary' as const,
        trend: 'up' as const,
        trendValue: 15.2,
      },
    ];
  }, [overallMetrics]);

  const barChartData = useMemo(() => {
    return departmentMetrics.map((m) => ({
      department: m.department,
      处理时效: m.documentProcessingTime,
    }));
  }, [departmentMetrics]);

  const lineChartData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: format(date, 'MM-dd'),
        通过率: Number((95 + Math.random() * 5).toFixed(1)),
      });
    }
    return data;
  }, []);

  const pieChartData = useMemo(() => {
    return [
      { name: '已完成', value: 45 },
      { name: '进行中', value: 30 },
      { name: '待处理', value: 15 },
      { name: '已延迟', value: 7 },
      { name: '已取消', value: 3 },
    ];
  }, []);

  const departmentColumns = useMemo<TableColumn<DepartmentMetric>[]>(
    () => [
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 120,
      },
      {
        title: '单证处理时效(小时)',
        dataIndex: 'documentProcessingTime',
        key: 'documentProcessingTime',
        width: 150,
        render: (value) => (
          <span className={cn(
            'font-medium',
            (value as number) > 4 ? 'text-red-600' : 'text-green-600'
          )}>
            {value}
          </span>
        ),
      },
      {
        title: '报关通过率(%)',
        dataIndex: 'customsPassRate',
        key: 'customsPassRate',
        width: 130,
        render: (value) => (
          <span className={cn(
            'font-medium',
            (value as number) < 98 ? 'text-orange-600' : 'text-green-600'
          )}>
            {value}%
          </span>
        ),
      },
      {
        title: '订单执行率(%)',
        dataIndex: 'orderExecutionRate',
        key: 'orderExecutionRate',
        width: 130,
        render: (value) => (
          <span className={cn(
            'font-medium',
            (value as number) < 95 ? 'text-orange-600' : 'text-green-600'
          )}>
            {value}%
          </span>
        ),
      },
      {
        title: '总订单数',
        dataIndex: 'totalOrders',
        key: 'totalOrders',
        width: 100,
      },
      {
        title: '已完成',
        dataIndex: 'completedOrders',
        key: 'completedOrders',
        width: 100,
      },
      {
        title: '延迟订单',
        dataIndex: 'delayedOrders',
        key: 'delayedOrders',
        width: 100,
        render: (value) => (
          <span className={cn(
            'font-medium',
            (value as number) > 0 ? 'text-red-600' : 'text-gray-600'
          )}>
            {value}
          </span>
        ),
      },
    ],
    []
  );

  const handleRefresh = () => {
    loadData();
  };

  const handleExport = () => {
    alert('导出功能开发中...');
  };

  return (
    <PageContainer
      title="绩效看板"
      subTitle="实时监控各部门业务指标与运营数据"
      breadcrumb={[
        { title: '首页', href: '/' },
        { title: '管理层', href: '/management' },
        { title: '绩效看板' },
      ]}
      extra={
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={timeRangeOptions}
            />
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            导出
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((card, index) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={<card.icon className="h-6 w-6" />}
              color={card.color}
              trend={card.trend}
              trendValue={card.trendValue}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="各部门单证处理时效对比" subtitle="按小时统计">
            <Card.Body>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${value} 小时`, '处理时效']}
                    />
                    <Bar dataKey="处理时效" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card title="近30天报关通过率趋势" subtitle="每日通过率变化">
            <Card.Body>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" domain={[90, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${value}%`, '通过率']}
                    />
                    <Line
                      type="monotone"
                      dataKey="通过率"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="订单状态分布" subtitle="各状态订单占比">
            <Card.Body>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card title="各部门KPI详情" subtitle="详细指标数据">
            <Card.Body className="p-0">
              <Table<DepartmentMetric>
                columns={departmentColumns}
                dataSource={departmentMetrics}
                rowKey="department"
                loading={loading}
                pagination={false}
                className="border-0 rounded-none"
              />
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
