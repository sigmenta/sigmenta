// ─── useWishlist Hook ─────────────────────────────────────────────────────────
import { useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuth } from '@/hooks/useAuth';
import { COLLECTIONS } from '@/constants';
import type { WishlistItem } from '@/types';

interface UseWishlistReturn {
  items: WishlistItem[];
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (item: WishlistItem) => void;
}

const DEBOUNCE_MS = 1500;

export function useWishlist(): UseWishlistReturn {
  const { user } = useAuth();
  const store = useWishlistStore();

  // On user login: load wishlist from Firestore and merge into local store
  useEffect(() => {
    if (!user?.uid) {
      store.clearWishlist();
      return;
    }

    let cancelled = false;
    const loadFromFirestore = async () => {
      try {
        const snap = await getDoc(
          doc(db, COLLECTIONS.WISHLISTS, user.uid)
        );
        if (!cancelled && snap.exists()) {
          const data = snap.data() as { items: WishlistItem[] };
          if (Array.isArray(data.items)) {
            store.syncFromFirestore(data.items);
          }
        }
      } catch {
        // Silently fail — local state remains
      }
    };
    void loadFromFirestore();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Debounced sync to Firestore whenever items change (while logged in)
  useEffect(() => {
    if (!user?.uid) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, COLLECTIONS.WISHLISTS, user.uid),
          { items: store.items, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch {
        // Silently fail
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [user?.uid, store.items]);

  const isInWishlist = useCallback(
    (productId: string): boolean =>
      store.items.some((i) => i.productId === productId),
    [store.items]
  );

  const toggleItem = useCallback(
    (item: WishlistItem) => {
      if (isInWishlist(item.productId)) {
        store.removeItem(item.productId);
      } else {
        store.addItem(item);
      }
    },
    [isInWishlist, store]
  );

  return {
    items: store.items,
    itemCount: store.items.length,
    isInWishlist,
    toggleItem,
  };
}

export default useWishlist;
