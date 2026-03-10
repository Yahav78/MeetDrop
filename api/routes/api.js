const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Connection = require('../models/Connection');
const { handleMatchRequest } = require('../services/matchmaker');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

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
    const { firstName, lastName, jobTitle, bio, githubUrl, linkedinUrl } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { firstName, lastName, jobTitle, bio, githubUrl, linkedinUrl } },
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

    // Filter out hidden connections and anomalous missing users
    const validConnections = connections.filter(conn => conn.user1_id && conn.user2_id);

    // Format the return array to just be a list of the *other* users
    let history = validConnections.map(conn => {
      // The matched user is whichever one is NOT the requester
      return conn.user1_id._id.toString() === userId ? conn.user2_id : conn.user1_id;
    });

    // Filter out hidden connections
    history = history.filter(u => !hiddenIds.includes(u._id.toString()));

    // Deduplicate history array by user ID
    const uniqueHistory = [];
    const seen = new Set();
    for (const u of history) {
      if (!seen.has(u._id.toString())) {
        seen.add(u._id.toString());
        uniqueHistory.push(u);
      }
    }

    res.json(uniqueHistory);
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
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ _id: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching admin users' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use $pull to remove this user from EVERYONE'S favorites and hiddenConnections arrays
    await User.updateMany(
      {},
      { $pull: { favorites: userId, hiddenConnections: userId } }
    );

    // Delete any connection documents where this user was a participant
    await Connection.deleteMany({
      $or: [{ user1_id: userId }, { user2_id: userId }]
    });

    // Finally, wipe the target user entirely
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
