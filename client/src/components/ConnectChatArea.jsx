import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Smile, Phone, Video, MoreVertical, 
  Edit2, Trash2, Reply, FileText, Image as ImageIcon, Download, 
  X, Mic, Check, CheckCheck, Play, Pause, Sparkles, Heart, Loader2, ArrowLeft 
} from 'lucide-react';
import axios from 'axios';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import { getFullMediaUrl } from '../apiConfig';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '👏', '😂', '😮', '🚀', '💯'];

export default function ConnectChatArea({
  currentUser,
  activeChat,
  messages,
  typingUser,
  socket,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onStartCall,
  onOpenProfileModal,
  onBackToChats
}) {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  // Handle typing indicator emissions
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (!socket || !activeChat || !currentUser) return;

    if (val.trim().length > 0) {
      socket.emit('typing_start', {
        senderId: currentUser._id || currentUser.id,
        fullName: currentUser.fullName,
        recipientId: activeChat.type === 'private' ? activeChat.id : null,
        groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
        channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
      });

      if (typingTimeout) clearTimeout(typingTimeout);

      const timeout = setTimeout(() => {
        socket.emit('typing_stop', {
          senderId: currentUser._id || currentUser.id,
          recipientId: activeChat.type === 'private' ? activeChat.id : null,
          groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
          channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
        });
      }, 2500);

      setTypingTimeout(timeout);
    } else {
      if (typingTimeout) clearTimeout(typingTimeout);
      socket.emit('typing_stop', {
        senderId: currentUser._id || currentUser.id,
        recipientId: activeChat.type === 'private' ? activeChat.id : null,
        groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
        channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
      });
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const token = localStorage.getItem('connectx_token');

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const res = await axios.post('/api/upload', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: token ? `Bearer ${token}` : ''
          }
        });

        setAttachments((prev) => [...prev, {
          url: res.data.fileUrl,
          fileName: res.data.fileName,
          fileType: res.data.fileType,
          fileSize: res.data.fileSize
        }]);
      }
    } catch (err) {
      alert('Failed to upload attachment file');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    onSendMessage({
      text: inputText.trim(),
      attachments,
      replyTo: replyingTo ? replyingTo._id : null
    });

    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    if (socket && activeChat) {
      socket.emit('typing_stop', {
        senderId: currentUser._id || currentUser.id,
        recipientId: activeChat.type === 'private' ? activeChat.id : null,
        groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
        channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
      });
    }
  };

  const handleVoiceRecorded = (voiceData) => {
    onSendMessage({
      text: '',
      voiceNote: voiceData,
      attachments: []
    });
    setShowVoiceRecorder(false);
  };

  const handleImgError = (e, seed) => {
    e.target.onerror = null;
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'user')}`;
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-slate-900/50 select-none">
        <div className="w-20 h-20 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">ConnectX HD Real-Time Platform</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Select a chat contact, group, or official channel to start messaging, HD video calling, and media sharing.
        </p>
      </div>
    );
  }

  const activeChatAvatar = getFullMediaUrl(activeChat.avatar, activeChat.name);
  const isTypingActive = !!typingUser;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="p-3 bg-gray-50/90 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackToChats}
            className="md:hidden p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={onOpenProfileModal}>
            <div className="relative shrink-0">
              <img
                src={activeChatAvatar}
                alt={activeChat.name}
                onError={(e) => handleImgError(e, activeChat.name)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-slate-700 bg-slate-800"
              />
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                isTypingActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
              }`}></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                <span className="truncate">{activeChat.name}</span>
                {activeChat.userId && (
                  <span className="font-mono px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold rounded shrink-0">
                    {activeChat.userId}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs truncate">
                {isTypingActive ? (
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <span>{activeChat.type === 'private' ? 'typing...' : `${typingUser.fullName || 'Someone'} is typing...`}</span>
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 capitalize">
                    {activeChat.type === 'private' ? 'Online' : activeChat.type.replace('_', ' ')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeChat.type === 'private' && (
            <>
              <button
                onClick={() => onStartCall(activeChat.id, false)}
                title="Start Voice Call"
                className="p-2 rounded-xl text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-500 transition-all shrink-0"
              >
                <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <button
                onClick={() => onStartCall(activeChat.id, true)}
                title="Start Video Call"
                className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-500 transition-all shrink-0"
              >
                <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </>
          )}

          <button
            onClick={onOpenProfileModal}
            title="Profile Info"
            className="p-2 rounded-xl text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Feed Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-100/40 dark:bg-slate-950/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 italic">
            <span>No messages yet. Send a message to start the conversation!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === (currentUser._id || currentUser.id);
            const senderAvatarUrl = getFullMediaUrl(msg.senderAvatar, msg.senderName || 'user');

            return (
              <div
                key={msg._id || msg.id || Math.random()}
                className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isMe && (
                  <img
                    src={senderAvatarUrl}
                    alt={msg.senderName}
                    onError={(e) => handleImgError(e, msg.senderUsername || 'user')}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                  />
                )}

                <div className="group relative">
                  <div className={`p-3 rounded-2xl shadow-sm space-y-1.5 ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200/80 dark:border-slate-700/60 rounded-bl-none'
                  }`}>
                    {/* Sender Name in Group/Channel */}
                    {!isMe && (activeChat.type !== 'private') && (
                      <div className="text-[11px] font-bold text-blue-500 dark:text-blue-400">
                        {msg.senderName}
                      </div>
                    )}

                    {/* Reply Preview */}
                    {msg.replyTo && (
                      <div className="p-2 bg-black/10 dark:bg-white/10 rounded-lg border-l-2 border-amber-400 text-xs italic opacity-90">
                        Replying to message
                      </div>
                    )}

                    {/* Voice Note Attachment */}
                    {msg.voiceNote && (
                      <div className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-xl">
                        <audio src={getFullMediaUrl(msg.voiceNote.url)} controls className="max-w-xs h-8" />
                      </div>
                    )}

                    {/* Media Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="grid gap-1.5 pt-1">
                        {msg.attachments.map((att, idx) => {
                          const fileFullUrl = getFullMediaUrl(att.url);
                          return (
                            <div key={idx} className="overflow-hidden rounded-xl">
                              {att.fileType === 'image' && (
                                <img
                                  src={fileFullUrl}
                                  alt="Attachment"
                                  className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                                  onClick={() => window.open(fileFullUrl, '_blank')}
                                />
                              )}
                              {att.fileType === 'video' && (
                                <video src={fileFullUrl} controls className="max-h-72 w-full rounded-xl" />
                              )}
                              {att.fileType !== 'image' && att.fileType !== 'video' && (
                                <a
                                  href={fileFullUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 p-3 bg-black/20 hover:bg-black/30 rounded-xl text-xs transition-colors"
                                >
                                  <FileText className="w-5 h-5 text-blue-300 shrink-0" />
                                  <span className="font-medium truncate">{att.fileName}</span>
                                  <Download className="w-4 h-4 ml-auto shrink-0" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.text && (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    )}

                    {/* Message Reactions List */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.reactions.map((r, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-black/20 dark:bg-white/10 rounded-md text-xs">
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Time & Single Checkmark (✓) vs Double Checkmark (✓✓) */}
                    <div className="flex items-center justify-end gap-1 text-[10px] opacity-75 mt-1">
                      <span>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        msg.read || msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-300 font-bold" title="Read (Ko'rildi)" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/80" title="Sent (Yuborildi)" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="p-2 bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto shrink-0">
          {attachments.map((att, idx) => (
            <div key={idx} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <span className="truncate max-w-xs">{att.fileName}</span>
              <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Recorder Overlay */}
      {showVoiceRecorder && (
        <VoiceNoteRecorder
          onRecorded={handleVoiceRecorded}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Bottom Message Input Controls */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
            title="Attach file or photo"
            className="p-2.5 rounded-xl text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            {uploadingMedia ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Paperclip className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            title="Record Voice Note"
            className="p-2.5 rounded-xl text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-500 transition-all shrink-0"
          >
            <Mic className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${activeChat.name}...`}
              className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
