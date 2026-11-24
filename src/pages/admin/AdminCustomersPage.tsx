// ─── FILE 8: Admin Customers Page ────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Eye, UserCheck, UserX, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PageHeader, TableSkeleton, StatusBadge } from '@/components/admin/AdminLayout';
import { customerService } from '@/services/adminServices';
import { BRAND } from '@/constants';
import type { CustomerSummary } from '@/types';

function fmt(ts: unknown): string {
  try {
    const d = (ts as { toDate?: () => Date })?.toDate?.();
    if (d) return format(d, 'dd MMM yyyy');
  } catch { /* ignore */ }
  return '—';
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'কাস্টমার',
  admin: 'অ্যাডমিন',
  super_admin: 'সুপার অ্যাডমিন',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch {
      toast.error('কাস্টমার লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (uid: string, currentActive: boolean) => {
    setToggleLoading(uid);
    try {
      await customerService.toggleActive(uid, !currentActive);
      toast.success(currentActive ? 'অ্যাকাউন্ট স্থগিত করা হয়েছে' : 'অ্যাকাউন্ট সক্রিয় করা হয়েছে');
      setCustomers((prev) =>
        prev.map((c) => c.uid === uid ? { ...c, isActive: !currentActive } : c)
      );
      if (selected?.uid === uid) setSelected((prev) => prev ? { ...prev, isActive: !currentActive } : prev);
    } catch {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setToggleLoading(null);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.displayName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phoneNumber?.includes(q);
  });

  return (
    <>
      <Helmet><title>কাস্টমার পরিচালনা — {BRAND.nameBn} অ্যাডমিন</title></Helmet>
      <div className="space-y-4">
        <PageHeader title="কাস্টমার পরিচালনা" subtitle={`মোট ${filtered.length}জন কাস্টমার`} />

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D45D83]/30"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5"><TableSkeleton rows={8} cols={6} /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">কোনো কাস্টমার পাওয়া যায়নি</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="px-4 py-3 font-medium">নাম</th>
                    <th className="px-4 py-3 font-medium">ইমেইল</th>
                    <th className="px-4 py-3 font-medium">ফোন</th>
                    <th className="px-4 py-3 font-medium">নিবন্ধন তারিখ</th>
                    <th className="px-4 py-3 font-medium">রোল</th>
                    <th className="px-4 py-3 font-medium">অবস্থা</th>
                    <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.uid} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#292329]">{c.displayName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs break-all">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phoneNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={ROLE_LABELS[c.role] ?? c.role} className="bg-blue-100 text-blue-700" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={c.isActive ? 'সক্রিয়' : 'স্থগিত'}
                          className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelected(c)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(c.uid, c.isActive)}
                            disabled={toggleLoading === c.uid}
                            className={`p-1.5 rounded-lg ${c.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
                            title={c.isActive ? 'স্থগিত করুন' : 'সক্রিয় করুন'}
                          >
                            {c.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Customer Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-[#F7C8D5] rounded-full flex items-center justify-center text-2xl font-bold text-[#D45D83]">
                  {selected.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#292329]">{selected.displayName || '—'}</h3>
                  <StatusBadge
                    label={selected.isActive ? 'সক্রিয়' : 'স্থগিত'}
                    className={selected.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'ইমেইল', value: selected.email },
                  { label: 'ফোন', value: selected.phoneNumber || '—' },
                  { label: 'রোল', value: ROLE_LABELS[selected.role] ?? selected.role },
                  { label: 'নিবন্ধন তারিখ', value: fmt(selected.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-[#292329] text-right max-w-[60%] break-all">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleToggle(selected.uid, selected.isActive)}
                disabled={toggleLoading === selected.uid}
                className={`w-full mt-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 ${
                  selected.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {toggleLoading === selected.uid ? 'হচ্ছে...' : selected.isActive ? 'অ্যাকাউন্ট স্থগিত করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
