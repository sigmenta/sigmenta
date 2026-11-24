// ============================================================
// functions/src/cloudinary/sign.ts
// Cloud Function: getCloudinarySignature (HTTPS Callable)
// ============================================================
// Generates a signed upload request for Cloudinary.
// The CLOUDINARY_API_SECRET is NEVER sent to the client —
// it lives only in Firebase Functions config.
//
// SETUP:
//   firebase functions:config:set \
//     cloudinary.api_secret="YOUR_API_SECRET" \
//     cloudinary.api_key="YOUR_API_KEY" \
//     cloudinary.cloud_name="YOUR_CLOUD_NAME"
//
// RATE LIMITING:
//   Each user is limited to 20 signed upload requests per hour.
//   Counters are stored in Firestore: rateLimitCounters/{uid}_cloudinary
//   This prevents abuse of the signing endpoint.
// ============================================================

import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { db, FieldValue, Timestamp } from '../shared/admin';
import { CloudinarySignRequest, CloudinarySignResponse } from '../shared/types';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_UPLOADS_PER_HOUR = 20;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';

interface CloudinaryConfig {
  apiSecret: string;
  apiKey: string;
  cloudName: string;
}

function getCloudinaryConfig(): CloudinaryConfig {
  const config = functions.config();
  return {
    apiSecret: config.cloudinary?.api_secret ?? '',
    apiKey: config.cloudinary?.api_key ?? '',
    cloudName: config.cloudinary?.cloud_name ?? '',
  };
}

function isConfigured(cfg: CloudinaryConfig): boolean {
  return !!(cfg.apiSecret && cfg.apiKey && cfg.cloudName);
}

// ─────────────────────────────────────────────
// Rate limit check
// ─────────────────────────────────────────────
interface RateLimitCounter {
  count: number;
  windowStart: FirebaseFirestore.Timestamp;
}

async function checkRateLimit(uid: string): Promise<{ allowed: boolean; remaining: number }> {
  const counterRef = db.collection('rateLimitCounters').doc(`${uid}_cloudinary`);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  let allowed = false;
  let remaining = 0;

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);

    if (!doc.exists) {
      // First request — initialise counter
      tx.set(counterRef, {
        count: 1,
        windowStart: Timestamp.fromDate(now),
      });
      allowed = true;
      remaining = MAX_UPLOADS_PER_HOUR - 1;
      return;
    }

    const data = doc.data() as RateLimitCounter;
    const windowStart = data.windowStart.toDate();

    if (windowStart < oneHourAgo) {
      // Window expired — reset
      tx.set(counterRef, {
        count: 1,
        windowStart: Timestamp.fromDate(now),
      });
      allowed = true;
      remaining = MAX_UPLOADS_PER_HOUR - 1;
      return;
    }

    if (data.count >= MAX_UPLOADS_PER_HOUR) {
      allowed = false;
      remaining = 0;
      return;
    }

    tx.update(counterRef, { count: FieldValue.increment(1) });
    allowed = true;
    remaining = MAX_UPLOADS_PER_HOUR - data.count - 1;
  });

  return { allowed, remaining };
}

// ─────────────────────────────────────────────
// Cloudinary SHA-1 signature generation
// ─────────────────────────────────────────────

/**
 * Generates a Cloudinary upload signature.
 *
 * The signature is a SHA-1 hash of the sorted parameter string
 * appended with the API secret.
 *
 * Reference: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
function generateSignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  // Sort params alphabetically, join as key=value pairs, then append secret
  const paramString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(paramString + apiSecret)
    .digest('hex');
}

// ─────────────────────────────────────────────
// Cloud Function: getCloudinarySignature
// ─────────────────────────────────────────────
export const getCloudinarySignature = functions
  .region('asia-east1')
  .https.onCall(async (
    data: unknown,
    context
  ): Promise<CloudinarySignResponse> => {

    // ── Authentication ──
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to upload images.'
      );
    }

    const uid = context.auth.uid;

    // ── Validate request ──
    const requestData = data as Partial<CloudinarySignRequest>;
    const folder = typeof requestData?.folder === 'string' && requestData.folder.trim()
      ? requestData.folder.trim()
      : 'products';

    // Restrict allowed folders to prevent arbitrary path uploads
    const allowedFolders = ['products', 'categories', 'banners', 'avatars'];
    if (!allowedFolders.includes(folder)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid upload folder. Allowed: ${allowedFolders.join(', ')}`
      );
    }

    // ── Cloudinary config check ──
    const cfg = getCloudinaryConfig();
    if (!isConfigured(cfg)) {
      functions.logger.error('getCloudinarySignature: Cloudinary config not set');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Image upload service is not configured. Contact the administrator.'
      );
    }

    // ── Rate limit check ──
    const { allowed, remaining } = await checkRateLimit(uid);
    if (!allowed) {
      functions.logger.warn('getCloudinarySignature: rate limit exceeded', { uid });
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Upload limit reached. You can upload up to 20 images per hour. Please try again later.'
      );
    }

    // ── Generate signature ──
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
      allowed_formats: ALLOWED_FORMATS,
      max_file_size: MAX_FILE_SIZE_BYTES,
    };

    const signature = generateSignature(paramsToSign, cfg.apiSecret);

    functions.logger.info('getCloudinarySignature: signature generated', {
      uid,
      folder,
      remaining,
    });

    return {
      signature,
      timestamp,
      apiKey: cfg.apiKey,
      cloudName: cfg.cloudName,
      folder,
    };
  });
