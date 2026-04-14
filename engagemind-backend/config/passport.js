// Load environment variables FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./db');

const ensureDbConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const connection = await connectDB();
  return Boolean(connection) && mongoose.connection.readyState === 1;
};

// Only configure Google Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  try {
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
      callbackURL: (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5003/auth/google/callback').trim(),
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const dbReady = await ensureDbConnection();
        if (!dbReady) {
          return done(null, false, { code: 'DB_UNAVAILABLE' });
        }

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
        if (err?.name === 'MongooseError' || err?.name === 'MongoServerSelectionError') {
          console.error('Google OAuth database error:', err.message);
          return done(null, false, { code: 'DB_UNAVAILABLE' });
        }
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
  try {
    const dbReady = await ensureDbConnection();
    if (!dbReady) {
      return done(null, false);
    }

    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Passport deserialize error:', error.message);
    done(null, false);
  }
});
