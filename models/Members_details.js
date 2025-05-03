const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: String,
  role: String,
  priority: Number,
  description: String,
  photo: String, // Store photo URL
});

const membersdb = mongoose.model('Member', memberSchema);
module.exports = membersdb;