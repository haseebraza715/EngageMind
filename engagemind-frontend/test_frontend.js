#!/usr/bin/env node
/**
 * Frontend Component and Route Test Suite
 * Tests all imports, routes, and API configurations
 * Run: node test_frontend.js
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, testFn) {
  try {
    testFn();
    results.passed.push(name);
    log(`✅ ${name}`, 'green');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

function testWarning(name, testFn) {
  try {
    testFn();
    results.warnings.push(name);
    log(`⚠️  ${name}`, 'yellow');
    return true;
  } catch (error) {
    results.warnings.push({ name, error: error.message });
    log(`⚠️  ${name}: ${error.message}`, 'yellow');
    return true;
  }
}

// Test Suite
async function runTests() {
  const projectRoot = __dirname;
  log('\n' + '='.repeat(60), 'cyan');
  log('FRONTEND TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Project Root: ${projectRoot}\n`, 'blue');

  const srcPath = path.join(projectRoot, 'src');

  // Test 1: Core Files
  log('\n📁 Core Files:', 'blue');
  test('App.js exists', () => {
    if (!fs.existsSync(path.join(srcPath, 'App.js'))) {
      throw new Error('App.js not found');
    }
  });

  test('index.js exists', () => {
    if (!fs.existsSync(path.join(srcPath, 'index.js'))) {
      throw new Error('index.js not found');
    }
  });

  // Test 2: API Configuration Files
  log('\n🔌 API Configuration:', 'blue');
  test('axiosAuth.js exists', () => {
    const file = path.join(srcPath, 'api', 'axiosAuth.js');
    if (!fs.existsSync(file)) throw new Error('axiosAuth.js not found');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('baseURL')) throw new Error('Missing baseURL configuration');
    if (!content.includes('localhost:5003')) throw new Error('Backend URL should be localhost:5003');
  });

  test('axiosChat.js exists', () => {
    const file = path.join(srcPath, 'api', 'axiosChat.js');
    if (!fs.existsSync(file)) throw new Error('axiosChat.js not found');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('baseURL')) throw new Error('Missing baseURL configuration');
    if (!content.includes('localhost:5001')) throw new Error('RAG server URL should be localhost:5001');
  });

  test('axiosFineTune.js exists', () => {
    const file = path.join(srcPath, 'api', 'axiosFineTune.js');
    if (!fs.existsSync(file)) throw new Error('axiosFineTune.js not found');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('baseURL')) throw new Error('Missing baseURL configuration');
    if (!content.includes('localhost:5002')) throw new Error('Fine-tune server URL should be localhost:5002');
    if (!content.includes('Authorization')) throw new Error('Fine-tune API client should attach Authorization header');
  });

  // Test 3: Pages
  log('\n📄 Pages:', 'blue');
  const pages = [
    'LoginPage.jsx',
    'RegisterPage.jsx',
    'Homepage.jsx',
    'UserProfile.jsx',
    'EditProfile.jsx',
    'ForgotPasswordPage.jsx',
    'ResetPasswordPage.jsx',
    'AuthSuccess.jsx',
    'AccessDeniedCard.jsx'
  ];

  pages.forEach(page => {
    test(`${page} exists`, () => {
      const file = path.join(srcPath, 'pages', page);
      if (!fs.existsSync(file)) throw new Error(`${page} not found`);
    });
  });

  // Test 4: Components
  log('\n🧩 Components:', 'blue');
  const components = [
    'Layout.jsx',
    'Navbar.jsx',
    'Footer.jsx',
    'LoadingSpinner.jsx',
    'ErrorDisplay.jsx',
    'VerifyEmailPage.js'
  ];

  components.forEach(component => {
    test(`${component} exists`, () => {
      const file = path.join(srcPath, 'components', component);
      if (!fs.existsSync(file)) throw new Error(`${component} not found`);
    });
  });

  // Test 5: Chat Components
  log('\n💬 Chat Components:', 'blue');
  const chatComponents = [
    'ChatPage.jsx',
    'ChatContainer.jsx',
    'ChatWindow.jsx',
    'ChatList.jsx',
    'Sidebar.jsx',
    'DocumentUploader.jsx',
    'chatApi.jsx'
  ];

  chatComponents.forEach(component => {
    test(`Chat/${component} exists`, () => {
      const file = path.join(srcPath, 'components', 'Chat', component);
      if (!fs.existsSync(file)) throw new Error(`Chat/${component} not found`);
    });
  });

  // Test 6: Routes in App.js
  log('\n🛣️  Routes:', 'blue');
  test('App.js contains route definitions', () => {
    const appFile = path.join(srcPath, 'App.js');
    const content = fs.readFileSync(appFile, 'utf8');
    if (!content.includes('Routes')) throw new Error('Missing Routes component');
    if (!content.includes('Route')) throw new Error('Missing Route components');
  });

  test('Login route defined', () => {
    const appFile = path.join(srcPath, 'App.js');
    const content = fs.readFileSync(appFile, 'utf8');
    if (!content.includes('path="/login"')) throw new Error('Login route not found');
  });

  test('Register route defined', () => {
    const appFile = path.join(srcPath, 'App.js');
    const content = fs.readFileSync(appFile, 'utf8');
    if (!content.includes('path="/register"')) throw new Error('Register route not found');
  });

  test('Chat route defined', () => {
    const appFile = path.join(srcPath, 'App.js');
    const content = fs.readFileSync(appFile, 'utf8');
    if (!content.includes('path="/chat"')) throw new Error('Chat route not found');
  });

  // Test 7: API Integration
  log('\n🔗 API Integration:', 'blue');
  test('LoginPage uses axiosAuth', () => {
    const file = path.join(srcPath, 'pages', 'LoginPage.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('axiosAuth')) throw new Error('LoginPage not using axiosAuth');
    if (!content.includes('/auth/login')) throw new Error('LoginPage not calling /auth/login');
  });

  test('RegisterPage uses axiosAuth', () => {
    const file = path.join(srcPath, 'pages', 'RegisterPage.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('axiosAuth')) throw new Error('RegisterPage not using axiosAuth');
    if (!content.includes('/auth/register')) throw new Error('RegisterPage not calling /auth/register');
  });

  test('chatApi uses axiosChat', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'chatApi.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('axiosChat')) throw new Error('chatApi not using axiosChat');
  });

  test('chatApi wires every RAG endpoint used by chat flow', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'chatApi.jsx');
    const content = fs.readFileSync(file, 'utf8');
    [
      '/api/conversations',
      '/api/conversation',
      '/api/upload',
      '/message'
    ].forEach(endpoint => {
      if (!content.includes(endpoint)) {
        throw new Error(`chatApi missing ${endpoint}`);
      }
    });
  });

  test('chatApi wires fine-tune start and status endpoints', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'chatApi.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('axiosFineTune')) throw new Error('chatApi not using axiosFineTune');
    if (!content.includes('/api/fine-tune')) throw new Error('Missing fine-tune start endpoint');
    if (!content.includes('/api/fine-tune/status/')) throw new Error('Missing fine-tune status endpoint');
    if (!content.includes('/api/fine-tune/model')) throw new Error('Missing fine-tune model endpoint');
    if (!content.includes('/api/fine-tune/chat')) throw new Error('Missing fine-tune chat endpoint');
    if (!content.includes('startFineTuneTraining')) throw new Error('Missing startFineTuneTraining export');
    if (!content.includes('fetchFineTuneStatus')) throw new Error('Missing fetchFineTuneStatus export');
    if (!content.includes('fetchFineTuneModelStatus')) throw new Error('Missing fetchFineTuneModelStatus export');
    if (!content.includes('sendFineTuneMessage')) throw new Error('Missing sendFineTuneMessage export');
  });

  test('ChatContainer polls training status and handles terminal states', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'ChatContainer.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('setInterval(pollStatus')) throw new Error('Training status is not polled');
    ['PENDING', 'PROGRESS', 'SUCCESS', 'FAILURE'].forEach(status => {
      if (!content.includes(status)) throw new Error(`Missing training status ${status}`);
    });
    if (!content.includes('setTrainingTaskId(null)')) {
      throw new Error('Terminal training states should clear task id');
    }
  });

  test('ChatWindow sends messages and supports document upload entry point', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'ChatWindow.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('sendMessage')) throw new Error('ChatWindow does not import or route to sendMessage');
    if (!content.includes('sendFn(conversationId')) throw new Error('ChatWindow does not send through selected chat provider');
    if (!content.includes('sendFineTuneMessage')) throw new Error('ChatWindow does not call sendFineTuneMessage');
    if (!content.includes('GPT-2 LoRA')) throw new Error('ChatWindow missing GPT-2 LoRA mode label');
    if (!content.includes('onShowUploader')) throw new Error('ChatWindow missing upload entry point');
    if (!content.includes('fetchConversationMessages')) throw new Error('ChatWindow does not load persisted messages');
  });

  test('DocumentUploader uses multipart upload and shows controlled errors', () => {
    const file = path.join(srcPath, 'components', 'Chat', 'DocumentUploader.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes("'/api/upload'")) throw new Error('DocumentUploader missing upload endpoint');
    if (!content.includes('multipart/form-data')) throw new Error('DocumentUploader missing multipart upload');
    if (!content.includes('setError')) throw new Error('DocumentUploader should render controlled errors');
  });

  test('Avatar falls back to initials when image fails', () => {
    const file = path.join(srcPath, 'components', 'UI', 'Avatar.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('imageFailed')) throw new Error('Avatar missing failed-image state');
    if (!content.includes('onError={() => setImageFailed(true)}')) {
      throw new Error('Avatar image should switch to initials on load failure');
    }
    if (!content.includes('overflow-hidden')) {
      throw new Error('Avatar should hide any overflowing image/text content');
    }
  });

  test('Home and footer hide auth prompts after login', () => {
    const homeFile = path.join(srcPath, 'pages', 'Homepage.jsx');
    const footerFile = path.join(srcPath, 'components', 'Footer.jsx');
    const navbarFile = path.join(srcPath, 'components', 'Navbar.jsx');
    const home = fs.readFileSync(homeFile, 'utf8');
    const footer = fs.readFileSync(footerFile, 'utf8');
    const navbar = fs.readFileSync(navbarFile, 'utf8');

    if (!home.includes('isAuthenticated ?')) {
      throw new Error('Homepage should branch on authenticated state');
    }
    if (!home.includes('View Profile')) {
      throw new Error('Homepage should show profile action for logged-in users');
    }
    if (!footer.includes('isAuthenticated ?')) {
      throw new Error('Footer should branch on authenticated state');
    }
    if (!footer.includes('Profile')) {
      throw new Error('Footer should show Profile instead of auth prompts when logged in');
    }
    if (!footer.includes('auth-state-change') || !navbar.includes('auth-state-change')) {
      throw new Error('Auth state changes should sync between navbar/footer');
    }
  });

  // Test 8: Navigation Fixes
  log('\n🧭 Navigation:', 'blue');
  test('LoginPage navigates to /chat (not /dashboard)', () => {
    const file = path.join(srcPath, 'pages', 'LoginPage.jsx');
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("navigate('/dashboard')")) {
      throw new Error('LoginPage still navigates to /dashboard (should be /chat)');
    }
    if (!content.includes("navigate('/chat')")) {
      throw new Error('LoginPage should navigate to /chat');
    }
  });

  // Test 9: Security
  log('\n🔒 Security:', 'blue');
  test('No hardcoded tokens in axiosAuth', () => {
    const file = path.join(srcPath, 'api', 'axiosAuth.js');
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('a37877e87fd73f58bc26ed2e26b53857b1b16bb64dfde43872c4cb1c1b944942')) {
      throw new Error('Hardcoded fallback token found in axiosAuth.js');
    }
  });

  test('No hardcoded tokens in axiosChat', () => {
    const file = path.join(srcPath, 'api', 'axiosChat.js');
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('a37877e87fd73f58bc26ed2e26b53857b1b16bb64dfde43872c4cb1c1b944942')) {
      throw new Error('Hardcoded fallback token found in axiosChat.js');
    }
  });

  // Test 10: Package.json
  log('\n📦 Dependencies:', 'blue');
  test('package.json exists', () => {
    if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
      throw new Error('package.json not found');
    }
  });

  test('React 19 in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    if (!pkg.dependencies.react || !pkg.dependencies.react.includes('19')) {
      throw new Error('React 19 not found in dependencies');
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

  log('\n' + '='.repeat(60), 'cyan');
  if (results.failed.length === 0) {
    log('✅ ALL TESTS PASSED!', 'green');
    process.exit(0);
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});
