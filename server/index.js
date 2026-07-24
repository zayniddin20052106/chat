const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const db = require('./db');
const { connectMongo, isMongoConnected } = db;
const { messagesStore, usersStore, groupsStore } = db;

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Uploaded Media Files
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve Production Client Assets
const CLIENT_DIST_DIR = path.join(__dirname, '../client/dist');
app.use(express.static(CLIENT_DIST_DIR));

// Attach API Routes
app.use('/api/connect/auth', require('./routes/connectAuth'));
app.use('/api/connect/search', require('./routes/connectSearch'));
app.use('/api/connect/friends', require('./routes/connectFriends'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Expose io instance to express app for admin broadcast
app.set('io', io);

const onlineSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('⚡ ConnectX socket connected:', socket.id);

  socket.on('user_online', ({ userId, username }) => {
    if (userId) {
      onlineSockets.set(userId, socket.id);
      io.emit('online_users_update', Array.from(onlineSockets.keys()));
    }
  });

  socket.on('join_chat', ({ chatId }) => {
    socket.join(chatId);
  });

  socket.on('send_message', (data) => {
    try {
      const { senderId, senderName, senderUsername, senderAvatar, senderUserId, recipientId, groupId, channelId, text, voiceNote, attachments, replyTo } = data;

      const savedMsg = messagesStore.insertOne({
        senderId,
        senderName,
        senderUsername,
        senderAvatar,
        senderUserId,
        recipientId,
        groupId,
        channelId,
        text,
        voiceNote,
        attachments,
        replyTo,
        read: false,
        reactions: []
      });

      if (groupId) {
        io.to(groupId).emit('receive_message', savedMsg);
      } else if (channelId) {
        io.emit('receive_message', savedMsg);
      } else if (recipientId) {
        io.emit('receive_message', savedMsg);
      }
    } catch (err) {
      console.error('Send message socket error:', err);
    }
  });

  socket.on('mark_messages_read', ({ chatId, userId }) => {
    try {
      const allMsgs = messagesStore.get();
      let updatedAny = false;

      allMsgs.forEach(m => {
        if (m.senderId === chatId && (m.recipientId === userId || m.recipientId === userId?.toString()) && !m.read) {
          m.read = true;
          updatedAny = true;
        }
      });

      if (updatedAny) {
        messagesStore.save(allMsgs);
        io.emit('messages_read_update', { chatId, userId });
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }
  });

  socket.on('add_reaction', ({ messageId, userId, emoji }) => {
    try {
      const msg = messagesStore.findById(messageId);
      if (msg) {
        let reactions = msg.reactions || [];
        const existingIdx = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        if (existingIdx > -1) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions.push({ userId, emoji });
        }
        const updatedMsg = messagesStore.updateOne(messageId, { reactions });
        io.emit('message_reaction_updated', updatedMsg);
      }
    } catch (err) {
      console.error('Reaction socket error:', err);
    }
  });

  // Real-time typing indicators
  socket.on('typing_start', (payload) => {
    socket.broadcast.emit('user_typing_start', payload);
  });

  socket.on('typing_stop', (payload) => {
    socket.broadcast.emit('user_typing_stop', payload);
  });

  // WebRTC Video & Voice Signaling Events
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
    } else {
      io.emit('incoming_call', {
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
    } else {
      io.emit('call_accepted', signal);
    }
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    const targetSocketId = onlineSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', candidate);
    } else {
      io.emit('ice_candidate', candidate);
    }
  });

  socket.on('end_call', ({ to }) => {
    const targetSocketId = onlineSockets.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_ended');
    } else {
      io.emit('call_ended');
    }
  });

  socket.on('disconnect', () => {
    for (let [uId, sId] of onlineSockets.entries()) {
      if (sId === socket.id) {
        onlineSockets.delete(uId);
        break;
      }
    }
    io.emit('online_users_update', Array.from(onlineSockets.keys()));
  });
});

// Fallback HTML5 Client Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5001;

async function startApp() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`🚀 ConnectX Platform Server running on http://localhost:${PORT}`);
  });
}

startApp();
