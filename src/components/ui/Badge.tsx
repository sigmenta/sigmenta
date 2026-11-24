// ─── Badge / Chip Component ───────────────────────────────────────────────────
import React from 'react';
import { X } from 'lucide-react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  withDot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-[#F7C8D5] text-[#D45D83] ring-[#F7C8D5]',
  success: 'bg-green-100 text-green-700 ring-green-100',
  warning: 'bg-yellow-100 text-yellow-700 ring-yellow-100',
  error: 'bg-red-100 text-red-600 ring-red-100',
  info: 'bg-blue-100 text-blue-700 ring-blue-100',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-100',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-[#D45D83]',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1 rounded-full',
  md: 'text-sm px-2.5 py-1 gap-1.5 rounded-full',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  withDot = false,
  removable = false,
  onRemove,
  children,
  className = '',
}) => {
  return (
    <span
      className={[
        'inline-flex items-center font-medium ring-1 ring-inset',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
        />
      )}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="ml-0.5 -mr-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors shrink-0"
        >
          <X size={size === 'sm' ? 10 : 12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
};

export default Badge;
