import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import {
  FileText,
  Calendar,
  Download,
  Smartphone,
  Mail,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Table from '@/components/Table';
import type { TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import Tabs from '@/components/Tabs';
import type { TabsItem } from '@/components/Tabs';
import { usePerformanceStore } from '@/store';
import type { PerformanceReport, DepartmentMetric } from '@/types';
import { cn } from '@/lib/utils';

const reportTypeOptions = [
  { value: 'daily', label: '日报表' },
  { value: 'weekly', label: '周报表' },
  { value: 'monthly', label: '月报表' },
];

const roleLabels: Record<string, string> = {
  importer: '进口部',
  exporter: '出口部',
  customs: '报关部',
  logistics: '物流部',
  finance: '财务部',
  management: '管理层',
};

interface HistoryReport {
  id: string;
  reportDate: string;
  period: string;
  title: string;
  createdAt: string;
}

export default function PerformanceReports() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);
  const [generated, setGenerated] = useState(false);
  const { getReport } = usePerformanceStore();

  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([
    {
      id: '1',
      reportDate: '2026-06-15',
      period: 'monthly',
      title: '2026年6月绩效报表',
      createdAt: '2026-06-15 09:30:00',
    },
    {
      id: '2',
      reportDate: '2026-06-08',
      period: 'weekly',
      title: '2026年第24周绩效报表',
      createdAt: '2026-06-08 10:15:00',
    },
    {
      id: '3',
      reportDate: '2026-06-01',
      period: 'daily',
      title: '2026年6月1日绩效报表',
      createdAt: '2026-06-01 18:00:00',
    },
  ]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const report = await getReport(reportDate, reportType);
      setCurrentReport(report);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    alert('下载PDF报表功能开发中...');
  };

  const handleSendToMobile = () => {
    alert('推送至手机功能开发中...');
  };

  const handleSendEmail = () => {
    alert('邮件发送功能开发中...');
  };

  const trendChartData = useMemo(() => {
    const periods = reportType === 'daily' ? 7 : reportType === 'weekly' ? 8 : 12;
    const data = [];
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(reportDate);
      if (reportType === 'daily') {
        date.setDate(date.getDate() - i);
        data.push({
          period: format(date, 'MM-dd'),
          单证处理时效: Number((2 + Math.random() * 3).toFixed(1)),
          报关通过率: Number((95 + Math.random() * 5).toFixed(1)),
          订单执行率: Number((92 + Math.random() * 8).toFixed(1)),
        });
      } else if (reportType === 'weekly') {
        date.setDate(date.getDate() - i * 7);
        data.push({
          period: `第${format(date, 'W')}周`,
          单证处理时效: Number((2 + Math.random() * 3).toFixed(1)),
          报关通过率: Number((95 + Math.random() * 5).toFixed(1)),
          订单执行率: Number((92 + Math.random() * 8).toFixed(1)),
        });
      } else {
        date.setMonth(date.getMonth() - i);
        data.push({
          period: format(date, 'yyyy-MM'),
          单证处理时效: Number((2 + Math.random() * 3).toFixed(1)),
          报关通过率: Number((95 + Math.random() * 5).toFixed(1)),
          订单执行率: Number((92 + Math.random() * 8).toFixed(1)),
        });
      }
    }
    return data;
  }, [reportDate, reportType]);

  const departmentColumns = useMemo<TableColumn<DepartmentMetric>[]>(
    () => [
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 120,
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 100,
        render: (value) => roleLabels[value as string] || value,
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
        title: '完成率(%)',
        dataIndex: 'completedOrders',
        key: 'completionRate',
        width: 120,
        render: (_, record) => {
          const rate = record.totalOrders > 0
            ? ((record.completedOrders / record.totalOrders) * 100).toFixed(1)
            : '0';
          return (
            <span className={cn(
              'font-medium',
              Number(rate) < 90 ? 'text-orange-600' : 'text-green-600'
            )}>
              {rate}%
            </span>
          );
        },
      },
    ],
    []
  );

  const historyColumns = useMemo<TableColumn<HistoryReport>[]>(
    () => [
      {
        title: '报表标题',
        dataIndex: 'title',
        key: 'title',
        render: (value, record) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{value}</span>
          </div>
        ),
      },
      {
        title: '报表类型',
        dataIndex: 'period',
        key: 'period',
        width: 100,
        render: (value) => {
          const labels: Record<string, string> = {
            daily: '日报表',
            weekly: '周报表',
            monthly: '月报表',
          };
          return labels[value as string] || value;
        },
      },
      {
        title: '统计日期',
        dataIndex: 'reportDate',
        key: 'reportDate',
        width: 120,
      },
      {
        title: '生成时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
      },
      {
        title: '操作',
        dataIndex: 'id',
        key: 'actions',
        width: 150,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={() => handleDownloadPDF()}
            >
              下载
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Mail className="h-4 w-4" />}
              onClick={() => handleSendEmail()}
            >
              发送
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const reportTabs: TabsItem[] = [
    {
      key: 'comparison',
      label: '部门对比',
      children: (
        <div>
          {currentReport ? (
            <Table<DepartmentMetric>
              columns={departmentColumns}
              dataSource={currentReport.departmentMetrics}
              rowKey="department"
              pagination={false}
              className="border-0 rounded-none"
            />
          ) : (
            <div className="py-12 text-center text-gray-500">
              请先生成报表
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'trend',
      label: '趋势分析',
      children: (
        <div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9CA3AF" domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="单证处理时效"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="报关通过率"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="订单执行率"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
  ];

  const getReportTitle = () => {
    const date = new Date(reportDate);
    switch (reportType) {
      case 'daily':
        return `${format(date, 'yyyy年MM月dd日')}绩效日报表`;
      case 'weekly':
        return `${format(date, 'yyyy年')}第${format(date, 'W')}周绩效周报表`;
      case 'monthly':
        return `${format(date, 'yyyy年MM月')}绩效月报表`;
      default:
        return '绩效报表';
    }
  };

  const getPeriodText = () => {
    const date = new Date(reportDate);
    switch (reportType) {
      case 'daily':
        return format(date, 'yyyy-MM-dd');
      case 'weekly': {
        const start = new Date(date);
        start.setDate(date.getDate() - 6);
        return `${format(start, 'yyyy-MM-dd')} 至 ${format(date, 'yyyy-MM-dd')}`;
      }
      case 'monthly':
        return `${format(date, 'yyyy-MM-01')} 至 ${format(date, 'yyyy-MM-dd')}`;
      default:
        return '';
    }
  };

  return (
    <PageContainer
      title="绩效报表"
      subTitle="生成和查看各周期绩效分析报表"
      breadcrumb={[
        { title: '首页', href: '/' },
        { title: '管理层', href: '/management' },
        { title: '绩效报表' },
      ]}
    >
      <div className="space-y-6">
        <Card title="报表生成" subtitle="选择报表类型和日期生成绩效报表">
          <Card.Body>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <Select
                  label="报表类型"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  options={reportTypeOptions}
                />
              </div>
              <div className="w-48">
                <Input
                  label="日期"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
              <Button
                variant="primary"
                icon={<FileText className="h-4 w-4" />}
                onClick={handleGenerateReport}
                loading={loading}
              >
                生成报表
              </Button>
            </div>
          </Card.Body>
        </Card>

        {generated && currentReport && (
          <Card
            title={
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getReportTitle()}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      生成时间：{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      统计周期：{getPeriodText()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    icon={<Download className="h-4 w-4" />}
                    onClick={handleDownloadPDF}
                  >
                    下载PDF
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Smartphone className="h-4 w-4" />}
                    onClick={handleSendToMobile}
                  >
                    推送至手机
                  </Button>
                  <Button
                    variant="primary"
                    icon={<Mail className="h-4 w-4" />}
                    onClick={handleSendEmail}
                  >
                    邮件发送
                  </Button>
                </div>
              </div>
            }
          >
            <Card.Body className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500">平均单证处理时效</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {currentReport.overallMetrics.avgDocumentProcessingTime} <span className="text-sm font-normal">小时</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">平均报关通过率</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {currentReport.overallMetrics.avgCustomsPassRate}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">平均订单执行率</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600">
                    {currentReport.overallMetrics.avgOrderExecutionRate}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">总营收</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    {(currentReport.overallMetrics.totalRevenue / 10000).toFixed(1)} <span className="text-sm font-normal">万元</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">成本节约</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {(currentReport.overallMetrics.costSaving / 10000).toFixed(1)} <span className="text-sm font-normal">万元</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">效率提升</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-600">
                    {currentReport.overallMetrics.efficiencyImprovement}%
                  </p>
                </div>
              </div>
              <Tabs items={reportTabs} />
            </Card.Body>
          </Card>
        )}

        <Card title="历史报表" subtitle="查看和管理已生成的历史报表">
          <Card.Body className="p-0">
            <Table<HistoryReport>
              columns={historyColumns}
              dataSource={historyReports}
              rowKey="id"
              pagination={false}
              className="border-0 rounded-none"
            />
          </Card.Body>
        </Card>
      </div>
    </PageContainer>
  );
}
