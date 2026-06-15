import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Globe, Eye, EyeOff, Building2, User, Lock, ShieldCheck, CheckCircle2, FileCheck, Truck, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Select from '@/components/Select';

const loginSchema = z.object({
  companyName: z.string().min(1, '请输入企业名称'),
  username: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  role: z.enum(['importer', 'exporter', 'customs', 'logistics', 'finance', 'management'], {
    required_error: '请选择角色',
  }),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const roleOptions = [
  { value: 'importer', label: '进口商' },
  { value: 'exporter', label: '出口商' },
  { value: 'customs', label: '报关行' },
  { value: 'logistics', label: '物流商' },
  { value: 'finance', label: '财务人员' },
  { value: 'management', label: '管理层' },
];

const demoAccounts = [
  { role: '进口商', username: 'importer01', password: '任意密码' },
  { role: '出口商', username: 'exporter01', password: '任意密码' },
  { role: '报关行', username: 'customs01', password: '任意密码' },
  { role: '物流商', username: 'logistics01', password: '任意密码' },
  { role: '财务人员', username: 'finance01', password: '任意密码' },
  { role: '管理层', username: 'manager01', password: '任意密码' },
];

const features = [
  { icon: ShieldCheck, title: '智能关税计算', description: '自动匹配HS编码与税率' },
  { icon: FileCheck, title: '单证自动校验', description: 'AI识别单证一致性' },
  { icon: Truck, title: '实时物流追踪', description: '全程可视化监控' },
  { icon: DollarSign, title: '财务自动结算', description: '多币种自动对账' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const savedCompanyName = localStorage.getItem('savedCompanyName') || '';
  const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyName: savedCompanyName,
      username: '',
      password: '',
      role: undefined,
      rememberMe: savedRememberMe,
    },
  });

  const rememberMe = watch('rememberMe');

  useEffect(() => {
    if (savedCompanyName) {
      setValue('companyName', savedCompanyName);
    }
  }, [savedCompanyName, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    try {
      const success = await login(data.username, data.password, data.role as UserRole);
      if (success) {
        if (data.rememberMe) {
          localStorage.setItem('savedCompanyName', data.companyName);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('savedCompanyName');
          localStorage.removeItem('rememberMe');
        }
        navigate('/dashboard');
      } else {
        setLoginError('账号或角色不匹配，请检查后重试');
      }
    } catch (error) {
      setLoginError('登录失败，请稍后重试');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 hidden md:flex relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
              <Globe className="w-10 h-10 text-accent-400" />
            </div>
            <h1 className="text-3xl font-bold font-serif-sc mb-3 text-shadow">
              国际贸易综合服务平台
            </h1>
            <p className="text-lg text-blue-200 mb-12">
              全程订单与单证协同管理
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white bg-opacity-5 backdrop-blur-sm rounded-xl border border-white border-opacity-10"
                >
                  <div className="w-10 h-10 bg-accent-400 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-blue-200">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-8 text-sm text-blue-300 opacity-75">
            © 2026 国际贸易综合服务平台 v1.0
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8">
            <div className="md:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mr-3">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-700">国际贸易综合服务平台</h1>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">欢迎回来</h2>
              <p className="text-neutral-500">请登录您的账号</p>
            </div>

            {loginError && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-danger-500 text-white flex items-center justify-center text-xs flex-shrink-0">!</span>
                {loginError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="企业名称"
                placeholder="请输入企业名称"
                icon={<Building2 className="w-4 h-4" />}
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Input
                label="账号"
                placeholder="请输入账号"
                icon={<User className="w-4 h-4" />}
                error={errors.username?.message}
                {...register('username')}
              />

              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                icon={<Lock className="w-4 h-4" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <Select
                label="角色选择"
                placeholder="请选择您的角色"
                options={roleOptions}
                error={errors.role?.message}
                {...register('role')}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  {...register('rememberMe')}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-neutral-600 cursor-pointer select-none"
                >
                  记住我
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? '登录中...' : '登 录'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                演示账号信息
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="p-2 bg-neutral-50 rounded-lg border border-neutral-100"
                  >
                    <div className="font-medium text-neutral-700">{account.role}</div>
                    <div className="text-neutral-500 mt-0.5">
                      <span className="text-neutral-400">账号：</span>
                      {account.username}
                    </div>
                    <div className="text-neutral-500">
                      <span className="text-neutral-400">密码：</span>
                      {account.password}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
