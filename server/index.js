const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { 
  connectDB, isMongoConnected, 
  usersStore, chatsStore, messagesStore, groupsStore, channelsStore 
} = require('./db');

const app = express();
const server = http.createServer(app);

// Enable CORS for separated Vercel frontend / Render backend
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database (MongoDB or Fallback Local Store)
connectDB();

// API Routes
app.use('/api/connect/auth', require('./routes/connectAuth'));
app.use('/api/connect/search', require('./routes/connectSearch'));
app.use('/api/connect/friends', require('./routes/connectFriends'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Serve Vite Production Frontend in single-domain deployments
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.send('ConnectX Platform Server is Running. Frontend dist directory not found.');
    }
  });
});

// Socket.io Real-Time Engine Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

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
        messagesStore.updateOne(messageId, { reactions });
        const updatedMsg = messagesStore.findById(messageId);
        io.emit('message_reaction_updated', updatedMsg);
      }
    } catch (e) {
      console.error('Add reaction socket error:', e);
    }
  });

  // Real-time typing indicators
  socket.on('typing_start', ({ senderId, recipientId, groupId, channelId, username, fullName }) => {
    if (groupId) {
      socket.to(groupId).emit('user_typing_start', { senderId, groupId, username, fullName });
    } else if (channelId) {
      socket.to(channelId).emit('user_typing_start', { senderId, channelId, username, fullName });
    } else if (recipientId) {
      io.emit('user_typing_start', { senderId, recipientId, username, fullName });
    }
  });

  socket.on('typing_stop', ({ senderId, recipientId, groupId, channelId }) => {
    if (groupId) {
      socket.to(groupId).emit('user_typing_stop', { senderId, groupId });
    } else if (channelId) {
      socket.to(channelId).emit('user_typing_stop', { senderId, channelId });
    } else if (recipientId) {
      io.emit('user_typing_stop', { senderId, recipientId });
    }
  });

  // WebRTC Signaling Handlers
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
      groupsStore.insertOne({
        name: 'ConnectX Official Announcements',
        description: 'Official product updates, WebRTC video calling releases & community news.',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXOfficial',
        coverPhoto: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
        type: 'public_channel',
        creatorId: 'system',
        inviteCode: 'CXNEWS',
        members: ['system'],
        admins: ['system']
      });
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seedConnectXData();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 ConnectX Platform Server running on http://localhost:${PORT}`);
});
