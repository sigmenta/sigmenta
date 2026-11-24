// ─── ProductsPage — Women's Favorite ─────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '@/services/productService';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { X, ChevronRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND, COLLECTIONS, PAGINATION } from '@/constants';
import type { Category, ProductSummary, ProductFilters as IProductFilters, ProductSortKey } from '@/types';
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSort from '@/components/products/ProductSort';

/* ── Active filter chip ── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-[#D45D83]/10 text-[#D45D83] border border-[#D45D83]/20 px-2.5 py-1 rounded-full font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-[#D45D83]/20 rounded-full p-0.5 transition-colors"
        aria-label="ফিল্টার সরান"
      >
        <X size={10} />
      </button>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function ProductsPage() {
  const { t, isBangla } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Filter state synced with URL ── */
  const [filters, setFilters] = useState<IProductFilters>(() => ({
    categorySlug: searchParams.get('categorySlug') ?? undefined,
    priceMin: searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    stockStatus: (searchParams.get('stockStatus') as IProductFilters['stockStatus']) ?? undefined,
    isOnSale: searchParams.get('isOnSale') === 'true' ? true : undefined,
    isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
    isBestSeller: searchParams.get('isBestSeller') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sortBy') as ProductSortKey) ?? 'newest',
  }));

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  /* ── Sync URL ← filters ── */
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.categorySlug) params.categorySlug = filters.categorySlug;
    if (filters.priceMin != null) params.priceMin = String(filters.priceMin);
    if (filters.priceMax != null) params.priceMax = String(filters.priceMax);
    if (filters.rating != null) params.rating = String(filters.rating);
    if (filters.stockStatus) params.stockStatus = filters.stockStatus;
    if (filters.isOnSale) params.isOnSale = 'true';
    if (filters.isFeatured) params.isFeatured = 'true';
    if (filters.isBestSeller) params.isBestSeller = 'true';
    if (filters.sortBy && filters.sortBy !== 'newest') params.sortBy = filters.sortBy;
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  /* ── Fetch categories ── */
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    getDocs(
      query(
        collection(db, COLLECTIONS.CATEGORIES),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      )
    )
      .then((snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
        }
      })
      .catch(() => {
        /* keep sample data */
      });
  }, []);

  /* ── Fetch products using productService ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products: allProds } = await productService.getAll({
        status: 'published',
        categoryId: filters.categorySlug,
      });

      // Map to ProductSummary
      const summaries: ProductSummary[] = allProds.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        primaryImage: p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || '',
        stockStatus: p.stockStatus,
        averageRating: p.averageRating ?? 0,
        totalReviews: p.totalReviews ?? 0,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        categorySlug: p.categorySlug,
      }));

      // Apply client-side filters & sorting
      const filtered = summaries.filter((p) => {
        if (filters.categorySlug && p.categorySlug !== filters.categorySlug) return false;
        if (filters.isFeatured && !p.isFeatured) return false;
        if (filters.isBestSeller && !p.isBestSeller) return false;
        if (filters.stockStatus && p.stockStatus !== filters.stockStatus) return false;
        const price = p.salePrice ?? p.regularPrice;
        if (filters.priceMin != null && price < filters.priceMin) return false;
        if (filters.priceMax != null && price > filters.priceMax) return false;
        return true;
      });

      filtered.sort((a, b) => {
        const priceA = a.salePrice ?? a.regularPrice;
        const priceB = b.salePrice ?? b.regularPrice;
        if (filters.sortBy === 'price_asc') return priceA - priceB;
        if (filters.sortBy === 'price_desc') return priceB - priceA;
        if (filters.sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
        return 0; // default newest
      });

      setProducts(filtered);
      setTotalCount(filtered.length);
      setHasMore(false);
    } catch {
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchProducts();
    const handleUpdate = () => { void fetchProducts(); };
    window.addEventListener('wf_products_updated', handleUpdate);
    return () => window.removeEventListener('wf_products_updated', handleUpdate);
  }, [fetchProducts]);

  /* ── Filter changes ── */
  function handleFilterChange(partial: Partial<IProductFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function handleClearFilters() {
    setFilters({ sortBy: 'newest' });
  }

  /* ── Active filter chips ── */
  const activeChips: { label: string; key: string; onRemove: () => void }[] = [];
  if (filters.categorySlug) {
    const cat = categories.find((c) => c.slug === filters.categorySlug);
    activeChips.push({
      label: (cat ? (isBangla ? cat.nameBn : (cat.nameEn || cat.nameBn)) : filters.categorySlug),
      key: 'categorySlug',
      onRemove: () => handleFilterChange({ categorySlug: undefined }),
    });
  }
  if (filters.priceMin != null) {
    activeChips.push({
      label: `${t('filter.min')} ${BRAND.currencySymbol}${filters.priceMin}`,
      key: 'priceMin',
      onRemove: () => handleFilterChange({ priceMin: undefined }),
    });
  }
  if (filters.priceMax != null) {
    activeChips.push({
      label: `${t('filter.max')} ${BRAND.currencySymbol}${filters.priceMax}`,
      key: 'priceMax',
      onRemove: () => handleFilterChange({ priceMax: undefined }),
    });
  }
  if (filters.rating != null) {
    activeChips.push({
      label: `${filters.rating}+ ${t('filter.stars')}`,
      key: 'rating',
      onRemove: () => handleFilterChange({ rating: undefined }),
    });
  }
  if (filters.stockStatus === 'in_stock') {
    activeChips.push({
      label: t('product.in_stock'),
      key: 'stockStatus',
      onRemove: () => handleFilterChange({ stockStatus: undefined }),
    });
  }
  if (filters.isOnSale) {
    activeChips.push({
      label: t('products.sale_items'),
      key: 'isOnSale',
      onRemove: () => handleFilterChange({ isOnSale: undefined }),
    });
  }

  return (
    <>
      <Helmet>
        <title>{t('products.all')} — {isBangla ? BRAND.nameBn : BRAND.name}</title>
        <meta
          name="description"
          content={isBangla ? `${BRAND.nameBn}-এ সব পণ্য দেখুন। স্কিনকেয়ার, মেকআপ, পোশাক, গহনা এবং আরও অনেক কিছু। বাংলাদেশে দ্রুত ডেলিভারি।` : `Browse all products on ${BRAND.name}. Skincare, makeup, fashion, jewelry and more. Fast delivery in Bangladesh.`}
        />
        <meta property="og:title" content={`${t('products.all')} — ${isBangla ? BRAND.nameBn : BRAND.name}`} />
      </Helmet>

      <div className="min-h-screen bg-[#FFF8FA]">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
            <Link to="/" className="hover:text-[#D45D83] transition-colors">{t('nav.home')}</Link>
            <ChevronRight size={13} />
            <span className="text-[#292329] font-medium">{t('products.all')}</span>
          </nav>

          {/* Page title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#292329]">{t('products.all')}</h1>
              {!loading && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {products.length} {t('products.found_count')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filter button — only visible on small screens */}
              <div className="lg:hidden">
                <ProductFilters
                  filters={filters}
                  categories={categories}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                  mobileOnly
                />
              </div>
              <ProductSort
                value={filters.sortBy ?? 'newest'}
                onChange={(key) => handleFilterChange({ sortBy: key })}
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs text-gray-500 font-medium">{t('products.active_filters')}</span>
              {activeChips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-gray-500 underline hover:text-[#D45D83] transition-colors ml-1"
              >
                {t('products.clear_all')}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex gap-6">
            {/* Desktop sidebar filters */}
            <ProductFilters
              filters={filters}
              categories={categories}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              className="hidden lg:block"
            />

            {/* Grid */}
            <div className="flex-1 min-w-0">
              <ProductGrid
                products={products}
                isLoading={loading}
                skeletonCount={PAGINATION.PRODUCTS_PER_PAGE}
                emptyMessage={t('products.no_products_found')}
              />

              {/* Load more */}
              {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => fetchProducts()}
                    className={clsx(
                      'flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all',
                      'bg-white border border-[#D45D83] text-[#D45D83]',
                      'hover:bg-[#D45D83] hover:text-white shadow-sm hover:shadow-md',
                      loadingMore && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('products.load_more')
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
