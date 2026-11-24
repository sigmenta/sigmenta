import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck,
  ChevronRight, Star, Minus, Plus, Share2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '@/services/productService';
import { reviewService } from '@/services/reviewService';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailSkeleton } from '@/components/common/SkeletonLoader';
import { formatPrice, calculateDiscount, sanitizeHtml, copyToClipboard } from '@/utils';
import { BRAND, ROUTES } from '@/constants';
import type { Product, ProductSummary, Review, CartItemVariant } from '@/types';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review form state
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewBody, setNewReviewBody] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Cart and wishlist stores
  const addItemToCart = useCartStore((state) => state.addItem);
  const isInWishlist = useWishlistStore((state) => (product ? state.isInWishlist(product.id) : false));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    productService.getProductBySlug(slug)
      .then(async (prod: Product | null) => {
        if (!isMounted) return;
        if (!prod) {
          navigate(ROUTES.PRODUCTS, { replace: true });
          return;
        }

        setProduct(prod);
        setIsLoading(false);
        setSelectedImageIndex(0);
        setQuantity(1);

        // Pre-select first option for each variant
        const initialVariants: Record<string, string> = {};
        prod.variants?.forEach((v: any) => {
          if (v.options?.length > 0) {
            initialVariants[v.type] = v.options[0].value;
          }
        });
        setSelectedVariants(initialVariants);

        // Fetch related products and reviews in parallel in the background
        try {
          const [related, revs] = await Promise.all([
            productService.getProductsByCategory(prod.categorySlug, 4),
            reviewService.getProductReviews(prod.id, 'approved'),
          ]);
          if (isMounted) {
            setRelatedProducts(related.filter((p: any) => p.id !== prod.id));
            setReviews(revs);
          }
        } catch {
          // ignore sub-fetches
        }
      })
      .catch((err: unknown) => {
        console.error('Error loading product details:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug, navigate]);

  if (isLoading || !product) {
    return (
      <div className="max-w-content mx-auto px-4 py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  const effectivePrice = product.salePrice ?? product.regularPrice;
  const discountPercent = product.salePrice
    ? calculateDiscount(product.regularPrice, product.salePrice)
    : 0;

  const currentImage = product.images?.[selectedImageIndex]?.url || '/placeholder.png';

  const handleVariantChange = (variantType: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantType]: value }));
  };

  const formattedSelectedVariants: CartItemVariant[] = Object.entries(selectedVariants).map(
    ([type, value]) => {
      const vDef = product.variants?.find((v) => v.type === type);
      const optDef = vDef?.options?.find((o) => o.value === value);
      return {
        type,
        value,
        label: optDef?.label || value,
      };
    }
  );

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0 || product.stockStatus === 'out_of_stock') {
      toast.error(isBangla ? 'পণ্যটি বর্তমানে স্টকে নেই' : 'This product is currently out of stock');
      return;
    }

    addItemToCart(product, quantity, formattedSelectedVariants);
    toast.success(t('product.added_to_cart'));
    navigate(ROUTES.CART);
  };

  const handleBuyNow = () => {
    if (product.stockQuantity <= 0 || product.stockStatus === 'out_of_stock') {
      toast.error(isBangla ? 'পণ্যটি বর্তমানে স্টকে নেই' : 'This product is currently out of stock');
      return;
    }

    addItemToCart(product, quantity, formattedSelectedVariants);
    navigate(ROUTES.CHECKOUT);
  };

  const handleToggleWishlist = () => {
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      primaryImage: product.images?.[0]?.url,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      stockStatus: product.stockStatus,
      addedAt: Date.now(),
    });
    toast.success(isInWishlist ? t('product.remove_from_wishlist') : t('product.added_to_wishlist'));
  };

  const handleShare = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      toast.success(isBangla ? 'লিংক কপি করা হয়েছে!' : 'Link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(isBangla ? 'রিভিউ দিতে অনুগ্রহ করে লগইন করুন' : 'Please log in to submit a review');
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!newReviewBody.trim()) {
      toast.error(isBangla ? 'অনুগ্রহ করে রিভিউর বিবরণ লিখুন' : 'Please write your review text');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewService.submitReview({
        productId: product.id,
        productSlug: product.slug,
        userId: user.uid,
        userName: user.displayName || 'গ্রাহক',
        rating: newRating,
        title: newReviewTitle.trim() || undefined,
        body: newReviewBody.trim(),
        isVerifiedPurchase: false, // Default pending moderation
      });

      toast.success(t('success.review_submitted'));
      setNewReviewTitle('');
      setNewReviewBody('');
      setNewRating(5);
    } catch (err) {
      toast.error(isBangla ? 'রিভিউ জমা দেওয়া যায়নি' : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${product.nameBn} — ${BRAND.nameBn}`}</title>
        <meta name="description" content={product.descriptionBn?.slice(0, 160) || product.nameBn} />
        <meta property="og:title" content={product.nameBn} />
        <meta property="og:description" content={product.descriptionBn?.slice(0, 160)} />
        {product.images?.[0]?.url && <meta property="og:image" content={product.images[0].url} />}
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-6 font-bangla">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#77717A] mb-6 flex-wrap">
          <Link to={ROUTES.HOME} className="hover:text-[#D45D83] transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={ROUTES.PRODUCTS} className="hover:text-[#D45D83] transition-colors">
            {t('nav.products')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={`/category/${product.categorySlug}`} className="hover:text-[#D45D83] transition-colors">
            {product.categorySlug}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#292329] font-medium truncate max-w-xs">{product.nameBn}</span>
        </nav>

        {/* Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-12">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] max-h-[500px] w-full bg-[#FFF8FA] rounded-2xl overflow-hidden border border-[#F0E2E8] group">
              <img
                src={currentImage}
                alt={product.nameBn}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-[#D45D83] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {discountPercent}% {t('common.off')}
                </div>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-[#D45D83] ring-2 ring-[#D45D83]/20'
                        : 'border-[#F0E2E8] hover:border-gray-400'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Actions & Specs */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#292329] leading-snug">
                    {product.nameBn}
                  </h1>
                  {product.nameEn && (
                    <p className="text-sm text-[#77717A] mt-1 font-sans">{product.nameEn}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 rounded-full border border-[#F0E2E8] text-[#77717A] hover:text-[#D45D83] hover:bg-[#FFF0F5] transition-colors shrink-0"
                  title="শেয়ার করুন"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Rating & SKU */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[#77717A]">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  <span className="font-bold text-[#292329]">{product.averageRating?.toFixed(1) || '৫.০'}</span>
                  <span>({reviews.length} {t('product.reviews')})</span>
                </div>
                <span>|</span>
                <span>SKU: {product.sku || 'WF-DEFAULT'}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 p-4 bg-[#FFF8FA] rounded-2xl border border-[#F0E2E8]">
              <span className="text-3xl font-extrabold text-[#D45D83]">
                {formatPrice(effectivePrice)}
              </span>
              {product.salePrice && (
                <span className="text-lg text-[#77717A] line-through">
                  {formatPrice(product.regularPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                  {t('product.you_save')} {formatPrice(product.regularPrice - product.salePrice!)}
                </span>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-2">
                {product.variants.map((variant) => (
                  <div key={variant.type}>
                    <label className="block text-xs font-bold text-[#292329] uppercase tracking-wider mb-2">
                      {isBangla ? (variant.typeBn || variant.type) : variant.type}:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => {
                        const isSelected = selectedVariants[variant.type] === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleVariantChange(variant.type, option.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'border-[var(--color-primary,#0F172A)] bg-[var(--color-primary,#0F172A)] text-white shadow-sm ring-2 ring-[var(--color-primary,#0F172A)]/20'
                                : 'border-[#F0E2E8] bg-white text-[#292329] hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold text-[#292329] uppercase tracking-wider mb-2">
                {t('product.quantity')}:
              </label>
              <div className="inline-flex items-center border border-[#F0E2E8] rounded-2xl bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-[#77717A] hover:text-[#292329] disabled:opacity-30 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#292329]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 20, q + 1))}
                  disabled={quantity >= product.stockQuantity}
                  className="w-8 h-8 flex items-center justify-center text-[#77717A] hover:text-[#292329] disabled:opacity-30 rounded-lg hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs: Add to Cart, Buy Now, Wishlist */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity <= 0}
                  className="flex-1 py-3.5 px-6 bg-[#D45D83] hover:bg-[#B8446C] disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('product.add_to_cart')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-center ${
                    isInWishlist
                      ? 'border-[#D45D83] bg-[#FFF0F5] text-[#D45D83]'
                      : 'border-[#F0E2E8] bg-white text-[#77717A] hover:text-[#D45D83] hover:border-[#D45D83]'
                  }`}
                  aria-label="পছন্দের তালিকায় যোগ করুন"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-[#D45D83]' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stockQuantity <= 0}
                className="w-full py-3 px-6 bg-[#292329] hover:bg-black disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>{t('product.buy_now')}</span>
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#F0E2E8] text-center text-xs text-[#77717A]">
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#FFF8FA]">
                <Truck className="w-4 h-4 text-[#D45D83] mb-1" />
                <span>{isBangla ? 'দ্রুত ডেলিভারি' : 'Fast Delivery'}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#FFF8FA]">
                <ShieldCheck className="w-4 h-4 text-[#D45D83] mb-1" />
                <span>{isBangla ? '১০০% অরিজিনাল' : '100% Authentic'}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#FFF8FA]">
                <RotateCcw className="w-4 h-4 text-[#D45D83] mb-1" />
                <span>{isBangla ? 'সহজ রিটার্ন' : 'Easy Return'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Info Section: Description, Specifications, Reviews */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-12">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#F0E2E8] gap-6 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('desc')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                activeTab === 'desc'
                  ? 'border-[#D45D83] text-[#D45D83]'
                  : 'border-transparent text-[#77717A] hover:text-[#292329]'
              }`}
            >
              {t('product.description')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                activeTab === 'specs'
                  ? 'border-[#D45D83] text-[#D45D83]'
                  : 'border-transparent text-[#77717A] hover:text-[#292329]'
              }`}
            >
              {t('product.specifications')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                activeTab === 'reviews'
                  ? 'border-[#D45D83] text-[#D45D83]'
                  : 'border-transparent text-[#77717A] hover:text-[#292329]'
              }`}
            >
              {t('product.reviews')} ({reviews.length})
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === 'desc' && (
            <div
              className="prose-brand text-sm leading-relaxed text-[#292329]"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.descriptionBn || 'বিবরণ নেই'),
              }}
            />
          )}

          {/* Tab 2: Specifications */}
          {activeTab === 'specs' && (
            <div
              className="prose-brand text-sm leading-relaxed text-[#292329]"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.specificationsBn || 'বৈশিষ্ট্যের বিবরণ নেই'),
              }}
            />
          )}

          {/* Tab 3: Reviews & Review Form */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Write Review Section */}
              <div className="bg-[#FFF8FA] border border-[#F0E2E8] rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#292329] mb-3">{t('product.write_review')}</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#77717A] mb-1">
                      {t('review.rating')}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'stroke-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={t('review.title')}
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#F0E2E8] rounded-xl text-xs text-[#292329] focus:outline-none focus:ring-1 focus:ring-[#D45D83]"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      placeholder={t('product.write_review_desc')}
                      value={newReviewBody}
                      onChange={(e) => setNewReviewBody(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#F0E2E8] rounded-xl text-xs text-[#292329] focus:outline-none focus:ring-1 focus:ring-[#D45D83]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {isSubmittingReview ? t('product.submitting') : t('review.submit')}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 border border-[#F0E2E8] rounded-2xl bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#292329]">{rev.userName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> {t('review.verified_purchase')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                          ))}
                        </div>
                      </div>
                      {rev.title && <h4 className="text-xs font-bold text-[#292329]">{rev.title}</h4>}
                      <p className="text-xs text-[#77717A] leading-relaxed">{rev.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-[#77717A] py-6">{t('product.no_reviews')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#292329]">{t('product.related')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailPage;
