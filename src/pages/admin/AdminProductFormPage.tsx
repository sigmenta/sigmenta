import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Save, ArrowLeft, Plus, Trash2, Sparkles, AlertCircle, Eye, Check, X, Palette
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { slugify } from '@/utils';
import { ROUTES, STOCK_STATUS } from '@/constants';
import type { Product, Category, ProductImage, ProductVariant } from '@/types';

const POPULAR_SIZES = [
  'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size',
  '28', '30', '32', '34', '36', '38', '40'
];

const POPULAR_COLORS = [
  { name: 'কালো (Black)', hex: '#000000', border: false },
  { name: 'সাদা (White)', hex: '#FFFFFF', border: true },
  { name: 'নেভি ব্লু (Navy Blue)', hex: '#0F172A', border: false },
  { name: 'ছাই / গ্রে (Grey)', hex: '#64748B', border: false },
  { name: 'লাল (Red)', hex: '#DC2626', border: false },
  { name: 'মেরুন (Maroon)', hex: '#881337', border: false },
  { name: 'অলিভ গ্রিন (Olive)', hex: '#4D7C0F', border: false },
  { name: 'রয়্যাল ব্লু (Royal Blue)', hex: '#1D4ED8', border: false },
  { name: 'বাদামী (Brown)', hex: '#78350F', border: false },
  { name: 'হলুদ / মাস্টার্ড (Mustard)', hex: '#CA8A04', border: false },
  { name: 'গোলাপি (Pink)', hex: '#EC4899', border: false },
  { name: 'বটল গ্রিন (Bottle Green)', hex: '#064E3B', border: false },
];

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [stockStatus, setStockStatus] = useState<string>('in_stock');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [specificationsBn, setSpecificationsBn] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Specialized Size & Color States
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState('');
  const [customVariants, setCustomVariants] = useState<ProductVariant[]>([]);

  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Fetch categories
  useEffect(() => {
    categoryService.getCategories(true)
      .then((data: any) => {
        setCategories(data);
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch product if editing
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    productService.getProductById(id)
      .then((prod: any) => {
        if (!prod) {
          toast.error('পণ্যটি পাওয়া যায়নি');
          navigate(ROUTES.ADMIN_PRODUCTS);
          return;
        }

        setNameBn(prod.nameBn || '');
        setNameEn(prod.nameEn || '');
        setSlug(prod.slug || '');
        setSku(prod.sku || '');
        setCategoryId(prod.categoryId || '');
        setRegularPrice(prod.regularPrice || 0);
        setSalePrice(prod.salePrice);
        setStockQuantity(prod.stockQuantity || 0);
        setStockStatus(prod.stockStatus || 'in_stock');
        setDescriptionBn(prod.descriptionBn || '');
        setDescriptionEn(prod.descriptionEn || '');
        setSpecificationsBn(prod.specificationsBn || '');
        setImages(prod.images || []);
        setVariants(prod.variants || []);

        // Parse existing variants for size, color & others
        const existingVariants: ProductVariant[] = prod.variants || [];
        const sizeVar = existingVariants.find((v) => v.type === 'size' || v.typeBn?.includes('সাইজ'));
        if (sizeVar) {
          setSelectedSizes(sizeVar.options.map((o) => o.label));
        }
        const colorVar = existingVariants.find((v) => v.type === 'color' || v.typeBn?.includes('রঙ') || v.typeBn?.includes('কালার'));
        if (colorVar) {
          setSelectedColors(colorVar.options.map((o) => o.label));
        }
        const otherVars = existingVariants.filter((v) => 
          v.type !== 'size' && v.type !== 'color' && !v.typeBn?.includes('সাইজ') && !v.typeBn?.includes('রঙ') && !v.typeBn?.includes('কালার')
        );
        setCustomVariants(otherVars);

        setIsFeatured(prod.isFeatured || false);
        setIsBestSeller(prod.isBestSeller || false);
        setIsNewArrival(prod.isNewArrival || false);
        setIsTrending(prod.isTrending || false);
        setStatus(prod.status === 'published' ? 'published' : 'draft');
        setSeoTitle(prod.seo?.title || '');
        setSeoDescription(prod.seo?.description || '');
      })
      .catch((err: unknown) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  const handleNameChange = (val: string) => {
    setNameBn(val);
    if (!isEditing && !slug) {
      setSlug(slugify(val) || `product-${Date.now()}`);
    }
    if (!sku) {
      setSku(`WF-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // ── Size Handlers ──────────────────────────────────────────────────────────
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customSizeInput.trim();
    if (!val) return;
    if (!selectedSizes.includes(val)) {
      setSelectedSizes((prev) => [...prev, val]);
    }
    setCustomSizeInput('');
  };

  const handleRemoveSize = (size: string) => {
    setSelectedSizes((prev) => prev.filter((s) => s !== size));
  };

  // ── Color Handlers ─────────────────────────────────────────────────────────
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const handleAddCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customColorInput.trim();
    if (!val) return;
    if (!selectedColors.includes(val)) {
      setSelectedColors((prev) => [...prev, val]);
    }
    setCustomColorInput('');
  };

  const handleRemoveColor = (colorName: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== colorName));
  };

  // ── Custom Variant Handlers ────────────────────────────────────────────────
  const handleAddCustomVariant = () => {
    const typeName = prompt('নতুন ভেরিয়েন্টের নাম লিখুন (যেমন: ফেব্রিক, ম্যাটেরিয়াল, ভলিউম):');
    if (!typeName || !typeName.trim()) return;
    const optionsStr = prompt('অপশনগুলো কমা দিয়ে লিখুন (যেমন: সুতি, লিনেন, কটন):');
    if (!optionsStr || !optionsStr.trim()) return;

    const opts = optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (opts.length === 0) return;

    setCustomVariants((prev) => [
      ...prev,
      {
        type: typeName.trim().toLowerCase().replace(/\s+/g, '-'),
        typeBn: typeName.trim(),
        options: opts.map((opt) => ({
          label: opt,
          value: opt.toLowerCase().replace(/\s+/g, '-'),
        })),
      },
    ]);
  };

  const handleRemoveCustomVariant = (index: number) => {
    setCustomVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameBn.trim()) {
      toast.error('পণ্যের নাম (বাংলা) আবশ্যক');
      return;
    }

    if (!categoryId) {
      toast.error('অনুগ্রহ করে ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (regularPrice <= 0) {
      toast.error('নিয়মিত মূল্য ০ এর বেশি হতে হবে');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categorySlug = selectedCategory?.slug || 'general';

    // Build complete variants list
    const finalVariants: ProductVariant[] = [];
    if (selectedSizes.length > 0) {
      finalVariants.push({
        type: 'size',
        typeBn: 'সাইজ',
        options: selectedSizes.map((s) => ({
          label: s,
          value: s.toLowerCase().replace(/\s+/g, '-'),
        })),
      });
    }
    if (selectedColors.length > 0) {
      finalVariants.push({
        type: 'color',
        typeBn: 'কালার / রঙ',
        options: selectedColors.map((c) => ({
          label: c,
          value: c.toLowerCase().replace(/\s+/g, '-'),
        })),
      });
    }
    if (customVariants.length > 0) {
      finalVariants.push(...customVariants);
    }

    setSaving(true);
    try {
      const productPayload: Record<string, any> = {
        nameBn: nameBn.trim(),
        nameEn: nameEn.trim() || nameBn.trim(),
        slug: slug.trim() || slugify(nameBn) || `product-${Date.now()}`,
        sku: sku.trim() || `WF-${Date.now().toString().slice(-4)}`,
        categoryId,
        categorySlug,
        regularPrice: Number(regularPrice),
        stockQuantity: Number(stockQuantity),
        stockStatus: (stockQuantity <= 0 ? 'out_of_stock' : stockStatus),
        descriptionBn: descriptionBn.trim(),
        descriptionEn: descriptionEn.trim() || descriptionBn.trim(),
        specificationsBn: specificationsBn.trim() || '',
        images,
        primaryImage: images.find((i) => i.isPrimary)?.url || images[0]?.url || '',
        variants: finalVariants,
        tags: [],
        isFeatured,
        isBestSeller,
        isNewArrival,
        isTrending,
        isOnSale: Boolean(salePrice && Number(salePrice) < Number(regularPrice)),
        status,
        seo: {
          title: seoTitle.trim() || nameBn,
          description: seoDescription.trim() || descriptionBn.slice(0, 160),
        },
      };

      if (salePrice && Number(salePrice) > 0) {
        productPayload.salePrice = Number(salePrice);
      }

      if (isEditing && id) {
        await productService.updateProduct(id, productPayload as any);
        toast.success('✅ পণ্য সফলভাবে আপডেট হয়েছে! সব user দেখতে পাবে।');
      } else {
        await productService.createProduct(productPayload as any);
        toast.success('✅ পণ্য Firebase এ সেভ হয়েছে! সব user দেখতে পাবে।');
      }

      navigate(ROUTES.ADMIN_PRODUCTS);
    } catch (err: any) {
      console.error('Save product error:', err);
      if (err?.message === 'NOT_AUTHENTICATED') {
        toast.error('❌ আপনি লগইন নেই! অনুগ্রহ করে Admin লগইন করুন।', { duration: 5000 });
        navigate(ROUTES.ADMIN_LOGIN);
      } else if (err?.message?.includes('permission')) {
        toast.error('❌ অনুমতি নেই! Admin account দিয়ে লগইন করুন।', { duration: 5000 });
      } else {
        toast.error('❌ পণ্য সংরক্ষণ ব্যর্থ হয়েছে। Internet connection চেক করুন।', { duration: 5000 });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#77717A]">তথ্য লোড হচ্ছে...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{`${isEditing ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যুক্ত করুন'} — অ্যাডমিন`}</title>
      </Helmet>

      <div className="space-y-6 font-bangla pb-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.ADMIN_PRODUCTS}
              className="p-2 border border-[#F0E2E8] rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#77717A]" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#292329]">
                {isEditing ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যোগ করুন'}
              </h1>
              <p className="text-xs text-[#77717A]">
                সকল তথ্য সঠিক ও বিস্তারিতভাবে পূরণ করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info Card */}
            <div className="bg-white border border-[#F0E2E8] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                সাধারণ বিবরণ
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    পণ্যের নাম (বাংলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="যেমন: প্রিমিয়াম রোজ ফেস সিরাম"
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    পণ্যের নাম (ইংরেজি - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Premium Rose Face Serum"
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      URL স্লাগ (Slug)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="premium-rose-serum"
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292329] mb-1">
                      SKU কোড
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="WF-5021"
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    পণ্যের বিবরণ (বাংলা)
                  </label>
                  <textarea
                    rows={4}
                    value={descriptionBn}
                    onChange={(e) => setDescriptionBn(e.target.value)}
                    placeholder="পণ্যের গুণাগুণ ও ব্যবহারের সুবিধা বিস্তারিত লিখুন..."
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    স্পেসিফিকেশন / ব্যবহারের নিয়ম
                  </label>
                  <textarea
                    rows={3}
                    value={specificationsBn}
                    onChange={(e) => setSpecificationsBn(e.target.value)}
                    placeholder="উপাদান, পরিমাণ, ব্যবহারের নিয়ম ইত্যাদি..."
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>
              </div>
            </div>

            {/* Product Images Card */}
            <div className="bg-white border border-[#F0E2E8] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                পণ্যের ছবি (Cloudinary)
              </h2>
              <ImageUploader images={images} onChange={setImages} maxImages={8} />
            </div>

            {/* Variants Card: Sizes & Colors */}
            <div className="bg-white border border-[#F0E2E8] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#F0E2E8] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#292329] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#D45D83]" />
                    <span>পণ্যের সাইজ ও কালার ভেরিয়েন্ট (Sizes & Colors)</span>
                  </h2>
                  <p className="text-[11px] text-[#77717A] mt-0.5">
                    পোশাক বা পণ্যের যেসব সাইজ ও রঙ স্টকে আছে, তা নিচে ক্লিক করে অন/অফ করুন
                  </p>
                </div>
              </div>

              {/* 1. Size Selection Section */}
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📏 ১. সাইজ নির্বাচন করুন (Sizes)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({selectedSizes.length}টি সাইজ নির্বাচিত)
                    </span>
                  </label>
                  {selectedSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSizes([])}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      সব মুছুন
                    </button>
                  )}
                </div>

                {/* Quick Size Chips */}
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SIZES.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{size}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Size Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="অন্য সাইজ লিখুন (যেমন: 42, 44, 4-5Y)..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    + সাইজ যোগ করুন
                  </button>
                </div>

                {/* Active Selected Sizes display */}
                {selectedSizes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">নির্বাচিত সাইজ:</span>
                    {selectedSizes.map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-1 bg-slate-900 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-xs"
                      >
                        <span>{size}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          className="hover:text-red-400 p-0.5"
                          aria-label={`Remove ${size}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Color Selection Section */}
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🎨 ২. কালার / রঙ নির্বাচন করুন (Colors)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({selectedColors.length}টি রঙ নির্বাচিত)
                    </span>
                  </label>
                  {selectedColors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      সব মুছুন
                    </button>
                  )}
                </div>

                {/* Quick Color Chips */}
                <div className="flex flex-wrap gap-2">
                  {POPULAR_COLORS.map((col) => {
                    const isSelected = selectedColors.includes(col.name);
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => toggleColor(col.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${col.border ? 'border border-gray-400' : ''}`}
                          style={{ backgroundColor: col.hex }}
                        />
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomColor();
                      }
                    }}
                    placeholder="অন্য রঙ লিখুন (যেমন: পেস্ট, আকাশী, টিল)..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    + রঙ যোগ করুন
                  </button>
                </div>

                {/* Active Selected Colors display */}
                {selectedColors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">নির্বাচিত কালার:</span>
                    {selectedColors.map((col) => (
                      <span
                        key={col}
                        className="inline-flex items-center gap-1 bg-slate-900 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-xs"
                      >
                        <span>{col}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(col)}
                          className="hover:text-red-400 p-0.5"
                          aria-label={`Remove ${col}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Additional Custom Variants */}
              {customVariants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700">অন্যান্য কাস্টম ভেরিয়েন্ট:</h3>
                  {customVariants.map((v, vIdx) => (
                    <div key={vIdx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-slate-800">{v.typeBn || v.type}: </span>
                        <span className="text-xs text-slate-600">
                          {v.options.map((o) => o.label).join(', ')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomVariant(vIdx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomVariant}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>অন্যান্য ফিল্ড যোগ করুন (যেমন: ফ্যাব্রিক / ধরন)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Price, Stock, Category & Flags */}
          <div className="space-y-6">
            {/* Pricing & Stock Card */}
            <div className="bg-white border border-[#F0E2E8] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                মূল্য ও ইনভেন্টরি
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    নিয়মিত মূল্য (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    বিক্রয় মূল্য / ডিসকাউন্ট মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={salePrice ?? ''}
                    onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ঐচ্ছিক ছাড় মূল্য"
                    min={0}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    স্টক পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    min={0}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    স্টক অবস্থা
                  </label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  >
                    <option value="in_stock">স্টকে আছে (In Stock)</option>
                    <option value="low_stock">সীমিত স্টক (Low Stock)</option>
                    <option value="out_of_stock">স্টকে নেই (Out of Stock)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category & Status */}
            <div className="bg-white border border-[#F0E2E8] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#292329] border-b border-[#F0E2E8] pb-3">
                ক্যাটাগরি ও স্ট্যাটাস
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    ক্যাটাগরি <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292329] mb-1">
                    প্রকাশের অবস্থা
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#F0E2E8] rounded-xl text-[#292329] focus:outline-none focus:border-[#D45D83]"
                  >
                    <option value="published">প্রকাশিত (Published)</option>
                    <option value="draft">ড্রাফট (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Special Flags */}
              <div className="pt-2 border-t border-[#F0E2E8] space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <span>ফিচার্ড পণ্য (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <span>সেরা বিক্রিত (Best Seller)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <span>নতুন পণ্য (New Arrival)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    className="w-4 h-4 text-[#D45D83] rounded border-[#F0E2E8] focus:ring-[#D45D83]"
                  />
                  <span>ট্রেন্ডিং (Trending)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#D45D83] hover:bg-[#B8446C] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পণ্য সংরক্ষণ করুন'}</span>
              </button>

              <Link
                to={ROUTES.ADMIN_PRODUCTS}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center transition-colors block text-center"
              >
                বাতিল করুন
              </Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminProductFormPage;
