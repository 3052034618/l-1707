import { useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Plus,
  Calculator,
  FileCheck,
  AlertTriangle,
  Upload,
  FileCheck2,
  Package,
  CreditCard,
  FileText,
  Shield,
  Send,
  Bell,
  Truck,
  MapPin,
  RefreshCw,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  Globe,
  BarChart3,
  Users,
  TrendingUp,
  SendHorizonal,
  FileQuestion,
  Clock,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { StatOverview, StatusBadge, statusConfig } from '@/components/business';
import type { StatItem } from '@/components/business/StatOverview';
import Card from '@/components/Card';
import Table from '@/components/Table';
import type { TableColumn } from '@/components/Table';
import { useAuthStore } from '@/store';
import { useOrderStore } from '@/store';
import { useNotificationStore } from '@/store';
import type { UserRole, Order, Notification, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

type QuickAction = {
  title: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'cyan' | 'amber';
  onClick?: () => void;
};

const quickActionsConfig: Record<UserRole, QuickAction[]> = {
  importer: [
    { title: '创建订单', icon: Plus, color: 'blue' },
    { title: '关税计算', icon: Calculator, color: 'green' },
    { title: '查看信用证', icon: CreditCard, color: 'purple' },
    { title: '异常预警', icon: AlertTriangle, color: 'orange' },
  ],
  exporter: [
    { title: '上传单证', icon: Upload, color: 'blue' },
    { title: '单证校验', icon: FileCheck2, color: 'green' },
    { title: '生成交单包', icon: Package, color: 'purple' },
    { title: '查看信用证', icon: CreditCard, color: 'orange' },
  ],
  customs: [
    { title: '录入报关单', icon: FileText, color: 'blue' },
    { title: '许可证检查', icon: Shield, color: 'green' },
    { title: '生成报文', icon: Send, color: 'purple' },
    { title: '查看预警', icon: Bell, color: 'orange' },
  ],
  logistics: [
    { title: '安排运输', icon: Truck, color: 'blue' },
    { title: '追踪物流', icon: MapPin, color: 'green' },
    { title: '异常处理', icon: AlertTriangle, color: 'purple' },
    { title: '计划重算', icon: RefreshCw, color: 'orange' },
  ],
  finance: [
    { title: '费用结算', icon: DollarSign, color: 'blue' },
    { title: '付汇申请', icon: ArrowRightLeft, color: 'green' },
    { title: '外汇申报', icon: Globe, color: 'purple' },
    { title: '查看报表', icon: BarChart3, color: 'orange' },
  ],
  management: [
    { title: '绩效看板', icon: BarChart3, color: 'blue' },
    { title: '部门对比', icon: Users, color: 'green' },
    { title: '趋势分析', icon: TrendingUp, color: 'purple' },
    { title: '报表推送', icon: SendHorizonal, color: 'orange' },
  ],
};

const statTitleConfig: Record<UserRole, string> = {
  importer: '订单总数',
  exporter: '订单总数',
  customs: '报关单总数',
  logistics: '运输单总数',
  finance: '结算单总数',
  management: '订单总数',
};

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', '#06B6D4', '#F97316'];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

const formatDate = (date: string): string => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const currentDate = useMemo(() => {
    return format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  }, []);

  const stats = useMemo<StatItem[]>(() => {
    if (!user) return [];

    const role = user.role;
    const totalOrders = orders.length;
    const inProgressOrders = orders.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled'
    ).length;
    const pendingNotifications = notifications.filter((n) => !n.isRead && n.userId === user.id).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAmount = orders
      .filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return [
      {
        title: statTitleConfig[role],
        value: totalOrders,
        icon: FileText,
        color: 'blue',
        trend: 'up',
        trendValue: '+12%',
      },
      {
        title: '进行中订单',
        value: inProgressOrders,
        icon: Clock,
        color: 'green',
        trend: 'neutral',
        trendValue: '持平',
      },
      {
        title: '待处理事项',
        value: pendingNotifications,
        icon: FileQuestion,
        color: 'orange',
        trend: pendingNotifications > 0 ? 'up' : 'neutral',
        trendValue: pendingNotifications > 0 ? `+${pendingNotifications}` : '0',
      },
      {
        title: '本月交易额',
        value: formatCurrency(monthlyAmount),
        icon: DollarSign,
        color: 'purple',
        trend: 'up',
        trendValue: '+8.5%',
      },
    ];
  }, [user, orders, notifications]);

  const quickActions = useMemo(() => {
    if (!user) return [];
    return quickActionsConfig[user.role] || [];
  }, [user]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [orders]);

  const recentNotifications = useMemo(() => {
    if (!user) return [];
    return notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [user, notifications]);

  const orderTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'MM-dd');
      const count = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getDate() === date.getDate() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      }).length;
      days.push({ date: dateStr, 订单数: count });
    }
    return days;
  }, [orders]);

  const orderStatusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    orders.forEach((o) => {
      const config = statusConfig[o.status] || { label: o.status };
      const label = config.label;
      statusCount[label] = (statusCount[label] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const orderColumns = useMemo<TableColumn<Order>[]>(
    () => [
      {
        title: '订单编号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 150,
      },
      {
        title: '货物描述',
        dataIndex: 'goodsDescription',
        key: 'goodsDescription',
      },
      {
        title: '金额',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        width: 120,
        render: (value, record) => formatCurrency(value as number, record.currency),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value) => <StatusBadge status={value as OrderStatus} />,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (value) => formatDate(value as string),
      },
    ],
    []
  );

  const iconBgColors: Record<QuickAction['color'], string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  if (!user) {
    return <div className="flex items-center justify-center h-full">请先登录</div>;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <Card.Body className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {getGreeting()}，{user.username}！
                </h1>
                <p className="text-blue-100 text-lg">
                  欢迎回到 {user.companyName}
                </p>
                <div className="flex items-center gap-2 mt-3 text-blue-200">
                  <Calendar className="h-4 w-4" />
                  <span>{currentDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-16 w-16 rounded-full border-4 border-white/30 object-cover"
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        <StatOverview stats={stats} />

        <Card title="快捷操作" subtitle="快速访问常用功能">
          <Card.Body>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={action.onClick}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                      `hover:border-${action.color}-200`
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                        iconBgColors[action.color]
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="最近订单" subtitle="最新5条订单记录">
            <Card.Body className="p-0">
              <Table<Order>
                columns={orderColumns}
                dataSource={recentOrders}
                rowKey="id"
                pagination={false}
                className="border-0 rounded-none"
              />
            </Card.Body>
          </Card>

          <Card
            title="最近通知"
            subtitle={
              unreadCount > 0 ? (
                <span className="text-orange-500">您有 {unreadCount} 条未读消息</span>
              ) : (
                '暂无未读消息'
              )
            }
          >
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-100">
                {recentNotifications.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">暂无通知</div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                        !notification.isRead && 'bg-blue-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex-shrink-0 mt-0.5 h-2 w-2 rounded-full',
                            notification.severity === 'error' && 'bg-red-500',
                            notification.severity === 'warning' && 'bg-yellow-500',
                            notification.severity === 'success' && 'bg-green-500',
                            notification.severity === 'info' && 'bg-blue-500',
                            notification.isRead && 'bg-gray-300'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                'text-sm font-medium truncate',
                                notification.isRead ? 'text-gray-600' : 'text-gray-900'
                              )}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 text-xs text-blue-600 font-medium">新</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="近7天订单趋势" subtitle="订单数量变化">
            <Card.Body>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="订单数" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card title="订单状态分布" subtitle="各状态订单占比">
            <Card.Body>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {orderStatusData.map((entry, index) => (
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
        </div>
      </div>
    </PageContainer>
  );
}
