// ─── Women's Favorite — Settings Service ────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type {
  SiteSettings,
  LegalPage,
  LegalPageKey,
  DeliveryZone,
} from '@/types';

const DEFAULT_SETTINGS: SiteSettings = {
  id: 'global',
  siteName: 'Sigmenta',
  siteNameBn: 'সিগমেন্টা',
  tagline: 'Wear Your Style',
  taglineBn: 'ওয়্যার ইয়োর স্টাইল',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.svg',
  contactEmail: 'support@sigmenta.com',
  contactPhone: '+880 1620605353',
  theme: 'unisex',
  socialMedia: {
    facebook: 'https://www.facebook.com/profile.php?id=61595742368303',
    instagram: 'https://instagram.com/sigmenta.bd',
  },
  paymentMethods: {
    cod: { isEnabled: true, displayName: 'ক্যাশ অন ডেলিভারি (COD)' },
    bkash: { isEnabled: true, displayName: 'বিকাশ (bKash)' },
    nagad: { isEnabled: true, displayName: 'নগদ (Nagad)' },
  },
  announcementBar: {
    isActive: true,
    textBn: '⚡ সিগমেন্টা (Sigmenta™) তে স্বাগতম! সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি। ৩,০০০+ টাকার অর্ডারে ফ্রি ডেলিভারি!',
    textEn: "Welcome to Sigmenta™ — Wear Your Style! Free delivery on orders over ৳3,000 across Bangladesh!",
    backgroundColor: '#0F172A',
    textColor: '#FFFFFF',
  },
  freeDeliveryThreshold: 3000,
  deliveryFeeDhaka: 70,
  deliveryFeeOutsideDhaka: 120,
  maintenanceMode: false,
  updatedAt: {} as any,
  updatedBy: 'system',
};

export function sanitizeSettings(settings: SiteSettings): SiteSettings {
  if (!settings) return DEFAULT_SETTINGS;

  const cleaned: SiteSettings = {
    ...settings,
    siteName: (settings.siteName && !settings.siteName.toLowerCase().includes('women')) ? settings.siteName : DEFAULT_SETTINGS.siteName,
    siteNameBn: (settings.siteNameBn && !settings.siteNameBn.includes('উইমেন্স')) ? settings.siteNameBn : DEFAULT_SETTINGS.siteNameBn,
    tagline: (settings.tagline && !settings.tagline.toLowerCase().includes('bangladesh premium') && !settings.tagline.toLowerCase().includes('women')) ? settings.tagline : DEFAULT_SETTINGS.tagline,
    taglineBn: (settings.taglineBn && !settings.taglineBn.includes('উইমেন')) ? settings.taglineBn : DEFAULT_SETTINGS.taglineBn,
    logoUrl: settings.logoUrl || DEFAULT_SETTINGS.logoUrl,
    announcementBar: {
      ...settings.announcementBar,
      isActive: settings.announcementBar?.isActive ?? (DEFAULT_SETTINGS.announcementBar?.isActive ?? true),
      textBn: (settings.announcementBar?.textBn && !settings.announcementBar.textBn.includes('উইমেন্স') && !settings.announcementBar.textBn.includes('Women'))
        ? settings.announcementBar.textBn
        : (DEFAULT_SETTINGS.announcementBar?.textBn || '⚡ সিগমেন্টা (Sigmenta™) তে স্বাগতম! সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি। ৩,০০০+ টাকার অর্ডারে ফ্রি ডেলিভারি!'),
      textEn: (settings.announcementBar?.textEn && !settings.announcementBar.textEn.toLowerCase().includes('women'))
        ? settings.announcementBar.textEn
        : (DEFAULT_SETTINGS.announcementBar?.textEn || "Welcome to Sigmenta™ — Wear Your Style! Free delivery on orders over ৳3,000 across Bangladesh!"),
      backgroundColor: (settings.announcementBar?.backgroundColor && settings.announcementBar.backgroundColor !== '#D45D83' && settings.announcementBar.backgroundColor !== '#d45d83')
        ? settings.announcementBar.backgroundColor
        : '#0F172A',
      textColor: settings.announcementBar?.textColor || '#FFFFFF',
    },
  };

  return cleaned;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

const LOCAL_SETTINGS_KEY = 'wf_site_settings';

export function getLocalSettings(): SiteSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: Partial<SiteSettings>): SiteSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const current = getLocalSettings();
    const updated = sanitizeSettings({ ...current, ...settings });
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('wf_settings_updated'));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Fetches the global site settings document (id='global').
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const local = getLocalSettings();

  if (!isFirebaseConfigured) return local;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 1500)
    );
    const ref = doc(db, COLLECTIONS.SITE_SETTINGS, 'global');
    const snapshot = await Promise.race([getDoc(ref), timeoutPromise]);
    if (!snapshot.exists()) return local;
    const fsData = snapshot.data() as SiteSettings;
    const sanitized = sanitizeSettings({ ...local, ...fsData });
    saveLocalSettings(sanitized);

    // If Firestore had stale legacy data, update Firestore in the background
    const rawSiteName = fsData.siteName || '';
    const rawTextBn = fsData.announcementBar?.textBn || '';
    if (rawSiteName.toLowerCase().includes('women') || rawTextBn.includes('উইমেন্স')) {
      setDoc(ref, sanitized, { merge: true }).catch(() => {});
    }

    return sanitized;
  } catch {
    return local;
  }
}

/**
 * Admin-only: partially updates site settings.
 * adminUid is stored as updatedBy for audit purposes.
 */
export async function updateSiteSettings(
  data: Partial<SiteSettings>,
  adminUid: string,
): Promise<void> {
  // Update local cache immediately for instant UI responsiveness
  saveLocalSettings(data);

  if (!isFirebaseConfigured) return;

  const ref = doc(db, COLLECTIONS.SITE_SETTINGS, 'global');
  await setDoc(
    ref,
    {
      ...data,
      id: 'global',
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    },
    { merge: true },
  );
}

/**
 * Returns the current inside Dhaka & outside Dhaka delivery fees.
 * Always returns valid numbers with sensible defaults (Dhaka: 70, Outside: 120).
 */
export function getDeliveryFees(): { dhaka: number; outsideDhaka: number } {
  const settings = getLocalSettings();
  const dhaka = typeof settings.deliveryFeeDhaka === 'number' && settings.deliveryFeeDhaka >= 0
    ? settings.deliveryFeeDhaka
    : 70;
  const outsideDhaka = typeof settings.deliveryFeeOutsideDhaka === 'number' && settings.deliveryFeeOutsideDhaka >= 0
    ? settings.deliveryFeeOutsideDhaka
    : 120;
  return { dhaka, outsideDhaka };
}

/**
 * 1-Click Update for Delivery Fees:
 * Updates siteSettings/global and synchronizes standard delivery zones across the whole system.
 */
export async function updateSimpleDeliveryFees(
  dhakaFee: number,
  outsideDhakaFee: number,
  adminUid: string = 'admin',
): Promise<void> {
  const dFee = Math.max(0, Number(dhakaFee) || 0);
  const outFee = Math.max(0, Number(outsideDhakaFee) || 0);

  // 1. Immediately update localStorage and broadcast event
  saveLocalSettings({
    deliveryFeeDhaka: dFee,
    deliveryFeeOutsideDhaka: outFee,
  });

  if (!isFirebaseConfigured) return;

  // 2. Persist to Firestore siteSettings/global
  const settingsRef = doc(db, COLLECTIONS.SITE_SETTINGS, 'global');
  await setDoc(
    settingsRef,
    {
      id: 'global',
      deliveryFeeDhaka: dFee,
      deliveryFeeOutsideDhaka: outFee,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    },
    { merge: true },
  );

  // 3. Keep default delivery zones in sync
  try {
    const dhakaZoneRef = doc(db, COLLECTIONS.DELIVERY_ZONES, 'zone-dhaka');
    await setDoc(
      dhakaZoneRef,
      {
        id: 'zone-dhaka',
        nameBn: 'ঢাকা সিটির ভেতরে',
        nameEn: 'Inside Dhaka City',
        districts: ['ঢাকা'],
        deliveryFee: dFee,
        estimatedDays: '১-২ দিন',
        isActive: true,
        sortOrder: 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const outsideZoneRef = doc(db, COLLECTIONS.DELIVERY_ZONES, 'zone-bd');
    await setDoc(
      outsideZoneRef,
      {
        id: 'zone-bd',
        nameBn: 'ঢাকার বাইরে সারাদেশে',
        nameEn: 'Outside Dhaka',
        districts: [],
        deliveryFee: outFee,
        estimatedDays: '২-৪ দিন',
        isActive: true,
        sortOrder: 2,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('Syncing delivery zones docs failed, siteSettings was updated:', err);
  }
}

// ─── Legal Pages ──────────────────────────────────────────────────────────────

/**
 * Fetches a legal page document by its key (e.g. 'privacy-policy').
 * Each legal page has a document ID matching its LegalPageKey.
 */
export async function getLegalPage(
  key: LegalPageKey,
): Promise<LegalPage | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const ref = doc(db, COLLECTIONS.LEGAL_PAGES, key);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 4000)
    );
    const snapshot = await Promise.race([getDoc(ref), timeoutPromise]);
    if (!snapshot.exists()) return null;
    return snapshot.data() as LegalPage;
  } catch {
    // Timeout or permission error — return null so fallback content shows
    return null;
  }
}

/**
 * Admin-only: creates or updates a legal page.
 * Uses setDoc (merge:true) so the document is created if it doesn't exist.
 */
export async function updateLegalPage(
  key: LegalPageKey,
  data: Partial<LegalPage>,
  adminUid: string,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.LEGAL_PAGES, key);
  await setDoc(
    ref,
    {
      ...data,
      id: key,
      lastUpdated: serverTimestamp(),
      updatedBy: adminUid,
    },
    { merge: true },
  );
}

const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'zone-dhaka',
    nameBn: 'ঢাকা সিটির ভেতরে',
    nameEn: 'Inside Dhaka City',
    districts: ['ঢাকা'],
    deliveryFee: 60,
    estimatedDays: '১-২ দিন',
    isActive: true,
    sortOrder: 1,
    createdAt: {} as any,
    updatedAt: {} as any,
  },
  {
    id: 'zone-suburb',
    nameBn: 'ঢাকা উপশহর ও চট্টগ্রাম',
    nameEn: 'Dhaka Suburbs & Chittagong',
    districts: ['গাজীপুর', 'নারায়ণগঞ্জ', 'চট্টগ্রাম'],
    deliveryFee: 100,
    estimatedDays: '২-৩ দিন',
    isActive: true,
    sortOrder: 2,
    createdAt: {} as any,
    updatedAt: {} as any,
  },
  {
    id: 'zone-bd',
    nameBn: 'সারাদেশের যেকোনো জেলা',
    nameEn: 'All Other Districts',
    districts: [],
    deliveryFee: 130,
    estimatedDays: '৩-৫ দিন',
    isActive: true,
    sortOrder: 3,
    createdAt: {} as any,
    updatedAt: {} as any,
  },
];

// ─── Delivery Zones ───────────────────────────────────────────────────────────

/**
 * Returns all delivery zones ordered by sortOrder.
 * @param activeOnly - When true, only returns zones where isActive === true.
 */
export async function getDeliveryZones(
  activeOnly: boolean = false,
): Promise<DeliveryZone[]> {
  if (!isFirebaseConfigured) return DEFAULT_ZONES;
  const ref = collection(db, COLLECTIONS.DELIVERY_ZONES);
  const constraints: QueryConstraint[] = [];

  if (activeOnly) {
    constraints.push(where('isActive', '==', true));
  }
  constraints.push(orderBy('sortOrder', 'asc'));

  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...(d.data() as Omit<DeliveryZone, 'id'>),
    id: d.id,
  }));
}

/**
 * Creates a new delivery zone and returns its Firestore document ID.
 */
export async function createDeliveryZone(
  data: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = collection(db, COLLECTIONS.DELIVERY_ZONES);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Partially updates an existing delivery zone.
 */
export async function updateDeliveryZone(
  id: string,
  data: Partial<DeliveryZone>,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.DELIVERY_ZONES, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Returns the delivery zone that covers a given district name.
 * Zones store an array of district strings; this queries using 'array-contains'.
 * Returns null if no zone covers the district.
 */
export async function getDeliveryZoneForDistrict(
  district: string,
): Promise<DeliveryZone | null> {
  const fees = getDeliveryFees();
  const isDhaka = district === 'ঢাকা' || district?.trim()?.toLowerCase() === 'dhaka';

  if (!isFirebaseConfigured) {
    return {
      id: isDhaka ? 'zone-dhaka' : 'zone-bd',
      nameBn: isDhaka ? 'ঢাকা সিটির ভেতরে' : 'ঢাকার বাইরে সারাদেশে',
      nameEn: isDhaka ? 'Inside Dhaka City' : 'Outside Dhaka',
      districts: isDhaka ? ['ঢাকা'] : [],
      deliveryFee: isDhaka ? fees.dhaka : fees.outsideDhaka,
      estimatedDays: isDhaka ? '১-২ দিন' : '২-৪ দিন',
      isActive: true,
      sortOrder: isDhaka ? 1 : 2,
      createdAt: {} as any,
      updatedAt: {} as any,
    };
  }

  try {
    const ref = collection(db, COLLECTIONS.DELIVERY_ZONES);
    const q = query(
      ref,
      where('isActive', '==', true),
      where('districts', 'array-contains', district),
      firestoreLimit(1),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0]!;
      const zoneData = d.data() as DeliveryZone;
      // If it's Dhaka zone, ensure current dhakaFee is used
      if (isDhaka) {
        return { ...zoneData, id: d.id, deliveryFee: fees.dhaka };
      }
      return { ...zoneData, id: d.id };
    }
  } catch {
    // fallback
  }

  return {
    id: isDhaka ? 'zone-dhaka' : 'zone-bd',
    nameBn: isDhaka ? 'ঢাকা সিটির ভেতরে' : 'ঢাকার বাইরে সারাদেশে',
    nameEn: isDhaka ? 'Inside Dhaka City' : 'Outside Dhaka',
    districts: isDhaka ? ['ঢাকা'] : [],
    deliveryFee: isDhaka ? fees.dhaka : fees.outsideDhaka,
    estimatedDays: isDhaka ? '১-২ দিন' : '২-৪ দিন',
    isActive: true,
    sortOrder: isDhaka ? 1 : 2,
    createdAt: {} as any,
    updatedAt: {} as any,
  };
}

export const settingsService = {
  getSiteSettings,
  updateSiteSettings,
  getDeliveryFees,
  updateSimpleDeliveryFees,
  getLegalPage,
  updateLegalPage,
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  getDeliveryZoneForDistrict,
};

export default settingsService;
