import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  serverTimestamp as firestoreServerTimestamp,
  type Firestore,
  type FieldValue,
} from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Firebase config — values injected at build time from .env
// ---------------------------------------------------------------------------
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKey1234567890';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'womens-favorite-demo';

const firebaseConfig = {
  apiKey,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO12345',
};

// ---------------------------------------------------------------------------
// Singleton initialisation (safe for HMR / SSR)
// ---------------------------------------------------------------------------
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export const isFirebaseConfigured: boolean = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('Placeholder') &&
  !import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('demo')
);

// ---------------------------------------------------------------------------
// Re-export server timestamp helper
// ---------------------------------------------------------------------------
/** Returns a Firestore server timestamp sentinel. Use instead of `new Date()` for Firestore writes. */
function serverTimestamp(): FieldValue {
  return firestoreServerTimestamp();
}

// ---------------------------------------------------------------------------
// Bangla-friendly Firebase error messages
// ---------------------------------------------------------------------------

/** Maps Firebase error codes to user-friendly Bangla messages. */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'auth/invalid-credential':          'ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।',
  'auth/invalid-email':               'ইমেইল ঠিকানাটি সঠিক ফরম্যাটে নেই।',
  'auth/email-already-in-use':        'এই ইমেইল দিয়ে আগেই একটি অ্যাকাউন্ট খোলা হয়েছে।',
  'auth/weak-password':               'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
  'auth/user-not-found':              'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
  'auth/wrong-password':              'পাসওয়ার্ডটি সঠিক নয়।',
  'auth/too-many-requests':           'অনেকবার ব্যর্থ চেষ্টা। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  'auth/user-disabled':               'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।',
  'auth/network-request-failed':      'নেটওয়ার্ক সমস্যা হয়েছে। আপনার সংযোগ পরীক্ষা করুন।',
  'auth/requires-recent-login':       'নিরাপত্তার জন্য আবার লগইন করুন, তারপর চেষ্টা করুন।',
  'auth/account-exists-with-different-credential':
                                      'এই ইমেইল অন্য পদ্ধতিতে নিবন্ধিত আছে।',
  'auth/popup-closed-by-user':        'লগইন উইন্ডো বন্ধ হয়ে গেছে। আবার চেষ্টা করুন।',
  'auth/cancelled-popup-request':     'লগইন অনুরোধ বাতিল হয়েছে।',
  'auth/operation-not-allowed':       'এই লগইন পদ্ধতি এখন সক্রিয় নয়।',
  'auth/provider-already-linked':     'এই অ্যাকাউন্ট ইতিমধ্যে সংযুক্ত আছে।',
  'auth/credential-already-in-use':   'এই তথ্য অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে।',
  'auth/missing-email':               'ইমেইল ঠিকানা দেওয়া হয়নি।',
  'auth/missing-password':            'পাসওয়ার্ড দেওয়া হয়নি।',
  'auth/expired-action-code':         'লিঙ্কটির মেয়াদ শেষ হয়ে গেছে। নতুন লিঙ্কের জন্য আবেদন করুন।',
  'auth/invalid-action-code':         'লিঙ্কটি অকার্যকর। নতুন লিঙ্কের জন্য আবেদন করুন।',

  // Firestore
  'permission-denied':                'এই তথ্য দেখার বা পরিবর্তন করার অনুমতি নেই।',
  'not-found':                        'অনুরোধ করা তথ্য পাওয়া যায়নি।',
  'already-exists':                   'এই তথ্য আগেই বিদ্যমান।',
  'resource-exhausted':               'অনেক বেশি অনুরোধ পাঠানো হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।',
  'unavailable':                      'সার্ভার এখন পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।',
  'unauthenticated':                  'এই কাজের জন্য লগইন করা আবশ্যক।',
  'internal':                         'একটি অভ্যন্তরীণ ত্রুটি ঘটেছে। পরে আবার চেষ্টা করুন।',
  'data-loss':                        'ডেটা ক্ষতি হয়েছে। সাপোর্টে যোগাযোগ করুন।',
  'deadline-exceeded':                'অনুরোধ সম্পন্ন হতে বেশি সময় লাগছে।',
  'aborted':                          'অপারেশন বাতিল হয়েছে। আবার চেষ্টা করুন।',
  'cancelled':                        'অপারেশন বাতিল করা হয়েছে।',
};

/** Default fallback message in Bangla */
const DEFAULT_ERROR_MESSAGE = 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';

/**
 * Converts any Firebase error (or unknown throw) into a user-friendly Bangla string.
 *
 * @example
 * ```ts
 * try {
 *   await signInWithEmailAndPassword(auth, email, password);
 * } catch (err) {
 *   toast.error(getErrorMessage(err));
 * }
 * ```
 */
function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) return DEFAULT_ERROR_MESSAGE;

  // Firebase errors expose a `code` property
  if (typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (typeof code === 'string' && FIREBASE_ERROR_MESSAGES[code]) {
      return FIREBASE_ERROR_MESSAGES[code];
    }
  }

  // Plain Error objects
  if (error instanceof Error && error.message) {
    // Check if the message itself contains a known code
    const matched = Object.keys(FIREBASE_ERROR_MESSAGES).find((key) =>
      error.message.includes(key),
    );
    if (matched) return FIREBASE_ERROR_MESSAGES[matched];
  }

  return DEFAULT_ERROR_MESSAGE;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { app, auth, db, serverTimestamp, getErrorMessage };
