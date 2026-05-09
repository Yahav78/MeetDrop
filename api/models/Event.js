const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locationText: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  maxCapacity: { type: Number, required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  connectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
