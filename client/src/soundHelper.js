// Helper to play message.mp3 notification chime
export function playMessageSound() {
  try {
    const audio = new Audio('/message.mp3');
    audio.volume = 0.8;
    audio.play().catch((err) => {
      // Fallback: Web Audio API synthesized double beep chime
      synthesizeMessageChime();
    });
  } catch (err) {
    synthesizeMessageChime();
  }
}

function synthesizeMessageChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.15); // D5 tone
    playTone(880, now + 0.12, 0.25); // A5 tone
  } catch (e) {
    console.log('Audio chime error:', e);
  }
}
