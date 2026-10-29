const mongoose = require('mongoose');
module.exports = mongoose.model('Score', new mongoose.Schema({
  username: String,
  total: Number,
  timeMs: Number,
  completed: Boolean,
  route: String,
  createdAt: { type: Date, default: Date.now }
}));
