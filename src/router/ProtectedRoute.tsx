import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';
import { flattenRoutes, protectedRoutes } from './routes';
import Loading from '@/components/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    const allRoutes = flattenRoutes(protectedRoutes);
    const userRoutes = allRoutes.filter(
      route => !route.roles || route.roles.includes(user.role)
    );
    
    if (userRoutes.length > 0) {
      const firstRoute = userRoutes.find(r => r.element && !r.hidden);
      if (firstRoute) {
        return <Navigate to={firstRoute.path} replace />;
      }
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
