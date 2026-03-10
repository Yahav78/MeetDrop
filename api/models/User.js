const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isProfileComplete: { type: Boolean, default: false },
  jobTitle: { type: String },
  bio: { type: String },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hiddenConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('User', userSchema);
