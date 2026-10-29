const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({});
userSchema.plugin(plm); // adds username, hash, salt, register(), authenticate()
module.exports = mongoose.model('User', userSchema);
