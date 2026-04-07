const { getStore } = require('@netlify/blobs');

function toSafeKey(value) {
  return String(value || 'unknown').trim().toLowerCase().replace(/[^a-z0-9._:-]/g, '_');
}

async function checkRateLimit({ namespace, key, limit, windowSec }) {
  try {
    const now = Date.now();
    const windowMs = Math.max(1, Number(windowSec || 60)) * 1000;
    const bucketStart = Math.floor(now / windowMs) * windowMs;
    const bucketKey = `${toSafeKey(namespace)}:${toSafeKey(key)}:${bucketStart}`;
    const store = getStore('rate-limits');

    const raw = await store.get(bucketKey, { type: 'json' });
    const count = Number(raw?.count || 0) + 1;
    const resetAt = bucketStart + windowMs;
    const allowed = count <= Number(limit || 10);
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

    await store.set(
      bucketKey,
      JSON.stringify({ count, updatedAt: new Date(now).toISOString() }),
      { metadata: { resetAt: String(resetAt), namespace: toSafeKey(namespace) } }
    );

    return {
      allowed,
      limit: Number(limit || 10),
      count,
      remaining: Math.max(0, Number(limit || 10) - count),
      retryAfterSec,
      resetAt,
    };
  } catch (error) {
    console.error('rate-limit check failed; allowing request', error);
    return {
      allowed: true,
      limit: Number(limit || 10),
      count: 0,
      remaining: Number(limit || 10),
      retryAfterSec: 1,
      resetAt: Date.now() + 1000,
    };
  }
}

module.exports = {
  checkRateLimit,
};
