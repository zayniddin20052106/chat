import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

import ConnectAuthModal from './components/ConnectAuthModal';
import ConnectSidebar from './components/ConnectSidebar';
import ConnectChatArea from './components/ConnectChatArea';
import WebRTCCallModal from './components/WebRTCCallModal';
import FriendsManager from './components/FriendsManager';
import UserProfileModal from './components/UserProfileModal';
import ConnectAdminPanel from './components/ConnectAdminPanel';
import NewChatModal from './components/NewChatModal';
import PWAInstallModal from './components/PWAInstallModal';
import { playMessageSound } from './soundHelper';
import { getFullMediaUrl } from './apiConfig';

let socket;

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('connectx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [typingUsers, setTypingUsers] = useState({});

  // WebRTC Calling State
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);

  // Modals & PWA Install State
  const [showFriendsManager, setShowFriendsManager] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);

  // Set global axios auth header whenever token exists
  useEffect(() => {
    const token = localStorage.getItem('connectx_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [currentUser]);

  // Auto-verify token & restore account session on launch
  useEffect(() => {
    const verifyUserToken = async () => {
      const token = localStorage.getItem('connectx_token');
      if (!token) return;

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/connect/auth/me');
        if (res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('connectx_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Session verify failed:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('connectx_token');
          localStorage.removeItem('connectx_user');
          delete axios.defaults.headers.common['Authorization'];
          setCurrentUser(null);
        }
      }
    };

    verifyUserToken();
  }, []);

  // Register PWA Service Worker & Request Notification Permission
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Show PWA install download modal on mobile devices
    const isMobile = /iphone|ipad|ipod|android/.test(navigator.userAgent.toLowerCase());
    const hasSeenPWA = localStorage.getItem('connectx_pwa_dismissed');
    if (isMobile && !hasSeenPWA) {
      setShowPWAInstallModal(true);
    }
  }, []);

  // Dark mode theme sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Connect socket.io & setup WebRTC signaling
  useEffect(() => {
    if (!currentUser) return;

    const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.emit('user_online', {
      userId: currentUser._id || currentUser.id,
      username: currentUser.username
    });

    fetchInitialData();

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Play notification chime sound for every incoming message
      playMessageSound();

      const myId = currentUser._id || currentUser.id;
      const isMe = msg.senderId === myId;

      if (!isMe && msg.senderId) {
        setUsers((prevUsers) => {
          const senderId = msg.senderId;
          const exists = prevUsers.find(u => u._id === senderId || u.id === senderId);
          if (exists) {
            const others = prevUsers.filter(u => u._id !== senderId && u.id !== senderId);
            return [exists, ...others];
          } else {
            const newSender = {
              _id: senderId,
              id: senderId,
              fullName: msg.senderName || 'ConnectUser',
              username: msg.senderUsername || 'user',
              avatar: msg.senderAvatar,
              userId: msg.senderUserId || 'CX000000',
              bio: ''
            };
            return [newSender, ...prevUsers];
          }
        });
      }

      // Trigger Native Push Notification if user is in background or tab is minimized
      if (!isMe && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden || window.innerWidth < 768) {
          const notificationTitle = `${msg.senderName} (ConnectX)`;
          const notificationOptions = {
            body: msg.text || (msg.attachments?.length > 0 ? '📷 Sent an attachment' : '🎤 Sent a voice note'),
            icon: msg.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ConnectXApp',
            badge: 'https://api.dicebear.com/7.x/bottts/svg?seed=ConnectXApp',
            tag: msg._id
          };
          new Notification(notificationTitle, notificationOptions);
        }
      }
    });

    socket.on('message_reaction_updated', (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    // Real-time typing status listeners
    socket.on('user_typing_start', ({ senderId, recipientId, groupId, channelId, fullName }) => {
      const chatId = groupId || channelId || senderId;
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: { senderId, fullName }
      }));
    });

    socket.on('user_typing_stop', ({ senderId, recipientId, groupId, channelId }) => {
      const chatId = groupId || channelId || senderId;
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
    });

    // WebRTC Signaling Listeners
    socket.on('incoming_call', ({ signal, from, callerName, callerAvatar, isVideoCall }) => {
      playMessageSound();
      setActiveCall({
        isIncoming: true,
        from,
        callerName,
        callerAvatar,
        isVideoCall,
        signal
      });
    });

    socket.on('call_accepted', async (signal) => {
      if (peerConnectionRef.current && signal) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });

    socket.on('ice_candidate', async (candidate) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('ICE Candidate error:', e);
        }
      }
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Fetch messages on activeChat change
  useEffect(() => {
    if (!activeChat) return;

    if (socket) {
      socket.emit('join_chat', { chatId: activeChat.id });
    }

    fetchMessages(activeChat.id, activeChat.type);
  }, [activeChat]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('connectx_token');
      if (!token) return;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get('/api/groups/list');
      setUsers(res.data.users || []);
      setGroups(res.data.groups || []);

      if (!activeChat && res.data.users?.length > 0 && window.innerWidth >= 768) {
        const u = res.data.users[0];
        setActiveChat({ id: u._id || u.id, name: u.fullName, username: u.username, type: 'private', avatar: u.avatar, userId: u.userId, bio: u.bio });
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const handleSelectUserChat = (targetUserChat) => {
    setActiveChat(targetUserChat);
    setUsers((prevUsers) => {
      const exists = prevUsers.some(u => u._id === targetUserChat.id || u.id === targetUserChat.id);
      if (!exists) {
        const newContact = {
          _id: targetUserChat.id,
          id: targetUserChat.id,
          fullName: targetUserChat.name,
          username: targetUserChat.username,
          avatar: targetUserChat.avatar,
          userId: targetUserChat.userId,
          bio: targetUserChat.bio || ''
        };
        return [newContact, ...prevUsers];
      }
      return prevUsers;
    });
  };

  const fetchMessages = async (chatId, chatType) => {
    try {
      const token = localStorage.getItem('connectx_token');
      if (!token) return;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get(`/api/messages?chatId=${chatId}&chatType=${chatType}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // WebRTC Start Call Trigger (HD Quality Camera Stream)
  const handleStartCall = async (userToCallId, isVideoCall) => {
    try {
      const videoConstraints = isVideoCall ? {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user'
      } : false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { to: userToCallId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        userToCall: userToCallId,
        signalData: offer,
        from: currentUser._id || currentUser.id,
        callerName: currentUser.fullName,
        callerAvatar: currentUser.avatar,
        isVideoCall
      });

      setActiveCall({
        isIncoming: false,
        to: userToCallId,
        callerName: activeChat?.name,
        callerAvatar: activeChat?.avatar,
        isVideoCall
      });
    } catch (err) {
      alert('Could not access microphone/camera for call');
    }
  };

  const handleAcceptCall = async () => {
    try {
      const videoConstraints = activeCall.isVideoCall ? {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user'
      } : false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { to: activeCall.from, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(activeCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', { to: activeCall.from, signal: answer });
      setActiveCall({ ...activeCall, isIncoming: false });
    } catch (err) {
      alert('Failed to accept WebRTC video call');
    }
  };

  const handleEndCall = () => {
    if (activeCall) {
      const targetId = activeCall.from || activeCall.to;
      socket.emit('end_call', { to: targetId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
  };

  const handleSendMessage = ({ text, voiceNote, attachments, replyTo }) => {
    if (!activeChat || !currentUser) return;

    const payload = {
      senderId: currentUser._id || currentUser.id,
      senderName: currentUser.fullName,
      senderUsername: currentUser.username,
      senderAvatar: currentUser.avatar,
      senderUserId: currentUser.userId,
      recipientId: activeChat.type === 'private' ? activeChat.id : null,
      groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
      channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null,
      text,
      voiceNote,
      attachments,
      replyTo
    };

    socket.emit('send_message', payload);
  };

  const handleAddReaction = (messageId, emoji) => {
    socket.emit('add_reaction', {
      messageId,
      userId: currentUser._id || currentUser.id,
      emoji
    });
  };

  const handleOpenMyProfile = () => {
    setProfileModalUser(currentUser);
    setShowUserProfileModal(true);
  };

  const handleOpenChatProfile = () => {
    if (activeChat && activeChat.type === 'private') {
      const targetUserObj = users.find(u => (u._id === activeChat.id || u.id === activeChat.id)) || {
        _id: activeChat.id,
        fullName: activeChat.name,
        username: activeChat.username,
        avatar: activeChat.avatar,
        userId: activeChat.userId,
        bio: activeChat.bio
      };
      setProfileModalUser(targetUserObj);
      setShowUserProfileModal(true);
    } else {
      handleOpenMyProfile();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('connectx_token');
    localStorage.removeItem('connectx_user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <ConnectAuthModal
        onAuthSuccess={(user, token) => {
          localStorage.setItem('connectx_token', token);
          localStorage.setItem('connectx_user', JSON.stringify(user));
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className={`w-screen h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {/* Left Sidebar */}
        <div className={`${activeChat ? 'hidden md:flex' : 'w-full md:w-80 lg:w-96'} shrink-0 h-full`}>
          <ConnectSidebar
            currentUser={currentUser}
            users={users}
            groups={groups}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            onSelectUserChat={handleSelectUserChat}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'friends') setShowFriendsManager(true);
            }}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onOpenNewChatModal={() => setShowNewChatModal(true)}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
            onOpenProfileModal={handleOpenMyProfile}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Chat Window */}
        <div className={`${activeChat ? 'w-full flex-1 flex' : 'hidden md:flex flex-1'} h-full flex-col`}>
          <ConnectChatArea
            currentUser={currentUser}
            activeChat={activeChat}
            messages={messages}
            typingUser={activeChat ? typingUsers[activeChat.id] : null}
            socket={socket}
            onSendMessage={handleSendMessage}
            onEditMessage={() => {}}
            onDeleteMessage={() => {}}
            onAddReaction={handleAddReaction}
            onStartCall={handleStartCall}
            onOpenProfileModal={handleOpenChatProfile}
            onBackToChats={() => setActiveChat(null)}
          />
        </div>

        {/* Mobile PWA Download / Install App Modal */}
        {showPWAInstallModal && (
          <PWAInstallModal
            onClose={() => {
              setShowPWAInstallModal(false);
              localStorage.setItem('connectx_pwa_dismissed', 'true');
            }}
          />
        )}

        {/* Modals & WebRTC Call Overlay */}
        {activeCall && (
          <WebRTCCallModal
            currentUser={currentUser}
            activeCall={activeCall}
            onAcceptCall={handleAcceptCall}
            onEndCall={handleEndCall}
            localStream={localStream}
            remoteStream={remoteStream}
          />
        )}

        {showFriendsManager && (
          <FriendsManager
            currentUser={currentUser}
            onStartDirectChat={(chat) => handleSelectUserChat(chat)}
            onClose={() => setShowFriendsManager(false)}
          />
        )}

        {showUserProfileModal && (
          <UserProfileModal
            currentUser={currentUser}
            profileUser={profileModalUser}
            onClose={() => setShowUserProfileModal(false)}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('connectx_user', JSON.stringify(updated));
            }}
          />
        )}

        {showAdminPanel && (
          <ConnectAdminPanel
            currentUser={currentUser}
            onClose={() => setShowAdminPanel(false)}
          />
        )}

        {showNewChatModal && (
          <NewChatModal
            currentUser={currentUser}
            onClose={() => setShowNewChatModal(false)}
            onCreated={(newGroup) => {
              setGroups([...groups, newGroup]);
              setActiveChat({
                id: newGroup._id,
                name: newGroup.name,
                type: newGroup.type,
                avatar: newGroup.avatar,
                description: newGroup.description,
                inviteCode: newGroup.inviteCode
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
