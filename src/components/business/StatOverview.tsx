import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendType = 'up' | 'down' | 'neutral';

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'cyan' | 'amber';
  trend?: TrendType;
  trendValue?: string;
}

interface StatOverviewProps {
  stats: StatItem[];
  className?: string;
}

const colorConfig: Record<StatItem['color'], { bg: string; iconBg: string; icon: string; border: string }> = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    border: 'hover:border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-500/10',
    icon: 'text-green-500',
    border: 'hover:border-green-200',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-500/10',
    icon: 'text-purple-500',
    border: 'hover:border-purple-200',
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-500/10',
    icon: 'text-orange-500',
    border: 'hover:border-orange-200',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-500/10',
    icon: 'text-red-500',
    border: 'hover:border-red-200',
  },
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-500/10',
    icon: 'text-indigo-500',
    border: 'hover:border-indigo-200',
  },
  cyan: {
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-500/10',
    icon: 'text-cyan-500',
    border: 'hover:border-cyan-200',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'hover:border-amber-200',
  },
};

const trendConfig: Record<TrendType, { icon: React.ElementType; color: string }> = {
  up: {
    icon: TrendingUp,
    color: 'text-green-600',
  },
  down: {
    icon: TrendingDown,
    color: 'text-red-600',
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-600',
  },
};

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon;
  const colors = colorConfig[stat.color];
  const TrendIcon = stat.trend ? trendConfig[stat.trend].icon : null;
  const trendColor = stat.trend ? trendConfig[stat.trend].color : '';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        colors.border
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-50 transition-opacity duration-300 group-hover:opacity-80" style={{ backgroundColor: 'currentColor' }} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
              colors.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        </div>

        {stat.trend && stat.trendValue && TrendIcon && (
          <div className="mt-4 flex items-center gap-1">
            <TrendIcon className={cn('h-4 w-4', trendColor)} />
            <span className={cn('text-sm font-medium', trendColor)}>{stat.trendValue}</span>
            <span className="text-xs text-gray-400">较上期</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StatOverview({ stats, className }: StatOverviewProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.slice(0, 4).map((stat, index) => (
        <StatCard key={stat.title} stat={stat} index={index} />
      ))}
    </div>
  );
}

export type { StatOverviewProps, StatItem, TrendType };
