import { cn } from '@/lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
  count?: number
  color?: string
  maxCount?: number
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', dot, count, color, maxCount = 99, children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      primary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const dotVariants: Record<BadgeVariant, string> = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
      info: 'bg-blue-500',
      primary: 'bg-indigo-500',
      neutral: 'bg-gray-500'
    }

    const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center',
          className
        )}
        {...props}
      >
        {children && (
          <span className="relative">
            {children}
            {(count !== undefined || dot) && (
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium border rounded-full',
                  variants[variant],
                  color && 'border-transparent',
                  count === 0 && 'hidden'
                )}
                style={color ? { backgroundColor: color, color: '#fff' } : undefined}
              >
                {dot ? null : displayCount}
              </span>
            )}
          </span>
        )}
        {!children && (
          <span
            className={cn(
              'inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium border rounded-full',
              variants[variant],
              color && 'border-transparent'
            )}
            style={color ? { backgroundColor: color, color: '#fff' } : undefined}
          >
            {dot && (
              <span
                className={cn(
                  'w-2 h-2 rounded-full mr-1.5',
                  dotVariants[variant]
                )}
                style={color ? { backgroundColor: color } : undefined}
              />
            )}
            {count !== undefined && !dot ? displayCount : children}
          </span>
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
