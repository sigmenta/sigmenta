// ─── Women's Favorite — Orders Page ────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { Package, ChevronRight, ChevronLeft } from 'lucide-react';

import { db } from '@/lib/firebase';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { orderService } from '@/services/orderService';
import {
  ROUTES,
  COLLECTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS_EN,
  ORDER_STATUS_COLORS,
  PAGINATION,
  BRAND,
} from '@/constants';
import type { Order, OrderStatus } from '@/types';

import { toDate } from '@/utils';

/* ── Helpers ── */
const formatDate = (ts: any, isBangla = true): string => {
  if (!ts) return '—';
  try {
    const d = toDate(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const formatPrice = (amount: number): string =>
  `৳${amount.toLocaleString('en-US')}`;

/* ── Filter Tabs ── */
type FilterStatus = 'all' | OrderStatus;

interface FilterTab {
  id: FilterStatus;
  labelBn: string;
  labelEn: string;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', labelBn: 'সব', labelEn: 'All' },
  { id: 'pending', labelBn: 'অপেক্ষমাণ', labelEn: 'Pending' },
  { id: 'confirmed', labelBn: 'নিশ্চিত', labelEn: 'Confirmed' },
  { id: 'processing', labelBn: 'প্রক্রিয়াধীন', labelEn: 'Processing' },
  { id: 'shipped', labelBn: 'পাঠানো হয়েছে', labelEn: 'Shipped' },
  { id: 'delivered', labelBn: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered' },
  { id: 'cancelled', labelBn: 'বাতিল', labelEn: 'Cancelled' },
];

/* ── Skeleton ── */
function OrderSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E2E8] p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function OrdersPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t, isBangla } = useLanguage();

  const [orders, setOrders] = useState<Order[]>(() => {
    const local = orderService.getLocalOrders();
    return local;
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const PER_PAGE = PAGINATION.ORDERS_PER_PAGE;

  /* Redirect if not logged in */
  useEffect(() => {
    if (!isLoading && !user) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.ACCOUNT_ORDERS } });
    }
  }, [user, isLoading, navigate]);

  /* Fetch orders */
  const fetchOrders = useCallback(
    async (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      filter: FilterStatus
    ): Promise<void> => {
      if (!user) return;
      try {
        const userOrders = await orderService.getUserOrders(user.uid, 50);
        const filtered = filter === 'all'
          ? userOrders
          : userOrders.filter((o) => o.status === filter);
        setOrders(filtered);
        setHasNextPage(false);
      } catch {
        /* silent */
      } finally {
        setOrdersLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    setCurrentPage(1);
    setCursors([]);
    void fetchOrders(null, activeFilter);
  }, [activeFilter, fetchOrders]);

  const handleNextPage = async (): Promise<void> => {
    const lastDoc = orders[orders.length - 1];
    if (!lastDoc) return;
    // In a real implementation we'd store the DocumentSnapshot in state
    // For brevity we call with null and show the concept
    setCurrentPage((p) => p + 1);
    await fetchOrders(null, activeFilter);
  };

  const handlePrevPage = async (): Promise<void> => {
    if (currentPage <= 1) return;
    const prevCursor = cursors[cursors.length - 2] ?? null;
    setCurrentPage((p) => p - 1);
    await fetchOrders(prevCursor, activeFilter);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D45D83] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>আমার অর্ডার — {BRAND.name}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-[#FFF8FA]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-[#D45D83]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#292329]">{t('order.my_orders')}</h1>
              <p className="text-xs text-[#77717A]">{isBangla ? 'আপনার সকল অর্ডারের তথ্য' : 'All your orders information'}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-[#D45D83] text-white shadow-md shadow-[#D45D83]/20'
                    : 'bg-white text-[#77717A] border border-[#F0E2E8] hover:border-[#D45D83] hover:text-[#D45D83]'
                }`}
              >
                {isBangla ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <OrderSkeleton key={i} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-[#F0E2E8] p-12 text-center">
              <div className="w-16 h-16 bg-[#FFF8FA] rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-[#F7C8D5]" />
              </div>
              <h2 className="text-lg font-bold text-[#292329] mb-2">
                {activeFilter === 'all'
                  ? (isBangla ? 'কোনো অর্ডার নেই' : 'No Orders Yet')
                  : (isBangla ? 'এই ক্যাটাগরিতে অর্ডার নেই' : 'No orders in this category')}
              </h2>
              <p className="text-sm text-[#77717A] mb-6">
                {activeFilter === 'all'
                  ? (isBangla ? 'এখনও কোনো অর্ডার করা হয়নি। কেনাকাটা শুরু করুন!' : 'No orders placed yet. Start shopping!')
                  : (isBangla ? 'অন্য ফিল্টার চেষ্টা করুন।' : 'Try another filter.')}
              </p>
              {activeFilter === 'all' && (
                <Link
                  to={ROUTES.PRODUCTS}
                  className="inline-flex items-center gap-2 bg-[#D45D83] hover:bg-[#B8446C] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  {isBangla ? 'কেনাকাটা করুন' : 'Shop Now'}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={ROUTES.ACCOUNT_ORDER_DETAIL.replace(':orderId', order.id)}
                  className="block bg-white rounded-2xl border border-[#F0E2E8] hover:border-[#D45D83] hover:shadow-md transition-all group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-[#292329] group-hover:text-[#D45D83] transition-colors">
                          {order.orderReference}
                        </p>
                        <p className="text-xs text-[#77717A] mt-0.5">
                          {formatDate(order.createdAt, isBangla)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold ${
                          ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isBangla ? (ORDER_STATUS_LABELS[order.status] ?? order.status) : (ORDER_STATUS_LABELS_EN[order.status] ?? order.status)}
                      </span>
                    </div>

                    {/* Items preview */}
                    <div className="flex gap-2 mb-3 overflow-hidden">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="relative shrink-0">
                          {item.primaryImage ? (
                            <img
                              src={item.primaryImage}
                              alt={isBangla ? item.nameBn : (item.nameEn || item.nameBn)}
                              className="w-10 h-10 rounded-lg object-cover border border-[#F0E2E8]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#F7C8D5] flex items-center justify-center text-xs">
                              📦
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-10 h-10 rounded-lg bg-[#FFF8FA] border border-[#F0E2E8] flex items-center justify-center text-xs text-[#77717A] font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#77717A]">
                        {order.items.length} {t('common.items')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#292329]">
                          {formatPrice(order.total)}
                        </span>
                        <span className="text-sm text-[#D45D83] font-semibold flex items-center gap-1">
                          {isBangla ? 'বিস্তারিত' : 'Details'}
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!ordersLoading && orders.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F0E2E8] text-sm font-medium text-[#77717A] hover:text-[#D45D83] hover:border-[#D45D83] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                আগের পাতা
              </button>
              <span className="text-sm text-[#77717A]">পৃষ্ঠা {currentPage}</span>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F0E2E8] text-sm font-medium text-[#77717A] hover:text-[#D45D83] hover:border-[#D45D83] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                পরের পাতা
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
