const { formatResponse, getCorsHeaders, query, comparePasswords, generateAccessToken, generateRefreshToken, hashToken, getClientIp, buildSignedProfilePictureUrl } = require('./auth-utils');
const { checkRateLimit } = require('./rate-limit');

function inferMimeTypeFromStoredUrl(value) {
  const str = String(value || '');
  if (str.endsWith('.jpg') || str.endsWith('.jpeg')) return 'image/jpeg';
  if (str.endsWith('.png')) return 'image/png';
  if (str.endsWith('.webp')) return 'image/webp';
  return 'image/webp';
}

function buildPictureUrlFromStoredValue(storedValue) {
  if (typeof storedValue !== 'string' || storedValue.trim().length === 0) return null;
  if (storedValue.startsWith('profiles/')) {
    return buildSignedProfilePictureUrl({ key: storedValue, mimeType: inferMimeTypeFromStoredUrl(storedValue) });
  }
  if (storedValue.includes('/api/auth/profile-picture?')) {
    try {
      const parsed = new URL(storedValue, 'https://local.example');
      const key = parsed.searchParams.get('key');
      const mimeType = parsed.searchParams.get('mime') || 'image/webp';
      if (key) return buildSignedProfilePictureUrl({ key, mimeType });
    } catch (err) {
      return storedValue;
    }
  }
  return storedValue;
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
      namespace: 'auth-signin-ip',
      key: clientIp,
      limit: 10,
      windowSec: 60,
    });
    if (!rate.allowed) {
      return formatResponse(429, { error: 'Too many sign-in attempts. Please try again shortly.' });
    }

    const payload = JSON.parse(event.body || '{}');
    const { username_or_email, password } = payload;

    if (!username_or_email || !password) {
      return formatResponse(400, { error: 'Required fields missing' });
    }

    const userResult = await query(
      `SELECT id, email, username, password_hash, first_name, last_name, profile_picture_url
      FROM users WHERE email = $1 OR username = $1`,
      [username_or_email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return formatResponse(401, { error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const storedPicture = user.profile_picture_url;
    const signedPictureUrl = buildPictureUrlFromStoredValue(storedPicture);

    const passwordMatch = await comparePasswords(password, user.password_hash);
    if (!passwordMatch) {
      await query(
        `INSERT INTO audit_logs (user_id, action, status, ip_address, details)
         VALUES ($1, 'signin', 'failed', $2, $3)`,
        [user.id, clientIp, JSON.stringify({ reason: 'invalid_password' })]
      );
      return formatResponse(401, { error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, status, ip_address)
       VALUES ($1, 'signin', 'success', $2)`,
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
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
        'Set-Cookie': cookieOptions,
      },
      body: JSON.stringify({
        message: 'Signed in successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture_url: signedPictureUrl,
        },
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Signin function error', error);
    return formatResponse(500, { error: 'Authentication failed' });
  }
};
