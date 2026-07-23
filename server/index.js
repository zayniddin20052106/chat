const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, isMongoConnected, messagesStore, usersStore, groupsStore, notificationsStore } = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ConnectX API Routes
app.use('/api/connect/auth', require('./routes/connectAuth'));
app.use('/api/connect/search', require('./routes/connectSearch'));
app.use('/api/connect/friends', require('./routes/connectFriends'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Serve Vite static production build if available
const clientBuildPath = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Track connected socket sessions and WebRTC active calls
const onlineSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('⚡ ConnectX socket connected:', socket.id);

  socket.on('user_online', ({ userId, username }) => {
    onlineSockets.set(userId, socket.id);
    io.emit('online_users_update', Array.from(onlineSockets.keys()));
  });

  socket.on('join_chat', ({ chatId }) => {
    socket.join(chatId);
  });

  socket.on('leave_chat', ({ chatId }) => {
    socket.leave(chatId);
  });

  // Real-time Chat Messaging
  socket.on('send_message', (data) => {
    try {
      const { senderId, senderName, senderUsername, senderAvatar, senderUserId, recipientId, groupId, channelId, text, voiceNote, attachments, replyTo } = data;

      const savedMsg = messagesStore.insertOne({
        senderId,
        senderName,
        senderUsername,
        senderAvatar,
        senderUserId,
        recipientId: recipientId || null,
        groupId: groupId || null,
        channelId: channelId || null,
        text: text || '',
        voiceNote: voiceNote || null,
        attachments: attachments || [],
        reactions: [],
        replyTo: replyTo || null,
        isEdited: false,
        isDeleted: false
      });

      if (groupId) {
        io.to(groupId).emit('receive_message', savedMsg);
      } else if (channelId) {
        io.emit('receive_message', savedMsg);
      } else if (recipientId) {
        io.emit('receive_message', savedMsg);
      }
    } catch (err) {
      console.error('Message save error:', err);
    }
  });

  // Message Reactions
  socket.on('add_reaction', ({ messageId, emoji, userId, username }) => {
    const msg = messagesStore.findById(messageId);
    if (msg) {
      let reactions = msg.reactions || [];
      reactions = reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
      reactions.push({ emoji, userId, username });
      const updated = messagesStore.updateOne(messageId, { reactions });
      io.emit('message_reaction_updated', updated);
    }
  });

  // WebRTC Signaling: Voice & Video Call
  socket.on('call_user', ({ userToCall, signalData, from, callerName, callerAvatar, isVideoCall }) => {
    const targetSocketId = onlineSockets.get(userToCall);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming_call', {
        signal: signalData,
        from,
        callerName,
        callerAvatar,
        isVideoCall
      });
    }
  });

  socket.on('answer_call', ({ to, signal }) => {
    const targetSocketId = onlineSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_accepted', signal);
    }
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    const targetSocketId = onlineSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', candidate);
    }
  });

  socket.on('end_call', ({ to }) => {
    const targetSocketId = onlineSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_ended');
    }
  });

  socket.on('typing', ({ chatId, username }) => {
    socket.to(chatId).emit('user_typing', { chatId, username });
  });

  socket.on('stop_typing', ({ chatId }) => {
    socket.to(chatId).emit('user_stop_typing', { chatId });
  });

  socket.on('disconnect', () => {
    for (let [uid, sid] of onlineSockets.entries()) {
      if (sid === socket.id) {
        onlineSockets.delete(uid);
        break;
      }
    }
    io.emit('online_users_update', Array.from(onlineSockets.keys()));
  });
});

async function seedConnectXData() {
  try {
    const existingGroups = groupsStore.get();
    if (existingGroups.length === 0) {
      // Seed Default Global Channel
      groupsStore.insertOne({
        name: 'ConnectX Official Announcements',
        description: 'Official product updates, WebRTC video calling releases & community news.',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXOfficial',
        coverPhoto: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
        type: 'public_channel',
        creatorId: 'system',
        inviteCode: 'CXNEWS',
        members: [],
        admins: ['system'],
        pinnedMessages: []
      });

      console.log('🌱 ConnectX default channels initialized!');
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  await seedConnectXData();
  server.listen(PORT, () => {
    console.log(`🚀 ConnectX Platform Server running on http://localhost:${PORT}`);
  });
}

startServer();
