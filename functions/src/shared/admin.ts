// ============================================================
// functions/src/shared/admin.ts
// Firebase Admin SDK initialization — singleton pattern
// ============================================================
// This module initialises the Admin SDK once and exports the
// db and auth instances for use by all Cloud Functions.
// When running inside the Cloud Functions environment the SDK
// automatically picks up the service account credentials
// associated with the project — no key file required.
// ============================================================

import * as admin from 'firebase-admin';

// ─────────────────────────────────────────────
// Initialise Admin SDK (idempotent)
// ─────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp();
}

// ─────────────────────────────────────────────
// Firestore instance (Admin SDK bypasses security rules)
// ─────────────────────────────────────────────
const db: FirebaseFirestore.Firestore = admin.firestore();

// ─────────────────────────────────────────────
// Auth instance
// ─────────────────────────────────────────────
const auth: admin.auth.Auth = admin.auth();

// ─────────────────────────────────────────────
// Timestamp helper
// ─────────────────────────────────────────────
const { FieldValue } = admin.firestore;
const { Timestamp } = admin.firestore;

/**
 * Returns the admin Firestore instance.
 * Useful when you want to be explicit about which Firestore
 * client you are using in a multi-module codebase.
 */
function getAdminFirestore(): FirebaseFirestore.Firestore {
  return db;
}

/**
 * Returns the admin Auth instance.
 */
function getAdminAuth(): admin.auth.Auth {
  return auth;
}

export {
  admin,
  db,
  auth,
  FieldValue,
  Timestamp,
  getAdminFirestore,
  getAdminAuth,
};
