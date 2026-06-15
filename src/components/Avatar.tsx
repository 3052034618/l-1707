import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  name?: string;
  shape?: AvatarShape;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const shapeClasses: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-md',
};

const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>((
  { src, alt = '', size = 'md', name = '', shape = 'circle', className },
  ref
) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const showImage = src && !hasError;
  const initials = getInitials(name);

  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium select-none',
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
    >
      {showImage ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <User size={size === 'sm' ? 16 : size === 'md' ? 20 : 28} />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
          />
        </>
      ) : initials ? (
        <span className="flex items-center justify-center font-medium">
          {initials}
        </span>
      ) : (
        <User size={size === 'sm' ? 16 : size === 'md' ? 20 : 28} />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
