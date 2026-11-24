// ─── ProductCard — Women's Favorite ─────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import type { ProductSummary } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND, ROUTES } from '@/constants';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import type { WishlistItem } from '@/types';
import toast from 'react-hot-toast';

/* ── Helpers ── */
function formatPrice(amount: number): string {
  return `${BRAND.currencySymbol}${amount.toLocaleString('bn-BD')}`;
}

function calcDiscountPct(regular: number, sale: number): number {
  return Math.round(((regular - sale) / regular) * 100);
}

/* ── Star rating renderer ── */
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={clsx(
            'transition-colors',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          )}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">({count})</span>
    </div>
  );
}

/* ── Props ── */
interface ProductCardProps {
  product: ProductSummary;
  /** Called when wishlist button is toggled */
  onWishlistToggle?: (productId: string, isWishlisted: boolean) => void;
  isWishlisted?: boolean;
  className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ProductCard({
  product,
  onWishlistToggle,
  isWishlisted,
  className,
}: ProductCardProps) {
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  const isItemInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlistItem = useWishlistStore((state) => state.toggleItem);
  const wishlisted = isWishlisted !== undefined ? isWishlisted : isItemInWishlist;

  const [heartAnimating, setHeartAnimating] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const isOnSale = product.salePrice !== undefined && product.salePrice < product.regularPrice;
  const discountPct = isOnSale ? calcDiscountPct(product.regularPrice, product.salePrice!) : 0;

  /* ── Wishlist toggle ── */
  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setHeartAnimating(true);
      setTimeout(() => setHeartAnimating(false), 400);

      const item: WishlistItem = {
        productId: product.id,
        slug: product.slug,
        nameBn: product.nameBn,
        nameEn: product.nameEn,
        primaryImage: product.primaryImage || (product as any).images?.[0]?.url,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        stockStatus: product.stockStatus,
        addedAt: Date.now(),
      };

      toggleWishlistItem(item);

      const next = !wishlisted;
      if (next) {
        toast.success(isBangla ? 'পছন্দের তালিকায় যোগ করা হয়েছে ❤️' : 'Added to wishlist ❤️');
      } else {
        toast.success(isBangla ? 'পছন্দের তালিকা থেকে সরানো হয়েছে' : 'Removed from wishlist');
      }

      onWishlistToggle?.(product.id, next);
    },
    [wishlisted, product, toggleWishlistItem, onWishlistToggle, isBangla]
  );

  /* ── Add to cart ── */
  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock || addingToCart) return;
      setAddingToCart(true);

      // Add product to cart store
      useCartStore.getState().addItem(product as any, 1, []);
      toast.success(isBangla ? 'পণ্যটি কার্টে যোগ করা হয়েছে!' : 'Product added to cart!');

      // Navigate directly to cart page
      navigate(ROUTES.CART);
      setTimeout(() => setAddingToCart(false), 500);
    },
    [isOutOfStock, addingToCart, navigate, product, isBangla]
  );

  return (
    <Link
      to={`/product/${product.slug}`}
      className={clsx(
        'group relative flex flex-col bg-white rounded-2xl overflow-hidden',
        'border border-[#F0E2E8] shadow-sm hover:shadow-lg',
        'transition-all duration-300 ease-out hover:-translate-y-1',
        className
      )}
      aria-label={product.nameBn}
    >
      {/* ── Image container (3:4 aspect ratio) ── */}
      <div className="relative overflow-hidden bg-[#FFF8FA]" style={{ paddingBottom: '133.33%' }}>
        {/* Product image */}
        {(product.primaryImage || (product as any).images?.[0]?.url) ? (
          <img
            src={product.primaryImage || (product as any).images?.[0]?.url}
            alt={product.nameBn}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Graceful fallback to default high quality placeholder
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F7C8D5]/20 to-[#FFF8FA]">
            <Eye size={40} className="text-[#D45D83]/30" />
          </div>
        )}


        {/* ── Out of Stock overlay ── */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-white text-[#D45D83] font-semibold text-sm px-3 py-1 rounded-full shadow">
              {t('product.out_of_stock')}
            </span>
          </div>
        )}

        {/* ── Badges (top-left) ── */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isOnSale && (
            <span className="bg-[#D45D83] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPct}% {t('common.off')}
            </span>
          )}
          {product.isNewArrival && !isOnSale && (
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {t('common.new')}
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {t('product.bestseller')}
            </span>
          )}
        </div>

        {/* ── Wishlist button (top-right) ── */}
        <button
          onClick={handleWishlistClick}
          aria-label={wishlisted ? t('product.remove_from_wishlist') : t('product.add_to_wishlist')}
          className={clsx(
            'absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-white/90 backdrop-blur-sm shadow-sm',
            'transition-all duration-200 hover:scale-110 active:scale-95',
            heartAnimating && 'scale-125'
          )}
        >
          <Heart
            size={16}
            className={clsx(
              'transition-all duration-300',
              wishlisted ? 'fill-[#D45D83] text-[#D45D83]' : 'text-gray-400'
            )}
          />
        </button>

        {/* ── Add to cart (desktop hover, always mobile) ── */}
        <div
          className={clsx(
            'absolute bottom-0 left-0 right-0 z-20 p-2',
            'translate-y-full group-hover:translate-y-0',
            'md:transition-transform md:duration-300 md:ease-out',
            'md:block hidden'
          )}
        >
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium',
              'bg-[#D45D83] text-white shadow-lg',
              'transition-all duration-200 active:scale-95',
              isOutOfStock
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#B8446C]'
            )}
          >
            <ShoppingCart size={14} />
            {t('product.add_to_cart')}
          </button>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Product name */}
        <h3 className="text-sm font-medium text-[#292329] line-clamp-2 leading-snug">
          {isBangla ? product.nameBn : (product.nameEn || product.nameBn)}
        </h3>

        {/* Star rating */}
        {product.totalReviews > 0 && (
          <StarRating rating={product.averageRating} count={product.totalReviews} />
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {isOnSale ? (
            <>
              <span className="text-base font-bold text-[#D45D83]">
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.regularPrice)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-[#292329]">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>

        {/* Mobile add to cart button — always visible */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={clsx(
            'md:hidden w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold mt-2 transition-all active:scale-95 shadow-xs',
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-[#0F172A] hover:bg-slate-800 text-white'
          )}
        >
          <ShoppingCart size={13} className="text-white shrink-0" />
          <span className="text-white font-medium">
            {isOutOfStock ? (isBangla ? 'স্টকে নেই' : 'Out of stock') : (isBangla ? 'কার্টে যোগ করুন' : 'Add to Cart')}
          </span>
        </button>

      </div>
    </Link>
  );
}

export { ProductCard };
