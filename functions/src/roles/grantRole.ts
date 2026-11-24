// ============================================================
// functions/src/roles/grantRole.ts
// Cloud Functions: grantAdminRole & revokeAdminRole
// ============================================================
// Only callable by a user with the super_admin custom claim.
// Sets Firebase Auth custom claims and updates Firestore.
// Writes an audit log entry for every role change.
// ============================================================

import * as functions from 'firebase-functions';
import { z } from 'zod';
import { db, auth, FieldValue } from '../shared/admin';
import {
  AdminRole,
  GrantRoleRequest,
  GrantRoleResponse,
  AuditLogEntry,
} from '../shared/types';

// ─────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────
const GrantRoleSchema = z.object({
  targetUid: z.string().min(1, 'targetUid is required'),
  role: z.enum(['admin', 'super_admin']),
});

// ─────────────────────────────────────────────
// Audit log helper
// ─────────────────────────────────────────────
async function writeAuditLog(
  entry: Omit<AuditLogEntry, 'createdAt'>
): Promise<void> {
  try {
    await db.collection('auditLogs').add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    functions.logger.error('grantRole: failed to write audit log', { entry, err });
  }
}

// ─────────────────────────────────────────────
// Cloud Function: grantAdminRole
// ─────────────────────────────────────────────
export const grantAdminRole = functions
  .region('asia-east1')
  .https.onCall(async (
    data: unknown,
    context
  ): Promise<GrantRoleResponse> => {

    // ── Authentication ──
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }

    // ── Authorization: only super_admin may grant roles ──
    if (context.auth.token.role !== 'super_admin') {
      functions.logger.warn('grantAdminRole: unauthorized attempt', {
        callerUid: context.auth.uid,
        callerRole: context.auth.token.role,
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only a super_admin can grant admin roles.'
      );
    }

    const callerUid = context.auth.uid;

    // ── Validate input ──
    let parsed: GrantRoleRequest;
    try {
      parsed = GrantRoleSchema.parse(data) as GrantRoleRequest;
    } catch (err) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid request. Provide targetUid and role (admin | super_admin).'
      );
    }

    const { targetUid, role } = parsed;

    // ── Prevent self-demotion / circular escalation concerns ──
    // (super_admin can still grant themselves roles for emergency use)

    // ── Verify target user exists ──
    let targetUser: admin.auth.UserRecord;
    try {
      targetUser = await auth.getUser(targetUid);
    } catch (err) {
      throw new functions.https.HttpsError(
        'not-found',
        `User not found: ${targetUid}`
      );
    }

    // ── Set custom claim on Firebase Auth ──
    try {
      await auth.setCustomUserClaims(targetUid, { role });
    } catch (err) {
      functions.logger.error('grantAdminRole: failed to set custom claims', { targetUid, role, err });
      throw new functions.https.HttpsError(
        'internal',
        'Failed to set custom claims. Please try again.'
      );
    }

    // ── Update Firestore users/{targetUid}.role ──
    try {
      await db.collection('users').doc(targetUid).set(
        {
          role,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      functions.logger.error('grantAdminRole: failed to update Firestore role', { targetUid, role, err });
      // Custom claim was set; log the inconsistency but don't fail
    }

    // ── Audit log ──
    await writeAuditLog({
      action: 'role_granted',
      performedBy: callerUid,
      targetType: 'user',
      targetId: targetUid,
      metadata: {
        role,
        targetEmail: targetUser.email ?? 'unknown',
      },
    });

    functions.logger.info('grantAdminRole: success', {
      callerUid,
      targetUid,
      role,
    });

    return {
      success: true,
      message: `Role '${role}' granted to user ${targetUid} (${targetUser.email ?? 'no email'}).`,
    };
  });

// ─────────────────────────────────────────────
// Cloud Function: revokeAdminRole
// ─────────────────────────────────────────────
export const revokeAdminRole = functions
  .region('asia-east1')
  .https.onCall(async (
    data: unknown,
    context
  ): Promise<GrantRoleResponse> => {

    // ── Authentication ──
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }

    // ── Authorization: only super_admin may revoke roles ──
    if (context.auth.token.role !== 'super_admin') {
      functions.logger.warn('revokeAdminRole: unauthorized attempt', {
        callerUid: context.auth.uid,
        callerRole: context.auth.token.role,
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only a super_admin can revoke admin roles.'
      );
    }

    const callerUid = context.auth.uid;

    // ── Validate input ──
    const targetUidSchema = z.object({ targetUid: z.string().min(1) });
    let parsed: { targetUid: string };
    try {
      parsed = targetUidSchema.parse(data);
    } catch {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid request. Provide targetUid.'
      );
    }

    const { targetUid } = parsed;

    // ── Prevent revoking own super_admin role (safety guard) ──
    if (targetUid === callerUid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You cannot revoke your own super_admin role. Ask another super_admin.'
      );
    }

    // ── Verify target user exists ──
    let targetUser: admin.auth.UserRecord;
    try {
      targetUser = await auth.getUser(targetUid);
    } catch {
      throw new functions.https.HttpsError('not-found', `User not found: ${targetUid}`);
    }

    // ── Clear custom claims (set role to null / undefined) ──
    try {
      await auth.setCustomUserClaims(targetUid, { role: null });
    } catch (err) {
      functions.logger.error('revokeAdminRole: failed to clear custom claims', { targetUid, err });
      throw new functions.https.HttpsError('internal', 'Failed to revoke custom claims.');
    }

    // ── Update Firestore ──
    try {
      await db.collection('users').doc(targetUid).set(
        {
          role: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      functions.logger.error('revokeAdminRole: failed to update Firestore', { targetUid, err });
    }

    // ── Audit log ──
    await writeAuditLog({
      action: 'role_revoked',
      performedBy: callerUid,
      targetType: 'user',
      targetId: targetUid,
      metadata: {
        targetEmail: targetUser.email ?? 'unknown',
      },
    });

    functions.logger.info('revokeAdminRole: success', { callerUid, targetUid });

    return {
      success: true,
      message: `Admin role revoked for user ${targetUid} (${targetUser.email ?? 'no email'}).`,
    };
  });

// Required for TypeScript to resolve admin.auth.UserRecord without import
import admin from 'firebase-admin';
