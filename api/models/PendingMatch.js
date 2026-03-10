const mongoose = require('mongoose');

const pendingMatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now, expires: '60s' } // Auto-delete after 60 seconds
});

module.exports = mongoose.model('PendingMatch', pendingMatchSchema);
