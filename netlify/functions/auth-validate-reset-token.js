const crypto = require('crypto');
const { formatResponse } = require('./auth-utils');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'GET') {
    return formatResponse(405, { error: 'Method not allowed' });
  }

  try {
    const token = typeof event.queryStringParameters?.token === 'string'
      ? event.queryStringParameters.token.trim()
      : '';

    if (!token) {
      return formatResponse(400, { error: 'Token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetStore = getStore('password-reset-requests');
    const recordRaw = await resetStore.get(`reset_${tokenHash}`, { type: 'text' });

    if (!recordRaw) {
      return formatResponse(400, { error: 'Invalid reset token' });
    }

    const record = JSON.parse(recordRaw);
    if (!record.expiresAt || new Date(record.expiresAt).getTime() < Date.now()) {
      return formatResponse(400, { error: 'Reset token has expired' });
    }

    return formatResponse(200, { valid: true });
  } catch (error) {
    console.error('validate-reset-token function error', error);
    return formatResponse(500, { error: 'Failed to validate reset token' });
  }
};
