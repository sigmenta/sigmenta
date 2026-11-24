// ─── useCart Hook ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCartStore } from '@/stores/cartStore';
import { COLLECTIONS } from '@/constants';
import { getDeliveryFees, settingsService } from '@/services/settingsService';
import type { CartItem, CartTotals, CartItemVariant, Product } from '@/types';

interface UseCartReturn {
  items: CartItem[];
  totals: CartTotals;
  itemCount: number;
  isInCart: (productId: string, variantKey?: string) => boolean;
  addItem: (product: Product | any, quantity?: number, variants?: CartItemVariant[]) => void;
  removeItem: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
}

export function useCart(): UseCartReturn {
  const store = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState<number>(() => getDeliveryFees().dhaka);

  // Sync delivery fee with settings
  useEffect(() => {
    let cancelled = false;

    const syncFee = () => {
      if (cancelled) return;
      const fees = getDeliveryFees();
      setDeliveryFee(fees.dhaka);
    };

    syncFee();
    window.addEventListener('wf_settings_updated', syncFee);

    // Also fetch latest from Firestore
    settingsService.getSiteSettings()
      .then(() => {
        if (!cancelled) syncFee();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      window.removeEventListener('wf_settings_updated', syncFee);
    };
  }, []);

  const subtotal = store.items.reduce(
    (acc: number, item: CartItem) => acc + (item.unitPrice ?? item.regularPrice ?? 0) * item.quantity,
    0
  );

  const discountAmount = store.couponDiscount ?? 0;

  const effectiveDelivery =
    store.items.length === 0 ? 0 : deliveryFee;

  const totals: CartTotals = {
    subtotal,
    discountAmount,
    deliveryFee: effectiveDelivery,
    total: Math.max(0, subtotal - discountAmount + effectiveDelivery),
    itemCount: store.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
  };

  const isInCart = useCallback(
    (productId: string, variantKey?: string): boolean => {
      if (variantKey) {
        return store.items.some((i: CartItem) => i.variantKey === variantKey);
      }
      return store.items.some((i: CartItem) => i.productId === productId);
    },
    [store.items]
  );

  return {
    items: store.items,
    totals,
    itemCount: totals.itemCount,
    isInCart,
    addItem: (product, quantity = 1, variants) => store.addItem(product, quantity, variants),
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    applyCoupon: store.applyCoupon,
    removeCoupon: store.removeCoupon,
    clearCart: store.clearCart,
  };
}

export default useCart;
