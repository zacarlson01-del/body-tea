const { formatResponse, query, verifyAccessToken } = require('./auth-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'GET') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers?.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return formatResponse(401, { error: 'No authorization token provided' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return formatResponse(401, { error: 'Invalid or expired access token' });
    }

    const userResult = await query(
      `SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.profile_picture_url,
              u.phone, u.gender, u.date_of_birth, u.affiliated_authorities, u.postal_code,
              e.account_id, e.account_status, e.escrow_deposit_amount, e.duration_days, e.personal_item
       FROM users u
       LEFT JOIN escrow_accounts e ON e.user_id = u.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return formatResponse(404, { error: 'User not found' });
    }

    const row = userResult.rows[0];

    return formatResponse(200, {
      user: {
        id: row.id,
        email: row.email,
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
        profile_picture_url: row.profile_picture_url,
        phone: row.phone,
        gender: row.gender,
        date_of_birth: row.date_of_birth,
        affiliated_authorities: row.affiliated_authorities,
        postal_code: row.postal_code,
      },
      escrow_account: {
        account_id: row.account_id,
        account_status: row.account_status,
        escrow_deposit_amount: row.escrow_deposit_amount,
        duration_days: row.duration_days,
        personal_item: row.personal_item,
      },
    });
  } catch (error) {
    console.error('Me function error', error);
    return formatResponse(500, { error: 'Failed to fetch user profile' });
  }
};
