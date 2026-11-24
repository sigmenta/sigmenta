// ─── Women's Favorite — Review Service ──────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  increment,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { Review, ReviewStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToReview(
  docSnap: import('firebase/firestore').QueryDocumentSnapshot |
    import('firebase/firestore').DocumentSnapshot,
): Review {
  const data = (docSnap as import('firebase/firestore').QueryDocumentSnapshot).data() as Omit<Review, 'id'>;
  return { ...data, id: docSnap.id };
}

// ─── Public Reads ─────────────────────────────────────────────────────────────

async function queryWithTimeout<T>(promise: Promise<T>, timeoutMs = 1200): Promise<T> {
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

/**
 * Returns reviews for a product.
 * Public consumers should always pass status='approved'.
 * Admins can pass other statuses or omit to get all reviews for the product.
 */
export async function getProductReviews(
  productId: string,
  status?: ReviewStatus,
): Promise<Review[]> {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const ref = collection(db, COLLECTIONS.REVIEWS);
    const constraints: QueryConstraint[] = [
      where('productId', '==', productId),
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(ref, ...constraints);
    const snapshot = await queryWithTimeout(getDocs(q));
    if (!snapshot.empty) {
      return snapshot.docs.map(docToReview);
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Returns all reviews submitted by a specific user.
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  const ref = collection(db, COLLECTIONS.REVIEWS);
  const q = query(
    ref,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToReview);
}

// ─── Admin Reads ──────────────────────────────────────────────────────────────

/**
 * Admin-only: returns all reviews, optionally filtered by status.
 */
export async function getAllReviews(
  status?: ReviewStatus,
): Promise<Review[]> {
  if (!isFirebaseConfigured) {
    return [];
  }
  const ref = collection(db, COLLECTIONS.REVIEWS);
  const constraints: QueryConstraint[] = [];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToReview);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Submits a new review. Reviews are created with status='pending' and
 * reportCount=0 — they must be approved by an admin before appearing publicly.
 */
export async function submitReview(
  data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reportCount'>,
): Promise<string> {
  const ref = collection(db, COLLECTIONS.REVIEWS);
  const docRef = await addDoc(ref, {
    ...data,
    status: 'pending' satisfies ReviewStatus,
    reportCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Admin-only: updates a review's status (approve / reject / mark as reported).
 * Optionally records an admin note for internal audit.
 */
export async function updateReviewStatus(
  id: string,
  status: ReviewStatus,
  adminNotes?: string,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.REVIEWS, id);
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (adminNotes !== undefined) {
    payload['adminNotes'] = adminNotes;
  }
  await updateDoc(ref, payload);
}

/**
 * Increments the reportCount for a review.
 * Admins can then filter on reportCount > 0 to investigate.
 * The review is NOT automatically hidden — admin must change status to 'reported'.
 */
export async function reportReview(id: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.REVIEWS, id);
  await updateDoc(ref, {
    reportCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export const reviewService = {
  getProductReviews,
  getUserReviews,
  getAllReviews,
  submitReview,
  updateReviewStatus,
  reportReview,
};

export default reviewService;
