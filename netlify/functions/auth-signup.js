const { formatResponse, query, hashPassword, generateAccessToken, generateRefreshToken, hashToken } = require('./auth-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
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
       RETURNING id, email, first_name, last_name`,
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

    const accountId = `ISEA-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    await query(
      `INSERT INTO escrow_accounts (user_id, account_id, status, account_status)
       VALUES ($1, $2, 'pending', 'pending')`,
      [user.id, accountId]
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
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': cookieOptions,
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user,
        account_id: accountId,
        accessToken,
      }),
    };
  } catch (error) {
    console.error('Signup function error', error);
    return formatResponse(500, { error: 'Failed to create account' });
  }
};
