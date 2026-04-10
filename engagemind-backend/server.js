const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Fix for Node.js v25 compatibility with buffer-equal-constant-time
// Node.js v25 removed SlowBuffer, so we need to patch it before modules load
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'buffer-equal-constant-time') {
    // Return a compatible shim
    return {
      install: function() {},
      restore: function() {},
      equal: function(a, b) {
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) return false;
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
          result |= a[i] ^ b[i];
        }
        return result === 0;
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

require('./config/passport');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');

const app = express();

connectDB();

const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!sessionSecret) {
  console.warn('⚠️  SESSION_SECRET and JWT_SECRET are not set. Using development-only fallback secret.');
}

// CORS configuration - allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json()); 
app.use(session({
  secret: sessionSecret || 'engagemind-dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'API root: Express Auth is running' });
});

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

app.post('/test', (req, res) => {
  console.log('Test route accessed');
  console.log('Body:', req.body);
  res.json({ message: 'Test route works!' });
});

// Use port 5000, but if it's taken by AirPlay, fallback to 5003
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}`);
  console.log(`✅ Registration endpoint: http://localhost:${PORT}/auth/register`);
});
