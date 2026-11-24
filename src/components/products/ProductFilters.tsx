// ─── ProductFilters — Women's Favorite ───────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category, ProductFilters as IProductFilters } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND } from '@/constants';

/* ── Props ── */
interface ProductFiltersProps {
  filters: IProductFilters;
  categories: Category[];
  onChange: (filters: Partial<IProductFilters>) => void;
  onClear: () => void;
  className?: string;
  /** When true, only renders the mobile trigger button + drawer (no desktop sidebar) */
  mobileOnly?: boolean;
}

/* ── Section wrapper ── */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#F0E2E8] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-sm font-semibold text-[#292329]">{title}</span>
        {open ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

/* ── Rating star row ── */
function RatingOption({
  value,
  selected,
  onSelect,
  starsLabel,
}: {
  value: number;
  selected: boolean;
  onSelect: (v: number | undefined) => void;
  starsLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? undefined : value)}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 w-full text-left',
        selected
          ? 'bg-[#D45D83]/10 text-[#D45D83] font-medium ring-1 ring-[#D45D83]/30'
          : 'hover:bg-[#FFF8FA] text-gray-600'
      )}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={13}
            className={
              i < value ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
            }
          />
        ))}
      </div>
      <span>{value}+ {starsLabel}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ProductFilters({
  filters,
  categories,
  onChange,
  onClear,
  className,
  mobileOnly = false,
}: ProductFiltersProps) {
  const { t, isBangla } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localMin, setLocalMin] = useState(filters.priceMin?.toString() ?? '');
  const [localMax, setLocalMax] = useState(filters.priceMax?.toString() ?? '');
  const drawerRef = useRef<HTMLDivElement>(null);

  /* sync external filter changes into local price inputs */
  useEffect(() => {
    setLocalMin(filters.priceMin?.toString() ?? '');
    setLocalMax(filters.priceMax?.toString() ?? '');
  }, [filters.priceMin, filters.priceMax]);

  /* count active filters */
  const activeCount = [
    filters.categorySlug,
    filters.priceMin,
    filters.priceMax,
    filters.rating,
    filters.stockStatus === 'in_stock',
    filters.isOnSale,
  ].filter(Boolean).length;

  function handlePriceApply() {
    const min = localMin ? parseInt(localMin, 10) : undefined;
    const max = localMax ? parseInt(localMax, 10) : undefined;
    onChange({ priceMin: min, priceMax: max });
  }

  /* ── Filter panel content ── */
  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#D45D83]" />
          <span className="font-semibold text-[#292329]">{t('common.filter')}</span>
          {activeCount > 0 && (
            <span className="text-xs bg-[#D45D83] text-white px-2 py-0.5 rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-[#D45D83] hover:text-[#B8446C] font-medium flex items-center gap-1 transition-colors"
          >
            <X size={14} />
            {t('products.clear_all')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-0">
        {/* Category filter */}
        {categories.length > 0 && (
          <FilterSection title={t('filter.categories')}>
            <div className="space-y-1">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 cursor-pointer py-1 group"
                >
                  <input
                    type="checkbox"
                    checked={filters.categorySlug === cat.slug}
                    onChange={(e) =>
                      onChange({
                        categorySlug: e.target.checked ? cat.slug : undefined,
                      })
                    }
                    className="w-4 h-4 rounded accent-[#D45D83] cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-[#292329] transition-colors flex-1">
                    {isBangla ? cat.nameBn : (cat.nameEn || cat.nameBn)}
                  </span>
                  {cat.productCount !== undefined && (
                    <span className="text-xs text-gray-400">({cat.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Price range */}
        <FilterSection title={t('product.price_range')}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('filter.min')}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {BRAND.currencySymbol}
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="০"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="w-full pl-5 pr-2 py-2 text-sm border border-[#F0E2E8] rounded-lg focus:ring-2 focus:ring-[#D45D83]/20 focus:border-[#D45D83] outline-none"
                />
              </div>
            </div>
            <span className="text-gray-400 mt-5">—</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('filter.max')}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {BRAND.currencySymbol}
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="৫০০০"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="w-full pl-5 pr-2 py-2 text-sm border border-[#F0E2E8] rounded-lg focus:ring-2 focus:ring-[#D45D83]/20 focus:border-[#D45D83] outline-none"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePriceApply}
            className="mt-3 w-full py-2 text-sm font-medium bg-[#D45D83]/10 text-[#D45D83] rounded-lg hover:bg-[#D45D83]/20 transition-colors"
          >
            {t('common.apply')}
          </button>
        </FilterSection>

        {/* Rating filter */}
        <FilterSection title={t('review.rating')}>
          <div className="space-y-1">
            {[4, 3, 2, 1].map((r) => (
              <RatingOption
                key={r}
                value={r}
                selected={filters.rating === r}
                onSelect={(v) => onChange({ rating: v })}
                starsLabel={t('filter.stars')}
              />
            ))}
          </div>
        </FilterSection>

        {/* Stock availability */}
        <FilterSection title={t('filter.stock')}>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-600">{t('filter.in_stock_only')}</span>
            <div
              onClick={() =>
                onChange({
                  stockStatus:
                    filters.stockStatus === 'in_stock' ? undefined : 'in_stock',
                })
              }
              className={clsx(
                'relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200',
                filters.stockStatus === 'in_stock' ? 'bg-[#D45D83]' : 'bg-gray-200'
              )}
            >
              <div
                className={clsx(
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                  filters.stockStatus === 'in_stock' ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
          </label>
        </FilterSection>

        {/* Sale only */}
        <FilterSection title={t('filter.offers')}>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-600">{t('filter.sale_only')}</span>
            <div
              onClick={() => onChange({ isOnSale: filters.isOnSale ? undefined : true })}
              className={clsx(
                'relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200',
                filters.isOnSale ? 'bg-[#D45D83]' : 'bg-gray-200'
              )}
            >
              <div
                className={clsx(
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                  filters.isOnSale ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
          </label>
        </FilterSection>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar — hidden when mobileOnly=true ── */}
      {!mobileOnly && (
        <aside
          className={clsx(
            'hidden lg:block w-60 shrink-0 bg-white rounded-2xl border border-[#F0E2E8] p-5',
            className
          )}
        >
          {panelContent}
        </aside>
      )}

      {/* ── Mobile filter trigger button ── */}
      <div className={mobileOnly ? 'block' : 'lg:hidden'}>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#F0E2E8] rounded-xl text-sm font-medium text-[#292329] shadow-sm hover:border-[#D45D83] transition-colors"
        >
          <SlidersHorizontal size={15} className="text-[#D45D83]" />
          {t('common.filter')}
          {activeCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-[#D45D83] text-white text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* ── Bottom drawer ── */}
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <div
              ref={drawerRef}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#F0E2E8]">
                <span className="font-semibold text-[#292329]">
                  {t('common.filter')}
                  {activeCount > 0 && (
                    <span className="ml-2 text-xs bg-[#D45D83] text-white px-2 py-0.5 rounded-full font-bold">
                      {activeCount}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">{panelContent}</div>
              {/* Apply button */}
              <div className="p-4 border-t border-[#F0E2E8] flex gap-3">
                <button
                  type="button"
                  onClick={() => { onClear(); setDrawerOpen(false); }}
                  className="flex-1 py-3 rounded-xl border border-[#F0E2E8] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('products.clear_all')}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#D45D83] text-white text-sm font-medium hover:bg-[#B8446C] transition-colors"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
