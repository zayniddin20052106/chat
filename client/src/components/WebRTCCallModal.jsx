import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Monitor, Maximize, ShieldCheck, Sparkles 
} from 'lucide-react';
import { getFullMediaUrl } from '../apiConfig';

export default function WebRTCCallModal({
  currentUser,
  activeCall,
  onAcceptCall,
  onEndCall,
  localStream,
  remoteStream
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);

  // Attach local stream whenever localVideoRef or localStream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => console.log('Local video play note:', err));
    }
  }, [localStream, activeCall?.isIncoming]);

  // Attach remote stream whenever remoteVideoRef or remoteStream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => console.log('Remote video play note:', err));
    }
  }, [remoteStream, activeCall?.isIncoming]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!micMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraOff(!cameraOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!activeCall) return null;

  const callerAvatarUrl = getFullMediaUrl(activeCall.callerAvatar, activeCall.callerName || 'User');

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-fade-in p-2 sm:p-4"
    >
      <div className="w-full max-w-5xl h-[85dvh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Incoming Call Screen */}
        {activeCall.isIncoming ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-blue-500/40 p-1 bg-slate-800 animate-pulse shadow-2xl">
                <img 
                  src={callerAvatarUrl} 
                  alt={activeCall.callerName} 
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
              <span className="absolute -top-2 -right-2 p-3 bg-blue-600 rounded-full text-white shadow-lg animate-bounce">
                {activeCall.isVideoCall ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{activeCall.callerName}</h3>
              <p className="text-sm text-blue-400 font-semibold mt-1">
                Incoming ConnectX {activeCall.isVideoCall ? 'HD Video' : 'Voice'} Call...
              </p>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <button
                onClick={onEndCall}
                title="Decline Call"
                className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl shadow-red-600/40 transition-all transform hover:scale-110 active:scale-95"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                onClick={onAcceptCall}
                title="Accept Call"
                className="p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl shadow-emerald-600/40 transition-all transform hover:scale-110 active:scale-95 animate-pulse"
              >
                <Phone className="w-7 h-7" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Call Streams View */
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
            {/* Remote Video Stream */}
            {activeCall.isVideoCall ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
                    <img src={callerAvatarUrl} alt={activeCall.callerName} className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-blue-400">Connecting video stream...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <img src={callerAvatarUrl} alt={activeCall.callerName} className="w-32 h-32 rounded-full border-4 border-blue-500/40 shadow-2xl object-cover" />
                <h3 className="text-2xl font-bold text-white">{activeCall.callerName}</h3>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span> Live Audio Call
                </p>
              </div>
            )}

            {/* Local Self Video PIP (Picture-In-Picture) */}
            {activeCall.isVideoCall && (
              <div className="absolute top-4 right-4 w-36 h-28 sm:w-52 sm:h-36 bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl z-20 group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  You
                </div>
              </div>
            )}

            {/* Bottom Call Control Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl z-30">
              <button
                onClick={toggleMic}
                title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                className={`p-3.5 rounded-full transition-all ${
                  micMuted ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {activeCall.isVideoCall && (
                <button
                  onClick={toggleCamera}
                  title={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  className={`p-3.5 rounded-full transition-all ${
                    cameraOff ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {activeCall.isVideoCall && (
                <button
                  onClick={toggleScreenShare}
                  title="Share Screen"
                  className={`p-3.5 rounded-full transition-all ${
                    isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                className="p-3.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full transition-all"
              >
                <Maximize className="w-5 h-5" />
              </button>

              <button
                onClick={onEndCall}
                title="End Call"
                className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl shadow-red-600/40 transition-all transform hover:scale-110 active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
