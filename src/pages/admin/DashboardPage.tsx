// ─── FILE 2: Admin Dashboard Page ────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle,
  Clock, Plus, ListOrdered, Tag, ExternalLink, PieChart as PieChartIcon,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { getDocs, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { PageHeader, MetricCard, TableSkeleton, StatusBadge } from '@/components/admin/AdminLayout';
import { COLLECTIONS, ROUTES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, BRAND } from '@/constants';
import type { Order, Product } from '@/types';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';

function formatCurrency(amount: number) {
  return '৳' + (amount || 0).toLocaleString('bn-BD');
}

function formatDate(ts: unknown): string {
  try {
    const d = (ts as { toDate?: () => Date })?.toDate?.()
      ?? ((ts as { seconds?: number })?.seconds ? new Date((ts as { seconds: number }).seconds * 1000) : null)
      ?? (ts ? new Date(ts as string) : null);
    if (d && !isNaN(d.getTime())) return format(d, 'dd MMM yyyy, hh:mm a');
  } catch { /* ignore */ }
  return '—';
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

// ── Reusable Interactive SVG Donut / Pie Chart ──
function DonutChart({
  slices,
  centerTitle,
  centerSubtitle,
  emptyMessage,
  size = 170,
}: {
  slices: PieSlice[];
  centerTitle: string;
  centerSubtitle: string;
  emptyMessage?: string;
  size?: number;
}) {
  const total = slices.reduce((sum, s) => sum + (s.value || 0), 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99
  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="18"
          />
          {total > 0 ? (
            slices.map((slice, index) => {
              if (slice.value <= 0) return null;
              const slicePercent = slice.value / total;
              const strokeDash = slicePercent * circumference;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += strokeDash;

              return (
                <circle
                  key={index}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 hover:opacity-85"
                />
              );
            })
          ) : (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="18"
              strokeDasharray="4 6"
            />
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="font-sans font-black text-xl text-slate-800 leading-none">
            {centerTitle}
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-1">
            {centerSubtitle}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2.5">
        {total === 0 && emptyMessage ? (
          <p className="text-xs text-slate-400 italic text-center sm:text-left">
            {emptyMessage}
          </p>
        ) : null}
        {slices.map((slice, index) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-medium text-slate-700">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{slice.value}</span>
                <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    todayRevenue: 0,
    todayOrders: 0,
  });

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [allOrdersList, setAllOrdersList] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealDashboardData();

    const handleUpdate = () => { void loadRealDashboardData(); };
    window.addEventListener('wf_products_updated', handleUpdate);
    window.addEventListener('wf_orders_updated', handleUpdate);

    return () => {
      window.removeEventListener('wf_products_updated', handleUpdate);
      window.removeEventListener('wf_orders_updated', handleUpdate);
    };
  }, []);

  async function loadRealDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch Real Products from Firestore / Cache
      const { products } = await productService.getAll({ pageSize: 100 });
      setProductsList(products);
      const totalProducts = products.length;

      let inStockCount = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      products.forEach((p) => {
        const qty = Number(p.stockQuantity) || 0;
        const threshold = Number(p.lowStockThreshold) || 5;
        if (qty <= 0) {
          outOfStockCount++;
        } else if (qty <= threshold) {
          lowStockCount++;
        } else {
          inStockCount++;
        }
      });

      // 2. Fetch Real Orders from Firestore / Local Orders
      let orders: Order[] = [];
      try {
        const orderRes = await orderService.getAll({ pageSize: 200 });
        orders = orderRes.orders || [];
      } catch {
        orders = orderService.getLocalOrders() || [];
      }
      setAllOrdersList(orders);
      setRecentOrders(orders.slice(0, 10));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      let totalRevenue = 0;
      let todayRevenue = 0;
      let todayOrders = 0;
      let pendingOrders = 0;

      orders.forEach((order) => {
        if (order.status === 'pending') pendingOrders++;
        if (order.status !== 'cancelled' && order.status !== 'returned') {
          totalRevenue += Number(order.total) || 0;
          const ca = order.createdAt as any;
          const time = ca?.toDate
            ? ca.toDate().getTime()
            : ca?.seconds
            ? ca.seconds * 1000
            : ca
            ? new Date(ca).getTime()
            : 0;
          if (time >= todayStart) {
            todayRevenue += Number(order.total) || 0;
            todayOrders++;
          }
        }
      });

      // 3. Count Real Registered Customers from Firestore
      let realCustomerCount = 0;
      if (isFirebaseConfigured) {
        try {
          const uSnap = await getDocs(collection(db, COLLECTIONS.USERS));
          realCustomerCount = uSnap.size;
        } catch {
          // fallback to unique phones in orders
        }
      }
      if (realCustomerCount === 0 && orders.length > 0) {
        realCustomerCount = new Set(orders.map((o) => o.shippingAddress?.phone || o.userId)).size;
      }

      setMetrics({
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: realCustomerCount,
        totalProducts,
        pendingOrders,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        todayRevenue,
        todayOrders,
      });
    } catch (err) {
      console.error('[Dashboard] Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Calculate Slices for Order Status Donut Chart ──
  const orderStatusSlices: PieSlice[] = [
    {
      label: 'অপেক্ষমাণ (Pending)',
      value: allOrdersList.filter((o) => o.status === 'pending').length,
      color: '#F59E0B', // Amber
    },
    {
      label: 'প্রক্রিয়াধীন (Processing)',
      value: allOrdersList.filter((o) => o.status === 'processing' || o.status === 'confirmed').length,
      color: '#3B82F6', // Blue
    },
    {
      label: 'ডেলিভারি সম্পন্ন (Delivered)',
      value: allOrdersList.filter((o) => o.status === 'delivered').length,
      color: '#10B981', // Emerald
    },
    {
      label: 'বাতিল (Cancelled)',
      value: allOrdersList.filter((o) => o.status === 'cancelled').length,
      color: '#EF4444', // Red
    },
  ];

  // ── Calculate Slices for Product Inventory Donut Chart ──
  const productStockSlices: PieSlice[] = [
    {
      label: 'পর্যাপ্ত স্টক (In Stock)',
      value: productsList.filter((p) => (Number(p.stockQuantity) || 0) > (Number(p.lowStockThreshold) || 5)).length,
      color: '#10B981', // Emerald
    },
    {
      label: 'কম স্টক (Low Stock)',
      value: productsList.filter((p) => {
        const q = Number(p.stockQuantity) || 0;
        const t = Number(p.lowStockThreshold) || 5;
        return q > 0 && q <= t;
      }).length,
      color: '#F59E0B', // Amber
    },
    {
      label: 'স্টক শেষ (Out of Stock)',
      value: productsList.filter((p) => (Number(p.stockQuantity) || 0) <= 0).length,
      color: '#EF4444', // Red
    },
  ];

  const MetricSkeleton = () => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
      <div className="h-7 bg-gray-100 rounded w-24 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  );

  return (
    <>
      <Helmet><title>ড্যাশবোর্ড — {BRAND.nameBn} অ্যাডমিন</title></Helmet>
      <div className="space-y-6">
        <PageHeader
          title="ড্যাশবোর্ড"
          subtitle="আপনার ব্যবসার রিয়েল-টাইম সারসংক্ষেপ ও অ্যানালিটিক্স"
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadRealDashboardData()}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <Link
                to={ROUTES.ADMIN_PRODUCT_NEW}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs"
              >
                <Plus size={16} /> নতুন পণ্য
              </Link>
            </div>
          }
        />

        {/* ── 1. Top Real Metric Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <MetricSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                label="মোট আয়"
                value={formatCurrency(metrics.totalRevenue)}
                icon={<TrendingUp size={20} />}
                color="#0F172A"
              />
              <MetricCard
                label="মোট অর্ডার"
                value={metrics.totalOrders}
                icon={<ShoppingBag size={20} />}
                color="#7C3AED"
              />
              <MetricCard
                label="মোট কাস্টমার"
                value={metrics.totalCustomers}
                icon={<Users size={20} />}
                color="#2563EB"
              />
              <MetricCard
                label="মোট পণ্য"
                value={metrics.totalProducts}
                icon={<Package size={20} />}
                color="#059669"
              />
              <MetricCard
                label="আজকের আয়"
                value={formatCurrency(metrics.todayRevenue)}
                icon={<TrendingUp size={20} />}
                color="#F59E0B"
              />
              <MetricCard
                label="আজকের অর্ডার"
                value={metrics.todayOrders}
                icon={<Clock size={20} />}
                color="#0891B2"
              />
              <MetricCard
                label="অপেক্ষমাণ অর্ডার"
                value={metrics.pendingOrders}
                icon={<AlertTriangle size={20} />}
                color="#EA580C"
                urgent={metrics.pendingOrders > 0}
              />
              <MetricCard
                label="কম স্টক পণ্য"
                value={metrics.lowStockProducts}
                icon={<Package size={20} />}
                color="#DC2626"
                urgent={metrics.lowStockProducts > 0}
              />
            </>
          )}
        </div>

        {/* ── 2. Visual Charts & Pie Chart Analytics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Product Inventory Health Pie Chart */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PieChartIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">পণ্য ইনভেনটরি ও স্টক বিশ্লেষণ</h3>
                  <p className="text-[11px] text-slate-400">বর্তমান পণ্যের স্টক অনুপাত (পাই চার্ট)</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {metrics.totalProducts} টি পণ্য
              </span>
            </div>

            <DonutChart
              slices={productStockSlices}
              centerTitle={`${metrics.totalProducts}`}
              centerSubtitle="মোট পণ্য"
              emptyMessage="ইনভেনটরিতে কোনো পণ্য পাওয়া যায়নি"
              size={160}
            />
          </div>

          {/* Chart 2: Order Status Distribution Pie Chart */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PieChartIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">অর্ডার অবস্থা ও রূপান্তর বিশ্লেষণ</h3>
                  <p className="text-[11px] text-slate-400">লাইভ অর্ডারের স্ট্যাটাস অনুপাত (পাই চার্ট)</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {metrics.totalOrders} টি অর্ডার
              </span>
            </div>

            <DonutChart
              slices={orderStatusSlices}
              centerTitle={`${metrics.totalOrders}`}
              centerSubtitle="মোট অর্ডার"
              emptyMessage="এখনও কোনো অর্ডার আসেনি। লাইভ অর্ডার আসলে চার্ট সক্রিয় হবে।"
              size={160}
            />
          </div>
        </div>

        {/* ── 3. Quick Action Buttons ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'নতুন পণ্য যোগ করুন', href: ROUTES.ADMIN_PRODUCT_NEW, icon: <Plus size={18} />, color: 'bg-[#0F172A] hover:bg-slate-800' },
            { label: 'অর্ডার তালিকা দেখুন', href: ROUTES.ADMIN_ORDERS, icon: <ListOrdered size={18} />, color: 'bg-purple-600 hover:bg-purple-700' },
            { label: 'ক্যাটাগরি পরিচালনা', href: ROUTES.ADMIN_CATEGORIES, icon: <Tag size={18} />, color: 'bg-blue-600 hover:bg-blue-700' },
          ].map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className={`${action.color} text-white rounded-2xl p-4 flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md`}
            >
              {action.icon}
              <span>{action.label}</span>
            </Link>
          ))}
        </div>

        {/* ── 4. Recent Real Orders Table ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">সাম্প্রতিক অর্ডার</h2>
              <p className="text-xs text-slate-400 mt-0.5">গ্রাহকদের আসল অর্ডার হিস্ট্রি</p>
            </div>
            <Link
              to={ROUTES.ADMIN_ORDERS}
              className="text-xs font-bold text-[#0F172A] hover:text-slate-600 flex items-center gap-1.5 transition-colors"
            >
              সব অর্ডার <ExternalLink size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={4} cols={6} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-14 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <ShoppingBag size={26} />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">এখনও কোনো অর্ডার আসেনি</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  গ্রাহক আপনার ওয়েবসাইট থেকে কোনো পণ্য অর্ডার করলে তা সাথে সাথে রিয়েল-টাইমে এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3.5">রেফারেন্স</th>
                    <th className="px-6 py-3.5">কাস্টমার</th>
                    <th className="px-6 py-3.5">মোট মূল্য</th>
                    <th className="px-6 py-3.5">অবস্থা</th>
                    <th className="px-6 py-3.5">তারিখ</th>
                    <th className="px-6 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                        {order.orderReference || order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 truncate max-w-[140px]">
                          {order.shippingAddress?.fullName || 'গ্রাহক'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {order.shippingAddress?.phone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                          className={ORDER_STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={ROUTES.ADMIN_ORDER_DETAIL.replace(':id', order.id)}
                          className="text-xs font-bold text-[#0F172A] hover:underline px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          বিস্তারিত
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
