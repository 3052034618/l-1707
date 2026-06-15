import { cn } from '@/lib/utils'
import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from 'react'

interface CardContextType {
  variant: 'default' | 'outlined'
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCardContext() {
  const context = useContext(CardContext)
  if (!context) {
    throw new Error('Card components must be used within a Card')
  }
  return context
}

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  extra?: React.ReactNode
  shadow?: boolean
  hoverable?: boolean
  variant?: 'default' | 'outlined'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, extra, shadow = true, hoverable, variant = 'default', children, ...props }, ref) => {
    return (
      <CardContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn(
            'rounded-lg bg-white transition-all duration-200',
            variant === 'default' ? 'border border-gray-200' : 'border-2 border-gray-300',
            shadow && 'shadow-sm',
            hoverable && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
            className
          )}
          {...props}
        >
          {(title || subtitle || extra) && (
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                  {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {extra && <div className="flex-shrink-0">{extra}</div>}
              </div>
            </CardHeader>
          )}
          {children}
        </div>
      </CardContext.Provider>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-b border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardBody.displayName = 'CardBody'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

type CardComponent = React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

const CardWithStaticMethods = Card as CardComponent;
CardWithStaticMethods.Header = CardHeader;
CardWithStaticMethods.Body = CardBody;
CardWithStaticMethods.Footer = CardFooter;

export default CardWithStaticMethods;
