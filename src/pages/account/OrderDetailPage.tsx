import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package, Truck, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Printer, XCircle, ArrowLeft, MapPin, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '@/services/orderService';
import { formatPrice, formatDate } from '@/utils';
import { BRAND, ROUTES, ORDER_STATUS_LABELS, ORDER_STATUS_LABELS_EN, ORDER_STATUS_COLORS } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import type { Order } from '@/types';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!orderId) return;

    setIsLoading(true);
    orderService.getOrderById(orderId)
      .then((data: any) => {
        if (!isMounted) return;
        if (!data) {
          toast.error(isBangla ? 'অর্ডারটি পাওয়া যায়নি' : 'Order not found');
          navigate(ROUTES.ACCOUNT_ORDERS, { replace: true });
          return;
        }
        setOrder(data);
      })
      .catch((err: unknown) => {
        console.error('Error fetching order detail:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [orderId, navigate, isBangla]);

  const handleCancelOrder = async () => {
    if (!order || !user) return;
    if (!cancelReason.trim()) {
      toast.error(isBangla ? 'অনুগ্রহ করে বাতিলের কারণ লিখুন' : 'Please provide cancellation reason');
      return;
    }

    setIsCancelling(true);
    try {
      await orderService.cancelOrder(order.id, user.uid, cancelReason.trim());
      toast.success(isBangla ? 'অর্ডারটি সফলভাবে বাতিল করা হয়েছে' : 'Order cancelled successfully');
      setCancelModalOpen(false);
      // Reload order state
      const updated = await orderService.getOrderById(order.id);
      if (updated) setOrder(updated);
    } catch (err) {
      toast.error(isBangla ? 'অর্ডার বাতিল করা সম্ভব হয়নি' : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-content mx-auto px-4 py-20 text-center font-bangla text-[#77717A]">
        <div className="w-10 h-10 rounded-full border-4 border-[#F7C8D5] border-t-[#D45D83] animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">{isBangla ? 'অর্ডারের বিবরণ লোড হচ্ছে...' : 'Loading order details...'}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-content mx-auto px-4 py-20 text-center font-bangla space-y-4">
        <div className="w-16 h-16 rounded-full bg-pink-50 text-[#D45D83] flex items-center justify-center mx-auto text-2xl font-bold">
          📦
        </div>
        <h2 className="text-lg font-bold text-[#292329]">{isBangla ? 'অর্ডারটি পাওয়া যায়নি' : 'Order not found'}</h2>
        <p className="text-xs text-[#77717A] max-w-sm mx-auto">
          {isBangla ? 'অর্ডার রেফারেন্স বা আইডিটি সঠিক নয় অথবা মুছে ফেলা হয়েছে।' : 'Order reference or ID is not valid or has been removed.'}
        </p>
        <div>
          <Link
            to={ROUTES.ACCOUNT_ORDERS}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D45D83] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#B8446C] transition-colors"
          >
            <ArrowLeft size={16} /> {isBangla ? 'আমার অর্ডার তালিকায় ফিরুন' : 'Back to My Orders'}
          </Link>
        </div>
      </div>
    );
  }

  // ── 5-minute cancellation window ─────────────────────────────────────────
  const CANCEL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const getOrderCreatedAt = (): number => {
    const ca = (order as any).createdAt;
    if (!ca) return 0;
    if (typeof ca?.toDate === 'function') return ca.toDate().getTime();
    if (typeof ca?.seconds === 'number') return ca.seconds * 1000;
    if (typeof ca === 'string' || typeof ca === 'number') return new Date(ca).getTime();
    return 0;
  };

  const orderCreatedTs = getOrderCreatedAt();
  const orderAge = orderCreatedTs > 0 ? Date.now() - orderCreatedTs : 0;
  const canCancel = order.status === 'pending' && (orderCreatedTs === 0 || orderAge < CANCEL_WINDOW_MS);

  const steps = [
    { key: 'pending', label: isBangla ? 'অপেক্ষমাণ' : 'Pending' },
    { key: 'confirmed', label: isBangla ? 'নিশ্চিত' : 'Confirmed' },
    { key: 'processing', label: isBangla ? 'প্রক্রিয়াধীন' : 'Processing' },
    { key: 'shipped', label: isBangla ? 'পাঠানো হয়েছে' : 'Shipped' },
    { key: 'delivered', label: isBangla ? 'ডেলিভারি সম্পন্ন' : 'Delivered' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <>
      <Helmet>
        <title>{isBangla ? `অর্ডার #${order.orderReference || order.id} — ${BRAND.nameBn}` : `Order #${order.orderReference || order.id} — ${BRAND.name}`}</title>
      </Helmet>

      <div className="max-w-content mx-auto px-4 py-8 font-bangla">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#77717A] mb-6">
          <Link to={ROUTES.HOME} className="hover:text-[#D45D83] transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={ROUTES.ACCOUNT_ORDERS} className="hover:text-[#D45D83] transition-colors">
            {t('order.my_orders')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#292329] font-medium">{order.orderReference || order.id}</span>
        </nav>

        {/* Header Bar */}
        <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
                {isBangla ? 'অর্ডার:' : 'Order:'} <span className="text-[#D45D83] font-mono">{order.orderReference || order.id}</span>
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {isBangla ? (ORDER_STATUS_LABELS[order.status] || order.status) : (ORDER_STATUS_LABELS_EN[order.status] || order.status)}
              </span>
            </div>
            <p className="text-xs text-[#77717A] mt-1.5">
              {isBangla ? 'অর্ডারের তারিখ:' : 'Order Date:'} {order.createdAt ? formatDate(order.createdAt, isBangla ? 'bn' : 'en') : '—'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#FFF8FA] hover:bg-[#FFF0F5] text-[#292329] border border-[#F0E2E8] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isBangla ? 'রসিদ প্রিন্ট করুন' : 'Print Invoice'}</span>
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>{isBangla ? 'বাতিল করুন' : 'Cancel Order'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Stepper */}
        {order.status !== 'cancelled' && (
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-8">
            <h2 className="text-sm font-bold text-[#292329] mb-6">{isBangla ? 'অর্ডার ট্র্যাকিং স্ট্যাটাস' : 'Order Tracking Status'}</h2>
            <div className="flex items-center justify-between relative overflow-x-auto pb-2">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative min-w-[70px]">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors z-10 ${
                        isPassed
                          ? 'bg-[#D45D83] text-white shadow-sm'
                          : 'bg-[#FFF0F5] text-[#77717A] border border-[#F0E2E8]'
                      } ${isCurrent ? 'ring-4 ring-[#D45D83]/20 animate-pulse' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-medium text-center ${
                        isPassed ? 'text-[#D45D83] font-bold' : 'text-[#77717A]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.status === 'pending' && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-950 mb-1">
                    {isBangla ? 'অর্ডারটি সফলভাবে সাবমিট হয়েছে (যাচাইকরণ প্রক্রিয়াধীন)' : 'Order submitted successfully (Verification pending)'}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {isBangla
                      ? 'ধন্যবাদ! আপনার অর্ডারটি আমরা পেয়েছি। আমাদের কাস্টমার প্রতিনিধি শীঘ্রই ফোন করে অর্ডারটি কনফার্ম করবেন এবং এরপর পার্সেল পাঠানো হবে।'
                      : 'Thank you! We have received your order. Our representative will call your phone soon to verify and confirm your order before dispatch.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status History Log */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm mb-8">
            <h2 className="text-sm font-bold text-[#292329] mb-4">
              {isBangla ? 'অর্ডারের স্ট্যাটাস ইতিহাস' : 'Order Status History'}
            </h2>
            <div className="space-y-3">
              {[...order.statusHistory].reverse().map((h: any, i: number) => {
                const fmtDate = (ts: any): string => {
                  try {
                    if (!ts) return '';
                    const d = typeof ts?.toDate === 'function'
                      ? ts.toDate()
                      : ts?.seconds
                      ? new Date(ts.seconds * 1000)
                      : new Date(ts);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleDateString('bn-BD', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    });
                  } catch { return ''; }
                };
                const statusColors: Record<string, string> = {
                  pending:         'bg-amber-100 text-amber-800',
                  confirmed:       'bg-blue-100 text-blue-800',
                  processing:      'bg-indigo-100 text-indigo-800',
                  shipped:         'bg-purple-100 text-purple-800',
                  out_for_delivery:'bg-orange-100 text-orange-800',
                  delivered:       'bg-green-100 text-green-800',
                  cancelled:       'bg-red-100 text-red-800',
                  returned:        'bg-gray-100 text-gray-800',
                };
                const statusLabels: Record<string, string> = {
                  pending:         isBangla ? 'অপেক্ষমাণ' : 'Pending',
                  confirmed:       isBangla ? 'নিশ্চিত' : 'Confirmed',
                  processing:      isBangla ? 'প্রক্রিয়াধীন' : 'Processing',
                  shipped:         isBangla ? 'পাঠানো হয়েছে' : 'Shipped',
                  out_for_delivery:isBangla ? 'ডেলিভারিতে আছে' : 'Out for Delivery',
                  delivered:       isBangla ? 'ডেলিভারি সম্পন্ন' : 'Delivered',
                  cancelled:       isBangla ? 'বাতিল' : 'Cancelled',
                  returned:        isBangla ? 'ফেরত' : 'Returned',
                };
                return (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#F0E2E8] last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-[#D45D83] shrink-0 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[h.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[h.status] || h.status}
                        </span>
                        {h.updatedAt && (
                          <span className="text-[11px] text-[#77717A]">{fmtDate(h.updatedAt)}</span>
                        )}
                      </div>
                      {h.note && (
                        <p className="text-xs text-[#77717A] mt-1">{h.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items Table */}
          <div className="lg:col-span-2 bg-white border border-[#F0E2E8] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-[#292329]">
              {isBangla ? `অর্ডারের পণ্যসমূহ (${order.items?.length || 0})` : `Order Items (${order.items?.length || 0})`}
            </h2>

            <div className="divide-y divide-[#F0E2E8]">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="py-4 flex items-center gap-4">
                  <div className="w-16 h-20 bg-[#FFF8FA] rounded-xl overflow-hidden shrink-0 border border-[#F0E2E8]">
                    <img
                      src={item.primaryImage || '/placeholder.png'}
                      alt={isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#292329] truncate">
                      {isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                    </h3>
                    {item.selectedVariants && item.selectedVariants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedVariants.map((v, i) => (
                          <span key={i} className="text-[10px] bg-[#FFF0F5] text-[#D45D83] px-2 py-0.5 rounded-md">
                            {v.type}: {v.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-[#77717A] mt-1">
                      {isBangla ? 'মূল্য:' : 'Price:'} {formatPrice(item.unitPrice || 0)} × {item.quantity || 1}
                    </p>
                  </div>

                  <span className="font-bold text-sm text-[#292329] shrink-0">
                    {formatPrice(item.subtotal || (item.unitPrice || 0) * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Summary */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#292329]">
                <MapPin className="w-4 h-4 text-[#D45D83]" />
                <span>{isBangla ? 'ডেলিভারি ঠিকানা' : 'Delivery Address'}</span>
              </div>
              <div className="text-xs text-[#77717A] space-y-1">
                <p className="font-bold text-[#292329] text-sm">{order.shippingAddress?.fullName || '—'}</p>
                <p>{isBangla ? 'ফোন:' : 'Phone:'} {order.shippingAddress?.phone || '—'}</p>
                <p>{order.shippingAddress?.addressLine1 || ''}</p>
                {order.shippingAddress?.area && <p>{isBangla ? 'এলাকা:' : 'Area:'} {order.shippingAddress.area}</p>}
                <p>{isBangla ? 'জেলা:' : 'District:'} {order.shippingAddress?.district || '—'}</p>
                {order.shippingAddress?.deliveryInstructions && (
                  <p className="italic text-[#D45D83] pt-1">
                    {isBangla ? 'নির্দেশনা:' : 'Instructions:'} {order.shippingAddress.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                <CreditCard className="w-4 h-4 text-[#D45D83]" />
                <span>{isBangla ? 'পেমেন্ট ও বিলিং' : 'Payment & Billing'}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#77717A]">
                  <span>{isBangla ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}</span>
                  <span className="font-bold text-[#292329] uppercase">
                    {order.payment?.method || 'ক্যাশ অন ডেলিভারি'}
                  </span>
                </div>
                <div className="flex justify-between text-[#77717A]">
                  <span>{isBangla ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</span>
                  <span className="font-bold text-[#292329]">
                    {order.payment?.status === 'success' ? (isBangla ? 'পরিশোধিত' : 'Paid') : (isBangla ? 'অপেক্ষমাণ' : 'Pending')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-[#F0E2E8] pt-3">
                <div className="flex justify-between text-[#77717A]">
                  <span>{t('cart.subtotal')}:</span>
                  <span className="font-semibold text-[#292329]">{formatPrice(order.subtotal || 0)}</span>
                </div>
                {(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('cart.discount')}:</span>
                    <span>-{formatPrice(order.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#77717A]">
                  <span>{t('cart.delivery_fee')}:</span>
                  <span className="font-semibold text-[#292329]">{formatPrice(order.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#292329] border-t border-[#F0E2E8] pt-2">
                  <span>{t('cart.total')}:</span>
                  <span className="text-base text-[#D45D83]">{formatPrice(order.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Reason Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-modal space-y-4">
              <h3 className="font-bold text-base text-[#292329]">{isBangla ? 'অর্ডার বাতিল করতে চান?' : 'Want to cancel this order?'}</h3>
              <p className="text-xs text-[#77717A]">
                {isBangla ? 'বাতিল করার কারণ উল্লেখ করুন যাতে আমরা আমাদের সেবার মান উন্নত করতে পারি:' : 'Please specify cancellation reason so we can improve our service:'}
              </p>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isBangla ? 'যেমন: ভুল পণ্য অর্ডার করেছি / পরে কিনব...' : 'e.g. Ordered wrong item / will order later...'}
                className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl focus:outline-none focus:border-[#D45D83]"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717A] hover:bg-gray-100"
                >
                  {isBangla ? 'ফিরে যান' : 'Go Back'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isCancelling ? (isBangla ? 'বাতিল হচ্ছে...' : 'Cancelling...') : (isBangla ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel Order')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderDetailPage;
