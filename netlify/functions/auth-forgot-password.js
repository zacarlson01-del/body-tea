const crypto = require('crypto');
const { formatResponse, query, getClientIp } = require('./auth-utils');
const { getStore } = require('@netlify/blobs');
const { checkRateLimit } = require('./rate-limit');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
    const clientIp = getClientIp(event);
    const rate = await checkRateLimit({
      namespace: 'auth-forgot-password-ip',
      key: clientIp,
      limit: 5,
      windowSec: 900,
    });
    if (!rate.allowed) {
      return formatResponse(429, { error: 'Too many password reset requests. Please try again later.' });
    }

    const payload = JSON.parse(event.body || '{}');
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return formatResponse(400, { error: 'Valid email is required' });
    }

    const userResult = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    // Always return success-style message to avoid account enumeration.
    if (userResult.rows.length === 0) {
      return formatResponse(200, {
        message: 'If this email is registered, a password reset link has been generated.',
      });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    const resetStore = getStore('password-reset-requests');
    await resetStore.set(`reset_${resetTokenHash}`, JSON.stringify({
      userId: user.id,
      email: user.email,
      tokenHash: resetTokenHash,
      expiresAt,
      createdAt: new Date().toISOString(),
    }), {
      metadata: {
        userId: String(user.id),
        expiresAt,
      },
    });

    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address, details)
       VALUES ($1, 'forgot_password', 'requested', $2, $3)`,
      [
        user.id,
        clientIp,
        JSON.stringify({ expiresAt }),
      ]
    );

    return formatResponse(200, {
      message: 'If this email is registered, a password reset link has been generated.',
    });
  } catch (error) {
    console.error('forgot-password function error', error);
    return formatResponse(500, { error: 'Failed to process password reset request' });
  }
};
