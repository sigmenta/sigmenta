import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Truck, Trash2, Edit, Check, X, Zap, Save, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService, getDeliveryFees, updateSimpleDeliveryFees } from '@/services/settingsService';
import { useAuth } from '@/features/auth/AuthContext';
import { formatPrice } from '@/utils';
import { BANGLADESH_DISTRICTS } from '@/constants';
import type { DeliveryZone } from '@/types';

export const AdminDeliveryPage: React.FC = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick 1-Click Delivery Fees State
  const [quickDhakaFee, setQuickDhakaFee] = useState<number>(() => getDeliveryFees().dhaka);
  const [quickOutsideDhakaFee, setQuickOutsideDhakaFee] = useState<number>(() => getDeliveryFees().outsideDhaka);
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [nameBn, setNameBn] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [estimatedDays, setEstimatedDays] = useState('২-৩ দিন');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['ঢাকা']);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getDeliveryZones(false);
      setZones(data);
    } catch {
      toast.error('ডেলিভারি জোন লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
    // Load current fees from settings
    settingsService.getSiteSettings().then((s) => {
      if (s) {
        if (typeof s.deliveryFeeDhaka === 'number') setQuickDhakaFee(s.deliveryFeeDhaka);
        if (typeof s.deliveryFeeOutsideDhaka === 'number') setQuickOutsideDhakaFee(s.deliveryFeeOutsideDhaka);
      }
    }).catch(() => {});
  }, []);

  const handleSaveQuickFees = async (e: React.FormEvent) => {
    e.preventDefault();
    const dFee = Number(quickDhakaFee);
    const outFee = Number(quickOutsideDhakaFee);
    if (isNaN(dFee) || dFee < 0) {
      toast.error('ঢাকার ভেতরের জন্য সঠিক ডেলিভারি ফি দিন');
      return;
    }
    if (isNaN(outFee) || outFee < 0) {
      toast.error('ঢাকার বাইরের জন্য সঠিক ডেলিভারি ফি দিন');
      return;
    }

    setIsSavingQuick(true);
    try {
      await updateSimpleDeliveryFees(dFee, outFee, user?.uid || 'admin');
      toast.success(`✅ ডেলিভারি চার্জ ১ ক্লিকে আপডেট সম্পন্ন!\nঢাকা: ৳${dFee} | ঢাকার বাইরে: ৳${outFee}`, {
        duration: 4000,
        icon: '🚀',
      });
      await loadZones();
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ ডেলিভারি চার্জ আপডেট ব্যর্থ হয়েছে।');
      }
    } finally {
      setIsSavingQuick(false);
    }
  };

  const openCreateModal = () => {
    setEditingZone(null);
    setNameBn('');
    setDeliveryFee(60);
    setEstimatedDays('২-৩ দিন');
    setSelectedDistricts(['ঢাকা']);
    setIsActive(true);
    setModalOpen(true);
  };

  const toggleDistrict = (dist: string) => {
    if (selectedDistricts.includes(dist)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== dist));
    } else {
      setSelectedDistricts([...selectedDistricts, dist]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) {
      toast.error('জোনের নাম আবশ্যক');
      return;
    }
    if (selectedDistricts.length === 0) {
      toast.error('অন্তত একটি জেলা নির্বাচন করুন');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nameBn: nameBn.trim(),
        deliveryFee: Number(deliveryFee),
        estimatedDays: estimatedDays.trim(),
        districts: selectedDistricts,
        isActive,
        sortOrder: zones.length + 1,
      };

      if (editingZone) {
        await settingsService.updateDeliveryZone(editingZone.id, payload);
        toast.success('ডেলিভারি জোন আপডেট সম্পন্ন');
      } else {
        await settingsService.createDeliveryZone(payload as any);
        toast.success('নতুন ডেলিভারি জোন তৈরি সম্পন্ন');
      }

      setModalOpen(false);
      loadZones();
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>ডেলিভারি সেটিংস — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              ডেলিভারি চার্জ ও জোন সেটিংস
            </h1>
            <p className="text-xs text-[#77717A]">
              বাংলাদেশের জেলাভিত্তিক ডেলিভারি ফি এবং সময়সীমা নির্ধারণ করুন
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কাস্টম জোন</span>
          </button>
        </div>

        {/* 1-Click Simple Delivery Fee Card */}
        <div className="bg-gradient-to-br from-white via-[#FFF8FA] to-pink-50/50 border-2 border-[#D45D83]/20 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E2E8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D45D83] text-white flex items-center justify-center shadow-sm shrink-0">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-[#292329] flex items-center gap-2 flex-wrap">
                  <span>সহজ ডেলিভারি চার্জ নির্ধারণ (১ ক্লিকে সর্বত্র আপডেট)</span>
                  <span className="text-[10px] bg-[#D45D83]/10 text-[#D45D83] font-bold px-2.5 py-0.5 rounded-full border border-[#D45D83]/20">
                    ১ ক্লিকে কার্যকর
                  </span>
                </h2>
                <p className="text-xs text-[#77717A]">
                  এখানে ঢাকার ভেতরে ও বাইরে চার্জ পরিবর্তন করে <b>"সংরক্ষণ করুন"</b> বাটনে চাপলেই চেকআউট পেইজ, কার্ট এবং চ্যাটবট সহ সম্পূর্ণ ওয়েবসাইটে স্বয়ংক্রিয়ভাবে নতুন ডেলিভারি চার্জ চালু হয়ে যাবে।
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveQuickFees} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inside Dhaka */}
              <div className="bg-white p-4 rounded-2xl border border-[#F0E2E8] shadow-xs">
                <label className="block text-xs font-bold text-[#292329] mb-1.5 flex items-center justify-between">
                  <span>১. ঢাকার ভেতরে ডেলিভারি চার্জ (Inside Dhaka)</span>
                  <span className="text-[11px] text-[#D45D83] font-bold">ঢাকা জেলা</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#77717A]">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quickDhakaFee}
                    onChange={(e) => setQuickDhakaFee(Number(e.target.value))}
                    required
                    placeholder="70"
                    className="w-full pl-8 pr-14 py-2.5 text-base font-bold text-[#292329] bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl focus:outline-none focus:border-[#D45D83] focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#77717A]">টাকা</span>
                </div>
                <p className="text-[11px] text-[#77717A] mt-1.5">
                  যেমন: ৳৭০ (গ্রাহক চেকআউটে 'ঢাকা' জেলা সিলেক্ট করলে এই চার্জ যোগ হবে)
                </p>
              </div>

              {/* Outside Dhaka */}
              <div className="bg-white p-4 rounded-2xl border border-[#F0E2E8] shadow-xs">
                <label className="block text-xs font-bold text-[#292329] mb-1.5 flex items-center justify-between">
                  <span>২. ঢাকার বাইরে ডেলিভারি চার্জ (Outside Dhaka)</span>
                  <span className="text-[11px] text-[#D45D83] font-bold">সারাদেশ</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#77717A]">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quickOutsideDhakaFee}
                    onChange={(e) => setQuickOutsideDhakaFee(Number(e.target.value))}
                    required
                    placeholder="120"
                    className="w-full pl-8 pr-14 py-2.5 text-base font-bold text-[#292329] bg-[#FFF8FA] border border-[#F0E2E8] rounded-xl focus:outline-none focus:border-[#D45D83] focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#77717A]">টাকা</span>
                </div>
                <p className="text-[11px] text-[#77717A] mt-1.5">
                  যেমন: ৳১২০ বা ৳১৩০ (ঢাকা ছাড়া অন্য ৬৩টি জেলার জন্য এই চার্জ প্রযোজ্য হবে)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#77717A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>বর্তমান নির্ধারিত রেট: ঢাকার ভেতরে <b>৳{quickDhakaFee}</b> | ঢাকার বাইরে <b>৳{quickOutsideDhakaFee}</b></span>
              </div>

              <button
                type="submit"
                disabled={isSavingQuick}
                className="w-full sm:w-auto px-6 py-3 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSavingQuick ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>আপডেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>সংরক্ষণ করুন (১ ক্লিকে সর্বত্র পরিবর্তন)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Subheading for custom zones */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-[#292329]">
            কাস্টম ডেলিভারি জোন তালিকা (ঐচ্ছিক/অগ্রবর্তী)
          </h2>
          <p className="text-[11px] text-[#77717A]">
            প্রয়োজনে নির্দিষ্ট কোনো জেলার জন্য আলাদা সময়সীমা বা রেট রাখতে নিচের জোনগুলো ব্যবহার করতে পারেন
          </p>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#292329]">{zone.nameBn}</h3>
                    <p className="text-[11px] text-[#77717A]">সময়সীমা: {zone.estimatedDays}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-[#D45D83]">
                    {formatPrice(zone.deliveryFee)}
                  </span>
                  <p className="text-[10px] text-[#77717A]">ডেলিভারি চার্জ</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#77717A] mb-2">
                  অন্তর্ভুক্ত জেলাসমূহ ({zone.districts.length}টি):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {zone.districts.map((dist, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#FFF8FA] border border-[#F0E2E8] rounded-md text-[10px] font-medium text-[#292329]"
                    >
                      {dist}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Delivery Zone */}
        {modalOpen && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-modal space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <h3 className="font-bold text-base text-[#292329]">নতুন ডেলিভারি জোন</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-[#77717A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    জোনের নাম (বাংলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: ঢাকা মেট্রো এলাকা"
                    required
                    className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      ডেলিভারি ফি (৳) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">সময়সীমা</label>
                    <input
                      type="text"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      placeholder="যেমন: ২-৩ দিন"
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                {/* District Selectors */}
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-2">
                    জেলাসমূহ নির্বাচন করুন ({selectedDistricts.length}টি নির্বাচিত):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-2 border border-[#F0E2E8] rounded-xl bg-[#FFF8FA]">
                    {BANGLADESH_DISTRICTS.map((dist) => {
                      const isChecked = selectedDistricts.includes(dist);
                      return (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => toggleDistrict(dist)}
                          className={`p-1.5 rounded-lg text-[11px] font-medium border text-center transition-colors truncate ${
                            isChecked
                              ? 'bg-[#D45D83] text-white border-[#D45D83]'
                              : 'bg-white text-[#77717A] border-[#F0E2E8] hover:border-gray-400'
                          }`}
                        >
                          {dist}
                        </button>
                      );
                    })}
                  </div>
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
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'জোন সংরক্ষণ করুন'}
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

export default AdminDeliveryPage;
