// ─── Sigmenta™ — Application Constants ───────────────────────────────────────

/* ── Brand Identity ── */
export const BRAND = {
  name: 'Sigmenta',
  nameBn: 'সিগমেন্টা',
  tagline: 'Wear Your Style',
  taglineEn: 'Wear Your Style',
  description:
    'Sigmenta™ — Wear Your Style. তরুণ-তরুণী ও ফ্যাশন সচেতন সকলের জন্য প্রিমিয়াম পোশাক ও লাইফস্টাইল ব্র্যান্ড।',
  descriptionEn:
    'Sigmenta™ — Wear Your Style. Premium fashion & lifestyle apparel for everyone.',
  currency: 'BDT',
  currencySymbol: '৳',
  locale: 'bn-BD',
  country: 'Bangladesh',
  countryCode: 'BD',
  phone: '+880 1620605353',
  email: 'support@sigmenta.com',
  address: 'ঢাকা, বাংলাদেশ',
  addressEn: 'Dhaka, Bangladesh',
  website: 'https://www.sigmenta.shop',
  socialMedia: {
    facebook: 'https://www.facebook.com/profile.php?id=61595742368303',
    instagram: 'https://instagram.com/sigmenta.bd',
    youtube: '',
    tiktok: '',
  },
} as const;

/* ── Design Tokens ── */
export const COLORS = {
  primary: '#0F172A',
  primaryDark: '#1E293B',
  primaryLight: '#E2E8F0',
  soft: '#F1F5F9',
  softLight: '#F8FAFC',
  white: '#FFFFFF',
  dark: '#0F172A',
  muted: '#64748B',
  bgLight: '#F8FAFC',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',
} as const;

/* ── Route Paths ── */
export const ROUTES = {
  // Public
  HOME: '/',
  PRODUCTS: '/products',
  CATEGORY: '/category/:slug',
  PRODUCT: '/product/:slug',
  SEARCH: '/search',
  CART: '/cart',
  WISHLIST: '/wishlist',
  CHECKOUT: '/checkout',
  REVIEWS: '/reviews',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms',
  REFUND_POLICY: '/refund-policy',
  SHIPPING_POLICY: '/shipping-policy',
  NOT_FOUND: '*',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Account
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  ACCOUNT_ORDER_DETAIL: '/account/orders/:orderId',
  ACCOUNT_WISHLIST: '/account/wishlist',
  ACCOUNT_ADDRESSES: '/account/addresses',

  // Admin
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/:id/edit',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:id',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_CUSTOMER_DETAIL: '/admin/customers/:id',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_DELIVERY: '/admin/delivery',
  ADMIN_LEGAL: '/admin/legal',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_PROFILE: '/admin/profile',
} as const;

/* ── Firestore Collection Names ── */
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  CARTS: 'carts',
  WISHLISTS: 'wishlists',
  COUPONS: 'coupons',
  REVIEWS: 'reviews',
  BANNERS: 'banners',
  SITE_SETTINGS: 'siteSettings',
  LEGAL_PAGES: 'legalPages',
  DELIVERY_ZONES: 'deliveryZones',
  PAYMENT_TRANSACTIONS: 'paymentTransactions',
  AUDIT_LOGS: 'auditLogs',
} as const;

/* ── Legal Page Keys ── */
export const LEGAL_PAGE_KEYS = {
  PRIVACY_POLICY: 'privacy-policy',
  TERMS: 'terms-and-conditions',
  REFUND_POLICY: 'refund-policy',
  SHIPPING_POLICY: 'shipping-policy',
} as const;

/* ── Order Status ── */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  processing: 'প্রক্রিয়াধীন',
  shipped: 'পাঠানো হয়েছে',
  out_for_delivery: 'ডেলিভারি চলছে',
  delivered: 'ডেলিভারি সম্পন্ন',
  cancelled: 'বাতিল',
  returned: 'ফেরত',
};

export const ORDER_STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

/* ── Payment Methods ── */
export const PAYMENT_METHODS = {
  COD: 'cod',
  BKASH: 'bkash',
  NAGAD: 'nagad',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'ক্যাশ অন ডেলিভারি',
  bkash: 'বিকাশ',
  nagad: 'নগদ',
};

export const PAYMENT_METHOD_LABELS_EN: Record<string, string> = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
};

/* ── Payment Status ── */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  INITIATED: 'initiated',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

/* ── Product Stock Status ── */
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  LOW_STOCK: 'low_stock',
  PRE_ORDER: 'pre_order',
} as const;

export const STOCK_STATUS_LABELS: Record<string, string> = {
  in_stock: 'স্টকে আছে',
  out_of_stock: 'স্টকে নেই',
  low_stock: 'সীমিত স্টক',
  pre_order: 'প্রি-অর্ডার',
};

/* ── Review Status ── */
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REPORTED: 'reported',
} as const;

/* ── Discount Types ── */
export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

/* ── User Roles ── */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

/* ── Pagination ── */
export const PAGINATION = {
  PRODUCTS_PER_PAGE: 20,
  ORDERS_PER_PAGE: 15,
  REVIEWS_PER_PAGE: 10,
  CUSTOMERS_PER_PAGE: 20,
  ADMIN_PRODUCTS_PER_PAGE: 25,
} as const;

/* ── Image Configuration ── */
export const IMAGE_CONFIG = {
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
  UPLOAD_FOLDER: 'womens-favorite',
  PRODUCT_FOLDER: 'womens-favorite/products',
  BANNER_FOLDER: 'womens-favorite/banners',
  CATEGORY_FOLDER: 'womens-favorite/categories',
  AVATAR_FOLDER: 'womens-favorite/avatars',
  // Default transformations for product images
  PRODUCT_THUMBNAIL: 'w_400,h_500,c_fill,f_auto,q_auto:good',
  PRODUCT_GALLERY: 'w_800,h_1000,c_fill,f_auto,q_auto:good',
  BANNER_TRANSFORM: 'w_1920,h_700,c_fill,f_auto,q_auto:good',
  CATEGORY_ICON: 'w_200,h_200,c_fill,f_auto,q_auto:good',
} as const;

/* ── Local Storage Keys ── */
export const STORAGE_KEYS = {
  CART: 'wf_cart',
  WISHLIST: 'wf_wishlist',
  LANGUAGE: 'wf_lang',
  THEME: 'wf_theme',
  RECENT_SEARCHES: 'wf_recent_searches',
  GUEST_CHECKOUT: 'wf_guest_checkout',
} as const;

/* ── Languages ── */
export const LANGUAGES = {
  BN: 'bn',
  EN: 'en',
} as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  bn: 'বাংলা',
  en: 'English',
};

/* ── Bangladesh Districts (for delivery) ── */
export const BANGLADESH_DISTRICTS = [
  'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল',
  'রংপুর', 'ময়মনসিংহ', 'কুমিল্লা', 'নারায়ণগঞ্জ', 'গাজীপুর',
  'টাঙ্গাইল', 'ফরিদপুর', 'বগুড়া', 'দিনাজপুর', 'যশোর',
  'নোয়াখালী', 'ব্রাহ্মণবাড়িয়া', 'পাবনা', 'নরসিংদী',
  'কক্সবাজার', 'জামালপুর', 'মাদারীপুর', 'শেরপুর',
  'নেত্রকোণা', 'মানিকগঞ্জ', 'মুন্সিগঞ্জ', 'রাজবাড়ী',
  'গোপালগঞ্জ', 'শরীয়তপুর', 'কিশোরগঞ্জ', 'ময়মনসিংহ',
  'সুনামগঞ্জ', 'মৌলভীবাজার', 'হবিগঞ্জ', 'চাঁদপুর',
  'ফেনী', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান',
  'লক্ষ্মীপুর', 'সাতক্ষীরা', 'বাগেরহাট', 'ঝিনাইদহ',
  'মাগুরা', 'নড়াইল', 'কুষ্টিয়া', 'মেহেরপুর', 'চুয়াডাঙ্গা',
  'চাঁপাইনবাবগঞ্জ', 'নওগাঁ', 'নাটোর', 'সিরাজগঞ্জ', 'জয়পুরহাট',
  'গাইবান্ধা', 'লালমনিরহাট', 'নীলফামারী', 'কুড়িগ্রাম',
  'ঠাকুরগাঁও', 'পঞ্চগড়', 'জামালপুর', 'ঝালকাঠি',
  'পিরোজপুর', 'ভোলা', 'পটুয়াখালী', 'বরগুনা',
] as const;

/* ── Category Slugs (defaults — admin can configure) ── */
export const DEFAULT_CATEGORIES = [
  { slug: 'skincare', nameBn: 'স্কিনকেয়ার', nameEn: 'Skincare', icon: '🧴' },
  { slug: 'makeup', nameBn: 'মেকআপ ও কসমেটিক্স', nameEn: 'Makeup & Cosmetics', icon: '💄' },
  { slug: 'clothing', nameBn: 'মহিলা পোশাক', nameEn: "Women's Clothing", icon: '👗' },
  { slug: 'bags', nameBn: 'ব্যাগ ও পার্স', nameEn: 'Bags & Purses', icon: '👜' },
  { slug: 'jewelry', nameBn: 'গহনা ও অ্যাক্সেসরিজ', nameEn: 'Jewelry & Accessories', icon: '💍' },
  { slug: 'haircare', nameBn: 'হেয়ারকেয়ার', nameEn: 'Hair Care', icon: '💆' },
  { slug: 'personal-care', nameBn: 'পার্সোনাল কেয়ার', nameEn: 'Personal Care', icon: '🛁' },
  { slug: 'footwear', nameBn: 'জুতা ও স্যান্ডেল', nameEn: 'Footwear', icon: '👠' },
  { slug: 'lifestyle', nameBn: 'লাইফস্টাইল', nameEn: 'Lifestyle', icon: '🏠' },
  { slug: 'gifts', nameBn: 'গিফট আইটেম', nameEn: 'Gift Items', icon: '🎁' },
  { slug: 'new-arrivals', nameBn: 'নতুন পণ্য', nameEn: 'New Arrivals', icon: '✨' },
  { slug: 'sale', nameBn: 'সেল', nameEn: 'Sale', icon: '🏷️' },
] as const;

/* ── Audit Log Action Types ── */
export const AUDIT_ACTIONS = {
  // Product actions
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_PUBLISHED: 'product.published',
  PRODUCT_ARCHIVED: 'product.archived',
  // Order actions
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status_updated',
  ORDER_CANCELLED: 'order.cancelled',
  // Payment actions
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_VERIFIED: 'payment.verified',
  PAYMENT_FAILED: 'payment.failed',
  // User actions
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_SUSPENDED: 'user.suspended',
  // Coupon actions
  COUPON_CREATED: 'coupon.created',
  COUPON_UPDATED: 'coupon.updated',
  COUPON_DELETED: 'coupon.deleted',
  // Review actions
  REVIEW_APPROVED: 'review.approved',
  REVIEW_REJECTED: 'review.rejected',
  // Settings
  SETTINGS_UPDATED: 'settings.updated',
  LEGAL_PAGE_UPDATED: 'legal_page.updated',
  DELIVERY_ZONE_UPDATED: 'delivery_zone.updated',
} as const;

/* ── Search Configuration ── */
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RECENT_SEARCHES: 10,
  DEBOUNCE_MS: 300,
  MAX_SUGGESTIONS: 8,
} as const;

/* ── Toast Configuration ── */
export const TOAST_CONFIG = {
  DURATION_SHORT: 2000,
  DURATION_DEFAULT: 3500,
  DURATION_LONG: 5000,
} as const;

/* ── Cart Limits ── */
export const CART_CONFIG = {
  MAX_QUANTITY_PER_ITEM: 20,
  MIN_QUANTITY: 1,
  FREE_DELIVERY_THRESHOLD: 0, // Set by admin in siteSettings
} as const;

/* ── File Upload ── */
export const UPLOAD_CONFIG = {
  MAX_PRODUCT_IMAGES: 8,
  MAX_BANNER_IMAGES: 1,
  MAX_AVATAR_SIZE_MB: 2,
} as const;
