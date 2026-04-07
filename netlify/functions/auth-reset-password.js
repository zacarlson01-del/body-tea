const crypto = require('crypto');
const { formatResponse, query, hashPassword } = require('./auth-utils');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const token = typeof payload.token === 'string' ? payload.token.trim() : '';
    const newPassword = typeof payload.new_password === 'string' ? payload.new_password : '';

    if (!token || !newPassword) {
      return formatResponse(400, { error: 'Token and new password are required' });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[@$!%*?&]/.test(newPassword)) {
      return formatResponse(400, {
        error: 'Password must be at least 8 characters with uppercase, number, and special character',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetStore = getStore('password-reset-requests');
    const key = `reset_${tokenHash}`;
    const recordRaw = await resetStore.get(key, { type: 'text' });

    if (!recordRaw) {
      return formatResponse(400, { error: 'Invalid reset token' });
    }

    const record = JSON.parse(recordRaw);
    if (!record.expiresAt || new Date(record.expiresAt).getTime() < Date.now()) {
      return formatResponse(400, { error: 'Reset token has expired' });
    }

    const userId = record.userId;
    if (!userId) {
      return formatResponse(400, { error: 'Invalid reset token payload' });
    }

    const passwordHash = await hashPassword(newPassword);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address)
       VALUES ($1, 'reset_password', 'success', $2)`,
      [userId, event.requestContext?.identity?.sourceIp || 'unknown']
    );

    await resetStore.delete(key);

    return formatResponse(200, { message: 'Password reset successful' });
  } catch (error) {
    console.error('reset-password function error', error);
    return formatResponse(500, { error: 'Failed to reset password' });
  }
};
