// ─── ProductGrid — Women's Favorite ──────────────────────────────────────────
import React from 'react';
import { clsx } from 'clsx';
import type { ProductSummary } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from './ProductCard';

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#F0E2E8] animate-pulse">
      {/* image placeholder 3:4 */}
      <div className="bg-gradient-to-br from-[#F7C8D5]/40 to-[#FFF8FA]" style={{ paddingBottom: '133.33%', position: 'relative' }}>
        <div className="absolute inset-0" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-[#F7C8D5]/60 rounded w-3/4" />
        <div className="h-3 bg-[#F7C8D5]/40 rounded w-1/2" />
        <div className="h-4 bg-[#F7C8D5]/60 rounded w-1/3 mt-1" />
        <div className="h-8 bg-[#F7C8D5]/30 rounded-xl mt-1" />
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ message }: { message?: string }) {
  const { t } = useLanguage();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-[#F7C8D5]/30 flex items-center justify-center mb-4">
        <span className="text-4xl">🛍️</span>
      </div>
      <h3 className="text-lg font-semibold text-[#292329] mb-2">
        {message ?? t('common.no_results')}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        {t('products.no_products_found_sub')}
      </p>
    </div>
  );
}

/* ── Props ── */
interface ProductGridProps {
  products: ProductSummary[];
  isLoading?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
  wishlistedIds?: Set<string>;
  onWishlistToggle?: (productId: string, isWishlisted: boolean) => void;
  className?: string;
  /** Enable 5-column layout on extra-wide screens */
  enableFiveCol?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ProductGrid({
  products,
  isLoading = false,
  emptyMessage,
  skeletonCount = 8,
  wishlistedIds,
  onWishlistToggle,
  className,
  enableFiveCol = false,
}: ProductGridProps) {
  const gridClasses = clsx(
    'grid gap-3 sm:gap-4',
    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    enableFiveCol && 'xl:grid-cols-5',
    className
  );

  /* Loading skeletons */
  if (isLoading) {
    return (
      <div className={gridClasses} aria-busy="true" aria-label="পণ্য লোড হচ্ছে">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  /* Empty state */
  if (!products.length) {
    return (
      <div className={gridClasses}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlistedIds?.has(product.id) ?? false}
          onWishlistToggle={onWishlistToggle}
        />
      ))}
    </div>
  );
}

/* ── Named exports ── */
export { SkeletonCard, EmptyState, ProductGrid };
