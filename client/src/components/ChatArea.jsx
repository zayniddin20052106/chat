import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Smile, MoreVertical, Edit2, Trash2, 
  Reply, FileText, Image as ImageIcon, Video, Download, X, 
  BookOpen, Megaphone, ShieldCheck, UserCheck, GraduationCap, CheckCheck
} from 'lucide-react';
import axios from 'axios';

const EMOJIS = ['👍', '❤️', '🔥', '👏', '😂', '🎉', '📚', '✅', '🚀', '💯', '💡', '📝'];

export default function ChatArea({
  currentUser,
  activeChat,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  socket,
  onOpenProfileDrawer
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('educhat_token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setAttachments([...attachments, res.data]);
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  if (!activeChat) {
    return (
      <main className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-telegram-darkBg p-6 text-center select-none">
        <div className="w-24 h-24 bg-blue-100 dark:bg-telegram-darkCard rounded-full flex items-center justify-center mb-4 text-blue-500 border border-blue-200 dark:border-gray-700/60 shadow-lg">
          <BookOpen className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Welcome to EduChat</h3>
        <p className="text-sm text-gray-500 dark:text-telegram-darkMuted mt-1 max-w-sm">
          Select a student, teacher, course group or channel from the sidebar to start real-time messaging.
        </p>
      </main>
    );
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    if (role === 'teacher') return <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    return <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-telegram-darkBg relative overflow-hidden">
      {/* Header Bar */}
      <header className="p-3.5 bg-white dark:bg-telegram-darkCard border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenProfileDrawer}>
          <img
            src={activeChat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.name}`}
            alt={activeChat.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-slate-200 dark:bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 dark:text-white">
              <span>{activeChat.name}</span>
              {activeChat.role && getRoleBadge(activeChat.role)}
            </div>
            <p className="text-xs text-gray-500 dark:text-telegram-darkMuted flex items-center gap-2">
              <span className="capitalize">{activeChat.type}</span>
              {activeChat.courseCode && (
                <span className="font-mono bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                  Code: {activeChat.courseCode}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfileDrawer}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-telegram-darkHover transition-all text-xs font-medium flex items-center gap-1"
          >
            <span>Info</span>
          </button>
        </div>
      </header>

      {/* Channel Warning if Channel and Student */}
      {activeChat.type === 'channel' && currentUser?.role === 'student' && (
        <div className="bg-purple-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-inner">
          📢 Broadcast Channel: Only Teachers and Admins can publish messages here.
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-repeat" style={{ backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`, backgroundSize: '16px 16px' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs">
            <div className="p-4 bg-white dark:bg-telegram-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              No messages yet. Say hello or post educational notes!
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;
            return (
              <div
                key={msg._id || msg.id}
                className={`flex gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isMe && (
                  <img
                    src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                  />
                )}

                <div className="group relative">
                  {/* Action popover trigger */}
                  <div
                    className={`p-3 rounded-2xl shadow-xs border transition-all ${
                      isMe
                        ? 'bg-blue-600 text-white dark:bg-telegram-darkBubble border-blue-500 rounded-tr-none'
                        : 'bg-white dark:bg-telegram-darkReceiveBubble text-gray-900 dark:text-white border-gray-200 dark:border-gray-800 rounded-tl-none'
                    }`}
                  >
                    {/* Sender name & role for group chats */}
                    {!isMe && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                        <span>{msg.senderName}</span>
                        {getRoleBadge(msg.senderRole)}
                      </div>
                    )}

                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className="p-2 mb-2 rounded-lg bg-black/10 dark:bg-white/10 border-l-2 border-yellow-400 text-xs">
                        <div className="font-semibold text-[10px] opacity-80">{msg.replyTo.senderName}</div>
                        <div className="truncate opacity-90">{msg.replyTo.text}</div>
                      </div>
                    )}

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="rounded-xl overflow-hidden bg-black/10">
                            {att.fileType === 'image' && (
                              <img src={att.fileUrl} alt={att.fileName} className="max-h-60 w-full object-cover" />
                            )}
                            {att.fileType === 'video' && (
                              <video src={att.fileUrl} controls className="max-h-60 w-full" />
                            )}
                            {att.fileType === 'pdf' && (
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2.5 text-xs hover:underline"
                              >
                                <FileText className="w-5 h-5 text-red-400" />
                                <span className="font-medium truncate">{att.fileName}</span>
                                <Download className="w-4 h-4 ml-auto" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-end gap-1.5 text-[10px] opacity-70 mt-1">
                      {msg.isEdited && <span>(edited)</span>}
                      <span>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Context menu overlay */}
                  <div className={`absolute top-0 hidden group-hover:flex items-center gap-1 bg-white dark:bg-telegram-darkCard shadow-md border border-gray-200 dark:border-gray-700 p-1 rounded-lg z-10 ${
                    isMe ? 'right-full mr-2' : 'left-full ml-2'
                  }`}>
                    <button
                      onClick={() => setReplyToMessage(msg)}
                      title="Reply"
                      className="p-1 text-gray-500 hover:text-blue-500"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {isMe && (
                      <button
                        onClick={() => { setEditingMessage(msg); setInputText(msg.text); }}
                        title="Edit"
                        className="p-1 text-gray-500 hover:text-emerald-500"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isMe || currentUser?.role === 'admin') && (
                      <button
                        onClick={() => onDeleteMessage(msg._id)}
                        title="Delete"
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Edit Banner */}
      {(replyToMessage || editingMessage) && (
        <div className="px-4 py-2 bg-gray-200 dark:bg-telegram-darkCard border-t border-gray-300 dark:border-gray-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            {editingMessage ? (
              <Edit2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Reply className="w-4 h-4 text-blue-500" />
            )}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {editingMessage ? 'Editing message:' : `Replying to ${replyToMessage?.senderName}:`}
            </span>
            <span className="truncate text-gray-500 dark:text-telegram-darkMuted">
              {editingMessage ? editingMessage.text : replyToMessage?.text}
            </span>
          </div>
          <button
            onClick={() => { setReplyToMessage(null); setEditingMessage(null); setInputText(''); }}
            className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Upload Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-telegram-darkCard border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto">
          {attachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-2 p-1.5 bg-white dark:bg-telegram-darkSidebar border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="truncate max-w-[120px]">{att.fileName}</span>
              <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3 bg-white dark:bg-telegram-darkCard border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl grid grid-cols-6 gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-telegram-darkHover rounded-xl transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      {activeChat.type === 'channel' && currentUser?.role === 'student' ? (
        <div className="p-4 bg-gray-200 dark:bg-telegram-darkCard text-center text-xs text-gray-500 font-medium">
          Students cannot post in broadcast channels.
        </div>
      ) : (
        <div className="p-3 bg-white dark:bg-telegram-darkCard border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          {/* File Attachment Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-telegram-darkHover transition-all disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Trigger */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-telegram-darkHover transition-all"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={editingMessage ? 'Edit your message...' : 'Write a message...'}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-telegram-darkSidebar border border-transparent dark:border-gray-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
}
