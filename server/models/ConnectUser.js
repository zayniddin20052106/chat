const mongoose = require('mongoose');

const ConnectUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // e.g. "CX102938"
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  coverPhoto: { type: String, default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  bio: { type: String, default: 'Hey there! I am using ConnectX.' },
  country: { type: String, default: 'United States' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['online', 'offline', 'away'], default: 'online' },
  lastSeen: { type: Date, default: Date.now },
  joinDate: { type: Date, default: Date.now },
  isBanned: { type: Boolean, default: false },
  friends: [{ type: String }],
  blockedUsers: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ConnectUser || mongoose.model('ConnectUser', ConnectUserSchema);
