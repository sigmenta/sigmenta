// ─── Women's Favorite — Banner Service ──────────────────────────────────────

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import { SAMPLE_BANNERS } from '@/constants/sampleData';
import type { Banner, BannerPosition } from '@/types';

const LOCAL_BANNERS_KEY = 'wf_custom_banners';

export function sanitizeBanner(b: Banner): Banner {
  const sanitize = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/উইমেন্স ফেভারিট/gi, 'সিগমেন্টা (Sigmenta™)')
      .replace(/উইমেনস ফেভারিট/gi, 'সিগমেন্টা (Sigmenta™)')
      .replace(/প্রিমিয়াম উইমেনস ফ্যাশন কালেকশন/gi, 'সিগমেন্টা প্রিমিয়াম কালেকশন — Wear Your Style')
      .replace(/উইমেনস ফ্যাশন/gi, 'সিগমেন্টা ফ্যাশন')
      .replace(/উইমেনস/gi, 'সিগমেন্টা')
      .replace(/উইমেন্স/gi, 'সিগমেন্টা')
      .replace(/Women's Favorite/gi, 'Sigmenta™')
      .replace(/Womens Favorite/gi, 'Sigmenta™')
      .replace(/Premium Women Fashion Collection/gi, 'Sigmenta Premium Collection — Wear Your Style')
      .replace(/Women Fashion/gi, 'Streetwear & Apparel')
      .replace(/Women/gi, 'Unisex');
  };

  return {
    ...b,
    titleBn: sanitize(b.titleBn) || b.titleBn,
    titleEn: sanitize((b as any).titleEn) || (b as any).titleEn,
    subtitleBn: sanitize(b.subtitleBn) || b.subtitleBn,
  };
}

export function getLocalBanners(): Banner[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_BANNERS_KEY);
    if (!raw) {
      const initial = SAMPLE_BANNERS.map(sanitizeBanner);
      localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = (JSON.parse(raw) as Banner[]).map(sanitizeBanner);
    if (!parsed.some((b) => b.id === 'banner-sigmenta-poster')) {
      const poster = SAMPLE_BANNERS.find((b) => b.id === 'banner-sigmenta-poster');
      if (poster) {
        parsed.unshift(poster);
        localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch {
    return [];
  }
}


function saveLocalBanner(banner: Banner): void {
  try {
    if (typeof window === 'undefined') return;
    const clean = sanitizeBanner(banner);
    const existing = getLocalBanners().filter((b) => b.id !== clean.id);
    existing.unshift(clean);
    localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('wf_banners_updated'));
  } catch (e) {}
}

function deleteLocalBanner(id: string): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalBanners().filter((b) => b.id !== id);
    localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('wf_banners_updated'));
  } catch (e) {}
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getBanners(
  position?: BannerPosition,
  activeOnly: boolean = false,
): Promise<Banner[]> {
  // Always fetch from Firestore first for real-time admin updates
  if (isFirebaseConfigured) {
    try {
      const ref = collection(db, COLLECTIONS.BANNERS);
      const constraints: QueryConstraint[] = [];
      if (position) constraints.push(where('position', '==', position));
      if (activeOnly) constraints.push(where('isActive', '==', true));
      constraints.push(orderBy('sortOrder', 'asc'));
      const q = query(ref, ...constraints);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      );
      const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
      if (!snapshot.empty) {
        const firestoreBanners: Banner[] = snapshot.docs.map((d) => 
          sanitizeBanner({
            ...(d.data() as Omit<Banner, 'id'>),
            id: d.id,
          })
        );
        firestoreBanners.forEach((b) => saveLocalBanner(b));
        return firestoreBanners;
      }
    } catch {
      // Fall back to local cache
    }
  }
  // Offline fallback
  let result = getLocalBanners().map(sanitizeBanner);
  if (position) result = result.filter((b) => b.position === position);
  if (activeOnly) result = result.filter((b) => b.isActive);
  return result;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createBanner(
  data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const localId = `wf-ban-${Date.now()}`;
  const cleanData: Record<string, any> = {};
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) cleanData[key] = val;
  });

  const newBanner: Banner = {
    id: localId,
    ...data,
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
  };

  // Must be authenticated to write to Firestore
  if (!isFirebaseConfigured || !auth.currentUser) {
    throw new Error('NOT_AUTHENTICATED');
  }

  saveLocalBanner(newBanner);

  try {
    const ref = collection(db, COLLECTIONS.BANNERS);
    const fsPromise = addDoc(ref, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    const docRef = await Promise.race([fsPromise, timeoutPromise]);
    if (docRef && docRef.id) {
      deleteLocalBanner(localId);
      saveLocalBanner({ ...newBanner, id: docRef.id });
      return docRef.id;
    }
    return localId;
  } catch (err: any) {
    console.warn('[BannerService] Firestore write failed:', err);
    throw err;
  }
}

export async function updateBanner(
  id: string,
  data: Partial<Banner>,
): Promise<void> {
  const cleanData: Record<string, any> = {};
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) cleanData[key] = val;
  });

  const locals = getLocalBanners();
  const idx = locals.findIndex((b) => b.id === id);
  if (idx >= 0) {
    locals[idx] = {
      ...locals[idx],
      ...cleanData,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };
    localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(locals));
    window.dispatchEvent(new Event('wf_banners_updated'));
  }

  if (isFirebaseConfigured && !id.startsWith('wf-ban-')) {
    try {
      const ref = doc(db, COLLECTIONS.BANNERS, id);
      const updatePromise = updateDoc(ref, {
        ...cleanData,
        updatedAt: serverTimestamp(),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      await Promise.race([updatePromise, timeoutPromise]);
    } catch (err) {
      console.warn('[bannerService] Firestore update skipped or timed out:', err);
    }
  }
}

export async function deleteBanner(id: string): Promise<void> {
  deleteLocalBanner(id);
  if (isFirebaseConfigured && !id.startsWith('wf-ban-')) {
    try {
      const ref = doc(db, COLLECTIONS.BANNERS, id);
      const delPromise = deleteDoc(ref);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      );
      await Promise.race([delPromise, timeoutPromise]);
    } catch (err) {
      console.warn('[bannerService] Firestore delete skipped or timed out:', err);
    }
  }
}

export async function reorderBanners(
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  const locals = getLocalBanners();
  for (const { id, sortOrder } of updates) {
    const item = locals.find((b) => b.id === id);
    if (item) item.sortOrder = sortOrder;
  }
  localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(locals));

  if (isFirebaseConfigured) {
    try {
      const batch = writeBatch(db);
      for (const { id, sortOrder } of updates) {
        if (!id.startsWith('wf-ban-')) {
          const ref = doc(db, COLLECTIONS.BANNERS, id);
          batch.update(ref, { sortOrder, updatedAt: serverTimestamp() });
        }
      }
      await batch.commit();
    } catch (err) {}
  }
}

export const bannerService = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
};

export default bannerService;
