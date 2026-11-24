// ─── Admin Services Bundle ────────────────────────────────────────────────────
// Coupon, Review, Banner, Delivery Zone, Site Settings, Legal Page,
// Payment Transaction, Customer services — all Firestore-backed.

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch, arrayUnion, Timestamp,
} from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type {
  Coupon, Review, ReviewStatus, Banner, DeliveryZone,
  SiteSettings, LegalPage, LegalPageKey, PaymentTransaction,
  CustomerSummary,
} from '@/types';

/* ══════════════════════════════════════════════════════════
   COUPON SERVICE
══════════════════════════════════════════════════════════ */
export const couponService = {
  async getAll(): Promise<Coupon[]> {
    const q = query(collection(db, COLLECTIONS.COUPONS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
  },

  async create(data: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTIONS.COUPONS), {
      ...data,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Coupon, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.COUPONS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.COUPONS, id));
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.COUPONS, id), { isActive, updatedAt: serverTimestamp() });
  },
};

/* ══════════════════════════════════════════════════════════
   REVIEW SERVICE
══════════════════════════════════════════════════════════ */
export const reviewService = {
  async getAll(status?: ReviewStatus): Promise<Review[]> {
    const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc')];
    if (status) constraints.unshift(where('status', '==', status));
    const q = query(collection(db, COLLECTIONS.REVIEWS), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  },

  async updateStatus(id: string, status: ReviewStatus, adminNotes?: string): Promise<void> {
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, id);
    await updateDoc(reviewRef, {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: serverTimestamp(),
    });

    // Recalculate product average rating
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) return;
    const review = { id: reviewSnap.id, ...reviewSnap.data() } as Review;

    const approvedQ = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('productId', '==', review.productId),
      where('status', '==', 'approved')
    );
    const approvedSnap = await getDocs(approvedQ);
    const ratings = approvedSnap.docs.map((d) => (d.data() as Review).rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, review.productId), {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: ratings.length,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.REVIEWS, id));
  },
};

/* ══════════════════════════════════════════════════════════
   BANNER SERVICE
══════════════════════════════════════════════════════════ */
export const bannerService = {
  async getAll(): Promise<Banner[]> {
    const q = query(collection(db, COLLECTIONS.BANNERS), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
  },

  async create(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTIONS.BANNERS), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.BANNERS, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.BANNERS, id));
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, COLLECTIONS.BANNERS, id), { sortOrder: index, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  },
};

/* ══════════════════════════════════════════════════════════
   DELIVERY ZONE SERVICE
══════════════════════════════════════════════════════════ */
export const deliveryZoneService = {
  async getAll(): Promise<DeliveryZone[]> {
    const q = query(collection(db, COLLECTIONS.DELIVERY_ZONES), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryZone));
  },

  async create(data: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTIONS.DELIVERY_ZONES), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<DeliveryZone, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, id));
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, id), { isActive, updatedAt: serverTimestamp() });
  },
};

/* ══════════════════════════════════════════════════════════
   SITE SETTINGS SERVICE
══════════════════════════════════════════════════════════ */
export const settingsService = {
  async get(): Promise<SiteSettings | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'global'));
    if (!snap.exists()) return null;
    return snap.data() as SiteSettings;
  },

  async update(data: Partial<Omit<SiteSettings, 'id'>>, updatedBy: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.SITE_SETTINGS, 'global');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp(), updatedBy });
    } else {
      await setDoc(ref, { id: 'global', ...data, updatedAt: serverTimestamp(), updatedBy });
    }
  },
};

/* ══════════════════════════════════════════════════════════
   LEGAL PAGE SERVICE
══════════════════════════════════════════════════════════ */
export const legalPageService = {
  async get(key: LegalPageKey): Promise<LegalPage | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.LEGAL_PAGES, key));
    if (!snap.exists()) return null;
    return snap.data() as LegalPage;
  },

  async save(
    key: LegalPageKey,
    data: { titleBn: string; titleEn?: string; contentBn: string; contentEn?: string },
    updatedBy: string
  ): Promise<void> {
    const sanitized = {
      ...data,
      contentBn: DOMPurify.sanitize(data.contentBn),
      contentEn: data.contentEn ? DOMPurify.sanitize(data.contentEn) : undefined,
    };
    const ref = doc(db, COLLECTIONS.LEGAL_PAGES, key);
    await setDoc(ref, {
      id: key,
      ...sanitized,
      lastUpdated: serverTimestamp(),
      updatedBy,
    });
  },
};

/* ══════════════════════════════════════════════════════════
   PAYMENT TRANSACTION SERVICE
══════════════════════════════════════════════════════════ */
export const paymentTransactionService = {
  async getAll(pageSize = 20): Promise<PaymentTransaction[]> {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS),
      orderBy('initiatedAt', 'desc'),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentTransaction));
  },
};

/* ══════════════════════════════════════════════════════════
   CUSTOMER SERVICE
══════════════════════════════════════════════════════════ */
export const customerService = {
  async getAll(): Promise<CustomerSummary[]> {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'customer'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        phoneNumber: data.phoneNumber,
        role: data.role,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
      } as CustomerSummary;
    });
  },

  async toggleActive(uid: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },
};

/* ══════════════════════════════════════════════════════════
   ADMIN USER SERVICE (for roles page)
══════════════════════════════════════════════════════════ */
export const adminUserService = {
  async getAdmins(): Promise<CustomerSummary[]> {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', 'in', ['admin', 'super_admin']),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        role: data.role,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
      } as CustomerSummary & { lastLoginAt?: Timestamp };
    });
  },
};
