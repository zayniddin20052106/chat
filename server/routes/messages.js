const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const Message = require('../models/Message');

// GET /api/messages?chatId=xyz&chatType=private|group|channel
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { chatId, chatType } = req.query;
    const currentUserId = req.user.id;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    if (db.isMongoConnected()) {
      let query = {};
      if (chatType === 'private') {
        query = {
          $or: [
            { senderId: currentUserId, recipientId: chatId },
            { senderId: chatId, recipientId: currentUserId }
          ]
        };
      } else if (chatType === 'group' || chatType === 'course') {
        query = { groupId: chatId };
      } else if (chatType === 'channel') {
        query = { channelId: chatId };
      }

      const messages = await Message.find(query).sort({ createdAt: 1 }).limit(200);
      return res.json({ messages });
    } else {
      let messages = [];
      if (chatType === 'private') {
        messages = db.messagesStore.find(m => 
          (m.senderId === currentUserId && m.recipientId === chatId) ||
          (m.senderId === chatId && m.recipientId === currentUserId)
        );
      } else if (chatType === 'group' || chatType === 'course') {
        messages = db.messagesStore.find(m => m.groupId === chatId);
      } else if (chatType === 'channel') {
        messages = db.messagesStore.find(m => m.channelId === chatId);
      }

      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return res.json({ messages });
    }
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// PUT /api/messages/:id (Edit message)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const messageId = req.params.id;

    if (db.isMongoConnected()) {
      const msg = await Message.findById(messageId);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId !== req.user.id) return res.status(403).json({ error: 'Unauthorized to edit this message' });

      msg.text = text;
      msg.isEdited = true;
      await msg.save();
      return res.json({ message: msg });
    } else {
      const msg = db.messagesStore.findById(messageId);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId !== req.user.id) return res.status(403).json({ error: 'Unauthorized to edit this message' });

      const updated = db.messagesStore.updateOne(messageId, { text, isEdited: true });
      return res.json({ message: updated });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE /api/messages/:id (Delete message)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;

    if (db.isMongoConnected()) {
      const msg = await Message.findById(messageId);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this message' });
      }

      msg.isDeleted = true;
      msg.text = 'This message was deleted';
      msg.attachments = [];
      await msg.save();
      return res.json({ message: msg });
    } else {
      const msg = db.messagesStore.findById(messageId);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to delete this message' });
      }

      const updated = db.messagesStore.updateOne(messageId, {
        isDeleted: true,
        text: 'This message was deleted',
        attachments: []
      });
      return res.json({ message: updated });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
