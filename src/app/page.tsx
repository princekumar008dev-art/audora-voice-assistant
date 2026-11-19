'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Database, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  StickyNote, 
  Send,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Disc3,
  Settings
} from 'lucide-react';
import { AssistantState, ConversationItem, VoiceNote, ReminderItem } from '@/lib/types';
import { 
  getConversations, 
  saveConversation, 
  getNotes, 
  deleteNote, 
  getReminders, 
  toggleReminder, 
  deleteReminder 
} from '@/lib/storage';
import { processVoiceQuery } from '@/lib/ai-assistant';
import { getSpeechRecognition, speakText, stopSpeaking, audioFeedback } from '@/lib/speech';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AUDORA_PLAYLIST, Track } from '@/lib/music-player';

export default function AudoraVoiceAssistant() {
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [lastSpeech, setLastSpeech] = useState<string>('Tap the glowing Audora orb or say "Play music" to start.');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  
  // Data states
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'reminders' | 'music'>('chat');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Music Player States
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [musicVolume, setMusicVolume] = useState<number>(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  const currentTrack: Track = AUDORA_PLAYLIST[currentTrackIndex] || AUDORA_PLAYLIST[0];

  // Load data on mount
  useEffect(() => {
    refreshData();
    recognitionRef.current = getSpeechRecognition();
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  const refreshData = async () => {
    const [c, n, r] = await Promise.all([
      getConversations(),
      getNotes(),
      getReminders()
    ]);
    setConversations(c);
    setNotes(n);
    setReminders(r);
  };

  // Music control handlers
  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        console.warn('Audio play restricted or waiting for user interaction:', err);
      });
    }
  };

  const handlePauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % AUDORA_PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    }, 100);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + AUDORA_PLAYLIST.length) % AUDORA_PLAYLIST.length;
    setCurrentTrackIndex(prevIdx);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    }, 100);
  };

  // Trigger Assistant Query Execution
  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setAssistantState('thinking');
    setTranscript(queryText);
    setTextInput('');

    try {
      const response = await processVoiceQuery(queryText);

      // Save conversation record
      const saved = await saveConversation(queryText, response.displayText || response.speechText, response.actionType);
      setConversations(prev => [saved, ...prev]);

      setLastSpeech(response.displayText || response.speechText);

      // Handle Music media actions
      if (response.actionType === 'media' && response.payload) {
        if (response.payload.action === 'play') {
          handlePlayMusic();
        } else if (response.payload.action === 'pause') {
          handlePauseMusic();
        } else if (response.payload.action === 'next') {
          handleNextTrack();
        }
      }

      // Voice Audio Response (Duck music volume while Audora speaks)
      if (!isMuted) {
        setAssistantState('speaking');
        audioFeedback.playDoneChime();

        // Duck music volume
        if (audioRef.current && isPlayingMusic) {
          audioRef.current.volume = 0.2;
        }

        speakText(
          response.speechText,
          () => setAssistantState('speaking'),
          () => {
            setAssistantState('idle');
            // Restore music volume
            if (audioRef.current && isPlayingMusic) {
              audioRef.current.volume = musicVolume;
            }
          }
        );
      } else {
        setAssistantState('idle');
      }

      await refreshData();
    } catch (err) {
      console.error(err);
      setAssistantState('idle');
      setLastSpeech('Sorry, I encountered an error while processing your request.');
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (assistantState === 'speaking') {
      stopSpeaking();
      setAssistantState('idle');
      if (audioRef.current && isPlayingMusic) {
        audioRef.current.volume = musicVolume;
      }
      return;
    }

    if (assistantState === 'listening') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      isListeningRef.current = false;
      setAssistantState('idle');
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert("Speech recognition isn't supported in this browser. Please try Chrome, Edge, or use text input.");
      return;
    }

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setAssistantState('listening');
      setTranscript('Listening for your voice...');
      audioFeedback.playWakeChime();
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript;
      setTranscript(resultTranscript);

      if (event.results[current].isFinal) {
        recognition.stop();
        isListeningRef.current = false;
        handleQuery(resultTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error', event.error);
      isListeningRef.current = false;
      setAssistantState('idle');
      if (event.error !== 'no-speech') {
        setTranscript(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setAssistantState('idle');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setAssistantState('idle');
    }
  };

  const handleReplay = (text: string) => {
    stopSpeaking();
    setAssistantState('speaking');
    speakText(
      text,
      () => setAssistantState('speaking'),
      () => setAssistantState('idle')
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* Hidden HTML5 Audio Element for Audora Music Player */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleNextTrack}
        preload="auto"
      />

      {/* Top Navigation Bar */}
      <header className="border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-950 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
            <span className="w-4 h-4 rounded-full bg-cyan-400 animate-ping absolute opacity-75"></span>
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Audora Voice
            </h1>
            <p className="text-xs text-slate-400">Next-Gen AI Voice & Music Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Music Mini Indicator */}
          {isPlayingMusic && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium animate-pulse">
              <Disc3 className="w-3.5 h-3.5 animate-spin" />
              <span>Playing: {currentTrack.title.substring(0, 16)}...</span>
            </div>
          )}

          {/* Supabase Status Pill */}
          <button 
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage (Sync DB)'}</span>
          </button>

          {/* Mute Assistant Audio */}
          <button
            onClick={() => {
              if (!isMuted) stopSpeaking();
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-full border transition-all ${
              isMuted 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-cyan-400'
            }`}
            title={isMuted ? 'Unmute Audio Voice' : 'Mute Audio Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings / Info */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all"
            title="Settings & Supabase Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center Column: Audora Orb, Voice Center & Music Dock */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center space-y-6 glass-panel p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Ambient Glow Backdrop */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Assistant Status Label */}
          <div className="flex items-center space-x-2 text-xs uppercase tracking-widest font-semibold px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
            <span className={`w-2 h-2 rounded-full ${
              assistantState === 'listening' ? 'bg-cyan-400 animate-ping' :
              assistantState === 'speaking' ? 'bg-emerald-400 animate-pulse' :
              assistantState === 'thinking' ? 'bg-purple-400 animate-spin' :
              isPlayingMusic ? 'bg-indigo-400 animate-pulse' :
              'bg-slate-400'
            }`}></span>
            <span>
              {assistantState === 'idle' && (isPlayingMusic ? 'Audora Playing Music • Tap Orb to Talk' : 'Audora is Ready • Tap Orb to Speak')}
              {assistantState === 'listening' && 'Listening to you...'}
              {assistantState === 'thinking' && 'Audora is processing...'}
              {assistantState === 'speaking' && 'Audora Speaking...'}
            </span>
          </div>

          {/* THE AUDORA GLOWING RING / ORB */}
          <div className="relative group cursor-pointer my-2" onClick={toggleListening}>
            {/* Outer Pulsing Aura */}
            <div className={`absolute -inset-4 rounded-full transition-all duration-700 blur-xl ${
              assistantState === 'listening' ? 'bg-cyan-400/60 scale-110' :
              assistantState === 'speaking' ? 'bg-emerald-400/50 scale-105' :
              assistantState === 'thinking' ? 'bg-purple-500/60 scale-110' :
              isPlayingMusic ? 'bg-indigo-500/30 scale-105' :
              'bg-cyan-600/20 group-hover:bg-cyan-500/30 scale-100'
            }`}></div>

            {/* Orb Outer Border */}
            <div className={`w-52 h-52 md:w-60 md:h-60 rounded-full p-2 flex items-center justify-center transition-all duration-500 ${
              assistantState === 'listening' ? 'bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-500 ring-4 ring-cyan-300/60' :
              assistantState === 'speaking' ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-500 ring-4 ring-emerald-300/60' :
              assistantState === 'thinking' ? 'bg-gradient-to-tr from-purple-500 via-pink-400 to-cyan-400 ring-4 ring-purple-400/60 animate-spin-slow' :
              isPlayingMusic ? 'bg-gradient-to-tr from-indigo-500 via-purple-400 to-cyan-400 ring-2 ring-purple-400/40' :
              'bg-gradient-to-b from-cyan-900/60 to-slate-900 border border-cyan-500/40 group-hover:border-cyan-400'
            }`}>
              
              {/* Orb Inner Center */}
              <div className={`w-full h-full rounded-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden transition-all duration-500 ${
                assistantState === 'listening' ? 'echo-orb-listening' :
                assistantState === 'speaking' ? 'echo-orb-speaking' :
                assistantState === 'thinking' ? 'echo-orb-thinking' :
                'echo-orb-idle group-hover:scale-102'
              }`}>
                {/* Voice & Music Visualizer Waveform */}
                {assistantState === 'speaking' || assistantState === 'listening' || isPlayingMusic ? (
                  <div className="flex items-center justify-center h-16 space-x-1.5">
                    {[0.8, 1.4, 0.6, 1.8, 1.0, 1.6, 0.7, 1.3, 0.9].map((val, idx) => (
                      <span 
                        key={idx} 
                        className="wave-bar h-12"
                        style={{
                          animation: `wave ${0.5 + (idx % 4) * 0.2}s ease-in-out infinite`,
                          animationDelay: `${idx * 0.08}s`,
                          height: `${22 * val}px`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-cyan-200">
                    <Mic className="w-10 h-10 stroke-[1.5] filter drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
                    <span className="text-xs uppercase tracking-widest font-semibold opacity-90">Talk to Audora</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AUDORA INTEGRATED MUSIC PLAYER DOCK */}
          <div className="w-full max-w-xl p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-purple-950/70 border border-purple-500/40 text-purple-300 shadow-md ${isPlayingMusic ? 'animate-spin-slow' : ''}`}>
                <Music className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate max-w-[200px]">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-purple-300/80 truncate">
                  {currentTrack.artist} • <span className="text-slate-400">{currentTrack.genre}</span>
                </p>
              </div>
            </div>

            {/* Music Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevTrack}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={isPlayingMusic ? handlePauseMusic : handlePlayMusic}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md hover:scale-105"
                title={isPlayingMusic ? 'Pause Music' : 'Play Music'}
              >
                {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-16 h-1.5 ml-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                title={`Music Volume: ${Math.round(musicVolume * 100)}%`}
              />
            </div>
          </div>

          {/* Transcript / Response Display */}
          <div className="w-full max-w-xl text-center space-y-3">
            {transcript && (
              <p className="text-sm text-cyan-300/90 font-mono bg-cyan-950/30 py-2 px-4 rounded-xl border border-cyan-500/20 inline-block">
                🎙️ "{transcript}"
              </p>
            )}

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center space-x-1 font-semibold text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Audora Response</span>
                </span>
                <button
                  onClick={() => handleReplay(lastSpeech)}
                  className="hover:text-cyan-300 flex items-center space-x-1 transition-colors"
                  title="Speak again"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-line">
                {lastSpeech}
              </p>
            </div>
          </div>

          {/* Manual Text Input Fallback */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(textInput);
            }} 
            className="w-full max-w-xl flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-cyan-400 transition-all"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type to Audora (e.g. 'Play music', 'Take a note')"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Voice Command Quick Chips */}
          <div className="w-full max-w-xl">
            <p className="text-xs text-slate-400 mb-2 font-medium">Try saying or clicking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Play music",
                "Next song",
                "Pause music",
                "Audora, who are you?",
                "Take a note: Buy milk",
                "Remind me to drink water at 5 PM",
                "What is the weather today?",
                "Tell me a joke"
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleQuery(cmd)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all text-left"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Supabase Memory & Hub */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'chat' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              History ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'music' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tracks ({AUDORA_PLAYLIST.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'notes' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'reminders' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reminders ({reminders.length})
            </button>
          </div>

          {/* Tab: Music Playlist */}
          {activeTab === 'music' && (
            <div className="glass-panel p-5 rounded-3xl space-y-3 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">Audora Music Library</h3>
                <span className="text-xs text-purple-300">Live Streaming</span>
              </div>
              {AUDORA_PLAYLIST.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setTimeout(handlePlayMusic, 50);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    currentTrackIndex === idx 
                      ? 'bg-purple-950/60 border-purple-500/50 shadow-md' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${currentTrackIndex === idx && isPlayingMusic ? 'bg-purple-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${currentTrackIndex === idx ? 'text-purple-300' : 'text-slate-200'}`}>
                        {track.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{track.artist} • {track.genre}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{track.duration}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 1: Conversation History */}
          {activeTab === 'chat' && (
            <div className="glass-panel p-5 rounded-3xl space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">Recent Voice Queries</h3>
                <span className="text-xs text-slate-400">Synced to Supabase</span>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Mic className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                  <p className="text-sm">No queries yet. Speak or type to start!</p>
                </div>
              ) : (
                conversations.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-medium text-cyan-300">
                      <span>🗣️ "{item.prompt}"</span>
                      <button
                        onClick={() => handleReplay(item.response)}
                        className="hover:text-cyan-400"
                        title="Replay speech"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-300 leading-normal">{item.response}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Voice Notes */}
          {activeTab === 'notes' && (
            <div className="glass-panel p-5 rounded-3xl space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Saved Voice Notes</h3>
                  <p className="text-[11px] text-slate-400">Say "Take a note: ..." to add</p>
                </div>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <StickyNote className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                  <p className="text-sm">No notes recorded yet.</p>
                  <p className="text-xs text-slate-500">Try saying: "Take a note: review quarterly goals"</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-amber-300">{note.title}</h4>
                      <button
                        onClick={async () => {
                          await deleteNote(note.id);
                          await refreshData();
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{note.content}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Reminders & Timers */}
          {activeTab === 'reminders' && (
            <div className="glass-panel p-5 rounded-3xl space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Active Reminders</h3>
                  <p className="text-[11px] text-slate-400">Say "Remind me to ..." to set</p>
                </div>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                  <p className="text-sm">No reminders set.</p>
                  <p className="text-xs text-slate-500">Try saying: "Remind me to drink water at 5 PM"</p>
                </div>
              ) : (
                reminders.map((rem) => (
                  <div key={rem.id} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={async () => {
                          await toggleReminder(rem.id, !rem.is_completed);
                          await refreshData();
                        }}
                        className={`transition-colors ${rem.is_completed ? 'text-emerald-400' : 'text-slate-500 hover:text-cyan-400'}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div>
                        <p className={`text-xs font-medium ${rem.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {rem.title}
                        </p>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          ⏰ {rem.due_time || 'Today'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteReminder(rem.id);
                        await refreshData();
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Supabase & Vercel Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Supabase & Vercel Setup</h3>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
                <h4 className="font-semibold text-cyan-300 mb-1">Status: {isSupabaseConfigured ? '🟢 Supabase Connected' : '🟡 Local Storage Active'}</h4>
                <p className="text-slate-400">
                  {isSupabaseConfigured 
                    ? 'Your voice conversations, notes, and reminders are syncing with Supabase in real-time.' 
                    : 'The app works fully offline in your browser. To sync across devices, link your Supabase project keys in .env.local or on Vercel.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">1. Connect Supabase (PostgreSQL)</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>Create a free project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">supabase.com</a></li>
                  <li>In SQL Editor, run the schema from <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">supabase/schema.sql</code></li>
                  <li>Copy Project URL & Anon Key into <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">.env.local</code></li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">2. Deploy to Vercel</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>Run <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">vercel --prod</code> in terminal</li>
                  <li>Add environment variables in Vercel Project Settings</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Audora AI Voice & Music Assistant • Next.js 14 • Supabase PostgreSQL • Vercel Live
      </footer>
    </div>
  );
}
