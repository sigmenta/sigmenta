// ─── FILE 3: Admin Products Page ─────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Image as ImageIcon,
  ChevronLeft, ChevronRight, AlertTriangle, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, TableSkeleton, ConfirmModal, StatusBadge } from '@/components/admin/AdminLayout';
import { productService, getLocalProducts } from '@/services/productService';
import { categoryService, getLocalCategories } from '@/services/categoryService';
import { ROUTES, BRAND, PAGINATION, STOCK_STATUS_LABELS } from '@/constants';
import type { Product, Category } from '@/types';

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'published', label: 'প্রকাশিত' },
  { key: 'draft', label: 'ড্রাফট' },
  { key: 'archived', label: 'আর্কাইভড' },
];

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
};
const PRODUCT_STATUS_LABELS: Record<string, string> = {
  published: 'প্রকাশিত',
  draft: 'ড্রাফট',
  archived: 'আর্কাইভড',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(() => {
    return getLocalProducts();
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    return getLocalCategories();
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = PAGINATION.ADMIN_PRODUCTS_PER_PAGE;

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [statusFilter, categoryFilter]);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll();
      if (cats && cats.length > 0) setCategories(cats);
    } catch { /* ignore */ }
  };

  const loadProducts = async () => {
    if (products.length === 0) setLoading(true);
    try {
      const { products: prods } = await productService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        categoryId: categoryFilter || undefined,
      });
      setProducts(prods);
      setPage(1);
    } catch {
      toast.error('পণ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.nameBn?.toLowerCase().includes(q) || p.nameEn?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((p) => p.id)));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      if (action === 'delete') {
        await productService.bulkDelete(ids);
        toast.success(`${ids.length}টি পণ্য মুছে গেছে`);
      } else {
        await productService.bulkUpdateStatus(ids, action === 'publish' ? 'published' : 'archived');
        toast.success(`${ids.length}টি পণ্য আপডেট হয়েছে`);
      }
      setSelected(new Set());
      loadProducts();
    } catch {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await productService.deleteProduct(deleteId);
      toast.success('পণ্য মুছে গেছে');
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error('মুছতে ব্যর্থ হয়েছে');
    } finally {
      setDeleteLoading(false);
    }
  };

  const stockBadge = (p: Product) => {
    if (p.stockStatus === 'out_of_stock') return 'bg-red-100 text-red-700';
    if (p.stockStatus === 'low_stock') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <>
      <Helmet><title>পণ্য পরিচালনা — {BRAND.nameBn} অ্যাডমিন</title></Helmet>
      <div className="space-y-4">
        <PageHeader
          title="পণ্য পরিচালনা"
          subtitle={`মোট ${filtered.length}টি পণ্য`}
          actions={
            <Link
              to={ROUTES.ADMIN_PRODUCT_NEW}
              className="flex items-center gap-2 px-4 py-2 bg-[#D45D83] text-white text-sm font-semibold rounded-lg hover:bg-[#B8446C] transition-colors"
            >
              <Plus size={16} /> নতুন পণ্য
            </Link>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
          {/* Status Tabs */}
          <div className="flex border-b border-gray-100 px-4 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setSelected(new Set()); }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.key
                    ? 'border-[#D45D83] text-[#D45D83]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category */}
          <div className="flex flex-col sm:flex-row gap-3 p-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="পণ্যের নাম বা SKU দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 focus:border-[#D45D83]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30 min-w-[160px]"
            >
              <option value="">সব ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameBn}</option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selected.size > 0 && (
            <div className="px-4 pb-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">{selected.size}টি নির্বাচিত</span>
              <button onClick={() => handleBulkAction('publish')} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">প্রকাশ করুন</button>
              <button onClick={() => handleBulkAction('archive')} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">আর্কাইভ করুন</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">মুছুন</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5"><TableSkeleton rows={8} cols={7} /></div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>কোনো পণ্য পাওয়া যায়নি</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="pl-4 py-3 w-8">
                      <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded" />
                    </th>
                    <th className="px-3 py-3 font-medium">পণ্য</th>
                    <th className="px-3 py-3 font-medium">SKU</th>
                    <th className="px-3 py-3 font-medium">ক্যাটাগরি</th>
                    <th className="px-3 py-3 font-medium">মূল্য</th>
                    <th className="px-3 py-3 font-medium">স্টক</th>
                    <th className="px-3 py-3 font-medium">অবস্থা</th>
                    <th className="px-3 py-3 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${
                        product.stockStatus === 'out_of_stock' ? 'bg-red-50/30' :
                        product.stockStatus === 'low_stock' ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <td className="pl-4 py-3">
                        <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} className="rounded" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0]?.url ? (
                              <img src={product.images[0].url} alt={product.nameBn} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-gray-300" /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#292329] line-clamp-1">{product.nameBn}</p>
                            {product.nameEn && <p className="text-xs text-gray-400 line-clamp-1">{product.nameEn}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                      <td className="px-3 py-3 text-gray-600">
                        {categories.find((c) => c.id === product.categoryId)?.nameBn ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        {product.salePrice ? (
                          <div>
                            <span className="font-semibold text-[#D45D83]">৳{product.salePrice.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 line-through ml-1">৳{product.regularPrice.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-semibold">৳{product.regularPrice.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {(product.stockStatus === 'out_of_stock' || product.stockStatus === 'low_stock') && (
                            <AlertTriangle size={12} className="text-orange-500" />
                          )}
                          <StatusBadge
                            label={`${product.stockQuantity} — ${STOCK_STATUS_LABELS[product.stockStatus] ?? product.stockStatus}`}
                            className={stockBadge(product)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          label={PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                          className={PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-600'}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={ROUTES.ADMIN_PRODUCT_EDIT.replace(':id', product.id)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="সম্পাদনা"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 size={14} />
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
              <span className="text-gray-500">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}টি
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 bg-[#D45D83] text-white rounded-lg text-xs">{page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirm */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="পণ্য মুছুন"
          message="আপনি কি নিশ্চিত যে এই পণ্যটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
          confirmLabel="হ্যাঁ, মুছুন"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleteLoading}
        />
      </div>
    </>
  );
}
