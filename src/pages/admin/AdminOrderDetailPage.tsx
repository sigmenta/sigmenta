// ─── FILE 7: Admin Order Detail Page ─────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, User, MapPin, CreditCard, Clock,
  CheckCircle, XCircle, Truck, MessageSquare, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PageHeader, StatusBadge } from '@/components/admin/AdminLayout';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  BRAND, ROUTES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/constants';
import type { Order, OrderStatus } from '@/types';

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'returned',
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ', initiated: 'শুরু হয়েছে', success: 'সফল',
  failed: 'ব্যর্থ', cancelled: 'বাতিল', refunded: 'ফেরত',
};

function fmt(ts: unknown): string {
  try {
    if (!ts) return '—';
    if (typeof (ts as any)?.toDate === 'function') {
      return format((ts as any).toDate(), 'dd MMM yyyy, hh:mm a');
    }
    if ((ts as any)?.seconds) {
      return format(new Date((ts as any).seconds * 1000), 'dd MMM yyyy, hh:mm a');
    }
    const d = new Date(ts as any);
    if (!isNaN(d.getTime())) {
      return format(d, 'dd MMM yyyy, hh:mm a');
    }
  } catch { /* ignore */ }
  return '—';
}


export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  const load = async (orderId: string) => {
    setLoading(true);
    try {
      const o = await orderService.getById(orderId);
      if (!o) { toast.error('অর্ডার পাওয়া যায়নি'); navigate(ROUTES.ADMIN_ORDERS); return; }
      setOrder(o);
      setNewStatus(o.status);
      setAdminNotes(o.adminNotes ?? '');
    } catch {
      toast.error('অর্ডার লোড করতে ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !user) return;
    setUpdating(true);
    try {
      await orderService.updateStatus(order.id, newStatus, statusNote, user.uid);
      toast.success('অর্ডারের অবস্থা আপডেট হয়েছে');
      setStatusNote('');
      load(order.id);
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatus = async (status: OrderStatus, customNote?: string) => {
    if (!order || !user) return;
    setUpdating(true);
    try {
      const note = customNote || `স্ট্যাটাস পরিবর্তন: ${ORDER_STATUS_LABELS[status] || status}`;
      await orderService.updateStatus(order.id, status, note, user.uid);
      toast.success(`অর্ডার সফলভাবে ${ORDER_STATUS_LABELS[status]} করা হয়েছে!`);
      load(order.id);
    } catch {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!order) return;
    setSavingNotes(true);
    try {
      await orderService.updateAdminNotes(order.id, adminNotes);
      toast.success('নোট সংরক্ষিত হয়েছে');
    } catch {
      toast.error('নোট সংরক্ষণ ব্যর্থ');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !user) return;
    setUpdating(true);
    try {
      await orderService.updateStatus(order.id, 'cancelled', cancelReason, user.uid);
      toast.success('অর্ডার বাতিল হয়েছে');
      setShowCancelModal(false);
      load(order.id);
    } catch {
      toast.error('বাতিল করতে ব্যর্থ');
    } finally {
      setUpdating(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!order) return;
    const confirmMsg = `আপনি কি নিশ্চিত যে অর্ডার "${order.orderReference || order.id}" স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`;
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      await orderService.deleteOrder(order.id);
      toast.success('✅ অর্ডারটি সফলভাবে মুছে ফেলা হয়েছে!');
      navigate(ROUTES.ADMIN_ORDERS);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ অর্ডার মুছতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <>
      <Helmet><title>অর্ডার {order.orderReference} — {BRAND.nameBn} অ্যাডমিন</title></Helmet>
      <div className="space-y-4">
        <div className="mb-4">
          <button onClick={() => navigate(ROUTES.ADMIN_ORDERS)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> অর্ডার তালিকায় ফিরুন
          </button>
        </div>

        <PageHeader
          title={`অর্ডার: ${order.orderReference}`}
          subtitle={`তারিখ: ${fmt(order.createdAt)}`}
          actions={
            <div className="flex items-center gap-2">
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <XCircle size={14} className="inline mr-1" />
                  অর্ডার বাতিল
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'মুছছে...' : 'অর্ডার মুছুন'}</span>
              </button>
            </div>
          }
        />

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Items */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-4 flex items-center gap-2"><Package size={16} /> অর্ডারের পণ্যসমূহ</h3>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.primaryImage && <img src={item.primaryImage} alt={item.nameBn} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[#292329]">{item.nameBn}</p>
                      {item.selectedVariants?.length > 0 && (
                        <p className="text-xs text-gray-400">{item.selectedVariants.map((v) => `${v.type}: ${v.label}`).join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">৳{item.subtotal?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">৳{item.unitPrice?.toLocaleString()} × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>সাবটোটাল</span>
                  <span>৳{order.subtotal?.toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ছাড় {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span>-৳{order.discountAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>ডেলিভারি চার্জ</span>
                  <span>{order.deliveryFee === 0 ? 'বিনামূল্যে' : `৳${order.deliveryFee?.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-bold text-[#292329] text-base border-t border-gray-100 pt-2">
                  <span>সর্বমোট</span>
                  <span>৳{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-4 flex items-center gap-2"><Clock size={16} /> অবস্থার ইতিহাস</h3>
              {order.statusHistory?.length === 0 ? (
                <p className="text-sm text-gray-400">কোনো ইতিহাস নেই</p>
              ) : (
                <div className="space-y-3">
                  {[...(order.statusHistory ?? [])].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle size={16} className="text-[#D45D83]" />
                      </div>
                      <div>
                        <StatusBadge
                          label={ORDER_STATUS_LABELS[h.status] ?? h.status}
                          className={ORDER_STATUS_COLORS[h.status] ?? 'bg-gray-100 text-gray-600'}
                        />
                        {h.note && (
                          <p className={`text-xs mt-1 ${h.status === 'cancelled' ? 'text-red-700 font-semibold bg-red-50 p-2 rounded-lg border border-red-200' : 'text-gray-500'}`}>
                            {h.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(h.updatedAt)} — {h.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-3 flex items-center gap-2"><MessageSquare size={16} /> অ্যাডমিন নোট (অভ্যন্তরীণ)</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="এই অর্ডার সম্পর্কে অভ্যন্তরীণ নোট লিখুন..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 resize-none"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 px-4 py-2 text-sm bg-[#D45D83] text-white rounded-lg hover:bg-[#B8446C] disabled:opacity-60"
              >
                {savingNotes ? 'সংরক্ষণ হচ্ছে...' : 'নোট সংরক্ষণ করুন'}
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Status Update */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-4">অবস্থা আপডেট</h3>
              <div className="mb-3">
                <StatusBadge
                  label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                  className={ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}
                />
              </div>

              {/* Cancelled Banner */}
              {order.status === 'cancelled' && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <XCircle size={18} />
                    <span>⚠️ অর্ডারটি বাতিল করা হয়েছে</span>
                  </div>
                  {(order.adminNotes || order.statusHistory?.find((h) => h.status === 'cancelled')?.note) && (
                    <div className="bg-white p-3 rounded-lg border border-red-100 text-xs text-red-800">
                      <p className="font-semibold text-gray-700 mb-1">বাতিলের কারণ / নোট:</p>
                      <p className="font-medium text-red-900 leading-relaxed">
                        {order.adminNotes || order.statusHistory?.find((h) => h.status === 'cancelled')?.note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 1-Click Action Buttons */}
              {order.status === 'pending' && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs text-emerald-800 font-medium mb-2">
                    কাস্টমার অর্ডার প্লেস করেছেন। অর্ডার কনফার্ম করতে নিচের বাটনে ক্লিক করুন:
                  </p>
                  <button
                    onClick={() => handleQuickStatus('confirmed', 'অ্যাডমিন কর্তৃক ফোন যাচাই করে কনফার্ম করা হয়েছে')}
                    disabled={updating}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={16} />
                    <span>{updating ? 'আপডেট হচ্ছে...' : '✅ এক ক্লিকে অর্ডার কনফার্ম করুন'}</span>
                  </button>
                </div>
              )}

              {order.status === 'confirmed' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <p className="text-xs text-blue-800 font-medium">
                    অর্ডার নিশ্চিত আছে। পরবর্তী ধাপ নির্বাচন করুন:
                  </p>
                  <button
                    onClick={() => handleQuickStatus('processing', 'প্যাকেজিং ও প্রসেসিং শুরু হয়েছে')}
                    disabled={updating}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Package size={14} />
                    <span>📦 প্রসেসিং শুরু করুন (Processing)</span>
                  </button>
                  <button
                    onClick={() => handleQuickStatus('shipped', 'কুরিয়ারে পার্সেল বুকিং দেওয়া হয়েছে')}
                    disabled={updating}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Truck size={14} />
                    <span>🚚 কুরিয়ারে পাঠান (Shipped)</span>
                  </button>
                </div>
              )}

              {order.status === 'processing' && (
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-xs text-indigo-800 font-medium mb-2">
                    প্যাকেজিং শেষ হলে কুরিয়ারে বুকিং দিন:
                  </p>
                  <button
                    onClick={() => handleQuickStatus('shipped', 'কুরিয়ারে পার্সেল বুকিং দেওয়া হয়েছে')}
                    disabled={updating}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Truck size={16} />
                    <span>🚚 কুরিয়ারে পাঠানো হয়েছে (Shipped)</span>
                  </button>
                </div>
              )}

              {order.status === 'shipped' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-800 font-medium mb-2">
                    কাস্টমার পার্সেল রিসিভ করলে ডেলিভারি সম্পন্ন করুন:
                  </p>
                  <button
                    onClick={() => handleQuickStatus('delivered', 'কাস্টমার পার্সেল রিসিভ করেছেন ও মূল্য পরিশোধ হয়েছে')}
                    disabled={updating}
                    className="w-full py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={16} />
                    <span>🎉 ডেলিভারি সম্পন্ন (Delivered)</span>
                  </button>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">ম্যানুয়াল স্ট্যাটাস পরিবর্তন:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder="নোট (ঐচ্ছিক)..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 resize-none mb-3"
                />
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || (newStatus === order.status && !statusNote.trim())}
                  className="w-full py-2.5 text-sm font-semibold bg-[#D45D83] text-white rounded-lg hover:bg-[#B8446C] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {updating ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-3 flex items-center gap-2"><User size={16} /> কাস্টমার তথ্য</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">নাম</span>
                  <p className="text-[#292329] font-medium">{order.shippingAddress?.fullName}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">ফোন</span>
                  <p className="text-[#292329]">{order.shippingAddress?.phone}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">ইমেইল</span>
                  <p className="text-[#292329] break-all">{order.userEmail}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-3 flex items-center gap-2"><MapPin size={16} /> শিপিং ঠিকানা</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress?.area && `${order.shippingAddress.area}, `}{order.shippingAddress?.district}</p>
                {order.shippingAddress?.postalCode && <p>পোস্টাল কোড: {order.shippingAddress.postalCode}</p>}
                {order.shippingAddress?.deliveryInstructions && (
                  <p className="text-gray-400 italic">{order.shippingAddress.deliveryInstructions}</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-[#292329] mb-3 flex items-center gap-2"><CreditCard size={16} /> পেমেন্ট তথ্য</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">পদ্ধতি</span>
                  <span>{PAYMENT_METHOD_LABELS[order.payment?.method] ?? order.payment?.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">অবস্থা</span>
                  <span>{PAYMENT_STATUS_LABELS[order.payment?.status] ?? order.payment?.status}</span>
                </div>
                {order.payment?.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">ট্রানজেকশন ID</span>
                    <span className="font-mono text-xs">{order.payment.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">পরিমাণ</span>
                  <span>৳{order.payment?.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-[#292329] mb-2">অর্ডার বাতিল করুন</h3>
              <p className="text-sm text-gray-500 mb-4">বাতিলের কারণ লিখুন (ঐচ্ছিক):</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="বাতিলের কারণ..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 mb-4 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  বাতিল
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {updating ? 'হচ্ছে...' : 'হ্যাঁ, বাতিল করুন'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
