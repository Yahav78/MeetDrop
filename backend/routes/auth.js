const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client('1079169142444-dnbe6qsp9nqg1kc6odkq1t6eeds1o99r.apps.googleusercontent.com');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Admin Credentials Hardcoded
const ADMIN_USER = '211521554';
const ADMIN_PASS = 'yv787878';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, jobTitle, bio, githubUrl, linkedinUrl } = req.body;

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
      name,
      jobTitle,
      bio,
      githubUrl,
      linkedinUrl
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

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '1079169142444-dnbe6qsp9nqg1kc6odkq1t6eeds1o99r.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with google details
      const username = email.split('@')[0] + Math.floor(Math.random() * 10000); // Generate unique username

      user = new User({
        username,
        email,
        name,
        googleId
        // password is left undefined as it's not required for google users
      });
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

    jwt.sign(
      jwtPayload,
      JWT_SECRET,
      { expiresIn: '5d' },
      (err, jwtToken) => {
        if (err) throw err;
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ token: jwtToken, user: userObj, isAdmin: false });
      }
    );
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google Token' });
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

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        // Optionally send back user ID and object (omitting password)
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ token, user: userObj, isAdmin: false });
      }
    );
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
