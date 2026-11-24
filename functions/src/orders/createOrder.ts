// ============================================================
// functions/src/orders/createOrder.ts
// Cloud Function: createOrder (HTTPS Callable)
// ============================================================
// Creates an order atomically inside a Firestore transaction:
//  1. Validates authenticated caller
//  2. Validates request schema with Zod
//  3. Fetches authoritative product prices & stock
//  4. Validates coupon (if provided)
//  5. Fetches authoritative delivery fee from deliveryZones
//  6. Runs Firestore transaction:
//     - Decrements product stock
//     - Increments coupon usage
//     - Creates order document
//  7. Initiates payment (stub for bKash/Nagad)
//  8. Writes audit log
//  9. Returns orderId and orderReference
// ============================================================

import * as functions from 'firebase-functions';
import { z } from 'zod';
import { db, FieldValue } from '../shared/admin';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  AuditLogEntry,
  ProductSnapshot,
  CouponSnapshot,
  DeliveryZoneSnapshot,
} from '../shared/types';

// ─────────────────────────────────────────────
// Zod validation schema
// ─────────────────────────────────────────────

const SelectedVariantSchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
});

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  selectedVariants: z.array(SelectedVariantSchema),
});

const ShippingAddressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  district: z.string().min(2).max(50),
  upazila: z.string().min(2).max(50),
  postalCode: z.string().max(10).optional(),
});

const CreateOrderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(OrderItemSchema).min(1).max(50),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['cod', 'bkash', 'nagad']),
  couponCode: z.string().max(50).optional(),
});

// ─────────────────────────────────────────────
// Helper: Generate human-readable order reference
// Format: WF-YYYYMMDD-XXXX (XXXX = 4 random alphanumeric chars)
// ─────────────────────────────────────────────
function generateOrderReference(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WF-${date}-${suffix}`;
}

// ─────────────────────────────────────────────
// Helper: Write audit log (non-blocking)
// ─────────────────────────────────────────────
async function writeAuditLog(entry: Omit<AuditLogEntry, 'createdAt'>): Promise<void> {
  try {
    await db.collection('auditLogs').add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Audit log write failure must not break the main flow
    functions.logger.error('Failed to write audit log', { entry, err });
  }
}

// ─────────────────────────────────────────────
// Helper: Calculate effective price (sale price if available)
// ─────────────────────────────────────────────
function effectivePrice(product: ProductSnapshot): number {
  return product.salePrice !== undefined && product.salePrice < product.regularPrice
    ? product.salePrice
    : product.regularPrice;
}

// ─────────────────────────────────────────────
// Cloud Function: createOrder
// Region: asia-east1 (closest to Bangladesh)
// ─────────────────────────────────────────────
export const createOrder = functions
  .region('asia-east1')
  .https.onCall(async (data: unknown, context): Promise<CreateOrderResponse> => {

    // ── 1. Authentication check ──
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to place an order.'
      );
    }

    const callerUid = context.auth.uid;

    // ── 2. Validate request data ──
    let parsed: CreateOrderRequest;
    try {
      parsed = CreateOrderSchema.parse(data) as CreateOrderRequest;
    } catch (validationError) {
      functions.logger.warn('createOrder: validation failed', { data, validationError });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid order data. Please check all fields and try again.'
      );
    }

    // Ensure the caller is ordering for themselves
    if (parsed.userId !== callerUid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only create orders for your own account.'
      );
    }

    // ── 3. Fetch products and validate stock ──
    const productRefs = parsed.items.map((item) =>
      db.collection('products').doc(item.productId)
    );

    const productDocs = await db.getAll(...productRefs);
    const products: ProductSnapshot[] = [];

    for (let i = 0; i < parsed.items.length; i++) {
      const item = parsed.items[i];
      const doc = productDocs[i];

      if (!doc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          `Product not found: ${item.productId}`
        );
      }

      const productData = doc.data() as ProductSnapshot;

      if (productData.status !== 'published') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Product is not available: ${productData.name}`
        );
      }

      if (productData.stock < item.quantity) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Insufficient stock for "${productData.name}". Available: ${productData.stock}, requested: ${item.quantity}.`
        );
      }

      products.push({ ...productData, id: doc.id });
    }

    // ── 4. Calculate subtotal (authoritative) ──
    let subtotal = 0;
    const orderItems = parsed.items.map((item, i) => {
      const product = products[i];
      const unitPrice = effectivePrice(product);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: product.images[0]?.url ?? '',
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        selectedVariants: item.selectedVariants,
        categorySlug: product.categorySlug,
      };
    });

    // ── 5. Validate coupon (if provided) ──
    let discount = 0;
    let couponSnapshot: CouponSnapshot | null = null;
    let couponRef: FirebaseFirestore.DocumentReference | null = null;

    if (parsed.couponCode) {
      const couponQuery = await db
        .collection('coupons')
        .where('code', '==', parsed.couponCode.toUpperCase())
        .limit(1)
        .get();

      if (couponQuery.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'Invalid coupon code.'
        );
      }

      const couponDoc = couponQuery.docs[0];
      couponSnapshot = { ...couponDoc.data(), id: couponDoc.id } as CouponSnapshot;
      couponRef = couponDoc.ref;

      if (!couponSnapshot.isActive) {
        throw new functions.https.HttpsError('failed-precondition', 'This coupon is no longer active.');
      }

      const now = new Date();
      if (couponSnapshot.expiryDate.toDate() < now) {
        throw new functions.https.HttpsError('failed-precondition', 'This coupon has expired.');
      }

      if (subtotal < couponSnapshot.minOrderAmount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Minimum order amount for this coupon is ৳${couponSnapshot.minOrderAmount}.`
        );
      }

      if (couponSnapshot.maxUsage !== null && couponSnapshot.usageCount >= couponSnapshot.maxUsage) {
        throw new functions.https.HttpsError('failed-precondition', 'This coupon has reached its usage limit.');
      }

      if (couponSnapshot.discountType === 'percentage') {
        discount = Math.round((subtotal * couponSnapshot.discountValue) / 100);
      } else {
        discount = Math.min(couponSnapshot.discountValue, subtotal);
      }
    }

    // ── 6. Fetch delivery fee from deliveryZones ──
    const district = parsed.shippingAddress.district.trim().toLowerCase();
    const zoneQuery = await db
      .collection('deliveryZones')
      .where('district', '==', district)
      .limit(1)
      .get();

    let deliveryFee = 120; // Default delivery fee in BDT
    let estimatedDays = '3-5 business days';
    let deliveryZoneId: string | null = null;

    if (!zoneQuery.empty) {
      const zoneDoc = zoneQuery.docs[0];
      const zone = zoneDoc.data() as DeliveryZoneSnapshot;
      deliveryFee = zone.fee;
      estimatedDays = zone.estimatedDays;
      deliveryZoneId = zoneDoc.id;
    } else {
      functions.logger.warn('createOrder: no delivery zone found for district, using default fee', { district });
    }

    // ── 7. Calculate final total ──
    const total = subtotal - discount + deliveryFee;
    const orderReference = generateOrderReference();

    // ── 8. Firestore transaction ──
    let newOrderId: string;

    try {
      const orderRef = db.collection('orders').doc(); // Pre-generate ID
      newOrderId = orderRef.id;

      await db.runTransaction(async (transaction) => {
        // Re-read products inside transaction to get latest stock (optimistic concurrency)
        for (let i = 0; i < parsed.items.length; i++) {
          const item = parsed.items[i];
          const productRef = db.collection('products').doc(item.productId);
          const freshProductDoc = await transaction.get(productRef);

          if (!freshProductDoc.exists) {
            throw new Error(`Product disappeared during checkout: ${item.productId}`);
          }

          const freshData = freshProductDoc.data() as ProductSnapshot;

          if (freshData.stock < item.quantity) {
            throw new Error(
              `STOCK_INSUFFICIENT:${item.productId}:${freshData.stock}:${item.quantity}`
            );
          }

          // Decrement stock
          transaction.update(productRef, {
            stock: FieldValue.increment(-item.quantity),
          });
        }

        // Increment coupon usage if applicable
        if (couponRef && couponSnapshot) {
          transaction.update(couponRef, {
            usageCount: FieldValue.increment(1),
          });
        }

        // Create the order document
        transaction.set(orderRef, {
          orderReference,
          userId: callerUid,
          items: orderItems,
          shippingAddress: parsed.shippingAddress,
          pricing: {
            subtotal,
            discount,
            deliveryFee,
            total,
          },
          coupon: couponSnapshot
            ? {
                code: couponSnapshot.code,
                discountType: couponSnapshot.discountType,
                discountValue: couponSnapshot.discountValue,
                discountAmount: discount,
              }
            : null,
          deliveryZoneId,
          estimatedDays,
          status: 'pending',
          payment: {
            method: parsed.paymentMethod,
            status: 'pending',
            transactionId: null,
            gatewayResponse: null,
          },
          statusHistory: [
            {
              status: 'pending',
              timestamp: FieldValue.serverTimestamp(),
              note: 'Order placed by customer',
            },
          ],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (txError: unknown) {
      const errMsg = txError instanceof Error ? txError.message : String(txError);

      if (errMsg.startsWith('STOCK_INSUFFICIENT:')) {
        const [, productId, available, requested] = errMsg.split(':');
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Stock changed during checkout for product ${productId}. Available: ${available}, requested: ${requested}.`
        );
      }

      functions.logger.error('createOrder: transaction failed', { txError });
      throw new functions.https.HttpsError(
        'internal',
        'Order could not be created. Please try again.'
      );
    }

    // ── 9. Payment initiation (COD is immediate, gateway = stub) ──
    let paymentUrl: string | undefined;

    if (parsed.paymentMethod === 'bkash') {
      // TODO: Integrate bKash PGW — see functions/src/payments/bkash.ts
      // The bKash stub currently returns NOT_IMPLEMENTED.
      // Once integrated, call initiateBkashPayment(newOrderId, total, orderReference)
      // and set paymentUrl to the returned redirect URL.
      functions.logger.info('createOrder: bKash payment stub — NOT_IMPLEMENTED', { orderId: newOrderId });
    } else if (parsed.paymentMethod === 'nagad') {
      // TODO: Integrate Nagad DFS — see functions/src/payments/nagad.ts
      functions.logger.info('createOrder: Nagad payment stub — NOT_IMPLEMENTED', { orderId: newOrderId });
    }

    // ── 10. Write audit log ──
    await writeAuditLog({
      action: 'order_created',
      performedBy: callerUid,
      targetType: 'order',
      targetId: newOrderId,
      metadata: {
        orderReference,
        total,
        paymentMethod: parsed.paymentMethod,
        itemCount: parsed.items.length,
        couponCode: parsed.couponCode ?? null,
      },
    });

    functions.logger.info('createOrder: success', {
      orderId: newOrderId,
      orderReference,
      userId: callerUid,
      total,
    });

    return {
      success: true,
      orderId: newOrderId,
      orderReference,
      paymentUrl,
    };
  });
