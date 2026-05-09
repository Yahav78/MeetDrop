const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Connection', connectionSchema);
