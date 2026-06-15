import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/types';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';
import Breadcrumb from '@/components/Breadcrumb';
import type { BreadcrumbItem } from '@/components/Breadcrumb';

export interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  notificationCount: number;
}

const roleLabels: Record<UserRole, string> = {
  importer: '进口商',
  exporter: '出口商',
  customs: '报关行',
  logistics: '物流商',
  finance: '财务',
  management: '管理层',
};

const pathBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: '首页' }, { title: '工作台' }],
  '/orders': [{ title: '首页' }, { title: '订单管理' }],
  '/tariff': [{ title: '首页' }, { title: '关税计算' }],
  '/credit': [{ title: '首页' }, { title: '信用证管理' }],
  '/documents': [{ title: '首页' }, { title: '单证管理' }],
  '/verify': [{ title: '首页' }, { title: '单证校验' }],
  '/epackage': [{ title: '首页' }, { title: '电子交单包' }],
  '/declarations': [{ title: '首页' }, { title: '报关单管理' }],
  '/licenses': [{ title: '首页' }, { title: '许可证管理' }],
  '/shipments': [{ title: '首页' }, { title: '运输管理' }],
  '/tracking': [{ title: '首页' }, { title: '物流追踪' }],
  '/supplychain': [{ title: '首页' }, { title: '供应链计划' }],
  '/settlement': [{ title: '首页' }, { title: '费用结算' }],
  '/foreignex': [{ title: '首页' }, { title: '付汇管理' }],
  '/performance': [{ title: '首页' }, { title: '绩效看板' }],
  '/reports': [{ title: '首页' }, { title: '绩效报表' }],
  '/messages': [{ title: '首页' }, { title: '消息中心' }],
  '/profile': [{ title: '首页' }, { title: '个人中心' }],
};

const Header: React.FC<HeaderProps> = ({ user, onLogout, notificationCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = pathBreadcrumbMap[location.pathname] || [{ title: '首页' }];

  const availableRoles: UserRole[] = user?.role
    ? [user.role]
    : ['importer', 'exporter', 'customs', 'logistics', 'finance', 'management'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
    setUserMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setUserMenuOpen(false);
  };

  const handleRoleSwitch = (role: UserRole) => {
    console.log('Switching role to:', role);
    setRoleMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleNotificationClick = () => {
    navigate('/messages');
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      <div className="flex items-center">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
          />
        </form>

        <button
          onClick={handleNotificationClick}
          className="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Badge count={notificationCount} variant="danger">
            <Bell className="w-5 h-5" />
          </Badge>
        </button>

        <div ref={roleMenuRef} className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <span className="text-neutral-600">{user ? roleLabels[user.role] : '选择角色'}</span>
            <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', roleMenuOpen && 'rotate-180')} />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 transition-colors',
                    user?.role === role ? 'text-blue-600 bg-blue-50' : 'text-neutral-700'
                  )}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Avatar src={user?.avatar} name={user?.username} size="sm" />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-neutral-900">{user?.username}</span>
              <span className="text-xs text-neutral-500">{user ? roleLabels[user.role] : ''}</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-sm font-medium text-neutral-900">{user?.username}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                个人中心
              </button>
              <button
                onClick={() => {}}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                设置
              </button>
              <div className="border-t border-neutral-100 pt-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
