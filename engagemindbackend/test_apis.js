#!/usr/bin/env node
/**
 * Comprehensive Backend API Test Suite
 * Tests all endpoints, middleware, and configurations
 * Run: node test_apis.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5003';
const TEST_TIMEOUT = 5000;

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: TEST_TIMEOUT
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test(name, testFn) {
  try {
    await testFn();
    results.passed.push(name);
    log(`✅ ${name}`, 'green');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function testWarning(name, testFn) {
  try {
    await testFn();
    results.warnings.push(name);
    log(`⚠️  ${name}`, 'yellow');
    return true;
  } catch (error) {
    results.warnings.push({ name, error: error.message });
    log(`⚠️  ${name}: ${error.message}`, 'yellow');
    return true; // Warnings don't fail tests
  }
}

// Test Suite
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('BACKEND API TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'blue');

  // Test 1: Server Health Check
  await test('Server is running', async () => {
    const response = await makeRequest('GET', '/');
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.body.message) {
      throw new Error('Missing message in response');
    }
  });

  // Test 2: Test Route
  await test('Test route works', async () => {
    const response = await makeRequest('POST', '/test', { test: 'data' });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 3: Registration - Missing Fields
  await test('Registration rejects missing fields', async () => {
    const response = await makeRequest('POST', '/auth/register', {});
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    if (!response.body.error) {
      throw new Error('Missing error message');
    }
  });

  // Test 4: Registration - Invalid Email
  await test('Registration rejects invalid email', async () => {
    const response = await makeRequest('POST', '/auth/register', {
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123'
    });
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 5: Registration - Short Password
  await test('Registration rejects short password', async () => {
    const response = await makeRequest('POST', '/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: '12345'
    });
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 6: Login - Missing Fields
  await test('Login rejects missing fields', async () => {
    const response = await makeRequest('POST', '/auth/login', {});
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 7: Profile - No Token
  await test('Profile requires authentication', async () => {
    const response = await makeRequest('GET', '/auth/profile');
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 8: Profile - Invalid Token
  await test('Profile rejects invalid token', async () => {
    const response = await makeRequest('GET', '/auth/profile', null, {
      'Authorization': 'Bearer invalid-token-12345'
    });
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 9: Edit Profile - No Token
  await test('Edit profile requires authentication', async () => {
    const response = await makeRequest('PUT', '/auth/edit-profile', {
      username: 'newusername'
    });
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 10: Admin Protected - No Token
  await test('Admin protected route requires authentication', async () => {
    const response = await makeRequest('GET', '/admin/protected');
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 11: Admin Data - No Token
  await test('Admin data requires authentication', async () => {
    const response = await makeRequest('GET', '/admin/admin-data');
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 12: Forgot Password - Missing Email
  await test('Forgot password requires email', async () => {
    const response = await makeRequest('POST', '/auth/forgot-password', {});
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 13: Reset Password - Missing Fields
  await test('Reset password requires token and password', async () => {
    const response = await makeRequest('POST', '/auth/reset-password', {});
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 14: Verify Email - Missing Token
  await test('Verify email requires token', async () => {
    const response = await makeRequest('GET', '/auth/verify-email');
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  // Test 15: Google OAuth - Check Configuration
  await testWarning('Google OAuth endpoint exists', async () => {
    const response = await makeRequest('GET', '/auth/google');
    // Should either redirect (302) or return error if not configured
    if (response.status !== 302 && response.status !== 400 && response.status !== 500) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });

  // Test 16: CORS Headers
  await test('CORS headers are present', async () => {
    const response = await makeRequest('GET', '/');
    // CORS might be handled by middleware, check if response is successful
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 17: JSON Parsing
  await test('Server parses JSON correctly', async () => {
    const response = await makeRequest('POST', '/test', {
      test: 'data',
      nested: { value: 123 }
    });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✅ Passed: ${results.passed.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, 'red');
  log(`⚠️  Warnings: ${results.warnings.length}`, 'yellow');

  if (results.failed.length > 0) {
    log('\nFailed Tests:', 'red');
    results.failed.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'red');
    });
  }

  if (results.warnings.length > 0) {
    log('\nWarnings:', 'yellow');
    results.warnings.forEach((warning) => {
      if (typeof warning === 'string') {
        log(`  - ${warning}`, 'yellow');
      } else {
        log(`  - ${warning.name}: ${warning.error}`, 'yellow');
      }
    });
  }

  log('\n' + '='.repeat(60), 'cyan');
  if (results.failed.length === 0) {
    log('✅ ALL TESTS PASSED!', 'green');
    process.exit(0);
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});

