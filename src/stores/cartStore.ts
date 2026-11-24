/**
 * src/stores/cartStore.ts
 * -----------------------
 * Zustand store for the shopping cart.
 * Persisted to localStorage under the key 'wf_cart'.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartItemVariant, CartTotals, Product } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a deterministic string key from an array of CartItemVariant objects. */
export function buildVariantKey(variants: CartItemVariant[] = []): string {
  return [...variants]
    .sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    .map((v) => `${v.type}:${v.value}`)
    .join('|');
}

const DEFAULT_MAX_QUANTITY = 10;

// ---------------------------------------------------------------------------
// State & actions interface
// ---------------------------------------------------------------------------
export interface CartState {
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number; // absolute BDT amount deducted

  // ── Actions ────────────────────────────────────────────────────────────────
  addItem(
    product: Product | any,
    quantity: number,
    variants?: CartItemVariant[],
  ): void;
  removeItem(variantKey: string): void;
  updateQuantity(variantKey: string, quantity: number): void;
  clearCart(): void;
  applyCoupon(code: string, discount: number): void;
  removeCoupon(): void;

  // ── Selectors ──────────────────────────────────────────────────────────────
  getItemCount(): number;
  getSubtotal(): number;
  getTotals(deliveryFee: number): CartTotals;
  isInCart(productId: string, variantKey: string): boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      couponDiscount: 0,

      // ── addItem ──────────────────────────────────────────────────────────
      addItem(product, quantity = 1, variants = []) {
        const prodId = product.id || product.productId;
        const variantKey = `${prodId}_${buildVariantKey(variants)}`;
        const maxQty = product.stockQuantity || DEFAULT_MAX_QUANTITY;
        const unitPrice = product.salePrice ?? product.regularPrice;
        const primaryImage =
          product.primaryImage ||
          (product.images && product.images[0]?.url) ||
          undefined;

        set((state) => {
          const existing = state.items.find((i) => i.variantKey === variantKey);
          if (existing) {
            const itemMax = existing.maxQuantity ?? maxQty;
            return {
              items: state.items.map((item) =>
                item.variantKey === variantKey
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, itemMax),
                    }
                  : item,
              ),
            };
          }

          const newItem: CartItem = {
            productId: prodId,
            slug: product.slug,
            nameBn: product.nameBn,
            nameEn: product.nameEn,
            primaryImage,
            regularPrice: product.regularPrice,
            salePrice: product.salePrice,
            unitPrice,
            quantity: Math.min(quantity, maxQty),
            maxQuantity: maxQty,
            selectedVariants: variants,
            variantKey,
          };
          return { items: [...state.items, newItem] };
        });
      },

      // ── removeItem ───────────────────────────────────────────────────────
      removeItem(variantKey) {
        set((state) => ({
          items: state.items.filter((i) => i.variantKey !== variantKey),
        }));
      },

      // ── updateQuantity ───────────────────────────────────────────────────
      updateQuantity(variantKey, quantity) {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.variantKey !== variantKey) return item;
            const maxQty = item.maxQuantity ?? DEFAULT_MAX_QUANTITY;
            const clamped = Math.max(1, Math.min(quantity, maxQty));
            return { ...item, quantity: clamped };
          }),
        }));
      },

      // ── clearCart ────────────────────────────────────────────────────────
      clearCart() {
        set({ items: [], couponCode: undefined, couponDiscount: 0 });
      },

      // ── applyCoupon ──────────────────────────────────────────────────────
      applyCoupon(code, discount) {
        set({ couponCode: code, couponDiscount: discount });
      },

      // ── removeCoupon ─────────────────────────────────────────────────────
      removeCoupon() {
        set({ couponCode: undefined, couponDiscount: 0 });
      },

      // ── getItemCount ─────────────────────────────────────────────────────
      getItemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // ── getSubtotal ──────────────────────────────────────────────────────
      getSubtotal() {
        return get().items.reduce(
          (sum, item) => sum + (item.unitPrice || item.regularPrice) * item.quantity,
          0,
        );
      },

      // ── getTotals ────────────────────────────────────────────────────────
      getTotals(deliveryFee: number): CartTotals {
        const { couponDiscount } = get();
        const subtotal = get().getSubtotal();
        const discountAmount = Math.min(couponDiscount, subtotal);
        const total = Math.max(0, subtotal - discountAmount + deliveryFee);
        return {
          subtotal,
          deliveryFee,
          discountAmount,
          total,
          itemCount: get().getItemCount(),
        };
      },

      // ── isInCart ─────────────────────────────────────────────────────────
      isInCart(productId, variantKey) {
        return get().items.some(
          (i) => i.productId === productId && i.variantKey === variantKey,
        );
      },
    }),
    {
      name: 'wf_cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selector hooks
// ---------------------------------------------------------------------------
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartItemCount = () => useCartStore((s) => s.getItemCount());
export const useCartSubtotal = () => useCartStore((s) => s.getSubtotal());
export const useCoupon = () =>
  useCartStore((s) => ({ code: s.couponCode, discount: s.couponDiscount }));
