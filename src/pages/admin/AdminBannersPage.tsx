import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Edit, Image as ImageIcon, Loader2, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { bannerService } from '@/services/bannerService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { IMAGE_CONFIG } from '@/constants';
import type { Banner, BannerPosition } from '@/types';

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [titleBn, setTitleBn] = useState('');
  const [subtitleBn, setSubtitleBn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [ctaText, setCtaText] = useState('এখনই কিনুন');
  const [ctaLink, setCtaLink] = useState('/products');
  const [position, setPosition] = useState<BannerPosition>('hero');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const data = await bannerService.getBanners(undefined, false);
      setBanners(data);
    } catch {
      toast.error('ব্যানার লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitleBn('');
    setSubtitleBn('');
    setImageUrl('');
    setImagePublicId('');
    setCtaText('এখনই কিনুন');
    setCtaLink('/products');
    setPosition('hero');
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadToCloudinary(file, IMAGE_CONFIG.BANNER_FOLDER);
      setImageUrl(res.secure_url);
      setImagePublicId(res.public_id);
      toast.success('ছবি আপলোড সম্পন্ন');
    } catch (err: any) {
      toast.error(err.message || 'ছবি আপলোড ব্যর্থ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('ব্যানারের ছবি আবশ্যক');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        titleBn: titleBn.trim() || '',
        titleEn: titleBn.trim() || '',
        subtitleBn: subtitleBn.trim() || '',
        imageUrl: imageUrl.trim(),
        imagePublicId: imagePublicId.trim() || `banner-${Date.now()}`,
        ctaText: ctaText.trim() || 'এখনই কিনুন',
        ctaLink: ctaLink.trim() || '/products',
        position: position || 'hero',
        sortOrder: Number(sortOrder) || 1,
        isActive: Boolean(isActive),
      };

      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, payload);
        toast.success('✅ ব্যানার আপডেট হয়েছে! সব user দেখতে পাবে।');
      } else {
        await bannerService.createBanner(payload as any);
        toast.success('✅ ব্যানার Firebase এ সেভ হয়েছে! সব user দেখতে পাবে।');
      }

      setModalOpen(false);
      loadBanners();
    } catch (err: any) {
      console.error('[AdminBannersPage] Save error:', err);
      if (err?.message === 'NOT_AUTHENTICATED') {
        toast.error('❌ লগইন নেই! Admin account দিয়ে আবার লগইন করুন।', { duration: 5000 });
      } else if (err?.message?.includes('permission') || err?.code?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account ব্যবহার করুন।', { duration: 5000 });
      } else {
        toast.error(`❌ সংরক্ষণ ব্যর্থ: ${err?.message || 'অনুগ্রহ করে ইন্টারনেট চেক করুন'}`, { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('ব্যানারটি মুছে ফেলতে চান?')) return;

    try {
      await bannerService.deleteBanner(id);
      toast.success('ব্যানার মুছে ফেলা হয়েছে');
      loadBanners();
    } catch {
      toast.error('মুছতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <>
      <Helmet>
        <title>ব্যানার ব্যবস্থাপনা — অ্যাডমিন</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
              ব্যানার ও প্রমোশন স্লাইডার
            </h1>
            <p className="text-xs text-[#77717A]">
              হোমপেজের হিরো ব্যানার ও প্রমোশনাল ব্যানার সাজান ({banners.length}টি ব্যানার)
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্যানার</span>
          </button>
        </div>

        {/* Banners Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
        ) : banners.length === 0 ? (
          <div className="bg-white border border-[#F0E2E8] rounded-2xl p-8 text-center text-xs text-[#77717A]">
            কোনো ব্যানার নেই। নতুন ব্যানার যোগ করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white border border-[#F0E2E8] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/7] bg-[#FFF8FA] overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      alt={banner.titleBn || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 bg-black/60 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {banner.position}
                      </span>
                      {banner.isActive ? (
                        <span className="px-2.5 py-1 bg-green-500/80 text-white rounded-full text-[10px] font-bold">
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-500/80 text-white rounded-full text-[10px] font-bold">
                          নিষ্ক্রিয়
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-[#292329]">{banner.titleBn || 'শিরোনামহীন'}</h3>
                    {banner.subtitleBn && (
                      <p className="text-xs text-[#77717A]">{banner.subtitleBn}</p>
                    )}
                    {banner.ctaLink && (
                      <div className="flex items-center gap-1 text-[11px] text-[#D45D83] font-semibold">
                        <ExternalLink className="w-3 h-3" />
                        <span>লিংক: {banner.ctaLink}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-xs flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Banner */}
        {modalOpen && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <h3 className="font-bold text-base text-[#292329]">নতুন প্রমোশনাল ব্যানার</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-[#77717A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    ব্যানার ছবি (Cloudinary) <span className="text-red-500">*</span>
                  </label>
                  {imageUrl ? (
                    <div className="relative aspect-[16/7] rounded-xl overflow-hidden border mb-2">
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : null}

                  <label className="block py-2.5 px-3 border border-dashed border-[#F0E2E8] hover:border-[#D45D83] rounded-xl text-center text-xs text-[#77717A] cursor-pointer bg-[#FFF8FA]">
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-1.5 text-[#D45D83]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> আপলোড হচ্ছে...
                      </span>
                    ) : (
                      <span>ছবি আপলোড করতে ক্লিক করুন (১৬:৭ অনুপাতে সেরা)</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">শিরোনাম (বাংলা)</label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    placeholder="যেমন: ঈদ স্পেশাল কালেকশন"
                    className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">সাবটাইটেল</label>
                  <input
                    type="text"
                    value={subtitleBn}
                    onChange={(e) => setSubtitleBn(e.target.value)}
                    placeholder="যেমন: সকল স্কিনকেয়ারে ২০% পর্যন্ত ছাড়"
                    className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">বাটন টেক্সট</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="এখনই কিনুন"
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">বাটন লিংক</label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="/products"
                      className="w-full px-3 py-2 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <label htmlFor="bannerActive" className="text-xs font-semibold text-[#292329] cursor-pointer">
                    ব্যানারটি সক্রিয় রাখুন
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
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'ব্যানার যোগ করুন'}
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

export default AdminBannersPage;
