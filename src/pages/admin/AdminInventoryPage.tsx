import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle, Check, RefreshCw, Search, Package, Save, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '@/services/productService';
import { db } from '@/lib/firebase';
import { COLLECTIONS, STOCK_STATUS_LABELS } from '@/constants';
import type { Product } from '@/types';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { products: list } = await productService.getAll({ pageSize: 100 });
      setProducts(list);
    } catch (err) {
      toast.error('ইনভেন্টরি ডেটা লোড ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockChange = (productId: string, val: number) => {
    setEditingStock((prev) => ({ ...prev, [productId]: val }));
  };

  const handleSaveStock = async (productId: string) => {
    const newQty = editingStock[productId];
    if (newQty === undefined || newQty < 0) return;

    setSavingId(productId);
    try {
      const status = newQty === 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock';
      await productService.updateProduct(productId, {
        stockQuantity: newQty,
        stockStatus: status,
      });

      toast.success('✅ স্টক আপডেট সম্পন্ন!');
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQty, stockStatus: status } : p))
      );
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ স্টক আপডেট ব্যর্থ হয়েছে।', { duration: 5000 });
      }
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.nameBn.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'out') return p.stockQuantity <= 0;
    if (filterType === 'low') return p.stockQuantity > 0 && p.stockQuantity <= 5;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <>
      <Helmet>
        <title>ইনভেন্টরি ও স্টক ব্যবস্থাপনা — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              ইনভেন্টরি ও স্টক ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-[#77717A]">
              পণ্যের মজুত নিরীক্ষণ ও দ্রুত স্টক আপডেট করুন
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-[#F0E2E8] hover:bg-[#FFF8FA] rounded-xl text-xs font-semibold flex items-center gap-2 text-[#77717A]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setFilterType('all')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'all'
                ? 'border-[#D45D83] bg-[#FFF0F5]'
                : 'border-[#F0E2E8] bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#77717A] font-semibold">মোট পণ্য</span>
              <Package className="w-4 h-4 text-[#D45D83]" />
            </div>
            <p className="text-2xl font-bold text-[#292329] mt-2">{products.length}</p>
          </div>

          <div
            onClick={() => setFilterType('low')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'low'
                ? 'border-amber-500 bg-amber-50'
                : 'border-[#F0E2E8] bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-700 font-semibold">সীমিত স্টক (≤ ৫)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700 mt-2">{lowStockCount}</p>
          </div>

          <div
            onClick={() => setFilterType('out')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filterType === 'out'
                ? 'border-red-500 bg-red-50'
                : 'border-[#F0E2E8] bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-700 font-semibold">স্টক শেষ (০)</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700 mt-2">{outOfStockCount}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#F0E2E8] rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-[#77717A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্যের নাম বা SKU দিয়ে খুঁজুন..."
            className="w-full text-xs text-[#292329] focus:outline-none"
          />
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-[#F0E2E8] rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77717A]">কোনো পণ্য মেলেনি</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFF8FA] text-[#77717A] uppercase text-[11px] border-b border-[#F0E2E8]">
                  <tr>
                    <th className="px-4 py-3.5">পণ্য</th>
                    <th className="px-4 py-3.5">SKU</th>
                    <th className="px-4 py-3.5">ক্যাটাগরি</th>
                    <th className="px-4 py-3.5">বর্তমান মজুত</th>
                    <th className="px-4 py-3.5">স্ট্যাটাস</th>
                    <th className="px-4 py-3.5 text-right">দ্রুত আপডেট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E2E8]">
                  {filtered.map((prod) => {
                    const currentVal =
                      editingStock[prod.id] !== undefined ? editingStock[prod.id] : prod.stockQuantity;

                    return (
                      <tr key={prod.id} className="hover:bg-[#FFF8FA]/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-[#FFF8FA] rounded-lg overflow-hidden shrink-0 border border-[#F0E2E8]">
                              <img
                                src={prod.images?.[0]?.url || '/placeholder.png'}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-bold text-[#292329] line-clamp-1 max-w-xs">
                              {prod.nameBn}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-[#77717A]">{prod.sku}</td>
                        <td className="px-4 py-3.5 text-[#77717A]">{prod.categorySlug}</td>

                        <td className="px-4 py-3.5">
                          <input
                            type="number"
                            min={0}
                            value={currentVal}
                            onChange={(e) => handleStockChange(prod.id, Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border border-[#F0E2E8] rounded-lg focus:outline-none focus:border-[#D45D83] font-bold"
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prod.stockQuantity <= 0
                                ? 'bg-red-100 text-red-700'
                                : prod.stockQuantity <= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {STOCK_STATUS_LABELS[prod.stockStatus] || prod.stockStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveStock(prod.id)}
                            disabled={savingId === prod.id}
                            className="px-3 py-1.5 bg-[#D45D83] hover:bg-[#B8446C] text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingId === prod.id ? '...' : 'সেভ'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminInventoryPage;
