export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'importer' | 'exporter' | 'customs' | 'logistics' | 'finance' | 'management';

export interface User extends BaseEntity {
  username: string;
  email: string;
  role: UserRole;
  companyName: string;
  companyId: string;
  avatar: string;
  phone: string;
}

export type TradeTerm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

export type OrderStatus = 'draft' | 'pending_confirmation' | 'confirmed' | 'documents_uploaded' | 'customs_declared' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';

export interface Order extends BaseEntity {
  orderNo: string;
  importerId: string;
  exporterId: string;
  tradeTerm: TradeTerm;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  originCountry: string;
  destinationCountry: string;
  hsCode: string;
  goodsDescription: string;
  quantity: number;
  unit: string;
  weight: number;
  volume: number;
  tariffRate?: number;
  tariffAmount?: number;
  letterOfCredit?: LetterOfCredit;
  documents: Document[];
  customsDeclaration?: CustomsDeclaration;
  shipment?: Shipment;
  settlement?: Settlement;
}

export type LCStatus = 'draft' | 'pending_exporter_confirm' | 'exporter_confirmed' | 'exporter_rejected' | 'issued' | 'amended' | 'expired';

export interface LetterOfCredit extends BaseEntity {
  orderId: string;
  lcNo: string;
  issuingBank: string;
  advisingBank: string;
  beneficiary: string;
  applicant: string;
  amount: number;
  currency: string;
  expiryDate: string;
  latestShipmentDate: string;
  terms: string;
  status: LCStatus;
  version: number;
}

export type DocumentType = 'bill_of_lading' | 'packing_list' | 'commercial_invoice' | 'certificate_of_origin' | 'insurance_policy' | 'other';

export type DocumentStatus = 'uploaded' | 'verifying' | 'verified' | 'discrepancy_found' | 're_uploaded';

export interface Document extends BaseEntity {
  orderId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  status: DocumentStatus;
  ocrData?: Record<string, any>;
  verificationResult?: VerificationResult;
}

export interface Discrepancy {
  field: string;
  document1: string;
  value1: string;
  document2: string;
  value2: string;
  severity: 'warning' | 'error';
  resolved: boolean;
}

export interface VerificationResult {
  isPassed: boolean;
  checkedAt: string;
  discrepancies: Discrepancy[];
}

export type CustomsStatus = 'draft' | 'pending' | 'license_missing' | 'ready_to_submit' | 'submitted' | 'accepted' | 'rejected' | 'cleared';

export interface RegulatoryCondition {
  code: string;
  name: string;
  description: string;
  isCompliant: boolean;
}

export interface LicenseRequirement {
  licenseType: string;
  licenseName: string;
  isRequired: boolean;
  isProvided: boolean;
  licenseNo?: string;
  expiryDate?: string;
}

export type LicenseStatus = 'active' | 'expiring_soon' | 'expired';

export interface License extends BaseEntity {
  licenseType: string;
  licenseName: string;
  licenseNo: string;
  issueDate: string;
  expiryDate: string;
  status: LicenseStatus;
  holder: string;
  issuingAuthority: string;
  declarationIds: string[];
  fileUrl?: string;
}

export interface CustomsDeclaration extends BaseEntity {
  orderId: string;
  declarationNo: string;
  customsBrokerId: string;
  status: CustomsStatus;
  hsCode: string;
  goodsDescription: string;
  quantity: number;
  declaredValue: number;
  currency: string;
  originCountry: string;
  destinationCountry: string;
  regulatoryConditions: RegulatoryCondition[];
  requiredLicenses: LicenseRequirement[];
  declarationMessage?: string;
}

export type ShipmentStatus = 'pending' | 'container_loaded' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed';

export interface Location {
  name: string;
  country: string;
  portCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShipmentSegment {
  id: string;
  segmentType: 'loading' | 'ocean_freight' | 'transshipment' | 'discharging' | 'inland_transport';
  fromLocation: Location;
  toLocation: Location;
  estimatedDepartureTime: string;
  actualDepartureTime?: string;
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface PlanItem {
  activity: string;
  originalDate: string;
  revisedDate: string;
  responsibleParty: string;
}

export interface SupplyChainPlan {
  originalPlan: PlanItem[];
  revisedPlan: PlanItem[];
  revisedAt: string;
  reason: string;
}

export interface Shipment extends BaseEntity {
  orderId: string;
  logisticsProviderId: string;
  containerNo: string;
  vesselName: string;
  voyageNo: string;
  status: ShipmentStatus;
  segments: ShipmentSegment[];
  currentLocation?: Location;
  isDelayed: boolean;
  delayHours?: number;
  delayReason?: string;
  supplyChainPlan?: SupplyChainPlan;
}

export type SettlementStatus = 'pending' | 'calculated' | 'invoiced' | 'payment_pending' | 'payment_processing' | 'paid' | 'completed';

export interface FinanceItem {
  id: string;
  itemType: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: SettlementStatus;
}

export interface Settlement extends BaseEntity {
  orderId: string;
  accountantId: string;
  status: SettlementStatus;
  receivables: FinanceItem[];
  payables: FinanceItem[];
  totalReceivable: number;
  totalPayable: number;
  netAmount: number;
  currency: string;
  exchangeRate?: number;
  billOfLadingDate?: string;
  settlementDate?: string;
}

export type PaymentApplicationStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export interface PaymentApplication extends BaseEntity {
  settlementId: string;
  applicationNo: string;
  amount: number;
  currency: string;
  payee: string;
  payeeBank: string;
  payeeAccount: string;
  purpose: string;
  status: PaymentApplicationStatus;
  applicationDate: string;
  processingDate?: string;
}

export type ForeignExchangeDeclarationStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface ForeignExchangeDeclaration extends BaseEntity {
  paymentApplicationId: string;
  declarationNo: string;
  declarationDate: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  receiptUrl: string;
  status: ForeignExchangeDeclarationStatus;
}

export interface DepartmentMetric {
  department: string;
  role: UserRole;
  documentProcessingTime: number;
  customsPassRate: number;
  orderExecutionRate: number;
  totalOrders: number;
  completedOrders: number;
  delayedOrders: number;
}

export interface OverallMetric {
  avgDocumentProcessingTime: number;
  avgCustomsPassRate: number;
  avgOrderExecutionRate: number;
  totalRevenue: number;
  costSaving: number;
  efficiencyImprovement: number;
}

export interface PerformanceReport extends BaseEntity {
  reportDate: string;
  period: string;
  departmentMetrics: DepartmentMetric[];
  overallMetrics: OverallMetric;
}

export type NotificationType = 'document_discrepancy' | 'license_missing' | 'shipment_delay' | 'order_status' | 'payment_due' | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  attachmentUrl?: string;
  actionUrl?: string;
}
