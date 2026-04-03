#!/usr/bin/env node

// Simple test script for Netlify Functions (runs without Netlify CLI)
// Usage: node test-functions.js

const { spawn } = require('child_process');
const path = require('path');

const functionsDir = path.join(__dirname, 'netlify', 'functions');

// Mock Netlify function environment
const mockEvent = (method, body = null, headers = {}) => ({
  httpMethod: method,
  body: body ? JSON.stringify(body) : null,
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  requestContext: {
    identity: {
      sourceIp: '127.0.0.1',
    },
  },
});

// Mock environment variables (set these in your .env file)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-at-least-32-chars';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/test_db';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testFunction(functionName, event) {
  console.log(`\n🧪 Testing ${functionName}...`);

  try {
    const func = require(path.join(functionsDir, functionName + '.js'));
    const result = await func.handler(event);

    console.log(`✅ ${functionName} returned status: ${result.statusCode}`);
    if (result.body) {
      const body = JSON.parse(result.body);
      console.log(`📄 Response:`, body);
    }
    if (result.headers?.['Set-Cookie']) {
      console.log(`🍪 Cookie set:`, result.headers['Set-Cookie'].split(';')[0]);
    }

    return result;
  } catch (error) {
    console.error(`❌ ${functionName} failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Running Netlify Functions Tests\n');

  // Test 1: Signup
  const signupEvent = mockEvent('POST', {
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    password: 'TestPass123!',
  });

  const signupResult = await testFunction('auth-signup', signupEvent);

  // Test 2: Signin (if signup succeeded)
  if (signupResult?.statusCode === 201) {
    const signinEvent = mockEvent('POST', {
      username_or_email: 'test@example.com',
      password: 'TestPass123!',
    });

    const signinResult = await testFunction('auth-signin', signinEvent);

    // Test 3: Get current user (if signin succeeded and returned accessToken)
    if (signinResult?.statusCode === 200) {
      const body = JSON.parse(signinResult.body);
      const meEvent = mockEvent('GET', null, {
        authorization: `Bearer ${body.accessToken}`,
      });

      await testFunction('auth-me', meEvent);

      // Test 4: Refresh token (using cookie from signin)
      if (signinResult.headers?.['Set-Cookie']) {
        const refreshEvent = mockEvent('POST', {}, {
          cookie: signinResult.headers['Set-Cookie'],
        });

        await testFunction('auth-refresh-token', refreshEvent);
      }
    }
  }

  // Test 5: Logout
  await testFunction('auth-logout', mockEvent('POST'));

  console.log('\n✨ Tests completed. Note: These tests require a running PostgreSQL database.');
  console.log('💡 For full integration testing, use: netlify dev + frontend');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFunction, mockEvent };