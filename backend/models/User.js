const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  jobTitle: { type: String },
  bio: { type: String },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
});

module.exports = mongoose.model('User', userSchema);
