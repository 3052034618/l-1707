import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Package, FileCheck, Shield, Eye, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { StatusBadge } from '@/components/business';
import { useCustomsStore } from '@/store';
import { CustomsService, OrderService } from '@/services';
import type { Order, RegulatoryCondition, LicenseRequirement, CustomsDeclaration } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  orderId: z.string().min(1, '请选择关联订单'),
  hsCode: z.string().min(1, '请填写HS编码'),
  goodsDescription: z.string().min(1, '请填写商品名称'),
  quantity: z.number().min(1, '数量必须大于0'),
  declaredValue: z.number().min(0, '申报价值不能为负数'),
  originCountry: z.string().min(1, '请选择原产国'),
  destinationCountry: z.string().min(1, '请选择目的国'),
  currency: z.string().min(1, '请选择币种'),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { key: 'order', label: '选择订单', icon: Package },
  { key: 'goods', label: '商品信息', icon: FileCheck },
  { key: 'regulatory', label: '监管条件', icon: Shield },
  { key: 'confirm', label: '确认提交', icon: Eye },
];

const countryOptions: SelectOption[] = [
  { value: '中国', label: '中国' },
  { value: '美国', label: '美国' },
  { value: '德国', label: '德国' },
  { value: '日本', label: '日本' },
  { value: '韩国', label: '韩国' },
  { value: '澳大利亚', label: '澳大利亚' },
  { value: '新西兰', label: '新西兰' },
  { value: '新加坡', label: '新加坡' },
  { value: '马来西亚', label: '马来西亚' },
  { value: '泰国', label: '泰国' },
  { value: '越南', label: '越南' },
  { value: '印度尼西亚', label: '印度尼西亚' },
  { value: '英国', label: '英国' },
  { value: '法国', label: '法国' },
  { value: '意大利', label: '意大利' },
  { value: '西班牙', label: '西班牙' },
  { value: '加拿大', label: '加拿大' },
  { value: '巴西', label: '巴西' },
  { value: '印度', label: '印度' },
];

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD 美元' },
  { value: 'CNY', label: 'CNY 人民币' },
  { value: 'EUR', label: 'EUR 欧元' },
  { value: 'JPY', label: 'JPY 日元' },
  { value: 'GBP', label: 'GBP 英镑' },
  { value: 'AUD', label: 'AUD 澳元' },
];

export default function DeclarationNew() {
  const navigate = useNavigate();
  const { createDeclaration, loading } = useCustomsStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [regulatoryConditions, setRegulatoryConditions] = useState<RegulatoryCondition[]>([]);
  const [licenseRequirements, setLicenseRequirements] = useState<LicenseRequirement[]>([]);
  const [checkingRegulatory, setCheckingRegulatory] = useState(false);

  const { control, handleSubmit, watch, formState: { errors }, getValues, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: '',
      hsCode: '',
      goodsDescription: '',
      quantity: 1,
      declaredValue: 0,
      originCountry: '',
      destinationCountry: '中国',
      currency: 'USD',
    },
  });

  const watchOrderId = watch('orderId');
  const watchHsCode = watch('hsCode');
  const watchOriginCountry = watch('originCountry');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (watchOrderId) {
      const order = orders.find((o) => o.id === watchOrderId);
      setSelectedOrder(order || null);
      if (order) {
        setValue('hsCode', order.hsCode);
        setValue('goodsDescription', order.goodsDescription);
        setValue('quantity', order.quantity);
        setValue('declaredValue', order.totalAmount);
        setValue('originCountry', order.originCountry);
        setValue('destinationCountry', order.destinationCountry);
        setValue('currency', order.currency);
      }
    }
  }, [watchOrderId, orders, setValue]);

  useEffect(() => {
    if (currentStep === 2 && watchHsCode && watchOriginCountry) {
      checkRegulatoryConditions();
    }
  }, [currentStep, watchHsCode, watchOriginCountry]);

  const loadOrders = async () => {
    const result = await OrderService.getOrders();
    setOrders(result.data);
  };

  const checkRegulatoryConditions = async () => {
    setCheckingRegulatory(true);
    try {
      const [conditions, licenses] = await Promise.all([
        CustomsService.checkRegulatoryConditions(watchHsCode, watchOriginCountry),
        CustomsService.checkLicenseRequirements(watchHsCode),
      ]);
      setRegulatoryConditions(conditions);
      setLicenseRequirements(licenses);
    } catch (error) {
      console.error('检查监管条件失败:', error);
    } finally {
      setCheckingRegulatory(false);
    }
  };

  const hasMissingLicenses = licenseRequirements.some((l) => l.isRequired && !l.isProvided);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): (keyof FormValues)[] => {
    switch (step) {
      case 0:
        return ['orderId'];
      case 1:
        return ['hsCode', 'goodsDescription', 'quantity', 'declaredValue', 'originCountry', 'destinationCountry', 'currency'];
      case 2:
        return [];
      default:
        return [];
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (hasMissingLicenses) return;

    try {
      const declarationData: Partial<CustomsDeclaration> = {
        hsCode: values.hsCode,
        goodsDescription: values.goodsDescription,
        quantity: values.quantity,
        declaredValue: values.declaredValue,
        currency: values.currency,
        originCountry: values.originCountry,
        destinationCountry: values.destinationCountry,
        regulatoryConditions,
        requiredLicenses: licenseRequirements,
        status: hasMissingLicenses ? 'license_missing' : 'ready_to_submit',
      };

      const newDeclaration = await createDeclaration(values.orderId, declarationData);
      navigate(`/customs/declarations/${newDeclaration.id}`);
    } catch (error) {
      console.error('创建报关单失败:', error);
    }
  };

  const orderOptions: SelectOption[] = orders.map((o) => ({
    value: o.id,
    label: `${o.orderNo} - ${o.goodsDescription}`,
  }));

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="提示" message="请选择要关联的订单，系统将自动带入商品信息。" />
            <div className="max-w-2xl">
              <Controller
                name="orderId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="选择订单"
                    placeholder="请选择关联订单"
                    options={orderOptions}
                    error={errors.orderId?.message}
                    {...field}
                  />
                )}
              />
            </div>

            {selectedOrder && (
              <Card>
                <Card.Header>
                  <h4 className="font-semibold text-gray-900">订单信息预览</h4>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">订单号</span>
                      <span className="font-medium">{selectedOrder.orderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">状态</span>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">商品名称</span>
                      <span className="font-medium">{selectedOrder.goodsDescription}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">HS编码</span>
                      <span className="font-mono text-sm">{selectedOrder.hsCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">数量</span>
                      <span className="font-medium">{selectedOrder.quantity} {selectedOrder.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">金额</span>
                      <span className="font-medium">{selectedOrder.currency} {selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="提示" message="请确认并完善商品信息，确保申报数据准确无误。" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="hsCode"
                control={control}
                render={({ field }) => (
                  <Input
                    label="HS编码"
                    placeholder="请输入HS编码，如84713000"
                    error={errors.hsCode?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="goodsDescription"
                control={control}
                render={({ field }) => (
                  <Input
                    label="商品名称"
                    placeholder="请填写商品名称"
                    error={errors.goodsDescription?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <Input
                    label="数量"
                    type="number"
                    placeholder="请输入数量"
                    error={errors.quantity?.message}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="declaredValue"
                control={control}
                render={({ field }) => (
                  <Input
                    label="申报价值"
                    type="number"
                    placeholder="请输入申报价值"
                    error={errors.declaredValue?.message}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="originCountry"
                control={control}
                render={({ field }) => (
                  <Select
                    label="原产国"
                    placeholder="请选择原产国"
                    options={countryOptions}
                    error={errors.originCountry?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="destinationCountry"
                control={control}
                render={({ field }) => (
                  <Select
                    label="目的国"
                    placeholder="请选择目的国"
                    options={countryOptions}
                    error={errors.destinationCountry?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select
                    label="币种"
                    placeholder="请选择币种"
                    options={currencyOptions}
                    error={errors.currency?.message}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="监管条件检查" message="系统正在根据HS编码和原产国自动检测监管条件和许可证要求。" />

            {checkingRegulatory ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                正在检测监管条件...
              </div>
            ) : (
              <>
                <Card>
                  <Card.Header>
                    <h4 className="font-semibold text-gray-900">监管条件</h4>
                  </Card.Header>
                  <Card.Body className="space-y-3">
                    {regulatoryConditions.length > 0 ? (
                      regulatoryConditions.map((condition, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                              condition.isCompliant ? 'bg-green-500' : 'bg-red-500'
                            )}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="primary" dot>
                                {condition.code}
                              </Badge>
                              <span className="font-medium text-gray-900">{condition.name}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{condition.description}</p>
                          </div>
                          <Badge variant={condition.isCompliant ? 'success' : 'danger'}>
                            {condition.isCompliant ? '符合' : '不符合'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        无特殊监管条件
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">许可证要求</h4>
                    {hasMissingLicenses && (
                      <Badge variant="danger" dot>
                        缺失许可证
                      </Badge>
                    )}
                  </Card.Header>
                  <Card.Body className="space-y-3">
                    {licenseRequirements.length > 0 ? (
                      licenseRequirements.map((license, index) => (
                        <div
                          key={index}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg',
                            license.isRequired && !license.isProvided ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                              !license.isRequired
                                ? 'bg-gray-400'
                                : license.isProvided
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            )}
                          >
                            {license.isRequired ? (
                              license.isProvided ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-white" />
                              )
                            ) : (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{license.licenseName}</span>
                              <Badge variant={license.isRequired ? 'danger' : 'neutral'}>
                                {license.isRequired ? '需要' : '不需要'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">类型: {license.licenseType}</p>
                            {license.licenseNo && (
                              <p className="mt-1 text-sm text-gray-600">许可证号: {license.licenseNo}</p>
                            )}
                            {license.expiryDate && (
                              <p className="mt-1 text-sm text-gray-600">
                                有效期至: {format(new Date(license.expiryDate), 'yyyy-MM-dd')}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              !license.isRequired
                                ? 'neutral'
                                : license.isProvided
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {!license.isRequired ? '无需提供' : license.isProvided ? '已提供' : '未提供'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        无许可证要求
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {hasMissingLicenses && (
                  <Alert variant="error" title="许可证缺失" message="部分必需的许可证尚未提供，请先完善许可证信息后再提交报关单。您可以前往许可证管理页面上传相关许可证。" />
                )}
              </>
            )}
          </div>
        );

      case 3:
        const values = getValues();
        return (
          <div className="space-y-6">
            <Alert variant="info" title="请确认报关单信息" message="请仔细核对以下报关单信息，确认无误后提交。" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h4 className="font-semibold text-gray-900">基本信息</h4>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">关联订单</span>
                    <span className="font-medium">{selectedOrder?.orderNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">原产国</span>
                    <span className="font-medium">{values.originCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">目的国</span>
                    <span className="font-medium">{values.destinationCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">币种</span>
                    <span className="font-medium">{values.currency}</span>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h4 className="font-semibold text-gray-900">商品信息</h4>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">HS编码</span>
                    <span className="font-mono text-sm font-medium">{values.hsCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品名称</span>
                    <span className="font-medium">{values.goodsDescription}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">数量</span>
                    <span className="font-medium">{values.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">申报价值</span>
                    <span className="font-medium">{values.currency} {values.declaredValue.toLocaleString()}</span>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <Card>
              <Card.Header className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">监管条件与许可证</h4>
                {hasMissingLicenses && (
                  <Badge variant="danger" dot>
                    许可证缺失
                  </Badge>
                )}
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">监管条件检查</span>
                    <div className="mt-1">
                      <Badge
                        variant={regulatoryConditions.every((c) => c.isCompliant) ? 'success' : 'danger'}
                      >
                        {regulatoryConditions.every((c) => c.isCompliant) ? '全部符合' : '存在不符合项'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">许可证检查</span>
                    <div className="mt-1">
                      <Badge variant={hasMissingLicenses ? 'danger' : 'success'}>
                        {hasMissingLicenses ? '缺失许可证' : '全部齐全'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {hasMissingLicenses && (
              <Alert variant="error" title="无法提交" message="由于存在缺失的许可证，暂无法提交报关单。请先在许可证管理中完善相关许可证。" />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="录入报关单"
      subTitle="按步骤填写报关单信息，系统将自动检查监管条件"
      breadcrumb={[
        { title: '报关行工作台' },
        { title: '报关单管理', href: '/customs/declarations' },
        { title: '录入报关单', active: true },
      ]}
      extra={
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/customs/declarations')}>
          返回列表
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted && 'bg-green-500 border-green-500 text-white',
                        isActive && 'bg-blue-500 border-blue-500 text-white',
                        !isCompleted && !isActive && 'bg-white border-gray-300 text-gray-400'
                      )}
                    >
                      {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={cn('mt-2 text-sm font-medium', isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400')}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn('flex-1 h-1 mx-4 rounded', isCompleted ? 'bg-green-500' : 'bg-gray-200')} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <Card>
          <Card.Body className="min-h-96">
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStepContent()}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  上一步
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNext}
                  >
                    下一步
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={hasMissingLicenses}
                  >
                    提交报关单
                  </Button>
                )}
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </PageContainer>
  );
}
