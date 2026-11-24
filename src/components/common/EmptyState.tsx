// ─── Empty State Component ────────────────────────────────────────────────────
import React from 'react';
import {
  ShoppingCart,
  Heart,
  Package,
  Search,
  BoxSelect,
  type LucideIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';

type EmptyVariant =
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'products'
  | 'search'
  | 'custom';

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const variantDefaults: Record<
  Exclude<EmptyVariant, 'custom'>,
  { icon: LucideIcon; title: string; description: string }
> = {
  cart: {
    icon: ShoppingCart,
    title: 'কার্ট খালি',
    description: 'আপনার কার্টে কোনো পণ্য নেই। কেনাকাটা শুরু করুন!',
  },
  wishlist: {
    icon: Heart,
    title: 'পছন্দের তালিকা খালি',
    description: 'আপনার পছন্দের পণ্যগুলো এখানে সংরক্ষণ করুন।',
  },
  orders: {
    icon: Package,
    title: 'কোনো অর্ডার নেই',
    description: 'আপনি এখনও কোনো অর্ডার করেননি।',
  },
  products: {
    icon: BoxSelect,
    title: 'কোনো পণ্য পাওয়া যায়নি',
    description: 'এই ক্যাটাগরিতে এখনও কোনো পণ্য যোগ করা হয়নি।',
  },
  search: {
    icon: Search,
    title: 'কোনো ফলাফল নেই',
    description: 'আপনার খোঁজের সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি।',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'custom',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const defaults = variant !== 'custom' ? variantDefaults[variant] : null;
  const IconComponent = icon ?? defaults?.icon ?? BoxSelect;
  const displayTitle = title ?? defaults?.title ?? 'কিছু নেই';
  const displayDescription = description ?? defaults?.description;

  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-6 py-16',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Soft icon container */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#F7C8D5]/40 mb-5">
        <IconComponent
          size={36}
          className="text-[#D45D83]"
          strokeWidth={1.5}
        />
      </div>

      <h3 className="text-lg font-semibold text-[#292329] mb-2">
        {displayTitle}
      </h3>

      {displayDescription && (
        <p className="text-sm text-[#77717A] max-w-xs leading-relaxed mb-6">
          {displayDescription}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && actionLabel && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {onSecondaryAction && secondaryActionLabel && (
          <Button variant="outline" size="md" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export { EmptyState };
export default EmptyState;
