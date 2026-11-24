import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  type QueryDocumentSnapshot, serverTimestamp, Timestamp, arrayUnion,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/types';
import { COLLECTIONS } from '@/constants';

const col = () => collection(db, COLLECTIONS.ORDERS);
const LOCAL_ORDERS_KEY = 'wf_custom_orders';
const DELETED_ORDERS_KEY = 'wf_deleted_orders';

export function getDeletedOrderIds(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markOrderDeleted(id: string, orderRef?: string): void {
  try {
    if (typeof window === 'undefined') return;
    const deleted = getDeletedOrderIds();
    if (id && !deleted.includes(id)) deleted.push(id);
    if (orderRef && !deleted.includes(orderRef)) deleted.push(orderRef);
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(deleted));
  } catch {}
}

export function deleteLocalOrder(id: string): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalOrders();
    const target = existing.find((o) => o.id === id || o.orderReference === id);
    if (target) {
      markOrderDeleted(target.id, target.orderReference);
    } else {
      markOrderDeleted(id);
    }
    const filtered = existing.filter(
      (o) => o.id !== id && o.orderReference !== id
    );
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('wf_orders_updated'));
  } catch (e) {
    console.error('Failed to delete order from localStorage:', e);
  }
}

export function getLocalOrders(): Order[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: Order): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalOrders().filter(
      (o) => o.id !== order.id && o.orderReference !== order.orderReference
    );
    existing.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('wf_orders_updated'));
  } catch (e) {
    console.error('Failed to save order to localStorage:', e);
  }
}

export function updateLocalOrder(id: string, updates: Partial<Order>): void {
  try {
    if (typeof window === 'undefined') return;
    const existing = getLocalOrders();
    const idx = existing.findIndex((o) => o.id === id || o.orderReference === id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updates };
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('wf_orders_updated'));
    }
  } catch (e) {}
}

async function queryWithTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
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

export const SAMPLE_ORDERS: Order[] = [];

export const orderService = {
  async createOrder(data: any): Promise<string> {
    const localId = `wf-ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowTimestamp = {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: () => new Date(),
    } as any;

    const newOrder: Order = {
      id: localId,
      ...data,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    };

    // 1. Immediately save to localStorage so the order is NEVER lost
    saveLocalOrder(newOrder);

    // 2. If Firebase is configured, attempt Firestore save with a 3.5s timeout
    if (isFirebaseConfigured) {
      try {
        const cleanData = cleanUndefined({
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const fsPromise = addDoc(col(), cleanData);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 3500)
        );
        const docRef = await Promise.race([fsPromise, timeoutPromise]);
        if (docRef && docRef.id) {
          // Replace localId with real Firestore doc ID
          const locals = getLocalOrders().filter((o) => o.id !== localId);
          const syncedOrder = { ...newOrder, id: docRef.id };
          locals.unshift(syncedOrder);
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(locals));
          window.dispatchEvent(new Event('wf_orders_updated'));
          return docRef.id;
        }
      } catch (err) {
        console.warn('[orderService] Firestore order write timed out or denied. Preserved in localStorage:', err);
      }
    }

    return localId;
  },

  async getById(id: string): Promise<Order | null> {
    const deletedIds = new Set(getDeletedOrderIds());
    if (deletedIds.has(id)) return null;

    // Always try Firestore FIRST for fresh/real-time data (admin status changes reflect immediately)
    if (isFirebaseConfigured) {
      try {
        // Try direct doc lookup by Firestore document ID
        if (!id.startsWith('wf-ord-') && !id.startsWith('demo-order-')) {
          const snap = await queryWithTimeout(getDoc(doc(db, COLLECTIONS.ORDERS, id)), 6000);
          if (snap.exists()) {
            const ord = { id: snap.id, ...snap.data() } as Order;
            saveLocalOrder(ord); // Update cache with fresh data
            return ord;
          }
        }

        // Try by orderReference field
        const qRef = query(col(), where('orderReference', '==', id), limit(1));
        const snapRef = await queryWithTimeout(getDocs(qRef), 6000);
        if (!snapRef.empty) {
          const docSnap = snapRef.docs[0]!;
          const ord = { id: docSnap.id, ...docSnap.data() } as Order;
          saveLocalOrder(ord);
          return ord;
        }

        // Try by id field
        const qId = query(col(), where('id', '==', id), limit(1));
        const snapId = await queryWithTimeout(getDocs(qId), 6000);
        if (!snapId.empty) {
          const docSnap = snapId.docs[0]!;
          const ord = { id: docSnap.id, ...docSnap.data() } as Order;
          saveLocalOrder(ord);
          return ord;
        }
      } catch (err) {
        console.warn('[orderService] getById Firestore error, falling back to cache:', err);
      }
    }

    // Fallback: localStorage cache (when offline or Firestore fails)
    const local = getLocalOrders().find((o) => o.id === id || o.orderReference === id);
    if (local && !deletedIds.has(local.id) && !deletedIds.has(local.orderReference)) return local;

    // No sample fallback

    return null;
  },

  async getAll(filters?: {
    status?: string;
    paymentMethod?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot;
  }): Promise<{ orders: Order[]; lastDoc: QueryDocumentSnapshot | null }> {
    let firestoreOrders: Order[] = [];
    let lastDoc: QueryDocumentSnapshot | null = null;

    if (isFirebaseConfigured) {
      try {
        const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc')];
        if (filters?.status && filters.status !== 'all') {
          constraints.unshift(where('status', '==', filters.status));
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
          constraints.unshift(where('payment.method', '==', filters.paymentMethod));
        }
        constraints.push(limit(filters?.pageSize ?? 50));
        if (filters?.lastDoc) constraints.push(startAfter(filters.lastDoc));

        const q = query(col(), ...constraints);
        const snap = await queryWithTimeout(getDocs(q), 2500);
        if (!snap.empty) {
          firestoreOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          lastDoc = snap.docs[snap.docs.length - 1] ?? null;
          // Update local cache with fresh Firestore data
          firestoreOrders.forEach((o) => saveLocalOrder(o));
        }
      } catch {
        // fallback to local cache
      }
    }

    // Firestore data takes priority; fall back to localStorage only when offline
    const orderMap = new Map<string, Order>();

    if (firestoreOrders.length > 0) {
      // Use Firestore as source of truth
      for (const o of firestoreOrders) {
        orderMap.set(o.id, o);
      }
      // Also include purely local orders not yet synced to Firestore
      const local = getLocalOrders().filter((o) => o.id.startsWith('wf-ord-'));
      for (const o of local) {
        if (!orderMap.has(o.id)) orderMap.set(o.id, o);
      }
    } else {
      // Offline fallback: use localStorage
      const local = getLocalOrders();
      for (const o of local) {
        orderMap.set(o.id, o);
      }
      // No fake sample orders
    }

    const deletedIds = new Set(getDeletedOrderIds());
    let list = Array.from(orderMap.values()).filter(
      (o) => !deletedIds.has(o.id) && !deletedIds.has(o.orderReference)
    );

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter((o) => o.payment?.method === filters.paymentMethod);
    }

    return { orders: list, lastDoc };
  },

  async getRecent(count = 10): Promise<Order[]> {
    const { orders } = await this.getAll({ pageSize: count });
    return orders.slice(0, count);
  },

  async getPendingCount(): Promise<number> {
    const { orders } = await this.getAll();
    return orders.filter((o) => o.status === 'pending').length;
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    note: string,
    updatedBy: string
  ): Promise<void> {
    const historyEntry = {
      status,
      note,
      updatedBy,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    };

    const existing = getLocalOrders().find((o) => o.id === id || o.orderReference === id);
    const existingHistory = existing?.statusHistory || [];
    const newHistory = [...existingHistory, historyEntry];

    updateLocalOrder(id, {
      status,
      adminNotes: note || undefined,
      statusHistory: newHistory,
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    });

    if (isFirebaseConfigured && !id.startsWith('wf-ord-')) {
      try {
        const fsEntry = {
          status,
          note,
          updatedBy,
          updatedAt: Timestamp.now(),
        };

        let targetDocRef = doc(db, COLLECTIONS.ORDERS, id);
        let exists = false;
        try {
          const directSnap = await queryWithTimeout(getDoc(targetDocRef), 2000);
          exists = directSnap.exists();
        } catch {}

        if (!exists) {
          const q = query(col(), where('orderReference', '==', id), limit(1));
          const snap = await queryWithTimeout(getDocs(q), 2000);
          if (!snap.empty) {
            targetDocRef = snap.docs[0]!.ref;
            exists = true;
          }
        }

        const updateData: any = {
          status,
          adminNotes: note || undefined,
          statusHistory: arrayUnion(fsEntry),
          updatedAt: serverTimestamp(),
        };
        if (status === 'delivered') updateData.deliveredAt = serverTimestamp();
        if (status === 'cancelled') updateData.cancelledAt = serverTimestamp();

        Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

        await queryWithTimeout(updateDoc(targetDocRef, updateData), 4000);
      } catch (err) {
        console.warn('[orderService] Firestore updateStatus error:', err);
        throw err;
      }
    }
  },

  async updateAdminNotes(id: string, notes: string): Promise<void> {
    updateLocalOrder(id, { adminNotes: notes });
    if (isFirebaseConfigured && !id.startsWith('wf-ord-')) {
      try {
        await queryWithTimeout(
          updateDoc(doc(db, COLLECTIONS.ORDERS, id), {
            adminNotes: notes,
            updatedAt: serverTimestamp(),
          }),
          3000
        );
      } catch {}
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    return this.getById(id);
  },

  async cancelOrder(id: string, userId: string, reason: string): Promise<void> {
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found');
    // Only allow cancellation when status is 'pending'
    if (order.status !== 'pending') {
      throw new Error('Order cannot be cancelled. Only pending orders can be cancelled.');
    }

    // 5-minute check
    const ca = (order as any).createdAt;
    let orderTs = 0;
    if (ca) {
      if (typeof ca?.toDate === 'function') orderTs = ca.toDate().getTime();
      else if (typeof ca?.seconds === 'number') orderTs = ca.seconds * 1000;
      else orderTs = new Date(ca).getTime();
    }
    if (orderTs > 0 && Date.now() - orderTs > 5 * 60 * 1000) {
      throw new Error('অর্ডার প্লেস করার ৫ মিনিট অতিক্রম হয়ে গেছে। এখন আর অর্ডার বাতিল করা যাবে না।');
    }

    await this.updateStatus(id, 'cancelled', reason, userId);
  },

  async getUserOrders(userId: string, limitCount = 20): Promise<Order[]> {
    let firestoreOrders: Order[] = [];

    // Always fetch from Firestore first for real-time status updates
    if (isFirebaseConfigured) {
      try {
        const q = query(
          col(),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        const snap = await queryWithTimeout(getDocs(q), 2500);
        if (!snap.empty) {
          firestoreOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          // Update local cache with fresh Firestore data
          firestoreOrders.forEach((o) => saveLocalOrder(o));
        }
      } catch {}
    }

    // If Firestore returned results, use those (they're most up-to-date)
    if (firestoreOrders.length > 0) {
      const deletedIds = new Set(getDeletedOrderIds());
      return firestoreOrders
        .filter((o) => !deletedIds.has(o.id) && !deletedIds.has(o.orderReference))
        .slice(0, limitCount);
    }

    // Fallback: localStorage cache
    const local = getLocalOrders().filter(
      (o) => o.userId === userId || o.userId === 'guest' || o.userId === 'customer'
    );

    const map = new Map<string, Order>();
    for (const o of local) map.set(o.id, o);

    return Array.from(map.values()).slice(0, limitCount);
  },

  async getAllOrders(filters?: any): Promise<Order[]> {
    const res = await this.getAll(filters);
    return res.orders;
  },

  async getDashboardMetrics() {
    const { orders } = await this.getAll({ pageSize: 500 });
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let totalRevenue = 0;
    let todayRevenue = 0;
    let todayOrders = 0;
    let pendingOrders = 0;

    orders.forEach((order) => {
      if (order.status === 'pending') {
        pendingOrders++;
      }
      if (order.status !== 'cancelled' && order.status !== 'returned') {
        totalRevenue += order.total || 0;
        const createdAt = order.createdAt as any;
        const time = createdAt?.toDate
          ? createdAt.toDate().getTime()
          : createdAt?.seconds
          ? createdAt.seconds * 1000
          : 0;
        if (time >= todayStart) {
          todayRevenue += order.total || 0;
          todayOrders++;
        }
      }
    });

    return {
      totalOrders: orders.length,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      todayOrders,
    };
  },

  async deleteOrder(id: string): Promise<void> {
    deleteLocalOrder(id);

    if (isFirebaseConfigured) {
      try {
        if (!id.startsWith('wf-ord-') && !id.startsWith('demo-order-')) {
          await queryWithTimeout(
            deleteDoc(doc(db, COLLECTIONS.ORDERS, id)),
            4000
          );
        }

        const qRef = query(col(), where('orderReference', '==', id), limit(1));
        const snap = await queryWithTimeout(getDocs(qRef), 4000);
        if (!snap.empty) {
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        }
      } catch (err: any) {
        console.warn('[orderService] Firestore deleteOrder warning:', err);
      }
    }
  },

  getLocalOrders() {
    return getLocalOrders();
  },
};

export const createOrder = orderService.createOrder.bind(orderService);
export const getById = orderService.getById.bind(orderService);
export const getOrderById = orderService.getOrderById.bind(orderService);
export const cancelOrder = orderService.cancelOrder.bind(orderService);
export const deleteOrder = orderService.deleteOrder.bind(orderService);
export const getUserOrders = orderService.getUserOrders.bind(orderService);
export const getAllOrders = orderService.getAllOrders.bind(orderService);
export const updateStatus = orderService.updateStatus.bind(orderService);

export default orderService;
