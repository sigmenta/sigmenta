// ─── Women's Favorite — TypeScript Type Definitions ────────────────────────

import type { Timestamp } from 'firebase/firestore';

/* ══════════════════════════════════════════════════════════
   UTILITY TYPES
══════════════════════════════════════════════════════════ */

export type Language = 'bn' | 'en';
export type Currency = 'BDT';
export type UserRole = 'customer' | 'admin' | 'super_admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';

export type PaymentStatus =
  | 'pending'
  | 'initiated'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock' | 'pre_order';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'reported';

export type DiscountType = 'percentage' | 'fixed';

export type BannerPosition = 'hero' | 'secondary' | 'sidebar' | 'popup';

export type LegalPageKey =
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'refund-policy'
  | 'shipping-policy';

/* ══════════════════════════════════════════════════════════
   USER TYPES
══════════════════════════════════════════════════════════ */

export interface UserAddress {
  id: string;
  label: string;            // e.g. 'বাসা', 'অফিস'
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  area?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  displayNameBn?: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  addresses: UserAddress[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  deletionRequestedAt?: Timestamp;
}

/* Public customer info for admin views (no private fields) */
export interface CustomerSummary {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Timestamp;
  totalOrders?: number;
  totalSpent?: number;
}

/* ══════════════════════════════════════════════════════════
   PRODUCT TYPES
══════════════════════════════════════════════════════════ */

export interface ProductVariantOption {
  label: string;       // e.g. 'S', 'M', 'L' or 'Red'
  value: string;       // normalized value
  priceModifier?: number; // additional price for this option
  stock?: number;
}

export interface ProductVariant {
  type: string;        // e.g. 'size', 'color', 'volume'
  typeBn?: string;     // e.g. 'সাইজ', 'রঙ', 'পরিমাণ'
  options: ProductVariantOption[];
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface ProductImage {
  url: string;
  publicId: string;    // Cloudinary public_id for deletion
  alt?: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  descriptionBn: string;
  descriptionEn?: string;
  specificationsBn?: string;
  specificationsEn?: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId?: string;
  sku: string;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  lowStockThreshold?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  isOnSale: boolean;
  status: 'published' | 'draft' | 'archived';
  averageRating: number;
  totalReviews: number;
  totalSales: number;
  seo: ProductSEO;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ProductSummary {
  id: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  regularPrice: number;
  salePrice?: number;
  primaryImage?: string;
  stockStatus: StockStatus;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isOnSale?: boolean;
  categorySlug: string;
}

/* ══════════════════════════════════════════════════════════
   CATEGORY TYPES
══════════════════════════════════════════════════════════ */

export interface Category {
  id: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  icon?: string;           // emoji or icon name
  image?: string;          // Cloudinary URL
  imagePublicId?: string;
  parentId?: string;       // for subcategories
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  seo?: ProductSEO;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   CART TYPES
══════════════════════════════════════════════════════════ */

export interface CartItemVariant {
  type: string;
  value: string;
  label: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  primaryImage?: string;
  regularPrice: number;
  salePrice?: number;
  unitPrice: number;        // effective price (salePrice ?? regularPrice)
  quantity: number;
  maxQuantity: number;      // from product stock
  selectedVariants: CartItemVariant[];
  variantKey: string;       // unique key for this product+variant combo
}

export interface CartState {
  items: CartItem[];
  couponCode?: string;
  couponDiscount?: number;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

/* ══════════════════════════════════════════════════════════
   WISHLIST TYPES
══════════════════════════════════════════════════════════ */

export interface WishlistItem {
  productId: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  primaryImage?: string;
  regularPrice: number;
  salePrice?: number;
  stockStatus: StockStatus;
  addedAt: number;           // Date.now() timestamp
}

/* ══════════════════════════════════════════════════════════
   ORDER TYPES
══════════════════════════════════════════════════════════ */

export interface OrderItem {
  productId: string;
  slug: string;
  nameBn: string;
  nameEn?: string;
  primaryImage?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  selectedVariants: CartItemVariant[];
  variantKey: string;
  subtotal: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  area?: string;
  postalCode?: string;
  deliveryInstructions?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  verifiedAt?: Timestamp;
  gatewayReference?: string;
  amount: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  note?: string;
  updatedBy: string;      // admin uid or 'system'
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  orderReference: string;   // human-readable: WF-20241010-XXXX
  userId: string;
  userEmail: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  payment: OrderPayment;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  deliveryZoneId?: string;
  estimatedDeliveryDate?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   COUPON TYPES
══════════════════════════════════════════════════════════ */

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;    // percentage (0-100) or fixed BDT amount
  minimumOrderValue: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer: number;
  startDate?: Timestamp;
  expiryDate?: Timestamp;
  isActive: boolean;
  usageCount: number;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   REVIEW TYPES
══════════════════════════════════════════════════════════ */

export interface Review {
  id: string;
  productId: string;
  productSlug: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  orderId?: string;          // if from verified purchase
  rating: number;            // 1-5
  title?: string;
  body: string;
  images?: string[];         // Cloudinary URLs
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  adminNotes?: string;
  reportCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   BANNER TYPES
══════════════════════════════════════════════════════════ */

export interface Banner {
  id: string;
  titleBn?: string;
  titleEn?: string;
  subtitleBn?: string;
  subtitleEn?: string;
  imageUrl: string;
  imageMobileUrl?: string;
  imagePublicId: string;
  ctaText?: string;
  ctaLink?: string;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   DELIVERY ZONE TYPES
══════════════════════════════════════════════════════════ */

export interface DeliveryZone {
  id: string;
  nameBn: string;
  nameEn?: string;
  districts: string[];
  deliveryFee: number;
  estimatedDays: string;    // e.g. '3-5 দিন'
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   SITE SETTINGS TYPES
══════════════════════════════════════════════════════════ */

export interface PaymentMethodConfig {
  isEnabled: boolean;
  displayName: string;
  instructions?: string;
  sandboxMode?: boolean;
}

export interface SiteSettings {
  id: 'global';
  siteName: string;
  siteNameBn: string;
  tagline?: string;
  taglineBn?: string;
  logoUrl?: string;
  logoPublicId?: string;
  faviconUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  addressBn?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  paymentMethods: {
    cod: PaymentMethodConfig;
    bkash: PaymentMethodConfig;
    nagad: PaymentMethodConfig;
  };
  freeDeliveryThreshold?: number;
  deliveryFeeDhaka?: number;
  deliveryFeeOutsideDhaka?: number;
  theme?: 'unisex' | 'bw' | 'dark' | 'royal';
  announcementBar?: {
    isActive: boolean;
    textBn: string;
    textEn?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  maintenanceMode: boolean;
  updatedAt: Timestamp;
  updatedBy: string;
}

/* ══════════════════════════════════════════════════════════
   LEGAL PAGE TYPES
══════════════════════════════════════════════════════════ */

export interface LegalPage {
  id: LegalPageKey;
  titleBn: string;
  titleEn?: string;
  contentBn: string;          // sanitized HTML from rich text editor
  contentEn?: string;
  lastUpdated: Timestamp;
  updatedBy: string;
}

/* ══════════════════════════════════════════════════════════
   PAYMENT TRANSACTION TYPES
══════════════════════════════════════════════════════════ */

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderReference: string;
  userId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>; // raw gateway response (sanitized)
  initiatedAt: Timestamp;
  verifiedAt?: Timestamp;
  failureReason?: string;
  idempotencyKey: string;    // prevents duplicate processing
  webhookReceivedAt?: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   AUDIT LOG TYPES
══════════════════════════════════════════════════════════ */

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;       // admin uid
  performedByEmail: string;
  targetType: string;        // e.g. 'product', 'order', 'user'
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

/* ══════════════════════════════════════════════════════════
   SEARCH & FILTER TYPES
══════════════════════════════════════════════════════════ */

export interface ProductFilters {
  categorySlug?: string;
  subcategoryId?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  stockStatus?: StockStatus;
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  sortBy?: ProductSortKey;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type ProductSortKey =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popularity'
  | 'name_asc'
  | 'name_desc';

export interface SearchResult {
  products: ProductSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ══════════════════════════════════════════════════════════
   CHECKOUT TYPES
══════════════════════════════════════════════════════════ */

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  area?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  saveAddress?: boolean;
}

export interface CheckoutSummary {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryZone?: DeliveryZone;
  deliveryFee: number;
  total: number;
}

/* ══════════════════════════════════════════════════════════
   FORM & UI TYPES
══════════════════════════════════════════════════════════ */

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

/* ══════════════════════════════════════════════════════════
   ADMIN DASHBOARD TYPES
══════════════════════════════════════════════════════════ */

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayRevenue: number;
  todayOrders: number;
  revenueGrowth?: number;    // percentage vs last period
  orderGrowth?: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

/* ══════════════════════════════════════════════════════════
   CLOUDINARY TYPES
══════════════════════════════════════════════════════════ */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  asset_id: string;
}

export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  result: CloudinaryUploadResult | null;
}

/* ══════════════════════════════════════════════════════════
   CONTEXT TYPES
══════════════════════════════════════════════════════════ */

export type SiteTheme = 'unisex' | 'bw' | 'dark' | 'royal';

export interface ThemeContextValue {
  isDark: boolean;
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
}

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isBangla: boolean;
}

export interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: import('firebase/auth').User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}
