const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

function getCorsHeaders() {
  const allowedOrigin = process.env.FRONTEND_URL;
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  return headers;
}

function formatResponse(statusCode, body, cookies) {
  const headers = {
    'Content-Type': 'application/json',
    ...getCorsHeaders(),
  };

  if (cookies && cookies.length > 0) {
    headers['Set-Cookie'] = cookies;
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('DB query error', err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    console.debug('query', { text: text.split(' ')[0], duration });
  }
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function comparePasswords(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return require('crypto').createHash('sha256').update(token).digest('hex');
}

function getClientIp(event) {
  const xff = event?.headers?.['x-forwarded-for'] || event?.headers?.['X-Forwarded-For'];
  if (typeof xff === 'string' && xff.trim().length > 0) {
    return xff.split(',')[0].trim();
  }
  return event?.requestContext?.identity?.sourceIp || 'unknown';
}

function signValue(value, expiresAt) {
  const crypto = require('crypto');
  const signingSecret = process.env.PROFILE_PICTURE_SIGNING_SECRET || JWT_SECRET;
  return crypto.createHmac('sha256', signingSecret).update(`${value}.${expiresAt}`).digest('hex');
}

function buildSignedProfilePictureUrl({ key, mimeType, ttlSec = 900 }) {
  if (!key || !mimeType) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, Number(ttlSec || 900));
  const sig = signValue(`${key}|${mimeType}`, expiresAt);
  return `/api/auth/profile-picture?key=${encodeURIComponent(key)}&mime=${encodeURIComponent(mimeType)}&exp=${expiresAt}&sig=${sig}`;
}

function verifySignedProfilePictureUrl({ key, mimeType, exp, sig }) {
  if (!key || !mimeType || !exp || !sig) return false;
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  const expected = signValue(`${key}|${mimeType}`, expiresAt);
  return expected === sig;
}

module.exports = {
  formatResponse,
  getCorsHeaders,
  query,
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getClientIp,
  buildSignedProfilePictureUrl,
  verifySignedProfilePictureUrl,
};
