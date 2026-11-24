// ─── OrderSummary — Women's Favorite ─────────────────────────────────────────
import React from 'react';
import { Tag, Truck, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { CartItem, CartTotals } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND } from '@/constants';

/* ── Helpers ── */
function formatPrice(n: number): string {
  return `${BRAND.currencySymbol}${n.toLocaleString('bn-BD')}`;
}

/* ── Row ── */
function SummaryRow({
  label,
  value,
  highlight = false,
  strikeValue,
  large = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  strikeValue?: string;
  large?: boolean;
}) {
  return (
    <div className={clsx('flex items-center justify-between', large ? 'py-2' : 'py-1')}>
      <span
        className={clsx(
          'text-gray-600',
          large ? 'text-base font-semibold text-[#292329]' : 'text-sm'
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {strikeValue && (
          <span className="text-xs text-gray-400 line-through">{strikeValue}</span>
        )}
        <span
          className={clsx(
            large ? 'text-lg font-bold text-[#292329]' : 'text-sm font-medium',
            highlight && 'text-[#D45D83] font-semibold'
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* ── Props ── */
interface OrderSummaryProps {
  items: CartItem[];
  totals: CartTotals;
  couponCode?: string;
  className?: string;
  /** If true, makes panel sticky for desktop sidebar */
  sticky?: boolean;
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function OrderSummary({
  items,
  totals,
  couponCode,
  className,
  sticky = true,
}: OrderSummaryProps) {
  const { t } = useLanguage();
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const visibleItems = itemsExpanded ? items : items.slice(0, 2);
  const hiddenCount = items.length - 2;

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-[#F0E2E8] shadow-sm overflow-hidden',
        sticky && 'lg:sticky lg:top-24',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F0E2E8] bg-[#FFF8FA]">
        <ShoppingBag size={18} className="text-[#D45D83]" />
        <h2 className="font-semibold text-[#292329] text-base">{t('checkout.order_summary')}</h2>
        <span className="ml-auto text-sm text-gray-500 font-medium">
          {totals.itemCount} {t('cart.items')}
        </span>
      </div>

      {/* Cart items */}
      <div className="divide-y divide-[#F0E2E8]">
        {visibleItems.map((item) => (
          <div
            key={`${item.productId}-${item.variantKey}`}
            className="flex gap-3 px-5 py-3"
          >
            {/* Item image */}
            <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#FFF8FA] shrink-0 border border-[#F0E2E8]">
              {item.primaryImage ? (
                <img
                  src={item.primaryImage}
                  alt={item.nameBn}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#D45D83]/30">
                  <ShoppingBag size={20} />
                </div>
              )}
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#292329] line-clamp-2 leading-tight">
                {item.nameBn}
              </p>
              {item.selectedVariants.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.selectedVariants.map((v) => `${v.label}`).join(', ')}
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-500">× {item.quantity}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-[#292329]">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/collapse items */}
      {items.length > 2 && (
        <button
          type="button"
          onClick={() => setItemsExpanded((v) => !v)}
          className="w-full py-2.5 text-xs text-[#D45D83] font-medium flex items-center justify-center gap-1 hover:bg-[#FFF8FA] transition-colors border-b border-[#F0E2E8]"
        >
          {itemsExpanded ? (
            <>
              <ChevronUp size={14} /> কম দেখুন
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              আরও {hiddenCount}টি পণ্য দেখুন
            </>
          )}
        </button>
      )}

      {/* Totals */}
      <div className="px-5 py-4 space-y-1">
        <SummaryRow label={t('cart.subtotal')} value={formatPrice(totals.subtotal)} />

        {totals.discountAmount > 0 && (
          <SummaryRow
            label={t('cart.discount')}
            value={`-${formatPrice(totals.discountAmount)}`}
            highlight
          />
        )}

        {/* Coupon indicator */}
        {couponCode && (
          <div className="flex items-center gap-1.5 py-1">
            <Tag size={13} className="text-[#D45D83]" />
            <span className="text-xs text-[#D45D83] font-medium">
              কুপন &ldquo;{couponCode}&rdquo; প্রয়োগ হয়েছে
            </span>
          </div>
        )}

        {/* Delivery fee */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-600 flex items-center gap-1.5">
            <Truck size={13} className="text-gray-400" />
            {t('cart.delivery_fee')}
          </span>
          {totals.deliveryFee === 0 ? (
            <span className="text-sm font-semibold text-emerald-600">বিনামূল্যে</span>
          ) : totals.deliveryFee < 0 ? (
            <span className="text-xs text-gray-500">জেলা অনুযায়ী নির্ধারিত হবে</span>
          ) : (
            <span className="text-sm font-medium text-[#292329]">
              {formatPrice(totals.deliveryFee)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#F0E2E8] my-2" />

        {/* Total */}
        <SummaryRow
          label={t('cart.total')}
          value={formatPrice(totals.total < 0 ? totals.subtotal - totals.discountAmount : totals.total)}
          large
        />

        {totals.discountAmount > 0 && (
          <p className="text-xs text-emerald-600 text-center mt-1 font-medium">
            🎉 আপনি {formatPrice(totals.discountAmount)} সাশ্রয় করছেন!
          </p>
        )}
      </div>
    </div>
  );
}
