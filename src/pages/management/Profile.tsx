import { useState } from 'react';
import {
  User,
  Building2,
  Shield,
  Bell,
  Settings,
  Lock,
  Smartphone,
  Mail,
  Moon,
  Sun,
  Globe,
  LayoutDashboard,
  Eye,
  EyeOff,
  Check,
  Save,
  Camera,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Tabs from '@/components/Tabs';
import type { TabsItem } from '@/components/Tabs';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roleLabels: Record<UserRole, string> = {
  importer: '进口商',
  exporter: '出口商',
  customs: '报关员',
  logistics: '物流商',
  finance: '财务',
  management: '管理层',
};

const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const viewOptions = [
  { value: 'dashboard', label: '绩效看板' },
  { value: 'orders', label: '订单列表' },
  { value: 'reports', label: '报表中心' },
];

interface FormData {
  username: string;
  email: string;
  phone: string;
  companyName: string;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface PreferenceSettings {
  theme: string;
  language: string;
  defaultView: string;
}

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('basic');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
  });

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'light',
    language: 'zh-CN',
    defaultView: 'dashboard',
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    setTimeout(() => {
      alert('基本信息已保存');
      setSaving(false);
    }, 1000);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      alert('密码修改成功');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setSaving(false);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    alert('通知设置已保存');
  };

  const handleSavePreferences = () => {
    alert('偏好设置已保存');
  };

  const handleToggleTwoFA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    alert(twoFAEnabled ? '双因素认证已关闭' : '双因素认证已开启');
  };

  const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );

  const profileTabs: TabsItem[] = [
    {
      key: 'basic',
      label: (
        <span className="flex items-center gap-2">
          <User className="h-4 w-4" />
          基本信息
        </span>
      ),
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="请输入用户名"
            />
            <Input
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
            />
            <Input
              label="手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
            />
            <Input
              label="公司名称"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="请输入公司名称"
              disabled
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSaveBasicInfo}
              loading={saving}
            >
              保存修改
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          安全设置
        </span>
      ),
      children: (
        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">修改密码</h4>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="当前密码"
                  type={showOldPassword ? 'text' : 'password'}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="请输入当前密码"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="新密码"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="请输入新密码"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="确认新密码"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="请再次输入新密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="primary"
                icon={<Lock className="h-4 w-4" />}
                onClick={handleChangePassword}
                loading={saving}
              >
                修改密码
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">双因素认证</h4>
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">手机验证码</p>
                  <p className="text-sm text-gray-500">登录时需要输入手机验证码</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleTwoFA}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  twoFAEnabled ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    twoFAEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          通知设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <ToggleSwitch
                label="消息推送"
                enabled={notifications.pushEnabled}
                onChange={() => setNotifications({ ...notifications, pushEnabled: !notifications.pushEnabled })}
              />
              <p className="text-sm text-gray-500">接收系统消息和业务通知推送</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <ToggleSwitch
                label="邮件通知"
                enabled={notifications.emailEnabled}
                onChange={() => setNotifications({ ...notifications, emailEnabled: !notifications.emailEnabled })}
              />
              <p className="text-sm text-gray-500">接收重要业务邮件通知</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSaveNotifications}
            >
              保存设置
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'preferences',
      label: (
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          偏好设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">主题</label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, theme: option.value })}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      preferences.theme === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {option.value === 'light' && <Sun className="h-4 w-4" />}
                    {option.value === 'dark' && <Moon className="h-4 w-4" />}
                    {option.value === 'system' && <Settings className="h-4 w-4" />}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Select
              label="语言"
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              options={languageOptions}
            />
            <Select
              label="默认视图"
              value={preferences.defaultView}
              onChange={(e) => setPreferences({ ...preferences, defaultView: e.target.value })}
              options={viewOptions}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSavePreferences}
            >
              保存偏好
            </Button>
          </div>
        </div>
      ),
    },
  ];

  if (!user) {
    return <div className="flex items-center justify-center h-full">请先登录</div>;
  }

  return (
    <PageContainer
      title="个人中心"
      subTitle="管理您的个人信息和系统设置"
      breadcrumb={[
        { title: '首页', href: '/' },
        { title: '个人中心' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <Card.Body className="text-center">
              <div className="relative inline-block">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-24 w-24 rounded-full border-4 border-white shadow-lg mx-auto"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">{user.username}</h3>
              <p className="mt-1 text-sm text-gray-500">{roleLabels[user.role]}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{user.companyName}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">128</p>
                    <p className="text-xs text-gray-500">处理订单</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">98%</p>
                    <p className="text-xs text-gray-500">完成率</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">15</p>
                    <p className="text-xs text-gray-500">本月</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <Card.Body className="p-0">
              <Tabs
                items={profileTabs}
                activeKey={activeTab}
                onChange={setActiveTab}
              />
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
