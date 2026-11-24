/**
 * src/stores/wishlistStore.ts
 * ---------------------------
 * Zustand store for the customer wishlist.
 * Persisted to localStorage under the key 'wf_wishlist'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem } from '@/types';

// ---------------------------------------------------------------------------
// State & actions interface
// ---------------------------------------------------------------------------
interface WishlistState {
  items: WishlistItem[];

  // ── Actions ────────────────────────────────────────────────────────────────
  addItem(item: WishlistItem): void;
  removeItem(productId: string): void;
  toggleItem(item: WishlistItem): void;
  clearWishlist(): void;
  /**
   * Replace local wishlist with data fetched from Firestore.
   * Called once after a successful login to sync the authenticated user's
   * server-side wishlist into local state.
   */
  syncFromFirestore(items: WishlistItem[]): void;

  // ── Selectors ──────────────────────────────────────────────────────────────
  isInWishlist(productId: string): boolean;
  getItemCount(): number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      items: [],

      // ── addItem ──────────────────────────────────────────────────────────
      addItem(item) {
        set((state) => {
          // Prevent duplicates
          const already = state.items.some((i) => i.productId === item.productId);
          if (already) return state;
          return { items: [item, ...state.items] };
        });
      },

      // ── removeItem ───────────────────────────────────────────────────────
      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      // ── toggleItem ───────────────────────────────────────────────────────
      toggleItem(item) {
        const inWishlist = get().isInWishlist(item.productId);
        if (inWishlist) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      // ── clearWishlist ────────────────────────────────────────────────────
      clearWishlist() {
        set({ items: [] });
      },

      // ── syncFromFirestore ────────────────────────────────────────────────
      syncFromFirestore(items) {
        set({ items });
      },

      // ── isInWishlist ─────────────────────────────────────────────────────
      isInWishlist(productId) {
        return get().items.some((i) => i.productId === productId);
      },

      // ── getItemCount ─────────────────────────────────────────────────────
      getItemCount() {
        return get().items.length;
      },
    }),
    {
      name: 'wf_wishlist',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selector hooks
// ---------------------------------------------------------------------------
export const useWishlistItems = () => useWishlistStore((s) => s.items);
export const useWishlistCount = () => useWishlistStore((s) => s.getItemCount());
export const useIsInWishlist = (productId: string) =>
  useWishlistStore((s) => s.isInWishlist(productId));
