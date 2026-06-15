import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserRole,
  Order,
  OrderStatus,
  LetterOfCredit,
  LCStatus,
  Document,
  DocumentType,
  VerificationResult,
  CustomsDeclaration,
  CustomsStatus,
  RegulatoryCondition,
  License,
  LicenseRequirement,
  Shipment,
  ShipmentStatus,
  SupplyChainPlan,
  Settlement,
  SettlementStatus,
  FinanceItem,
  PaymentApplication,
  ForeignExchangeDeclaration,
  Notification,
  NotificationType,
  PerformanceReport,
  DepartmentMetric,
  OverallMetric,
} from '@/types';
import {
  mockUsers,
  mockOrders,
  mockLettersOfCredit,
  mockDocuments,
  mockCustomsDeclarations,
  mockShipments,
  mockSettlements,
  mockPaymentApplications,
  mockForeignExchangeDeclarations,
  mockNotifications,
  mockPerformanceReports,
} from '@/mock/data';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const delay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => User | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      login: async (username: string, password: string, role: UserRole): Promise<boolean> => {
        set({ loading: true });
        await delay();
        const user = mockUsers.find(
          (u) => u.username === username && u.role === role
        );
        if (user) {
          const token = `token_${Date.now()}`;
          set({ user, token, isAuthenticated: true, loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      },
      logout: (): void => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      getCurrentUser: (): User | null => {
        return get().user;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  getOrders: (params?: { status?: OrderStatus; page?: number; pageSize?: number }) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  createOrder: (data: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  calculateTariff: (
    hsCode: string,
    originCountry: string,
    destinationCountry: string,
    amount: number
  ) => Promise<{
    rate: number;
    amount: number;
    preferentialRate?: number;
    preferentialAmount?: number;
    tradeAgreement?: string;
  }>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      currentOrder: null,
      loading: false,
      getOrders: async (params?: { status?: OrderStatus; page?: number; pageSize?: number }): Promise<void> => {
        set({ loading: true });
        await delay();
        let filteredOrders = [...get().orders];
        if (params?.status) {
          filteredOrders = filteredOrders.filter((o) => o.status === params.status);
        }
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          filteredOrders = filteredOrders.slice(start, end);
        }
        set({ orders: filteredOrders, loading: false });
      },
      getOrderById: async (id: string): Promise<Order | null> => {
        await delay();
        const order = get().orders.find((o) => o.id === id) || null;
        set({ currentOrder: order });
        return order;
      },
      createOrder: async (data: Partial<Order>): Promise<Order> => {
        await delay();
        const now = new Date().toISOString();
        const newOrder: Order = {
          id: generateId('order'),
          orderNo: data.orderNo || `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          importerId: data.importerId || '',
          exporterId: data.exporterId || '',
          tradeTerm: data.tradeTerm || 'FOB',
          status: data.status || 'draft',
          totalAmount: data.totalAmount || 0,
          currency: data.currency || 'USD',
          originCountry: data.originCountry || '',
          destinationCountry: data.destinationCountry || '',
          hsCode: data.hsCode || '',
          goodsDescription: data.goodsDescription || '',
          quantity: data.quantity || 0,
          unit: data.unit || '',
          weight: data.weight || 0,
          volume: data.volume || 0,
          tariffRate: data.tariffRate || 0,
          tariffAmount: data.tariffAmount || 0,
          documents: data.documents || [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          return {
            orders: [...state.orders, newOrder],
            currentOrder: newOrder,
          };
        });
        return newOrder;
      },
      updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
        await delay();
        const now = new Date().toISOString();
        let updatedOrder!: Order;
        set((state) => {
          const updatedOrders = state.orders.map((o) => {
            if (o.id === id) {
              updatedOrder = { ...o, ...data, updatedAt: now };
              return updatedOrder;
            }
            return o;
          });
          return {
            orders: updatedOrders,
            currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
          };
        });
        return updatedOrder;
      },
      deleteOrder: async (id: string): Promise<void> => {
        await delay();
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
          currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
        }));
      },
      calculateTariff: async (
        hsCode: string,
        originCountry: string,
        destinationCountry: string,
        amount: number
      ): Promise<{
        rate: number;
        amount: number;
        preferentialRate?: number;
        preferentialAmount?: number;
        tradeAgreement?: string;
      }> => {
        await delay();
        const tariffRates: Record<string, number> = {
          '84713000': 0,
          '85258013': 0,
          '85423100': 0,
        };
        const preferentialRates: Record<string, { rate: number; agreement: string }> = {
          '84713000': { rate: 0, agreement: '中国-东盟自由贸易协定' },
        };
        const rate = tariffRates[hsCode] || 10;
        const tariffAmount = (amount * rate) / 100;
        const preferential = preferentialRates[hsCode];
        const result: {
          rate: number;
          amount: number;
          preferentialRate?: number;
          preferentialAmount?: number;
          tradeAgreement?: string;
        } = {
          rate,
          amount: tariffAmount,
        };
        if (preferential) {
          result.preferentialRate = preferential.rate;
          result.preferentialAmount = (amount * preferential.rate) / 100;
          result.tradeAgreement = preferential.agreement;
        }
        return result;
      },
    }),
    {
      name: 'order-storage',
    }
  )
);

interface DocumentState {
  documents: Document[];
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  getDocuments: (orderId: string) => Promise<Document[]>;
  getDocumentsByOrderId: (orderId: string) => Document[];
  uploadDocument: (orderId: string, file: File, type: DocumentType, ocrData?: Record<string, any>) => Promise<Document>;
  addDocuments: (orderId: string, docs: Document[]) => void;
  getDocument: (id: string) => Promise<Document | null>;
  verifyDocuments: (orderId: string) => Promise<VerificationResult>;
  resolveDiscrepancy: (documentId: string, field: string, resolution: string) => Promise<void>;
  generateElectronicPackage: (orderId: string) => Promise<{ packageUrl: string; packageName: string }>;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: mockDocuments,
      selectedOrderId: null,
      setSelectedOrderId: (orderId: string | null) => {
        set({ selectedOrderId: orderId });
      },
      getDocuments: async (orderId: string): Promise<Document[]> => {
        await delay();
        const docs = get().documents.filter((d) => d.orderId === orderId);
        return docs;
      },
      getDocumentsByOrderId: (orderId: string): Document[] => {
        return get().documents.filter((d) => d.orderId === orderId);
      },
      uploadDocument: async (orderId: string, file: File, type: DocumentType, ocrData?: Record<string, any>): Promise<Document> => {
        await delay();
        const now = new Date().toISOString();
        const newDocument: Document = {
          id: generateId('doc'),
          orderId,
          documentType: type,
          fileName: file.name,
          fileUrl: `/documents/${generateId('file')}_${file.name}`,
          fileSize: file.size,
          uploadedBy: useAuthStore.getState().user?.id || '',
          status: 'uploaded',
          ocrData,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          documents: [...state.documents, newDocument],
        }));
        return newDocument;
      },
      addDocuments: (orderId: string, docs: Document[]) => {
        set((state) => {
          const filteredDocs = state.documents.filter((d) => d.orderId !== orderId);
          return {
            documents: [...filteredDocs, ...docs],
          };
        });
      },
      getDocument: async (id: string): Promise<Document | null> => {
        await delay();
        return get().documents.find((d) => d.id === id) || null;
      },
      verifyDocuments: async (orderId: string): Promise<VerificationResult> => {
        await delay(1000);
        const now = new Date().toISOString();
        const orderDocs = get().documents.filter((d) => d.orderId === orderId);
        const discrepancies = orderDocs.length > 0 ? [] : [];
        const result: VerificationResult = {
          isPassed: discrepancies.length === 0,
          checkedAt: now,
          discrepancies,
        };
        set((state) => ({
          documents: state.documents.map((d) =>
            d.orderId === orderId
              ? { ...d, status: 'verified', verificationResult: result, updatedAt: now }
              : d
          ),
        }));
        return result;
      },
      resolveDiscrepancy: async (documentId: string, field: string, resolution: string) => {
        await delay();
        const now = new Date().toISOString();
        set((state) => {
          const doc = state.documents.find((d) => d.id === documentId);
          if (!doc?.verificationResult) {
            return state;
          }
          const updatedDiscrepancies = doc.verificationResult.discrepancies.map((d) =>
            d.field === field ? { ...d, resolved: true } : d
          );
          const allResolved = updatedDiscrepancies.every((d) => d.resolved);
          const updatedResult: VerificationResult = {
            ...doc.verificationResult,
            discrepancies: updatedDiscrepancies,
            isPassed: allResolved,
          };
          return {
            documents: state.documents.map((d) =>
              d.id === documentId
                ? {
                    ...d,
                    verificationResult: updatedResult,
                    status: allResolved ? 'verified' : 'discrepancy_found',
                    updatedAt: now,
                  }
                : d
            ),
          };
        });
      },
      generateElectronicPackage: async (orderId: string): Promise<{ packageUrl: string; packageName: string }> => {
        await delay();
        const order = mockOrders.find((o) => o.id === orderId);
        const packageName = `单证包_${order?.orderNo || orderId}.zip`;
        return {
          packageUrl: `/packages/${orderId}/documents.zip`,
          packageName,
        };
      },
    }),
    {
      name: 'document-storage',
    }
  )
);

interface CustomsState {
  declarations: CustomsDeclaration[];
  currentDeclaration: CustomsDeclaration | null;
  licenses: License[];
  loading: boolean;
  getDeclarations: (params?: { status?: CustomsStatus; page?: number; pageSize?: number }) => Promise<void>;
  getDeclaration: (id: string) => Promise<CustomsDeclaration | null>;
  createDeclaration: (orderId: string, data: Partial<CustomsDeclaration>) => Promise<CustomsDeclaration>;
  updateDeclaration: (id: string, data: Partial<CustomsDeclaration>) => Promise<CustomsDeclaration>;
  checkRegulatoryConditions: (hsCode: string, originCountry: string) => Promise<RegulatoryCondition[]>;
  checkLicenseRequirements: (hsCode: string) => Promise<LicenseRequirement[]>;
  generateDeclarationMessage: (id: string) => Promise<{ messageContent: string; messageFormat: string }>;
  getLicenses: () => Promise<License[]>;
  addLicense: (data: Partial<License>) => Promise<License>;
  updateLicense: (id: string, data: Partial<License>) => Promise<License>;
  deleteLicense: (id: string) => Promise<void>;
  associateLicenseToDeclaration: (licenseId: string, declarationId: string) => Promise<License>;
}

const calculateLicenseStatus = (expiryDate: string): License['status'] => {
  const now = Date.now();
  const expiry = new Date(expiryDate).getTime();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
};

const mockLicenses: License[] = [
  {
    id: 'lic_001',
    licenseType: '3C认证',
    licenseName: '中国强制性产品认证证书',
    licenseNo: 'CCC2026010901123456',
    issueDate: '2025-06-15T00:00:00Z',
    expiryDate: '2028-06-30T00:00:00Z',
    status: 'active',
    holder: '华盛进出口贸易有限公司',
    issuingAuthority: '中国认证认可监督管理委员会',
    declarationIds: ['customs_001', 'customs_002'],
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'lic_002',
    licenseType: '入境通关单',
    licenseName: '入境货物通关单',
    licenseNo: 'SH2026061000123456',
    issueDate: '2026-06-10T00:00:00Z',
    expiryDate: '2026-07-10T00:00:00Z',
    status: 'expiring_soon',
    holder: '华盛进出口贸易有限公司',
    issuingAuthority: '上海出入境检验检疫局',
    declarationIds: ['customs_001'],
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
  },
  {
    id: 'lic_003',
    licenseType: '进口许可证',
    licenseName: '两用物项和技术进口许可证',
    licenseNo: 'IMPORT202506001234',
    issueDate: '2025-06-01T00:00:00Z',
    expiryDate: '2026-06-01T00:00:00Z',
    status: 'expired',
    holder: '华盛进出口贸易有限公司',
    issuingAuthority: '商务部',
    declarationIds: [],
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'lic_004',
    licenseType: 'CCC认证',
    licenseName: '车辆强制性认证证书',
    licenseNo: 'CCC2024120901987654',
    issueDate: '2024-12-15T00:00:00Z',
    expiryDate: '2027-12-15T00:00:00Z',
    status: 'active',
    holder: '华盛进出口贸易有限公司',
    issuingAuthority: '中国认证认可监督管理委员会',
    declarationIds: ['customs_003'],
    createdAt: '2024-12-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
  },
];

export const useCustomsStore = create<CustomsState>()(
  persist(
    (set, get) => ({
      declarations: mockCustomsDeclarations,
      currentDeclaration: null,
      licenses: mockLicenses,
      loading: false,
      getDeclarations: async (params?: { status?: CustomsStatus; page?: number; pageSize?: number }): Promise<void> => {
        set({ loading: true });
        await delay();
        let filteredDeclarations = [...get().declarations];
        if (params?.status) {
          filteredDeclarations = filteredDeclarations.filter((d) => d.status === params.status);
        }
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          filteredDeclarations = filteredDeclarations.slice(start, end);
        }
        set({ declarations: filteredDeclarations, loading: false });
      },
      getDeclaration: async (id: string): Promise<CustomsDeclaration | null> => {
        set({ loading: true });
        await delay();
        const declaration = get().declarations.find((d) => d.id === id) || null;
        set({ currentDeclaration: declaration, loading: false });
        return declaration;
      },
      createDeclaration: async (orderId: string, data: Partial<CustomsDeclaration>): Promise<CustomsDeclaration> => {
        set({ loading: true });
        await delay();
        const now = new Date().toISOString();
        const newDeclaration: CustomsDeclaration = {
          id: generateId('customs'),
          orderId,
          declarationNo: data.declarationNo || `CUS-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          customsBrokerId: data.customsBrokerId || useAuthStore.getState().user?.id || '',
          status: data.status || 'draft',
          hsCode: data.hsCode || '',
          goodsDescription: data.goodsDescription || '',
          quantity: data.quantity || 0,
          declaredValue: data.declaredValue || 0,
          currency: data.currency || 'USD',
          originCountry: data.originCountry || '',
          destinationCountry: data.destinationCountry || '',
          regulatoryConditions: data.regulatoryConditions || [],
          requiredLicenses: data.requiredLicenses || [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          declarations: [...state.declarations, newDeclaration],
          currentDeclaration: newDeclaration,
          loading: false,
        }));
        return newDeclaration;
      },
      updateDeclaration: async (id: string, data: Partial<CustomsDeclaration>): Promise<CustomsDeclaration> => {
        set({ loading: true });
        await delay();
        const now = new Date().toISOString();
        let updatedDeclaration!: CustomsDeclaration;
        set((state) => {
          const updatedDeclarations = state.declarations.map((d) => {
            if (d.id === id) {
              updatedDeclaration = { ...d, ...data, updatedAt: now };
              return updatedDeclaration;
            }
            return d;
          });
          return {
            declarations: updatedDeclarations,
            currentDeclaration: state.currentDeclaration?.id === id ? updatedDeclaration : state.currentDeclaration,
            loading: false,
          };
        });
        return updatedDeclaration;
      },
      checkRegulatoryConditions: async (hsCode: string, originCountry: string): Promise<RegulatoryCondition[]> => {
        set({ loading: true });
        await delay();
        const conditions: RegulatoryCondition[] = [
          {
            code: 'A',
            name: '入境货物通关单',
            description: '法定检验检疫货物需提供入境货物通关单',
            isCompliant: true,
          },
          {
            code: 'M',
            name: '进口商品检验',
            description: '列入法检目录的进口商品需实施检验',
            isCompliant: true,
          },
        ];
        set({ loading: false });
        return conditions;
      },
      checkLicenseRequirements: async (hsCode: string): Promise<LicenseRequirement[]> => {
        set({ loading: true });
        await delay();
        const licenses: LicenseRequirement[] = [
          {
            licenseType: '3C认证',
            licenseName: '中国强制性产品认证证书',
            isRequired: hsCode.startsWith('84') || hsCode.startsWith('85'),
            isProvided: true,
            licenseNo: '2026010901123456',
            expiryDate: '2028-06-30T00:00:00Z',
          },
        ];
        set({ loading: false });
        return licenses;
      },
      generateDeclarationMessage: async (id: string): Promise<{ messageContent: string; messageFormat: string }> => {
        set({ loading: true });
        await delay();
        const declaration = get().declarations.find((d) => d.id === id);
        const messageContent = `<?xml version="1.0" encoding="UTF-8"?>
<Declaration>
  <Header>
    <DeclarationNo>${declaration?.declarationNo || ''}</DeclarationNo>
    <DeclarationDate>${new Date().toISOString().split('T')[0]}</DeclarationDate>
  </Header>
  <Body>
    <HSCode>${declaration?.hsCode || ''}</HSCode>
    <GoodsDescription>${declaration?.goodsDescription || ''}</GoodsDescription>
    <Quantity>${declaration?.quantity || 0}</Quantity>
    <DeclaredValue>${declaration?.declaredValue || 0}</DeclaredValue>
    <Currency>${declaration?.currency || ''}</Currency>
  </Body>
</Declaration>`;
        set({ loading: false });
        return {
          messageContent,
          messageFormat: 'XML',
        };
      },
      getLicenses: async (): Promise<License[]> => {
        set({ loading: true });
        await delay();
        const updatedLicenses = get().licenses.map((lic) => ({
          ...lic,
          status: calculateLicenseStatus(lic.expiryDate),
        }));
        set({ licenses: updatedLicenses, loading: false });
        return updatedLicenses;
      },
      addLicense: async (data: Partial<License>): Promise<License> => {
        set({ loading: true });
        await delay();
        const now = new Date().toISOString();
        const newLicense: License = {
          id: generateId('lic'),
          licenseType: data.licenseType || '',
          licenseName: data.licenseName || '',
          licenseNo: data.licenseNo || '',
          issueDate: data.issueDate || now,
          expiryDate: data.expiryDate || now,
          status: 'active',
          holder: data.holder || '',
          issuingAuthority: data.issuingAuthority || '',
          declarationIds: [],
          fileUrl: data.fileUrl,
          createdAt: now,
          updatedAt: now,
        };
        newLicense.status = calculateLicenseStatus(newLicense.expiryDate);
        set((state) => ({
          licenses: [...state.licenses, newLicense],
          loading: false,
        }));
        return newLicense;
      },
      updateLicense: async (id: string, data: Partial<License>): Promise<License> => {
        set({ loading: true });
        await delay();
        const now = new Date().toISOString();
        let updatedLicense!: License;
        set((state) => {
          const updatedLicenses = state.licenses.map((l) => {
            if (l.id === id) {
              updatedLicense = {
                ...l,
                ...data,
                updatedAt: now,
                status: calculateLicenseStatus(data.expiryDate || l.expiryDate),
              };
              return updatedLicense;
            }
            return l;
          });
          return {
            licenses: updatedLicenses,
            loading: false,
          };
        });
        return updatedLicense;
      },
      deleteLicense: async (id: string): Promise<void> => {
        set({ loading: true });
        await delay();
        set((state) => ({
          licenses: state.licenses.filter((l) => l.id !== id),
          loading: false,
        }));
      },
      associateLicenseToDeclaration: async (licenseId: string, declarationId: string): Promise<License> => {
        set({ loading: true });
        await delay();
        const now = new Date().toISOString();
        let updatedLicense!: License;
        
        set((state) => {
          const license = state.licenses.find((l) => l.id === licenseId);
          const declaration = state.declarations.find((d) => d.id === declarationId);
          
          if (!license || !declaration) {
            return { loading: false };
          }
          
          const updatedDeclarationIds = license.declarationIds.includes(declarationId)
            ? license.declarationIds
            : [...license.declarationIds, declarationId];
          
          updatedLicense = {
            ...license,
            declarationIds: updatedDeclarationIds,
            updatedAt: now,
            status: calculateLicenseStatus(license.expiryDate),
          };
          
          const updatedRequiredLicenses = declaration.requiredLicenses.map((req) => {
            if (req.licenseType === license.licenseType && req.isRequired && !req.isProvided) {
              return {
                ...req,
                isProvided: true,
                licenseNo: license.licenseNo,
                expiryDate: license.expiryDate,
              };
            }
            return req;
          });
          
          const allProvided = updatedRequiredLicenses.every(
            (req) => !req.isRequired || req.isProvided
          );
          
          const updatedDeclarations = state.declarations.map((d) => {
            if (d.id === declarationId) {
              return {
                ...d,
                requiredLicenses: updatedRequiredLicenses,
                status: allProvided ? 'ready_to_submit' as CustomsStatus : d.status,
                updatedAt: now,
              };
            }
            return d;
          });
          
          const updatedLicenses = state.licenses.map((l) =>
            l.id === licenseId ? updatedLicense : l
          );
          
          return {
            licenses: updatedLicenses,
            declarations: updatedDeclarations,
            currentDeclaration:
              state.currentDeclaration?.id === declarationId
                ? updatedDeclarations.find((d) => d.id === declarationId) || null
                : state.currentDeclaration,
            loading: false,
          };
        });
        
        return updatedLicense;
      },
    }),
    {
      name: 'customs-storage',
    }
  )
);

interface LogisticsState {
  shipments: Shipment[];
  currentShipment: Shipment | null;
  getShipments: (params?: { status?: ShipmentStatus; page?: number; pageSize?: number }) => Promise<void>;
  getShipment: (id: string) => Promise<Shipment | null>;
  createShipment: (orderId: string, data: Partial<Shipment>) => Promise<Shipment>;
  updateShipment: (id: string, data: Partial<Shipment>) => Promise<Shipment>;
  updateSegmentStatus: (shipmentId: string, segmentId: string, status: string, actualTime?: string) => Promise<Shipment>;
  checkShipmentDelay: (shipmentId: string) => Promise<{ isDelayed: boolean; delayHours: number; reason?: string }>;
  recalculateSupplyChainPlan: (shipmentId: string, delayHours: number) => Promise<SupplyChainPlan>;
}

export const useLogisticsStore = create<LogisticsState>()(
  persist(
    (set, get) => ({
      shipments: mockShipments,
      currentShipment: null,
      getShipments: async (params?: { status?: ShipmentStatus; page?: number; pageSize?: number }): Promise<void> => {
        await delay();
        let filteredShipments = [...get().shipments];
        if (params?.status) {
          filteredShipments = filteredShipments.filter((s) => s.status === params.status);
        }
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          filteredShipments = filteredShipments.slice(start, end);
        }
        set({ shipments: filteredShipments });
      },
      getShipment: async (id: string): Promise<Shipment | null> => {
        await delay();
        const shipment = get().shipments.find((s) => s.id === id) || null;
        set({ currentShipment: shipment });
        return shipment;
      },
      createShipment: async (orderId: string, data: Partial<Shipment>): Promise<Shipment> => {
        await delay();
        const now = new Date().toISOString();
        const newShipment: Shipment = {
          id: generateId('shipment'),
          orderId,
          logisticsProviderId: data.logisticsProviderId || useAuthStore.getState().user?.id || '',
          containerNo: data.containerNo || '',
          vesselName: data.vesselName || '',
          voyageNo: data.voyageNo || '',
          status: data.status || 'pending',
          segments: data.segments || [],
          isDelayed: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          shipments: [...state.shipments, newShipment],
          currentShipment: newShipment,
        }));
        return newShipment;
      },
      updateShipment: async (id: string, data: Partial<Shipment>): Promise<Shipment> => {
        await delay();
        const now = new Date().toISOString();
        let updatedShipment!: Shipment;
        set((state) => {
          const updatedShipments = state.shipments.map((s) => {
            if (s.id === id) {
              updatedShipment = { ...s, ...data, updatedAt: now };
              return updatedShipment;
            }
            return s;
          });
          return {
            shipments: updatedShipments,
            currentShipment: state.currentShipment?.id === id ? updatedShipment : state.currentShipment,
          };
        });
        return updatedShipment;
      },
      updateSegmentStatus: async (shipmentId: string, segmentId: string, status: string, actualTime?: string): Promise<Shipment> => {
        await delay();
        const now = new Date().toISOString();
        let updatedShipment!: Shipment;
        set((state) => {
          const updatedShipments = state.shipments.map((s) => {
            if (s.id === shipmentId) {
              const updatedSegments = s.segments.map((seg) => {
                if (seg.id === segmentId) {
                  const updatedSeg = { ...seg, status: status as any };
                  if (actualTime) {
                    if (status === 'in_progress' || status === 'completed') {
                      if (!seg.actualDepartureTime) {
                        updatedSeg.actualDepartureTime = actualTime;
                      } else {
                        updatedSeg.actualArrivalTime = actualTime;
                      }
                    }
                  }
                  return updatedSeg;
                }
                return seg;
              });
              updatedShipment = { ...s, segments: updatedSegments, updatedAt: now };
              return updatedShipment;
            }
            return s;
          });
          return {
            shipments: updatedShipments,
            currentShipment: state.currentShipment?.id === shipmentId ? updatedShipment : state.currentShipment,
          };
        });
        return updatedShipment;
      },
      checkShipmentDelay: async (shipmentId: string): Promise<{ isDelayed: boolean; delayHours: number; reason?: string }> => {
        await delay();
        const shipment = get().shipments.find((s) => s.id === shipmentId);
        if (!shipment) {
          return { isDelayed: false, delayHours: 0 };
        }
        const now = new Date();
        let maxDelay = 0;
        let delayReason: string | undefined;
        shipment.segments.forEach((seg) => {
          if (seg.status === 'in_progress' && seg.estimatedArrivalTime) {
            const eta = new Date(seg.estimatedArrivalTime);
            const diff = now.getTime() - eta.getTime();
            if (diff > 0) {
              const hours = Math.floor(diff / (1000 * 60 * 60));
              if (hours > maxDelay) {
                maxDelay = hours;
                delayReason = `${seg.segmentType} 运输延迟`;
              }
            }
          }
        });
        return {
          isDelayed: maxDelay > 0,
          delayHours: maxDelay,
          reason: delayReason,
        };
      },
      recalculateSupplyChainPlan: async (shipmentId: string, delayHours: number): Promise<SupplyChainPlan> => {
        await delay();
        const shipment = get().shipments.find((s) => s.id === shipmentId);
        const now = new Date();
        const revisedDate = new Date(now.getTime() + delayHours * 60 * 60 * 1000);
        const plan: SupplyChainPlan = {
          originalPlan: [
            {
              activity: '原计划到港',
              originalDate: shipment?.segments[shipment.segments.length - 1]?.estimatedArrivalTime || now.toISOString(),
              revisedDate: revisedDate.toISOString(),
              responsibleParty: '物流商',
            },
          ],
          revisedPlan: [
            {
              activity: '调整后到港',
              originalDate: shipment?.segments[shipment.segments.length - 1]?.estimatedArrivalTime || now.toISOString(),
              revisedDate: revisedDate.toISOString(),
              responsibleParty: '物流商',
            },
          ],
          revisedAt: now.toISOString(),
          reason: `运输延迟 ${delayHours} 小时`,
        };
        return plan;
      },
    }),
    {
      name: 'logistics-storage',
    }
  )
);

interface FinanceState {
  settlements: Settlement[];
  currentSettlement: Settlement | null;
  paymentApplications: PaymentApplication[];
  foreignExchangeDeclarations: ForeignExchangeDeclaration[];
  getSettlements: (params?: { status?: SettlementStatus; page?: number; pageSize?: number }) => Promise<void>;
  getSettlement: (id: string) => Promise<Settlement | null>;
  calculateReceivablesPayables: (orderId: string) => Promise<{ receivables: FinanceItem[]; payables: FinanceItem[]; totalReceivable: number; totalPayable: number }>;
  generateSettlementList: (orderId: string) => Promise<Settlement>;
  getPaymentApplications: () => Promise<PaymentApplication[]>;
  createPaymentApplication: (settlementId: string, data: Partial<PaymentApplication>) => Promise<PaymentApplication>;
  submitPaymentApplication: (appId: string) => Promise<PaymentApplication>;
  getForeignExchangeDeclarations: () => Promise<ForeignExchangeDeclaration[]>;
  createForeignExchangeDeclaration: (appId: string, data: Partial<ForeignExchangeDeclaration>) => Promise<ForeignExchangeDeclaration>;
  generateForeignExchangeDeclaration: (appId: string) => Promise<ForeignExchangeDeclaration>;
  generateElectronicReceipt: (declId: string) => Promise<{ receiptUrl: string; receiptNo: string }>;
  getExchangeRate: (fromCurrency: string, toCurrency: string) => Promise<{ rate: number; date: string }>;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      settlements: mockSettlements,
      currentSettlement: null,
      paymentApplications: mockPaymentApplications,
      foreignExchangeDeclarations: mockForeignExchangeDeclarations,
      getSettlements: async (params?: { status?: SettlementStatus; page?: number; pageSize?: number }): Promise<void> => {
        await delay();
        let filteredSettlements = [...get().settlements];
        if (params?.status) {
          filteredSettlements = filteredSettlements.filter((s) => s.status === params.status);
        }
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          filteredSettlements = filteredSettlements.slice(start, end);
        }
        set({ settlements: filteredSettlements });
      },
      getSettlement: async (id: string): Promise<Settlement | null> => {
        await delay();
        const settlement = get().settlements.find((s) => s.id === id) || null;
        set({ currentSettlement: settlement });
        return settlement;
      },
      calculateReceivablesPayables: async (orderId: string): Promise<{ receivables: FinanceItem[]; payables: FinanceItem[]; totalReceivable: number; totalPayable: number }> => {
        await delay();
        const order = mockOrders.find((o) => o.id === orderId);
        const receivables: FinanceItem[] = [
          {
            id: generateId('rec'),
            itemType: 'goods_value',
            description: '货物价值',
            amount: order?.totalAmount || 0,
            currency: order?.currency || 'USD',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ];
        const payables: FinanceItem[] = [
          {
            id: generateId('pay'),
            itemType: 'freight_fee',
            description: '国际海运费',
            amount: 3500,
            currency: 'USD',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
          {
            id: generateId('pay'),
            itemType: 'insurance_fee',
            description: '国际运输保险费',
            amount: 625,
            currency: 'USD',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
          {
            id: generateId('pay'),
            itemType: 'import_vat',
            description: '进口增值税',
            amount: (order?.totalAmount || 0) * 0.13,
            currency: 'USD',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        ];
        const totalReceivable = receivables.reduce((sum, item) => sum + item.amount, 0);
        const totalPayable = payables.reduce((sum, item) => sum + item.amount, 0);
        return {
          receivables,
          payables,
          totalReceivable,
          totalPayable,
        };
      },
      generateSettlementList: async (orderId: string): Promise<Settlement> => {
        await delay();
        const now = new Date().toISOString();
        const { receivables, payables, totalReceivable, totalPayable } = await get().calculateReceivablesPayables(orderId);
        const newSettlement: Settlement = {
          id: generateId('settlement'),
          orderId,
          accountantId: useAuthStore.getState().user?.id || '',
          status: 'calculated',
          receivables,
          payables,
          totalReceivable,
          totalPayable,
          netAmount: totalReceivable - totalPayable,
          currency: 'USD',
          billOfLadingDate: now,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          settlements: [...state.settlements, newSettlement],
          currentSettlement: newSettlement,
        }));
        return newSettlement;
      },
      getPaymentApplications: async (): Promise<PaymentApplication[]> => {
        await delay();
        return get().paymentApplications;
      },
      createPaymentApplication: async (settlementId: string, data: Partial<PaymentApplication>): Promise<PaymentApplication> => {
        await delay();
        const now = new Date().toISOString();
        const newApp: PaymentApplication = {
          id: generateId('payment'),
          settlementId,
          applicationNo: data.applicationNo || `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          payee: data.payee || '',
          payeeBank: data.payeeBank || '',
          payeeAccount: data.payeeAccount || '',
          purpose: data.purpose || '',
          status: 'pending',
          applicationDate: now,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          paymentApplications: [...state.paymentApplications, newApp],
        }));
        return newApp;
      },
      submitPaymentApplication: async (appId: string): Promise<PaymentApplication> => {
        await delay();
        const now = new Date().toISOString();
        let updatedApp!: PaymentApplication;
        set((state) => {
          const updatedApps = state.paymentApplications.map((app) => {
            if (app.id === appId) {
              updatedApp = { ...app, status: 'approved', processingDate: now, updatedAt: now };
              return updatedApp;
            }
            return app;
          });
          return { paymentApplications: updatedApps };
        });
        return updatedApp;
      },
      getForeignExchangeDeclarations: async (): Promise<ForeignExchangeDeclaration[]> => {
        await delay();
        return get().foreignExchangeDeclarations;
      },
      createForeignExchangeDeclaration: async (appId: string, data: Partial<ForeignExchangeDeclaration>): Promise<ForeignExchangeDeclaration> => {
        await delay();
        const now = new Date().toISOString();
        const newDecl: ForeignExchangeDeclaration = {
          id: generateId('fx'),
          paymentApplicationId: appId,
          declarationNo: data.declarationNo || `FX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          declarationDate: now,
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          exchangeRate: data.exchangeRate || 7.2568,
          receiptUrl: data.receiptUrl || '',
          status: data.status || 'pending',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          foreignExchangeDeclarations: [...state.foreignExchangeDeclarations, newDecl],
        }));
        return newDecl;
      },
      generateForeignExchangeDeclaration: async (appId: string): Promise<ForeignExchangeDeclaration> => {
        await delay();
        const now = new Date().toISOString();
        const paymentApp = get().paymentApplications.find((p) => p.id === appId);
        const { rate } = await get().getExchangeRate(paymentApp?.currency || 'USD', 'CNY');
        const newDecl: ForeignExchangeDeclaration = {
          id: generateId('fx'),
          paymentApplicationId: appId,
          declarationNo: `FX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          declarationDate: now,
          amount: paymentApp?.amount || 0,
          currency: paymentApp?.currency || 'USD',
          exchangeRate: rate,
          receiptUrl: `/receipts/${appId}.pdf`,
          status: 'submitted',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          foreignExchangeDeclarations: [...state.foreignExchangeDeclarations, newDecl],
        }));
        return newDecl;
      },
      generateElectronicReceipt: async (declId: string): Promise<{ receiptUrl: string; receiptNo: string }> => {
        await delay();
        const declaration = get().foreignExchangeDeclarations.find((d) => d.id === declId);
        const receiptUrl = `/receipts/${declId}.pdf`;
        const receiptNo = declaration?.declarationNo || `REC-${Date.now()}`;
        set((state) => {
          const updatedDecls = state.foreignExchangeDeclarations.map((d) => {
            if (d.id === declId) {
              return { ...d, receiptUrl, updatedAt: new Date().toISOString() };
            }
            return d;
          });
          return { foreignExchangeDeclarations: updatedDecls };
        });
        return { receiptUrl, receiptNo };
      },
      getExchangeRate: async (fromCurrency: string, toCurrency: string): Promise<{ rate: number; date: string }> => {
        await delay();
        const rates: Record<string, number> = {
          'USD-CNY': 7.2568,
          'EUR-CNY': 7.8542,
          'JPY-CNY': 0.0485,
        };
        const key = `${fromCurrency}-${toCurrency}`;
        return {
          rate: rates[key] || 1,
          date: new Date().toISOString().split('T')[0],
        };
      },
    }),
    {
      name: 'finance-storage',
    }
  )
);

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  getNotifications: (params?: { type?: NotificationType; isRead?: boolean; page?: number; pageSize?: number }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<Notification>;
  markAllAsRead: (userId: string) => Promise<boolean>;
  getUnreadCount: (userId: string) => Promise<number>;
  deleteNotification: (id: string) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  pushNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>) => Promise<boolean>;
  sendNotification: (userIds: string[], notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'>) => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter((n) => !n.isRead).length,
      getNotifications: async (params?: { type?: NotificationType; isRead?: boolean; page?: number; pageSize?: number }): Promise<void> => {
        await delay();
        let filteredNotifications = [...get().notifications];
        if (params?.type) {
          filteredNotifications = filteredNotifications.filter((n) => n.type === params.type);
        }
        if (params?.isRead !== undefined) {
          filteredNotifications = filteredNotifications.filter((n) => n.isRead === params.isRead);
        }
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          filteredNotifications = filteredNotifications.slice(start, end);
        }
        set({ notifications: filteredNotifications });
      },
      markAsRead: async (notificationId: string): Promise<Notification> => {
        await delay();
        const now = new Date().toISOString();
        let updatedNotification!: Notification;
        set((state) => {
          const updatedNotifications = state.notifications.map((n) => {
            if (n.id === notificationId) {
              updatedNotification = { ...n, isRead: true, updatedAt: now };
              return updatedNotification;
            }
            return n;
          });
          return {
            notifications: updatedNotifications,
            unreadCount: state.unreadCount - 1,
          };
        });
        return updatedNotification;
      },
      markAllAsRead: async (userId: string): Promise<boolean> => {
        await delay();
        const now = new Date().toISOString();
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.userId === userId ? { ...n, isRead: true, updatedAt: now } : n
          );
          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });
        return true;
      },
      getUnreadCount: async (userId: string): Promise<number> => {
        await delay();
        const count = get().notifications.filter((n) => n.userId === userId && !n.isRead).length;
        set({ unreadCount: count });
        return count;
      },
      deleteNotification: async (id: string): Promise<void> => {
        await delay();
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const updatedNotifications = state.notifications.filter((n) => n.id !== id);
          const unreadDelta = notification && !notification.isRead ? -1 : 0;
          return {
            notifications: updatedNotifications,
            unreadCount: Math.max(0, state.unreadCount + unreadDelta),
          };
        });
      },
      deleteNotifications: async (ids: string[]): Promise<void> => {
        await delay();
        set((state) => {
          const idSet = new Set(ids);
          const deletedUnread = state.notifications.filter(
            (n) => idSet.has(n.id) && !n.isRead
          ).length;
          const updatedNotifications = state.notifications.filter((n) => !idSet.has(n.id));
          return {
            notifications: updatedNotifications,
            unreadCount: Math.max(0, state.unreadCount - deletedUnread),
          };
        });
      },
      pushNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>): Promise<boolean> => {
        await delay();
        const now = new Date().toISOString();
        const newNotification: Notification = {
          id: generateId('notif'),
          isRead: false,
          createdAt: now,
          updatedAt: now,
          ...notification,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
        return true;
      },
      sendNotification: async (
        userIds: string[],
        notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isRead'>
      ): Promise<boolean> => {
        await delay();
        const now = new Date().toISOString();
        const newNotifications: Notification[] = userIds.map((userId) => ({
          id: generateId('notif'),
          userId,
          isRead: false,
          createdAt: now,
          updatedAt: now,
          ...notification,
        }));
        set((state) => ({
          notifications: [...newNotifications, ...state.notifications],
          unreadCount: state.unreadCount + newNotifications.length,
        }));
        return true;
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);

interface PerformanceState {
  currentReport: PerformanceReport | null;
  getReport: (date: string, period: 'daily' | 'weekly' | 'monthly') => Promise<PerformanceReport>;
  getDepartmentMetrics: (department: string, startDate: string, endDate: string) => Promise<DepartmentMetric[]>;
  getOverallMetrics: (startDate: string, endDate: string) => Promise<OverallMetric>;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      currentReport: mockPerformanceReports[0] || null,
      getReport: async (date: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceReport> => {
        await delay();
        const report: PerformanceReport = mockPerformanceReports[0] || {
          id: generateId('report'),
          reportDate: date,
          period,
          departmentMetrics: [],
          overallMetrics: {
            avgDocumentProcessingTime: 0,
            avgCustomsPassRate: 0,
            avgOrderExecutionRate: 0,
            totalRevenue: 0,
            costSaving: 0,
            efficiencyImprovement: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ currentReport: report });
        return report;
      },
      getDepartmentMetrics: async (department: string, startDate: string, endDate: string): Promise<DepartmentMetric[]> => {
        await delay();
        const metrics: DepartmentMetric[] = [
          {
            department: '进口部',
            role: 'importer',
            documentProcessingTime: 4.5,
            customsPassRate: 98.5,
            orderExecutionRate: 96.2,
            totalOrders: 12,
            completedOrders: 10,
            delayedOrders: 1,
          },
          {
            department: '出口部',
            role: 'exporter',
            documentProcessingTime: 3.8,
            customsPassRate: 99.1,
            orderExecutionRate: 97.5,
            totalOrders: 8,
            completedOrders: 7,
            delayedOrders: 0,
          },
        ];
        return metrics.filter((m) => (department ? m.department === department : true));
      },
      getOverallMetrics: async (startDate: string, endDate: string): Promise<OverallMetric> => {
        await delay();
        return {
          avgDocumentProcessingTime: 2.93,
          avgCustomsPassRate: 99.07,
          avgOrderExecutionRate: 97.03,
          totalRevenue: 470000,
          costSaving: 23500,
          efficiencyImprovement: 15.2,
        };
      },
    }),
    {
      name: 'performance-storage',
    }
  )
);

interface LetterOfCreditState {
  lettersOfCredit: LetterOfCredit[];
  currentLC: LetterOfCredit | null;
  loading: boolean;
  getLCByOrderId: (orderId: string) => Promise<LetterOfCredit | null>;
  generateDraft: (orderId: string) => Promise<LetterOfCredit>;
  sendForConfirmation: (lcId: string) => Promise<LetterOfCredit>;
  confirmLC: (lcId: string) => Promise<LetterOfCredit>;
  rejectLC: (lcId: string, reason: string) => Promise<LetterOfCredit>;
}

export const useLetterOfCreditStore = create<LetterOfCreditState>()(
  persist(
    (set, get) => ({
      lettersOfCredit: mockLettersOfCredit,
      currentLC: null,
      loading: false,
      getLCByOrderId: async (orderId: string): Promise<LetterOfCredit | null> => {
        await delay();
        const lc = get().lettersOfCredit.find((lc) => lc.orderId === orderId) || null;
        set({ currentLC: lc });
        return lc;
      },
      generateDraft: async (orderId: string): Promise<LetterOfCredit> => {
        set({ loading: true });
        await delay();
        const orderStore = useOrderStore.getState();
        const order = orderStore.orders.find((o) => o.id === orderId);
        if (!order) {
          set({ loading: false });
          throw new Error('订单不存在');
        }

        const existingLC = get().lettersOfCredit.find((lc) => lc.orderId === orderId);
        if (existingLC) {
          set({ loading: false, currentLC: existingLC });
          return existingLC;
        }

        const now = new Date().toISOString();
        const newLC: LetterOfCredit = {
          id: generateId('lc'),
          orderId,
          lcNo: `LC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          issuingBank: '中国工商银行上海分行',
          advisingBank: '国际银行海外分行',
          beneficiary: order.exporterId,
          applicant: order.importerId,
          amount: order.totalAmount,
          currency: order.currency,
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          latestShipmentDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          terms: `${order.tradeTerm} 目的港，凭全套清洁已装船提单议付，发票注明信用证号`,
          status: 'draft',
          version: 1,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          lettersOfCredit: [...state.lettersOfCredit, newLC],
          currentLC: newLC,
          loading: false,
        }));

        useOrderStore.setState({
          orders: orderStore.orders.map((o) =>
            o.id === orderId ? { ...o, letterOfCredit: newLC, updatedAt: now } : o
          ),
          currentOrder: orderStore.currentOrder?.id === orderId
            ? { ...orderStore.currentOrder, letterOfCredit: newLC }
            : orderStore.currentOrder,
        });

        return newLC;
      },
      sendForConfirmation: async (lcId: string): Promise<LetterOfCredit> => {
        set({ loading: true });
        await delay();
        let updatedLC!: LetterOfCredit;
        const now = new Date().toISOString();
        set((state) => {
          const updatedLCs = state.lettersOfCredit.map((lc) => {
            if (lc.id === lcId) {
              updatedLC = { ...lc, status: 'pending_exporter_confirm' as LCStatus, updatedAt: now };
              return updatedLC;
            }
            return lc;
          });
          return {
            lettersOfCredit: updatedLCs,
            currentLC: state.currentLC?.id === lcId ? updatedLC : state.currentLC,
            loading: false,
          };
        });

        const orderStore = useOrderStore.getState();
        useOrderStore.setState({
          orders: orderStore.orders.map((o) =>
            o.id === updatedLC.orderId ? { ...o, letterOfCredit: updatedLC, updatedAt: now } : o
          ),
          currentOrder: orderStore.currentOrder?.id === updatedLC.orderId
            ? { ...orderStore.currentOrder, letterOfCredit: updatedLC }
            : orderStore.currentOrder,
        });

        return updatedLC;
      },
      confirmLC: async (lcId: string): Promise<LetterOfCredit> => {
        set({ loading: true });
        await delay();
        let updatedLC!: LetterOfCredit;
        const now = new Date().toISOString();
        set((state) => {
          const updatedLCs = state.lettersOfCredit.map((lc) => {
            if (lc.id === lcId) {
              updatedLC = { ...lc, status: 'exporter_confirmed' as LCStatus, updatedAt: now };
              return updatedLC;
            }
            return lc;
          });
          return {
            lettersOfCredit: updatedLCs,
            currentLC: state.currentLC?.id === lcId ? updatedLC : state.currentLC,
            loading: false,
          };
        });

        const orderStore = useOrderStore.getState();
        useOrderStore.setState({
          orders: orderStore.orders.map((o) =>
            o.id === updatedLC.orderId ? { ...o, letterOfCredit: updatedLC, updatedAt: now } : o
          ),
          currentOrder: orderStore.currentOrder?.id === updatedLC.orderId
            ? { ...orderStore.currentOrder, letterOfCredit: updatedLC }
            : orderStore.currentOrder,
        });

        return updatedLC;
      },
      rejectLC: async (lcId: string, reason: string): Promise<LetterOfCredit> => {
        set({ loading: true });
        await delay();
        let updatedLC!: LetterOfCredit;
        const now = new Date().toISOString();
        set((state) => {
          const updatedLCs = state.lettersOfCredit.map((lc) => {
            if (lc.id === lcId) {
              updatedLC = {
                ...lc,
                status: 'exporter_rejected' as LCStatus,
                terms: lc.terms + `\n\n驳回原因: ${reason}`,
                updatedAt: now,
              };
              return updatedLC;
            }
            return lc;
          });
          return {
            lettersOfCredit: updatedLCs,
            currentLC: state.currentLC?.id === lcId ? updatedLC : state.currentLC,
            loading: false,
          };
        });

        const orderStore = useOrderStore.getState();
        useOrderStore.setState({
          orders: orderStore.orders.map((o) =>
            o.id === updatedLC.orderId ? { ...o, letterOfCredit: updatedLC, updatedAt: now } : o
          ),
          currentOrder: orderStore.currentOrder?.id === updatedLC.orderId
            ? { ...orderStore.currentOrder, letterOfCredit: updatedLC }
            : orderStore.currentOrder,
        });

        return updatedLC;
      },
    }),
    {
      name: 'lc-storage',
    }
  )
);
