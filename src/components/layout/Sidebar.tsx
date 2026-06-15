import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Calculator,
  CreditCard,
  FileText,
  FileCheck,
  Package,
  FileSpreadsheet,
  ShieldCheck,
  Truck,
  MapPin,
  BarChart3,
  PieChart,
  DollarSign,
  ArrowLeftRight,
  MessageSquare,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { UserRole, User } from '@/types';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole: UserRole;
  user: User | null;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  roles: UserRole[];
}

const roleMenuConfig: Record<UserRole, Omit<MenuItem, 'roles'>[]> = {
  importer: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'orders', label: '订单管理', icon: <ShoppingCart size={20} />, path: '/orders' },
    { key: 'tariff', label: '关税计算', icon: <Calculator size={20} />, path: '/tariff' },
    { key: 'credit', label: '信用证管理', icon: <CreditCard size={20} />, path: '/credit' },
  ],
  exporter: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'documents', label: '单证管理', icon: <FileText size={20} />, path: '/documents' },
    { key: 'verify', label: '单证校验', icon: <FileCheck size={20} />, path: '/verify' },
    { key: 'epackage', label: '电子交单包', icon: <Package size={20} />, path: '/epackage' },
  ],
  customs: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'declarations', label: '报关单管理', icon: <FileSpreadsheet size={20} />, path: '/declarations' },
    { key: 'licenses', label: '许可证管理', icon: <ShieldCheck size={20} />, path: '/licenses' },
  ],
  logistics: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'shipments', label: '运输管理', icon: <Truck size={20} />, path: '/shipments' },
    { key: 'tracking', label: '物流追踪', icon: <MapPin size={20} />, path: '/tracking' },
    { key: 'supplychain', label: '供应链计划', icon: <BarChart3 size={20} />, path: '/supplychain' },
  ],
  finance: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'settlement', label: '费用结算', icon: <DollarSign size={20} />, path: '/settlement' },
    { key: 'foreignex', label: '付汇管理', icon: <ArrowLeftRight size={20} />, path: '/foreignex' },
  ],
  management: [
    { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'performance', label: '绩效看板', icon: <PieChart size={20} />, path: '/performance' },
    { key: 'reports', label: '绩效报表', icon: <BarChart3 size={20} />, path: '/reports' },
  ],
};

const commonMenuItems: Omit<MenuItem, 'roles'>[] = [
  { key: 'messages', label: '消息中心', icon: <MessageSquare size={20} />, path: '/messages', badge: 5 },
  { key: 'profile', label: '个人中心', icon: <UserIcon size={20} />, path: '/profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, userRole, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const roleMenus = roleMenuConfig[userRole] || [];
  const allMenus = [...roleMenus, ...commonMenuItems];

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
  <aside
    className={cn(
      'flex flex-col bg-white border-r border-neutral-200 transition-all duration-300',
      collapsed ? 'w-20' : 'w-[260px]'
    )}
  >
    <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <Globe className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
          <span className="font-semibold text-neutral-900 whitespace-nowrap">跨境贸易平台</span>
          <span className="text-xs text-neutral-500">TradeHub</span>
        </div>
        )}
      </div>
    </div>

    <nav className="flex-1 overflow-y-auto py-4">
      <div className="px-3 space-y-1">
        {allMenus.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                collapsed && 'justify-center'
              )}
            >
              <Badge count={item.badge} variant="danger">
                <span className="flex-shrink-0">{item.icon}</span>
              </Badge>
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>

    <div className="border-t border-neutral-200 p-3">
      <div className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors',
        collapsed && 'justify-center'
      )}>
        <Avatar src={user?.avatar} name={user?.username} size="sm" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{user?.username}</p>
            <p className="text-xs text-neutral-500 truncate">{user?.companyName}</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className={cn(
          'mt-2 w-full flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors',
          collapsed ? 'rotate-180' : ''
        )}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  </aside>
  );
};

export default Sidebar;
