import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ChevronRight, Star, ArrowRight, BadgeCheck } from 'lucide-react';
import { productService, getLocalProducts } from '@/services/productService';
import { getLocalBanners, sanitizeBanner } from '@/services/bannerService';
import { getLocalCategories } from '@/services/categoryService';
import {
  collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND, COLLECTIONS } from '@/constants';
import type { Banner, Category, ProductSummary, Review } from '@/types';
import ProductGrid from '@/components/products/ProductGrid';


// Swiper styles — must import CSS here
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/* ── Helpers ── */
function formatPrice(n: number) {
  return `${BRAND.currencySymbol}${n.toLocaleString('bn-BD')}`;
}

/* ── Section header ── */
function SectionHeader({
  title,
  viewAllHref,
}: {
  title: string;
  viewAllHref?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#292329]">{title}</h2>
        <div className="h-1 w-12 bg-[#D45D83] rounded-full mt-1.5" />
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="flex items-center gap-1 text-sm font-medium text-[#D45D83] hover:text-[#B8446C] transition-colors group"
        >
          {t('common.view_all')}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

/* ── Hero skeleton ── */
function HeroSkeleton() {
  return (
    <div className="w-full h-[280px] md:h-[480px] lg:h-[600px] bg-gradient-to-r from-[#F7C8D5]/40 to-[#FFF8FA] animate-pulse rounded-3xl" />
  );
}

/* ── Category skeleton ── */
function CategorySkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-[#F7C8D5]/40" />
          <div className="h-3 w-10 bg-[#F7C8D5]/30 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ── Review card ── */
function ReviewCard({ review }: { review: Review }) {
  const firstNameLastInitial = (() => {
    const parts = review.userName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  })();

  return (
    <div className="bg-white rounded-2xl border border-[#F0E2E8] p-5 flex flex-col gap-3 h-full">
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        ))}
      </div>
      {/* Title */}
      {review.title && (
        <p className="font-semibold text-[#292329] text-sm">{review.title}</p>
      )}
      {/* Body */}
      <p className="text-sm text-gray-600 line-clamp-4 flex-1">{review.body}</p>
      {/* Author */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#F0E2E8]">
        <div className="w-8 h-8 rounded-full bg-[#F7C8D5] flex items-center justify-center text-sm font-bold text-[#D45D83]">
          {review.userName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#292329]">{firstNameLastInitial}</p>
          {review.isVerifiedPurchase && (
            <p className="text-xs text-emerald-600 flex items-center gap-0.5">
              <BadgeCheck size={11} /> যাচাইকৃত ক্রয়
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: convert Product → ProductSummary ──────────────────────────────
const toSummary = (p: any): ProductSummary => ({
  id: p.id,
  slug: p.slug,
  nameBn: p.nameBn,
  nameEn: p.nameEn,
  regularPrice: p.regularPrice,
  salePrice: p.salePrice,
  primaryImage: p.primaryImage || p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || '',
  stockStatus: p.stockStatus,
  averageRating: p.averageRating ?? 0,
  totalReviews: p.totalReviews ?? 0,
  isFeatured: p.isFeatured,
  isBestSeller: p.isBestSeller,
  isNewArrival: p.isNewArrival,
  isTrending: p.isTrending,
  categorySlug: p.categorySlug,
});

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t, isBangla } = useLanguage();

  /* ── Initial local state (0ms instant render) ── */
  const [banners, setBanners] = useState<Banner[]>(() => {
    return getLocalBanners().filter((b) => b.isActive && b.position === 'hero').map(sanitizeBanner);
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    return getLocalCategories().filter((c) => c.isActive);
  });
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>(() => {
    const local = getLocalProducts().filter((p) => p.status === 'published');
    const feat = local.filter((p) => p.isFeatured).slice(0, 8);
    return (feat.length > 0 ? feat : local.slice(0, 8)).map(toSummary);
  });
  const [bestSellers, setBestSellers] = useState<ProductSummary[]>(() => {
    const local = getLocalProducts().filter((p) => p.status === 'published');
    const best = local.filter((p) => p.isBestSeller).slice(0, 8);
    return (best.length > 0 ? best : local.slice(0, 8)).map(toSummary);
  });
  const [newArrivals, setNewArrivals] = useState<ProductSummary[]>(() => {
    const local = getLocalProducts().filter((p) => p.status === 'published');
    const newArr = local.filter((p) => p.isNewArrival).slice(0, 8);
    return (newArr.length > 0 ? newArr : local.slice(0, 8)).map(toSummary);
  });
  const [trending, setTrending] = useState<ProductSummary[]>(() => {
    const local = getLocalProducts().filter((p) => p.status === 'published');
    const trend = local.filter((p) => p.isTrending).slice(0, 8);
    return (trend.length > 0 ? trend : local.slice(0, 8)).map(toSummary);
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(() => {
    return getLocalProducts().length === 0;
  });

  const [activeProductTab, setActiveProductTab] = useState<'all' | 'new' | 'bestsellers' | 'trending'>('all');

  const displayedProducts = useMemo(() => {
    if (activeProductTab === 'new') return newArrivals.length > 0 ? newArrivals : featuredProducts;
    if (activeProductTab === 'bestsellers') return bestSellers.length > 0 ? bestSellers : featuredProducts;
    if (activeProductTab === 'trending') return trending.length > 0 ? trending : featuredProducts;
    // 'all': unique list of all products
    const map = new Map<string, ProductSummary>();
    [...featuredProducts, ...newArrivals, ...bestSellers, ...trending].forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [activeProductTab, featuredProducts, newArrivals, bestSellers, trending]);


  /* ── Load all homepage data ── */
  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      try {
        // Single Firestore query for all products instead of 4 separate queries
        const { products } = await productService.getAll({ status: 'published', pageSize: 60 });
        if (!isMounted) return;
        const published = products.filter((p) => p.status === 'published');
        const feat = published.filter((p) => p.isFeatured).slice(0, 8);
        const best = published.filter((p) => p.isBestSeller).slice(0, 8);
        const newArr = published.filter((p) => p.isNewArrival).slice(0, 8);
        const trend = published.filter((p) => p.isTrending).slice(0, 8);

        setFeaturedProducts((feat.length > 0 ? feat : published.slice(0, 8)).map(toSummary));
        setBestSellers((best.length > 0 ? best : published.slice(0, 8)).map(toSummary));
        setNewArrivals((newArr.length > 0 ? newArr : published.slice(0, 8)).map(toSummary));
        setTrending((trend.length > 0 ? trend : published.slice(0, 8)).map(toSummary));
      } catch {
        // keep current state
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };

    const loadBannersAndCategories = async () => {
      if (!isFirebaseConfigured) return;
      try {
        // Banners
        const qBanners = query(
          collection(db, COLLECTIONS.BANNERS),
          where('isActive', '==', true),
          where('position', '==', 'hero'),
          orderBy('sortOrder', 'asc'),
          limit(6)
        );
        const snapB = await getDocs(qBanners);
        if (isMounted && !snapB.empty) {
          setBanners(snapB.docs.map((d) => sanitizeBanner({ id: d.id, ...d.data() } as Banner)));
        }
      } catch {/* index not ready yet — no banners */}

      try {
        // Categories
        const qCats = query(
          collection(db, COLLECTIONS.CATEGORIES),
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc'),
          limit(12)
        );
        const snapC = await getDocs(qCats);
        if (isMounted && !snapC.empty) {
          setCategories(snapC.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
        }
      } catch {/* index not ready */}

      try {
        // Reviews
        const qRev = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snapR = await getDocs(qRev);
        if (isMounted && !snapR.empty) {
          setReviews(snapR.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
        }
      } catch {/* no reviews yet */}
    };

    // Load products first (has localStorage fallback — instant)
    void loadAll();
    // Load banners/categories/reviews in parallel (Firestore only)
    void loadBannersAndCategories();

    // Listen to admin panel changes (real-time via custom events)
    const handleUpdate = () => { void loadAll(); };
    window.addEventListener('wf_products_updated', handleUpdate);
    window.addEventListener('wf_banners_updated', () => void loadBannersAndCategories());
    window.addEventListener('wf_categories_updated', () => void loadBannersAndCategories());

    return () => {
      isMounted = false;
      window.removeEventListener('wf_products_updated', handleUpdate);
      window.removeEventListener('wf_banners_updated', handleUpdate);
      window.removeEventListener('wf_categories_updated', handleUpdate);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{BRAND.nameBn} — {BRAND.tagline}</title>
        <meta name="description" content={BRAND.description} />
        <meta
          name="keywords"
          content="সিগমেন্টা, ফ্যাশন, পোশাক, লাইফস্টাইল, টি-শার্ট, শার্ট, জিন্স, ট্রাউজার, ঢাকা অনলাইন শপ, sigmenta, wear your style, fashion bangladesh"
        />
        <meta property="og:title" content={`${BRAND.nameBn} — ${BRAND.tagline}`} />
        <meta property="og:description" content={BRAND.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BRAND.website} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={BRAND.website} />
      </Helmet>

      <div className="min-h-screen bg-[var(--color-bg-light)]">
        {/* ═══════════════════════════════════════════════════
            HERO BANNER
        ═══════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
          {banners.length === 0 ? null : (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              navigation
              loop={banners.length > 1}
              className="rounded-3xl overflow-hidden shadow-md"
              style={
                {
                  '--swiper-pagination-color': '#FFFFFF',
                  '--swiper-navigation-color': '#FFFFFF',
                } as React.CSSProperties
              }
            >
              {banners.map((banner) => (
                <SwiperSlide key={banner.id}>
                  <div className="relative w-full h-[240px] sm:h-[340px] md:h-[420px] lg:h-[480px] bg-slate-900">
                    <img
                      src={banner.imageUrl}
                      alt={banner.titleBn ?? 'Banner'}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />

                    {/* Overlay content with frosted dark card for 100% text clarity on any image */}
                    {((banner.titleBn || (banner as any).titleEn) || banner.ctaLink) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent flex items-center">
                        <div className="pl-4 sm:pl-8 md:pl-12 max-w-md sm:max-w-lg lg:max-w-xl">
                          <div className="bg-black/45 backdrop-blur-md p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-white/15 shadow-2xl">
                            {(banner.titleBn || (banner as any).titleEn) && (
                              <h1 className="text-white text-lg sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-wide drop-shadow-md">
                                {isBangla ? banner.titleBn : ((banner as any).titleEn || banner.titleBn)}
                              </h1>
                            )}
                            {(banner.subtitleBn || (banner as any).subtitleEn) && (
                              <p className="text-slate-200 mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed drop-shadow">
                                {isBangla ? banner.subtitleBn : ((banner as any).subtitleEn || banner.subtitleBn)}
                              </p>
                            )}
                            {banner.ctaLink && banner.ctaText && (
                              <Link
                                to={banner.ctaLink}
                                className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
                              >
                                <span>{isBangla ? banner.ctaText : ((banner as any).ctaTextEn || banner.ctaText || 'Shop Now')}</span>
                                <ChevronRight size={14} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════
            CATEGORY SHORTCUTS
        ═══════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 py-6">
          <SectionHeader title={t('home.categories')} viewAllHref="/products" />
          {categories.length === 0 ? null : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border border-[#F0E2E8] flex items-center justify-center shadow-sm group-hover:border-[#D45D83] group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-1">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={isBangla ? cat.nameBn : (cat.nameEn || cat.nameBn)}
                        className="w-9 h-9 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">{cat.icon ?? '🛍️'}</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600 group-hover:text-[#D45D83] transition-colors font-medium leading-tight">
                    {isBangla ? cat.nameBn : (cat.nameEn || cat.nameBn)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════
            NEW ARRIVALS (নতুন আগমন)
        ═══════════════════════════════════════════════════ */}
        {newArrivals.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 py-6">
            <SectionHeader
              title={isBangla ? 'নতুন আগমন' : 'New Arrivals'}
              viewAllHref="/products?filter=new"
            />
            <ProductGrid products={newArrivals} isLoading={isLoadingProducts} skeletonCount={3} />
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
            BEST SELLERS (সেরা বিক্রিত কালেকশন)
        ═══════════════════════════════════════════════════ */}
        {bestSellers.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 py-6 my-2">
            <div className="bg-slate-50/80 rounded-3xl p-4 md:p-6 border border-slate-100/80 shadow-2xs">
              <SectionHeader
                title={isBangla ? 'সেরা বিক্রিত কালেকশন' : 'Best Sellers'}
                viewAllHref="/products?filter=bestseller"
              />
              <ProductGrid products={bestSellers} isLoading={isLoadingProducts} skeletonCount={3} />
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
            TRENDING STYLES (ট্রেন্ডিং কালেকশন)
        ═══════════════════════════════════════════════════ */}
        {trending.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 py-6">
            <SectionHeader
              title={isBangla ? 'ট্রেন্ডিং কালেকশন' : 'Trending Collection'}
              viewAllHref="/products?filter=trending"
            />
            <ProductGrid products={trending} isLoading={isLoadingProducts} skeletonCount={3} />
          </section>
        )}

        {/* Explore All CTA */}
        <div className="text-center py-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>{isBangla ? 'সব পণ্য একসাথে দেখুন' : 'Explore All Collections'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════
            CUSTOMER REVIEWS
        ═══════════════════════════════════════════════════ */}
        {reviews.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 py-8 bg-white border-t border-[#F0E2E8]">
            <SectionHeader title={t('home.reviews')} viewAllHref="/reviews" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
