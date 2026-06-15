import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store';
import Sidebar from './Sidebar';
import Header from './Header';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        userRole={user?.role || 'importer'}
        user={user}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          onLogout={handleLogout}
          notificationCount={unreadCount}
        />

        <main className={cn(
          'flex-1 overflow-auto p-6 transition-all duration-300'
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
