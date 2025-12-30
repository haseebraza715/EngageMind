const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/userModel');

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
