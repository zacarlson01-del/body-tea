const { formatResponse, getCorsHeaders, query, verifyRefreshToken, generateAccessToken, generateRefreshToken, hashToken } = require('./auth-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Try to get refresh token from cookie first (more secure), then from body
    const refreshToken = event.headers?.cookie?.split(';')
      .find(c => c.trim().startsWith('refreshToken='))
      ?.split('=')[1] || JSON.parse(event.body || '{}').refreshToken;

    if (!refreshToken) {
      return formatResponse(400, { error: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return formatResponse(401, { error: 'Invalid or expired refresh token' });
    }

    const refreshHash = hashToken(refreshToken);
    const tokenRecord = await query(
      `SELECT id, user_id, expires_at, used_at FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [refreshHash]
    );

    if (tokenRecord.rows.length === 0) {
      return formatResponse(401, { error: 'Invalid or expired refresh token' });
    }

    const tokenRow = tokenRecord.rows[0];
    if (tokenRow.used_at) {
      return formatResponse(401, { error: 'Refresh token reused; please login again' });
    }

    const userResult = await query('SELECT id, email, username FROM users WHERE id = $1', [tokenRow.user_id]);
    if (userResult.rows.length === 0) {
      return formatResponse(401, { error: 'User not found' });
    }

    const user = userResult.rows[0];

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query('BEGIN');
    await query('UPDATE refresh_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, newRefreshHash, expiresAt]
    );
    await query('COMMIT');

    // Set refresh token as HTTP-only cookie
    const cookieOptions = [
      'refreshToken=' + newRefreshToken,
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
        accessToken: newAccessToken,
      }),
    };
  } catch (error) {
    try { await query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('Refresh-token function failed', error);
    return formatResponse(500, { error: 'Token refresh failed' });
  }
};
