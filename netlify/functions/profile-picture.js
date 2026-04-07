const { getStore } = require('@netlify/blobs');
const { getCorsHeaders, verifySignedProfilePictureUrl } = require('./auth-utils');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function corsHeaders() {
  return {
    ...getCorsHeaders(),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ message: 'ok' }),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const key = event.queryStringParameters?.key || '';
    const mimeType = (event.queryStringParameters?.mime || '').toLowerCase();
    const exp = event.queryStringParameters?.exp || '';
    const sig = event.queryStringParameters?.sig || '';

    if (!key) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing profile picture key' }),
      };
    }

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unsupported image type' }),
      };
    }

    const isValidSignedUrl = verifySignedProfilePictureUrl({
      key,
      mimeType,
      exp,
      sig,
    });
    if (!isValidSignedUrl) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired profile picture link' }),
      };
    }

    const pictureStore = getStore('profile-pictures');
    const fileContent = await pictureStore.get(key, { type: 'arrayBuffer' });

    if (!fileContent) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Profile picture not found' }),
      };
    }

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        ...corsHeaders(),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=300',
      },
      body: Buffer.from(fileContent).toString('base64'),
    };
  } catch (error) {
    console.error('profile-picture function error', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load profile picture' }),
    };
  }
};
