#!/usr/bin/env node
/**
 * Hard regression tests for thesis-critical backend behavior.
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/authMiddleware');

const results = [];

function run(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    results.push({ name, ok: true });
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    results.push({ name, ok: false, err: err.message });
  }
}

function makeRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

run('Auth middleware rejects missing Authorization header', () => {
  process.env.JWT_SECRET = 'regression-secret';
  const req = { headers: {} };
  const res = makeRes();
  let calledNext = false;

  authMiddleware(req, res, () => {
    calledNext = true;
  });

  if (calledNext) throw new Error('next() should not be called');
  if (res.statusCode !== 401) throw new Error(`expected 401 got ${res.statusCode}`);
});

run('Auth middleware accepts valid Bearer token', () => {
  process.env.JWT_SECRET = 'regression-secret';
  const token = jwt.sign({ userId: 'u1', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeRes();
  let calledNext = false;

  authMiddleware(req, res, () => {
    calledNext = true;
  });

  if (!calledNext) throw new Error('next() not called');
  if (!req.user || req.user.userId !== 'u1') throw new Error('decoded user missing');
});

run('Auth middleware returns 500 when JWT secret missing', () => {
  const previous = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  const req = { headers: { authorization: 'Bearer abc' } };
  const res = makeRes();
  let calledNext = false;

  authMiddleware(req, res, () => {
    calledNext = true;
  });

  process.env.JWT_SECRET = previous;

  if (calledNext) throw new Error('next() should not be called');
  if (res.statusCode !== 500) throw new Error(`expected 500 got ${res.statusCode}`);
});

run('Registration route enforces role=user (anti-escalation)', () => {
  const content = fs.readFileSync(path.join(__dirname, 'routes', 'authRoutes.js'), 'utf8');
  if (!content.includes("role: 'user'")) {
    throw new Error('role is not hard-set to user in registration');
  }
  if (content.includes('const { username, email, password, role }')) {
    throw new Error('role still accepted from request body');
  }
});

run('Server env loading is path-pinned to backend .env', () => {
  const content = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  if (!content.includes("require('dotenv').config({ path: path.join(__dirname, '.env') })")) {
    throw new Error('server dotenv loading is not pinned to backend .env');
  }
});

const passed = results.filter(r => r.ok).length;
const failed = results.length - passed;

console.log('\n' + '='.repeat(60));
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed) {
  for (const r of results.filter(x => !x.ok)) {
    console.log(` - ${r.name}: ${r.err}`);
  }
}
console.log('='.repeat(60));

process.exit(failed ? 1 : 0);
