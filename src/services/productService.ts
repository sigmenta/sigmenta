// ─── Product Service ──────────────────────────────────────────────────────────
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, type QueryDocumentSnapshot,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
import type { Product } from '@/types';
import { COLLECTIONS } from '@/constants';
import { SAMPLE_PRODUCTS } from '@/constants/sampleData';

const col = () => collection(db, COLLECTIONS.PRODUCTS);
const LOCAL_PRODUCTS_KEY = 'wf_custom_products';

export function getLocalProducts(): Product[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) {
      const initial = (SAMPLE_PRODUCTS as unknown as Product[]).map((p) => ({
        ...p,
        descriptionBn: p.descriptionBn || 'উচ্চমানের এবং খাঁটি উপাদান দিয়ে তৈরি বিশেষ কালেকশন।',
        descriptionEn: p.descriptionEn || 'Premium collection made with authentic ingredients.',
        specificationsBn: '<p>উৎপাদন: বাংলাদেশ<br/>উপাদান: ১০০% অরিজিনাল</p>',
        stockQuantity: 50,
        stockStatus: 'in_stock' as const,
        status: 'published' as const,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      })) as Product[];
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Product[];
    // Auto-migrate: Purge legacy skincare/makeup products from local cache
    if (parsed.some((p) => p.slug?.includes('rose-glow') || p.categorySlug === 'skincare' || p.categorySlug === 'makeup' || (p as any).id === 'prod-1')) {
      const initial = (SAMPLE_PRODUCTS as unknown as Product[]).map((p) => ({
        ...p,
        descriptionBn: p.descriptionBn || 'সিগমেন্টা প্রিমিয়াম কালেকশন। ১০০% সেরা কোয়ালিটি ফেব্রিক।',
        descriptionEn: p.descriptionEn || 'Sigmenta premium apparel collection. Best quality fabric.',
        specificationsBn: '<p>ব্র্যান্ড: Sigmenta<br/>উপাদান: ১০০% প্রিমিয়াম ফেব্রিক</p>',
        stockQuantity: 50,
        stockStatus: 'in_stock' as const,
        status: 'published' as const,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      })) as Product[];
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return [];
  }
}


export function saveLocalProduct(product: Product): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalProducts().filter((p) => p.id !== product.id && p.slug !== product.slug);
    existing.unshift(product);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(existing));
    _firestoreCache = null; // Invalidate cache so homepage updates instantly
    window.dispatchEvent(new Event('wf_products_updated'));
  } catch (e) {
    console.error('Failed to save product to localStorage:', e);
  }
}

export function deleteLocalProduct(id: string): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalProducts().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(existing));
    _firestoreCache = null; // Invalidate cache so homepage updates instantly
    window.dispatchEvent(new Event('wf_products_updated'));
  } catch (e) {}
}


// ─── In-memory cache to avoid redundant Firestore fetches ─────────────────────
let _firestoreCache: { products: Product[]; ts: number } | null = null;
let _inFlightGetAll: Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot | null }> | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute — shorter TTL so admin updates show up faster

function isCacheValid(): boolean {
  return !!_firestoreCache && Date.now() - _firestoreCache.ts < CACHE_TTL_MS;
}

function invalidateCache(): void {
  _firestoreCache = null;
  _inFlightGetAll = null;
}

async function queryWithTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = cleanUndefined(value);
    }
  }
  return result as T;
}

export const productService = {
  async getById(id: string): Promise<Product | null> {
    if (_firestoreCache && isCacheValid()) {
      const cached = _firestoreCache.products.find((p) => p.id === id);
      if (cached) return cached;
    }
    const local = getLocalProducts().find((p) => p.id === id);
    if (local) return local;

    if (isFirebaseConfigured) {
      try {
        const snap = await queryWithTimeout(getDoc(doc(db, COLLECTIONS.PRODUCTS, id)), 3000);
        if (snap.exists()) {
          const product = { id: snap.id, ...snap.data() } as Product;
          saveLocalProduct(product);
          return product;
        }
      } catch {
        // fallback
      }
    }
    return null;
  },


  /**
   * Fetches all published products. Uses an in-memory cache (1 min TTL)
   * to avoid making duplicate Firestore calls for featured/bestseller/etc.
   */
  async getAll(filters?: {
    status?: string;
    categoryId?: string;
    search?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot;
  }): Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot | null }> {
    const local = getLocalProducts();

    // 1. Return from in-memory cache if valid and not paginating (0ms instant response)
    if (isFirebaseConfigured && isCacheValid() && !filters?.lastDoc) {
      let cached = _firestoreCache!.products;
      if (filters?.status && filters.status !== 'all') {
        cached = cached.filter((p) => p.status === filters.status);
      }
      return { products: cached, lastDoc: null };
    }

    // 2. Deduplicate in-flight requests (prevents concurrent calls from firing duplicate queries)
    if (_inFlightGetAll && !filters?.lastDoc) {
      return _inFlightGetAll;
    }

    const executeFetch = async () => {
      let firestoreProducts: Product[] = [];
      let lastDocResult: QueryDocumentSnapshot | null = null;

      if (isFirebaseConfigured) {
        try {
          let snap;
          try {
            const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc'), limit(filters?.pageSize ?? 60)];
            if (filters?.status && filters.status !== 'all') {
              constraints.unshift(where('status', '==', filters.status));
            }
            if (filters?.lastDoc) constraints.push(startAfter(filters.lastDoc));

            const q = query(col(), ...constraints);
            snap = await queryWithTimeout(getDocs(q), 3000);
          } catch (idxErr) {
            console.warn('[productService] OrderBy query failed, falling back:', idxErr);
            const qFallback = query(col(), limit(filters?.pageSize ?? 60));
            snap = await queryWithTimeout(getDocs(qFallback), 3000);
          }

          if (snap && !snap.empty) {
            firestoreProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
            lastDocResult = snap.docs[snap.docs.length - 1] ?? null;
            firestoreProducts.forEach((p) => saveLocalProduct(p));

            // Store in cache
            if (!filters?.lastDoc) {
              _firestoreCache = { products: firestoreProducts, ts: Date.now() };
            }
          }
        } catch (err) {
          console.warn('[productService] Firestore getAll failed:', err);
        }
      }

      const allProducts = firestoreProducts.length > 0 ? firestoreProducts : local;
      let filtered = allProducts;
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter((p) => p.status === filters.status);
      }
      return { products: filtered, lastDoc: lastDocResult };
    };

    if (!filters?.lastDoc) {
      _inFlightGetAll = executeFetch();
      try {
        return await _inFlightGetAll;
      } finally {
        _inFlightGetAll = null;
      }
    }

    return await executeFetch();
  },

  async searchProducts(queryText: string, limitCount = 8): Promise<Product[]> {
    if (!queryText.trim()) return [];
    const q = queryText.trim().toLowerCase();
    // Use cached data or local products to avoid extra Firestore calls
    const allProducts = isCacheValid()
      ? _firestoreCache!.products
      : (await this.getAll({ status: 'published', pageSize: 100 })).products;

    const scored = allProducts
      .filter((p) => p.status === 'published')
      .map((p) => {
        let score = 0;
        const nameBn = (p.nameBn || '').toLowerCase();
        const nameEn = (p.nameEn || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        if (nameBn === q || nameEn === q) score += 100;
        if (nameBn.startsWith(q) || nameEn.startsWith(q)) score += 50;
        if (nameBn.includes(q)) score += 30;
        if (nameEn.includes(q)) score += 20;
        if (tags.includes(q)) score += 10;
        if (sku.includes(q)) score += 5;
        const words = q.split(/\s+/);
        for (const word of words) {
          if (word.length > 1) {
            if (nameBn.includes(word)) score += 15;
            if (nameEn.includes(word)) score += 10;
          }
        }
        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
    return scored.slice(0, limitCount);
  },

  async getFeaturedProducts(limitCount = 8): Promise<Product[]> {
    const { products } = await this.getAll({ status: 'published', pageSize: 60 });
    const featured = products.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : products).slice(0, limitCount);
  },

  async getBestSellers(limitCount = 8): Promise<Product[]> {
    const { products } = await this.getAll({ status: 'published', pageSize: 60 });
    const best = products.filter((p) => p.isBestSeller);
    return (best.length > 0 ? best : products).slice(0, limitCount);
  },

  async getNewArrivals(limitCount = 8): Promise<Product[]> {
    const { products } = await this.getAll({ status: 'published', pageSize: 60 });
    const newItems = products.filter((p) => p.isNewArrival);
    return (newItems.length > 0 ? newItems : products).slice(0, limitCount);
  },

  async getTrendingProducts(limitCount = 8): Promise<Product[]> {
    const { products } = await this.getAll({ status: 'published', pageSize: 60 });
    const trend = products.filter((p) => p.isTrending);
    return (trend.length > 0 ? trend : products).slice(0, limitCount);
  },

  async getProducts(filters?: any): Promise<{ products: Product[]; total: number }> {
    const res = await this.getAll(filters);
    return { products: res.products, total: res.products.length };
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    // 1. Check in-memory cache first (instant 0ms)
    if (_firestoreCache && isCacheValid()) {
      const cached = _firestoreCache.products.find((p) => p.slug === slug);
      if (cached) return cached;
    }

    // 2. Check local products second (instant 0ms)
    const local = getLocalProducts().find((p) => p.slug === slug);
    if (local) return local;

    // 3. If not found, fetch from Firestore
    if (!isFirebaseConfigured) return null;
    try {
      const q = query(col(), where('slug', '==', slug), limit(1));
      const snap = await queryWithTimeout(getDocs(q), 3000);
      if (!snap.empty) {
        const product = { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
        saveLocalProduct(product);
        return product;
      }
    } catch {
      // fallback
    }
    return null;
  },


  async getProductById(id: string): Promise<Product | null> {
    return this.getById(id);
  },

  async getProductsByCategory(categorySlug: string, limitCount = 12): Promise<Product[]> {
    const { products } = await this.getAll({ status: 'published', pageSize: 60 });
    return products
      .filter((p) => p.categorySlug === categorySlug)
      .slice(0, limitCount);
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const cleaned = cleanUndefined(data);
    const localId = `wf-prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowTimestamp = {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: () => new Date(),
    } as any;

    const newProduct: Product = {
      id: localId,
      ...cleaned,
      primaryImage: (cleaned as any).primaryImage || (cleaned as any).images?.[0]?.url || '',
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    } as Product;

    if (!isFirebaseConfigured || !auth.currentUser) {
      throw new Error('NOT_AUTHENTICATED');
    }

    saveLocalProduct(newProduct);
    invalidateCache();

    try {
      const fsPromise = addDoc(col(), {
        ...cleaned,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );
      const ref = await Promise.race([fsPromise, timeoutPromise]);
      if (ref && ref.id) {
        deleteLocalProduct(localId);
        const synced = { ...newProduct, id: ref.id };
        saveLocalProduct(synced);
        return ref.id;
      }
      deleteLocalProduct(localId);
      throw new Error('FIRESTORE_FAILED');
    } catch (err: any) {
      deleteLocalProduct(localId);
      throw err;
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    // Update local immediately
    const local = getLocalProducts();
    const idx = local.findIndex((p) => p.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any };
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('wf_products_updated'));
    }
    invalidateCache();

    if (!isFirebaseConfigured || id.startsWith('wf-prod-')) return;

    const cleaned = cleanUndefined(data);
    try {
      await queryWithTimeout(
        updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), {
          ...cleaned,
          updatedAt: serverTimestamp(),
        }),
        5000
      );
    } catch (err) {
      console.warn('[productService] Firestore update skipped or timed out:', err);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    deleteLocalProduct(id);
    invalidateCache();
    if (isFirebaseConfigured && !id.startsWith('wf-prod-')) {
      try {
        const delPromise = deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 3000)
        );
        await Promise.race([delPromise, timeoutPromise]);
      } catch (err) {
        console.warn('[productService] Firestore delete skipped or timed out:', err);
      }
    }
  },

  async updateProductStock(id: string, quantity: number): Promise<void> {
    const stockStatus = quantity <= 0 ? 'out_of_stock' : quantity <= 5 ? 'low_stock' : 'in_stock';
    await this.updateProduct(id, { stockQuantity: quantity, stockStatus } as any);
  },

  async bulkUpdateStatus(ids: string[], status: Product['status']): Promise<void> {
    const locals = getLocalProducts();
    let updatedLocal = false;
    for (const p of locals) {
      if (ids.includes(p.id)) {
        p.status = status;
        updatedLocal = true;
      }
    }
    if (updatedLocal) {
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(locals));
      window.dispatchEvent(new Event('wf_products_updated'));
    }
    invalidateCache();

    if (isFirebaseConfigured) {
      try {
        const fsIds = ids.filter((id) => !id.startsWith('wf-prod-'));
        await Promise.all(
          fsIds.map((id) =>
            queryWithTimeout(
              updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), {
                status,
                updatedAt: serverTimestamp(),
              }),
              3000
            )
          )
        );
      } catch {}
    }
  },

  async bulkDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      deleteLocalProduct(id);
    }
    invalidateCache();
    if (isFirebaseConfigured) {
      try {
        const fsIds = ids.filter((id) => !id.startsWith('wf-prod-'));
        await Promise.all(
          fsIds.map((id) =>
            queryWithTimeout(deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id)), 3000)
          )
        );
      } catch {}
    }
  },
};

export default productService;
