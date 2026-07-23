const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongoConnected = false;

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/connectx';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    isMongoConnected = true;
    console.log('🌐 ConnectX MongoDB connected successfully!');
  } catch (err) {
    console.log('MongoDB connection note:', err.message);
    console.log('⚡ ConnectX running in Persistent DB Fallback Mode (JSON storage). All features (WebRTC, DMs, Friends, Channels, Voice Notes) are fully functional!');
    isMongoConnected = false;
  }
}

class LocalStore {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  get() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch {
      return [];
    }
  }

  save(items) {
    fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));
  }

  find(queryFn) {
    const items = this.get();
    if (!queryFn) return items;
    return items.filter(queryFn);
  }

  findOne(queryFn) {
    const items = this.get();
    return items.find(queryFn) || null;
  }

  findById(id) {
    const items = this.get();
    return items.find(item => item._id === id || item.id === id || item.userId === id) || null;
  }

  insertOne(item) {
    const items = this.get();
    const newItem = {
      _id: item._id || 'cx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    items.push(newItem);
    this.save(items);
    return newItem;
  }

  updateOne(id, updates) {
    const items = this.get();
    const index = items.findIndex(item => item._id === id || item.id === id || item.userId === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save(items);
    return items[index];
  }

  deleteOne(id) {
    let items = this.get();
    const initialLen = items.length;
    items = items.filter(item => item._id !== id && item.id !== id);
    this.save(items);
    return items.length < initialLen;
  }
}

const usersStore = new LocalStore('connect_users');
const chatsStore = new LocalStore('connect_chats');
const messagesStore = new LocalStore('connect_messages');
const friendsStore = new LocalStore('connect_friends');
const groupsStore = new LocalStore('connect_groups');
const channelsStore = new LocalStore('connect_channels');
const notificationsStore = new LocalStore('connect_notifications');

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
  usersStore,
  chatsStore,
  messagesStore,
  friendsStore,
  groupsStore,
  channelsStore,
  notificationsStore
};
