import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, FileCheck, Calendar, Copy, Download, Eye, Edit2, Trash2, Link, X, Check } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Table, { type TableColumn } from '@/components/Table';
import { StatusBadge } from '@/components/business';
import Alert from '@/components/Alert';
import { useCustomsStore } from '@/store';
import type { CustomsDeclaration, License } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function LicenseManagement() {
  const navigate = useNavigate();
  const { declarations, licenses, loading, getDeclarations, getLicenses, addLicense, updateLicense, deleteLicense, associateLicenseToDeclaration } = useCustomsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'warnings' | 'library'>('warnings');
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    licenseType: '',
    licenseName: '',
    licenseNo: '',
    issueDate: '',
    expiryDate: '',
    holder: '',
    issuingAuthority: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([getDeclarations(), getLicenses()]);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const missingLicenseDeclarations = declarations.filter((d) =>
    d.requiredLicenses?.some((l) => l.isRequired && !l.isProvided)
  );

  const expiringCount = licenses.filter((l) => l.status === 'expiring_soon').length;
  const expiredCount = licenses.filter((l) => l.status === 'expired').length;

  const getStatusBadge = (status: License['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>有效</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning" dot>即将过期</Badge>;
      case 'expired':
        return <Badge variant="danger" dot>已过期</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = Date.now();
    const expiry = new Date(expiryDate).getTime();
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleOpenAddModal = (license?: License) => {
    if (license) {
      setEditingLicense(license);
      setFormData({
        licenseType: license.licenseType,
        licenseName: license.licenseName,
        licenseNo: license.licenseNo,
        issueDate: license.issueDate ? license.issueDate.split('T')[0] : '',
        expiryDate: license.expiryDate ? license.expiryDate.split('T')[0] : '',
        holder: license.holder,
        issuingAuthority: license.issuingAuthority,
      });
    } else {
      setEditingLicense(null);
      setFormData({
        licenseType: '',
        licenseName: '',
        licenseNo: '',
        issueDate: '',
        expiryDate: '',
        holder: '',
        issuingAuthority: '',
      });
    }
    setShowAddModal(true);
  };

  const handleSaveLicense = async () => {
    try {
      if (editingLicense) {
        await updateLicense(editingLicense.id, {
          ...formData,
          issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        });
      } else {
        await addLicense({
          ...formData,
          issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        });
      }
      setShowAddModal(false);
      setEditingLicense(null);
      getLicenses();
    } catch (error) {
      console.error('保存许可证失败:', error);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (window.confirm('确定要删除这个许可证吗？')) {
      try {
        await deleteLicense(id);
        getLicenses();
      } catch (error) {
        console.error('删除许可证失败:', error);
      }
    }
  };

  const handleOpenAssociateModal = (licenseId: string) => {
    setSelectedLicenseId(licenseId);
    setSelectedDeclarationId(null);
    setShowAssociateModal(true);
  };

  const handleAssociate = async () => {
    if (!selectedLicenseId || !selectedDeclarationId) return;
    
    try {
      await associateLicenseToDeclaration(selectedLicenseId, selectedDeclarationId);
      setShowAssociateModal(false);
      setSelectedLicenseId(null);
      setSelectedDeclarationId(null);
      await Promise.all([getDeclarations(), getLicenses()]);
    } catch (error) {
      console.error('关联许可证失败:', error);
    }
  };

  const warningColumns: TableColumn<CustomsDeclaration>[] = [
    {
      title: '报关单号',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
      width: 180,
      render: (value) => (
        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {value as string}
        </span>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'goodsDescription',
      key: 'goodsDescription',
      render: (value) => (
        <span className="text-gray-700 truncate block max-w-xs" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      title: 'HS编码',
      dataIndex: 'hsCode',
      key: 'hsCode',
      width: 120,
      render: (value) => (
        <span className="font-mono text-sm text-gray-700">{value as string}</span>
      ),
    },
    {
      title: '缺失许可证',
      dataIndex: 'requiredLicenses',
      key: 'missingLicenses',
      render: (value, record) => {
        const reqLicenses = value as any[];
        const missing = reqLicenses?.filter((l) => l.isRequired && !l.isProvided) || [];
        const availableLicenses = licenses.filter((l) => 
          l.status === 'active' && 
          missing.some((m) => m.licenseType === l.licenseType) &&
          !l.declarationIds.includes(record.id)
        );
        return (
          <div className="flex flex-wrap gap-1">
            {missing.map((l, i) => (
              <Badge key={i} variant="danger" dot>
                {l.licenseType}
              </Badge>
            ))}
          </div>
        );
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
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 120,
      render: (value, record) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => navigate(`/customs/declarations/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const licenseColumns: TableColumn<License>[] = [
    {
      title: '许可证类型',
      dataIndex: 'licenseType',
      key: 'licenseType',
      width: 140,
      render: (value) => (
        <span className="font-medium text-gray-900">{value as string}</span>
      ),
    },
    {
      title: '许可证名称',
      dataIndex: 'licenseName',
      key: 'licenseName',
      render: (value) => (
        <span className="text-gray-700">{value as string}</span>
      ),
    },
    {
      title: '许可证编号',
      dataIndex: 'licenseNo',
      key: 'licenseNo',
      width: 200,
      render: (value) => (
        <span className="font-mono text-sm text-gray-700">{value as string}</span>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 200,
      render: (value, record) => {
        const days = getDaysUntilExpiry(value as string);
        return (
          <div>
            <span
              className={cn(
                'font-medium',
                record.status === 'expired'
                  ? 'text-red-600'
                  : record.status === 'expiring_soon'
                  ? 'text-yellow-600'
                  : 'text-gray-900'
              )}
            >
              {format(new Date(record.issueDate), 'yyyy-MM-dd')} ~ {format(new Date(value as string), 'yyyy-MM-dd')}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {record.status === 'expired'
                ? `已过期 ${Math.abs(days)} 天`
                : record.status === 'expiring_soon'
                ? `还剩 ${days} 天过期`
                : `还剩 ${days} 天`}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => getStatusBadge(value as License['status']),
    },
    {
      title: '关联报关单',
      dataIndex: 'declarationIds',
      key: 'declarationIds',
      width: 100,
      render: (value) => (
        <span className="text-gray-600 text-sm">
          {(value as string[]).length} 份
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 220,
      render: (value, record) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => navigator.clipboard.writeText(record.licenseNo)}
            title="复制编号"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            title="下载证书"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Link className="w-4 h-4" />}
            onClick={() => handleOpenAssociateModal(record.id)}
            title="关联报关单"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleOpenAddModal(record)}
            title="编辑"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => handleDeleteLicense(record.id)}
            title="删除"
          />
        </div>
      ),
    },
  ];

  const availableDeclarations = missingLicenseDeclarations.filter((d) => {
    if (!selectedLicenseId) return false;
    const license = licenses.find((l) => l.id === selectedLicenseId);
    if (!license) return false;
    return d.requiredLicenses?.some(
      (l) => l.isRequired && !l.isProvided && l.licenseType === license.licenseType
    );
  });

  return (
    <PageContainer
      title="许可证管理"
      subTitle="管理进出口许可证，监控有效期，及时处理缺失许可证的报关单"
      breadcrumb={[
        { title: '报关行工作台' },
        { title: '许可证管理', active: true },
      ]}
      extra={
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenAddModal()}
        >
          新增许可证
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理预警</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {missingLicenseDeclarations.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">即将过期</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{expiringCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已过期</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{expiredCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-4">
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === 'warnings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              onClick={() => setActiveTab('warnings')}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                预警列表
                {missingLicenseDeclarations.length > 0 && (
                  <Badge variant="danger" count={missingLicenseDeclarations.length} />
                )}
              </div>
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === 'library'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              onClick={() => setActiveTab('library')}
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                许可证库
              </div>
            </button>
          </div>
        </Card.Header>
        <Card.Body>
          {activeTab === 'warnings' ? (
            <div className="space-y-4">
              {missingLicenseDeclarations.length > 0 ? (
                <>
                  <Alert
                    variant="error"
                    title="许可证缺失预警"
                    message={`共有 ${missingLicenseDeclarations.length} 份报关单缺少必需的许可证，请及时处理。`}
                  />
                  <Table
                    columns={warningColumns}
                    dataSource={missingLicenseDeclarations}
                    loading={loading}
                    rowKey="id"
                    onRowClick={(record) => navigate(`/customs/declarations/${record.id}`)}
                    pagination={false}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <FileCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">暂无许可证缺失预警</h4>
                  <p className="text-gray-500">所有报关单的许可证均已齐全</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {expiringCount > 0 && (
                <Alert
                  variant="warning"
                  title="许可证即将过期提醒"
                  message={`有 ${expiringCount} 个许可证即将在30天内过期，请及时办理续期。`}
                />
              )}
              {expiredCount > 0 && (
                <Alert
                  variant="error"
                  title="许可证已过期提醒"
                  message={`有 ${expiredCount} 个许可证已过期，相关报关单可能无法正常申报。`}
                />
              )}
              <Table
                columns={licenseColumns}
                dataSource={licenses}
                loading={loading}
                rowKey="id"
                pagination={false}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingLicense ? '编辑许可证' : '新增许可证'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLicense(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">许可证类型</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：3C认证、进口许可证"
                  value={formData.licenseType}
                  onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">许可证名称</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入许可证名称"
                  value={formData.licenseName}
                  onChange={(e) => setFormData({ ...formData, licenseName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">许可证编号</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入许可证编号"
                  value={formData.licenseNo}
                  onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签发日期</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期至</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">持证单位</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入持证单位名称"
                  value={formData.holder}
                  onChange={(e) => setFormData({ ...formData, holder: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发证机关</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入发证机关"
                  value={formData.issuingAuthority}
                  onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上传证书文件</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <FileCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                setEditingLicense(null);
              }}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveLicense}
                icon={<Check className="w-4 h-4" />}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAssociateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">关联报关单</h3>
              <button
                onClick={() => {
                  setShowAssociateModal(false);
                  setSelectedLicenseId(null);
                  setSelectedDeclarationId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                选择要关联的报关单（仅显示缺少此类型许可证的报关单）
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableDeclarations.length > 0 ? (
                  availableDeclarations.map((declaration) => (
                    <div
                      key={declaration.id}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-colors',
                        selectedDeclarationId === declaration.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setSelectedDeclarationId(declaration.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{declaration.declarationNo}</p>
                          <p className="text-sm text-gray-500">{declaration.goodsDescription}</p>
                        </div>
                        {selectedDeclarationId === declaration.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {declaration.requiredLicenses
                          ?.filter((l) => l.isRequired && !l.isProvided)
                          .map((l, i) => (
                            <Badge key={i} variant="danger" dot>
                              {l.licenseType}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无可关联的报关单
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => {
                setShowAssociateModal(false);
                setSelectedLicenseId(null);
                setSelectedDeclarationId(null);
              }}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleAssociate}
                disabled={!selectedDeclarationId}
                icon={<Link className="w-4 h-4" />}
              >
                确认关联
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
