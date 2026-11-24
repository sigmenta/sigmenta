/**
 * src/lib/cloudinary.ts
 * ---------------------
 * Cloudinary frontend utilities — NO API secrets.
 *
 * Only the unsigned upload preset (VITE_CLOUDINARY_UPLOAD_PRESET) is used
 * here.  All signed operations (delete, admin) MUST be performed server-side
 * via Firebase Cloud Functions using CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 * stored in Functions environment config.
 */

import type { CloudinaryUploadResult } from '@/types';

// ---------------------------------------------------------------------------
// Environment — read once at module load
// ---------------------------------------------------------------------------
const CLOUD_NAME: string = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'womens-favorite';
const UPLOAD_PRESET: string = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wf_uploads';

const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductImageSize = 'thumb' | 'gallery' | 'full';

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/**
 * Build a Cloudinary delivery URL with optional transformation string.
 *
 * @param publicId       Cloudinary public ID (may include folder prefix, e.g. "products/abc123")
 * @param transformations Cloudinary transformation string, e.g. "w_400,h_500,c_fill,f_auto,q_auto"
 */
export function getCloudinaryUrl(publicId: string, transformations?: string): string {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) return publicId;
  const tx = transformations ? `${transformations}/` : '';
  return `${CLOUDINARY_BASE}/image/upload/${tx}${publicId}`;
}

/**
 * Returns an optimised product image URL for a given display context.
 *
 * | size    | dimensions  | use case          |
 * |---------|-------------|-------------------|
 * | thumb   | 400 × 500   | product cards      |
 * | gallery | 800 × 1000  | product gallery    |
 * | full    | original    | zoom / lightbox    |
 */
export function getProductImageUrl(publicId: string, size: ProductImageSize = 'thumb'): string {
  const transforms: Record<ProductImageSize, string> = {
    thumb:   'w_400,h_500,c_fill,f_auto,q_auto',
    gallery: 'w_800,h_1000,c_fill,f_auto,q_auto',
    full:    'f_auto,q_auto',
  };
  return getCloudinaryUrl(publicId, transforms[size]);
}

/**
 * Returns an optimised banner image URL (wide, webp, quality auto).
 * Typical banner: 1440 × 630, fill crop.
 */
export function getBannerImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'w_1440,h_630,c_fill,f_auto,q_auto');
}

/**
 * Returns an optimised category image URL.
 * Square format, suitable for category tiles (600 × 600).
 */
export function getCategoryImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'w_600,h_600,c_fill,f_auto,q_auto');
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_PREFIX = 'image/';

/**
 * Validates a File before upload:
 * - Must be an image (image/*)
 * - Must be ≤ 5 MB
 * @throws {Error} with user-friendly Bangla message on validation failure
 */
function validateImageFile(file: File): void {
  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    throw new Error('শুধুমাত্র ছবি ফাইল আপলোড করা যাবে (JPEG, PNG, WebP, GIF)।');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।');
  }
}

/**
 * Upload an image to Cloudinary via unsigned preset.
 *
 * Uses XMLHttpRequest so upload progress can be tracked.
 *
 * @param file       Image File object from an <input type="file">
 * @param folder     Cloudinary folder to place the asset in (e.g. "products", "banners")
 * @param onProgress Optional callback receiving upload percentage (0–100)
 * @returns          Resolved CloudinaryUploadResult on success
 * @throws           Error with a Bangla message on validation or network failure
 *
 * @example
 * ```ts
 * const result = await uploadToCloudinary(file, 'products', (pct) => {
 *   setProgress(pct);
 * });
 * console.log(result.secure_url, result.public_id);
 * ```
 */
export function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (percentage: number) => void,
): Promise<CloudinaryUploadResult> {
  // Validate before touching the network
  validateImageFile(file);

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', folder);
    }

    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(result);
        } catch {
          reject(new Error('সার্ভার থেকে অপ্রত্যাশিত উত্তর পাওয়া গেছে।'));
        }
      } else {
        // Attempt to extract Cloudinary's error message
        let message = 'ছবি আপলোড ব্যর্থ হয়েছে।';
        try {
          const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (body.error?.message) {
            message = `আপলোড ত্রুটি: ${body.error.message}`;
          }
        } catch {
          // ignore parse error, use default
        }
        reject(new Error(message));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('নেটওয়ার্ক সমস্যার কারণে আপলোড সম্পন্ন হয়নি।'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('আপলোড বাতিল করা হয়েছে।'));
    });

    xhr.open('POST', UPLOAD_URL, true);
    xhr.send(formData);
  });
}

// ---------------------------------------------------------------------------
// Deletion — intentionally server-side only
// ---------------------------------------------------------------------------
/*
 * ⚠️  deleteCloudinaryImage is NOT implemented client-side.
 *
 * Deleting assets via the Cloudinary API requires signing the request with
 * CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.  These secrets MUST NEVER be
 * included in any VITE_ variable or the frontend bundle.
 *
 * To delete an image:
 *   1. Call the Firebase Cloud Function `deleteProductImage` (or equivalent).
 *   2. The Cloud Function reads the secrets from Functions environment config:
 *        cloudinary.api_key  / cloudinary.api_secret
 *   3. The Cloud Function calls cloudinary.uploader.destroy(publicId).
 *
 * Example Cloud Function call from the client:
 *   const deleteFn = httpsCallable(functions, 'deleteProductImage');
 *   await deleteFn({ publicId: 'products/abc123' });
 */
