// Speech Recognition & Speech Synthesis helpers for Echo Voice Assistant

export class AudioFeedback {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  // Alexa/Echo wake chime: two ascending pleasant tones
  playWakeChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);
    } catch (e) {
      // AudioContext maybe blocked or restricted
    }
  }

  // Acknowledgment soft chime
  playDoneChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18); // C6

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // silent
    }
  }
}

export const audioFeedback = new AudioFeedback();

export function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) return null;
  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  return recognition;
}

export function speakText(
  text: string, 
  onStart?: () => void, 
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  window.speechSynthesis.cancel(); // Stop any pending speech

  const cleanText = text.replace(/[*_#`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Pick optimal natural voice
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => 
    (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Jenny')) &&
    v.lang.startsWith('en')
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
