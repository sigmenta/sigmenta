// ─── FILE 6: Admin Orders Page ────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader, TableSkeleton, StatusBadge } from '@/components/admin/AdminLayout';
import { orderService } from '@/services/orderService';
import {
  BRAND, ROUTES, PAGINATION, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/constants';
import type { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';

type StatusTab = 'all' | OrderStatus;

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'pending', label: 'অপেক্ষমাণ' },
  { key: 'confirmed', label: 'নিশ্চিত' },
  { key: 'processing', label: 'প্রক্রিয়াধীন' },
  { key: 'shipped', label: 'পাঠানো হয়েছে' },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন' },
  { key: 'cancelled', label: 'বাতিল' },
];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  initiated: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-purple-100 text-purple-700',
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  initiated: 'শুরু হয়েছে',
  success: 'সফল',
  failed: 'ব্যর্থ',
  cancelled: 'বাতিল',
  refunded: 'ফেরত',
};

function formatDate(ts: unknown): string {
  try {
    const d = (ts as { toDate?: () => Date })?.toDate?.();
    if (d) return format(d, 'dd/MM/yy HH:mm');
  } catch { /* ignore */ }
  return '—';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(() => {
    return orderService.getLocalOrders();
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const PER_PAGE = PAGINATION.ORDERS_PER_PAGE;

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter]);

  const handleDeleteOrder = async (order: Order) => {
    const confirmMsg = `আপনি কি নিশ্চিত যে অর্ডার "${order.orderReference || order.id}" তালিকা থেকে স্থায়ীভাবে মুছে ফেলতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(order.id);
    try {
      await orderService.deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id && o.orderReference !== order.orderReference));
      toast.success('✅ অর্ডারটি সফলভাবে মুছে ফেলা হয়েছে!');
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ অর্ডার মুছতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const loadOrders = async () => {
    if (orders.length === 0) setLoading(true);
    try {
      const { orders: loaded } = await orderService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
        pageSize: 200,
      });
      setOrders(loaded);
      setPage(1);
    } catch {
      toast.error('অর্ডার লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderReference?.toLowerCase().includes(q) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
      o.shippingAddress?.phone?.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const headers = ['রেফারেন্স', 'কাস্টমার', 'ফোন', 'জেলা', 'আইটেম', 'মোট', 'পেমেন্ট', 'পেমেন্ট অবস্থা', 'অর্ডার অবস্থা', 'তারিখ'];
    const rows = filtered.map((o) => [
      o.orderReference,
      o.shippingAddress?.fullName,
      o.shippingAddress?.phone,
      o.shippingAddress?.district,
      o.items?.length,
      o.total,
      PAYMENT_METHOD_LABELS[o.payment?.method] ?? o.payment?.method,
      PAYMENT_STATUS_LABELS[o.payment?.status] ?? o.payment?.status,
      ORDER_STATUS_LABELS[o.status] ?? o.status,
      formatDate(o.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV ডাউনলোড হয়েছে');
  };

  return (
    <>
      <Helmet><title>অর্ডার পরিচালনা — {BRAND.nameBn} অ্যাডমিন</title></Helmet>
      <div className="space-y-4">
        <PageHeader
          title="অর্ডার পরিচালনা"
          subtitle={`মোট ${filtered.length}টি অর্ডার`}
          actions={
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              <Download size={15} /> CSV
            </button>
          }
        />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
          {/* Status Tabs */}
          <div className="flex border-b border-gray-100 px-3 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.key ? 'border-[#D45D83] text-[#D45D83]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Payment Filter */}
          <div className="flex flex-col sm:flex-row gap-3 p-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="রেফারেন্স বা কাস্টমার নাম দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none min-w-[140px]"
            >
              <option value="all">সব পেমেন্ট</option>
              <option value="cod">ক্যাশ অন ডেলিভারি</option>
              <option value="bkash">বিকাশ</option>
              <option value="nagad">নগদ</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5"><TableSkeleton rows={8} cols={8} /></div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">কোনো অর্ডার পাওয়া যায়নি</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="px-4 py-3 font-medium">রেফারেন্স</th>
                    <th className="px-4 py-3 font-medium">কাস্টমার</th>
                    <th className="px-4 py-3 font-medium">জেলা</th>
                    <th className="px-4 py-3 font-medium">আইটেম</th>
                    <th className="px-4 py-3 font-medium">মোট</th>
                    <th className="px-4 py-3 font-medium">পেমেন্ট</th>
                    <th className="px-4 py-3 font-medium">অবস্থা</th>
                    <th className="px-4 py-3 font-medium">তারিখ</th>
                    <th className="px-4 py-3 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#D45D83] font-semibold">{order.orderReference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#292329]">{order.shippingAddress?.fullName}</p>
                        <p className="text-xs text-gray-400">{order.shippingAddress?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{order.shippingAddress?.district}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-3 font-semibold">৳{order.total?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[order.payment?.method] ?? order.payment?.method}</span>
                          <br />
                          <StatusBadge
                            label={PAYMENT_STATUS_LABELS[order.payment?.status] ?? order.payment?.status}
                            className={PAYMENT_STATUS_COLORS[order.payment?.status] ?? 'bg-gray-100 text-gray-600'}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                          className={ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={ROUTES.ADMIN_ORDER_DETAIL.replace(':id', order.id)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#D45D83] bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                          >
                            দেখুন
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deletingId === order.id}
                            title="অর্ডারটি মুছুন"
                            className="inline-flex items-center justify-center p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-sm">
              <span className="text-gray-500">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}টি</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="px-3 py-1 bg-[#D45D83] text-white rounded-lg text-xs">{page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
