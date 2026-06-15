import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Copy, Download, FileText, Send, Check, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Timeline from '@/components/Timeline';
import { StatusBadge } from '@/components/business';
import Alert from '@/components/Alert';
import { useCustomsStore } from '@/store';
import { CustomsService } from '@/services';
import type { CustomsDeclaration, RegulatoryCondition, LicenseRequirement } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DeclarationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDeclaration, getDeclaration, generateDeclarationMessage, updateDeclaration } = useCustomsStore();
  const [declaration, setDeclaration] = useState<CustomsDeclaration | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');
  const [messageFormat, setMessageFormat] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeclaration();
    }
  }, [id]);

  const loadDeclaration = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getDeclaration(id);
      setDeclaration(data);
    } catch (error) {
      console.error('加载报关单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!id) return;
    setGeneratingMessage(true);
    try {
      const result = await CustomsService.generateDeclarationMessage(id);
      setMessageContent(result.messageContent);
      setMessageFormat(result.messageFormat);
      await generateDeclarationMessage(id);
    } catch (error) {
      console.error('生成报文失败:', error);
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!messageContent) return;
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleDownloadMessage = () => {
    if (!messageContent) return;
    const blob = new Blob([messageContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaration_${declaration?.declarationNo || id}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!id || !declaration) return;
    try {
      await updateDeclaration(id, { status: 'submitted' });
      loadDeclaration();
    } catch (error) {
      console.error('提交报关单失败:', error);
    }
  };

  const hasMissingLicenses = declaration?.requiredLicenses?.some((l) => l.isRequired && !l.isProvided);

  const historyItems = declaration
    ? [
        {
          time: format(new Date(declaration.createdAt), 'yyyy-MM-dd HH:mm'),
          title: '报关单创建',
          description: `报关单 ${declaration.declarationNo} 已创建`,
          color: 'bg-blue-500',
        },
        ...(declaration.status !== 'draft'
          ? [
              {
                time: format(new Date(declaration.updatedAt), 'yyyy-MM-dd HH:mm'),
                title: '状态更新',
                description: `报关单状态更新为 ${declaration.status}`,
                color: declaration.status === 'submitted' ? 'bg-primary-500' : declaration.status === 'cleared' ? 'bg-green-500' : declaration.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500',
              },
            ]
          : []),
      ]
    : [];

  const renderRegulatoryCondition = (condition: RegulatoryCondition, index: number) => (
    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          condition.isCompliant ? 'bg-green-500' : 'bg-red-500'
        )}
      >
        <Check className="w-4 h-4 text-white" />
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
  );

  const renderLicenseRequirement = (license: LicenseRequirement, index: number) => {
    const isExpiringSoon = license.expiryDate
      ? new Date(license.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
      : false;
    const isExpired = license.expiryDate ? new Date(license.expiryDate).getTime() < Date.now() : false;

    return (
      <div
        key={index}
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg',
          license.isRequired && !license.isProvided ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
        )}
      >
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            !license.isRequired
              ? 'bg-gray-400'
              : license.isProvided
              ? isExpired
                ? 'bg-red-500'
                : isExpiringSoon
                ? 'bg-yellow-500'
                : 'bg-green-500'
              : 'bg-red-500'
          )}
        >
          {license.isRequired ? (
            license.isProvided ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )
          ) : (
            <Check className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{license.licenseName}</span>
            <Badge variant={license.isRequired ? 'danger' : 'neutral'}>
              {license.isRequired ? '需要' : '不需要'}
            </Badge>
            {isExpired && license.isProvided && (
              <Badge variant="danger" dot>
                已过期
              </Badge>
            )}
            {isExpiringSoon && !isExpired && license.isProvided && (
              <Badge variant="warning" dot>
                即将过期
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">类型: {license.licenseType}</p>
          {license.licenseNo && (
            <p className="mt-1 text-sm text-gray-600">许可证号: {license.licenseNo}</p>
          )}
          {license.expiryDate && (
            <p
              className={cn(
                'mt-1 text-sm',
                isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-yellow-600 font-medium' : 'text-gray-600'
              )}
            >
              有效期至: {format(new Date(license.expiryDate), 'yyyy-MM-dd')}
            </p>
          )}
        </div>
        <Badge
          variant={
            !license.isRequired
              ? 'neutral'
              : license.isProvided
              ? isExpired
                ? 'danger'
                : 'success'
              : 'danger'
          }
        >
          {!license.isRequired ? '无需提供' : license.isProvided ? (isExpired ? '已过期' : '已提供') : '未提供'}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer title="加载中..." subTitle="正在加载报关单详情">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
          加载中...
        </div>
      </PageContainer>
    );
  }

  if (!declaration) {
    return (
      <PageContainer title="报关单不存在" subTitle="未找到对应的报关单信息">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">报关单不存在或已被删除</p>
          <Button variant="primary" onClick={() => navigate('/customs/declarations')}>
            返回列表
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={
        <div className="flex items-center gap-3">
          <span>{declaration.declarationNo}</span>
          <StatusBadge status={declaration.status} />
        </div>
      }
      subTitle="报关单详情信息"
      breadcrumb={[
        { title: '报关行工作台' },
        { title: '报关单管理', href: '/customs/declarations' },
        { title: declaration.declarationNo, active: true },
      ]}
      extra={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/customs/declarations')}
          >
            返回列表
          </Button>
          <Button
            variant="secondary"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/customs/declarations/${id}/edit`)}
          >
            编辑
          </Button>
          {declaration.status === 'ready_to_submit' && (
            <Button
              variant="primary"
              icon={<Send className="w-4 h-4" />}
              onClick={handleSubmit}
              disabled={hasMissingLicenses}
            >
              提交报关
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <h4 className="font-semibold text-gray-900">基本信息</h4>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">报关单号</span>
                  <span className="font-medium text-gray-900">{declaration.declarationNo}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">关联订单</span>
                  <span className="font-medium text-blue-600 cursor-pointer hover:underline">
                    {declaration.orderId}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">状态</span>
                  <StatusBadge status={declaration.status} />
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">创建时间</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(declaration.createdAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">原产国</span>
                  <span className="font-medium text-gray-900">{declaration.originCountry}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">目的国</span>
                  <span className="font-medium text-gray-900">{declaration.destinationCountry}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">币种</span>
                  <span className="font-medium text-gray-900">{declaration.currency}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">更新时间</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(declaration.updatedAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h4 className="font-semibold text-gray-900">商品明细</h4>
            </Card.Header>
            <Card.Body>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">HS编码</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">商品名称</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">数量</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">申报价值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border font-mono">{declaration.hsCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border">{declaration.goodsDescription}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border text-right">{declaration.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border text-right font-medium">
                        {declaration.currency} {declaration.declaredValue.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h4 className="font-semibold text-gray-900">监管条件</h4>
            </Card.Header>
            <Card.Body className="space-y-3">
              {declaration.regulatoryConditions?.length > 0 ? (
                declaration.regulatoryConditions.map((condition, index) =>
                  renderRegulatoryCondition(condition, index)
                )
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
              {hasMissingLicenses && (
                <Alert
                  variant="error"
                  title="许可证缺失"
                  message="部分必需的许可证尚未提供，请先完善许可证信息后再提交报关单。"
                />
              )}
              {declaration.requiredLicenses?.length > 0 ? (
                declaration.requiredLicenses.map((license, index) =>
                  renderLicenseRequirement(license, index)
                )
              ) : (
                <div className="text-center py-6 text-gray-500">
                  无许可证要求
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">报关报文预览</h4>
              <div className="flex items-center gap-2">
                {!messageContent ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={handleGenerateMessage}
                    loading={generatingMessage}
                  >
                    生成报文
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      onClick={handleCopyMessage}
                    >
                      {copied ? '已复制' : '复制'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={handleDownloadMessage}
                    >
                      下载
                    </Button>
                  </>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {messageContent ? (
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                    {messageContent}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <Badge variant="primary">{messageFormat}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>点击"生成报文"按钮生成报关报文</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h4 className="font-semibold text-gray-900">申报历史</h4>
            </Card.Header>
            <Card.Body>
              {historyItems.length > 0 ? (
                <Timeline items={historyItems} />
              ) : (
                <div className="text-center py-6 text-gray-500">
                  暂无申报历史
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
