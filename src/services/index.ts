import { getData, setData } from '@/mock';
import type {
  User,
  UserRole,
  Order,
  OrderStatus,
  LetterOfCredit,
  Document,
  DocumentType,
  VerificationResult,
  Discrepancy,
  CustomsDeclaration,
  CustomsStatus,
  RegulatoryCondition,
  LicenseRequirement,
  Shipment,
  ShipmentStatus,
  Location,
  SupplyChainPlan,
  PlanItem,
  Settlement,
  SettlementStatus,
  FinanceItem,
  PaymentApplication,
  ForeignExchangeDeclaration,
  PerformanceReport,
  DepartmentMetric,
  OverallMetric,
  Notification,
  NotificationType,
} from '@/types';

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const now = () => new Date().toISOString();

const getCurrentUserId = (): string | null => {
  return localStorage.getItem('currentUserId');
};

const setCurrentUserId = (userId: string) => {
  localStorage.setItem('currentUserId', userId);
};

const clearCurrentUserId = () => {
  localStorage.removeItem('currentUserId');
};

export const AuthService = {
  async login(username: string, password: string, role: UserRole): Promise<{ user: User; token: string }> {
    await delay();
    const users = getData('users') || [];
    const user = users.find((u) => u.username === username && u.role === role);
    if (!user) {
      throw new Error('用户名或密码错误，或角色不匹配');
    }
    const token = `token_${generateId('auth')}`;
    setCurrentUserId(user.id);
    return { user, token };
  },

  async logout(): Promise<void> {
    await delay();
    clearCurrentUserId();
  },

  async getCurrentUser(): Promise<User> {
    await delay();
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('未登录');
    }
    const users = getData('users') || [];
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  },
};

export const OrderService = {
  async getOrders(params?: { status?: OrderStatus; page?: number; pageSize?: number }): Promise<{ data: Order[]; total: number }> {
    await delay();
    let orders = getData('orders') || [];
    if (params?.status) {
      orders = orders.filter((o) => o.status === params.status);
    }
    const total = orders.length;
    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      orders = orders.slice(start, end);
    }
    return { data: orders, total };
  },

  async getOrderById(id: string): Promise<Order> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('订单不存在');
    }
    return order;
  },

  async createOrder(data: Partial<Order>): Promise<Order> {
    await delay();
    const orders = getData('orders') || [];
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
      unit: data.unit || '件',
      weight: data.weight || 0,
      volume: data.volume || 0,
      tariffRate: data.tariffRate,
      tariffAmount: data.tariffAmount,
      documents: [],
      createdAt: now(),
      updatedAt: now(),
    };
    orders.push(newOrder);
    setData('orders', orders);
    return newOrder;
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    await delay();
    const orders = getData('orders') || [];
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error('订单不存在');
    }
    orders[index] = { ...orders[index], ...data, updatedAt: now() };
    setData('orders', orders);
    return orders[index];
  },

  async deleteOrder(id: string): Promise<void> {
    await delay();
    const orders = getData('orders') || [];
    const filtered = orders.filter((o) => o.id !== id);
    setData('orders', filtered);
  },

  async calculateTariff(
    hsCode: string,
    originCountry: string,
    destinationCountry: string,
    amount: number
  ): Promise<{ rate: number; amount: number; preferentialRate?: number; preferentialAmount?: number; tradeAgreement?: string }> {
    await delay();

    const tariffDatabase: Record<string, { rate: number; preferentialRate?: number; tradeAgreement?: string }> = {
      '84713000': { rate: 0, preferentialRate: 0, tradeAgreement: 'WTO最惠国待遇' },
      '85258013': { rate: 0, preferentialRate: 0, tradeAgreement: 'WTO最惠国待遇' },
      '85423100': { rate: 0, preferentialRate: 0, tradeAgreement: 'WTO最惠国待遇' },
      '84151021': { rate: 10, preferentialRate: 5, tradeAgreement: '中澳自贸协定' },
      '87032341': { rate: 15, preferentialRate: 0, tradeAgreement: '无' },
    };

    const defaultRate = ((hsCode.charCodeAt(0) + hsCode.charCodeAt(1)) % 20) + 1;
    const tariffInfo = tariffDatabase[hsCode] || { rate: defaultRate };

    const rate = tariffInfo.rate;
    const tariffAmount = amount * rate / 100;

    const result: { rate: number; amount: number; preferentialRate?: number; preferentialAmount?: number; tradeAgreement?: string } = {
      rate,
      amount: Number(tariffAmount.toFixed(2)),
    };

    if (tariffInfo.preferentialRate !== undefined && tariffInfo.tradeAgreement) {
      const preferentialCountries = ['澳大利亚', '新西兰', '韩国', '东盟'];
      const isPreferential = preferentialCountries.some((c) => originCountry.includes(c) || destinationCountry.includes(c));
      if (isPreferential) {
        result.preferentialRate = tariffInfo.preferentialRate;
        result.preferentialAmount = Number((amount * tariffInfo.preferentialRate / 100).toFixed(2));
        result.tradeAgreement = tariffInfo.tradeAgreement;
      }
    }

    return result;
  },
};

export const LetterOfCreditService = {
  async generateDraft(orderId: string): Promise<LetterOfCredit> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const lcs = getData('lettersOfCredit') || [];
    const existingLC = lcs.find((lc) => lc.orderId === orderId);
    if (existingLC) {
      return existingLC;
    }

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
      createdAt: now(),
      updatedAt: now(),
    };

    lcs.push(newLC);
    setData('lettersOfCredit', lcs);

    order.letterOfCredit = newLC;
    setData('orders', orders);

    return newLC;
  },

  async sendForConfirmation(lcId: string): Promise<LetterOfCredit> {
    await delay();
    const lcs = getData('lettersOfCredit') || [];
    const index = lcs.findIndex((lc) => lc.id === lcId);
    if (index === -1) {
      throw new Error('信用证不存在');
    }
    lcs[index] = { ...lcs[index], status: 'pending_exporter_confirm', updatedAt: now() };
    setData('lettersOfCredit', lcs);
    return lcs[index];
  },

  async confirmLC(lcId: string): Promise<LetterOfCredit> {
    await delay();
    const lcs = getData('lettersOfCredit') || [];
    const index = lcs.findIndex((lc) => lc.id === lcId);
    if (index === -1) {
      throw new Error('信用证不存在');
    }
    lcs[index] = { ...lcs[index], status: 'exporter_confirmed', updatedAt: now() };
    setData('lettersOfCredit', lcs);

    const orders = getData('orders') || [];
    const orderIndex = orders.findIndex((o) => o.id === lcs[index].orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].letterOfCredit = lcs[index];
      setData('orders', orders);
    }

    return lcs[index];
  },

  async rejectLC(lcId: string, reason: string): Promise<LetterOfCredit> {
    await delay();
    const lcs = getData('lettersOfCredit') || [];
    const index = lcs.findIndex((lc) => lc.id === lcId);
    if (index === -1) {
      throw new Error('信用证不存在');
    }
    lcs[index] = {
      ...lcs[index],
      status: 'exporter_rejected',
      terms: lcs[index].terms + `\n\n驳回原因: ${reason}`,
      updatedAt: now(),
    };
    setData('lettersOfCredit', lcs);
    return lcs[index];
  },

  async getLCByOrderId(orderId: string): Promise<LetterOfCredit> {
    await delay();
    const lcs = getData('lettersOfCredit') || [];
    const lc = lcs.find((lc) => lc.orderId === orderId);
    if (!lc) {
      throw new Error('信用证不存在');
    }
    return lc;
  },
};

export const DocumentService = {
  async getDocuments(orderId: string): Promise<Document[]> {
    await delay();
    const documents = getData('documents') || [];
    return documents.filter((d) => d.orderId === orderId);
  },

  async uploadDocument(orderId: string, file: File, type: DocumentType): Promise<Document> {
    await delay();
    const documents = getData('documents') || [];
    const users = getData('users') || [];
    const currentUserId = getCurrentUserId();

    const newDocument: Document = {
      id: generateId('doc'),
      orderId,
      documentType: type,
      fileName: file.name,
      fileUrl: `/documents/${generateId('file')}/${file.name}`,
      fileSize: file.size,
      uploadedBy: currentUserId || users[0]?.id || '',
      status: 'uploaded',
      createdAt: now(),
      updatedAt: now(),
    };

    documents.push(newDocument);
    setData('documents', documents);

    const orders = getData('orders') || [];
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex !== -1) {
      const orderDocs = [...orders[orderIndex].documents, newDocument];
      orders[orderIndex] = { ...orders[orderIndex], documents: orderDocs, updatedAt: now() };
      setData('orders', orders);
    }

    return newDocument;
  },

  async getDocument(id: string): Promise<Document> {
    await delay();
    const documents = getData('documents') || [];
    const doc = documents.find((d) => d.id === id);
    if (!doc) {
      throw new Error('单证不存在');
    }
    return doc;
  },

  async verifyDocuments(orderId: string): Promise<VerificationResult> {
    await delay();
    const documents = getData('documents') || [];
    const orderDocs = documents.filter((d) => d.orderId === orderId);

    if (orderDocs.length < 3) {
      return {
        isPassed: false,
        checkedAt: now(),
        discrepancies: [{
          field: 'document_count',
          document1: 'system',
          value1: String(orderDocs.length),
          document2: 'requirement',
          value2: '至少3份',
          severity: 'error',
          resolved: false,
        }],
      };
    }

    const discrepancies: Discrepancy[] = [];
    const bl = orderDocs.find((d) => d.documentType === 'bill_of_lading');
    const pl = orderDocs.find((d) => d.documentType === 'packing_list');
    const inv = orderDocs.find((d) => d.documentType === 'commercial_invoice');

    if (bl && pl) {
      if (bl.ocrData?.grossWeight && pl.ocrData?.totalGrossWeight) {
        const blWeight = parseFloat(bl.ocrData.grossWeight);
        const plWeight = parseFloat(pl.ocrData.totalGrossWeight);
        if (Math.abs(blWeight - plWeight) > 0.01) {
          discrepancies.push({
            field: 'grossWeight',
            document1: '提单',
            value1: bl.ocrData.grossWeight,
            document2: '箱单',
            value2: pl.ocrData.totalGrossWeight,
            severity: 'error',
            resolved: false,
          });
        }
      }
      if (bl.ocrData?.measurement && pl.ocrData?.totalMeasurement) {
        const blVol = parseFloat(bl.ocrData.measurement);
        const plVol = parseFloat(pl.ocrData.totalMeasurement);
        if (Math.abs(blVol - plVol) > 0.01) {
          discrepancies.push({
            field: 'measurement',
            document1: '提单',
            value1: bl.ocrData.measurement,
            document2: '箱单',
            value2: pl.ocrData.totalMeasurement,
            severity: 'warning',
            resolved: false,
          });
        }
      }
    }

    if (pl && inv) {
      if (pl.ocrData?.invoiceNo && inv.ocrData?.invoiceNo && pl.ocrData.invoiceNo !== inv.ocrData.invoiceNo) {
        discrepancies.push({
          field: 'invoiceNo',
          document1: '箱单',
          value1: pl.ocrData.invoiceNo,
          document2: '发票',
          value2: inv.ocrData.invoiceNo,
          severity: 'error',
          resolved: false,
        });
      }
    }

    if (bl && inv) {
      if (bl.ocrData?.shipper && inv.ocrData?.seller && bl.ocrData.shipper !== inv.ocrData.seller) {
        discrepancies.push({
          field: 'shipper/seller',
          document1: '提单',
          value1: bl.ocrData.shipper,
          document2: '发票',
          value2: inv.ocrData.seller,
          severity: 'warning',
          resolved: false,
        });
      }
    }

    const result: VerificationResult = {
      isPassed: discrepancies.length === 0,
      checkedAt: now(),
      discrepancies,
    };

    orderDocs.forEach((doc) => {
      const docIndex = documents.findIndex((d) => d.id === doc.id);
      if (docIndex !== -1) {
        documents[docIndex] = {
          ...documents[docIndex],
          status: discrepancies.length > 0 ? 'discrepancy_found' : 'verified',
          verificationResult: result,
          updatedAt: now(),
        };
      }
    });
    setData('documents', documents);

    const orders = getData('orders') || [];
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        documents: documents.filter((d) => d.orderId === orderId),
        status: result.isPassed ? 'documents_uploaded' : orders[orderIndex].status,
        updatedAt: now(),
      };
      setData('orders', orders);
    }

    return result;
  },

  async resolveDiscrepancy(documentId: string, discrepancyId: string, resolution: string): Promise<Document> {
    await delay();
    const documents = getData('documents') || [];
    const docIndex = documents.findIndex((d) => d.id === documentId);
    if (docIndex === -1) {
      throw new Error('单证不存在');
    }

    const doc = documents[docIndex];
    if (doc.verificationResult) {
      const discIndex = doc.verificationResult.discrepancies.findIndex(
        (_d, i) => i === Number(discrepancyId) || doc.verificationResult!.discrepancies[i].field === discrepancyId
      );
      if (discIndex !== -1) {
        doc.verificationResult.discrepancies[discIndex].resolved = true;
        const unresolved = doc.verificationResult.discrepancies.filter((d) => !d.resolved);
        doc.verificationResult.isPassed = unresolved.length === 0;
      }
    }

    documents[docIndex] = {
      ...doc,
      status: doc.verificationResult?.isPassed ? 'verified' : 're_uploaded',
      updatedAt: now(),
    };
    setData('documents', documents);

    return documents[docIndex];
  },

  async generateElectronicPackage(orderId: string): Promise<{ packageUrl: string; packageName: string }> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const packageName = `电子单证包_${order.orderNo}_${new Date().toISOString().slice(0, 10)}.zip`;
    const packageUrl = `/api/electronic-package/${orderId}/${packageName}`;

    return { packageUrl, packageName };
  },
};

export const CustomsService = {
  async getDeclarations(params?: { status?: CustomsStatus; page?: number; pageSize?: number }): Promise<{ data: CustomsDeclaration[]; total: number }> {
    await delay();
    let declarations = getData('customsDeclarations') || [];
    if (params?.status) {
      declarations = declarations.filter((d) => d.status === params.status);
    }
    const total = declarations.length;
    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      declarations = declarations.slice(start, end);
    }
    return { data: declarations, total };
  },

  async getDeclaration(id: string): Promise<CustomsDeclaration> {
    await delay();
    const declarations = getData('customsDeclarations') || [];
    const declaration = declarations.find((d) => d.id === id);
    if (!declaration) {
      throw new Error('报关单不存在');
    }
    return declaration;
  },

  async createDeclaration(orderId: string, data: Partial<CustomsDeclaration>): Promise<CustomsDeclaration> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const declarations = getData('customsDeclarations') || [];
    const users = getData('users') || [];
    const currentUserId = getCurrentUserId();

    const regConditions = await this.checkRegulatoryConditions(order.hsCode, order.originCountry);
    const licenseReqs = await this.checkLicenseRequirements(order.hsCode);

    const newDeclaration: CustomsDeclaration = {
      id: generateId('customs'),
      orderId,
      declarationNo: `CUS-${new Date().getFullYear()}-SH-${String(Date.now()).slice(-7)}`,
      customsBrokerId: currentUserId || users.find((u) => u.role === 'customs')?.id || '',
      status: data.status || 'draft',
      hsCode: data.hsCode || order.hsCode,
      goodsDescription: data.goodsDescription || order.goodsDescription,
      quantity: data.quantity !== undefined ? data.quantity : order.quantity,
      declaredValue: data.declaredValue !== undefined ? data.declaredValue : order.totalAmount,
      currency: data.currency || order.currency,
      originCountry: data.originCountry || order.originCountry,
      destinationCountry: data.destinationCountry || order.destinationCountry,
      regulatoryConditions: regConditions,
      requiredLicenses: licenseReqs,
      createdAt: now(),
      updatedAt: now(),
    };

    declarations.push(newDeclaration);
    setData('customsDeclarations', declarations);

    order.customsDeclaration = newDeclaration;
    setData('orders', orders);

    return newDeclaration;
  },

  async updateDeclaration(id: string, data: Partial<CustomsDeclaration>): Promise<CustomsDeclaration> {
    await delay();
    const declarations = getData('customsDeclarations') || [];
    const index = declarations.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('报关单不存在');
    }
    declarations[index] = { ...declarations[index], ...data, updatedAt: now() };
    setData('customsDeclarations', declarations);

    const orders = getData('orders') || [];
    const orderIndex = orders.findIndex((o) => o.id === declarations[index].orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].customsDeclaration = declarations[index];
      setData('orders', orders);
    }

    return declarations[index];
  },

  async checkRegulatoryConditions(hsCode: string, originCountry: string): Promise<RegulatoryCondition[]> {
    await delay();

    const conditions: RegulatoryCondition[] = [];
    const codePrefix = hsCode.slice(0, 4);

    if (['8471', '8525', '8517', '8528'].includes(codePrefix)) {
      conditions.push({
        code: 'A',
        name: '入境货物通关单',
        description: '法定检验检疫货物需提供入境货物通关单',
        isCompliant: true,
      });
      conditions.push({
        code: 'M',
        name: '进口商品检验',
        description: '列入法检目录的进口商品需实施检验',
        isCompliant: true,
      });
    }

    if (['8471', '8525', '8517'].includes(codePrefix)) {
      conditions.push({
        code: '3C',
        name: '强制性产品认证',
        description: '涉及安全、环保的产品需提供3C认证证书',
        isCompliant: true,
      });
    }

    if (['8542', '8541'].includes(codePrefix)) {
      conditions.push({
        code: 'L',
        name: '进口许可证',
        description: '重点旧机电产品进口需提供进口许可证',
        isCompliant: true,
      });
    }

    if (['8703', '8704'].includes(codePrefix)) {
      conditions.push({
        code: 'CCC',
        name: '车辆强制性认证',
        description: '机动车辆需提供CCC认证证书',
        isCompliant: true,
      });
    }

    if (originCountry === '美国' || originCountry === '欧盟') {
      conditions.push({
        code: 'V',
        name: '原产地区别管理',
        description: '需提供符合要求的原产地证书',
        isCompliant: true,
      });
    }

    if (conditions.length === 0) {
      conditions.push({
        code: 'R',
        name: '常规监管',
        description: '无特殊监管要求，按一般流程办理',
        isCompliant: true,
      });
    }

    return conditions;
  },

  async checkLicenseRequirements(hsCode: string): Promise<LicenseRequirement[]> {
    await delay();

    const requirements: LicenseRequirement[] = [];
    const codePrefix = hsCode.slice(0, 4);

    if (['8471', '8525', '8517'].includes(codePrefix)) {
      requirements.push({
        licenseType: '3C认证',
        licenseName: '中国强制性产品认证证书',
        isRequired: true,
        isProvided: true,
        licenseNo: `CCC${Date.now().toString().slice(-10)}`,
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (['8471', '8525', '8517', '8528'].includes(codePrefix)) {
      requirements.push({
        licenseType: '入境通关单',
        licenseName: '入境货物通关单',
        isRequired: true,
        isProvided: true,
        licenseNo: `SH${Date.now().toString().slice(-10)}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (['8542', '8541'].includes(codePrefix)) {
      requirements.push({
        licenseType: '进口许可证',
        licenseName: '两用物项和技术进口许可证',
        isRequired: false,
        isProvided: false,
      });
    }

    return requirements;
  },

  async generateDeclarationMessage(id: string): Promise<{ messageContent: string; messageFormat: string }> {
    await delay();
    const declarations = getData('customsDeclarations') || [];
    const declaration = declarations.find((d) => d.id === id);
    if (!declaration) {
      throw new Error('报关单不存在');
    }

    const messageContent = `<?xml version="1.0" encoding="UTF-8"?>
<Declaration>
  <Header>
    <MessageId>${generateId('msg')}</MessageId>
    <MessageType>CUSTOMS_DECLARATION</MessageType>
    <Sender>${declaration.customsBrokerId}</Sender>
    <Receiver>SHANGHAI_CUSTOMS</Receiver>
    <SendTime>${now()}</SendTime>
  </Header>
  <Body>
    <DeclarationNo>${declaration.declarationNo}</DeclarationNo>
    <OrderId>${declaration.orderId}</OrderId>
    <HSCode>${declaration.hsCode}</HSCode>
    <GoodsDescription><![CDATA[${declaration.goodsDescription}]]></GoodsDescription>
    <Quantity>${declaration.quantity}</Quantity>
    <DeclaredValue currency="${declaration.currency}">${declaration.declaredValue}</DeclaredValue>
    <OriginCountry>${declaration.originCountry}</OriginCountry>
    <DestinationCountry>${declaration.destinationCountry}</DestinationCountry>
  </Body>
</Declaration>`;

    return { messageContent, messageFormat: 'XML' };
  },
};

export const LogisticsService = {
  async getShipments(params?: { status?: ShipmentStatus; page?: number; pageSize?: number }): Promise<{ data: Shipment[]; total: number }> {
    await delay();
    let shipments = getData('shipments') || [];
    if (params?.status) {
      shipments = shipments.filter((s) => s.status === params.status);
    }
    const total = shipments.length;
    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      shipments = shipments.slice(start, end);
    }
    return { data: shipments, total };
  },

  async getShipment(id: string): Promise<Shipment> {
    await delay();
    const shipments = getData('shipments') || [];
    const shipment = shipments.find((s) => s.id === id);
    if (!shipment) {
      throw new Error('货运单不存在');
    }
    return shipment;
  },

  async createShipment(orderId: string, data: Partial<Shipment>): Promise<Shipment> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const shipments = getData('shipments') || [];
    const users = getData('users') || [];
    const currentUserId = getCurrentUserId();

    const defaultSegments: Shipment['segments'] = [
      {
        id: generateId('seg'),
        segmentType: 'loading',
        fromLocation: { name: '发货港', country: order.originCountry },
        toLocation: { name: '发货港', country: order.originCountry },
        estimatedDepartureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedArrivalTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: generateId('seg'),
        segmentType: 'ocean_freight',
        fromLocation: { name: '发货港', country: order.originCountry },
        toLocation: { name: '目的港', country: order.destinationCountry },
        estimatedDepartureTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedArrivalTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: generateId('seg'),
        segmentType: 'discharging',
        fromLocation: { name: '目的港', country: order.destinationCountry },
        toLocation: { name: '目的港', country: order.destinationCountry },
        estimatedDepartureTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedArrivalTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
    ];

    const newShipment: Shipment = {
      id: generateId('shipment'),
      orderId,
      logisticsProviderId: currentUserId || users.find((u) => u.role === 'logistics')?.id || '',
      containerNo: data.containerNo || `MSKU${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
      vesselName: data.vesselName || '中远之星',
      voyageNo: data.voyageNo || `V${String(Date.now()).slice(-4)}W`,
      status: data.status || 'pending',
      segments: data.segments || defaultSegments,
      isDelayed: false,
      createdAt: now(),
      updatedAt: now(),
    };

    shipments.push(newShipment);
    setData('shipments', shipments);

    order.shipment = newShipment;
    order.status = 'in_transit';
    setData('orders', orders);

    return newShipment;
  },

  async updateShipment(id: string, data: Partial<Shipment>): Promise<Shipment> {
    await delay();
    const shipments = getData('shipments') || [];
    const index = shipments.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('货运单不存在');
    }
    shipments[index] = { ...shipments[index], ...data, updatedAt: now() };
    setData('shipments', shipments);

    const orders = getData('orders') || [];
    const orderIndex = orders.findIndex((o) => o.id === shipments[index].orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].shipment = shipments[index];
      setData('orders', orders);
    }

    return shipments[index];
  },

  async updateSegmentStatus(shipmentId: string, segmentId: string, status: string, actualTime?: string): Promise<Shipment> {
    await delay();
    const shipments = getData('shipments') || [];
    const shipmentIndex = shipments.findIndex((s) => s.id === shipmentId);
    if (shipmentIndex === -1) {
      throw new Error('货运单不存在');
    }

    const segmentIndex = shipments[shipmentIndex].segments.findIndex((seg) => seg.id === segmentId);
    if (segmentIndex === -1) {
      throw new Error('运输段不存在');
    }

    const time = actualTime || now();
    const segment = shipments[shipmentIndex].segments[segmentIndex];

    if (status === 'in_progress') {
      segment.actualDepartureTime = time;
    } else if (status === 'completed') {
      segment.actualArrivalTime = time;
      if (!segment.actualDepartureTime) {
        segment.actualDepartureTime = segment.estimatedDepartureTime;
      }
    }

    segment.status = status as any;

    const completedSegments = shipments[shipmentIndex].segments.filter((s) => s.status === 'completed').length;
    const totalSegments = shipments[shipmentIndex].segments.length;

    let overallStatus: ShipmentStatus = shipments[shipmentIndex].status;
    if (completedSegments === totalSegments) {
      overallStatus = 'delivered';
    } else if (completedSegments > 0) {
      overallStatus = 'in_transit';
    }

    shipments[shipmentIndex] = {
      ...shipments[shipmentIndex],
      status: overallStatus,
      updatedAt: now(),
    };

    setData('shipments', shipments);
    return shipments[shipmentIndex];
  },

  async checkShipmentDelay(shipmentId: string): Promise<{ isDelayed: boolean; delayHours: number; reason?: string }> {
    await delay();
    const shipments = getData('shipments') || [];
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) {
      throw new Error('货运单不存在');
    }

    const currentSegment = shipment.segments.find(
      (s) => s.status === 'in_progress'
    ) || shipment.segments.find((s) => s.status === 'pending');

    if (!currentSegment) {
      return { isDelayed: false, delayHours: 0 };
    }

    const nowTime = new Date().getTime();
    const estimatedArrival = new Date(currentSegment.estimatedArrivalTime).getTime();

    const delayMs = nowTime - estimatedArrival;
    const delayHours = Math.max(0, Math.floor(delayMs / (1000 * 60 * 60)));

    let reason: string | undefined;
    const isDelayed = delayHours > 24;

    if (isDelayed) {
      const reasons = ['恶劣天气影响', '港口拥堵', '船舶机械故障', '海关查验延误'];
      reason = reasons[Math.floor(Math.random() * reasons.length)];
    }

    const shipmentIndex = shipments.findIndex((s) => s.id === shipmentId);
    if (shipmentIndex !== -1) {
      shipments[shipmentIndex] = {
        ...shipments[shipmentIndex],
        isDelayed,
        delayHours: isDelayed ? delayHours : undefined,
        delayReason: reason,
        status: isDelayed ? 'delayed' : shipments[shipmentIndex].status,
        updatedAt: now(),
      };
      setData('shipments', shipments);
    }

    return { isDelayed, delayHours, reason };
  },

  async recalculateSupplyChainPlan(shipmentId: string, delayHours: number): Promise<SupplyChainPlan> {
    await delay();
    const shipments = getData('shipments') || [];
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) {
      throw new Error('货运单不存在');
    }

    const delayMs = delayHours * 60 * 60 * 1000;
    const originalPlan: PlanItem[] = [];
    const revisedPlan: PlanItem[] = [];

    shipment.segments.forEach((seg) => {
      const origDepart = new Date(seg.estimatedDepartureTime);
      const origArrive = new Date(seg.estimatedArrivalTime);
      const revDepart = new Date(origDepart.getTime() + delayMs);
      const revArrive = new Date(origArrive.getTime() + delayMs);

      originalPlan.push({
        activity: `${seg.segmentType} - 从${seg.fromLocation.name}到${seg.toLocation.name}`,
        originalDate: origDepart.toISOString(),
        revisedDate: origDepart.toISOString(),
        responsibleParty: '物流服务商',
      });

      revisedPlan.push({
        activity: `${seg.segmentType} - 从${seg.fromLocation.name}到${seg.toLocation.name}`,
        originalDate: origDepart.toISOString(),
        revisedDate: revDepart.toISOString(),
        responsibleParty: '物流服务商',
      });
    });

    const plan: SupplyChainPlan = {
      originalPlan,
      revisedPlan,
      revisedAt: now(),
      reason: `延误${delayHours}小时，已重新计算供应链计划`,
    };

    const shipmentIndex = shipments.findIndex((s) => s.id === shipmentId);
    if (shipmentIndex !== -1) {
      shipments[shipmentIndex].supplyChainPlan = plan;
      setData('shipments', shipments);
    }

    return plan;
  },

  async getVesselLocation(vesselName: string): Promise<Location> {
    await delay();

    const vesselRoutes: Record<string, Location[]> = {
      '中远之星': [
        { name: '东中国海', country: '中国', latitude: 28.1234, longitude: 122.5678 },
        { name: '台湾海峡', country: '中国', latitude: 24.5678, longitude: 119.1234 },
        { name: '南海', country: '中国', latitude: 20.1234, longitude: 115.5678 },
      ],
      '东方海外香港': [
        { name: '东中国海', country: '中国', latitude: 30.1234, longitude: 123.5678 },
        { name: '黄海', country: '中国', latitude: 35.1234, longitude: 124.5678 },
      ],
    };

    const locations = vesselRoutes[vesselName] || [
      { name: '太平洋', country: '公海', latitude: 25.0, longitude: 125.0 },
    ];

    return locations[Math.floor(Math.random() * locations.length)];
  },
};

export const FinanceService = {
  async getSettlements(params?: { status?: SettlementStatus; page?: number; pageSize?: number }): Promise<{ data: Settlement[]; total: number }> {
    await delay();
    let settlements = getData('settlements') || [];
    if (params?.status) {
      settlements = settlements.filter((s) => s.status === params.status);
    }
    const total = settlements.length;
    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      settlements = settlements.slice(start, end);
    }
    return { data: settlements, total };
  },

  async getSettlement(id: string): Promise<Settlement> {
    await delay();
    const settlements = getData('settlements') || [];
    const settlement = settlements.find((s) => s.id === id);
    if (!settlement) {
      throw new Error('结算单不存在');
    }
    return settlement;
  },

  async calculateReceivablesPayables(orderId: string): Promise<{ receivables: FinanceItem[]; payables: FinanceItem[]; totalReceivable: number; totalPayable: number }> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const receivables: FinanceItem[] = [
      {
        id: generateId('rec'),
        itemType: 'goods_value',
        description: '货物价值',
        amount: order.totalAmount,
        currency: order.currency,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
    ];

    const tariffResult = await OrderService.calculateTariff(
      order.hsCode,
      order.originCountry,
      order.destinationCountry,
      order.totalAmount
    );

    const insuranceRate = 0.005;
    const freightRate = order.totalAmount > 100000 ? 0.028 : 0.035;
    const vatRate = 0.13;

    const insuranceFee = order.totalAmount * insuranceRate;
    const freightFee = order.totalAmount * freightRate;
    const importVat = (order.totalAmount + tariffResult.amount) * vatRate;

    const payables: FinanceItem[] = [];

    if (order.tradeTerm === 'CIF' || order.tradeTerm === 'CIP' || order.tradeTerm === 'CFR') {
      payables.push({
        id: generateId('pay'),
        itemType: 'insurance_fee',
        description: '国际运输保险费',
        amount: Number(insuranceFee.toFixed(2)),
        currency: order.currency,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
      payables.push({
        id: generateId('pay'),
        itemType: 'freight_fee',
        description: '国际海运费',
        amount: Number(freightFee.toFixed(2)),
        currency: order.currency,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
    }

    payables.push({
      id: generateId('pay'),
      itemType: 'customs_duty',
      description: `进口关税（${tariffResult.rate}%${tariffResult.tradeAgreement ? '，' + tariffResult.tradeAgreement : ''}）`,
      amount: tariffResult.amount,
      currency: order.currency,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });

    payables.push({
      id: generateId('pay'),
      itemType: 'import_vat',
      description: `进口增值税（${(vatRate * 100).toFixed(0)}%）`,
      amount: Number(importVat.toFixed(2)),
      currency: order.currency,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });

    payables.push({
      id: generateId('pay'),
      itemType: 'customs_fee',
      description: '报关代理费',
      amount: 150,
      currency: order.currency,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });

    payables.push({
      id: generateId('pay'),
      itemType: 'logistics_fee',
      description: '港杂费及国内运输费',
      amount: 800,
      currency: order.currency,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });

    if (order.letterOfCredit) {
      payables.push({
        id: generateId('pay'),
        itemType: 'bank_fee',
        description: '信用证议付手续费',
        amount: Number((order.totalAmount * 0.0015).toFixed(2)),
        currency: order.currency,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
    }

    const totalReceivable = receivables.reduce((sum, r) => sum + r.amount, 0);
    const totalPayable = payables.reduce((sum, p) => sum + p.amount, 0);

    return { receivables, payables, totalReceivable, totalPayable };
  },

  async generateSettlementList(orderId: string): Promise<Settlement> {
    await delay();
    const orders = getData('orders') || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    const settlements = getData('settlements') || [];
    const existingSettlement = settlements.find((s) => s.orderId === orderId);
    if (existingSettlement) {
      return existingSettlement;
    }

    const { receivables, payables, totalReceivable, totalPayable } = await this.calculateReceivablesPayables(orderId);
    const exchangeRate = await this.getExchangeRate(order.currency, 'CNY');

    const users = getData('users') || [];
    const currentUserId = getCurrentUserId();

    const newSettlement: Settlement = {
      id: generateId('settlement'),
      orderId,
      accountantId: currentUserId || users.find((u) => u.role === 'finance')?.id || '',
      status: 'calculated',
      receivables,
      payables,
      totalReceivable,
      totalPayable,
      netAmount: Number((totalReceivable - totalPayable).toFixed(2)),
      currency: order.currency,
      exchangeRate: exchangeRate.rate,
      billOfLadingDate: order.documents.find((d) => d.documentType === 'bill_of_lading')?.createdAt,
      createdAt: now(),
      updatedAt: now(),
    };

    settlements.push(newSettlement);
    setData('settlements', settlements);

    order.settlement = newSettlement;
    setData('orders', orders);

    return newSettlement;
  },

  async createPaymentApplication(settlementId: string, data: Partial<PaymentApplication>): Promise<PaymentApplication> {
    await delay();
    const settlements = getData('settlements') || [];
    const settlement = settlements.find((s) => s.id === settlementId);
    if (!settlement) {
      throw new Error('结算单不存在');
    }

    const paymentsKey = 'paymentApplications' as any;
    let payments: PaymentApplication[] = getData(paymentsKey) || [];

    const newPayment: PaymentApplication = {
      id: generateId('payapp'),
      settlementId,
      applicationNo: `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`,
      amount: data.amount || settlement.totalPayable,
      currency: data.currency || settlement.currency,
      payee: data.payee || '供应商',
      payeeBank: data.payeeBank || '国际银行',
      payeeAccount: data.payeeAccount || 'ACC' + Date.now(),
      purpose: data.purpose || '货款支付',
      status: 'pending',
      applicationDate: now(),
      createdAt: now(),
      updatedAt: now(),
    };

    payments.push(newPayment);
    setData(paymentsKey, payments);

    return newPayment;
  },

  async submitPaymentApplication(appId: string): Promise<PaymentApplication> {
    await delay();
    const paymentsKey = 'paymentApplications' as any;
    let payments: PaymentApplication[] = getData(paymentsKey) || [];
    const index = payments.findIndex((p) => p.id === appId);
    if (index === -1) {
      throw new Error('付款申请不存在');
    }
    payments[index] = { ...payments[index], status: 'approved', processingDate: now(), updatedAt: now() };
    setData(paymentsKey, payments);
    return payments[index];
  },

  async generateForeignExchangeDeclaration(appId: string): Promise<ForeignExchangeDeclaration> {
    await delay();
    const paymentsKey = 'paymentApplications' as any;
    const payments: PaymentApplication[] = getData(paymentsKey) || [];
    const payment = payments.find((p) => p.id === appId);
    if (!payment) {
      throw new Error('付款申请不存在');
    }

    const forexKey = 'foreignExchangeDeclarations' as any;
    let declarations: ForeignExchangeDeclaration[] = getData(forexKey) || [];

    const exchangeRate = await this.getExchangeRate(payment.currency, 'CNY');

    const newDeclaration: ForeignExchangeDeclaration = {
      id: generateId('forex'),
      paymentApplicationId: appId,
      declarationNo: `FX-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`,
      declarationDate: now(),
      amount: payment.amount,
      currency: payment.currency,
      exchangeRate: exchangeRate.rate,
      receiptUrl: `/api/forex-receipt/${generateId('receipt')}.pdf`,
      status: 'submitted',
      createdAt: now(),
      updatedAt: now(),
    };

    declarations.push(newDeclaration);
    setData(forexKey, declarations);

    return newDeclaration;
  },

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{ rate: number; date: string }> {
    await delay();

    const rates: Record<string, number> = {
      'USD-CNY': 7.2568,
      'EUR-CNY': 7.8945,
      'JPY-CNY': 0.0485,
      'GBP-CNY': 9.1234,
      'KRW-CNY': 0.0054,
      'AUD-CNY': 4.7823,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const reverseKey = `${toCurrency}-${fromCurrency}`;

    let rate = rates[key];
    if (rate === undefined) {
      const reverseRate = rates[reverseKey];
      rate = reverseRate ? 1 / reverseRate : 1.0;
    }

    const fluctuation = (Math.random() - 0.5) * 0.02 * rate;
    rate = Number((rate + fluctuation).toFixed(4));

    return { rate, date: now() };
  },
};

export const PerformanceService = {
  async getReport(date: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceReport> {
    await delay();
    const reports = getData('performanceReports') || [];
    const existingReport = reports.find((r) => r.reportDate.startsWith(date) && r.period === period);

    if (existingReport) {
      return existingReport;
    }

    const departments: { department: string; role: UserRole }[] = [
      { department: '进口部', role: 'importer' },
      { department: '出口部', role: 'exporter' },
      { department: '报关部', role: 'customs' },
      { department: '物流部', role: 'logistics' },
      { department: '财务部', role: 'finance' },
      { department: '管理层', role: 'management' },
    ];

    const departmentMetrics: DepartmentMetric[] = departments.map((dept) => ({
      department: dept.department,
      role: dept.role,
      documentProcessingTime: Number((2 + Math.random() * 4).toFixed(1)),
      customsPassRate: Number((95 + Math.random() * 5).toFixed(1)),
      orderExecutionRate: Number((92 + Math.random() * 8).toFixed(1)),
      totalOrders: Math.floor(5 + Math.random() * 15),
      completedOrders: Math.floor(4 + Math.random() * 13),
      delayedOrders: Math.floor(Math.random() * 3),
    }));

    const overallMetrics: OverallMetric = {
      avgDocumentProcessingTime: Number((departmentMetrics.reduce((s, m) => s + m.documentProcessingTime, 0) / departmentMetrics.length).toFixed(2)),
      avgCustomsPassRate: Number((departmentMetrics.reduce((s, m) => s + m.customsPassRate, 0) / departmentMetrics.length).toFixed(2)),
      avgOrderExecutionRate: Number((departmentMetrics.reduce((s, m) => s + m.orderExecutionRate, 0) / departmentMetrics.length).toFixed(2)),
      totalRevenue: Math.floor(300000 + Math.random() * 500000),
      costSaving: Math.floor(15000 + Math.random() * 30000),
      efficiencyImprovement: Number((10 + Math.random() * 10).toFixed(1)),
    };

    const newReport: PerformanceReport = {
      id: generateId('report'),
      reportDate: date,
      period,
      departmentMetrics,
      overallMetrics,
      createdAt: now(),
      updatedAt: now(),
    };

    reports.push(newReport);
    setData('performanceReports', reports);

    return newReport;
  },

  async getDepartmentMetrics(department: string, startDate: string, endDate: string): Promise<DepartmentMetric[]> {
    await delay();
    const metrics: DepartmentMetric[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const roles: Record<string, UserRole> = {
      '进口部': 'importer',
      '出口部': 'exporter',
      '报关部': 'customs',
      '物流部': 'logistics',
      '财务部': 'finance',
      '管理层': 'management',
    };

    const intervals = days <= 7 ? days : days <= 30 ? 4 : 12;
    for (let i = 0; i < intervals; i++) {
      metrics.push({
        department,
        role: roles[department] || 'management',
        documentProcessingTime: Number((2 + Math.random() * 4).toFixed(1)),
        customsPassRate: Number((95 + Math.random() * 5).toFixed(1)),
        orderExecutionRate: Number((92 + Math.random() * 8).toFixed(1)),
        totalOrders: Math.floor(5 + Math.random() * 15),
        completedOrders: Math.floor(4 + Math.random() * 13),
        delayedOrders: Math.floor(Math.random() * 3),
      });
    }

    return metrics;
  },

  async getOverallMetrics(startDate: string, endDate: string): Promise<OverallMetric> {
    await delay();
    return {
      avgDocumentProcessingTime: Number((2.5 + Math.random() * 2).toFixed(2)),
      avgCustomsPassRate: Number((96 + Math.random() * 4).toFixed(2)),
      avgOrderExecutionRate: Number((93 + Math.random() * 6).toFixed(2)),
      totalRevenue: Math.floor(500000 + Math.random() * 1000000),
      costSaving: Math.floor(25000 + Math.random() * 50000),
      efficiencyImprovement: Number((12 + Math.random() * 10).toFixed(1)),
    };
  },

  async sendReportToMobile(reportId: string, mobile: string): Promise<boolean> {
    await delay(800);
    return mobile.startsWith('1') && mobile.length === 11;
  },
};

export const NotificationService = {
  async getNotifications(params?: { type?: NotificationType; isRead?: boolean; page?: number; pageSize?: number }): Promise<{ data: Notification[]; total: number }> {
    await delay();
    const userId = getCurrentUserId();
    let notifications = getData('notifications') || [];

    if (userId) {
      notifications = notifications.filter((n) => n.userId === userId);
    }

    if (params?.type) {
      notifications = notifications.filter((n) => n.type === params.type);
    }

    if (params?.isRead !== undefined) {
      notifications = notifications.filter((n) => n.isRead === params.isRead);
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = notifications.length;
    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      notifications = notifications.slice(start, end);
    }

    return { data: notifications, total };
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    await delay();
    const notifications = getData('notifications') || [];
    const index = notifications.findIndex((n) => n.id === notificationId);
    if (index === -1) {
      throw new Error('通知不存在');
    }
    notifications[index] = { ...notifications[index], isRead: true, updatedAt: now() };
    setData('notifications', notifications);
    return notifications[index];
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    await delay();
    const notifications = getData('notifications') || [];
    notifications.forEach((n, i) => {
      if (n.userId === userId && !n.isRead) {
        notifications[i] = { ...n, isRead: true, updatedAt: now() };
      }
    });
    setData('notifications', notifications);
    return true;
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay();
    const notifications = getData('notifications') || [];
    return notifications.filter((n) => n.userId === userId && !n.isRead).length;
  },

  async pushNotification(users: string[], notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>): Promise<boolean> {
    await delay();
    const notifications = getData('notifications') || [];
    const newNotifications: Notification[] = users.map((userId) => ({
      ...notification,
      id: generateId('notif'),
      userId,
      isRead: false,
      createdAt: now(),
      updatedAt: now(),
    }));
    notifications.push(...newNotifications);
    setData('notifications', notifications);
    return true;
  },
};
