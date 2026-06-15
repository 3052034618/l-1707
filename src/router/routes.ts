import type { UserRole } from '@/types';
import type { ComponentType } from 'react';

export interface RouteConfig {
  path: string;
  element?: ComponentType;
  title: string;
  icon?: string;
  roles?: UserRole[];
  children?: RouteConfig[];
  hidden?: boolean;
}

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NotificationCenter from '@/pages/NotificationCenter';

import {
  OrderList,
  OrderNew,
  OrderDetail,
  TariffCalculator,
} from '@/pages/importer';

import {
  DocumentList,
  DocumentUpload,
  DocumentVerify,
  DocumentPackage,
} from '@/pages/exporter';

import {
  DeclarationList,
  DeclarationNew,
  DeclarationDetail,
  LicenseManagement,
} from '@/pages/customs';

import {
  ShipmentList,
  ShipmentNew,
  ShipmentTrack,
  SupplyChainPlan,
} from '@/pages/logistics';

import {
  SettlementList,
  SettlementDetail,
  PaymentApplication,
  ForeignExchange,
} from '@/pages/finance';

import {
  PerformanceDashboard,
  PerformanceReports,
  Profile,
} from '@/pages/management';

export const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: Login,
    title: '登录',
    hidden: true,
  },
];

export const protectedRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    element: Dashboard,
    title: '工作台',
    icon: 'LayoutDashboard',
    roles: ['importer', 'exporter', 'customs', 'logistics', 'finance', 'management'],
  },
  {
    path: '/importer',
    title: '进口商工作台',
    icon: 'ShoppingCart',
    roles: ['importer'],
    children: [
      {
        path: '/importer/orders',
        element: OrderList,
        title: '订单管理',
        icon: 'FileText',
      },
      {
        path: '/importer/orders/new',
        element: OrderNew,
        title: '创建订单',
        icon: 'PlusCircle',
        hidden: true,
      },
      {
        path: '/importer/orders/:id',
        element: OrderDetail,
        title: '订单详情',
        icon: 'FileSearch',
        hidden: true,
      },
      {
        path: '/importer/tariff',
        element: TariffCalculator,
        title: '关税计算器',
        icon: 'Calculator',
      },
    ],
  },
  {
    path: '/exporter',
    title: '出口商工作台',
    icon: 'Package',
    roles: ['exporter'],
    children: [
      {
        path: '/exporter/documents',
        element: DocumentList,
        title: '单证管理',
        icon: 'Files',
      },
      {
        path: '/exporter/documents/upload',
        element: DocumentUpload,
        title: '上传单证',
        icon: 'Upload',
        hidden: true,
      },
      {
        path: '/exporter/documents/:id/verify',
        element: DocumentVerify,
        title: '单证校验',
        icon: 'CheckCircle2',
        hidden: true,
      },
      {
        path: '/exporter/documents/:id/package',
        element: DocumentPackage,
        title: '电子交单包',
        icon: 'Archive',
        hidden: true,
      },
    ],
  },
  {
    path: '/customs',
    title: '报关行工作台',
    icon: 'FileCheck',
    roles: ['customs'],
    children: [
      {
        path: '/customs/declarations',
        element: DeclarationList,
        title: '报关单管理',
        icon: 'FileText',
      },
      {
        path: '/customs/declarations/new',
        element: DeclarationNew,
        title: '录入报关单',
        icon: 'FilePlus',
        hidden: true,
      },
      {
        path: '/customs/declarations/:id',
        element: DeclarationDetail,
        title: '报关单详情',
        icon: 'FileSearch',
        hidden: true,
      },
      {
        path: '/customs/licenses',
        element: LicenseManagement,
        title: '许可证管理',
        icon: 'ShieldCheck',
      },
    ],
  },
  {
    path: '/logistics',
    title: '物流商工作台',
    icon: 'Truck',
    roles: ['logistics'],
    children: [
      {
        path: '/logistics/shipments',
        element: ShipmentList,
        title: '运输管理',
        icon: 'Ship',
      },
      {
        path: '/logistics/shipments/new',
        element: ShipmentNew,
        title: '新增运输',
        icon: 'PlusCircle',
        hidden: true,
      },
      {
        path: '/logistics/shipments/:id/track',
        element: ShipmentTrack,
        title: '物流追踪',
        icon: 'MapPin',
        hidden: true,
      },
      {
        path: '/logistics/shipments/:id/plan',
        element: SupplyChainPlan,
        title: '供应链计划',
        icon: 'CalendarClock',
        hidden: true,
      },
    ],
  },
  {
    path: '/finance',
    title: '财务工作台',
    icon: 'Wallet',
    roles: ['finance'],
    children: [
      {
        path: '/finance/settlements',
        element: SettlementList,
        title: '费用结算',
        icon: 'Receipt',
      },
      {
        path: '/finance/settlements/:id',
        element: SettlementDetail,
        title: '结算详情',
        icon: 'FileSearch',
        hidden: true,
      },
      {
        path: '/finance/payment',
        element: PaymentApplication,
        title: '付汇管理',
        icon: 'Send',
      },
      {
        path: '/finance/exchange',
        element: ForeignExchange,
        title: '外汇申报',
        icon: 'DollarSign',
      },
    ],
  },
  {
    path: '/management',
    title: '管理层',
    icon: 'BarChart3',
    roles: ['management'],
    children: [
      {
        path: '/management/dashboard',
        element: PerformanceDashboard,
        title: '绩效看板',
        icon: 'LayoutDashboard',
      },
      {
        path: '/management/reports',
        element: PerformanceReports,
        title: '绩效报表',
        icon: 'FileBarChart',
      },
    ],
  },
  {
    path: '/notifications',
    element: NotificationCenter,
    title: '消息中心',
    icon: 'Bell',
    roles: ['importer', 'exporter', 'customs', 'logistics', 'finance', 'management'],
  },
  {
    path: '/profile',
    element: Profile,
    title: '个人中心',
    icon: 'User',
    roles: ['importer', 'exporter', 'customs', 'logistics', 'finance', 'management'],
    hidden: true,
  },
];

export const flattenRoutes = (routes: RouteConfig[]): RouteConfig[] => {
  return routes.reduce<RouteConfig[]>((acc, route) => {
    if (route.children) {
      return [...acc, route, ...flattenRoutes(route.children)];
    }
    return [...acc, route];
  }, []);
};

export const getAllRoutes = (): RouteConfig[] => {
  return [...publicRoutes, ...flattenRoutes(protectedRoutes)];
};

export const getRoutesByRole = (role: UserRole): RouteConfig[] => {
  return protectedRoutes
    .filter(route => !route.roles || route.roles.includes(role))
    .map(route => ({
      ...route,
      children: route.children?.filter(
        child => !child.roles || child.roles.includes(role)
      ),
    }));
};
