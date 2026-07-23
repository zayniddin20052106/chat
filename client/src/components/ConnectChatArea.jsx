import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Smile, Phone, Video, MoreVertical, 
  Edit2, Trash2, Reply, FileText, Image as ImageIcon, Download, 
  X, Mic, CheckCheck, Play, Pause, Sparkles, Heart, Loader2, ArrowLeft 
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const emitTypingStop = () => {
    if (socket && activeChat && currentUser) {
      socket.emit('typing_stop', {
        senderId: currentUser._id || currentUser.id,
        recipientId: activeChat.type === 'private' ? activeChat.id : null,
        groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
        channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
      });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (socket && activeChat && currentUser) {
      const payload = {
        senderId: currentUser._id || currentUser.id,
        fullName: currentUser.fullName,
        username: currentUser.username,
        recipientId: activeChat.type === 'private' ? activeChat.id : null,
        groupId: activeChat.type === 'group' || activeChat.type === 'course' ? activeChat.id : null,
        channelId: activeChat.type === 'public_channel' || activeChat.type === 'private_channel' ? activeChat.id : null
      };

      socket.emit('typing_start', payload);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop();
      }, 2500);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    emitTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (editingMessage) {
      onEditMessage(editingMessage._id, inputText);
      setEditingMessage(null);
      setInputText('');
      return;
    }

    onSendMessage({
      text: inputText,
      attachments,
      replyTo: replyToMessage ? {
        messageId: replyToMessage._id,
        senderName: replyToMessage.senderName,
        text: replyToMessage.text
      } : null
    });

    setInputText('');
    setAttachments([]);
    setReplyToMessage(null);
    setShowEmojiPicker(false);
  };

  const handleVoiceNoteSend = (voiceData) => {
    emitTypingStop();
    onSendMessage({
      text: '',
      voiceNote: voiceData,
      attachments: []
    });
    setShowVoiceRecorder(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      const newAtt = res.data;
      setAttachments(prev => [...prev, newAtt]);
    } catch (err) {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!activeChat) {
    return (
      <main className="flex-1 h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-6 text-center select-none">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 text-white shadow-xl shadow-blue-500/20">
          <Sparkles className="w-12 h-12 animate-pulse" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome to ConnectX</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Select a chat or friend from the sidebar, or search by unique User ID (e.g., <span className="font-mono text-blue-400 font-bold">CX102938</span>) to start messaging & WebRTC calling.
        </p>
      </main>
    );
  }

  const activeChatAvatar = getFullMediaUrl(activeChat.avatar, activeChat.name);
  const isTypingActive = !!typingUser;

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden transition-all ${
        dragOver ? 'ring-4 ring-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20' : ''
      }`}
    >
      {/* Responsive Header Bar with Mobile Back Button */}
      <header className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-xs select-none shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBackToChats}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all shrink-0"
            title="Back to Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0" onClick={onOpenProfileModal}>
            <div className="relative shrink-0">
              <img
                src={activeChatAvatar}
                alt={activeChat.name}
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
                    {activeChat.type === 'private' ? 'Online' : activeChat.type}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* WebRTC Calling Action Buttons */}
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
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-all text-xs font-semibold shrink-0"
          >
            Info
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-repeat" style={{ backgroundImage: `radial-gradient(circle, rgba(51, 65, 85, 0.15) 1px, transparent 1px)`, backgroundSize: '16px 16px' }}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;
          const senderAvatar = getFullMediaUrl(msg.senderAvatar, msg.senderName);
          return (
            <div
              key={msg._id || msg.id}
              className={`flex gap-2 max-w-[88%] sm:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {!isMe && (
                <img src={senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
              )}

              <div className="group relative min-w-0">
                {/* Bubble Container */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl shadow-sm border transition-all ${
                    isMe
                      ? 'bg-blue-600 text-white dark:bg-blue-600/90 border-blue-500 rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-gray-200 dark:border-slate-800 rounded-tl-none'
                  }`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400 mb-1 truncate">
                      <span className="truncate">{msg.senderName}</span>
                      <span className="font-mono text-[9px] opacity-70 shrink-0">({msg.senderUserId})</span>
                    </div>
                  )}

                  {/* Reply Context */}
                  {msg.replyTo && (
                    <div className="p-2 mb-2 rounded-lg bg-black/10 dark:bg-white/10 border-l-2 border-amber-400 text-xs">
                      <div className="font-semibold text-[10px] opacity-80">{msg.replyTo.senderName}</div>
                      <div className="truncate opacity-90">{msg.replyTo.text}</div>
                    </div>
                  )}

                  {/* Voice Note Player */}
                  {msg.voiceNote && (
                    <div className="flex items-center gap-3 p-2 bg-black/10 dark:bg-white/10 rounded-xl mb-2">
                      <audio src={getFullMediaUrl(msg.voiceNote.fileUrl)} controls className="h-8 max-w-[200px]" />
                      <span className="text-[10px] opacity-80 font-mono shrink-0">{msg.voiceNote.duration || 0}s</span>
                    </div>
                  )}

                  {/* Attachments Display */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {msg.attachments.map((att, i) => {
                        const fileFullUrl = getFullMediaUrl(att.fileUrl);
                        return (
                          <div key={i} className="rounded-xl overflow-hidden bg-black/10">
                            {att.fileType === 'image' && (
                              <img
                                src={fileFullUrl}
                                alt={att.fileName}
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

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 mt-1">
                    <span>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Reaction & Action Hover Popover */}
                <div className={`absolute top-0 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-1 rounded-xl shadow-xl z-20 ${
                  isMe ? 'right-full mr-2' : 'left-full ml-2'
                }`}>
                  {REACTION_EMOJIS.slice(0, 4).map((e) => (
                    <button
                      key={e}
                      onClick={() => onAddReaction(msg._id, e)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-sm"
                    >
                      {e}
                    </button>
                  ))}
                  <button onClick={() => setReplyToMessage(msg)} className="p-1 text-slate-400 hover:text-blue-500">
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button onClick={() => onDeleteMessage(msg._id)} className="p-1 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Telegram-style Animated Typing Bubble Indicator */}
        {isTypingActive && (
          <div className="flex gap-2 max-w-[75%] mr-auto animate-fade-in items-center">
            <img src={activeChatAvatar} alt={activeChat.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
                {activeChat.type === 'private' ? `${activeChat.name} is typing` : `${typingUser.fullName || 'Someone'} is typing`}
              </span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Drag & Drop Overlay Alert */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-xs flex items-center justify-center text-white font-bold text-lg z-40 border-4 border-dashed border-blue-400">
          Drop image/file here to attach to ConnectX
        </div>
      )}

      {/* Reply Banner */}
      {replyToMessage && (
        <div className="px-4 py-2 bg-slate-200 dark:bg-slate-900 border-t border-slate-700 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-200 shrink-0">Replying to {replyToMessage.senderName}:</span>
            <span className="truncate text-slate-400">{replyToMessage.text}</span>
          </div>
          <button onClick={() => setReplyToMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Attachment Preview Bar before sending */}
      {(attachments.length > 0 || uploading) && (
        <div className="px-4 py-2 bg-slate-200 dark:bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold px-2 py-1 bg-blue-950/60 rounded-xl shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
            </div>
          )}

          {attachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-700 rounded-xl text-xs shrink-0 shadow-sm">
              {att.fileType === 'image' ? (
                <img src={getFullMediaUrl(att.fileUrl)} alt={att.fileName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span className="truncate max-w-[120px] font-medium text-slate-200">{att.fileName}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mobile-Friendly Composer Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2 shrink-0 z-30 shadow-2xl">
        {showVoiceRecorder ? (
          <VoiceNoteRecorder
            onSendVoiceNote={handleVoiceNoteSend}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,application/pdf,application/zip"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Attach File or Image"
              className="p-2.5 text-slate-400 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              title="Record Voice Note"
              className="p-2.5 text-slate-400 hover:bg-slate-800 rounded-xl transition-all shrink-0"
            >
              <Mic className="w-5 h-5 text-red-400" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={uploading ? 'Uploading media...' : 'Type a message...'}
              className="flex-1 min-w-0 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={(!inputText.trim() && attachments.length === 0) || uploading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </main>
  );
}
