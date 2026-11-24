import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CreditCard, ShieldCheck, Save, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '@/services/settingsService';
import { useAuth } from '@/features/auth/AuthContext';
import type { SiteSettings } from '@/types';

export const AdminPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Payment states
  const [codEnabled, setCodEnabled] = useState(true);
  const [bkashEnabled, setBkashEnabled] = useState(false);
  const [bkashSandbox, setBkashSandbox] = useState(true);
  const [nagadEnabled, setNagadEnabled] = useState(false);
  const [nagadSandbox, setNagadSandbox] = useState(true);

  useEffect(() => {
    settingsService.getSiteSettings()
      .then((data: any) => {
        if (data) {
          setSettings(data);
          setCodEnabled(data.paymentMethods?.cod?.isEnabled ?? true);
          setBkashEnabled(data.paymentMethods?.bkash?.isEnabled ?? false);
          setBkashSandbox(data.paymentMethods?.bkash?.sandboxMode ?? true);
          setNagadEnabled(data.paymentMethods?.nagad?.isEnabled ?? false);
          setNagadSandbox(data.paymentMethods?.nagad?.sandboxMode ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await settingsService.updateSiteSettings(
        {
          paymentMethods: {
            cod: {
              isEnabled: codEnabled,
              displayName: 'ক্যাশ অন ডেলিভারি',
              instructions: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন',
            },
            bkash: {
              isEnabled: bkashEnabled,
              displayName: 'বিকাশ পেমেন্ট',
              sandboxMode: bkashSandbox,
              instructions: 'বিকাশ মার্চেন্ট গেটওয়ের মাধ্যমে পেমেন্ট',
            },
            nagad: {
              isEnabled: nagadEnabled,
              displayName: 'নগদ পেমেন্ট',
              sandboxMode: nagadSandbox,
              instructions: 'নগদ মার্চেন্ট গেটওয়ের মাধ্যমে পেমেন্ট',
            },
          },
        },
        user.uid
      );

      toast.success('✅ পেমেন্ট কনফিগারেশন সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code === 'permission-denied') {
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
        <title>পেমেন্ট কনফিগারেশন — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              পেমেন্ট গেটওয়ে কনফিগারেশন
            </h1>
            <p className="text-xs text-[#77717A]">
              ওয়েবসাইটে সক্রিয় পেমেন্ট পদ্ধতি ও মার্চেন্ট সেটিংস পরিচালনা করুন
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
          </button>
        </div>

        {/* Security / Notice Box */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">গুরুত্বপূর্ণ নিরাপত্তা নির্দেশিকা:</p>
            <p>
              বিকাশ এবং নগদের গোপন ক্রেডেনশিয়াল (App Secret, Private Key) কোনো অবস্থাতেই ফ্রন্টএন্ড কোডে রাখা যাবে না। এগুলো সম্পূর্ণভাবে Firebase Cloud Functions পরিবেশের মধ্যে সংরক্ষিত থাকে।
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Method 1: Cash on Delivery */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
                  COD
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#292329]">ক্যাশ অন ডেলিভারি (Cash on Delivery)</h3>
                  <p className="text-xs text-[#77717A]">গ্রাহক পণ্য গ্রহণের সময় নগদ অর্থ প্রদান করবেন</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D45D83]" />
              </label>
            </div>
            <p className="text-xs text-green-700 font-medium">✓ বর্তমানে সারা বাংলাদেশে সক্রিয়</p>
          </div>

          {/* Method 2: bKash PGW */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] text-[#E2136E] flex items-center justify-center font-bold text-xs">
                  bKash
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#292329]">বিকাশ অনলাইন পেমেন্ট (bKash PGW)</h3>
                  <p className="text-xs text-[#77717A]">টোকেনাইজড পেমেন্ট গেটওয়ে v1.2</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bkashEnabled}
                  onChange={(e) => setBkashEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D45D83]" />
              </label>
            </div>

            <div className="p-4 bg-[#FFF8FA] rounded-2xl border border-[#F0E2E8] text-xs text-[#77717A] space-y-2">
              <p className="font-semibold text-[#292329]">বিকাশ ইন্টিগ্রেশন অবস্থা:</p>
              <p>মার্চেন্ট অ্যাকাউন্ট অনুমোদনের পর ক্লাউড ফাংশন কনফিগারেশন যুক্ত করা হবে।</p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bkashSandbox"
                  checked={bkashSandbox}
                  onChange={(e) => setBkashSandbox(e.target.checked)}
                  className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8]"
                />
                <label htmlFor="bkashSandbox" className="font-semibold cursor-pointer">
                  স্যান্ডবক্স / টেস্ট মোড (Sandbox Mode) সক্রিয়
                </label>
              </div>
            </div>
          </div>

          {/* Method 3: Nagad DFS */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center font-bold text-xs">
                  Nagad
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#292329]">নগদ ডিজিটাল পেমেন্ট (Nagad DFS)</h3>
                  <p className="text-xs text-[#77717A]">নগদ মার্চেন্ট গেটওয়ে এপিআই</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={nagadEnabled}
                  onChange={(e) => setNagadEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D45D83]" />
              </label>
            </div>

            <div className="p-4 bg-[#FFF8FA] rounded-2xl border border-[#F0E2E8] text-xs text-[#77717A] space-y-2">
              <p className="font-semibold text-[#292329]">নগদ ইন্টিগ্রেশন অবস্থা:</p>
              <p>মার্চেন্ট অ্যাকাউন্ট অনুমোদনের পর এপিআই কি কনফিগার করা হবে।</p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nagadSandbox"
                  checked={nagadSandbox}
                  onChange={(e) => setNagadSandbox(e.target.checked)}
                  className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8]"
                />
                <label htmlFor="nagadSandbox" className="font-semibold cursor-pointer">
                  স্যান্ডবক্স / টেস্ট মোড (Sandbox Mode) সক্রিয়
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminPaymentsPage;
