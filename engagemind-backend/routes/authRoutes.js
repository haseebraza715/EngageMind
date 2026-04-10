const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authMiddleware = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const passport = require('passport');



// Register (Local)
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { username: req.body.username, email: req.body.email });
    
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'All fields (username, email, password) are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('Registration failed: Email already exists');
      return res.status(400).json({
        error: existingEmail.provider === 'google'
          ? 'This email is already registered with Google. Please sign in with Google.'
          : 'Email already taken',
      });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log('Registration failed: Username already exists');
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24;

    // Create new user
    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      provider: 'local',
      verificationToken,
      verificationTokenExpires,
      role: 'user',
      verified: false,
    });

    // Save user to database
    await newUser.save();
    console.log('User created successfully:', newUser._id);

    // Send verification email (don't fail registration if email fails)
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    try {
      await sendEmail({
        to: email,
        subject: 'Please verify your email',
        text: `Click the following link to verify your account: ${verifyLink}`,
        html: `<p>Click the link to verify your account:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      });
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
      console.warn('Registration succeeded but email verification failed. User can request resend.');
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      verificationToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errors 
      });
    }
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Server error during registration',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// Email Verification
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (user.verified) {
      return res.status(200).json({ message: 'Email already verified! You can log in.' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified! You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (Local)
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.provider === 'google') {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server JWT configuration is missing' });
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-password -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      joinDate,
      bio: user.bio || '',
      avatar: user.avatar || '',
      verified: user.verified,
      createdAt: user.createdAt,
      socialLinks: user.socialLinks || {}
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit Profile
router.put('/edit-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, bio, avatar, socialLinks } = req.body;

    const updates = {};

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
      updates.username = username;
    }

    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (socialLinks && typeof socialLinks === 'object') updates.socialLinks = socialLinks;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        socialLinks: updatedUser.socialLinks,
        verified: updatedUser.verified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Google Auth Start
router.get('/google', (req, res, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Google OAuth not configured - missing credentials');
    return res.status(400).json({ 
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file',
      help: 'Get credentials from: https://console.cloud.google.com/apis/credentials'
    });
  }
  
  // Log the authentication attempt
  console.log('Google OAuth: Initiating authentication...');
  
  // Check if strategy is registered
  const strategies = Object.keys(passport._strategies || {});
  if (!strategies.includes('google')) {
    console.error('ERROR: Google strategy not found! Available:', strategies);
    return res.status(500).json({ 
      error: 'Google OAuth strategy not registered',
      message: 'Please restart the server'
    });
  }
  
  // Log callback URL for debugging
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5003/auth/google/callback';
  console.log('Callback URL configured:', callbackURL);
  
  // Use passport.authenticate - this will redirect to Google's OAuth page
  // If it fails, passport will call the error handler
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })(req, res, (err) => {
    if (err) {
      console.error('Passport authentication error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      return res.status(500).json({ 
        error: 'Authentication error',
        message: err.message,
        hint: 'Check Google Cloud Console: https://console.cloud.google.com/apis/credentials'
      });
    }
    next();
  });
});

// Google Callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: 'http://localhost:3000/login?error=google_auth_failed' 
  }), 
  (req, res) => {
    try {
      if (!req.user) {
        console.error('Google OAuth callback: No user in request');
        return res.redirect('http://localhost:3000/login?error=no_user');
      }
      
      const payload = {
        userId: req.user._id,
        username: req.user.username,
        role: req.user.role
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Google OAuth: User authenticated successfully, redirecting...');
      res.redirect(`http://localhost:3000/auth-success?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('http://localhost:3000/login?error=token_generation_failed');
    }
  }
);



// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak user existence
      return res.status(200).json({ message: 'If that email is registered, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p>`,
      text: `Reset your password using this link: ${resetLink}`,
    });


    res.json({ message: 'Reset link sent, if that email is in our system.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(newPassword, salt);

    user.password = hashedPwd;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;



