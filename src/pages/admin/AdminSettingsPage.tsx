import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Settings, Save, AlertTriangle, Megaphone, Globe, Database, UploadCloud, CheckCircle2, RefreshCw, Image as ImageIcon, Loader2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '@/services/settingsService';
import { seederService } from '@/services/seederService';
import { useAuth } from '@/features/auth/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { BRAND } from '@/constants';
import type { SiteSettings, SiteTheme } from '@/types';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form Fields
  const [siteNameBn, setSiteNameBn] = useState<string>(BRAND.nameBn);
  const [siteNameEn, setSiteNameEn] = useState<string>(BRAND.name);
  const [logoUrl, setLogoUrl] = useState<string>('/logo-icon.png');
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [contactPhone, setContactPhone] = useState<string>(BRAND.phone);
  const [contactEmail, setContactEmail] = useState<string>(BRAND.email);
  const [addressBn, setAddressBn] = useState<string>(BRAND.address);
  const [announcementActive, setAnnouncementActive] = useState<boolean>(false);
  const [announcementTextBn, setAnnouncementTextBn] = useState<string>('বিশেষ অফারের জন্য আমাদের শপে স্বাগতম!');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(3000);
  const [deliveryFeeDhaka, setDeliveryFeeDhaka] = useState<number>(70);
  const [deliveryFeeOutsideDhaka, setDeliveryFeeOutsideDhaka] = useState<number>(120);
  const [facebookLink, setFacebookLink] = useState<string>(BRAND.socialMedia.facebook);
  const [instagramLink, setInstagramLink] = useState<string>(BRAND.socialMedia.instagram);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [themeChoice, setThemeChoice] = useState<SiteTheme>('unisex');

  useEffect(() => {
    settingsService.getSiteSettings()
      .then((data) => {
        if (data) {
          setSiteNameBn(data.siteNameBn || BRAND.nameBn);
          setSiteNameEn(data.siteName || BRAND.name);
          setLogoUrl(data.logoUrl || '/logo-icon.png');
          setContactPhone(data.contactPhone || BRAND.phone);
          setContactEmail(data.contactEmail || BRAND.email);
          setAddressBn(data.addressBn || BRAND.address);
          if (data.theme && ['unisex', 'bw', 'dark', 'royal'].includes(data.theme)) {
            setThemeChoice(data.theme);
          }
          if (data.announcementBar) {
            setAnnouncementActive(data.announcementBar.isActive || false);
            setAnnouncementTextBn(data.announcementBar.textBn || '');
          }
          setFreeDeliveryThreshold(data.freeDeliveryThreshold || 3000);
          if (typeof data.deliveryFeeDhaka === 'number') setDeliveryFeeDhaka(data.deliveryFeeDhaka);
          if (typeof data.deliveryFeeOutsideDhaka === 'number') setDeliveryFeeOutsideDhaka(data.deliveryFeeOutsideDhaka);
          if (data.socialMedia) {
            setFacebookLink(data.socialMedia.facebook || '');
            setInstagramLink(data.socialMedia.instagram || '');
          }
          setMaintenanceMode(data.maintenanceMode || false);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('লোগো ফাইলের সাইজ সর্বোচ্চ ৫MB হতে পারবে');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await uploadToCloudinary(file, 'sigmenta/logo');
      const url = res?.secure_url || (res as any)?.url;
      if (url) {
        setLogoUrl(url);
        toast.success('✅ লোগো সফলভাবে আপলোড হয়েছে! নিচে "সেটিংস সেভ করুন" বাটনে ক্লিক করুন।');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error('ক্লাউডিনারি আপলোড সম্পন্ন হয়নি। নিচের ঘরে সরাসরি লোগোর ছবির লিংক দিতে পারেন।');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await settingsService.updateSiteSettings(
        {
          siteName: siteNameEn.trim(),
          siteNameBn: siteNameBn.trim(),
          logoUrl: logoUrl.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          addressBn: addressBn.trim(),
          announcementBar: {
            isActive: announcementActive,
            textBn: announcementTextBn.trim(),
          },
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
          deliveryFeeDhaka: Number(deliveryFeeDhaka),
          deliveryFeeOutsideDhaka: Number(deliveryFeeOutsideDhaka),
          socialMedia: {
            facebook: facebookLink.trim(),
            instagram: instagramLink.trim(),
          },
          theme: themeChoice,
          maintenanceMode,
        },
        user.uid
      );

      // Synchronize simple delivery fees across zones and listeners
      if (typeof settingsService.updateSimpleDeliveryFees === 'function') {
        await settingsService.updateSimpleDeliveryFees(
          Number(deliveryFeeDhaka),
          Number(deliveryFeeOutsideDhaka),
          user.uid
        );
      }

      toast.success('✅ ওয়েবসাইট সেটিংস সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code === 'permission-denied') {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ সেটিংস সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে ফায়ারবেস ডাটাবেজে প্রাথমিক পণ্য, ক্যাটাগরি ও সেটিংস আপলোড করতে চান?')) return;
    setIsSeeding(true);
    try {
      const res = await seederService.seedInitialData();
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || 'ডাটাবেজ সিড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>ওয়েবসাইট সেটিংস — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla max-w-4xl">
        {/* Firebase Live Cloud Database Card */}
        <div className="bg-gradient-to-r from-pink-50/80 via-white to-rose-50/60 border border-[#F0E2E8] rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#D45D83] text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#D45D83]/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-[#292329]">লাইভ ফায়ারবেস ক্লাউড ডাটাবেজ (Firestore)</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    কানেক্টেড (women-s-favorite)
                  </span>
                </div>
                <p className="text-xs text-[#77717A] mt-1 leading-relaxed">
                  আপনার লাইভ ফায়ারবেস প্রজেক্ট সফলভাবে সংযুক্ত রয়েছে। প্রাথমিক পণ্য, ব্যানার ও ক্যাটাগরি ফায়ারবেস ক্লাউড স্টোরেজে আপলোড করতে পাশের বাটনে ক্লিক করুন।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="px-5 py-2.5 bg-[#292329] hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 flex-shrink-0"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D45D83]" />
                  <span>ডাটা আপলোড হচ্ছে...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-pink-300" />
                  <span>১-ক্লিকে ফায়ারবেসে ডাটা আপলোড করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              ওয়েবসাইট সেটিংস ও কনফিগারেশন
            </h1>
            <p className="text-xs text-[#77717A]">
              ব্র্যান্ডের সাধারণ তথ্য, নোটিশ বার এবং সোশ্যাল মিডিয়া লিংক পরিচালনা করুন
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন'}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Announcement Bar */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#D45D83] flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#292329]">টপ অ্যানাউন্সমেন্ট বার (Notice Bar)</h3>
                  <p className="text-[11px] text-[#77717A]">ওয়েবসাইটের একদম উপরে বিশেষ অফার বা নোটিশ দেখান</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="w-5 h-5 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
              />
            </div>

            {announcementActive && (
              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  নোটিশ বার বার্তা (বাংলা)
                </label>
                <input
                  type="text"
                  value={announcementTextBn}
                  onChange={(e) => setAnnouncementTextBn(e.target.value)}
                  placeholder="যেমন: সারাদেশে ফ্রি হোম ডেলিভারির জন্য ২০০০ টাকার বেশি অর্ডার করুন!"
                  className="w-full px-4 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>
            )}
          </div>

          {/* Website Theme Settings Card */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F0E2E8] pb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#292329]">
                  ওয়েবসাইট থিম নির্বাচন (Website Theme)
                </h2>
                <p className="text-[11px] text-[#77717A]">
                  ছেলে ও মেয়ে উভয়ের জন্য আকর্ষণীয় ও আধুনিক রঙের কম্বিনেশন বেছে নিন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  id: 'unisex' as const,
                  title: '🌟 Modern Unisex',
                  subtitle: 'মডার্ন স্লেট ও অনিক্স',
                  desc: 'ছেলে ও মেয়ে উভয়ের পছন্দের স্টাইলিশ ও নিউট্রাল লুক',
                  colors: ['#0F172A', '#F8FAFC', '#2563EB'],
                },
                {
                  id: 'bw' as const,
                  title: '🖤 Black & White',
                  subtitle: 'মিনিমালিস্ট মনোক্রোম',
                  desc: 'হাই-ফ্যাশন ও স্ট্রিটওয়্যারের ক্লাসিক ব্ল্যাক অ্যান্ড হোয়াইট',
                  colors: ['#000000', '#FFFFFF', '#404040'],
                },
                {
                  id: 'dark' as const,
                  title: '🌙 Midnight Dark',
                  subtitle: 'মিডনাইট ডার্ক মোড',
                  desc: 'রাতের ব্রাউজিংয়ের জন্য আরামদায়ক সাইবার ডার্ক লুক',
                  colors: ['#0B0F19', '#111827', '#38BDF8'],
                },
                {
                  id: 'royal' as const,
                  title: '👑 Royal Luxury',
                  subtitle: 'রয়্যাল নেভি ও গোল্ড',
                  desc: 'ক্লাসিক লাক্সারি ও শ্যাম্পেন গোল্ডের প্রিমিয়াম ভাইব',
                  colors: ['#0F172A', '#FFFBEB', '#D97706'],
                },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setThemeChoice(t.id)}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                    themeChoice === t.id
                      ? 'border-neutral-900 bg-neutral-50 shadow-md ring-2 ring-neutral-900/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-neutral-900">{t.title}</span>
                      {themeChoice === t.id && (
                        <CheckCircle2 className="w-4 h-4 text-neutral-900" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-700 mb-1">{t.subtitle}</p>
                    <p className="text-[10px] text-neutral-500 leading-relaxed mb-3">{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    {t.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business & Brand Contact Info */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
              ব্র্যান্ড ও যোগাযোগের তথ্য
            </h2>

            {/* Website Logo Upload Section */}
            <div className="p-4 bg-[#FFF8FA] border border-[#F0E2E8] rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-[#292329]">
                ওয়েবসাইট লোগো (Website Logo)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview */}
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-[#F7C8D5] p-2 flex items-center justify-center flex-shrink-0 shadow-xs relative group overflow-hidden">
                  <img
                    src={logoUrl || '/logo-icon.png'}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo-icon.png';
                    }}
                  />
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#D45D83]" />
                    </div>
                  )}
                </div>

                {/* Upload & Direct Link controls */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className={`px-4 py-2 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingLogo ? 'আপলোড হচ্ছে...' : 'লোগো ফাইল আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {logoUrl && logoUrl !== '/logo-icon.png' && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('/logo-icon.png')}
                        className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium border border-gray-200"
                      >
                        ডিফল্ট লোগো রিসেট
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="অথবা সরাসরি লোগো ছবির URL দিন (যেমন: https://...)"
                      className="w-full px-3.5 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83] bg-white"
                    />
                    <p className="text-[11px] text-[#77717A] mt-1">
                      পরামর্শ: স্বচ্ছ ব্যাকগ্রাউন্ডযুক্ত (Transparent PNG বা SVG) স্কয়ার সাইজের লোগো সবচেয়ে সুন্দর দেখায়।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  সাইটের নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={siteNameBn}
                  onChange={(e) => setSiteNameBn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  সাইটের নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={siteNameEn}
                  onChange={(e) => setSiteNameEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  কাস্টমার কেয়ার ফোন
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  অফিসিয়াল ইমেইল
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292329] mb-1">
                অফিসের ঠিকানা
              </label>
              <input
                type="text"
                value={addressBn}
                onChange={(e) => setAddressBn(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
              />
            </div>
          </div>

          {/* Social Links & Free Delivery */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
              সোশ্যাল মিডিয়া ও ডেলিভারি পলিসি
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  ফেসবুক পেজ লিংক
                </label>
                <input
                  type="text"
                  value={facebookLink}
                  onChange={(e) => setFacebookLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  ইনস্টাগ্রাম লিংক
                </label>
                <input
                  type="text"
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  ফ্রি ডেলিভারির সর্বনিম্ন অর্ডার মূল্য (৳)
                </label>
                <input
                  type="number"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  ঢাকার ভেতরে ডেলিভারি চার্জ (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFeeDhaka}
                  onChange={(e) => setDeliveryFeeDhaka(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292329] mb-1">
                  ঢাকার বাইরে ডেলিভারি চার্জ (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFeeOutsideDhaka}
                  onChange={(e) => setDeliveryFeeOutsideDhaka(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white border border-[#F0E2E8] rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>মেইনটেন্যান্স মোড (Maintenance Mode)</span>
              </h3>
              <p className="text-xs text-[#77717A]">
                সক্রিয় করলে সাধারণ গ্রাহকদের জন্য সাময়িক সংস্কার বার্তা প্রদর্শিত হবে
              </p>
            </div>

            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminSettingsPage;
