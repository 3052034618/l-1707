import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, FileText, Calculator, Package, Info } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Alert from '@/components/Alert';
import { useOrderStore, useLetterOfCreditStore } from '@/store';
import { OrderService } from '@/services';
import type { TradeTerm, Order } from '@/types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  tradeTerm: z.string().min(1, '请选择贸易术语'),
  exporterId: z.string().min(1, '请选择出口商'),
  exporterName: z.string().min(1, '请填写出口商名称'),
  originCountry: z.string().min(1, '请选择原产国'),
  destinationCountry: z.string().min(1, '请选择目的国'),
  hsCode: z.string().min(1, '请填写HS编码'),
  goodsDescription: z.string().min(1, '请填写商品名称'),
  quantity: z.number().min(1, '数量必须大于0'),
  unit: z.string().min(1, '请填写单位'),
  weight: z.number().min(0, '重量不能为负数'),
  volume: z.number().min(0, '体积不能为负数'),
  unitPrice: z.number().min(0, '单价不能为负数'),
  currency: z.string().min(1, '请选择币种'),
  generateLC: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { key: 'basic', label: '基本信息', icon: Info },
  { key: 'goods', label: '商品信息', icon: Package },
  { key: 'tariff', label: '关税计算', icon: Calculator },
  { key: 'confirm', label: '确认提交', icon: FileText },
];

const tradeTermOptions: SelectOption[] = [
  { value: 'FOB', label: 'FOB 船上交货' },
  { value: 'CIF', label: 'CIF 成本加保险费加运费' },
  { value: 'CFR', label: 'CFR 成本加运费' },
  { value: 'EXW', label: 'EXW 工厂交货' },
  { value: 'FCA', label: 'FCA 货交承运人' },
  { value: 'CPT', label: 'CPT 运费付至' },
  { value: 'CIP', label: 'CIP 运费和保险费付至' },
  { value: 'DAP', label: 'DAP 目的地交货' },
  { value: 'DPU', label: 'DPU 卸货地交货' },
  { value: 'DDP', label: 'DDP 完税后交货' },
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
  { value: '菲律宾', label: '菲律宾' },
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

const exporterOptions: SelectOption[] = [
  { value: 'exp_001', label: 'ABC贸易有限公司' },
  { value: 'exp_002', label: 'XYZ进出口公司' },
  { value: 'exp_003', label: 'Global Trading Co., Ltd.' },
  { value: 'exp_004', label: 'Pacific Exports Inc.' },
];

const unitOptions: SelectOption[] = [
  { value: '件', label: '件' },
  { value: '台', label: '台' },
  { value: '套', label: '套' },
  { value: '箱', label: '箱' },
  { value: '千克', label: '千克' },
  { value: '吨', label: '吨' },
  { value: '立方米', label: '立方米' },
];

const hsCodeSuggestions = [
  { code: '84713000', name: '便携式自动数据处理设备' },
  { code: '85258013', name: '智能手机' },
  { code: '85423100', name: '集成电路' },
  { code: '84151021', name: '空调机' },
  { code: '87032341', label: '小轿车', name: '小轿车' },
  { code: '85171210', name: '电话机' },
];

interface TariffResult {
  normalRate: number;
  normalAmount: number;
  mfnRate: number;
  mfnAmount: number;
  preferentialRate?: number;
  preferentialAmount?: number;
  tradeAgreement?: string;
  vatRate: number;
  vatAmount: number;
  consumptionTaxRate: number;
  consumptionTaxAmount: number;
  totalTax: number;
}

export default function OrderNew() {
  const navigate = useNavigate();
  const { createOrder, loading } = useOrderStore();
  const { generateDraft: generateLCDraft } = useLetterOfCreditStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [tariffResult, setTariffResult] = useState<TariffResult | null>(null);
  const [hsSuggestions, setHsSuggestions] = useState<typeof hsCodeSuggestions>([]);
  const [showHsSuggestions, setShowHsSuggestions] = useState(false);

  const { control, handleSubmit, watch, formState: { errors }, getValues, trigger, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tradeTerm: '',
      exporterId: '',
      exporterName: '',
      originCountry: '',
      destinationCountry: '中国',
      hsCode: '',
      goodsDescription: '',
      quantity: 1,
      unit: '件',
      weight: 0,
      volume: 0,
      unitPrice: 0,
      currency: 'USD',
      generateLC: false,
    },
  });

  const watchHsCode = watch('hsCode');
  const watchQuantity = watch('quantity');
  const watchUnitPrice = watch('unitPrice');
  const watchOriginCountry = watch('originCountry');
  const watchDestinationCountry = watch('destinationCountry');

  const totalAmount = watchQuantity * watchUnitPrice;

  React.useEffect(() => {
    if (watchHsCode && watchHsCode.length >= 2) {
      const filtered = hsCodeSuggestions.filter((s) =>
        s.code.includes(watchHsCode) || s.name.toLowerCase().includes(watchHsCode.toLowerCase())
      );
      setHsSuggestions(filtered);
      setShowHsSuggestions(filtered.length > 0);
    } else {
      setHsSuggestions([]);
      setShowHsSuggestions(false);
    }
  }, [watchHsCode]);

  React.useEffect(() => {
    if (currentStep === 2 && watchHsCode && watchOriginCountry && totalAmount > 0) {
      calculateTariff();
    }
  }, [currentStep, watchHsCode, watchOriginCountry, totalAmount]);

  const calculateTariff = async () => {
    const values = getValues();
    try {
      const result = await OrderService.calculateTariff(
        values.hsCode,
        values.originCountry,
        values.destinationCountry,
        totalAmount
      );

      const normalRate = (result.rate * 1.5) || 20;
      const normalAmount = Number((totalAmount * normalRate / 100).toFixed(2));
      const mfnRate = result.rate;
      const mfnAmount = result.amount;
      const vatRate = 13;
      const vatAmount = Number(((totalAmount + mfnAmount) * vatRate / 100).toFixed(2));
      const consumptionTaxRate = 0;
      const consumptionTaxAmount = 0;
      const totalTax = Number((mfnAmount + vatAmount + consumptionTaxAmount).toFixed(2));

      setTariffResult({
        normalRate,
        normalAmount,
        mfnRate,
        mfnAmount,
        preferentialRate: result.preferentialRate,
        preferentialAmount: result.preferentialAmount,
        tradeAgreement: result.tradeAgreement,
        vatRate,
        vatAmount,
        consumptionTaxRate,
        consumptionTaxAmount,
        totalTax,
      });
    } catch (error) {
      console.error('关税计算失败:', error);
    }
  };

  const handleHsSelect = (code: string, name: string) => {
    setValue('hsCode', code);
    if (!getValues('goodsDescription')) {
      setValue('goodsDescription', name);
    }
    setShowHsSuggestions(false);
  };

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
        return ['tradeTerm', 'exporterId', 'exporterName', 'originCountry', 'destinationCountry'];
      case 1:
        return ['hsCode', 'goodsDescription', 'quantity', 'unit', 'weight', 'volume', 'unitPrice', 'currency'];
      case 2:
        return [];
      default:
        return [];
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const orderData: Partial<Order> = {
        tradeTerm: values.tradeTerm as TradeTerm,
        exporterId: values.exporterId,
        originCountry: values.originCountry,
        destinationCountry: values.destinationCountry,
        hsCode: values.hsCode,
        goodsDescription: values.goodsDescription,
        quantity: values.quantity,
        unit: values.unit,
        weight: values.weight,
        volume: values.volume,
        totalAmount: totalAmount,
        currency: values.currency,
        tariffRate: tariffResult?.mfnRate,
        tariffAmount: tariffResult?.mfnAmount,
        status: values.generateLC ? 'pending_confirmation' : 'draft',
      };

      const newOrder = await createOrder(orderData);

      if (values.generateLC) {
        await generateLCDraft(newOrder.id);
      }

      navigate(`/importer/orders/${newOrder.id}`);
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="提示" message="请填写订单的基本信息，包括贸易术语、出口商和国家信息。" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="tradeTerm"
                control={control}
                render={({ field }) => (
                  <Select
                    label="贸易术语"
                    placeholder="请选择贸易术语"
                    options={tradeTermOptions}
                    error={errors.tradeTerm?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="exporterId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="出口商"
                    placeholder="请选择出口商"
                    options={exporterOptions}
                    error={errors.exporterId?.message}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      const selected = exporterOptions.find((opt) => opt.value === e.target.value);
                      if (selected) {
                        setValue('exporterName', selected.label);
                      }
                    }}
                  />
                )}
              />
              <Controller
                name="exporterName"
                control={control}
                render={({ field }) => (
                  <Input
                    label="出口商名称"
                    placeholder="请填写出口商名称"
                    error={errors.exporterName?.message}
                    {...field}
                  />
                )}
              />
              <div />
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
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="提示" message="请填写商品的详细信息，包括HS编码、数量、重量等。" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Controller
                  name="hsCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="HS编码"
                      placeholder="请输入HS编码，如84713000"
                      error={errors.hsCode?.message}
                      {...field}
                      onFocus={() => watchHsCode && setShowHsSuggestions(hsSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowHsSuggestions(false), 200)}
                    />
                  )}
                />
                {showHsSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {hsSuggestions.map((item) => (
                      <div
                        key={item.code}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleHsSelect(item.code, item.name)}
                      >
                        <div className="font-medium text-gray-900">{item.code}</div>
                        <div className="text-sm text-gray-500">{item.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select
                    label="单位"
                    placeholder="请选择单位"
                    options={unitOptions}
                    error={errors.unit?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <Input
                    label="重量 (千克)"
                    type="number"
                    placeholder="请输入重量"
                    error={errors.weight?.message}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="volume"
                control={control}
                render={({ field }) => (
                  <Input
                    label="体积 (立方米)"
                    type="number"
                    placeholder="请输入体积"
                    error={errors.volume?.message}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              <Controller
                name="unitPrice"
                control={control}
                render={({ field }) => (
                  <Input
                    label="单价"
                    type="number"
                    placeholder="请输入单价"
                    error={errors.unitPrice?.message}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">总金额：</span>
                <span className="text-xl font-bold text-gray-900">
                  {getValues('currency')} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Alert variant="info" title="关税计算" message="系统已根据您填写的商品信息自动计算关税，请核对计算结果。" />
            {tariffResult ? (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">税率类型</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税率</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税额 ({getValues('currency')})</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border font-medium">普通税率</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 border">{tariffResult.normalRate}%</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 border">{tariffResult.normalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500 border">未享受任何优惠</td>
                      </tr>
                      <tr className="hover:bg-gray-50 bg-blue-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900 border font-medium">最惠国税率</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 border font-semibold">{tariffResult.mfnRate}%</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 border font-semibold">{tariffResult.mfnAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-center text-blue-600 border">WTO成员适用</td>
                      </tr>
                      {tariffResult.preferentialRate !== undefined && (
                        <tr className="hover:bg-gray-50 bg-green-50/50">
                          <td className="px-4 py-3 text-sm text-gray-900 border font-medium">协定税率</td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 border font-semibold">{tariffResult.preferentialRate}%</td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 border font-semibold">{tariffResult.preferentialAmount?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-center text-green-600 border">{tariffResult.tradeAgreement}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Card>
                  <Card.Header>
                    <h4 className="text-lg font-semibold text-gray-900">税费明细</h4>
                  </Card.Header>
                  <Card.Body className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">货值</span>
                      <span className="font-medium">{getValues('currency')} {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">进口关税 ({tariffResult.mfnRate}%)</span>
                      <span className="font-medium">{getValues('currency')} {tariffResult.mfnAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">进口增值税 ({tariffResult.vatRate}%)</span>
                      <span className="font-medium">{getValues('currency')} {tariffResult.vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">消费税 ({tariffResult.consumptionTaxRate}%)</span>
                      <span className="font-medium">{getValues('currency')} {tariffResult.consumptionTaxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-gray-50 rounded-lg px-4 -mx-4">
                      <span className="text-lg font-semibold text-gray-900">税费合计</span>
                      <span className="text-lg font-bold text-red-600">{getValues('currency')} {tariffResult.totalTax.toLocaleString()}</span>
                    </div>
                  </Card.Body>
                </Card>

                {tariffResult.preferentialRate !== undefined && tariffResult.preferentialRate < tariffResult.mfnRate && (
                  <Alert variant="success" title="可享受优惠税率" message={`根据${tariffResult.tradeAgreement}，您的订单可享受${tariffResult.preferentialRate}%的协定税率，比最惠国税率节省 ${getValues('currency')} ${(tariffResult.mfnAmount - (tariffResult.preferentialAmount || 0)).toLocaleString()}。`} />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                正在计算关税...
              </div>
            )}
          </div>
        );
      case 3:
        const values = getValues();
        return (
          <div className="space-y-6">
            <Alert variant="info" title="请确认订单信息" message="请仔细核对以下订单信息，确认无误后提交订单。" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <h4 className="font-semibold text-gray-900">基本信息</h4>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">贸易术语</span>
                    <span className="font-medium">{tradeTermOptions.find((o) => o.value === values.tradeTerm)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">出口商</span>
                    <span className="font-medium">{values.exporterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">原产国</span>
                    <span className="font-medium">{values.originCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">目的国</span>
                    <span className="font-medium">{values.destinationCountry}</span>
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
                    <span className="font-medium">{values.hsCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品名称</span>
                    <span className="font-medium">{values.goodsDescription}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">数量</span>
                    <span className="font-medium">{values.quantity} {values.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">单价</span>
                    <span className="font-medium">{values.currency} {values.unitPrice.toLocaleString()}</span>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <Card>
              <Card.Header>
                <h4 className="font-semibold text-gray-900">费用汇总</h4>
              </Card.Header>
              <Card.Body className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">货值</span>
                  <span className="font-medium">{values.currency} {totalAmount.toLocaleString()}</span>
                </div>
                {tariffResult && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">进口关税</span>
                      <span className="font-medium">{values.currency} {tariffResult.mfnAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">进口增值税</span>
                      <span className="font-medium">{values.currency} {tariffResult.vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">预计总成本</span>
                      <span className="text-xl font-bold text-red-600">{values.currency} {(totalAmount + tariffResult.totalTax).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Controller
                name="generateLC"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="generateLC"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <label htmlFor="generateLC" className="ml-3">
                <span className="font-medium text-gray-900">生成信用证草稿</span>
                <p className="text-sm text-gray-500">勾选后将自动生成信用证草稿，待出口商确认后生效</p>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="创建订单"
      subTitle="按步骤填写订单信息，系统将自动计算关税"
      breadcrumb={[
        { title: '进口商工作台' },
        { title: '订单管理', href: '/importer/orders' },
        { title: '创建订单', active: true },
      ]}
      extra={
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/importer/orders')}>
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
                  <Button type="submit" variant="primary" loading={loading}>
                    提交订单
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
