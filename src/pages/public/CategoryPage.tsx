import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Category, ProductSummary, ProductSortKey } from '@/types';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, isBangla } = useLanguage();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<ProductSortKey>('newest');
  const [priceFilter, setPriceFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([
      categoryService.getCategoryBySlug(slug),
      productService.getProductsByCategory(slug, 40),
    ])
      .then(([catData, prodData]: [any, any]) => {
        if (!isMounted) return;
        setCategory(catData);
        setProducts(prodData);
      })
      .catch((err: unknown) => {
        console.error('Error fetching category data:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Apply local sorting and price filtering
  const filteredProducts = products
    .filter((prod) => {
      const price = prod.salePrice ?? prod.regularPrice;
      if (priceFilter === 'under_1000') return price < 1000;
      if (priceFilter === '1000_2500') return price >= 1000 && price <= 2500;
      if (priceFilter === 'above_2500') return price > 2500;
      return true;
    })
    .sort((a, b) => {
      const priceA = a.salePrice ?? a.regularPrice;
      const priceB = b.salePrice ?? b.regularPrice;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      return 0; // default newest
    });

  const catName = category
    ? isBangla
      ? category.nameBn
      : category.nameEn || category.nameBn
    : slug;

  return (
    <>
      <Helmet>
        <title>{category ? `${catName} — ${BRAND.nameBn}` : `${BRAND.nameBn}`}</title>
        <meta
          name="description"
          content={category?.descriptionBn || `${catName} ক্যাটাগরির সেরা পণ্যসমূহ`}
        />
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-6 font-bangla">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#77717A] mb-6">
          <Link to={ROUTES.HOME} className="hover:text-[#D45D83] transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={ROUTES.PRODUCTS} className="hover:text-[#D45D83] transition-colors">
            {t('nav.products')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#292329] font-medium truncate">{catName}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-gradient-to-r from-[#FFF0F5] to-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            {category?.icon && (
              <span className="text-4xl p-3 bg-white rounded-2xl shadow-sm border border-[#F0E2E8]">
                {category.icon}
              </span>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#292329]">{catName}</h1>
              {category?.descriptionBn && (
                <p className="text-sm text-[#77717A] mt-1.5 max-w-xl">
                  {isBangla ? category.descriptionBn : category.descriptionEn || category.descriptionBn}
                </p>
              )}
              <p className="text-xs text-[#D45D83] font-semibold mt-2">
                {products.length} {t('common.items')}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Sort & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#F0E2E8] rounded-2xl p-4 mb-6 shadow-sm">
          {/* Price Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-[#77717A] flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> {t('common.filter')}:
            </span>
            {[
              { id: 'all', label: isBangla ? 'সব মূল্য' : 'All Prices' },
              { id: 'under_1000', label: isBangla ? '১০০০৳ এর নিচে' : 'Under ৳1,000' },
              { id: '1000_2500', label: isBangla ? '১০০০৳ - ২৫০০৳' : '৳1,000 - ৳2,500' },
              { id: 'above_2500', label: isBangla ? '২৫০০৳ এর উপরে' : 'Above ৳2,500' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setPriceFilter(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  priceFilter === pill.id
                    ? 'bg-[#D45D83] text-white shadow-sm'
                    : 'bg-[#FFF8FA] text-[#77717A] hover:text-[#292329] border border-[#F0E2E8]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-[#77717A] flex items-center gap-1 shrink-0">
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

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('common.no_results')}
            description={isBangla ? 'এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য পাওয়া যায়নি।' : 'No products found in this category.'}
            actionLabel={t('cart.continue_shopping')}
            onAction={() => window.location.assign(ROUTES.PRODUCTS)}
          />
        )}
      </div>
    </>
  );
};

export default CategoryPage;
