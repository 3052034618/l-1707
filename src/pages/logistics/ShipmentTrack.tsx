import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Navigation, Clock, Ship, Package, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Timeline, { type TimelineItem } from '@/components/Timeline';
import { StatusBadge } from '@/components/business';
import Alert from '@/components/Alert';
import { useLogisticsStore } from '@/store';
import { LogisticsService } from '@/services';
import type { Shipment, ShipmentSegment, ShipmentStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const segmentTypeLabels: Record<string, string> = {
  loading: '装货',
  ocean_freight: '海运',
  transshipment: '中转',
  discharging: '卸货',
  inland_transport: '内陆运输',
};

export default function ShipmentTrack() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentShipment, getShipment, checkShipmentDelay, updateShipment } = useLogisticsStore();
  const [loading, setLoading] = useState(true);
  const [checkingDelay, setCheckingDelay] = useState(false);
  const [delayInfo, setDelayInfo] = useState<{ isDelayed: boolean; delayHours: number; reason?: string } | null>(null);
  const [vesselLocation, setVesselLocation] = useState<{ name: string; country: string; latitude?: number; longitude?: number } | null>(null);

  useEffect(() => {
    if (id) {
      loadShipment();
    }
  }, [id]);

  const loadShipment = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const shipment = await getShipment(id);
      if (shipment) {
        const location = await LogisticsService.getVesselLocation(shipment.vesselName);
        setVesselLocation(location);
      }
    } catch (error) {
      console.error('加载运输单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDelay = async () => {
    if (!id) return;
    setCheckingDelay(true);
    try {
      const result = await checkShipmentDelay(id);
      setDelayInfo(result);
      if (result.isDelayed && result.delayHours > 24) {
        await updateShipment(id, { isDelayed: true, delayHours: result.delayHours, delayReason: result.reason, status: 'delayed' });
      }
    } catch (error) {
      console.error('检查延误失败:', error);
    } finally {
      setCheckingDelay(false);
    }
  };

  const getSegmentTimelineItems = (segments: ShipmentSegment[]): TimelineItem[] => {
    return segments.map((segment) => {
      const isCompleted = segment.status === 'completed';
      const isInProgress = segment.status === 'in_progress';
      const isDelayed = segment.status === 'delayed';

      let dotColor = 'bg-gray-400';
      if (isCompleted) dotColor = 'bg-green-500';
      else if (isInProgress) dotColor = 'bg-blue-500';
      else if (isDelayed) dotColor = 'bg-red-500';

      const statusLabel = isCompleted ? '已完成' : isInProgress ? '进行中' : isDelayed ? '延误' : '待处理';

      const estimatedTime = `${format(new Date(segment.estimatedDepartureTime), 'MM-dd HH:mm')} - ${format(new Date(segment.estimatedArrivalTime), 'MM-dd HH:mm')}`;
      const actualTime = segment.actualDepartureTime && segment.actualArrivalTime
        ? `${format(new Date(segment.actualDepartureTime), 'MM-dd HH:mm')} - ${format(new Date(segment.actualArrivalTime), 'MM-dd HH:mm')}`
        : segment.actualDepartureTime
        ? `${format(new Date(segment.actualDepartureTime), 'MM-dd HH:mm')} - 进行中`
        : '尚未开始';

      return {
        time: (
          <div className="space-y-1">
            <div className="font-medium text-xs text-gray-500">预计: {estimatedTime}</div>
            <div className={cn(
              'text-xs',
              isCompleted ? 'text-green-600' : isInProgress ? 'text-blue-600' : isDelayed ? 'text-red-600' : 'text-gray-400'
            )}>
              实际: {actualTime}
            </div>
          </div>
        ),
        title: (
          <div className="flex items-center gap-2">
            <span className="font-medium">{segmentTypeLabels[segment.segmentType] || segment.segmentType}</span>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              isCompleted && 'bg-green-100 text-green-700',
              isInProgress && 'bg-blue-100 text-blue-700',
              isDelayed && 'bg-red-100 text-red-700',
              !isCompleted && !isInProgress && !isDelayed && 'bg-gray-100 text-gray-600'
            )}>
              {statusLabel}
            </span>
          </div>
        ),
        description: (
          <div className="text-sm text-gray-500">
            {segment.fromLocation.name} → {segment.toLocation.name}
          </div>
        ),
        color: dotColor,
      };
    });
  };

  const renderMap = (shipment: Shipment) => {
    const ports = shipment.segments.map((seg, index) => ({
      id: index,
      name: seg.fromLocation.name,
      x: (index / shipment.segments.length) * 100,
      y: 50 + Math.sin(index * 1.5) * 15,
      status: seg.status,
    }));

    if (shipment.segments.length > 0) {
      const lastSeg = shipment.segments[shipment.segments.length - 1];
      ports.push({
        id: shipment.segments.length,
        name: lastSeg.toLocation.name,
        x: 100,
        y: 50 + Math.sin(shipment.segments.length * 1.5) * 15,
        status: lastSeg.status === 'completed' ? 'completed' : 'pending',
      });
    }

    const currentPortIndex = shipment.segments.findIndex(
      (seg) => seg.status === 'in_progress' || seg.status === 'delayed'
    );

    return (
      <div className="relative w-full h-48 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <path
            d={`M ${ports.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}`}
            stroke="url(#routeGradient)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4,4"
            className="animate-pulse"
          />
          {ports.map((port, index) => {
            const isCurrent = currentPortIndex === index;
            const isCompleted = port.status === 'completed';
            return (
              <g key={port.id}>
                <circle
                  cx={port.x}
                  cy={port.y}
                  r={isCurrent ? 4 : 3}
                  fill={isCurrent ? '#EF4444' : isCompleted ? '#22C55E' : '#9CA3AF'}
                  stroke="white"
                  strokeWidth="1"
                />
                {isCurrent && (
                  <circle
                    cx={port.x}
                    cy={port.y}
                    r="6"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4">
          {ports.map((port) => (
            <div
              key={port.id}
              className={cn(
                'text-xs font-medium',
                currentPortIndex === port.id ? 'text-red-600' : port.status === 'completed' ? 'text-green-600' : 'text-gray-500'
              )}
            >
              {port.name}
            </div>
          ))}
        </div>
        {currentPortIndex >= 0 && (
          <div
            className="absolute transition-all duration-500"
            style={{
              left: `${ports[currentPortIndex].x}%`,
              top: `${ports[currentPortIndex].y - 10}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <Ship className="w-6 h-6 text-red-500 drop-shadow-lg" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer
        title="物流追踪"
        breadcrumb={[
          { title: '物流商工作台' },
          { title: '运输管理', href: '/logistics/shipments' },
          { title: '物流追踪', active: true },
        ]}
        extra={
          <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/logistics/shipments')}>
            返回列表
          </Button>
        }
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-3" />
          <span className="text-gray-500">加载中...</span>
        </div>
      </PageContainer>
    );
  }

  if (!currentShipment) {
    return (
      <PageContainer
        title="物流追踪"
        breadcrumb={[
          { title: '物流商工作台' },
          { title: '运输管理', href: '/logistics/shipments' },
          { title: '物流追踪', active: true },
        ]}
        extra={
          <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/logistics/shipments')}>
            返回列表
          </Button>
        }
      >
        <div className="text-center py-20">
          <p className="text-gray-500">运输单不存在</p>
        </div>
      </PageContainer>
    );
  }

  const shipment = currentShipment;
  const timelineItems = getSegmentTimelineItems(shipment.segments);
  const showDelayAlert = delayInfo?.isDelayed && delayInfo.delayHours > 24;

  return (
    <PageContainer
      title="物流追踪"
      subTitle={`运输单号: ${shipment.id}`}
      breadcrumb={[
        { title: '物流商工作台' },
        { title: '运输管理', href: '/logistics/shipments' },
        { title: '物流追踪', active: true },
      ]}
      extra={
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/logistics/shipments')}>
          返回列表
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">运输概览</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">运输单号</div>
                  <div className="font-mono font-medium text-gray-900">{shipment.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">集装箱号</div>
                  <div className="font-mono font-medium text-gray-900">{shipment.containerNo}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">船名</div>
                  <div className="font-medium text-gray-900">{shipment.vesselName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">当前状态</div>
                  <StatusBadge status={shipment.status as ShipmentStatus} />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">航线示意图</h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadShipment}
              >
                刷新位置
              </Button>
            </Card.Header>
            <Card.Body>
              {renderMap(shipment)}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">航段时间轴</h3>
              <Button
                variant="primary"
                size="sm"
                icon={<AlertTriangle className="w-4 h-4" />}
                onClick={handleCheckDelay}
                loading={checkingDelay}
              >
                CheckShipmentDelay
              </Button>
            </Card.Header>
            <Card.Body>
              {showDelayAlert && (
                <Alert
                  variant="error"
                  title="延误警报"
                  message={`检测到运输延误 ${delayInfo.delayHours} 小时${delayInfo.reason ? `，原因：${delayInfo.reason}` : ''}`}
                  className="mb-6"
                />
              )}

              <Timeline items={timelineItems} mode="left" />
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">集装箱信息</h3>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">集装箱号</div>
                  <div className="font-mono font-medium">{shipment.containerNo}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Ship className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">船舶信息</div>
                  <div className="font-medium">{shipment.vesselName}</div>
                  <div className="text-sm text-gray-500">航次: {shipment.voyageNo}</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">船舶动态</h3>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">最近更新</div>
                  <div className="font-medium">{format(new Date(shipment.updatedAt), 'yyyy-MM-dd HH:mm:ss')}</div>
                </div>
              </div>
              {vesselLocation && (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">当前位置</div>
                      <div className="font-medium">{vesselLocation.name}, {vesselLocation.country}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">经纬度</div>
                      <div className="font-mono text-sm">
                        {vesselLocation.latitude?.toFixed(4)}°N, {vesselLocation.longitude?.toFixed(4)}°E
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">航向</div>
                    <div className="font-medium">{Math.floor(Math.random() * 360)}°</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">航速</div>
                    <div className="font-medium">{(10 + Math.random() * 15).toFixed(1)} 节</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate(`/logistics/shipments/${shipment.id}/plan`)}
              >
                查看供应链计划
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
