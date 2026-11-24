import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck, Truck, Check, CreditCard, ChevronRight,
  AlertCircle, Lock, ShoppingBag
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/features/auth/AuthContext';
import { settingsService, getDeliveryFees } from '@/services/settingsService';
import { userService } from '@/services/userService';
import { orderService } from '@/services/orderService';
import { formatPrice, isValidBangladeshPhone, generateOrderReference } from '@/utils';
import { BRAND, ROUTES, BANGLADESH_DISTRICTS, ORDER_STATUS } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PaymentMethod, SiteSettings, DeliveryZone } from '@/types';

export const CheckoutPage: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const couponCode = useCartStore((state) => state.couponCode);
  const couponDiscount = useCartStore((state) => state.couponDiscount);
  const subtotal = useCartStore((state) => state.getSubtotal());

  // Form states
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [area, setArea] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);

  // Settings & calculations
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [deliveryFee, setDeliveryFee] = useState<number>(() => getDeliveryFees().dhaka);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false); // Ref-based lock: prevents double-submit even before React re-renders

  // Load site settings & user saved address on mount
  useEffect(() => {
    let isMounted = true;

    settingsService.getSiteSettings()
      .then((data: any) => {
        if (isMounted && data) {
          setSiteSettings(data);
          // If fees were loaded from Firestore, re-evaluate current fee
          const fees = getDeliveryFees();
          setDeliveryFee(district === 'ঢাকা' ? fees.dhaka : fees.outsideDhaka);
        }
      })
      .catch(() => {});

    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setFullName(defaultAddr.fullName || user.displayName || '');
      setPhone(defaultAddr.phone || '');
      setAddressLine1(defaultAddr.addressLine1 || '');
      if (defaultAddr.district) setDistrict(defaultAddr.district);
      if (defaultAddr.area) setArea(defaultAddr.area);
    }

    return () => { isMounted = false; };
  }, [user]);

  // Update delivery fee when district changes
  useEffect(() => {
    let isMounted = true;
    const fees = getDeliveryFees();

    settingsService.getDeliveryZoneForDistrict(district)
      .then((zone: any) => {
        if (!isMounted) return;
        if (zone) {
          setDeliveryZone(zone);
          setDeliveryFee(zone.deliveryFee);
        } else {
          setDeliveryFee(district === 'ঢাকা' ? fees.dhaka : fees.outsideDhaka);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setDeliveryFee(district === 'ঢাকা' ? fees.dhaka : fees.outsideDhaka);
      });

    return () => { isMounted = false; };
  }, [district]);

  // If cart is empty, redirect to cart page
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate(ROUTES.CART, { replace: true });
    }
  }, [cartItems, navigate]);

  const totalAmount = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-submit protection: ref guard fires instantly, before React state update
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!fullName.trim()) {
      toast.error(isBangla ? 'অনুগ্রহ করে আপনার পুরো নাম দিন' : 'Please provide full name');
      return;
    }

    if (!isValidBangladeshPhone(phone)) {
      toast.error(isBangla ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)' : 'Invalid Bangladesh phone number');
      return;
    }

    if (!addressLine1.trim()) {
      toast.error(isBangla ? 'অনুগ্রহ করে আপনার পূর্ণ ঠিকানা দিন' : 'Please provide street address');
      return;
    }

    if (paymentMethod !== 'cod') {
      toast(
        isBangla
          ? 'বিকাশ ও নগদ গেটওয়ে বর্তমানে ট্রায়াল মোডে আছে। টেস্ট অর্ডারের জন্য ক্যাশ অন ডেলিভারি বেছে নিতে পারেন অথবা এখনই প্রক্রিয়া চালিয়ে যান।'
          : 'Online payments currently in sandbox mode. Proceeding with order placement.',
        { icon: 'ℹ️' }
      );
    }

    setIsSubmitting(true);
    try {
      const orderRefNumber = generateOrderReference();

      const orderData = {
        orderReference: orderRefNumber,
        userId: user?.uid || 'guest',
        userEmail: user?.email || '',
        items: cartItems.map((item) => ({
          productId: item.productId,
          slug: item.slug,
          nameBn: item.nameBn,
          nameEn: item.nameEn || '',
          primaryImage: item.primaryImage || '',
          sku: item.slug,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants || [],
          variantKey: item.variantKey,
          subtotal: item.unitPrice * item.quantity,
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          district,
          area: area.trim(),
          deliveryInstructions: deliveryInstructions.trim(),
        },
        subtotal,
        discountAmount: couponDiscount,
        couponCode: couponCode || null,
        deliveryFee,
        total: totalAmount,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'pending' : 'initiated',
          amount: totalAmount,
        },
        status: ORDER_STATUS.PENDING,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            note: 'অর্ডার গৃহীত হয়েছে',
            updatedBy: user?.uid || 'customer',
            updatedAt: new Date(),
          },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderId = await orderService.createOrder(orderData);

      // Save address to user profile if checked
      if (saveAddress && user) {
        try {
          await userService.addAddress(user.uid, {
            label: 'ঠিকানা',
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            district,
            area: area.trim(),
            isDefault: true,
          });
        } catch {
          // ignore address save failure
        }
      }

      clearCart();
      toast.success(isBangla ? 'আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!' : 'Order placed successfully!');
      navigate(`/account/orders/${orderId}`, { replace: true });
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error(isBangla ? 'অর্ডার প্রক্রিয়া করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false; // Release lock so user can retry if order failed
    }
  };

  return (
    <>
      <Helmet>
        <title>{`চেকআউট — ${BRAND.nameBn}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#77717A] mb-6">
          <Link to={ROUTES.HOME} className="hover:text-[#D45D83] transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={ROUTES.CART} className="hover:text-[#D45D83] transition-colors">
            {t('nav.cart')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#292329] font-medium">{t('checkout.title')}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-[#292329] mb-8">
          {t('checkout.title')}
        </h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Form: Delivery & Payment Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Delivery Address */}
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-[#F0E2E8] pb-4">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D45D83] font-bold text-xs flex items-center justify-center">
                  {t('checkout.step_1')}
                </div>
                <h2 className="text-lg font-bold text-[#292329]">
                  {t('checkout.delivery_info')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    {t('checkout.full_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('checkout.full_name_placeholder')}
                    required
                    className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    {t('checkout.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                    className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    {t('checkout.district')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  >
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    {t('checkout.area')}
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={t('checkout.area_placeholder')}
                    className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  {t('checkout.address_full')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder={t('checkout.address_placeholder')}
                  required
                  className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  {t('checkout.instructions')}
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder={t('checkout.instructions_placeholder')}
                  className="w-full px-4 py-2.5 text-xs bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              {user && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <label htmlFor="saveAddress" className="text-xs text-[#77717A] cursor-pointer">
                    {t('checkout.save_address')}
                  </label>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-[#F0E2E8] pb-4">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D45D83] font-bold text-xs flex items-center justify-center">
                  {t('checkout.step_2')}
                </div>
                <h2 className="text-lg font-bold text-[#292329]">
                  {t('checkout.payment_method')}
                </h2>
              </div>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#D45D83] bg-[#FFF8FA]'
                      : 'border-[#F0E2E8] hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 w-4 h-4 text-[#D45D83] focus:ring-[#D45D83]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#292329]">
                        {t('checkout.cod_title')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {t('checkout.popular')}
                      </span>
                    </div>
                    <p className="text-xs text-[#77717A] mt-1">
                      {t('checkout.cod_desc')}
                    </p>
                  </div>
                </label>

                {/* bKash (Online Payment) */}
                <div
                  onClick={() => toast(isBangla ? 'বিকাশ অনলাইন পেমেন্ট শীঘ্রই চালু হচ্ছে! অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।' : 'bKash online payment is coming soon! Please choose Cash on Delivery.', { icon: 'ℹ️' })}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 border-dashed border-[#F0E2E8] bg-gray-50/50 cursor-pointer hover:border-pink-300 transition-all opacity-85"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bkash"
                    disabled
                    checked={false}
                    className="mt-1 w-4 h-4 text-gray-300 cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#292329]">
                          {t('checkout.bkash_title')}
                        </span>
                        <span className="text-xs font-bold text-[#E2136E]">bKash</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-[#77717A] mt-1">
                      {isBangla ? 'অনলাইন পেমেন্ট গেটওয়ে (শীঘ্রই আসছে)' : 'Online Payment (Coming Soon)'}
                    </p>
                  </div>
                </div>

                {/* Nagad (Online Payment) */}
                <div
                  onClick={() => toast(isBangla ? 'নগদ অনলাইন পেমেন্ট শীঘ্রই চালু হচ্ছে! অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।' : 'Nagad online payment is coming soon! Please choose Cash on Delivery.', { icon: 'ℹ️' })}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 border-dashed border-[#F0E2E8] bg-gray-50/50 cursor-pointer hover:border-pink-300 transition-all opacity-85"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nagad"
                    disabled
                    checked={false}
                    className="mt-1 w-4 h-4 text-gray-300 cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#292329]">
                          {t('checkout.nagad_title')}
                        </span>
                        <span className="text-xs font-bold text-[#F7941D]">Nagad</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-[#77717A] mt-1">
                      {isBangla ? 'অনলাইন পেমেন্ট গেটওয়ে (শীঘ্রই আসছে)' : 'Online Payment (Coming Soon)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary: Order Items & Place Order CTA */}
          <div className="space-y-6">
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                {t('checkout.order_summary')}
              </h2>

              {/* Items in Checkout */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item) => (
                  <div key={item.variantKey} className="flex items-center gap-3 text-xs">
                    <div className="w-12 h-14 bg-[#FFF8FA] rounded-lg overflow-hidden shrink-0 border border-[#F0E2E8]">
                      <img src={item.primaryImage || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#292329] truncate">
                        {isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                      </p>
                      <p className="text-[#77717A] text-[11px]">{t('checkout.quantity')}: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#292329] shrink-0">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2.5 text-xs md:text-sm border-t border-[#F0E2E8] pt-4">
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
                  <span>{t('checkout.delivery_charge_for')} ({district})</span>
                  <span className="font-semibold text-[#292329]">{formatPrice(deliveryFee)}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#292329] border-t border-[#F0E2E8] pt-3">
                  <span>{t('cart.total')}</span>
                  <span className="text-xl text-[#D45D83]">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 font-bold rounded-2xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed pointer-events-none'
                    : 'bg-[#D45D83] hover:bg-[#B8446C] text-white cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isBangla ? 'অর্ডার প্রক্রিয়া হচ্ছে...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t('checkout.place_order')}</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-[#FFF8FA] rounded-xl text-[11px] text-[#77717A] space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-[#292329]">
                  <Truck className="w-3.5 h-3.5 text-[#D45D83]" />
                  <span>{t('checkout.est_delivery')} {deliveryZone?.estimatedDays || (district === 'ঢাকা' ? t('checkout.days_dhaka') : t('checkout.days_outside'))}</span>
                </p>
                <p>{t('checkout.order_sms_notice')}</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CheckoutPage;
