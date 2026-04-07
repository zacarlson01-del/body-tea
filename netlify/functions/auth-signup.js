const { formatResponse, getCorsHeaders, query, hashPassword, generateAccessToken, generateRefreshToken, hashToken, getClientIp, buildSignedProfilePictureUrl } = require('./auth-utils');
const { getStore } = require('@netlify/blobs');
const { checkRateLimit } = require('./rate-limit');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024; // 5MB

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    base64Data: match[2],
  };
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'bin';
}

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
      namespace: 'auth-signup-ip',
      key: clientIp,
      limit: 5,
      windowSec: 300,
    });
    if (!rate.allowed) {
      return formatResponse(429, { error: 'Too many signup attempts. Please try again later.' });
    }

    const payload = JSON.parse(event.body || '{}');
    const {
      email,
      first_name,
      last_name,
      password,
      phone,
      gender,
      date_of_birth,
      affiliated_authorities,
      postal_code,
      escrow_deposit_amount,
      duration_days,
      personal_item,
      profile_picture_data_url,
    } = payload;

    if (!email || !first_name || !last_name || !password) {
      return formatResponse(400, { error: 'Required field missing' });
    }

    if (typeof email !== 'string' || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return formatResponse(400, { error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return formatResponse(400, { error: 'Password must be at least 8 characters' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return formatResponse(409, { error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    const createUser = await query(
      `INSERT INTO users (email, first_name, last_name, password_hash, phone, gender, date_of_birth, affiliated_authorities, postal_code, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
       RETURNING id, email, first_name, last_name, profile_picture_url`,
      [
        email.toLowerCase(),
        first_name,
        last_name,
        passwordHash,
        phone || null,
        gender || null,
        date_of_birth || null,
        affiliated_authorities || null,
        postal_code || null,
      ]
    );

    const user = createUser.rows[0];
    let profilePictureUrl = user.profile_picture_url || null;

    if (profile_picture_data_url) {
      const parsedDataUrl = parseDataUrl(profile_picture_data_url);
      if (!parsedDataUrl) {
        return formatResponse(400, { error: 'Invalid profile picture format' });
      }
      if (!ALLOWED_IMAGE_TYPES.has(parsedDataUrl.mimeType)) {
        return formatResponse(400, { error: 'Unsupported profile picture type' });
      }

      const imageBuffer = Buffer.from(parsedDataUrl.base64Data, 'base64');
      if (imageBuffer.length === 0 || imageBuffer.length > MAX_PROFILE_PICTURE_BYTES) {
        return formatResponse(400, { error: 'Profile picture must be between 1 byte and 5MB' });
      }

      const ext = extensionFromMime(parsedDataUrl.mimeType);
      const blobKey = `profiles/${user.id}/${Date.now()}.${ext}`;
      const pictureStore = getStore('profile-pictures');
      await pictureStore.set(blobKey, imageBuffer, {
        metadata: {
          mimeType: parsedDataUrl.mimeType,
          uploadedAt: new Date().toISOString(),
        },
      });

      profilePictureUrl = buildSignedProfilePictureUrl({ key: blobKey, mimeType: parsedDataUrl.mimeType });
      await query(
        `UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2`,
        [blobKey, user.id]
      );
    }

    const accountId = `ISEA-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    await query(
      `INSERT INTO escrow_accounts
       (user_id, account_id, escrow_deposit_amount, duration_days, personal_item, status, account_status)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'pending')`,
      [
        user.id,
        accountId,
        escrow_deposit_amount || null,
        duration_days || null,
        personal_item || null,
      ]
    );

    const initialAmount = Number(escrow_deposit_amount || 0);
    const nxtAmount = Number(escrow_deposit_amount || 500);
    const releaseCondition = 'Compliance';
    const txReference = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const txDescription = personal_item
      ? `Escrow setup for ${String(personal_item).trim()}`
      : 'Escrow account setup';
    await query(
      `INSERT INTO transactions (user_id, reference, description, amount, nxt_amount, release_condition)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, txReference, txDescription, initialAmount, nxtAmount, releaseCondition]
    );

    const { accessToken, refreshToken } = {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
    };

    const refreshHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address)
       VALUES ($1, 'signup', 'success', $2)`,
      [user.id, clientIp]
    );

    // Set refresh token as HTTP-only cookie
    const cookieOptions = [
      'refreshToken=' + refreshToken,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=' + (7 * 24 * 60 * 60), // 7 days
      'Path=/'
    ].join('; ');

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
        'Set-Cookie': cookieOptions,
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user: {
          ...user,
          profile_picture_url: profilePictureUrl,
        },
        account_id: accountId,
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Signup function error', error);
    return formatResponse(500, { error: 'Failed to create account' });
  }
};
