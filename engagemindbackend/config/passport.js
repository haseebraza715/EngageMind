// Load environment variables FIRST
require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Only configure Google Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
      callbackURL: (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5003/auth/google/callback').trim(),
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await User.findOne({ email });

        if (existingUser) return done(null, existingUser);

        const newUser = new User({
          username: profile.displayName,
          email,
          provider: 'google',
          verified: true,
          role: 'user',
          avatar: profile.photos[0].value,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        console.error('Google OAuth user creation error:', err);
        return done(err, null);
      }
    }));
    console.log('✅ Google OAuth strategy registered successfully');
  } catch (error) {
    console.error('❌ Error registering Google OAuth strategy:', error);
  }
} else {
  console.warn('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
