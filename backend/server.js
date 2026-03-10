const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Legacy browsers support
}));
app.use(express.json());

// Database connection state
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    // Fallback to local in-memory DB if no URI is provided, avoiding Vercel
    if (!mongoUri && process.env.NODE_ENV !== 'production') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log(`Connected to local in-memory MongoDB at ${mongoServer.getUri()}`);
    } else if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log('Connected to remote MongoDB');
    } else {
      throw new Error('MONGODB_URI is required for production deployment.');
    }

    isConnected = true;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
};

// Vercel Serverless Invocation Middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Only listen locally if not inside a serverless / production Vercel environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  });
}

// Export the app for Vercel
module.exports = app;
