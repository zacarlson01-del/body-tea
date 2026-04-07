const { formatResponse, getCorsHeaders } = require('./auth-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  // Clear the refresh token cookie
  const cookieOptions = [
    'refreshToken=',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Max-Age=0',
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
      message: 'Logged out successfully',
    }),
  };
};
