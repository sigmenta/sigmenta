// ============================================================
// functions/src/index.ts
// Main Cloud Functions export index
// ============================================================
// All functions use the asia-east1 region (closest to Bangladesh).
// Payment functions are exported as stubs — they return a clear
// NOT_CONFIGURED error until the merchant accounts are set up
// and the implementations in bkash.ts / nagad.ts are completed.
// ============================================================

import * as functions from 'firebase-functions';

// ─────────────────────────────────────────────
// Lazy import wrappers for faster cold starts
// (only the called function's module is loaded)
// ─────────────────────────────────────────────

// Orders
export const createOrder = functions
  .region('asia-east1')
  .https.onCall(async (data, context) => {
    const { createOrder: fn } = await import('./orders/createOrder');
    return fn.run(data, context);
  });

// Cloudinary
export const getCloudinarySignature = functions
  .region('asia-east1')
  .https.onCall(async (data, context) => {
    const { getCloudinarySignature: fn } = await import('./cloudinary/sign');
    return fn.run(data, context);
  });

// Admin Roles
export const grantAdminRole = functions
  .region('asia-east1')
  .https.onCall(async (data, context) => {
    const { grantAdminRole: fn } = await import('./roles/grantRole');
    return fn.run(data, context);
  });

export const revokeAdminRole = functions
  .region('asia-east1')
  .https.onCall(async (data, context) => {
    const { revokeAdminRole: fn } = await import('./roles/grantRole');
    return fn.run(data, context);
  });

// ─────────────────────────────────────────────
// Payment Stubs
// These are exported as HTTPS Callable functions.
// They currently return a clear NOT_IMPLEMENTED error.
// Once bKash/Nagad merchant accounts are obtained and
// the implementations in payments/bkash.ts and payments/nagad.ts
// are completed, replace these stubs with real calls.
// ─────────────────────────────────────────────

export const initiateBkashPayment = functions
  .region('asia-east1')
  .https.onCall(async (data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { initiateBkashPayment: fn } = await import('./payments/bkash');
    const req = data as { orderId: string; amount: number; orderReference: string };

    if (!req.orderId || !req.amount || !req.orderReference) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId, amount, and orderReference are required.');
    }

    return fn(req.orderId, req.amount, req.orderReference);
  });

export const verifyBkashPayment = functions
  .region('asia-east1')
  .https.onCall(async (data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { verifyBkashPayment: fn } = await import('./payments/bkash');
    const req = data as { paymentId: string };

    if (!req.paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'paymentId is required.');
    }

    return fn(req.paymentId);
  });

export const initiateNagadPayment = functions
  .region('asia-east1')
  .https.onCall(async (data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { initiateNagadPayment: fn } = await import('./payments/nagad');
    const req = data as { orderId: string; amount: number; orderReference: string };

    if (!req.orderId || !req.amount || !req.orderReference) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId, amount, and orderReference are required.');
    }

    return fn(req.orderId, req.amount, req.orderReference);
  });

export const verifyNagadPayment = functions
  .region('asia-east1')
  .https.onCall(async (data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { verifyNagadPayment: fn } = await import('./payments/nagad');
    const req = data as { paymentRefId: string };

    if (!req.paymentRefId) {
      throw new functions.https.HttpsError('invalid-argument', 'paymentRefId is required.');
    }

    return fn(req.paymentRefId);
  });

// ─────────────────────────────────────────────
// Auth Triggers
// ─────────────────────────────────────────────

/**
 * Automatically creates a Firestore user profile document
 * whenever a new user registers via Firebase Authentication.
 */
export const onUserCreated = functions
  .region('asia-east1')
  .auth.user()
  .onCreate(async (user) => {
    const { db, FieldValue } = await import('./shared/admin');

    try {
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        phoneNumber: user.phoneNumber ?? null,
        emailVerified: user.emailVerified,
        provider: user.providerData?.[0]?.providerId ?? 'email',
        role: null, // Role is NEVER set here — only via grantAdminRole
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      functions.logger.info('onUserCreated: user profile created', { uid: user.uid });
    } catch (err) {
      functions.logger.error('onUserCreated: failed to create user profile', { uid: user.uid, err });
    }
  });

/**
 * Cleans up user data when a Firebase Auth account is deleted.
 * Deletes the Firestore user profile. Cart and wishlist cleanup
 * is deferred to a scheduled function to avoid timeout issues.
 */
export const onUserDeleted = functions
  .region('asia-east1')
  .auth.user()
  .onDelete(async (user) => {
    const { db } = await import('./shared/admin');

    try {
      await db.collection('users').doc(user.uid).delete();
      functions.logger.info('onUserDeleted: user profile deleted', { uid: user.uid });
    } catch (err) {
      functions.logger.error('onUserDeleted: failed to delete user profile', { uid: user.uid, err });
    }
  });
