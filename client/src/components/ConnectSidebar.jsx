import React, { useState } from 'react';
import { 
  Search, MessageSquare, Users, Megaphone, PhoneCall, 
  ShieldCheck, Sun, Moon, LogOut, Plus, UserPlus, CheckCheck, Sparkles, Loader2, Edit3, PenSquare 
} from 'lucide-react';
import axios from 'axios';
import { getFullMediaUrl } from '../apiConfig';

export default function ConnectSidebar({
  currentUser,
  users,
  groups,
  activeChat,
  setActiveChat,
  onSelectUserChat,
  unreadCounts,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenNewChatModal,
  onOpenAdminPanel,
  onOpenProfileModal,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.get(`/api/connect/search?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const queryClean = searchQuery.toLowerCase().trim();
  const numericQuery = searchQuery.replace(/\D/g, '');

  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(queryClean));
  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(queryClean) ||
    u.fullName?.toLowerCase().includes(queryClean) ||
    u.userId?.toLowerCase().includes(queryClean) ||
    (numericQuery && u.userId?.toLowerCase().includes(numericQuery))
  );

  const handleUserClick = (u) => {
    const userChat = {
      id: u._id || u.id,
      name: u.fullName,
      username: u.username,
      type: 'private',
      avatar: getFullMediaUrl(u.avatar, u.username),
      userId: u.userId,
      bio: u.bio
    };
    if (onSelectUserChat) {
      onSelectUserChat(userChat);
    } else {
      setActiveChat(userChat);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleImgError = (e, seed) => {
    e.target.onerror = null;
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'user')}`;
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800/80 shrink-0 transition-colors duration-200 select-none relative overflow-hidden">
      
      {/* Header Profile Info Bar */}
      <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <div 
          onClick={onOpenProfileModal}
          className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-gray-200/50 dark:hover:bg-slate-800 transition-all"
        >
          <div className="relative shrink-0">
            <img
              src={getFullMediaUrl(currentUser?.avatar, currentUser?.username || 'me')}
              alt={currentUser?.fullName}
              onError={(e) => handleImgError(e, currentUser?.username || 'me')}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover bg-blue-100 dark:bg-slate-800 shrink-0"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 dark:text-white truncate">
              <span className="truncate">{currentUser?.fullName}</span>
              {currentUser?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="font-mono px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold rounded shrink-0">
                {currentUser?.userId || 'CX000000'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPanel}
              title="Admin Panel"
              className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all shrink-0"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className="p-2 rounded-xl text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
          </button>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by User ID (e.g. CX102938), Name..."
            className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="px-3 pb-2 flex items-center gap-1 border-b border-gray-100 dark:border-slate-800/80">
        {[
          { id: 'chats', label: 'Chats', icon: MessageSquare },
          { id: 'friends', label: 'Friends', icon: Users },
          { id: 'channels', label: 'Channels', icon: Megaphone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat / Users Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/40 pb-20">
        {searchQuery.trim() !== '' ? (
          searchResults.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
                <span>Search Results ({searchResults.length})</span>
                <span className="font-mono text-[9px] text-slate-400">CX User ID Search</span>
              </div>
              {searchResults.map((u) => (
                <div
                  key={u._id || u.id}
                  onClick={() => handleUserClick(u)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={getFullMediaUrl(u.avatar, u.username)}
                    alt={u.fullName}
                    onError={(e) => handleImgError(e, u.username)}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.fullName}</span>
                      <span className="font-mono text-[10px] text-blue-500 font-bold bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">@{u.username} • {u.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/20">
                Matches ({filteredUsers.length})
              </div>
              {filteredUsers.map((u) => (
                <div
                  key={u._id || u.id}
                  onClick={() => handleUserClick(u)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={getFullMediaUrl(u.avatar, u.username)}
                    alt={u.fullName}
                    onError={(e) => handleImgError(e, u.username)}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.fullName}</span>
                      <span className="font-mono text-[10px] text-blue-500 font-bold bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded shrink-0">{u.userId}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">@{u.username} • {u.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No user found matching "{searchQuery}". Make sure User ID format is correct (e.g. CX102938).
            </div>
          )
        ) : (
          <>
            {/* Render Groups & Channels */}
            {filteredGroups.map((group) => {
              const isSelected = activeChat?.id === group._id;
              const groupAvatar = getFullMediaUrl(group.avatar, group.name);
              return (
                <div
                  key={group._id}
                  onClick={() => setActiveChat({ id: group._id, name: group.name, type: group.type, avatar: groupAvatar, description: group.description, inviteCode: group.inviteCode })}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <img
                    src={groupAvatar}
                    alt={group.name}
                    onError={(e) => handleImgError(e, group.name)}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{group.name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{group.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{group.description || `Code: ${group.inviteCode}`}</p>
                  </div>
                </div>
              );
            })}

            {/* Render Direct Users */}
            {filteredUsers.map((user) => {
              const uId = user._id || user.id;
              const isSelected = activeChat?.id === uId && activeChat?.type === 'private';
              const userAvatar = getFullMediaUrl(user.avatar, user.username);
              const unreadCount = unreadCounts?.[uId] || 0;

              return (
                <div
                  key={uId}
                  onClick={() => handleUserClick(user)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={userAvatar}
                      alt={user.fullName}
                      onError={(e) => handleImgError(e, user.username)}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.fullName}</h4>
                      <span className="font-mono text-[10px] text-blue-400 font-bold bg-blue-950/60 px-1.5 py-0.2 rounded shrink-0">{user.userId}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.bio || `@${user.username}`}</p>
                  </div>

                  {/* Unread Messages Badge Counter */}
                  {unreadCount > 0 && !isSelected && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] rounded-full shadow-md animate-pulse shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Telegram-style Floating Action Pencil Button (FAB) */}
      <button
        onClick={onOpenNewChatModal}
        title="Yangi guruh yoki kanal yaratish (New Group / Channel)"
        className="absolute bottom-5 right-5 z-30 w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-600/40 hover:shadow-blue-500/60 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20 group cursor-pointer"
      >
        <Edit3 className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      </button>
    </aside>
  );
}
