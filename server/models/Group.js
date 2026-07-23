const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  type: { type: String, enum: ['group', 'course', 'channel'], default: 'group' },
  creatorId: { type: String, required: true },
  teacherId: { type: String, default: '' },
  courseCode: { type: String, default: '' },
  members: [{ type: String }],
  admins: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Group || mongoose.model('Group', GroupSchema);
