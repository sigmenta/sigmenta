// ─── Women's Favorite — Coupon Service ──────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
  increment,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { Coupon } from '@/types';

// ─── Admin Reads ──────────────────────────────────────────────────────────────

/**
 * Admin-only: returns all coupons ordered by creation date.
 */
export async function getCoupons(): Promise<Coupon[]> {
  const ref = collection(db, COLLECTIONS.COUPONS);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => {
    const data = d.data() as Omit<Coupon, 'id'>;
    return { ...data, id: d.id };
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a coupon code against business rules:
 * - Must exist and be active
 * - Must be within valid date range
 * - Order total must meet minimum value
 * - Total usage count must not exceed maxUsageTotal
 * - Per-customer usage must not exceed maxUsagePerCustomer
 *
 * Returns the discount amount in BDT and the coupon document if valid.
 */
export async function validateCoupon(
  code: string,
  orderTotal: number,
  userId: string,
): Promise<{
  valid: boolean;
  discount: number;
  coupon?: Coupon;
  error?: string;
}> {
  if (!code.trim()) {
    return { valid: false, discount: 0, error: 'কুপন কোড দিন।' };
  }

  try {
    const ref = collection(db, COLLECTIONS.COUPONS);
    const q = query(
      ref,
      where('code', '==', code.trim().toUpperCase()),
      firestoreLimit(1),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // No coupon in Firestore — fall through to demo coupon fallback below
      throw Object.assign(new Error('not_found'), { code: 'not_found' });
    }

    const docSnap = snapshot.docs[0]!;
    const coupon: Coupon = { ...docSnap.data() as Omit<Coupon, 'id'>, id: docSnap.id };

    // Active check
    if (!coupon.isActive) {
      return { valid: false, discount: 0, error: 'এই কুপনটি সক্রিয় নেই।' };
    }

    // Safe date-to-millis helper (handles Firestore Timestamp OR plain {seconds} object)
    const toMs = (d: any): number => {
      if (!d) return 0;
      if (typeof d.toMillis === 'function') return d.toMillis();
      if (typeof d.toDate === 'function') return d.toDate().getTime();
      if (typeof d.seconds === 'number') return d.seconds * 1000;
      if (d instanceof Date) return d.getTime();
      return 0;
    };

    const nowMs = Date.now();

    // Date range checks
    const startMs = toMs(coupon.startDate);
    if (startMs && nowMs < startMs) {
      return { valid: false, discount: 0, error: 'এই কুপনটি এখনো শুরু হয়নি।' };
    }
    const expiryMs = toMs(coupon.expiryDate);
    if (expiryMs && nowMs > expiryMs) {
      return { valid: false, discount: 0, error: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।' };
    }

    // Minimum order check
    const minOrder = coupon.minimumOrderValue ?? 0;
    if (orderTotal < minOrder) {
      return {
        valid: false,
        discount: 0,
        error: `কমপক্ষে ৳${minOrder} অর্ডার করতে হবে।`,
      };
    }

    // Total usage check
    if (
      coupon.maxUsageTotal !== undefined &&
      coupon.maxUsageTotal > 0 &&
      coupon.usageCount >= coupon.maxUsageTotal
    ) {
      return {
        valid: false,
        discount: 0,
        error: 'এই কুপনের সর্বোচ্চ ব্যবহার সীমা পূর্ণ হয়ে গেছে।',
      };
    }

    // Per-customer usage check (skip for guests)
    const maxPerCustomer = coupon.maxUsagePerCustomer ?? 0;
    if (userId && userId !== 'guest' && maxPerCustomer > 0) {
      try {
        const usageRef = doc(db, COLLECTIONS.COUPONS, coupon.id, 'usageByUser', userId);
        const usageSnap = await getDoc(usageRef);
        if (usageSnap.exists()) {
          const usageData = usageSnap.data() as { count: number };
          if (usageData.count >= maxPerCustomer) {
            return {
              valid: false,
              discount: 0,
              error: `আপনি এই কুপনটি সর্বোচ্চ ${maxPerCustomer} বার ব্যবহার করতে পারবেন।`,
            };
          }
        }
      } catch {
        // If we can't read usage (e.g. permission denied for guest), skip the per-user check
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
      discount = Math.min(coupon.discountValue, orderTotal);
    }

    return { valid: true, discount, coupon };
  } catch (err: any) {
    // 'not_found' means Firestore had no match — try demo coupons below
    if (err?.code === 'not_found' || err?.code === 'permission-denied') {
      // Fall through to demo coupon fallback
    } else {
      return { valid: false, discount: 0, error: 'কুপন যাচাই করা সম্ভব হয়নি। আবার চেষ্টা করুন।' };
    }
  }

  // ── Demo/fallback coupons (active until real coupons exist in Firestore) ──
  const DEMO_COUPONS = [
    { code: 'WELCOME10', discountType: 'percentage' as const, discountValue: 10, minimumOrderValue: 0 },
    { code: 'SAVE100',   discountType: 'fixed'      as const, discountValue: 100, minimumOrderValue: 500 },
    { code: 'SPECIAL20', discountType: 'percentage' as const, discountValue: 20, minimumOrderValue: 1000 },
    { code: 'WF50',      discountType: 'fixed'      as const, discountValue: 50,  minimumOrderValue: 300 },
  ];
  const demoCoupon = DEMO_COUPONS.find((c) => c.code === code.trim().toUpperCase());
  if (demoCoupon) {
    if (orderTotal < demoCoupon.minimumOrderValue) {
      return { valid: false, discount: 0, error: `কমপক্ষে ৳${demoCoupon.minimumOrderValue} অর্ডার করতে হবে।` };
    }
    let discount = 0;
    if (demoCoupon.discountType === 'percentage') {
      discount = Math.round((orderTotal * demoCoupon.discountValue) / 100);
    } else {
      discount = Math.min(demoCoupon.discountValue, orderTotal);
    }
    return { valid: true, discount, coupon: undefined };
  }

  return { valid: false, discount: 0, error: 'কুপন কোডটি সঠিক নয়।' };
}

// ─── Admin Writes ─────────────────────────────────────────────────────────────

export async function createCoupon(
  data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
): Promise<string> {
  const ref = collection(db, COLLECTIONS.COUPONS);
  const docRef = await addDoc(ref, {
    ...data,
    code: data.code.trim().toUpperCase(),
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCoupon(
  id: string,
  data: Partial<Coupon>,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.COUPONS, id);
  // Normalise the code if it's being updated
  const payload = data.code
    ? { ...data, code: data.code.trim().toUpperCase() }
    : data;
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.COUPONS, id);
  await deleteDoc(ref);
}

/**
 * Atomically increments the coupon's global usageCount and records
 * per-user usage in the `usageByUser` sub-collection.
 *
 * This should be called from the order creation Cloud Function rather than
 * directly from the client to ensure atomicity with the order write.
 */
export async function incrementCouponUsage(
  couponId: string,
  userId: string,
): Promise<void> {
  const couponRef = doc(db, COLLECTIONS.COUPONS, couponId);
  await updateDoc(couponRef, {
    usageCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // Track per-user usage in a sub-collection
  const userUsageRef = doc(
    db,
    COLLECTIONS.COUPONS,
    couponId,
    'usageByUser',
    userId,
  );
  const usageSnap = await getDoc(userUsageRef);
  if (usageSnap.exists()) {
    await updateDoc(userUsageRef, { count: increment(1) });
  } else {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(userUsageRef, { userId, count: 1 });
  }
}

export const couponService = {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  incrementCouponUsage,
};

export default couponService;
