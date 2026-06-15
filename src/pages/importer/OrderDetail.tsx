import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, FileText, Download, Clock, MapPin, Package, DollarSign, Building2, User, FileCheck, Calculator } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table, { type TableColumn } from '@/components/Table';
import { StatusBadge, OrderTimeline } from '@/components/business';
import { useOrderStore } from '@/store';
import { OrderService, LetterOfCreditService, DocumentService } from '@/services';
import type { Order, Document } from '@/types';
import { format } from 'date-fns';

interface GoodsItem {
  id: string;
  hsCode: string;
  name: string;
  quantity: number;
  unit: string;
  weight: number;
  volume: number;
  unitPrice: number;
  amount: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, currentOrder, loading, deleteOrder } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetail(id);
    }
  }, [id]);

  const loadOrderDetail = async (orderId: string) => {
    const orderData = await getOrderById(orderId);
    setOrder(orderData);
    if (orderData) {
      const docs = await DocumentService.getDocuments(orderId);
      setDocuments(docs);
    }
  };

  const handleGenerateLC = async () => {
    if (order) {
      try {
        await LetterOfCreditService.generateDraft(order.id);
        await loadOrderDetail(order.id);
      } catch (error) {
        console.error('生成信用证失败:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (order) {
      await deleteOrder(order.id);
      navigate('/importer/orders');
    }
  };

  const goodsItems: GoodsItem[] = order ? [
    {
      id: order.id,
      hsCode: order.hsCode,
      name: order.goodsDescription,
      quantity: order.quantity,
      unit: order.unit,
      weight: order.weight,
      volume: order.volume,
      unitPrice: order.totalAmount / order.quantity,
      amount: order.totalAmount,
    },
  ] : [];

  const goodsColumns: TableColumn<GoodsItem>[] = [
    {
      title: 'HS编码',
      dataIndex: 'hsCode',
      key: 'hsCode',
      width: 140,
      render: (value) => <span className="font-mono text-gray-700">{value as string}</span>,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (value) => <span className="text-gray-900">{value as string}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (value, record) => (
        <span className="text-gray-700">{Number(value).toLocaleString()} {record.unit}</span>
      ),
    },
    {
      title: '重量 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 120,
      render: (value) => <span className="text-gray-700">{Number(value).toLocaleString()}</span>,
    },
    {
      title: '体积 (m³)',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (value) => <span className="text-gray-700">{Number(value).toFixed(4)}</span>,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 140,
      render: (value) => (
        <span className="text-gray-700">{order?.currency} {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value) => (
        <span className="font-semibold text-gray-900">{order?.currency} {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      ),
    },
  ];

  const documentColumns: TableColumn<Document>[] = [
    {
      title: '单证类型',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 140,
      render: (value) => {
        const typeLabels: Record<string, string> = {
          bill_of_lading: '提单',
          packing_list: '装箱单',
          commercial_invoice: '商业发票',
          certificate_of_origin: '原产地证',
          insurance_policy: '保险单',
          other: '其他',
        };
        const strValue = String(value);
        return <span className="text-gray-700">{typeLabels[strValue] || strValue}</span>;
      },
    },
    {
      title: '文件名称',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (value) => <span className="text-gray-900">{value as string}</span>,
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (value) => {
        const size = Number(value);
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <StatusBadge status={value as any} />,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => (
        <span className="text-gray-600">{format(new Date(value as string), 'yyyy-MM-dd HH:mm')}</span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 100,
      render: () => (
        <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
          下载
        </Button>
      ),
    },
  ];

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-900 font-medium truncate">{value || '-'}</div>
      </div>
    </div>
  );

  if (loading && !order) {
    return (
      <PageContainer title="订单详情">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
          <span className="text-gray-500">加载中...</span>
        </div>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer title="订单详情">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">订单不存在或已被删除</p>
          <Button variant="primary" onClick={() => navigate('/importer/orders')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`订单详情 - ${order.orderNo}`}
      subTitle={`创建于 ${format(new Date(order.createdAt), 'yyyy年MM月dd日')}`}
      breadcrumb={[
        { title: '进口商工作台' },
        { title: '订单管理', href: '/importer/orders' },
        { title: '订单详情', active: true },
      ]}
      extra={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/importer/orders/${order.id}/edit`)}
          >
            编辑
          </Button>
          {!order.letterOfCredit && (
            <Button
              variant="primary"
              icon={<FileText className="w-4 h-4" />}
              onClick={handleGenerateLC}
            >
              生成信用证
            </Button>
          )}
          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setDeleteModal(true)}
          >
            删除
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Body>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{order.orderNo}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-gray-500">{order.goodsDescription}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {order.currency} {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">总金额</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card title="商品明细">
            <Card.Body className="p-0">
              <Table
                columns={goodsColumns}
                dataSource={goodsItems}
                rowKey="id"
                pagination={false}
              />
            </Card.Body>
          </Card>

          <Card title="关税计算结果">
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">关税税率</div>
                  <div className="text-2xl font-bold text-blue-600">{order.tariffRate ?? 0}%</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">关税金额</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {order.currency} {(order.tariffAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">预计税费合计</div>
                  <div className="text-2xl font-bold text-red-600">
                    {order.currency} {((order.tariffAmount ?? 0) + (order.totalAmount + (order.tariffAmount ?? 0)) * 0.13).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">税种</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税率</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税额 ({order.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border font-medium">进口关税</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">{order.tariffRate ?? 0}%</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">
                        {(order.tariffAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border font-medium">进口增值税</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">13%</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">
                        {((order.totalAmount + (order.tariffAmount ?? 0)) * 0.13).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border font-medium">消费税</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">0%</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">0.00</td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900 border">税费合计</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 border">-</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 border">
                        {((order.tariffAmount ?? 0) + (order.totalAmount + (order.tariffAmount ?? 0)) * 0.13).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          {order.letterOfCredit && (
            <Card title="信用证信息">
              <Card.Body>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{order.letterOfCredit.lcNo}</div>
                      <div className="text-sm text-gray-500">信用证号</div>
                    </div>
                  </div>
                  <StatusBadge status={order.letterOfCredit.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={Building2} label="开证行" value={order.letterOfCredit.issuingBank} />
                  <InfoItem icon={Building2} label="通知行" value={order.letterOfCredit.advisingBank} />
                  <InfoItem icon={User} label="受益人" value={order.letterOfCredit.beneficiary} />
                  <InfoItem icon={User} label="申请人" value={order.letterOfCredit.applicant} />
                  <InfoItem icon={DollarSign} label="金额" value={`${order.letterOfCredit.currency} ${order.letterOfCredit.amount.toLocaleString()}`} />
                  <InfoItem icon={FileCheck} label="版本" value={`v${order.letterOfCredit.version}`} />
                  <InfoItem icon={Clock} label="有效期至" value={format(new Date(order.letterOfCredit.expiryDate), 'yyyy-MM-dd')} />
                  <InfoItem icon={Clock} label="最迟装运期" value={format(new Date(order.letterOfCredit.latestShipmentDate), 'yyyy-MM-dd')} />
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">条款</div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.letterOfCredit.terms}</p>
                </div>
              </Card.Body>
            </Card>
          )}

          {documents.length > 0 && (
            <Card title="单证列表">
              <Card.Body className="p-0">
                <Table
                  columns={documentColumns}
                  dataSource={documents}
                  rowKey="id"
                  pagination={false}
                />
              </Card.Body>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="基本信息">
            <Card.Body>
              <InfoItem icon={FileText} label="贸易术语" value={order.tradeTerm} />
              <InfoItem icon={MapPin} label="原产国" value={order.originCountry} />
              <InfoItem icon={MapPin} label="目的国" value={order.destinationCountry} />
              <InfoItem icon={User} label="进口商" value={order.importerId} />
              <InfoItem icon={User} label="出口商" value={order.exporterId} />
              <InfoItem icon={Package} label="HS编码" value={<span className="font-mono">{order.hsCode}</span>} />
              <InfoItem icon={Clock} label="创建时间" value={format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')} />
              <InfoItem icon={Clock} label="更新时间" value={format(new Date(order.updatedAt), 'yyyy-MM-dd HH:mm')} />
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <OrderTimeline orderId={order.id} status={order.status} />
            </Card.Body>
          </Card>
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除订单 <span className="font-medium text-gray-900">{order.orderNo}</span> 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteModal(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
