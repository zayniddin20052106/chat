const mongoose = require('mongoose');

const ConnectGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  type: { type: String, enum: ['group', 'public_channel', 'private_channel'], default: 'group' },
  creatorId: { type: String, required: true },
  inviteCode: { type: String, required: true },
  members: [{ type: String }],
  admins: [{ type: String }],
  pinnedMessages: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ConnectGroup || mongoose.model('ConnectGroup', ConnectGroupSchema);
