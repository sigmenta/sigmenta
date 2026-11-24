// ============================================================
// functions/src/shared/types.ts
// Shared TypeScript types for Cloud Functions
// ============================================================

// ─────────────────────────────────────────────
// Order Types
// ─────────────────────────────────────────────

export interface SelectedVariant {
  type: string;   // e.g. 'color', 'size'
  value: string;  // e.g. 'Red', 'XL'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  selectedVariants: SelectedVariant[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  upazila: string;
  postalCode?: string;
}

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';

export interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  orderReference?: string;
  paymentUrl?: string;  // For bKash / Nagad redirect
  error?: string;
  errorCode?: string;
}

// ─────────────────────────────────────────────
// Payment Types
// ─────────────────────────────────────────────

export interface PaymentInitiateRequest {
  orderId: string;
  amount: number;         // In BDT (taka), integer or up to 2 decimal places
  orderReference: string; // Human-readable order reference e.g. WF-20240101-0001
  paymentMethod: 'bkash' | 'nagad';
}

export interface PaymentInitiateResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;   // Gateway-provided transaction/payment ID
  error?: string;
  errorCode?: string;
}

export interface PaymentVerifyRequest {
  paymentId: string;    // Gateway-provided payment ID
  orderId: string;
  paymentMethod: 'bkash' | 'nagad';
}

export interface PaymentVerifyResponse {
  success: boolean;
  transactionId?: string;
  status?: 'completed' | 'failed' | 'cancelled' | 'pending';
  amount?: number;
  error?: string;
}

/**
 * Raw callback payload received from bKash/Nagad webhook.
 * Structure varies by provider — this is a generic envelope.
 * Actual parsing happens inside the provider-specific handler.
 */
export interface PaymentCallbackPayload {
  paymentID?: string;        // bKash field
  paymentRefId?: string;     // Nagad field
  status: string;
  trxID?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  [key: string]: unknown;    // Allow additional provider-specific fields
}

// ─────────────────────────────────────────────
// Admin / Role Types
// ─────────────────────────────────────────────

export type AdminRole = 'admin' | 'super_admin';

export interface GrantRoleRequest {
  targetUid: string;
  role: AdminRole;
}

export interface GrantRoleResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ─────────────────────────────────────────────
// Cloudinary Types
// ─────────────────────────────────────────────

export interface CloudinarySignRequest {
  folder: string;
}

export interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

// ─────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────

export type AuditAction =
  | 'order_created'
  | 'order_status_updated'
  | 'role_granted'
  | 'role_revoked'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'coupon_applied'
  | 'payment_initiated'
  | 'payment_verified';

export interface AuditLogEntry {
  action: AuditAction;
  performedBy: string;       // UID of who triggered the action
  targetType: string;        // e.g. 'order', 'user', 'product'
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp;
}

// ─────────────────────────────────────────────
// Internal Firestore types for Cloud Functions
// ─────────────────────────────────────────────

export interface ProductSnapshot {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  salePrice?: number;
  stock: number;
  status: 'published' | 'draft' | 'archived';
  images: Array<{ url: string; publicId: string }>;
  categorySlug: string;
}

export interface CouponSnapshot {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number | null;    // null = unlimited
  usageCount: number;
  isActive: boolean;
  expiryDate: FirebaseFirestore.Timestamp;
}

export interface DeliveryZoneSnapshot {
  id: string;
  district: string;
  fee: number;
  estimatedDays: string;
}
