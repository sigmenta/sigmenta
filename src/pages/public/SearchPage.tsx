import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, ChevronRight, ArrowUpDown } from 'lucide-react';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProductSummary, ProductSortKey } from '@/types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const { t, isBangla } = useLanguage();

  const [inputQuery, setInputQuery] = useState(queryParam);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortKey>('newest');

  useEffect(() => {
    setInputQuery(queryParam);
    if (!queryParam.trim()) {
      setProducts([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    productService.searchProducts(queryParam.trim(), 40)
      .then((results: any) => {
        if (isMounted) setProducts(results);
      })
      .catch((err: unknown) => {
        console.error('Search error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      setSearchParams({ q: inputQuery.trim() });
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.salePrice ?? a.regularPrice;
    const priceB = b.salePrice ?? b.regularPrice;
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    return 0;
  });

  return (
    <>
      <Helmet>
        <title>{queryParam ? `"${queryParam}" — ${BRAND.nameBn} খোঁজ` : `অনুসন্ধান — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-6 font-bangla">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#77717A] mb-6">
          <Link to={ROUTES.HOME} className="hover:text-[#D45D83] transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#292329] font-medium">{t('nav.search')}</span>
        </nav>

        {/* Search Input Bar */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-[#292329] mb-4">
            {t('search.placeholder')}
          </h1>
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isBangla ? 'পণ্য, ক্যাটাগরি বা ব্র্যান্ডের নাম...' : 'Product, category or brand name...'}
              className="w-full pl-11 pr-28 py-3.5 text-sm bg-[#FFF8FA] border border-[#F0E2E8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D45D83]/20 focus:border-[#D45D83] text-[#292329]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77717A]" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#D45D83] hover:bg-[#B8446C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              {t('common.search')}
            </button>
          </form>

          {queryParam && (
            <p className="text-xs text-[#77717A] mt-3">
              {isBangla ? (
                <>"{queryParam}" এর জন্য <span className="font-bold text-[#D45D83]">{products.length}</span>টি ফলাফল পাওয়া গেছে</>
              ) : (
                <><span className="font-bold text-[#D45D83]">{products.length}</span> results found for "{queryParam}"</>
              )}
            </p>
          )}
        </div>

        {/* Results Bar */}
        {queryParam && products.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-[#F0E2E8] rounded-2xl p-4 mb-6 shadow-sm">
            <span className="text-xs font-semibold text-[#77717A]">
              {isBangla ? `মোট ${products.length} ${t('common.items')}` : `Total ${products.length} ${t('common.items')}`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#77717A] flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> {t('common.sort')}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductSortKey)}
                className="text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl px-3 py-1.5 text-[#292329] focus:outline-none focus:ring-1 focus:ring-[#D45D83]"
              >
                <option value="newest">{isBangla ? 'নতুন পণ্য' : 'Newest'}</option>
                <option value="price_asc">{isBangla ? 'কম থেকে বেশি মূল্য' : 'Price: Low to High'}</option>
                <option value="price_desc">{isBangla ? 'বেশি থেকে কম মূল্য' : 'Price: High to Low'}</option>
                <option value="rating">{isBangla ? 'সর্বোচ্চ রেটিং' : 'Highest Rating'}</option>
              </select>
            </div>
          </div>
        )}

        {/* Product Grid / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : queryParam && sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : queryParam && !isLoading ? (
          <EmptyState
            title={t('search.no_results')}
            description={isBangla ? 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।' : 'No products matched your search.'}
            actionLabel={t('cart.continue_shopping')}
            onAction={() => window.location.assign(ROUTES.PRODUCTS)}
          />
        ) : (
          <div className="text-center py-16 text-[#77717A] bg-white border border-[#F0E2E8] rounded-3xl">
            <Search className="w-12 h-12 mx-auto text-[#D45D83]/40 mb-3" />
            <p className="text-sm font-semibold text-[#292329]">পণ্য খুঁজতে উপরের বক্সে লিখুন</p>
            <p className="text-xs mt-1">স্কিনকেয়ার, মেকআপ, পোশাক ইত্যাদি খুঁজে দেখুন</p>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchPage;
