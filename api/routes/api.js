const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Connection = require('../models/Connection');
const Event = require('../models/Event');
const bcrypt = require('bcryptjs');
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

    // Find connections where user is either user1 or user2, and status is accepted
    const connections = await Connection.find({
      $or: [{ user1_id: userId }, { user2_id: userId }],
      status: 'accepted'
    }).populate('user1_id', '-password').populate('user2_id', '-password').sort({ timestamp: -1 });

    const hiddenIds = requestingUser.hiddenConnections ? requestingUser.hiddenConnections.map(id => id.toString()) : [];

    // Filter out anomalous missing users
    const validConnections = connections.filter(conn => conn.user1_id && conn.user2_id);

    // Format the return array to include user and connectionId
    let history = validConnections.map(conn => {
      const otherUser = conn.user1_id._id.toString() === userId ? conn.user2_id : conn.user1_id;
      return { user: otherUser, connectionId: conn._id.toString() };
    });

    // Filter out hidden connections
    history = history.filter(item => !hiddenIds.includes(item.user._id.toString()));

    // Deduplicate history array by user ID
    const uniqueHistory = [];
    const seen = new Set();
    for (const item of history) {
      if (!seen.has(item.user._id.toString())) {
        seen.add(item.user._id.toString());
        uniqueHistory.push(item);
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

// POST /api/admin/organizers - Create an Event Organizer
router.post('/admin/organizers', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({
      username, email, password: hashedPassword, firstName, lastName, role: 'organizer', isProfileComplete: true
    });
    await user.save();
    res.status(201).json({ message: 'Organizer created successfully', user });
  } catch (error) {
    console.error('Create Organizer Error:', error);
    res.status(500).json({ error: 'Server error creating organizer' });
  }
});

// --- EVENTS ---

// POST /api/events - Create an event
router.post('/events', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'organizer') return res.status(403).json({ error: 'Only organizers can create events' });
    
    const { name, city, address, maxCapacity } = req.body;
    
    // Default coordinates for some major Israeli cities for distance sorting
    const cityCoords = {
      'Tel Aviv': { lat: 32.0853, lon: 34.7818 },
      'Jerusalem': { lat: 31.7683, lon: 35.2137 },
      'Haifa': { lat: 32.7940, lon: 34.9896 },
      'Beersheba': { lat: 31.2520, lon: 34.7915 },
      'Netanya': { lat: 32.3215, lon: 34.8532 },
      'Ashdod': { lat: 31.8044, lon: 34.6553 },
      'Petah Tikva': { lat: 32.0840, lon: 34.8878 },
      'Rishon LeZion': { lat: 31.9730, lon: 34.7925 }
    };
    
    const coords = cityCoords[city] || { lat: 32.0853, lon: 34.7818 }; // Default to TA if not found

    const event = new Event({
      name, 
      locationText: `${address}, ${city}`, 
      lat: coords.lat, 
      lon: coords.lon, 
      maxCapacity, 
      organizerId: user._id, 
      connectedUsers: []
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Create Event Error:', err);
    res.status(500).json({ error: 'Server error creating event' });
  }
});

// DELETE /api/events/:id - Delete an event (Organizer only)
router.delete('/events/:id', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting event' });
  }
});

// GET /api/events/organizer - Get events for logged-in organizer
router.get('/events/organizer', isAuthenticated, async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id })
      .populate('connectedUsers', '-password')
      .sort({ timestamp: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// GET /api/events - Get all events (for regular users)
router.get('/events', isAuthenticated, async (req, res) => {
  try {
    const events = await Event.find().populate('organizerId', 'firstName lastName');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching events' });
  }
});

// POST /api/events/:id/connect - User connects directly to an event
router.post('/events/:id/connect', isAuthenticated, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.connectedUsers.length >= event.maxCapacity) {
      return res.status(400).json({ error: 'Event is fully booked' });
    }
    
    if (event.connectedUsers.includes(userId)) {
      return res.status(400).json({ error: 'Already connected to this event' });
    }
    
    event.connectedUsers.push(userId);
    await event.save();
    
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Server error connecting to event' });
  }
});

// GET /api/connections/:id
router.get('/connections/:id', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/connections/:id/accept
router.post('/connections/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body;
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    if (!connection.acceptedBy.includes(userId)) {
      connection.acceptedBy.push(userId);
    }
    
    if (connection.acceptedBy.length >= 2) {
      connection.status = 'accepted';
    }
    
    await connection.save();
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/connections/:id/reject
router.post('/connections/:id/reject', async (req, res) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/connections/:id/messages
router.post('/connections/:id/messages', async (req, res) => {
  try {
    const { senderId, text } = req.body;
    
    // Add new message and use $slice to keep only the last 5 messages
    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          messages: {
            $each: [{ sender: senderId, text, timestamp: new Date() }],
            $slice: -5 // keep last 5
          } 
        } 
      },
      { new: true }
    );
    
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: 'Server error sending message' });
  }
});

module.exports = router;
