// ─── Women's Favorite — User Service ────────────────────────────────────────

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS, USER_ROLES } from '@/constants';
import type { UserProfile, UserAddress, CustomerSummary } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// ─── ID Generator ─────────────────────────────────────────────────────────────

function generateAddressId(): string {
  return `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const SAMPLE_CUSTOMERS: CustomerSummary[] = [
  {
    uid: 'demo-user-1',
    email: 'nusrat@gmail.com',
    displayName: 'নুসরাত জাহান',
    phoneNumber: '01711223344',
    role: USER_ROLES.CUSTOMER,
    isActive: true,
    totalOrders: 3,
    totalSpent: 12400,
    createdAt: { seconds: 1768000000, nanoseconds: 0 } as unknown as Timestamp,
  },
  {
    uid: 'demo-user-2',
    email: 'farhana@yahoo.com',
    displayName: 'ফারহানা ইসলাম',
    phoneNumber: '01812345678',
    role: USER_ROLES.CUSTOMER,
    isActive: true,
    totalOrders: 2,
    totalSpent: 8900,
    createdAt: { seconds: 1769000000, nanoseconds: 0 } as unknown as Timestamp,
  },
  {
    uid: 'demo-user-3',
    email: 'tania@gmail.com',
    displayName: 'তানিয়া সুলতানা',
    phoneNumber: '01911998877',
    role: USER_ROLES.CUSTOMER,
    isActive: true,
    totalOrders: 1,
    totalSpent: 3360,
    createdAt: { seconds: 1770000000, nanoseconds: 0 } as unknown as Timestamp,
  },
];

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetches a full UserProfile document from Firestore by UID.
 */
export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null;
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

/**
 * Admin-only: fetches a paginated list of customers.
 * Returns only public-safe CustomerSummary fields.
 */
export async function getCustomers(
  limitCount: number = 50,
): Promise<CustomerSummary[]> {
  if (!isFirebaseConfigured) {
    return SAMPLE_CUSTOMERS.slice(0, limitCount);
  }
  try {
    const ref = collection(db, COLLECTIONS.USERS);
    const q = query(
      ref,
      where('role', '==', USER_ROLES.CUSTOMER),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => {
        const data = d.data() as UserProfile;
        return {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          phoneNumber: data.phoneNumber,
          role: data.role,
          isActive: data.isActive,
          createdAt: data.createdAt,
          totalOrders: undefined,
          totalSpent: undefined,
        } satisfies CustomerSummary;
      });
    }
  } catch {
    // fallback
  }
  return SAMPLE_CUSTOMERS.slice(0, limitCount);
}

// ─── Profile Mutations ────────────────────────────────────────────────────────

/**
 * Updates allowed profile fields. Role is NOT in the allowed set
 * to prevent privilege escalation from the client.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<
    Pick<
      UserProfile,
      'displayName' | 'displayNameBn' | 'phoneNumber' | 'photoURL'
    >
  >,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Address Management ───────────────────────────────────────────────────────

/**
 * Adds a new address to the user's addresses array.
 * Generates a client-side ID since Firestore arrays don't have per-element IDs.
 * Returns the generated address ID.
 */
export async function addAddress(
  uid: string,
  address: Omit<UserAddress, 'id'>,
): Promise<string> {
  const id = generateAddressId();
  const newAddress: UserAddress = { ...address, id };

  const ref = doc(db, COLLECTIONS.USERS, uid);

  // If this is the first address or it's set as default, ensure it's default
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    const profile = snapshot.data() as UserProfile;
    if (profile.addresses.length === 0) {
      newAddress.isDefault = true;
    }
    // If new address is default, unset existing default first
    if (newAddress.isDefault) {
      const updatedAddresses = profile.addresses.map((a) => ({
        ...a,
        isDefault: false,
      }));
      await updateDoc(ref, {
        addresses: [...updatedAddresses, newAddress],
        updatedAt: serverTimestamp(),
      });
      return id;
    }
  }

  await updateDoc(ref, {
    addresses: arrayUnion(newAddress),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/**
 * Updates a specific address in the user's addresses array.
 * Fetches the current addresses, applies the patch, and writes back.
 */
export async function updateAddress(
  uid: string,
  addressId: string,
  data: Partial<UserAddress>,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('ব্যবহারকারী পাওয়া যায়নি।');

  const profile = snapshot.data() as UserProfile;
  const updatedAddresses = profile.addresses.map((a) =>
    a.id === addressId ? { ...a, ...data } : a,
  );

  await updateDoc(ref, {
    addresses: updatedAddresses,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Removes an address from the user's addresses array.
 * If the deleted address was default, auto-assigns the first remaining address as default.
 */
export async function deleteAddress(
  uid: string,
  addressId: string,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('ব্যবহারকারী পাওয়া যায়নি।');

  const profile = snapshot.data() as UserProfile;
  const removedAddress = profile.addresses.find((a) => a.id === addressId);
  let remaining = profile.addresses.filter((a) => a.id !== addressId);

  // If we removed the default address, make the first remaining one default
  if (removedAddress?.isDefault && remaining.length > 0) {
    remaining = remaining.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }

  await updateDoc(ref, {
    addresses: remaining,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Sets a specific address as the default, unsetting all others.
 */
export async function setDefaultAddress(
  uid: string,
  addressId: string,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('ব্যবহারকারী পাওয়া যায়নি।');

  const profile = snapshot.data() as UserProfile;
  const updatedAddresses = profile.addresses.map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));

  await updateDoc(ref, {
    addresses: updatedAddresses,
    updatedAt: serverTimestamp(),
  });
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

/**
 * Admin-only: suspends a user account by setting isActive to false.
 * The adminUid is recorded for audit purposes.
 */
export async function suspendUser(
  uid: string,
  adminUid: string,
): Promise<void> {
  if (!adminUid) throw new Error('Admin UID is required to suspend a user.');

  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, {
    isActive: false,
    suspendedBy: adminUid,
    suspendedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─── Customer Self-Service ────────────────────────────────────────────────────

/**
 * Marks the account for deletion. Actual deletion must be performed by a
 * Cloud Function (to also delete Auth user, storage files, etc.).
 */
export async function requestAccountDeletion(uid: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, {
    deletionRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const userService = {
  getUserProfile,
  getCustomers,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  suspendUser,
  requestAccountDeletion,
};

export default userService;

