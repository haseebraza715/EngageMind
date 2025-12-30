 require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log('🔍 Testing Google OAuth Configuration...\n');

// Check credentials
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback';

console.log('📋 Configuration:');
console.log('  Client ID:', clientID ? `${clientID.substring(0, 20)}...` : '❌ NOT SET');
console.log('  Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : '❌ NOT SET');
console.log('  Callback URL:', callbackURL);
console.log('');

if (!clientID || !clientSecret) {
  console.error('❌ Missing credentials!');
  process.exit(1);
}

// Try to create strategy
try {
  const strategy = new GoogleStrategy({
    clientID: clientID.trim(),
    clientSecret: clientSecret.trim(),
    callbackURL: callbackURL.trim(),
  }, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
  });

  console.log('✅ Strategy created successfully');
  console.log('');
  console.log('⚠️  IMPORTANT: Check these in Google Cloud Console:');
  console.log('');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Click on your OAuth 2.0 Client ID');
  console.log('3. Under "Authorized redirect URIs", make sure you have:');
  console.log(`   ${callbackURL}`);
  console.log('');
  console.log('4. Go to: https://console.cloud.google.com/apis/credentials/consent');
  console.log('5. Make sure OAuth consent screen is configured:');
  console.log('   - User Type: External (for testing) or Internal');
  console.log('   - App name, support email, and developer contact are set');
  console.log('   - Scopes: profile, email are added');
  console.log('   - Test users: Add your email if using "Testing" mode');
  console.log('');
  console.log('6. Make sure these APIs are enabled:');
  console.log('   - Google+ API (if still available)');
  console.log('   - Google Identity API');
  console.log('');
  
} catch (error) {
  console.error('❌ Error creating strategy:', error.message);
  process.exit(1);
}

