const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1079169142444-dnbe6qsp9nqg1kc6odkq1t6eeds1o99r.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Admin Credentials Hardcoded
const ADMIN_USER = '211521554';
const ADMIN_PASS = 'yv787878';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, jobTitle, bio, githubUrl, linkedinUrl } = req.body;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      jobTitle,
      bio,
      githubUrl,
      linkedinUrl,
      isProfileComplete: true
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google tokens are required' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with google details
      user = new User({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        googleId,
        isProfileComplete: false
        // password is left undefined as it's not required for google users
      });
      // Temporary username, will be overwritten
      user.username = `temp_${googleId}_${Date.now()}`;
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user.googleId = googleId;
      await user.save();
    }

    // Return JWT for the session
    const jwtPayload = {
      user: { id: user.id }
    };

    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '5d' });
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token: jwtToken, user: userObj, isAdmin: user.role === 'admin', requiresProfileSetup: !user.isProfileComplete });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(400).json({ error: 'Authentication failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check for Admin Login
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Create admin token
      const token = jwt.sign(
        { user: { id: 'admin', isAdmin: true } },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.json({ token, isAdmin: true });
    }

    // 2. Normal Login Check
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // Return JWT
    const payload = {
      user: { id: user.id }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '5d' });
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj, isAdmin: user.role === 'admin' });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/check-username/:username
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    res.json({ available: !user });
  } catch (error) {
    console.error('Username Check Error:', error);
    res.status(500).json({ error: 'Server error checking username' });
  }
});

// POST /api/auth/complete-profile
router.post('/complete-profile', async (req, res) => {
  try {
    // Basic extraction from manual authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user || !decoded.user.id) return res.status(401).json({ error: 'Invalid token' });

    const { username, firstName, lastName, jobTitle, bio, githubUrl, linkedinUrl } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser.id !== decoded.user.id) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await User.findById(decoded.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (jobTitle) user.jobTitle = jobTitle;
    if (bio) user.bio = bio;
    if (githubUrl) user.githubUrl = githubUrl;
    if (linkedinUrl) user.linkedinUrl = linkedinUrl;
    user.isProfileComplete = true;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Profile completed successfully', user: userObj });
  } catch (error) {
    console.error('Complete Profile Error:', error);
    res.status(500).json({ error: 'Server error completing profile' });
  }
});

module.exports = router;
