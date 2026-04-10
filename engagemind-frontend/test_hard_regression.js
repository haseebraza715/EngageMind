#!/usr/bin/env node
/**
 * Hard regression tests for thesis-critical frontend integration behavior.
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;

const tests = [];

function run(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    tests.push({ name, ok: true });
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    tests.push({ name, ok: false, err: err.message });
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

run('No hardcoded bearer token in DocumentUploader', () => {
  const content = read('src/components/Chat/DocumentUploader.jsx');
  if (content.includes('Authorization') && content.includes('Bearer a378')) {
    throw new Error('hardcoded upload token still present');
  }
});

run('RAG API client uses JWT token from localStorage', () => {
  const content = read('src/api/axiosChat.js');
  if (!content.includes("localStorage.getItem('token')")) {
    throw new Error('axiosChat is not sourcing token from localStorage');
  }
});

run('Fine-tune API client exists and enforces auth', () => {
  const content = read('src/api/axiosFineTune.js');
  if (!content.includes("localStorage.getItem('token')")) {
    throw new Error('axiosFineTune does not use JWT token');
  }
  if (!content.includes('/login')) {
    throw new Error('axiosFineTune missing unauthorized redirect handling');
  }
});

run('Chat API exposes fine-tune start and status methods', () => {
  const content = read('src/components/Chat/chatApi.jsx');
  if (!content.includes('startFineTuneTraining')) {
    throw new Error('startFineTuneTraining function missing');
  }
  if (!content.includes('fetchFineTuneStatus')) {
    throw new Error('fetchFineTuneStatus function missing');
  }
});

run('Chat container integrates training start + polling', () => {
  const content = read('src/components/Chat/ChatContainer.jsx');
  if (!content.includes('handleStartTraining')) {
    throw new Error('training trigger handler missing');
  }
  if (!content.includes('setInterval(pollStatus, 4000)')) {
    throw new Error('training polling interval missing');
  }
  if (!content.includes('trainingStatus')) {
    throw new Error('training status state missing');
  }
});

run('Sidebar exposes GPT-2 training controls', () => {
  const content = read('src/components/Chat/Sidebar.jsx');
  if (!content.includes('GPT-2 Training')) {
    throw new Error('GPT-2 training panel missing');
  }
  if (!content.includes('Start Fine-Tuning')) {
    throw new Error('fine-tuning action button missing');
  }
});

run('Navbar no longer links to dead /settings route', () => {
  const content = read('src/components/Navbar.jsx');
  if (content.includes("navigate('/settings')") || content.includes("to=\"/settings\"")) {
    throw new Error('dead /settings route is still referenced');
  }
});

run('Auth and chat clients are env-configurable', () => {
  const auth = read('src/api/axiosAuth.js');
  const chat = read('src/api/axiosChat.js');
  if (!auth.includes('REACT_APP_AUTH_API_URL')) {
    throw new Error('auth API URL env override missing');
  }
  if (!chat.includes('REACT_APP_RAG_API_URL')) {
    throw new Error('RAG API URL env override missing');
  }
});

const passed = tests.filter(t => t.ok).length;
const failed = tests.length - passed;

console.log('\n' + '='.repeat(60));
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed) {
  for (const t of tests.filter(x => !x.ok)) {
    console.log(` - ${t.name}: ${t.err}`);
  }
}
console.log('='.repeat(60));

process.exit(failed ? 1 : 0);
