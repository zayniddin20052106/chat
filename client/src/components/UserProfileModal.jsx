import React, { useState, useRef } from 'react';
import { 
  X, ShieldCheck, Camera, Edit3, Save, 
  Image as ImageIcon, Video, FileText, Globe, Calendar, Key, Loader2, Check 
} from 'lucide-react';
import axios from 'axios';
import { getFullMediaUrl } from '../apiConfig';

export default function UserProfileModal({ currentUser, profileUser, onClose, onUpdateUser }) {
  // Always default to profileUser if provided, or currentUser
  const targetUser = profileUser || currentUser;
  const isSelf = !profileUser || targetUser?._id === currentUser?._id || targetUser?.id === currentUser?.id || targetUser?.userId === currentUser?.userId;

  const [activeTab, setActiveTab] = useState('profile');
  const [mediaTab, setMediaTab] = useState('photos');

  const [fullName, setFullName] = useState(targetUser?.fullName || currentUser?.fullName || '');
  const [bio, setBio] = useState(targetUser?.bio || currentUser?.bio || '');
  const [avatar, setAvatar] = useState(targetUser?.avatar || currentUser?.avatar || '');
  const [coverPhoto, setCoverPhoto] = useState(targetUser?.coverPhoto || currentUser?.coverPhoto || '');
  const [country, setCountry] = useState(targetUser?.country || currentUser?.country || 'United States');
  
  // Default to true for self so editing options & inputs are immediately visible
  const [editing, setEditing] = useState(isSelf);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleImageFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (type === 'avatar') setAvatar(event.target.result);
        else if (type === 'cover') setCoverPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('connectx_token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const uploadedUrl = res.data.fileUrl;
      if (type === 'avatar') {
        setAvatar(uploadedUrl);
        await autoSaveProfile({ avatar: uploadedUrl });
      } else if (type === 'cover') {
        setCoverPhoto(uploadedUrl);
        await autoSaveProfile({ coverPhoto: uploadedUrl });
      }
    } catch (err) {
      console.log('Upload error fallback to local preview:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const autoSaveProfile = async (updatesObj) => {
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.put('/api/connect/auth/profile', {
        fullName: updatesObj.fullName || fullName,
        bio: updatesObj.bio !== undefined ? updatesObj.bio : bio,
        avatar: updatesObj.avatar || avatar,
        coverPhoto: updatesObj.coverPhoto || coverPhoto,
        country: updatesObj.country || country
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onUpdateUser && res.data?.user) {
        onUpdateUser(res.data.user);
      }
    } catch (e) {
      console.error('Auto save profile error:', e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.put('/api/connect/auth/profile', {
        fullName,
        bio,
        avatar,
        coverPhoto,
        country
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdateUser(res.data.user);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = getFullMediaUrl(avatar || targetUser?.avatar, targetUser?.username || 'user');
  const displayCover = getFullMediaUrl(coverPhoto || targetUser?.coverPhoto, 'cover');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white my-auto">
        
        {/* Hidden File Inputs for Device Image Upload */}
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          onChange={(e) => handleImageFileSelect(e, 'avatar')}
          className="hidden"
        />
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*"
          onChange={(e) => handleImageFileSelect(e, 'cover')}
          className="hidden"
        />

        {/* Cover Photo Header */}
        <div className="h-36 sm:h-44 relative bg-slate-800 shrink-0 group">
          <img
            src={displayCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
          />

          {isSelf && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-3 left-3 p-1.5 sm:p-2 bg-slate-900/80 hover:bg-slate-900 text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 backdrop-blur-md shadow-lg border border-slate-700"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" /> Change Cover
            </button>
          )}

          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/80">
            <X className="w-5 h-5" />
          </button>

          {/* User Avatar Overlay */}
          <div className="absolute -bottom-9 left-4 sm:left-6 flex items-end gap-3">
            <div className="relative group cursor-pointer" onClick={() => isSelf && avatarInputRef.current?.click()}>
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-900 bg-slate-800 object-cover shadow-2xl"
              />
              {isSelf && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-bold text-white transition-opacity">
                  <Camera className="w-4 h-4 mb-0.5 text-blue-400" />
                  <span>O'zgartirish</span>
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* User Info Header Bar */}
        <div className="pt-10 sm:pt-12 px-4 sm:px-6 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-lg sm:text-xl font-extrabold truncate">
              <span className="truncate">{targetUser?.fullName || targetUser?.name}</span>
              {targetUser?.role === 'admin' && <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>@{targetUser?.username}</span>
              <span>•</span>
              <span className="font-mono px-2 py-0.2 bg-blue-950 text-blue-400 font-bold rounded text-[11px]">
                {targetUser?.userId || 'CX102938'}
              </span>
            </div>
          </div>

          {isSelf && (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>📷 Rasm Qo'yish (Upload Photo)</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
            }`}
          >
            About & Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'media' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
            }`}
          >
            Media Gallery
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {uploadingImage && (
            <div className="p-3 bg-blue-950/60 border border-blue-800/80 rounded-xl text-xs text-blue-400 flex items-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" /> Rasm qurilmangizdan yuklanmoqda...
            </div>
          )}

          {activeTab === 'profile' ? (
            isSelf ? (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ismingiz (Full Name)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bio / Status</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Direct File Trigger Button for Profile Photo */}
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Profil Rasmi (Qurilmadan rasm tanlash)</label>
                  <div className="flex items-center gap-3">
                    <img src={displayAvatar} alt="preview" className="w-12 h-12 rounded-full object-cover border border-slate-600 bg-slate-900 shrink-0" />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0"
                    >
                      <Camera className="w-4 h-4" /> Galereyadan Rasm Tanlash
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingImage}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Profile Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Bio</div>
                  <p className="text-sm text-slate-200 leading-relaxed break-words">
                    {targetUser?.bio || 'Hey there! I am using ConnectX.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Country</div>
                      <div className="text-xs font-bold text-white truncate">{targetUser?.country || 'United States'}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <Key className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Permanent User ID</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 truncate">{targetUser?.userId || 'CX102938'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Media Gallery */
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMediaTab('photos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${mediaTab === 'photos' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Photos
                </button>
                <button
                  onClick={() => setMediaTab('videos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${mediaTab === 'videos' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Videos
                </button>
                <button
                  onClick={() => setMediaTab('files')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${mediaTab === 'files' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Files & PDFs
                </button>
              </div>

              <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">
                No shared {mediaTab} in this chat session yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
