// ============================================================
// functions/src/payments/nagad.ts
// Nagad Payment Gateway Integration — STUB / NOT_IMPLEMENTED
// ============================================================
//
// ⚠️  STATUS: NOT_IMPLEMENTED
// This file provides the integration structure and documentation
// for the Nagad DFS (Digital Financial Services) payment API.
// It must be completed before Nagad payments can be processed.
//
// ─────────────────────────────────────────────
// SETUP REQUIREMENTS (complete these before implementing):
// ─────────────────────────────────────────────
//
// 1. MERCHANT ACCOUNT
//    Apply for a Nagad merchant account at:
//    → https://nagad.com.bd/merchant/
//    → Hotline: 16167
//    → Required docs: Trade license, NID of proprietor, bank account info
//    You will receive: Merchant ID, Merchant Private Key, Nagad PGW Public Key
//
// 2. FIREBASE FUNCTIONS CONFIG (set these with Firebase CLI):
//    firebase functions:config:set \
//      nagad.merchant_id="YOUR_MERCHANT_ID" \
//      nagad.merchant_private_key="YOUR_RSA_PRIVATE_KEY_BASE64" \
//      nagad.pgw_public_key="NAGAD_RSA_PUBLIC_KEY_BASE64" \
//      nagad.sandbox="true"
//
//    For production, set nagad.sandbox="false"
//
// 3. API ENDPOINTS
//    Sandbox:    http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0
//    Production: https://api.mynagad.com/api/dfs
//
// 4. CALLBACK URL
//    Register your Firebase Function URL with Nagad support:
//    https://asia-east1-YOUR_PROJECT_ID.cloudfunctions.net/nagadCallback
//    (Must be HTTPS with valid SSL)
//
// 5. INTEGRATION FLOW (Nagad DFS API)
//    Step 1: Initiate payment
//            → GET /check-out/initialize/{merchantId}/{orderId}
//            → Headers include sensitive_data (RSA encrypted), signature
//    Step 2: Nagad returns callBackUrl — redirect user there
//    Step 3: User completes payment on Nagad app/web
//    Step 4: Nagad calls your callbackURL with payment_ref_id
//    Step 5: Complete payment
//            → POST /check-out/complete/{paymentRefId}
//    Step 6: Verify payment status
//            → GET /verify/payment/{paymentRefId}
//
// 6. RSA ENCRYPTION REQUIREMENTS
//    - sensitive_data must be RSA encrypted with Nagad PGW Public Key
//    - Your request signature must be RSA signed with your Merchant Private Key
//    - Keys are RSA 2048-bit, PEM format (base64-encoded for storage)
//    - Use Node.js built-in 'crypto' module for signing
//    - Library: no external library needed — use crypto.privateEncrypt /
//      crypto.publicEncrypt with RSA_PKCS1_PADDING
//
// 7. SENSITIVE_DATA STRUCTURE (JSON → Base64 → RSA encrypted):
//    {
//      merchantId: "YOUR_MERCHANT_ID",
//      datetime: "YYYYMMDDHHMMSS",
//      orderId: "WF-20240101-ABCD",
//      challenge: "UNIQUE_RANDOM_STRING"
//    }
//
// 8. SECURITY
//    - Always verify payment amount in completion/verify step
//    - Check transaction status is "Success" before fulfilling order
//    - Store payment_ref_id in Firestore for reconciliation
//    - Never store private keys in source code — use Functions config
//
// ─────────────────────────────────────────────
// REFERENCE DOCUMENTATION
// ─────────────────────────────────────────────
// API Docs: https://nagad.com.bd/merchant/ (requires login)
// Tech support: devops@nagad.com.bd
// ============================================================

import * as functions from 'firebase-functions';
import axios from 'axios';
import crypto from 'crypto';
import { PaymentInitiateResponse, PaymentVerifyResponse } from '../shared/types';

// ─────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────

interface NagadConfig {
  merchantId: string;
  merchantPrivateKey: string; // Base64-encoded RSA private key PEM
  pgwPublicKey: string;       // Base64-encoded Nagad PGW public key PEM
  baseUrl: string;
}

function getNagadConfig(): NagadConfig {
  const config = functions.config();
  const isSandbox = config.nagad?.sandbox !== 'false';
  const baseUrl = isSandbox
    ? 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0'
    : 'https://api.mynagad.com/api/dfs';

  return {
    merchantId: config.nagad?.merchant_id ?? '',
    merchantPrivateKey: config.nagad?.merchant_private_key ?? '',
    pgwPublicKey: config.nagad?.pgw_public_key ?? '',
    baseUrl,
  };
}

function isConfigured(): boolean {
  const config = functions.config();
  return !!(
    config.nagad?.merchant_id &&
    config.nagad?.merchant_private_key &&
    config.nagad?.pgw_public_key
  );
}

// ─────────────────────────────────────────────
// Crypto helpers (NOT_IMPLEMENTED — templates only)
// ─────────────────────────────────────────────

/**
 * NOT_IMPLEMENTED — Template for RSA encryption with Nagad PGW public key.
 * Encrypts plaintext data using Nagad's RSA public key (PKCS#1 padding).
 */
function encryptWithNagadPublicKey(plaintext: string, publicKeyBase64: string): string {
  // TODO: Implement
  // const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf8');
  // const encrypted = crypto.publicEncrypt(
  //   { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
  //   Buffer.from(plaintext, 'utf8')
  // );
  // return encrypted.toString('base64');
  throw new Error('NOT_IMPLEMENTED: encryptWithNagadPublicKey');
}

/**
 * NOT_IMPLEMENTED — Template for RSA signature with merchant private key.
 * Signs the plaintext using merchant's RSA private key (PKCS#1 padding).
 */
function signWithMerchantPrivateKey(plaintext: string, privateKeyBase64: string): string {
  // TODO: Implement
  // const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
  // const sign = crypto.createSign('SHA256');
  // sign.update(plaintext);
  // sign.end();
  // return sign.sign(privateKeyPem, 'base64');
  throw new Error('NOT_IMPLEMENTED: signWithMerchantPrivateKey');
}

/**
 * NOT_IMPLEMENTED — Generates the datetime string required by Nagad API.
 * Format: YYYYMMDDHHMMSS
 */
function nagadDatetime(): string {
  // TODO: Implement
  const now = new Date();
  return now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * NOT_IMPLEMENTED
 *
 * Initiates a Nagad DFS payment for the given order.
 *
 * @param orderId         - Firestore order document ID
 * @param amount          - Payment amount in BDT
 * @param orderReference  - Human-readable order reference (e.g. WF-20240101-ABCD)
 * @returns               - PaymentInitiateResponse with paymentUrl on success
 *
 * IMPLEMENTATION STEPS:
 * 1. Build sensitiveData JSON: { merchantId, datetime, orderId: orderReference, challenge }
 * 2. Encrypt sensitiveData with Nagad PGW Public Key → sensitiveDataEncrypted
 * 3. Sign sensitiveDataEncrypted with Merchant Private Key → signature
 * 4. GET /check-out/initialize/{merchantId}/{orderReference}
 *    Headers: X-KM-IP-V4, X-KM-Client-Type: PC, X-KM-Api-Version: v-0.2.0
 *    Body: { dateTime, sensitiveData: sensitiveDataEncrypted, signature }
 * 5. Nagad returns { callBackUrl, tokenNumber } — redirect user to callBackUrl
 * 6. Save tokenNumber in Firestore for verification
 */
export async function initiateNagadPayment(
  orderId: string,
  amount: number,
  orderReference: string
): Promise<PaymentInitiateResponse> {
  if (!isConfigured()) {
    functions.logger.error('initiateNagadPayment: Nagad config not set in Firebase Functions config');
    return {
      success: false,
      error: 'Nagad payment gateway is not configured. Contact the administrator.',
      errorCode: 'NAGAD_NOT_CONFIGURED',
    };
  }

  // ⚠️ NOT_IMPLEMENTED — replace the block below with real implementation
  functions.logger.warn('initiateNagadPayment: NOT_IMPLEMENTED', { orderId, amount, orderReference });

  return {
    success: false,
    error: 'Nagad payment integration is not yet active.',
    errorCode: 'NOT_IMPLEMENTED',
  };

  /*
  // IMPLEMENTATION TEMPLATE (uncomment and complete):
  try {
    const cfg = getNagadConfig();
    const datetime = nagadDatetime();
    const challenge = crypto.randomBytes(16).toString('hex');

    const sensitiveDataPlain = JSON.stringify({
      merchantId: cfg.merchantId,
      datetime,
      orderId: orderReference,
      challenge,
    });

    const sensitiveDataEncrypted = encryptWithNagadPublicKey(sensitiveDataPlain, cfg.pgwPublicKey);
    const signature = signWithMerchantPrivateKey(sensitiveDataEncrypted, cfg.merchantPrivateKey);

    const response = await axios.post(
      `${cfg.baseUrl}/check-out/initialize/${cfg.merchantId}/${orderReference}`,
      { dateTime: datetime, sensitiveData: sensitiveDataEncrypted, signature },
      {
        headers: {
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': '127.0.0.1',
          'X-KM-Client-Type': 'PC',
          'Content-Type': 'application/json',
        },
      }
    );

    const { callBackUrl, tokenNumber, reason } = response.data;

    if (!callBackUrl) {
      return { success: false, error: reason ?? 'Nagad initiation failed', errorCode: 'NAGAD_INIT_FAILED' };
    }

    return { success: true, paymentUrl: callBackUrl, paymentId: tokenNumber };
  } catch (err) {
    functions.logger.error('initiateNagadPayment: error', err);
    return { success: false, error: 'Nagad payment initiation failed.', errorCode: 'NAGAD_ERROR' };
  }
  */
}

/**
 * NOT_IMPLEMENTED
 *
 * Verifies a Nagad payment after user completes it.
 * Call this from the Nagad callback Cloud Function.
 *
 * @param paymentRefId - The payment_ref_id returned by Nagad callback
 * @returns            - PaymentVerifyResponse with transaction status
 *
 * IMPLEMENTATION STEPS:
 * 1. POST /check-out/complete/{paymentRefId}
 *    Headers: same as initiation
 *    Body: { sensitiveData (encrypted amount & merchantId), signature }
 * 2. Verify the returned amount matches the order total in Firestore
 * 3. Check status === 'Success'
 * 4. Update Firestore order.payment.status = 'completed'
 * 5. Return transactionId for reconciliation
 */
export async function verifyNagadPayment(
  paymentRefId: string
): Promise<PaymentVerifyResponse> {
  if (!isConfigured()) {
    return {
      success: false,
      status: 'failed',
      error: 'Nagad payment gateway is not configured.',
    };
  }

  // ⚠️ NOT_IMPLEMENTED
  functions.logger.warn('verifyNagadPayment: NOT_IMPLEMENTED', { paymentRefId });

  return {
    success: false,
    status: 'failed',
    error: 'Nagad payment verification is not yet active.',
  };
}
