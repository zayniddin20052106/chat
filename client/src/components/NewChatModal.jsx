import React, { useState, useEffect, useRef } from 'react';
import { X, Users, BookOpen, Megaphone, Key, Plus, Camera, Sparkles, Copy, Check, UserPlus, CheckSquare, Square, Search } from 'lucide-react';
import axios from 'axios';
import { getFullMediaUrl, compressImageToBase64 } from '../apiConfig';

const GROUP_AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=TechGroup',
  'https://api.dicebear.com/7.x/identicon/svg?seed=GamingRoom',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Developers',
  'https://api.dicebear.com/7.x/identicon/svg?seed=StudyHub',
  'https://api.dicebear.com/7.x/identicon/svg?seed=MusicVibes'
];

export default function NewChatModal({ currentUser, onClose, onCreated }) {
  const [activeTab, setActiveTab] = useState('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('group');
  const [avatar, setAvatar] = useState(GROUP_AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // Member selection state
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch registered users to populate member picker
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('connectx_token');
        const res = await axios.get('/api/groups/list', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAvailableUsers(res.data.users || []);
      } catch (err) {
        console.error('Fetch users error:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const base64Data = await compressImageToBase64(file, 300, 300);
      setAvatar(base64Data);
      setCustomAvatar(base64Data);
    } catch (err) {
      alert('Failed to process photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const generatedCode = 'CX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await axios.post('/api/groups', {
        name: name.trim(),
        description: description.trim(),
        avatar: customAvatar || avatar,
        type,
        courseCode: generatedCode,
        selectedMemberIds: selectedUserIds
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      onCreated(res.data.group);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.post('/api/groups/join', { courseCode: joinCode.trim() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      onCreated(res.data.group);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join space by code');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(u => 
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.userId?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Hidden File Input for Device Group Photo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileSelect}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>Create Group or Channel</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Create New Space
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'join' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Join by Invite Code
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Space Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('group')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    type === 'group' ? 'border-blue-500 bg-blue-950/60 text-blue-400 shadow-md' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" /> Group Chat
                </button>

                <button
                  type="button"
                  onClick={() => setType('public_channel')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    type === 'public_channel' ? 'border-purple-500 bg-purple-950/60 text-purple-400 shadow-md' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Megaphone className="w-4 h-4" /> Public Channel
                </button>

                <button
                  type="button"
                  onClick={() => setType('private_channel')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    type === 'private_channel' ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400 shadow-md' : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Private Channel
                </button>
              </div>
            </div>

            {/* Group Photo Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group / Channel Photo</label>
              <div className="flex items-center gap-3">
                <img src={customAvatar || avatar} alt="Group avatar" className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 text-blue-400"
                >
                  <Camera className="w-4 h-4" /> {uploadingImage ? 'Uploading...' : 'Pick Photo from Device'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Name (Nomi) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IT Developers Club / News Channel"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Tavsif)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Member Add Checklist Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Odamlarni Qo'shish (Add Members) ({selectedUserIds.length} selected)
                </label>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search members by name or ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const uId = u._id || u.id;
                    const isChecked = selectedUserIds.includes(uId);
                    return (
                      <div
                        key={uId}
                        onClick={() => toggleSelectUser(uId)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-950/80 border border-blue-800/80' : 'hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={getFullMediaUrl(u.avatar, u.username)} alt={u.fullName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.userId}</div>
                          </div>
                        </div>

                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500 italic">No users found</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Space...' : 'Create Space Now'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invite Code (Taklif Kodi)</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. CX-GRP-102"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
            >
              {loading ? 'Joining Space...' : 'Join Space Now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
