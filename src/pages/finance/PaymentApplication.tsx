import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Upload,
  Send,
  FileText,
  DollarSign,
  User,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Trash2,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Table, { type TableColumn } from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Card from '@/components/Card';
import { StatusBadge, DocumentUploadZone } from '@/components/business';
import { useFinanceStore } from '@/store';
import type { PaymentApplication, PaymentApplicationStatus, Settlement } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'JPY', label: '日元 (JPY)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'CNY', label: '人民币 (CNY)' },
];

const purposeOptions: SelectOption[] = [
  { value: '货款支付', label: '货款支付' },
  { value: '服务费用', label: '服务费用' },
  { value: '运费支付', label: '运费支付' },
  { value: '保险费用', label: '保险费用' },
  { value: '税款支付', label: '税款支付' },
  { value: '其他', label: '其他' },
];

const mockPaymentApplications: PaymentApplication[] = [
  {
    id: 'payapp_001',
    settlementId: 'settlement_001',
    applicationNo: 'PAY-2026-0000001',
    amount: 21512.5,
    currency: 'USD',
    payee: '万达制造有限公司',
    payeeBank: '中国银行上海分行',
    payeeAccount: '6228480012345678901',
    purpose: '货款支付',
    status: 'pending',
    applicationDate: '2026-06-15T10:00:00Z',
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'payapp_002',
    settlementId: 'settlement_002',
    applicationNo: 'PAY-2026-0000002',
    amount: 15800.0,
    currency: 'EUR',
    payee: '德国电子科技公司',
    payeeBank: '德意志银行',
    payeeAccount: 'DE89370400440532013000',
    purpose: '货款支付',
    status: 'approved',
    applicationDate: '2026-06-10T14:30:00Z',
    processingDate: '2026-06-12T09:00:00Z',
    createdAt: '2026-06-10T14:30:00Z',
    updatedAt: '2026-06-12T09:00:00Z',
  },
  {
    id: 'payapp_003',
    settlementId: 'settlement_003',
    applicationNo: 'PAY-2026-0000003',
    amount: 8900.0,
    currency: 'USD',
    payee: '中远海运集装箱运输有限公司',
    payeeBank: '中国建设银行',
    payeeAccount: '6227001210001234567',
    purpose: '运费支付',
    status: 'processed',
    applicationDate: '2026-06-05T11:00:00Z',
    processingDate: '2026-06-06T10:00:00Z',
    createdAt: '2026-06-05T11:00:00Z',
    updatedAt: '2026-06-06T10:00:00Z',
  },
];

export default function PaymentApplicationPage() {
  const navigate = useNavigate();
  const { settlements, createPaymentApplication, submitPaymentApplication } = useFinanceStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState('');
  const [payee, setPayee] = useState('');
  const [payeeBank, setPayeeBank] = useState('');
  const [payeeAccount, setPayeeAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [paymentApplications] = useState<PaymentApplication[]>(mockPaymentApplications);

  const handleSubmit = async () => {
    if (!selectedSettlement || !payee || !payeeBank || !payeeAccount || !amount || !purpose) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const payment = await createPaymentApplication(selectedSettlement, {
        amount: Number(amount),
        currency: currency as any,
        payee,
        payeeBank,
        payeeAccount,
        purpose,
      });
      await submitPaymentApplication(payment.id);
      setShowNewForm(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSettlement('');
    setPayee('');
    setPayeeBank('');
    setPayeeAccount('');
    setAmount('');
    setCurrency('USD');
    setPurpose('');
    setFiles([]);
  };

  const handleSettlementChange = (settlementId: string) => {
    setSelectedSettlement(settlementId);
    const settlement = settlements.find((s) => s.id === settlementId);
    if (settlement) {
      setAmount(settlement.totalPayable.toString());
      setCurrency(settlement.currency);
    }
  };

  const handleFileUpload = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const columns: TableColumn<PaymentApplication>[] = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 160,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-gray-900">
          {record.currency} {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 100,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">
          {value as string}
        </span>
      ),
    },
    {
      title: '收款人',
      dataIndex: 'payee',
      key: 'payee',
      width: 200,
      render: (value) => (
        <span className="text-gray-700 truncate block max-w-[180px]" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => {
        const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
          pending: { label: '待审批', variant: 'warning' },
          approved: { label: '已批准', variant: 'success' },
          rejected: { label: '已驳回', variant: 'danger' },
          processed: { label: '已处理', variant: 'info' },
        };
        const config = statusMap[value as string] || { label: value, variant: 'info' };
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              {
                'bg-yellow-50 text-yellow-700 border-yellow-200': config.variant === 'warning',
                'bg-green-50 text-green-700 border-green-200': config.variant === 'success',
                'bg-red-50 text-red-700 border-red-200': config.variant === 'danger',
                'bg-blue-50 text-blue-700 border-blue-200': config.variant === 'info',
              }
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', {
                'bg-yellow-500': config.variant === 'warning',
                'bg-green-500': config.variant === 'success',
                'bg-red-500': config.variant === 'danger',
                'bg-blue-500': config.variant === 'info',
              })}
            />
            {config.label}
          </span>
        );
      },
    },
    {
      title: '申请日期',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      width: 120,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd')}
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 180,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/finance/payments/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={() => navigate(`/finance/foreign-exchange?paymentId=${record.id}`)}
            >
              申报外汇
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="付汇管理"
      subTitle="管理付款申请，提交审批，追踪付款状态"
      breadcrumb={[
        { title: '财务工作台' },
        { title: '付汇管理', active: true },
      ]}
      extra={
        !showNewForm && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewForm(true)}
          >
            新增付款申请
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {showNewForm && (
          <Card title="新增付款申请">
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Select
                    label="选择结算单"
                    placeholder="请选择关联的结算单"
                    value={selectedSettlement}
                    onChange={(e) => handleSettlementChange(e.target.value)}
                    options={settlements.map((s) => ({
                      value: s.id,
                      label: `${s.id.slice(0, 15)}... - 应付 ${s.currency} ${s.totalPayable.toLocaleString()}`,
                    }))}
                  />
                </div>

                <div>
                  <Input
                    label="收款人名称"
                    placeholder="请输入收款人名称"
                    icon={<User className="w-4 h-4" />}
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="收款银行"
                    placeholder="请输入收款银行"
                    icon={<Building2 className="w-4 h-4" />}
                    value={payeeBank}
                    onChange={(e) => setPayeeBank(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="银行账号"
                    placeholder="请输入银行账号"
                    icon={<CreditCard className="w-4 h-4" />}
                    value={payeeAccount}
                    onChange={(e) => setPayeeAccount(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="付汇金额"
                    placeholder="请输入付汇金额"
                    type="number"
                    icon={<DollarSign className="w-4 h-4" />}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Select
                    label="币种"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={currencyOptions}
                  />
                </div>

                <div className="md:col-span-2">
                  <Select
                    label="付汇用途"
                    placeholder="请选择付汇用途"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    options={purposeOptions}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    附件上传
                  </label>
                  <DocumentUploadZone
                    onUpload={handleFileUpload}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    maxSize={10 * 1024 * 1024}
                    multiple={true}
                  />
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => removeFile(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewForm(false);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  icon={<Send className="w-4 h-4" />}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  提交审批
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>付款申请列表</span>
            </div>
          }
        >
          <Card.Body className="p-0">
            <Table
              columns={columns}
              dataSource={paymentApplications}
              rowKey="id"
              onRowClick={(record) => navigate(`/finance/payments/${record.id}`)}
              pagination={{
                current: 1,
                pageSize: 10,
                total: paymentApplications.length,
                onChange: () => {},
              }}
            />
          </Card.Body>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span>已提交的申请状态追踪</span>
            </div>
          }
        >
          <Card.Body>
            <div className="space-y-4">
              {paymentApplications.filter((p) => p.status !== 'pending').map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{app.applicationNo}</p>
                      <p className="text-sm text-gray-500">
                        {app.currency} {app.amount.toLocaleString()} · {app.payee}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        申请日期：{format(new Date(app.applicationDate), 'yyyy-MM-dd')}
                      </p>
                      {app.processingDate && (
                        <p className="text-sm text-gray-500">
                          处理日期：{format(new Date(app.processingDate), 'yyyy-MM-dd')}
                        </p>
                      )}
                    </div>
                    {app.status === 'approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Send className="w-4 h-4" />}
                        onClick={() => navigate(`/finance/foreign-exchange?paymentId=${app.id}`)}
                      >
                        外汇申报
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </PageContainer>
  );
}
