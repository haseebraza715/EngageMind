const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/engagemindbackend';
    // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
    // These are no longer needed in Mongoose 6+
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure MongoDB is running: mongod --dbpath /path/to/data');
    // Don't exit immediately - allow server to start and retry
    // process.exit(1);
  }
};

module.exports = connectDB;
