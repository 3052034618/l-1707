import { Building2, Factory, FileSpreadsheet, Ship, Wallet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface RoleAvatarProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  name?: string;
  className?: string;
}

interface RoleConfig {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const roleConfig: Record<UserRole, RoleConfig> = {
  importer: {
    label: '进口商',
    icon: Building2,
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-200',
  },
  exporter: {
    label: '出口商',
    icon: Factory,
    bgColor: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-200',
  },
  customs: {
    label: '报关行',
    icon: FileSpreadsheet,
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-200',
  },
  logistics: {
    label: '物流商',
    icon: Ship,
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-500',
    borderColor: 'border-orange-200',
  },
  finance: {
    label: '财务',
    icon: Wallet,
    bgColor: 'bg-cyan-500',
    textColor: 'text-cyan-500',
    borderColor: 'border-cyan-200',
  },
  management: {
    label: '管理层',
    icon: Users,
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-200',
  },
};

const sizeClasses: Record<'sm' | 'md' | 'lg', { avatar: string; icon: string; text: string }> = {
  sm: {
    avatar: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-xs',
  },
  md: {
    avatar: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-sm',
  },
  lg: {
    avatar: 'h-14 w-14',
    icon: 'h-7 w-7',
    text: 'text-base',
  },
};

export default function RoleAvatar({ role, size = 'md', name, className }: RoleAvatarProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const sizes = sizeClasses[size];

  const getInitials = (name: string): string => {
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-transform hover:scale-105',
          sizes.avatar,
          config.bgColor,
          config.borderColor,
          className
        )}
        title={`${config.label}${name ? ` - ${name}` : ''}`}
      >
        {name ? (
          <span className={cn('font-semibold text-white', sizes.text)}>
            {getInitials(name)}
          </span>
        ) : (
          <Icon className={cn(sizes.icon, 'text-white')} />
        )}
      </div>
      {name && (
        <div className="flex flex-col">
          <span className={cn('font-medium text-gray-900', sizes.text)}>{name}</span>
          <span className={cn('text-gray-500', 'text-xs')}>{config.label}</span>
        </div>
      )}
    </div>
  );
}

export { roleConfig };
export type { RoleAvatarProps };
