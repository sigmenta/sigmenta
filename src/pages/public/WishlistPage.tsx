import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice } from '@/utils';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export const WishlistPage: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: (typeof items)[0]) => {
    addItemToCart(
      {
        id: item.productId,
        slug: item.slug,
        nameBn: item.nameBn,
        nameEn: item.nameEn,
        regularPrice: item.regularPrice,
        salePrice: item.salePrice,
        stockQuantity: 20,
        stockStatus: item.stockStatus,
        images: item.primaryImage ? [{ url: item.primaryImage, publicId: '', isPrimary: true }] : [],
        variants: [],
      } as any,
      1,
      []
    );
    toast.success(t('product.added_to_cart'));
  };

  if (items.length === 0) {
    return (
      <div className="max-w-content mx-auto px-4 py-16 font-bangla">
        <EmptyState
          icon={Heart}
          title={isBangla ? 'পছন্দের তালিকা খালি' : 'Your Wishlist is Empty'}
          description={isBangla ? 'আপনি এখনও কোনো পণ্য পছন্দের তালিকায় যোগ করেননি।' : 'You have not added any products to your wishlist yet.'}
          actionLabel={t('cart.continue_shopping')}
          onAction={() => navigate(ROUTES.PRODUCTS)}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${t('nav.wishlist')} — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#292329]">
              {t('nav.wishlist')}
            </h1>
            <p className="text-xs text-[#77717A] mt-1">
              {isBangla ? `মোট ${items.length}টি পছন্দের পণ্য সংরক্ষিত আছে` : `Total ${items.length} saved wishlist items`}
            </p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#D45D83] hover:underline"
          >
            <span>{t('cart.continue_shopping')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => {
            const effectivePrice = item.salePrice ?? item.regularPrice;

            return (
              <div
                key={item.productId}
                className="bg-white border border-[#F0E2E8] rounded-3xl overflow-hidden shadow-sm hover:shadow-card transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image with Remove icon */}
                  <div className="relative aspect-[3/4] bg-[#FFF8FA] overflow-hidden">
                    <Link to={`/product/${item.slug}`}>
                      <img
                        src={item.primaryImage || '/placeholder.png'}
                        alt={isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.productId);
                        toast.success(t('product.remove_from_wishlist'));
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-red-500 rounded-full shadow-sm transition-colors"
                      title={isBangla ? 'সরিয়ে দিন' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-1.5">
                    <Link
                      to={`/product/${item.slug}`}
                      className="font-bold text-sm text-[#292329] hover:text-[#D45D83] transition-colors line-clamp-1 block"
                    >
                      {isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                    </Link>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#D45D83]">
                        {formatPrice(effectivePrice)}
                      </span>
                      {item.salePrice && (
                        <span className="text-xs text-[#77717A] line-through">
                          {formatPrice(item.regularPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add to Cart button */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="w-full py-2.5 bg-[#FFF0F5] hover:bg-[#D45D83] text-[#D45D83] hover:text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t('product.add_to_cart')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default WishlistPage;
