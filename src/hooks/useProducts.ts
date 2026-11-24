// ─── useProducts Hooks ────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS, PAGINATION } from '@/constants';
import { productService } from '@/services/productService';
import type { Product, ProductSummary, ProductFilters } from '@/types';

interface UseProductsReturn {
  products: ProductSummary[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

interface UseProductBySlugReturn {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
}

function buildProductQuery(filters: ProductFilters, pageLimit: number) {
  const constraints: Parameters<typeof query>[1][] = [
    where('status', '==', 'published'),
  ];

  if (filters.categorySlug) {
    constraints.push(where('categorySlug', '==', filters.categorySlug));
  }
  if (filters.isFeatured === true) {
    constraints.push(where('isFeatured', '==', true));
  }
  if (filters.isBestSeller === true) {
    constraints.push(where('isBestSeller', '==', true));
  }
  if (filters.isOnSale === true) {
    constraints.push(where('isOnSale', '==', true));
  }
  if (filters.stockStatus) {
    constraints.push(where('stockStatus', '==', filters.stockStatus));
  }

  // Sorting
  const sortBy = filters.sortBy ?? 'newest';
  if (sortBy === 'newest') constraints.push(orderBy('publishedAt', 'desc'));
  else if (sortBy === 'price_asc') constraints.push(orderBy('regularPrice', 'asc'));
  else if (sortBy === 'price_desc') constraints.push(orderBy('regularPrice', 'desc'));
  else if (sortBy === 'rating') constraints.push(orderBy('averageRating', 'desc'));
  else if (sortBy === 'popularity') constraints.push(orderBy('totalSales', 'desc'));
  else constraints.push(orderBy('publishedAt', 'desc'));

  constraints.push(limit(pageLimit));
  return query(collection(db, COLLECTIONS.PRODUCTS), ...constraints);
}

function docToSummary(d: QueryDocumentSnapshot<DocumentData>): ProductSummary {
  const data = d.data();
  return {
    id: d.id,
    slug: data.slug as string,
    nameBn: data.nameBn as string,
    nameEn: data.nameEn as string | undefined,
    regularPrice: data.regularPrice as number,
    salePrice: data.salePrice as number | undefined,
    primaryImage:
      (data.images as { isPrimary: boolean; url: string }[])?.find(
        (img) => img.isPrimary
      )?.url,
    stockStatus: data.stockStatus as ProductSummary['stockStatus'],
    averageRating: data.averageRating as number,
    totalReviews: data.totalReviews as number,
    isFeatured: data.isFeatured as boolean,
    isBestSeller: data.isBestSeller as boolean,
    categorySlug: data.categorySlug as string,
  };
}

/* ── Generic useProducts ── */
export function useProducts(
  filters: ProductFilters = {},
  pageLimit: number = PAGINATION.PRODUCTS_PER_PAGE
): UseProductsReturn {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const filtersKey = JSON.stringify(filters);

  const fetchProducts = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { products: allProds } = await productService.getAll({
          status: 'published',
          categoryId: filters.categorySlug,
          pageSize: pageLimit,
        });

        const summaries: ProductSummary[] = allProds.map((p) => ({
          id: p.id,
          slug: p.slug,
          nameBn: p.nameBn,
          nameEn: p.nameEn,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
          primaryImage: p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || '',
          stockStatus: p.stockStatus,
          averageRating: p.averageRating ?? 0,
          totalReviews: p.totalReviews ?? 0,
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          categorySlug: p.categorySlug,
        }));

        const filtered = summaries.filter((p) => {
          if (filters.categorySlug && p.categorySlug !== filters.categorySlug) return false;
          if (filters.isFeatured && !p.isFeatured) return false;
          if (filters.isBestSeller && !p.isBestSeller) return false;
          if (filters.isOnSale && !p.salePrice) return false;
          if (filters.stockStatus && p.stockStatus !== filters.stockStatus) return false;
          return true;
        });

        setProducts(filtered);
        setHasMore(false);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey, pageLimit]
  );

  useEffect(() => {
    void fetchProducts();
    const handleUpdate = () => { void fetchProducts(); };
    window.addEventListener('wf_products_updated', handleUpdate);
    return () => window.removeEventListener('wf_products_updated', handleUpdate);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    // handled
  }, []);

  const refresh = useCallback(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, hasMore, loadMore, refresh };
}

/* ── Featured Products ── */
export function useFeaturedProducts(
  pageLimit = 12
): UseProductsReturn {
  return useProducts({ isFeatured: true, sortBy: 'newest' }, pageLimit);
}

/* ── Best Sellers ── */
export function useBestSellers(pageLimit = 12): UseProductsReturn {
  return useProducts({ isBestSeller: true, sortBy: 'popularity' }, pageLimit);
}

/* ── New Arrivals ── */
export function useNewArrivals(pageLimit = 12): UseProductsReturn {
  return useProducts({ sortBy: 'newest' }, pageLimit);
}

/* ── Single Product by Slug ── */
export function useProductBySlug(slug: string): UseProductBySlugReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      if (!isFirebaseConfigured) {
        const prod = await productService.getProductBySlug(slug);
        if (!cancelled) {
          setProduct(prod);
          setIsLoading(false);
          if (!prod) setError('পণ্যটি পাওয়া যায়নি');
        }
        return;
      }
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 1500)
        );

        const q = query(
          collection(db, COLLECTIONS.PRODUCTS),
          where('slug', '==', slug),
          where('status', '==', 'published'),
          limit(1)
        );
        const snap = await Promise.race([getDocs(q), timeoutPromise]);
        if (!cancelled) {
          if (!snap.empty) {
            const d = snap.docs[0];
            setProduct({ id: d.id, ...d.data() } as Product);
          } else {
            const fallbackProd = await productService.getProductBySlug(slug);
            setProduct(fallbackProd);
            if (!fallbackProd) setError('পণ্যটি পাওয়া যায়নি');
          }
        }
      } catch {
        if (!cancelled) {
          const fallbackProd = await productService.getProductBySlug(slug);
          setProduct(fallbackProd);
          if (!fallbackProd) setError('পণ্য লোড করতে সমস্যা হয়েছে');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  return { product, isLoading, error };
}
