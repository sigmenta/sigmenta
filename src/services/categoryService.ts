// ─── Category Service ─────────────────────────────────────────────────────────
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
import type { Category } from '@/types';
import { COLLECTIONS } from '@/constants';
import { SAMPLE_CATEGORIES } from '@/constants/sampleData';

const col = () => collection(db, COLLECTIONS.CATEGORIES);
const LOCAL_CATEGORIES_KEY = 'wf_custom_categories';

export function getLocalCategories(): Category[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (!raw) {
      const initial = SAMPLE_CATEGORIES;
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Category[];
    // Auto-migrate: If cache contains legacy categories (skincare/makeup), purge and use Sigmenta apparel categories
    if (parsed.some((c) => c.slug === 'skincare' || c.slug === 'makeup' || c.id === 'cat-skincare')) {
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(SAMPLE_CATEGORIES));
      return SAMPLE_CATEGORIES;
    }
    return parsed;
  } catch {
    return [];
  }
}


function saveLocalCategory(cat: Category): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalCategories().filter((c) => c.id !== cat.id && c.slug !== cat.slug);
    existing.unshift(cat);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('wf_categories_updated'));
  } catch (e) {}
}

function deleteLocalCategory(id: string): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalCategories().filter((c) => c.id !== id);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('wf_categories_updated'));
  } catch (e) {}
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    // Always fetch from Firestore first for real-time admin updates
    if (isFirebaseConfigured) {
      try {
        const q = query(col(), orderBy('sortOrder', 'asc'));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2500)
        );
        const snap = await Promise.race([getDocs(q), timeoutPromise]);
        if (!snap.empty) {
          const firestoreCategories: Category[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
          firestoreCategories.forEach((c) => saveLocalCategory(c));
          return firestoreCategories;
        }
      } catch (err) {
        console.warn('[categoryService] Firestore getAll failed:', err);
      }
    }

    // Offline fallback
    return getLocalCategories();
  },

  async getById(id: string): Promise<Category | null> {
    const local = getLocalCategories().find((c) => c.id === id);
    if (local) return local;

    if (isFirebaseConfigured) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.CATEGORIES, id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Category;
      } catch {}
    }
    return null;
  },

  async getCategories(activeOnly?: boolean): Promise<Category[]> {
    const all = await this.getAll();
    if (activeOnly) {
      return all.filter((c) => c.isActive);
    }
    return all;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const all = await this.getAll();
    return all.find((c) => c.slug === slug) ?? null;
  },

  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const localId = `wf-cat-${Date.now()}`;
    const newCat: Category = {
      id: localId,
      ...data,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    // Must be authenticated to write to Firestore
    if (!isFirebaseConfigured || !auth.currentUser) {
      throw new Error('NOT_AUTHENTICATED');
    }

    saveLocalCategory(newCat);

    try {
      const fsPromise = addDoc(col(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const ref = await Promise.race([fsPromise, timeoutPromise]);
      if (ref && ref.id) {
        deleteLocalCategory(localId);
        saveLocalCategory({ ...newCat, id: ref.id });
        return ref.id;
      }
      deleteLocalCategory(localId);
      throw new Error('FIRESTORE_FAILED');
    } catch (err: any) {
      deleteLocalCategory(localId);
      throw err;
    }
  },

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.create(data);
  },

  async update(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    const locals = getLocalCategories();
    const idx = locals.findIndex((c) => c.id === id);
    if (idx >= 0) {
      locals[idx] = { ...locals[idx], ...data, updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any };
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(locals));
      window.dispatchEvent(new Event('wf_categories_updated'));
    }

    if (isFirebaseConfigured && !id.startsWith('wf-cat-')) {
      try {
        const updatePromise = updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );
        await Promise.race([updatePromise, timeoutPromise]);
      } catch (err) {
        console.warn('[categoryService] Firestore update skipped or timed out:', err);
      }
    }
  },

  async updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    return this.update(id, data);
  },

  async delete(id: string): Promise<void> {
    deleteLocalCategory(id);
    if (isFirebaseConfigured && !id.startsWith('wf-cat-')) {
      try {
        const delPromise = deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );
        await Promise.race([delPromise, timeoutPromise]);
      } catch (err) {
        console.warn('[categoryService] Firestore delete skipped or timed out:', err);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    return this.delete(id);
  },

  async reorderCategories(orderedIds: string[]): Promise<void> {
    const locals = getLocalCategories();
    locals.forEach((c) => {
      const idx = orderedIds.indexOf(c.id);
      if (idx !== -1) c.sortOrder = idx;
    });
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(locals));

    if (isFirebaseConfigured) {
      try {
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
          if (!id.startsWith('wf-cat-')) {
            batch.update(doc(db, COLLECTIONS.CATEGORIES, id), {
              sortOrder: index,
              updatedAt: serverTimestamp(),
            });
          }
        });
        await batch.commit();
      } catch (err) {}
    }
  },

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || `category-${Date.now()}`;
  },
};

export const getAll = categoryService.getAll.bind(categoryService);
export const getCategories = categoryService.getCategories.bind(categoryService);
export const getById = categoryService.getById.bind(categoryService);
export const getCategoryBySlug = categoryService.getCategoryBySlug.bind(categoryService);
export const create = categoryService.create.bind(categoryService);
export const createCategory = categoryService.createCategory.bind(categoryService);
export const update = categoryService.update.bind(categoryService);
export const updateCategory = categoryService.updateCategory.bind(categoryService);
export const deleteCategory = categoryService.deleteCategory.bind(categoryService);
export const reorderCategories = categoryService.reorderCategories.bind(categoryService);

export default categoryService;
