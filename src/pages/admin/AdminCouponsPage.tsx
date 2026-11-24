import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Tag, Trash2, Calendar, Copy, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '@/services/couponService';
import { formatPrice, copyToClipboard } from '@/utils';
import type { Coupon } from '@/types';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minimumOrderValue, setMinimumOrderValue] = useState<number>(500);
  const [maxUsagePerCustomer, setMaxUsagePerCustomer] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await couponService.getCoupons();
      setCoupons(data);
    } catch {
      toast.error('কুপন লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('কুপন কোড আবশ্যক');
      return;
    }

    setIsSaving(true);
    try {
      await couponService.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minimumOrderValue: Number(minimumOrderValue),
        maxUsagePerCustomer: Number(maxUsagePerCustomer),
        isActive,
      });

      toast.success('✅ কুপন সফলভাবে তৈরি হয়েছে!');
      setModalOpen(false);
      setCode('');
      loadCoupons();
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ কুপন তৈরি ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string, cCode: string) => {
    if (!window.confirm(`কুপন "${cCode}" মুছতে চান?`)) return;

    try {
      await couponService.deleteCoupon(id);
      toast.success('কুপন মুছে ফেলা হয়েছে');
      loadCoupons();
    } catch {
      toast.error('মুছতে ব্যর্থ হয়েছে');
    }
  };

  const handleCopyCode = async (cCode: string) => {
    const success = await copyToClipboard(cCode);
    if (success) toast.success(`"${cCode}" কপি করা হয়েছে!`);
  };

  return (
    <>
      <Helmet>
        <title>কুপন ও ডিসকাউন্ট — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              কুপন ও ডিসকাউন্ট
            </h1>
            <p className="text-xs text-[#77717A]">
              প্রচারণামূলক প্রোমো কোড ও বিশেষ অফার পরিচালনা করুন
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কুপন</span>
          </button>
        </div>

        {/* Coupons Table */}
        <div className="bg-white border border-[#F0E2E8] rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77717A]">
              কোনো সক্রিয় কুপন নেই। নতুন কুপন যোগ করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFF8FA] text-[#77717A] uppercase text-[11px] border-b border-[#F0E2E8]">
                  <tr>
                    <th className="px-4 py-3.5">কুপন কোড</th>
                    <th className="px-4 py-3.5">ছাড়ের পরিমাণ</th>
                    <th className="px-4 py-3.5">সর্বনিম্ন অর্ডার</th>
                    <th className="px-4 py-3.5">ব্যবহার সংখ্যা</th>
                    <th className="px-4 py-3.5">অবস্থা</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E2E8]">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-[#FFF8FA]/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D45D83] bg-[#FFF0F5] px-2.5 py-1 rounded-lg border border-[#F0E2E8]">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-[#77717A] hover:text-[#D45D83]"
                            title="কপি করুন"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#292329]">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : formatPrice(coupon.discountValue)}
                      </td>

                      <td className="px-4 py-3.5 text-[#77717A]">
                        {formatPrice(coupon.minimumOrderValue || 0)}
                      </td>

                      <td className="px-4 py-3.5 text-[#77717A]">
                        {coupon.usageCount || 0} বার
                      </td>

                      <td className="px-4 py-3.5">
                        {coupon.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold text-[10px]">
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold text-[10px]">
                            নিষ্ক্রিয়
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Coupon */}
        {modalOpen && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-modal space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <h3 className="font-bold text-base text-[#292329]">নতুন কুপন কোড</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-[#77717A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    কুপন কোড <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="যেমন: WF10 বা EID2024"
                    required
                    className="w-full px-3 py-2 text-xs uppercase font-mono border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">ডিসকাউন্ট টাইপ</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    >
                      <option value="percentage">শতকরা (%)</option>
                      <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">ছাড়ের পরিমাণ</label>
                    <input
                      type="number"
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    সর্বনিম্ন অর্ডার মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minimumOrderValue}
                    onChange={(e) => setMinimumOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <label htmlFor="couponActive" className="text-xs font-semibold text-[#292329] cursor-pointer">
                    কুপনটি এখন থেকেই সক্রিয় রাখুন
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#F0E2E8]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#77717A] hover:bg-gray-100"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'কুপন তৈরি করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminCouponsPage;
