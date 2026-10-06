import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Send,
  Shield,
  Activity,
  Terminal,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const VoiceSecurityOfficer: React.FC = () => {
  const { isDark } = useTheme();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'agent',
      text: 'MemGuard Voice Co-Pilot active. Powered by gemini-3.8-live. Ask me about ledger integrity, memory blast radius, or threat status.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection to /live
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[VoiceOfficer] Connected to Live API WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle incoming 24kHz audio from gemini-3.8-live
        if (data.audio) {
          playAudioChunk(data.audio);
          setIsSpeaking(true);
        }

        // Handle text transcription or reply
        if (data.text) {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: 'agent',
              text: data.text,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          setIsSpeaking(false);
        }

        // Handle model interruption
        if (data.interrupted) {
          stopAudioPlayback();
          setIsSpeaking(false);
        }
      } catch (err) {
        console.error('[VoiceOfficer] WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[VoiceOfficer] Disconnected from Live API WebSocket');
      setIsConnected(false);
      setIsRecording(false);
    };

    return () => {
      stopRecording();
      ws.close();
    };
  }, []);

  // Playback raw PCM (24kHz, 16-bit little-endian) using AudioContext
  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const ctx = outputAudioCtxRef.current;
      const binary = atob(base64Audio);
      const len = binary.length / 2;
      const float32Array = new Float32Array(len);
      const dataView = new DataView(new ArrayBuffer(binary.length));

      for (let i = 0; i < binary.length; i++) {
        dataView.setUint8(i, binary.charCodeAt(i));
      }

      for (let i = 0; i < len; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (err) {
      console.warn('[VoiceOfficer] Audio playback error:', err);
    }
  };

  const stopAudioPlayback = () => {
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
      nextStartTimeRef.current = 0;
    }
  };

  // Convert Float32 to 16-bit PCM Base64
  const floatTo16BitPCM = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Start Mic Recording at 16kHz
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64PCM = floatTo16BitPCM(inputData);
          wsRef.current.send(JSON.stringify({ audio: base64PCM }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      setIsRecording(true);
    } catch (err) {
      console.warn('[VoiceOfficer] Microphone access failed or denied:', err);
      alert('Microphone access is unavailable or denied. You can still type queries to the Live API.');
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current) return;

    const userText = textInput.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    wsRef.current.send(JSON.stringify({ text: userText }));
    setTextInput('');
  };

  const handleQuickQuestion = (question: string) => {
    if (!wsRef.current) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: question,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    wsRef.current.send(JSON.stringify({ text: question }));
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-colors ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              MEMGUARD VOICE SECURITY OFFICER (LIVE API)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time, bidirectional voice conversations powered by <code className={`font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>gemini-3.8-live</code> (24kHz audio)
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
            isConnected
              ? isDark ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : isDark ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'LIVE API WEBSOCKET READY' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Center Interactive Audio Visualizer Box */}
      <div className={`p-6 rounded-2xl border text-center space-y-4 relative overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'
      }`}>
        {/* Background waveform pulse */}
        <div className="flex items-center justify-center gap-1.5 h-16">
          {[40, 65, 85, 45, 95, 75, 55, 90, 60, 30, 80, 50, 70, 95, 60].map((h, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-300 ${
                isRecording
                  ? 'bg-cyan-400 animate-pulse'
                  : isSpeaking
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-800'
              }`}
              style={{
                height: isRecording || isSpeaking ? `${Math.max(15, h * (isSpeaking ? 0.9 : 0.7))}px` : '12px',
              }}
            />
          ))}
        </div>

        {/* Mic Control Button */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)] animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
            }`}
          >
            {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {isRecording ? (
            <span className="text-cyan-400 font-bold animate-pulse">
              Listening to voice stream... (16kHz PCM stream to gemini-3.8-live)
            </span>
          ) : isSpeaking ? (
            <span className="text-emerald-400 font-bold">
              Speaking response... (24kHz audio output stream)
            </span>
          ) : (
            <span>Click microphone to talk with MemGuard Voice Co-Pilot</span>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Ask via Voice:</span>
          <button
            onClick={() => handleQuickQuestion('What is the current threat status of the agent memory?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 transition"
          >
            "What is the current threat status?"
          </button>
          <button
            onClick={() => handleQuickQuestion('Why was the Acme Corp invoice EML-102 quarantined?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 transition"
          >
            "Why was invoice EML-102 quarantined?"
          </button>
          <button
            onClick={() => handleQuickQuestion('How does the SHA-256 ledger prevent memory tampering?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          >
            "How does the SHA-256 ledger work?"
          </button>
        </div>
      </div>

      {/* Conversation History Log */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time Live Audio Transcript</span>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl border text-xs font-mono ${
                m.sender === 'user'
                  ? 'bg-slate-900/90 border-slate-800 text-cyan-200 ml-8'
                  : 'bg-cyan-950/20 border-cyan-800/40 text-slate-200 mr-8'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="font-bold text-slate-400 uppercase">{m.sender === 'user' ? 'Operator' : 'MemGuard Voice Officer (Live)'}</span>
                <span>{m.timestamp}</span>
              </div>
              <p className="font-sans leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Text Input Fallback Bar */}
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a voice question to test Live API WebSocket directly..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
