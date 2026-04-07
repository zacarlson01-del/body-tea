const { getStore } = require('@netlify/blobs');
const { verifyAccessToken, getClientIp, getCorsHeaders } = require('./auth-utils');
const { checkRateLimit } = require('./rate-limit');

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
    body: JSON.stringify(body),
  };
}

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, { message: 'ok' });
  }

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers?.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return response(401, { error: 'Authentication required' });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return response(401, { error: 'Invalid or expired access token' });
    }

    const clientIp = getClientIp(event);
    const ipRate = await checkRateLimit({
      namespace: 'support-create-ip',
      key: clientIp,
      limit: 10,
      windowSec: 900,
    });
    if (!ipRate.allowed) {
      return response(429, { error: 'Too many support requests. Please try again later.' });
    }
    const userRate = await checkRateLimit({
      namespace: 'support-create-user',
      key: decoded.userId,
      limit: 5,
      windowSec: 900,
    });
    if (!userRate.allowed) {
      return response(429, { error: 'Too many support requests for this account. Please try again later.' });
    }

    const payload = JSON.parse(event.body || '{}');
    const name = sanitizeText(payload.name);
    const email = sanitizeText(payload.email).toLowerCase();
    const message = sanitizeText(payload.message);

    if (!name || !email || !message) {
      return response(400, { error: 'Name, email, and message are required' });
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return response(400, { error: 'Invalid email format' });
    }

    if (message.length < 10) {
      return response(400, { error: 'Message must be at least 10 characters' });
    }

    const supportStore = getStore('support-messages');
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      ticketId,
      name,
      email,
      message,
      source: 'dashboard_support',
      userId: decoded.userId,
      createdAt: new Date().toISOString(),
      ipAddress: clientIp,
      userAgent: event.headers?.['user-agent'] || null,
    };

    await supportStore.set(ticketId, JSON.stringify(record), {
      metadata: {
        email,
        source: 'dashboard_support',
        createdAt: record.createdAt,
        userId: String(decoded.userId),
      },
    });

    return response(201, {
      message: 'Support request submitted successfully',
      ticketId,
    });
  } catch (error) {
    console.error('support-create function error', error);
    return response(500, { error: 'Failed to submit support request' });
  }
};
