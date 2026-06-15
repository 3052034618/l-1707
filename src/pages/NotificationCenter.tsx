import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Bell,
  Settings,
  CheckCheck,
  Search,
  AlertTriangle,
  FileWarning,
  Clock,
  Truck,
  CreditCard,
  MonitorCog,
  Check,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Input from '@/components/Input';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { useNotificationStore, useAuthStore } from '@/store';
import type { Notification, NotificationType, NotificationSeverity } from '@/types';
import { cn } from '@/lib/utils';

type CategoryKey = 'all' | 'document_discrepancy' | 'license_missing' | 'shipment_delay' | 'todo' | 'order_status' | 'payment_due' | 'system';

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

interface Category {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
  color: string;
  types?: NotificationType[];
}

const categories: Category[] = [
  { key: 'all', label: '全部消息', icon: Bell, color: 'text-gray-600' },
  {
    key: 'document_discrepancy',
    label: '单证不符',
    icon: FileWarning,
    color: 'text-red-500',
    types: ['document_discrepancy'],
  },
  {
    key: 'license_missing',
    label: '许可证缺失',
    icon: AlertTriangle,
    color: 'text-red-500',
    types: ['license_missing'],
  },
  {
    key: 'shipment_delay',
    label: '船期延误',
    icon: Truck,
    color: 'text-red-500',
    types: ['shipment_delay'],
  },
  {
    key: 'todo',
    label: '待办事项',
    icon: Clock,
    color: 'text-orange-500',
    types: ['order_status', 'payment_due'],
  },
  {
    key: 'system',
    label: '系统通知',
    icon: Settings,
    color: 'text-blue-500',
    types: ['system'],
  },
];

const timeFilters: { key: TimeFilter; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部时间' },
];

const typeIcons: Record<NotificationType, React.ElementType> = {
  document_discrepancy: FileWarning,
  license_missing: AlertTriangle,
  shipment_delay: Truck,
  order_status: Bell,
  payment_due: CreditCard,
  system: MonitorCog,
};

const severityColors: Record<NotificationSeverity, { border: string; bg: string; icon: string; dot: string }> = {
  error: {
    border: 'border-l-red-500 hover:border-l-red-600',
    bg: 'hover:bg-red-50/50',
    icon: 'text-red-500 bg-red-100',
    dot: 'bg-red-500',
  },
  warning: {
    border: 'border-l-orange-500 hover:border-l-orange-600',
    bg: 'hover:bg-orange-50/50',
    icon: 'text-orange-500 bg-orange-100',
    dot: 'bg-orange-500',
  },
  info: {
    border: 'border-l-blue-500 hover:border-l-blue-600',
    bg: 'hover:bg-blue-50/50',
    icon: 'text-blue-500 bg-blue-100',
    dot: 'bg-blue-500',
  },
  success: {
    border: 'border-l-green-500 hover:border-l-green-600',
    bg: 'hover:bg-green-50/50',
    icon: 'text-green-500 bg-green-100',
    dot: 'bg-green-500',
  },
};

const severityIconMap: Record<NotificationSeverity, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const formatDate = (date: string): string => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm');
};

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(date);
};

const isInTimeRange = (date: string, filter: TimeFilter): boolean => {
  const target = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (filter) {
    case 'today':
      return target >= today;
    case 'yesterday':
      return target >= yesterday && target < today;
    case 'week':
      return target >= weekStart;
    case 'month':
      return target >= monthStart;
    default:
      return true;
  }
};

export default function NotificationCenter() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0);
  const [showActions, setShowActions] = useState<string | null>(null);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => n.userId === user.id);
  }, [user, notifications]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.isRead).length;
  }, [userNotifications]);

  const categoryUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat.key === 'all') {
        counts[cat.key] = unreadCount;
      } else if (cat.types) {
        counts[cat.key] = userNotifications.filter(
          (n) => !n.isRead && cat.types!.includes(n.type)
        ).length;
      } else {
        counts[cat.key] = 0;
      }
    });
    return counts;
  }, [userNotifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    let filtered = [...userNotifications];

    if (selectedCategory !== 'all') {
      const category = categories.find((c) => c.key === selectedCategory);
      if (category?.types) {
        filtered = filtered.filter((n) => category.types!.includes(n.type));
      }
    }

    if (timeFilter !== 'all') {
      filtered = filtered.filter((n) => isInTimeRange(n.createdAt, timeFilter));
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [userNotifications, selectedCategory, timeFilter, searchText]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredNotifications.slice(start, end);
  }, [filteredNotifications, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedNotifications.map((n) => n.id)));
    }
  }, [selectedIds.size, paginatedNotifications]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
    },
    [markAsRead]
  );

  const handleBatchMarkAsRead = useCallback(async () => {
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (user) {
      await markAllAsRead(user.id);
    }
  }, [user, markAllAsRead]);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete notification:', id);
  }, []);

  const handleBatchDelete = useCallback(() => {
    console.log('Batch delete notifications:', selectedIds);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const openDetail = useCallback(
    (notification: Notification) => {
      const index = filteredNotifications.findIndex((n) => n.id === notification.id);
      setCurrentDetailIndex(index);
      setDetailModalOpen(true);
      if (!notification.isRead) {
        handleMarkAsRead(notification.id);
      }
    },
    [filteredNotifications, handleMarkAsRead]
  );

  const navigateDetail = useCallback(
    (direction: 'prev' | 'next') => {
      const newIndex =
        direction === 'prev' ? currentDetailIndex - 1 : currentDetailIndex + 1;
      if (newIndex >= 0 && newIndex < filteredNotifications.length) {
        setCurrentDetailIndex(newIndex);
        const notification = filteredNotifications[newIndex];
        if (!notification.isRead) {
          handleMarkAsRead(notification.id);
        }
      }
    },
    [currentDetailIndex, filteredNotifications, handleMarkAsRead]
  );

  const currentDetail = filteredNotifications[currentDetailIndex];

  const handleViewDetail = useCallback(
    (notification: Notification) => {
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        setDetailModalOpen(false);
      }
    },
    [navigate]
  );

  const handleDownload = useCallback((notification: Notification) => {
    if (notification.attachmentUrl) {
      window.open(notification.attachmentUrl, '_blank');
    }
  }, []);

  return (
    <PageContainer
      title="消息中心"
      subTitle={
        unreadCount > 0 ? (
          <span className="text-orange-500">您有 {unreadCount} 条未读消息</span>
        ) : (
          '暂无未读消息'
        )
      }
      extra={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={handleMarkAllAsRead}
          >
            全部已读
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings className="h-4 w-4" />}
          >
            设置
          </Button>
          <Badge count={unreadCount} variant="danger" />
        </div>
      }
    >
      <div className="flex h-full gap-6">
        <div className="w-[280px] flex-shrink-0">
          <Card className="h-full">
            <Card.Body className="p-4">
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.key;
                  const isWarning =
                    category.types?.some(
                      (t) =>
                        t === 'document_discrepancy' ||
                        t === 'license_missing' ||
                        t === 'shipment_delay'
                    ) || false;

                  return (
                    <button
                      key={category.key}
                      onClick={() => {
                        setSelectedCategory(category.key);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isActive ? 'text-blue-500' : category.color
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isWarning && !isActive && 'text-red-600'
                          )}
                        >
                          {category.label}
                        </span>
                      </div>
                      {categoryUnreadCounts[category.key] > 0 && (
                        <span
                          className={cn(
                            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
                            isActive
                              ? 'bg-blue-500 text-white'
                              : isWarning
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                          )}
                        >
                          {categoryUnreadCounts[category.key]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h4 className="mb-3 text-sm font-medium text-gray-500">时间筛选</h4>
                <div className="flex flex-wrap gap-2">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setTimeFilter(filter.key);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        timeFilter === filter.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Input
                placeholder="搜索消息标题或内容..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search className="h-4 w-4" />}
                className="max-w-md"
              />
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    已选择 {selectedIds.size} 条
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Check className="h-4 w-4" />}
                    onClick={handleBatchMarkAsRead}
                  >
                    标记已读
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={handleBatchDelete}
                  >
                    删除
                  </Button>
                </div>
              )}
            </div>
          </div>

          {paginatedNotifications.length > 0 && (
            <div className="mb-3 flex items-center gap-2 px-2">
              <button
                onClick={handleSelectAll}
                className="text-gray-500 hover:text-gray-700"
              >
                {selectedIds.size === paginatedNotifications.length ? (
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span className="text-xs text-gray-500">全选当前页</span>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto">
            {paginatedNotifications.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500">
                <Bell className="mb-4 h-16 w-16 text-gray-300" />
                <p className="text-lg font-medium">暂无消息</p>
                <p className="mt-1 text-sm text-gray-400">
                  当前筛选条件下没有找到消息
                </p>
              </div>
            ) : (
              paginatedNotifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type];
                const SeverityIcon = severityIconMap[notification.severity];
                const severity = severityColors[notification.severity];
                const isSelected = selectedIds.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'group relative border-l-4 border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md',
                      severity.border,
                      severity.bg,
                      !notification.isRead && 'bg-blue-50/30'
                    )}
                    onMouseEnter={() => setShowActions(notification.id)}
                    onMouseLeave={() => setShowActions(null)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(notification.id);
                        }}
                        className="mt-1 text-gray-400 hover:text-blue-500"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Square className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>

                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                          severity.icon
                        )}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {!notification.isRead && (
                              <span
                                className={cn(
                                  'h-2 w-2 flex-shrink-0 rounded-full',
                                  severity.dot
                                )}
                              />
                            )}
                            <h4
                              className={cn(
                                'truncate text-base',
                                notification.isRead
                                  ? 'font-normal text-gray-600'
                                  : 'font-semibold text-gray-900'
                              )}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <SeverityIcon
                                className={cn(
                                  'h-4 w-4',
                                  notification.severity === 'error' && 'text-red-500',
                                  notification.severity === 'warning' &&
                                    'text-orange-500',
                                  notification.severity === 'info' && 'text-blue-500',
                                  notification.severity === 'success' &&
                                    'text-green-500'
                                )}
                              />
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>

                        <p
                          className={cn(
                            'mt-1 line-clamp-2 text-sm',
                            notification.isRead ? 'text-gray-500' : 'text-gray-700'
                          )}
                        >
                          {notification.message}
                        </p>

                        <div
                          className={cn(
                            'mt-3 flex items-center gap-2 transition-opacity duration-200',
                            showActions === notification.id || selectedIds.size > 0
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        >
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Check className="h-4 w-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              标记已读
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(notification);
                            }}
                          >
                            查看详情
                          </Button>
                          {notification.attachmentUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Download className="h-4 w-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(notification);
                              }}
                            >
                              下载凭证
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredNotifications.length > pageSize && (
            <div className="mt-4 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredNotifications.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        width={680}
        footer={null}
        title={
          currentDetail && (
            <div className="flex items-center gap-3">
              {currentDetail && (
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    severityColors[currentDetail.severity].icon
                  )}
                >
                  {currentDetail && (
                    React.createElement(typeIcons[currentDetail.type], {
                      className: 'h-4 w-4',
                    })
                  )}
                </div>
              )}
              <span className="text-lg font-semibold">
                {currentDetail?.title}
              </span>
            </div>
          )
        }
      >
        {currentDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  发送时间：{formatDate(currentDetail.createdAt)}
                </span>
                <Badge
                  variant={
                    currentDetail.severity === 'error'
                      ? 'danger'
                      : currentDetail.severity === 'warning'
                        ? 'warning'
                        : currentDetail.severity === 'success'
                          ? 'success'
                          : 'info'
                  }
                  dot
                >
                  {currentDetail.severity === 'error'
                    ? '严重'
                    : currentDetail.severity === 'warning'
                      ? '警告'
                      : currentDetail.severity === 'success'
                        ? '成功'
                        : '信息'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateDetail('prev')}
                  disabled={currentDetailIndex === 0}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                    currentDetailIndex === 0
                      ? 'cursor-not-allowed text-gray-300'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="mx-2 text-xs text-gray-400">
                  {currentDetailIndex + 1} / {filteredNotifications.length}
                </span>
                <button
                  onClick={() => navigateDetail('next')}
                  disabled={currentDetailIndex === filteredNotifications.length - 1}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                    currentDetailIndex === filteredNotifications.length - 1
                      ? 'cursor-not-allowed text-gray-300'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-700 leading-relaxed">
                {currentDetail.message}
              </p>
            </div>

            {currentDetail.attachmentUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Download className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">相关凭证</p>
                  <p className="text-xs text-gray-500">点击下载附件</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => handleDownload(currentDetail)}
                >
                  下载
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                icon={<X className="h-4 w-4" />}
                onClick={() => setDetailModalOpen(false)}
              >
                关闭
              </Button>
              {currentDetail.actionUrl && (
                <Button
                  variant="primary"
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => handleViewDetail(currentDetail)}
                >
                  查看详情
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
