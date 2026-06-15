import type {
  User,
  Order,
  LetterOfCredit,
  Document,
  CustomsDeclaration,
  Shipment,
  Settlement,
  Notification,
  PerformanceReport
} from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'importer01',
    email: 'importer01@trade.com',
    role: 'importer',
    companyName: '华盛进出口贸易有限公司',
    companyId: 'COMP_IMP_001',
    phone: '13800138001',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20man%20portrait%20asian%20suit&image_size=square'
  },
  {
    id: 'user_002',
    username: 'exporter01',
    email: 'exporter01@trade.com',
    role: 'exporter',
    companyName: '万达制造有限公司',
    companyId: 'COMP_EXP_001',
    phone: '13800138002',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20business%20woman%20portrait%20office&image_size=square'
  },
  {
    id: 'user_003',
    username: 'customs01',
    email: 'customs01@trade.com',
    role: 'customs',
    companyName: '迅捷报关服务有限公司',
    companyId: 'COMP_CUS_001',
    phone: '13800138003',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=customs%20officer%20professional%20portrait%20uniform&image_size=square'
  },
  {
    id: 'user_004',
    username: 'logistics01',
    email: 'logistics01@trade.com',
    role: 'logistics',
    companyName: '环球物流集团',
    companyId: 'COMP_LOG_001',
    phone: '13800138004',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=logistics%20manager%20professional%20portrait%20warehouse&image_size=square'
  },
  {
    id: 'user_005',
    username: 'finance01',
    email: 'finance01@trade.com',
    role: 'finance',
    companyName: '华盛进出口贸易有限公司',
    companyId: 'COMP_IMP_001',
    phone: '13800138005',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=accountant%20professional%20portrait%20woman%20glasses&image_size=square'
  },
  {
    id: 'user_006',
    username: 'manager01',
    email: 'manager01@trade.com',
    role: 'management',
    companyName: '华盛进出口贸易有限公司',
    companyId: 'COMP_IMP_001',
    phone: '13800138006',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ceo%20executive%20business%20man%20portrait%20confident&image_size=square'
  }
];

export const mockLettersOfCredit: LetterOfCredit[] = [
  {
    id: 'lc_001',
    orderId: 'order_001',
    lcNo: 'LC-2026-06001',
    issuingBank: '中国工商银行上海分行',
    advisingBank: '德意志银行汉堡分行',
    beneficiary: '万达制造有限公司',
    applicant: '华盛进出口贸易有限公司',
    amount: 125000,
    currency: 'USD',
    expiryDate: '2026-08-15T00:00:00Z',
    latestShipmentDate: '2026-07-30T00:00:00Z',
    terms: 'CIF 上海港，凭全套清洁已装船提单议付，发票注明信用证号',
    status: 'exporter_confirmed',
    version: 1,
    createdAt: '2026-06-11T10:00:00Z',
    updatedAt: '2026-06-12T15:00:00Z'
  },
  {
    id: 'lc_002',
    orderId: 'order_002',
    lcNo: 'LC-2026-06002',
    issuingBank: '中国建设银行深圳分行',
    advisingBank: '三菱东京日联银行东京分行',
    beneficiary: '万达制造有限公司',
    applicant: '华盛进出口贸易有限公司',
    amount: 89000,
    currency: 'USD',
    expiryDate: '2026-08-30T00:00:00Z',
    latestShipmentDate: '2026-08-15T00:00:00Z',
    terms: 'FOB 横滨港，允许分批装运，允许转船',
    status: 'pending_exporter_confirm',
    version: 1,
    createdAt: '2026-06-13T09:00:00Z',
    updatedAt: '2026-06-13T09:00:00Z'
  }
];

export const mockDocuments: Document[] = [
  {
    id: 'doc_001',
    orderId: 'order_001',
    documentType: 'bill_of_lading',
    fileName: '提单_ORD-2026-06001.pdf',
    fileUrl: '/documents/bill_of_lading_001.pdf',
    fileSize: 2048000,
    uploadedBy: 'user_002',
    status: 'verified',
    createdAt: '2026-06-14T08:00:00Z',
    updatedAt: '2026-06-14T14:00:00Z',
    ocrData: {
      blNo: 'SHBL-2026-06145',
      vesselName: '中远之星',
      voyageNo: 'V026E',
      portOfLoading: '汉堡',
      portOfDischarge: '上海',
      containerNo: 'MSKU1234567',
      sealNo: 'A123456',
      grossWeight: '2500 KGS',
      measurement: '15 CBM',
      shipper: '万达制造有限公司',
      consignee: '凭指示'
    },
    verificationResult: {
      isPassed: true,
      checkedAt: '2026-06-14T14:00:00Z',
      discrepancies: []
    }
  },
  {
    id: 'doc_002',
    orderId: 'order_001',
    documentType: 'packing_list',
    fileName: '箱单_ORD-2026-06001.pdf',
    fileUrl: '/documents/packing_list_001.pdf',
    fileSize: 512000,
    uploadedBy: 'user_002',
    status: 'verified',
    createdAt: '2026-06-14T08:15:00Z',
    updatedAt: '2026-06-14T14:00:00Z',
    ocrData: {
      invoiceNo: 'INV-2026-06001',
      date: '2026-06-14',
      buyer: '华盛进出口贸易有限公司',
      seller: '万达制造有限公司',
      totalPackages: '500 CTNS',
      totalGrossWeight: '2500 KGS',
      totalNetWeight: '2250 KGS',
      totalMeasurement: '15 CBM'
    },
    verificationResult: {
      isPassed: true,
      checkedAt: '2026-06-14T14:00:00Z',
      discrepancies: []
    }
  },
  {
    id: 'doc_003',
    orderId: 'order_001',
    documentType: 'commercial_invoice',
    fileName: '商业发票_ORD-2026-06001.pdf',
    fileUrl: '/documents/commercial_invoice_001.pdf',
    fileSize: 307200,
    uploadedBy: 'user_002',
    status: 'verified',
    createdAt: '2026-06-14T08:30:00Z',
    updatedAt: '2026-06-14T14:00:00Z',
    ocrData: {
      invoiceNo: 'INV-2026-06001',
      date: '2026-06-14',
      buyer: '华盛进出口贸易有限公司',
      seller: '万达制造有限公司',
      totalAmount: 'USD 125,000.00',
      paymentTerms: '信用证',
      currency: 'USD',
      hsCode: '84713000'
    },
    verificationResult: {
      isPassed: true,
      checkedAt: '2026-06-14T14:00:00Z',
      discrepancies: []
    }
  }
];

export const mockCustomsDeclarations: CustomsDeclaration[] = [
  {
    id: 'customs_001',
    orderId: 'order_001',
    declarationNo: 'CUS-2026-SH-0614001',
    customsBrokerId: 'user_003',
    status: 'ready_to_submit',
    hsCode: '84713000',
    goodsDescription: '便携式数字自动数据处理设备（笔记本电脑）',
    quantity: 500,
    declaredValue: 125000,
    currency: 'USD',
    originCountry: '德国',
    destinationCountry: '中国',
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-06-15T14:30:00Z',
    regulatoryConditions: [
      {
        code: 'A',
        name: '入境货物通关单',
        description: '法定检验检疫货物需提供入境货物通关单',
        isCompliant: true
      },
      {
        code: 'M',
        name: '进口商品检验',
        description: '列入法检目录的进口商品需实施检验',
        isCompliant: true
      },
      {
        code: '3C',
        name: '强制性产品认证',
        description: '涉及安全、环保的产品需提供3C认证证书',
        isCompliant: true
      }
    ],
    requiredLicenses: [
      {
        licenseType: '3C认证',
        licenseName: '中国强制性产品认证证书',
        isRequired: true,
        isProvided: true,
        licenseNo: '2026010901123456',
        expiryDate: '2028-06-30T00:00:00Z'
      },
      {
        licenseType: '入境通关单',
        licenseName: '入境货物通关单',
        isRequired: true,
        isProvided: true,
        licenseNo: 'SH2026061500123',
        expiryDate: '2026-07-15T00:00:00Z'
      }
    ],
    declarationMessage: '<?xml version="1.0" encoding="UTF-8"?><Declaration><Header>...</Header><Body>...</Body></Declaration>'
  }
];

export const mockShipments: Shipment[] = [
  {
    id: 'shipment_001',
    orderId: 'order_003',
    logisticsProviderId: 'user_004',
    containerNo: 'MSKU7654321',
    vesselName: '东方海外香港',
    voyageNo: 'V018W',
    status: 'in_transit',
    isDelayed: false,
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    currentLocation: {
      name: '东中国海',
      country: '中国',
      latitude: 28.1234,
      longitude: 122.5678
    },
    segments: [
      {
        id: 'seg_001',
        segmentType: 'loading',
        fromLocation: {
          name: '釜山港',
          country: '韩国',
          portCode: 'KRPUS',
          latitude: 35.1028,
          longitude: 129.0403
        },
        toLocation: {
          name: '釜山港',
          country: '韩国',
          portCode: 'KRPUS',
          latitude: 35.1028,
          longitude: 129.0403
        },
        estimatedDepartureTime: '2026-06-10T08:00:00Z',
        actualDepartureTime: '2026-06-10T10:30:00Z',
        estimatedArrivalTime: '2026-06-10T08:00:00Z',
        actualArrivalTime: '2026-06-10T08:00:00Z',
        status: 'completed'
      },
      {
        id: 'seg_002',
        segmentType: 'ocean_freight',
        fromLocation: {
          name: '釜山港',
          country: '韩国',
          portCode: 'KRPUS',
          latitude: 35.1028,
          longitude: 129.0403
        },
        toLocation: {
          name: '上海港',
          country: '中国',
          portCode: 'CNSHA',
          latitude: 31.2304,
          longitude: 121.4737
        },
        estimatedDepartureTime: '2026-06-10T14:00:00Z',
        actualDepartureTime: '2026-06-10T16:00:00Z',
        estimatedArrivalTime: '2026-06-14T08:00:00Z',
        status: 'in_progress'
      },
      {
        id: 'seg_003',
        segmentType: 'discharging',
        fromLocation: {
          name: '上海港',
          country: '中国',
          portCode: 'CNSHA',
          latitude: 31.2304,
          longitude: 121.4737
        },
        toLocation: {
          name: '上海港',
          country: '中国',
          portCode: 'CNSHA',
          latitude: 31.2304,
          longitude: 121.4737
        },
        estimatedDepartureTime: '2026-06-14T08:00:00Z',
        estimatedArrivalTime: '2026-06-15T18:00:00Z',
        status: 'pending'
      }
    ]
  }
];

export const mockSettlements: Settlement[] = [
  {
    id: 'settlement_001',
    orderId: 'order_001',
    accountantId: 'user_005',
    status: 'calculated',
    currency: 'USD',
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-06-15T16:00:00Z',
    billOfLadingDate: '2026-06-14T00:00:00Z',
    exchangeRate: 7.2568,
    receivables: [
      {
        id: 'rec_001',
        itemType: 'goods_value',
        description: '货物价值',
        amount: 125000,
        currency: 'USD',
        dueDate: '2026-07-15T00:00:00Z',
        status: 'pending'
      }
    ],
    payables: [
      {
        id: 'pay_001',
        itemType: 'insurance_fee',
        description: '国际运输保险费（CIF条款）',
        amount: 625,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_002',
        itemType: 'freight_fee',
        description: '国际海运费（CIF条款）',
        amount: 3500,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_003',
        itemType: 'customs_duty',
        description: '进口关税（0%，最惠国税率）',
        amount: 0,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_004',
        itemType: 'import_vat',
        description: '进口增值税（13%）',
        amount: 16250,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_005',
        itemType: 'customs_fee',
        description: '报关代理费',
        amount: 150,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_006',
        itemType: 'logistics_fee',
        description: '港杂费及国内运输费',
        amount: 800,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      },
      {
        id: 'pay_007',
        itemType: 'bank_fee',
        description: '信用证议付手续费',
        amount: 187.5,
        currency: 'USD',
        dueDate: '2026-06-30T00:00:00Z',
        status: 'pending'
      }
    ],
    totalReceivable: 125000,
    totalPayable: 21512.5,
    netAmount: 103487.5
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order_001',
    orderNo: 'ORD-2026-06001',
    importerId: 'user_001',
    exporterId: 'user_002',
    tradeTerm: 'CIF',
    status: 'documents_uploaded',
    totalAmount: 125000,
    currency: 'USD',
    originCountry: '德国',
    destinationCountry: '中国',
    hsCode: '84713000',
    goodsDescription: '便携式电脑',
    quantity: 500,
    unit: '台',
    weight: 2500,
    volume: 15,
    tariffRate: 0,
    tariffAmount: 0,
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-15T14:30:00Z',
    letterOfCredit: mockLettersOfCredit[0],
    documents: mockDocuments,
    customsDeclaration: mockCustomsDeclarations[0],
    settlement: mockSettlements[0]
  },
  {
    id: 'order_002',
    orderNo: 'ORD-2026-06002',
    importerId: 'user_001',
    exporterId: 'user_002',
    tradeTerm: 'FOB',
    status: 'confirmed',
    totalAmount: 89000,
    currency: 'USD',
    originCountry: '日本',
    destinationCountry: '中国',
    hsCode: '85258013',
    goodsDescription: '智能手机',
    quantity: 2000,
    unit: '台',
    weight: 3000,
    volume: 20,
    tariffRate: 0,
    tariffAmount: 0,
    createdAt: '2026-06-12T11:00:00Z',
    updatedAt: '2026-06-14T16:00:00Z',
    letterOfCredit: mockLettersOfCredit[1],
    documents: []
  },
  {
    id: 'order_003',
    orderNo: 'ORD-2026-06003',
    importerId: 'user_001',
    exporterId: 'user_002',
    tradeTerm: 'CFR',
    status: 'in_transit',
    totalAmount: 256000,
    currency: 'USD',
    originCountry: '韩国',
    destinationCountry: '中国',
    hsCode: '85423100',
    goodsDescription: '集成电路',
    quantity: 50000,
    unit: '个',
    weight: 500,
    volume: 2,
    tariffRate: 0,
    tariffAmount: 0,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    documents: [],
    shipment: mockShipments[0]
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    userId: 'user_001',
    type: 'order_status',
    severity: 'success',
    title: '订单 ORD-2026-06001 单证已上传完成',
    message: '出口商已完成提单、箱单、发票的上传，系统已自动校验通过。请进入订单详情查看。',
    relatedEntityId: 'order_001',
    relatedEntityType: 'order',
    isRead: false,
    actionUrl: '/importer/orders/order_001',
    createdAt: '2026-06-14T14:00:00Z',
    updatedAt: '2026-06-14T14:00:00Z'
  },
  {
    id: 'notif_002',
    userId: 'user_001',
    type: 'order_status',
    severity: 'info',
    title: '订单 ORD-2026-06002 信用证待确认',
    message: '信用证草稿已生成并推送至出口商确认，请耐心等待出口商回复。',
    relatedEntityId: 'order_002',
    relatedEntityType: 'order',
    isRead: false,
    actionUrl: '/importer/orders/order_002',
    createdAt: '2026-06-13T09:00:00Z',
    updatedAt: '2026-06-13T09:00:00Z'
  },
  {
    id: 'notif_003',
    userId: 'user_002',
    type: 'order_status',
    severity: 'info',
    title: '新订单 ORD-2026-06002 待确认',
    message: '您有新的订单需要确认，请及时处理。订单金额：$89,000',
    relatedEntityId: 'order_002',
    relatedEntityType: 'order',
    isRead: false,
    actionUrl: '/exporter/documents',
    createdAt: '2026-06-12T11:00:00Z',
    updatedAt: '2026-06-12T11:00:00Z'
  },
  {
    id: 'notif_004',
    userId: 'user_003',
    type: 'order_status',
    severity: 'info',
    title: '新报关单待处理',
    message: '订单 ORD-2026-06001 单证已校验通过，请及时录入报关单信息。',
    relatedEntityId: 'order_001',
    relatedEntityType: 'customs',
    isRead: false,
    actionUrl: '/customs/declarations/new?orderId=order_001',
    createdAt: '2026-06-14T14:30:00Z',
    updatedAt: '2026-06-14T14:30:00Z'
  },
  {
    id: 'notif_005',
    userId: 'user_001',
    type: 'shipment_delay',
    severity: 'warning',
    title: '订单 ORD-2026-06003 物流更新',
    message: '货物正在运输途中，预计6月14日抵达上海港。当前位置：东中国海。',
    relatedEntityId: 'order_003',
    relatedEntityType: 'shipment',
    isRead: true,
    actionUrl: '/logistics/shipments/shipment_001/track',
    createdAt: '2026-06-13T08:00:00Z',
    updatedAt: '2026-06-13T10:00:00Z'
  },
  {
    id: 'notif_006',
    userId: 'user_005',
    type: 'payment_due',
    severity: 'warning',
    title: '结算单待审核',
    message: '订单 ORD-2026-06001 费用结算单已生成，待审核金额：$21,512.50',
    relatedEntityId: 'settlement_001',
    relatedEntityType: 'settlement',
    isRead: false,
    actionUrl: '/finance/settlements/settlement_001',
    createdAt: '2026-06-15T16:00:00Z',
    updatedAt: '2026-06-15T16:00:00Z'
  },
  {
    id: 'notif_007',
    userId: 'user_006',
    type: 'system',
    severity: 'info',
    title: '今日绩效报表已生成',
    message: '2026年6月15日绩效报表已生成，包含各部门KPI数据和对比分析。',
    relatedEntityId: 'report_001',
    relatedEntityType: 'report',
    isRead: false,
    actionUrl: '/management/dashboard',
    createdAt: '2026-06-16T08:00:00Z',
    updatedAt: '2026-06-16T08:00:00Z'
  },
  {
    id: 'notif_008',
    userId: 'user_002',
    type: 'document_discrepancy',
    severity: 'success',
    title: '订单 ORD-2026-06001 单证校验通过',
    message: '您上传的提单、箱单、发票已通过系统智能校验，未发现不符点。',
    relatedEntityId: 'order_001',
    relatedEntityType: 'document',
    isRead: true,
    actionUrl: '/exporter/documents/doc_001/verify',
    createdAt: '2026-06-14T14:00:00Z',
    updatedAt: '2026-06-14T15:00:00Z'
  }
];

export const mockPerformanceReports: PerformanceReport[] = [
  {
    id: 'report_001',
    reportDate: '2026-06-15T00:00:00Z',
    period: 'daily',
    createdAt: '2026-06-16T08:00:00Z',
    updatedAt: '2026-06-16T08:00:00Z',
    departmentMetrics: [
      {
        department: '进口部',
        role: 'importer',
        documentProcessingTime: 4.5,
        customsPassRate: 98.5,
        orderExecutionRate: 96.2,
        totalOrders: 12,
        completedOrders: 10,
        delayedOrders: 1
      },
      {
        department: '出口部',
        role: 'exporter',
        documentProcessingTime: 3.8,
        customsPassRate: 99.1,
        orderExecutionRate: 97.5,
        totalOrders: 8,
        completedOrders: 7,
        delayedOrders: 0
      },
      {
        department: '报关部',
        role: 'customs',
        documentProcessingTime: 2.1,
        customsPassRate: 96.8,
        orderExecutionRate: 95.0,
        totalOrders: 15,
        completedOrders: 14,
        delayedOrders: 1
      },
      {
        department: '物流部',
        role: 'logistics',
        documentProcessingTime: 5.2,
        customsPassRate: 100,
        orderExecutionRate: 94.7,
        totalOrders: 10,
        completedOrders: 9,
        delayedOrders: 2
      },
      {
        department: '财务部',
        role: 'finance',
        documentProcessingTime: 1.5,
        customsPassRate: 100,
        orderExecutionRate: 98.8,
        totalOrders: 12,
        completedOrders: 11,
        delayedOrders: 0
      },
      {
        department: '管理层',
        role: 'management',
        documentProcessingTime: 0.5,
        customsPassRate: 100,
        orderExecutionRate: 100,
        totalOrders: 57,
        completedOrders: 51,
        delayedOrders: 4
      }
    ],
    overallMetrics: {
      avgDocumentProcessingTime: 2.93,
      avgCustomsPassRate: 99.07,
      avgOrderExecutionRate: 97.03,
      totalRevenue: 470000,
      costSaving: 23500,
      efficiencyImprovement: 15.2
    }
  }
];
