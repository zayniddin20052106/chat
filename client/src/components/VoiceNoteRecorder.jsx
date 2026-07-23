import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import axios from 'axios';

export default function VoiceNoteRecorder({ onSendVoiceNote, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not supported');
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStop = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice-note-${Date.now()}.webm`);
      const token = localStorage.getItem('connectx_token');

      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      onSendVoiceNote({
        fileUrl: res.data.fileUrl,
        duration: timer
      });
    } catch (err) {
      alert('Voice note upload failed');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-red-500/10 border border-red-500/30 rounded-2xl animate-fade-in w-full">
      <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold px-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
        <span>{formatTimer(timer)}</span>
      </div>

      <div className="flex-1 h-2 bg-red-500/20 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 animate-pulse w-3/4"></div>
      </div>

      {recording ? (
        <button
          onClick={handleStop}
          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-xs font-semibold flex items-center gap-1"
        >
          <Square className="w-4 h-4" /> Stop
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <audio src={audioUrl} controls className="h-8 w-40" />
          <button
            onClick={handleSend}
            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-semibold flex items-center gap-1"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      )}

      <button
        onClick={onCancel}
        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
