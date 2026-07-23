const mongoose = require('mongoose');

const ConnectMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderUsername: { type: String, required: true },
  senderAvatar: { type: String, default: '' },
  senderUserId: { type: String, required: true }, // CX######
  recipientId: { type: String, default: null },   // Direct Chat
  groupId: { type: String, default: null },       // Group Chat
  channelId: { type: String, default: null },     // Channel Post
  text: { type: String, default: '' },
  voiceNote: {
    fileUrl: String,
    duration: Number
  },
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String, // image, video, voice, pdf, zip, document
    fileSize: Number
  }],
  reactions: [{
    emoji: String,
    userId: String,
    username: String
  }],
  replyTo: {
    messageId: String,
    senderName: String,
    text: String
  },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  readBy: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ConnectMessage || mongoose.model('ConnectMessage', ConnectMessageSchema);
