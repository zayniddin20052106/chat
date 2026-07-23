import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Monitor, Maximize, ShieldCheck, Sparkles 
} from 'lucide-react';

export default function WebRTCCallModal({
  currentUser,
  activeCall, // { isIncoming, callerName, callerAvatar, isVideoCall, peerStream }
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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-4"
    >
      <div className="w-full max-w-4xl h-[80vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Incoming Call Screen */}
        {activeCall.isIncoming ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-blue-500/40 p-1 bg-slate-800 animate-pulse">
                <img src={activeCall.callerAvatar} alt={activeCall.callerName} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="absolute -top-2 -right-2 p-2 bg-blue-600 rounded-full text-white shadow-lg">
                {activeCall.isVideoCall ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">{activeCall.callerName}</h3>
              <p className="text-sm text-blue-400 font-semibold mt-1">
                Incoming ConnectX {activeCall.isVideoCall ? 'Video' : 'Voice'} Call...
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button
                onClick={onEndCall}
                className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/30 transition-all scale-100 hover:scale-110"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={onAcceptCall}
                className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all scale-100 hover:scale-110 animate-bounce"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Call Streams View */
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
            {/* Remote Video Stream */}
            {activeCall.isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <img src={activeCall.callerAvatar} alt={activeCall.callerName} className="w-32 h-32 rounded-full border-4 border-blue-500/30 shadow-2xl" />
                <h3 className="text-2xl font-bold text-white">{activeCall.callerName}</h3>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span> Live Audio Call
                </p>
              </div>
            )}

            {/* Local Self Video PIP */}
            {activeCall.isVideoCall && (
              <div className="absolute top-4 right-4 w-44 h-32 bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Bottom Call Control Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl z-20">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-all ${
                  micMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {activeCall.isVideoCall && (
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full transition-all ${
                    cameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {activeCall.isVideoCall && (
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full transition-all ${
                    isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-3 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full transition-all"
              >
                <Maximize className="w-5 h-5" />
              </button>

              <button
                onClick={onEndCall}
                className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/30 transition-all scale-105"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
