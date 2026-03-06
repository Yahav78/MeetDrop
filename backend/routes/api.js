const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Connection = require('../models/Connection');
const { handleMatchRequest } = require('../services/matchmaker');

// GET /api/users/:id - Fetch profile
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id - Update profile
router.put('/users/:id', async (req, res) => {
  try {
    const { name, jobTitle, bio, githubUrl, linkedinUrl } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, jobTitle, bio, githubUrl, linkedinUrl } },
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:id/history - Get Connection History
router.get('/users/:id/history', async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = await User.findById(userId);

    // Find connections where user is either user1 or user2
    const connections = await Connection.find({
      $or: [{ user1_id: userId }, { user2_id: userId }]
    }).populate('user1_id', '-password').populate('user2_id', '-password').sort({ timestamp: -1 });

    const hiddenIds = requestingUser.hiddenConnections ? requestingUser.hiddenConnections.map(id => id.toString()) : [];

    // Format the return array to just be a list of the *other* users
    let history = connections.map(conn => {
      // The matched user is whichever one is NOT the requester
      return conn.user1_id._id.toString() === userId ? conn.user2_id : conn.user1_id;
    });

    // Filter out hidden connections
    history = history.filter(u => !hiddenIds.includes(u._id.toString()));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/users/:id/favorites/:targetId - Add Favorite
router.post('/users/:id/favorites/:targetId', async (req, res) => {
  try {
     const user = await User.findByIdAndUpdate(
       req.params.id, 
       { $addToSet: { favorites: req.params.targetId } },
       { new: true }
     ).select('-password');
     res.json(user);
  } catch (err) {
     res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/users/:id/favorites/:targetId - Remove Favorite
router.delete('/users/:id/favorites/:targetId', async (req, res) => {
  try {
     const user = await User.findByIdAndUpdate(
       req.params.id, 
       { $pull: { favorites: req.params.targetId } },
       { new: true }
     ).select('-password');
     res.json(user);
  } catch (err) {
     res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// POST /api/users/:id/history/hide/:targetId - Hide Connection
router.post('/users/:id/history/hide/:targetId', async (req, res) => {
  try {
     const user = await User.findByIdAndUpdate(
       req.params.id, 
       { $addToSet: { hiddenConnections: req.params.targetId } },
       { new: true }
     ).select('-password');
     res.json(user);
  } catch (err) {
     res.status(500).json({ error: 'Failed to hide connection' });
  }
});

// POST /api/match - Start matching
router.post('/match', async (req, res) => {
  const { userId, lat, lon } = req.body;

  if (!userId || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Missing userId, lat, or lon' });
  }

  // Delegate to matchmaker service
  await handleMatchRequest(userId, lat, lon, req, res);
});

// GET /api/admin/users - Get All Users for Admin Dashboard
router.get('/admin/users', async (req, res) => {
  try {
    // In a real app we would check the JWT middleware here to verify isAdmin === true.
    // For MVP scope, we rely on UI hiding.
    const users = await User.find({}).select('-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching admin users' });
  }
});

module.exports = router;
