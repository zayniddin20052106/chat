import React, { useState, useRef } from 'react';
import { X, Users, BookOpen, Megaphone, Key, Plus, Camera, Sparkles, Copy, Check } from 'lucide-react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('connectx_token');

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setAvatar(res.data.fileUrl);
      setCustomAvatar(res.data.fileUrl);
    } catch (err) {
      alert('Failed to upload group photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const generatedCode = 'CX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await axios.post('/api/groups', {
        name: name.trim(),
        description: description.trim(),
        avatar: customAvatar || avatar,
        type,
        courseCode: generatedCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      const res = await axios.post('/api/groups/join', { courseCode: joinCode.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onCreated(res.data.group);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join space by code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        
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
            <span>Create or Join Space</span>
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
            Create New Group / Channel
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
          <form onSubmit={handleCreate} className="space-y-3.5">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Photo (Guruh Rasmi)</label>
              <div className="flex items-center gap-3">
                <img src={customAvatar || avatar} alt="Group avatar" className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-blue-400" /> {uploadingImage ? 'Uploading...' : 'Pick Photo'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Group / Channel Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IT Developers Club / Design Hub"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Tavsif)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief group description..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 mt-2"
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
