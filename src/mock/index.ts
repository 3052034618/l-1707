import {
  mockUsers,
  mockOrders,
  mockLettersOfCredit,
  mockDocuments,
  mockCustomsDeclarations,
  mockShipments,
  mockSettlements,
  mockNotifications,
  mockPerformanceReports
} from './data';
import type {
  User,
  Order,
  LetterOfCredit,
  Document,
  CustomsDeclaration,
  Shipment,
  Settlement,
  Notification,
  PerformanceReport,
  License,
} from '@/types';

type StorageKey =
  | 'users'
  | 'orders'
  | 'lettersOfCredit'
  | 'documents'
  | 'customsDeclarations'
  | 'shipments'
  | 'settlements'
  | 'notifications'
  | 'performanceReports'
  | 'licenses'
  | 'mockInitialized';

type StorageValueMap = {
  users: User[];
  orders: Order[];
  lettersOfCredit: LetterOfCredit[];
  documents: Document[];
  customsDeclarations: CustomsDeclaration[];
  shipments: Shipment[];
  settlements: Settlement[];
  notifications: Notification[];
  performanceReports: PerformanceReport[];
  licenses: License[];
  mockInitialized: boolean;
};

export function initMockData(force: boolean = false): void {
  const isInitialized = getData('mockInitialized');
  
  if (isInitialized && !force) {
    return;
  }

  setData('users', mockUsers);
  setData('orders', mockOrders);
  setData('lettersOfCredit', mockLettersOfCredit);
  setData('documents', mockDocuments);
  setData('customsDeclarations', mockCustomsDeclarations);
  setData('shipments', mockShipments);
  setData('settlements', mockSettlements);
  setData('notifications', mockNotifications);
  setData('performanceReports', mockPerformanceReports);
  setData('mockInitialized', true);
}

export function getData<K extends StorageKey>(key: K): StorageValueMap[K] | null {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as StorageValueMap[K];
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

export function setData<K extends StorageKey>(key: K, value: StorageValueMap[K]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
}

export function clearMockData(): void {
  const keys: StorageKey[] = [
    'users',
    'orders',
    'lettersOfCredit',
    'documents',
    'customsDeclarations',
    'shipments',
    'settlements',
    'notifications',
    'performanceReports',
    'mockInitialized'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
}

export function resetMockData(): void {
  clearMockData();
  initMockData(true);
}
