import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';
import { couponService } from '@/services/couponService';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice } from '@/utils';
import { BRAND, ROUTES } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';

export const CartPage: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const couponCode = useCartStore((state) => state.couponCode);
  const couponDiscount = useCartStore((state) => state.couponDiscount);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const subtotal = useCartStore((state) => state.getSubtotal());

  const [inputCoupon, setInputCoupon] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const result = await couponService.validateCoupon(
        inputCoupon.trim().toUpperCase(),
        subtotal,
        user?.uid || 'guest'
      );

      if (result.valid) {
        applyCoupon(inputCoupon.trim().toUpperCase(), result.discount);
        toast.success(t('cart.coupon_applied'));
        setInputCoupon('');
      } else {
        toast.error(result.error || t('cart.invalid_coupon'));
      }
    } catch (err) {
      toast.error(t('cart.invalid_coupon'));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, subtotal - couponDiscount);

  if (items.length === 0) {
    return (
      <div className="max-w-content mx-auto px-4 py-16 font-bangla">
        <EmptyState
          icon={ShoppingBag}
          title={t('cart.empty')}
          description={t('cart.empty_description')}
          actionLabel={t('cart.continue_shopping')}
          onAction={() => navigate(ROUTES.PRODUCTS)}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${t('cart.title')} — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        <h1 className="text-2xl md:text-3xl font-bold text-[#292329] mb-8">
          {t('cart.title')} <span className="text-sm font-normal text-[#77717A]">({items.length} {t('common.items')})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.variantKey}
                className="flex items-center gap-4 p-4 md:p-5 bg-white border border-[#F0E2E8] rounded-2xl shadow-sm"
              >
                {/* Thumbnail */}
                <Link to={`/product/${item.slug}`} className="shrink-0 w-20 h-24 bg-[#FFF8FA] rounded-xl overflow-hidden border border-[#F0E2E8]">
                  <img
                    src={item.primaryImage || '/placeholder.png'}
                    alt={item.nameBn}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.slug}`}
                    className="font-bold text-sm md:text-base text-[#292329] hover:text-[#D45D83] transition-colors truncate block"
                  >
                    {item.nameBn}
                  </Link>

                  {/* Selected Variants */}
                  {item.selectedVariants && item.selectedVariants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedVariants.map((v, i) => (
                        <span key={i} className="text-[11px] bg-[#FFF0F5] text-[#D45D83] px-2 py-0.5 rounded-md font-medium">
                          {v.type}: {v.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-bold text-sm md:text-base text-[#D45D83]">
                      {formatPrice(item.unitPrice)}
                    </span>
                    {item.salePrice && (
                      <span className="text-xs text-[#77717A] line-through">
                        {formatPrice(item.regularPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center border border-[#F0E2E8] rounded-xl bg-[#FFF8FA] p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantKey, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-[#77717A] hover:text-[#292329]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#292329]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantKey, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-[#77717A] hover:text-[#292329]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantKey)}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    title={t('cart.remove_item')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#D45D83] hover:underline"
              >
                <span>{t('cart.continue_shopping')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                {isBangla ? 'অর্ডারের বিবরণ' : 'Order Summary'}
              </h2>

              {/* Coupon Form */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span>{couponCode} (-{formatPrice(couponDiscount)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      {isBangla ? 'সরান' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('cart.coupon_code')}
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs uppercase bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingCoupon}
                      className="px-4 py-2 bg-[#D45D83] hover:bg-[#B8446C] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isValidatingCoupon ? (isBangla ? 'যাচাই হচ্ছে...' : 'Validating...') : t('cart.apply_coupon')}
                    </button>
                  </form>
                )}
              </div>

              {/* Calculation List */}
              <div className="space-y-3 text-xs md:text-sm border-t border-[#F0E2E8] pt-4">
                <div className="flex justify-between text-[#77717A]">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-semibold text-[#292329]">{formatPrice(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>{t('cart.discount')}</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#77717A]">
                  <span>{t('cart.delivery_fee')}</span>
                  <span className="text-xs text-[#77717A] italic">
                    {isBangla ? 'চেকআউটে জেলা অনুযায়ী নির্ধারিত হবে' : 'Calculated at checkout'}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#292329] border-t border-[#F0E2E8] pt-3">
                  <span>{t('cart.total')}</span>
                  <span className="text-xl text-[#D45D83]">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className="w-full py-3.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-2xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{t('cart.checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#77717A] pt-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>{isBangla ? 'নিরাপদ এবং বিশ্বস্ত চেকআউট' : '100% Secure Checkout'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
