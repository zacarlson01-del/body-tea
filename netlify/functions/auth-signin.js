const { formatResponse, query, comparePasswords, generateAccessToken, generateRefreshToken, hashToken } = require('./auth-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
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

    const passwordMatch = await comparePasswords(password, user.password_hash);
    if (!passwordMatch) {
      await query(
        `INSERT INTO audit_logs (user_id, action, status, ip_address, details)
         VALUES ($1, 'signin', 'failed', $2, $3)`,
        [user.id, event.requestContext?.identity?.sourceIp || 'unknown', JSON.stringify({ reason: 'invalid_password' })]
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
      [user.id, event.requestContext?.identity?.sourceIp || 'unknown']
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
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
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
          profile_picture_url: user.profile_picture_url,
        },
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Signin function error', error);
    return formatResponse(500, { error: 'Authentication failed' });
  }
};
