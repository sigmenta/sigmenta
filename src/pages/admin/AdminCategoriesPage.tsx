import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Folder, Image, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryService } from '@/services/categoryService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { slugify } from '@/utils';
import { IMAGE_CONFIG } from '@/constants';
import type { Category } from '@/types';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories(false);
      setCategories(data);
    } catch {
      toast.error('ক্যাটাগরি লোড করা যায়নি');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setNameBn('');
    setNameEn('');
    setSlug('');
    setImageUrl('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameBn(cat.nameBn);
    setNameEn(cat.nameEn || '');
    setSlug(cat.slug);
    setImageUrl((cat as any).image || '');
    setSortOrder(cat.sortOrder || 1);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  // Bangla name → slug only if no English name yet
  const handleNameBnChange = (val: string) => {
    setNameBn(val);
    if (!nameEn.trim()) {
      setSlug(slugify(val) || `cat-${Date.now()}`);
    }
  };

  // English name → auto-generate slug (preferred)
  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (val.trim()) {
      setSlug(slugify(val));
    } else if (nameBn.trim()) {
      setSlug(slugify(nameBn));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadToCloudinary(file, IMAGE_CONFIG.CATEGORY_FOLDER);
      setImageUrl(res.secure_url);
      toast.success('ছবি আপলোড সম্পন্ন');
    } catch (err: any) {
      toast.error(err.message || 'ছবি আপলোড ব্যর্থ');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) {
      toast.error('ক্যাটাগরির নাম আবশ্যক');
      return;
    }
    setIsSaving(true);
    try {
      const finalSlug = slug.trim() || slugify(nameEn || nameBn) || `cat-${Date.now()}`;
      const payload: Record<string, any> = {
        nameBn: nameBn.trim(),
        slug: finalSlug,
        sortOrder: Number(sortOrder) || 1,
        isActive,
      };
      if (nameEn.trim()) payload.nameEn = nameEn.trim();
      if (imageUrl) {
        payload.image = imageUrl;
        payload.imageUrl = imageUrl;
      }

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, payload);
        toast.success('✅ ক্যাটাগরি আপডেট হয়েছে!');
      } else {
        await categoryService.createCategory(payload as any);
        toast.success('✅ ক্যাটাগরি সেভ হয়েছে!');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      if (err?.message === 'NOT_AUTHENTICATED') {
        toast.error('❌ লগইন নেই! Admin দিয়ে লগইন করুন।', { duration: 5000 });
      } else if (err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account ব্যবহার করুন।', { duration: 5000 });
      } else {
        toast.error('❌ সংরক্ষণ ব্যর্থ। Internet চেক করুন।', { duration: 5000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ক্যাটাগরি মুছবেন?`)) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে');
      loadCategories();
    } catch {
      toast.error('মুছতে ব্যর্থ হয়েছে');
    }
  };

  const catImage = (cat: Category) => (cat as any).image || '';

  return (
    <>
      <Helmet>
        <title>ক্যাটাগরি ব্যবস্থাপনা — Sigmenta Admin</title>
      </Helmet>

      <div className="space-y-6 font-bangla">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#292329]">ক্যাটাগরি ব্যবস্থাপনা</h1>
            <p className="text-xs text-[#77717A]">
              ওয়েবসাইটের ক্যাটাগরি ও মেনু সাজান ({categories.length}টি)
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#F0E2E8] rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#77717A]">লোড হচ্ছে...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77717A]">
              কোনো ক্যাটাগরি নেই। নতুন ক্যাটাগরি যোগ করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFF8FA] text-[#77717A] uppercase text-[11px] border-b border-[#F0E2E8]">
                  <tr>
                    <th className="px-4 py-3.5">ক্রম</th>
                    <th className="px-4 py-3.5">ছবি</th>
                    <th className="px-4 py-3.5">নাম (বাংলা)</th>
                    <th className="px-4 py-3.5">নাম (ইংরেজি)</th>
                    <th className="px-4 py-3.5">স্লাগ</th>
                    <th className="px-4 py-3.5">অবস্থা</th>
                    <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E2E8]">
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-[#FFF8FA]/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#77717A]">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        {catImage(cat) ? (
                          <img
                            src={catImage(cat)}
                            alt={cat.nameBn}
                            className="w-10 h-10 rounded-xl object-cover border border-[#F0E2E8]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] border border-[#F0E2E8] flex items-center justify-center">
                            <Folder className="w-4 h-4 text-[#D45D83]" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#292329]">{cat.nameBn}</td>
                      <td className="px-4 py-3.5 text-[#77717A]">{cat.nameEn || '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#77717A]">{cat.slug}</td>
                      <td className="px-4 py-3.5">
                        {cat.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold text-[10px]">সক্রিয়</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold text-[10px]">নিষ্ক্রিয়</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 hover:bg-[#FFF0F5] text-[#D45D83] rounded-lg transition-colors"
                            title="সম্পাদনা"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.nameBn)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <h3 className="font-bold text-base text-[#292329]">
                  {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-[#77717A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Bangla Name */}
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    ক্যাটাগরির নাম (বাংলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => handleNameBnChange(e.target.value)}
                    placeholder="যেমন: স্কিনকেয়ার"
                    required
                    className="w-full px-3 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                {/* English Name → auto-slug */}
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    নাম (ইংরেজি)
                    <span className="ml-1 text-[10px] font-normal text-[#D45D83]">— দিলে slug অটো তৈরি হয়</span>
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => handleNameEnChange(e.target.value)}
                    placeholder="e.g. Skincare"
                    className="w-full px-3 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                {/* Slug — auto-filled, manually editable */}
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">স্লাগ (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="skincare"
                    className="w-full px-3 py-2.5 text-xs font-mono border border-[#F0E2E8] rounded-xl text-[#77717A] bg-[#FFF8FA] focus:outline-none focus:border-[#D45D83]"
                  />
                  <p className="text-[10px] text-[#77717A] mt-0.5">ইংরেজি নাম দিলে slug অটো তৈরি হয়</p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-2">
                    ক্যাটাগরি ছবি
                  </label>
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border border-[#F0E2E8]"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#FFF0F5] border border-dashed border-[#F7C8D5] flex items-center justify-center flex-shrink-0">
                        <Image className="w-5 h-5 text-[#D45D83]/40" />
                      </div>
                    )}
                    <label className="flex-1 py-3 px-3 border border-dashed border-[#F0E2E8] hover:border-[#D45D83] rounded-xl text-center text-xs text-[#77717A] cursor-pointer bg-[#FFF8FA] transition-colors">
                      {isUploadingImage ? (
                        <span className="flex items-center justify-center gap-1.5 text-[#D45D83]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> আপলোড হচ্ছে...
                        </span>
                      ) : (
                        <span>📷 {imageUrl ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <label htmlFor="catActive" className="text-xs font-semibold text-[#292329] cursor-pointer">
                    ক্যাটাগরি সক্রিয় রাখুন (Active)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#F0E2E8]">
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
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
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

export default AdminCategoriesPage;
