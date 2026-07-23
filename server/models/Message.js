const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, default: '' },
  senderRole: { type: String, default: 'student' },
  recipientId: { type: String, default: null }, // for private message
  groupId: { type: String, default: null },     // for group/course message
  channelId: { type: String, default: null },   // for channel broadcast
  text: { type: String, default: '' },
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String, // image, video, pdf, document
    fileSize: Number
  }],
  replyTo: {
    messageId: String,
    senderName: String,
    text: String
  },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
