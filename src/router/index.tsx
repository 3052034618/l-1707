import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import ProtectedRoute from './ProtectedRoute';
import { publicRoutes, protectedRoutes, flattenRoutes } from './routes';
import { useAuthStore } from '@/store';
import { initMockData } from '@/mock';
import { useEffect } from 'react';

initMockData();

export default function AppRouter() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initMockData();
  }, []);

  const renderRoutes = () => {
    const flatProtected = flattenRoutes(protectedRoutes).filter(
      route => route.element
    );

    return (
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {flatProtected.map(route => {
          const roles = route.roles;
          
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                roles ? (
                  <ProtectedRoute requiredRoles={roles}>
                    <route.element />
                  </ProtectedRoute>
                ) : (
                  <route.element />
                )
              }
            />
          );
        })}
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    );
  };

  return (
    <Router>
      <Routes>
        {publicRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.path === '/login' && isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <route.element />
              )
            }
          />
        ))}
        
        {renderRoutes()}
      </Routes>
    </Router>
  );
}
