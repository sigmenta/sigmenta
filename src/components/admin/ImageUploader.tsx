import React, { useState, useRef } from 'react';
import { Upload, X, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { IMAGE_CONFIG } from '@/constants';
import type { ProductImage } from '@/types';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 8,
  folder = IMAGE_CONFIG.PRODUCT_FOLDER,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`সর্বোচ্চ ${maxImages}টি ছবি আপলোড করা যাবে`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedNew: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
        toast.error(`"${file.name}" অনুমোদিত ছবি ফরম্যাট নয়`);
        continue;
      }

      if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" ফাইলের সাইজ ৫MB এর বেশি`);
        continue;
      }

      try {
        const result = await uploadToCloudinary(file, folder, (pct) => {
          setUploadProgress(pct);
        });

        uploadedNew.push({
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary: images.length === 0 && uploadedNew.length === 0,
        });
      } catch (err: any) {
        toast.error(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
      }
    }

    if (uploadedNew.length > 0) {
      onChange([...images, ...uploadedNew]);
      toast.success(`${uploadedNew.length}টি ছবি সফলভাবে আপলোড হয়েছে`);
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If we removed the primary image and have remaining images, make the first one primary
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4 font-bangla">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed border-[#F0E2E8] hover:border-[#D45D83] bg-[#FFF8FA] rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          uploading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#D45D83] animate-spin" />
              <p className="text-xs text-[#292329] font-bold">
                ছবি ক্লাউডিনারিতে আপলোড হচ্ছে... ({uploadProgress}%)
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#F0E2E8] text-[#D45D83] flex items-center justify-center shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#292329]">
                ছবি নির্বাচন করতে ক্লিক করুন অথবা ড্রপ করুন
              </p>
              <p className="text-xs text-[#77717A]">
                সর্বোচ্চ ৫MB (JPG, PNG, WebP) — ক্লাউডিনারি স্টোরেজ
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative aspect-[3/4] bg-white rounded-xl overflow-hidden border-2 shadow-sm group ${
                img.isPrimary ? 'border-[#D45D83]' : 'border-[#F0E2E8]'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />

              {/* Badges / Actions */}
              <div className="absolute top-2 left-2 flex gap-1">
                {img.isPrimary ? (
                  <span className="px-2 py-0.5 bg-[#D45D83] text-white text-[10px] font-bold rounded-full shadow-sm">
                    মূল ছবি
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="p-1 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm transition-colors text-[10px] flex items-center gap-0.5 px-1.5"
                    title="মূল ছবি বানান"
                  >
                    <Star className="w-3 h-3 text-amber-500" />
                    <span>সেট করুন</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-full shadow-sm transition-colors"
                title="মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
