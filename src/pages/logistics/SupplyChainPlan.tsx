import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, Calendar, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select, { type SelectOption } from '@/components/Select';
import Alert from '@/components/Alert';
import Table, { type TableColumn } from '@/components/Table';
import { StatusBadge } from '@/components/business';
import { useLogisticsStore } from '@/store';
import { LogisticsService } from '@/services';
import type { Shipment, SupplyChainPlan as ISupplyChainPlan, PlanItem, ShipmentStatus } from '@/types';
import { format, addHours, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlanActivity {
  id: string;
  activity: string;
  originalDate: string;
  revisedDate: string;
  responsibleParty: string;
  isChanged: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export default function SupplyChainPlan() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();
  const { shipments, currentShipment, getShipment, getShipments, checkShipmentDelay, recalculateSupplyChainPlan } = useLogisticsStore();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(paramId || '');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [delayHours, setDelayHours] = useState(0);
  const [supplyChainPlan, setSupplyChainPlan] = useState<ISupplyChainPlan | null>(null);
  const [planActivities, setPlanActivities] = useState<PlanActivity[]>([]);

  useEffect(() => {
    getShipments();
  }, []);

  useEffect(() => {
    if (selectedShipmentId) {
      loadShipmentData();
    }
  }, [selectedShipmentId]);

  const loadShipmentData = async () => {
    if (!selectedShipmentId) return;
    setLoading(true);
    try {
      const shipment = await getShipment(selectedShipmentId);
      if (shipment) {
        const delayResult = await checkShipmentDelay(selectedShipmentId);
        setDelayHours(delayResult.delayHours);
        generatePlanActivities(shipment, delayResult.delayHours);

        if (shipment.supplyChainPlan) {
          setSupplyChainPlan(shipment.supplyChainPlan);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlanActivities = (shipment: Shipment, delay: number) => {
    const baseTime = new Date(shipment.createdAt);
    const delayMs = delay * 60 * 60 * 1000;

    const defaultActivities: PlanActivity[] = [
      {
        id: '1',
        activity: '装货完成',
        originalDate: shipment.segments[0]?.estimatedDepartureTime || baseTime.toISOString(),
        revisedDate: addHours(new Date(shipment.segments[0]?.estimatedDepartureTime || baseTime), delay).toISOString(),
        responsibleParty: '物流商',
        isChanged: delay > 0,
        status: shipment.segments[0]?.status || 'pending',
      },
      {
        id: '2',
        activity: '海运启运',
        originalDate: shipment.segments.find(s => s.segmentType === 'ocean_freight')?.estimatedDepartureTime || addHours(baseTime, 3 * 24).toISOString(),
        revisedDate: addHours(new Date(shipment.segments.find(s => s.segmentType === 'ocean_freight')?.estimatedDepartureTime || addHours(baseTime, 3 * 24)), delay).toISOString(),
        responsibleParty: '物流商',
        isChanged: delay > 0,
        status: shipment.segments.find(s => s.segmentType === 'ocean_freight')?.status || 'pending',
      },
      {
        id: '3',
        activity: '到港',
        originalDate: shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay).toISOString(),
        responsibleParty: '物流商',
        isChanged: delay > 0,
        status: shipment.segments[shipment.segments.length - 1]?.status || 'pending',
      },
      {
        id: '4',
        activity: '清关申报',
        originalDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), 24).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay + 24).toISOString(),
        responsibleParty: '报关行',
        isChanged: delay > 0,
        status: 'pending',
      },
      {
        id: '5',
        activity: '海关放行',
        originalDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), 72).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay + 72).toISOString(),
        responsibleParty: '报关行',
        isChanged: delay > 0,
        status: 'pending',
      },
      {
        id: '6',
        activity: '仓储入库',
        originalDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), 96).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay + 96).toISOString(),
        responsibleParty: '仓储服务商',
        isChanged: delay > 0,
        status: 'pending',
      },
      {
        id: '7',
        activity: '配送安排',
        originalDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), 120).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay + 120).toISOString(),
        responsibleParty: '配送商',
        isChanged: delay > 0,
        status: 'pending',
      },
      {
        id: '8',
        activity: '最终送达',
        originalDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), 168).toISOString(),
        revisedDate: addHours(new Date(shipment.segments[shipment.segments.length - 1]?.estimatedArrivalTime || addHours(baseTime, 20 * 24)), delay + 168).toISOString(),
        responsibleParty: '配送商',
        isChanged: delay > 0,
        status: 'pending',
      },
    ];

    setPlanActivities(defaultActivities);
  };

  const handleRecalculate = async () => {
    if (!selectedShipmentId) return;
    setRecalculating(true);
    try {
      const delayResult = await checkShipmentDelay(selectedShipmentId);
      setDelayHours(delayResult.delayHours);

      const plan = await recalculateSupplyChainPlan(selectedShipmentId, delayResult.delayHours);
      setSupplyChainPlan(plan);

      if (currentShipment) {
        generatePlanActivities(currentShipment, delayResult.delayHours);
      }
    } catch (error) {
      console.error('重新计算计划失败:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const shipmentOptions: SelectOption[] = shipments.map((s) => ({
    value: s.id,
    label: `${s.id} - ${s.containerNo}`,
  }));

  const isDelayed = delayHours > 24;

  const columns: TableColumn<PlanActivity>[] = [
    {
      title: '环节',
      dataIndex: 'activity',
      key: 'activity',
      width: 140,
      render: (value) => (
        <span className="font-medium text-gray-900">{value as string}</span>
      ),
    },
    {
      title: '责任方',
      dataIndex: 'responsibleParty',
      key: 'responsibleParty',
      width: 100,
      render: (value) => (
        <span className="text-gray-600">{value as string}</span>
      ),
    },
    {
      title: '原始计划时间',
      dataIndex: 'originalDate',
      key: 'originalDate',
      width: 160,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd HH:mm')}
        </span>
      ),
    },
    {
      title: isDelayed ? '修订后时间' : '计划时间',
      dataIndex: 'revisedDate',
      key: 'revisedDate',
      width: 160,
      render: (value, record) => (
        <span className={cn(
          'font-medium',
          record.isChanged ? 'text-orange-600' : 'text-gray-900'
        )}>
          {format(new Date(value as string), 'yyyy-MM-dd HH:mm')}
          {record.isChanged && (
            <span className="ml-1 text-xs text-orange-500">(调整)</span>
          )}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => {
        const status = value as string;
        const isCompleted = status === 'completed';
        const isInProgress = status === 'in_progress';
        const isDelayedStatus = status === 'delayed';
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
            isCompleted && 'bg-green-100 text-green-700',
            isInProgress && 'bg-blue-100 text-blue-700',
            isDelayedStatus && 'bg-red-100 text-red-700',
            !isCompleted && !isInProgress && !isDelayedStatus && 'bg-gray-100 text-gray-600'
          )}>
            {isCompleted ? '已完成' : isInProgress ? '进行中' : isDelayedStatus ? '延误' : '待处理'}
          </span>
        );
      },
    },
  ];

  const renderGanttChart = () => {
    if (planActivities.length === 0) return null;

    const minDate = new Date(Math.min(...planActivities.map(a => new Date(a.originalDate).getTime())));
    const maxDate = new Date(Math.max(...planActivities.map(a => new Date(a.revisedDate).getTime())));
    const totalHours = differenceInHours(maxDate, minDate) || 1;

    const getBarPosition = (date: string) => {
      const hours = differenceInHours(new Date(date), minDate);
      return (hours / totalHours) * 100;
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{format(minDate, 'MM-dd')}</span>
          <span>{format(new Date((minDate.getTime() + maxDate.getTime()) / 2), 'MM-dd')}</span>
          <span>{format(maxDate, 'MM-dd')}</span>
        </div>
        {planActivities.map((activity) => {
          const originalStart = getBarPosition(activity.originalDate);
          const revisedStart = getBarPosition(activity.revisedDate);
          const barWidth = Math.max(8, 100 / planActivities.length * 0.6);

          return (
            <div key={activity.id} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600 truncate" title={activity.activity}>
                {activity.activity}
              </div>
              <div className="flex-1 relative h-8 bg-gray-100 rounded">
                <div
                  className="absolute top-1 h-6 bg-blue-200 rounded opacity-60"
                  style={{
                    left: `${originalStart}%`,
                    width: `${barWidth}%`,
                  }}
                />
                <div
                  className={cn(
                    'absolute top-1 h-6 rounded flex items-center justify-center text-xs text-white font-medium',
                    activity.isChanged ? 'bg-orange-500' : 'bg-blue-500'
                  )}
                  style={{
                    left: `${revisedStart}%`,
                    width: `${barWidth}%`,
                  }}
                >
                  {activity.isChanged && <RefreshCw className="w-3 h-3 mr-1" />}
                  {activity.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {activity.status === 'delayed' && <XCircle className="w-3 h-3 mr-1" />}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded opacity-60" />
            <span className="text-sm text-gray-600">原始计划</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">当前计划</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-sm text-gray-600">调整后计划</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title="供应链计划"
      subTitle="管理和调整供应链各环节的时间计划"
      breadcrumb={[
        { title: '物流商工作台' },
        { title: '运输管理', href: '/logistics/shipments' },
        { title: '供应链计划', active: true },
      ]}
      extra={
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/logistics/shipments')}>
          返回列表
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">选择运输单</h3>
          </Card.Header>
          <Card.Body>
            <div className="max-w-md">
              <Select
                label="运输单"
                placeholder="请选择运输单"
                options={shipmentOptions}
                value={selectedShipmentId}
                onChange={(e) => setSelectedShipmentId(e.target.value)}
              />
            </div>
          </Card.Body>
        </Card>

        {selectedShipmentId && currentShipment && (
          <>
            <Card>
              <Card.Header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isDelayed ? '原始计划 & 修订计划' : '原始计划'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {isDelayed && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">延误 {delayHours} 小时</span>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleRecalculate}
                    loading={recalculating}
                  >
                    重新计算
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {isDelayed && (
                  <Alert
                    variant="warning"
                    title="计划已调整"
                    message={`由于运输延误 ${delayHours} 小时，系统已自动调整后续各环节的计划时间。请核对并确认。`}
                    className="mb-6"
                  />
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={planActivities}
                    rowKey="id"
                    pagination={false}
                  />
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">计划对比图表</h3>
                </div>
                {supplyChainPlan && (
                  <div className="text-sm text-gray-500">
                    最后修订: {format(new Date(supplyChainPlan.revisedAt), 'yyyy-MM-dd HH:mm')}
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                    <span className="text-gray-500">加载中...</span>
                  </div>
                ) : (
                  renderGanttChart()
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">运输单信息</h3>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">运输单号</div>
                    <div className="font-mono font-medium text-gray-900">{currentShipment.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">集装箱号</div>
                    <div className="font-mono font-medium text-gray-900">{currentShipment.containerNo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">船名航次</div>
                    <div className="font-medium text-gray-900">{currentShipment.vesselName} {currentShipment.voyageNo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">当前状态</div>
                    <StatusBadge status={currentShipment.status as ShipmentStatus} />
                  </div>
                </div>

                {supplyChainPlan && supplyChainPlan.reason && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">调整原因：</span>
                      {supplyChainPlan.reason}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {!selectedShipmentId && (
          <Card>
            <Card.Body className="py-16 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">请选择运输单查看供应链计划</p>
            </Card.Body>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
