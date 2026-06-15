import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Package, Ship, Navigation, Check } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Alert from '@/components/Alert';
import { useLogisticsStore, useOrderStore } from '@/store';
import { LogisticsService } from '@/services';
import type { ShipmentSegment, Shipment } from '@/types';
import { cn } from '@/lib/utils';

const segmentTypeOptions: SelectOption[] = [
  { value: 'loading', label: '装货' },
  { value: 'ocean_freight', label: '海运' },
  { value: 'transshipment', label: '中转' },
  { value: 'discharging', label: '卸货' },
  { value: 'inland_transport', label: '内陆运输' },
];

const containerTypeOptions: SelectOption[] = [
  { value: '20GP', label: '20GP 普通柜' },
  { value: '40GP', label: '40GP 普通柜' },
  { value: '40HQ', label: '40HQ 高柜' },
  { value: '45HQ', label: '45HQ 高柜' },
  { value: '20RF', label: '20RF 冷藏柜' },
  { value: '40RF', label: '40RF 冷藏柜' },
];

const formSchema = z.object({
  orderId: z.string().min(1, '请选择关联订单'),
  containerNo: z.string().min(1, '请填写集装箱号'),
  sealNo: z.string().min(1, '请填写封条号'),
  containerType: z.string().min(1, '请选择箱型'),
  containerSize: z.string().min(1, '请填写尺寸'),
  vesselName: z.string().min(1, '请填写船名'),
  voyageNo: z.string().min(1, '请填写航次'),
  segments: z.array(
    z.object({
      id: z.string().optional(),
      segmentType: z.string().min(1, '请选择航段类型'),
      fromPort: z.string().min(1, '请填写装货港'),
      toPort: z.string().min(1, '请填写卸货港'),
      estimatedDepartureTime: z.string().min(1, '请选择预计出发时间'),
      estimatedArrivalTime: z.string().min(1, '请选择预计到达时间'),
      status: z.string().default('pending'),
    })
  ).min(1, '至少需要一个航段'),
});

type FormValues = z.infer<typeof formSchema>;

const generateId = () => `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function ShipmentNew() {
  const navigate = useNavigate();
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const { createShipment } = useLogisticsStore();
  const [loading, setLoading] = useState(false);
  const { orders } = useOrderStore();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const orderOptions: SelectOption[] = orders.map((order) => ({
    value: order.id,
    label: `${order.orderNo} - ${order.goodsDescription}`,
  }));

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: paramOrderId || '',
      containerNo: '',
      sealNo: '',
      containerType: '',
      containerSize: '',
      vesselName: '',
      voyageNo: '',
      segments: [
        {
          id: generateId(),
          segmentType: 'loading',
          fromPort: '',
          toPort: '',
          estimatedDepartureTime: '',
          estimatedArrivalTime: '',
          status: 'pending',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'segments',
  });

  const addSegment = () => {
    append({
      id: generateId(),
      segmentType: 'ocean_freight',
      fromPort: '',
      toPort: '',
      estimatedDepartureTime: '',
      estimatedArrivalTime: '',
      status: 'pending',
    });
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const segments: ShipmentSegment[] = values.segments.map((seg) => ({
        id: seg.id || generateId(),
        segmentType: seg.segmentType as any,
        fromLocation: { name: seg.fromPort, country: '' },
        toLocation: { name: seg.toPort, country: '' },
        estimatedDepartureTime: seg.estimatedDepartureTime,
        estimatedArrivalTime: seg.estimatedArrivalTime,
        status: seg.status as any,
      }));

      const shipmentData: Partial<Shipment> = {
        containerNo: values.containerNo,
        vesselName: values.vesselName,
        voyageNo: values.voyageNo,
        status: 'pending',
        segments,
      };

      await createShipment(values.orderId, shipmentData);
      setSubmitSuccess(true);

      setTimeout(() => {
        navigate('/logistics/shipments');
      }, 1500);
    } catch (error) {
      console.error('创建运输单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <PageContainer
        title="新增运输"
        subTitle="创建新的运输单"
        breadcrumb={[
          { title: '物流商工作台' },
          { title: '运输管理', href: '/logistics/shipments' },
          { title: '新增运输', active: true },
        ]}
      >
        <div className="max-w-4xl mx-auto">
          <Card>
            <Card.Body className="py-16 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">运输单创建成功</h3>
              <p className="text-gray-600">正在跳转至运输列表...</p>
            </Card.Body>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="新增运输"
      subTitle="创建新的运输单，安排货物运输"
      breadcrumb={[
        { title: '物流商工作台' },
        { title: '运输管理', href: '/logistics/shipments' },
        { title: '新增运输', active: true },
      ]}
      extra={
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/logistics/shipments')}>
          返回列表
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">选择订单</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <Controller
                name="orderId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="关联订单"
                    placeholder="请选择关联的订单"
                    options={orderOptions}
                    error={errors.orderId?.message}
                    {...field}
                  />
                )}
              />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">集装箱信息</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="containerNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="集装箱号"
                      placeholder="请填写集装箱号，如MSKU1234567"
                      error={errors.containerNo?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="sealNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="封条号"
                      placeholder="请填写封条号"
                      error={errors.sealNo?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="containerType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="箱型"
                      placeholder="请选择箱型"
                      options={containerTypeOptions}
                      error={errors.containerType?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="containerSize"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="尺寸 (长×宽×高，米)"
                      placeholder="如 6.058×2.438×2.591"
                      error={errors.containerSize?.message}
                      {...field}
                    />
                  )}
                />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">船舶信息</h3>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="vesselName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="船名"
                      placeholder="请填写船名，如中远之星"
                      error={errors.vesselName?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="voyageNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="航次"
                      placeholder="请填写航次，如V202606W"
                      error={errors.voyageNo?.message}
                      {...field}
                    />
                  )}
                />
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">航段信息</h3>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={addSegment}
              >
                添加航段
              </Button>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" title="提示" message="请按运输顺序添加航段，系统将按顺序计算运输时间。" className="mb-4" />

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} variant="outlined" shadow={false}>
                    <Card.Header className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          'bg-blue-100 text-blue-600'
                        )}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">航段 {index + 1}</span>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          onClick={() => remove(index)}
                        >
                          删除
                        </Button>
                      )}
                    </Card.Header>
                    <Card.Body>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                          name={`segments.${index}.segmentType`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              label="航段类型"
                              placeholder="请选择航段类型"
                              options={segmentTypeOptions}
                              error={errors.segments?.[index]?.segmentType?.message}
                              {...field}
                            />
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Controller
                            name={`segments.${index}.fromPort`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="装货港"
                                placeholder="如上海"
                                error={errors.segments?.[index]?.fromPort?.message}
                                {...field}
                              />
                            )}
                          />
                          <Controller
                            name={`segments.${index}.toPort`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="卸货港"
                                placeholder="如洛杉矶"
                                error={errors.segments?.[index]?.toPort?.message}
                                {...field}
                              />
                            )}
                          />
                        </div>
                        <Controller
                          name={`segments.${index}.estimatedDepartureTime`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="datetime-local"
                              label="预计出发时间"
                              error={errors.segments?.[index]?.estimatedDepartureTime?.message}
                              {...field}
                            />
                          )}
                        />
                        <Controller
                          name={`segments.${index}.estimatedArrivalTime`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="datetime-local"
                              label="预计到达时间"
                              error={errors.segments?.[index]?.estimatedArrivalTime?.message}
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {errors.segments && !Array.isArray(errors.segments) && (
                <p className="mt-2 text-sm text-red-600">{errors.segments.message}</p>
              )}
            </Card.Body>
          </Card>

          <div className="flex justify-end gap-4 pb-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/logistics/shipments')}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              提交运输单
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
