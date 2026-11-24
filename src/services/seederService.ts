import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS, USER_ROLES } from '@/constants';
import { SAMPLE_BANNERS, SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from '@/constants/sampleData';
import type { DeliveryZone, SiteSettings } from '@/types';

export const seederService = {
  /**
   * Checks if Firestore is reachable and empty
   */
  async checkDatabaseStatus(): Promise<{ connected: boolean; hasData: boolean; productCount: number }> {
    if (!isFirebaseConfigured) {
      return { connected: false, hasData: false, productCount: 0 };
    }
    try {
      const q = query(collection(db, COLLECTIONS.PRODUCTS), limit(10));
      const snap = await getDocs(q);
      return {
        connected: true,
        hasData: !snap.empty,
        productCount: snap.size,
      };
    } catch (err) {
      console.error('[Seeder] Check failed:', err);
      return { connected: false, hasData: false, productCount: 0 };
    }
  },

  /**
   * Seeds default Categories, Products, Banners, Settings and Delivery Zones into Firestore
   */
  async seedInitialData(): Promise<{ success: boolean; message: string; count: number }> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase কনফিগার করা নেই। অনুগ্রহ করে .env ফাইল চেক করুন।');
    }

    let count = 0;

    // 1. Seed Categories — delete ALL old ones first, then add new
    // Step 1a: Delete all existing Firestore categories
    const existingCatsSnap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
    for (const existingDoc of existingCatsSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, existingDoc.id));
    }
    // Step 1b: Clear localStorage category cache so new ones show immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wf_custom_categories');
    }
    // Step 1c: Add new Sigmenta categories
    for (const cat of SAMPLE_CATEGORIES) {
      const catRef = doc(db, COLLECTIONS.CATEGORIES, cat.id || cat.slug);
      await setDoc(catRef, {
        ...cat,
        id: catRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    // Fire event so any open page reloads categories instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wf_categories_updated'));
    }

    // 2. Seed Products — delete legacy skincare/makeup products first
    const existingProdsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    for (const pDoc of existingProdsSnap.docs) {
      const data = pDoc.data();
      if (data.categorySlug === 'skincare' || data.categorySlug === 'makeup' || pDoc.id === 'prod-1' || data.slug?.includes('rose-glow')) {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, pDoc.id));
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wf_custom_products');
    }
    for (const prod of SAMPLE_PRODUCTS) {
      const prodRef = doc(db, COLLECTIONS.PRODUCTS, prod.id || prod.slug);
      await setDoc(prodRef, {
        ...prod,
        id: prodRef.id,
        status: 'published',
        stockStatus: 'in_stock',
        stockQuantity: 50,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      count++;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wf_products_updated'));
    }


    // 3. Seed Banners — delete old ones first, then add new
    const existingBannersSnap = await getDocs(collection(db, COLLECTIONS.BANNERS));
    for (const existingDoc of existingBannersSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.BANNERS, existingDoc.id));
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wf_custom_banners');
    }
    for (const banner of SAMPLE_BANNERS) {
      const bannerRef = doc(db, COLLECTIONS.BANNERS, banner.id);
      await setDoc(bannerRef, {
        ...banner,
        id: bannerRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wf_banners_updated'));
    }


    // 4. Seed Global Site Settings
    const settingsRef = doc(db, COLLECTIONS.SITE_SETTINGS, 'global');
    const defaultSettings: Partial<SiteSettings> = {
      siteName: 'Sigmenta',
      siteNameBn: 'সিগমেন্টা',
      tagline: 'Wear Your Style',
      taglineBn: 'ওয়্যার ইয়োর স্টাইল',
      logoUrl: '/logo.png',
      contactEmail: 'support@sigmenta.com',
      contactPhone: '+880 1620605353',
      freeDeliveryThreshold: 3000,
      theme: 'unisex',
      announcementBar: {
        isActive: true,
        textBn: '⚡ সিগমেন্টা (Sigmenta™) তে স্বাগতম! সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি। ৩,০০০+ টাকার অর্ডারে ফ্রি ডেলিভারি!',
        textEn: "Welcome to Sigmenta™ — Wear Your Style! Free delivery on orders over ৳3,000 across Bangladesh!",
        backgroundColor: '#0F172A',
        textColor: '#FFFFFF',
      },
      paymentMethods: {
        cod: { isEnabled: true, displayName: 'ক্যাশ অন ডেলিভারি (COD)' },
        bkash: { isEnabled: true, displayName: 'বিকাশ (bKash)' },
        nagad: { isEnabled: true, displayName: 'নগদ (Nagad)' },
      },
    };
    await setDoc(settingsRef, {
      ...defaultSettings,
      updatedAt: serverTimestamp(),
      updatedBy: 'system_seeder',
    }, { merge: true });
    count++;

    // 5. Seed Delivery Zones
    const zones: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        nameBn: 'ঢাকা সিটির ভেতরে',
        nameEn: 'Inside Dhaka',
        districts: ['ঢাকা'],
        deliveryFee: 60,
        estimatedDays: '১-২ কার্যদিবস',
        isActive: true,
        sortOrder: 1,
      },
      {
        nameBn: 'ঢাকার বাইরে সমগ্র বাংলাদেশ',
        nameEn: 'Outside Dhaka',
        districts: [
          'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ', 'গাজীপুর', 'নারায়ণগঞ্জ',
          'কুমিল্লা', 'বগুড়া', 'যশোর', 'দিনাজপুর', 'পাবনা', 'ফরিদপুর', 'টাঙ্গাইল', 'কক্সবাজার'
        ],
        deliveryFee: 120,
        estimatedDays: '২-৪ কার্যদিবস',
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const zone of zones) {
      const zoneId = zone.deliveryFee === 60 ? 'zone-dhaka' : 'zone-outside-dhaka';
      const zoneRef = doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId);
      await setDoc(zoneRef, {
        ...zone,
        id: zoneId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      count++;
    }

    return {
      success: true,
      message: `মোট ${count}টি ডাটা (ক্যাটাগরি, প্রোডাক্ট, ব্যানার, ডেলিভারি জোন ও সেটিংস) ফায়ারস্টোরে সফলভাবে সংরক্ষিত হয়েছে!`,
      count,
    };
  },

  /**
   * Creates or ensures a Super Admin profile exists for a specific UID
   */
  async ensureAdminUser(uid: string, email: string, displayName = 'অ্যাডমিন'): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      displayNameBn: displayName,
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true,
      addresses: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
};
