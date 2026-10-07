import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Send,
  Terminal,
  AlertTriangle,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ConnectionState =
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'LISTENING'
  | 'PROCESSING'
  | 'ERROR'
  | 'OFFLINE';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface LiveSessionHolder {
  ws: WebSocket;
  isDirect: boolean;
  isVerified: boolean;
  sendRealtimeAudio: (base64PCM: string) => void;
  sendTextTurn: (text: string) => void;
  close: () => void;
}

export const VoiceSecurityOfficer: React.FC = () => {
  const { isDark } = useTheme();

  // Single source of truth state
  const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [activeVolume, setActiveVolume] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'agent',
      text: 'MemGuard Voice Co-Pilot initializing. Verifying connection to gemini-3.8-live...',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Session reference - Single source of truth for the Live API session instance
  const liveSessionRef = useRef<LiveSessionHolder | null>(null);

  // Audio refs
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isMicCapturingRef = useRef<boolean>(false);
  const currentAgentMsgIdRef = useRef<string | null>(null);
  const lastChunkLogTimeRef = useRef<number>(0);

  // Immediately stop all playing audio buffers
  const stopAudioPlayback = useCallback(() => {
    if (activeSourcesRef.current.length > 0) {
      activeSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch (_) {}
      });
      activeSourcesRef.current = [];
    }
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setActiveVolume(0);
  }, []);

  // Stop microphone capture cleanly
  const stopMicrophoneCapture = useCallback(() => {
    if (isMicCapturingRef.current) {
      console.log('[MemGuard Live] Stopping microphone stream cleanly');
      isMicCapturingRef.current = false;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }

    setActiveVolume(0);

    // If session is still verified and open, return to CONNECTED
    if (liveSessionRef.current && liveSessionRef.current.isVerified) {
      setConnectionState('CONNECTED');
    }
  }, []);

  // Full session tear-down
  const cleanupSession = useCallback(() => {
    console.log('[MemGuard Live] session closed');
    stopMicrophoneCapture();
    stopAudioPlayback();

    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (_) {}
      outputAudioCtxRef.current = null;
    }

    setConnectionState('OFFLINE');
  }, [stopMicrophoneCapture, stopAudioPlayback]);

  // Decode 24kHz PCM audio from Live API and play via Web Audio API
  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx();
      }

      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binary = atob(base64Audio);
      const len = binary.length;
      const numSamples = Math.floor(len / 2);
      if (numSamples === 0) return;

      const buffer = new ArrayBuffer(len);
      const view = new DataView(buffer);
      for (let i = 0; i < len; i++) {
        view.setUint8(i, binary.charCodeAt(i));
      }

      const float32Array = new Float32Array(numSamples);
      let sumSq = 0;
      for (let i = 0; i < numSamples; i++) {
        const int16 = view.getInt16(i * 2, true);
        const floatVal = int16 / 32768.0;
        float32Array[i] = floatVal;
        sumSq += floatVal * floatVal;
      }

      const rms = Math.sqrt(sumSq / numSamples);
      setActiveVolume(Math.min(1, rms * 4));

      // Native 24000 Hz AudioBuffer
      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
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

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setActiveVolume(0);
          setConnectionState((prev) =>
            isMicCapturingRef.current ? 'LISTENING' : prev === 'PROCESSING' ? 'CONNECTED' : prev
          );
        }
      };
    } catch (err) {
      console.error('[MemGuard Live] ERROR: audio playback decode failure', err);
    }
  }, []);

  // Resample audio to 16,000 Hz if hardware input rate differs
  const resampleTo16kHz = (audioData: Float32Array, inputSampleRate: number): Float32Array => {
    if (inputSampleRate === 16000) return audioData;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const indexBefore = Math.floor(originalIndex);
      const indexAfter = Math.min(Math.ceil(originalIndex), audioData.length - 1);
      const weight = originalIndex - indexBefore;
      result[i] = audioData[indexBefore] * (1 - weight) + audioData[indexAfter] * weight;
    }
    return result;
  };

  // Convert Float32Array to 16-bit little-endian PCM base64 string
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

  // Setup WebSocket connection to target URL
  const setupWebSocket = useCallback(
    (wsUrl: string, isDirect: boolean, setupPayload?: any) => {
      console.log(`[MemGuard Live] connecting to ${isDirect ? 'Google Live API' : 'local proxy'}`);
      setConnectionState('CONNECTING');
      setErrorMessage(null);

      const ws = new WebSocket(wsUrl);

      const sessionHolder: LiveSessionHolder = {
        ws,
        isDirect,
        isVerified: false,
        sendRealtimeAudio: (base64PCM: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            const payload = isDirect
              ? {
                  realtimeInput: {
                    mediaChunks: [
                      {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64PCM,
                      },
                    ],
                  },
                }
              : {
                  audio: base64PCM,
                };
            ws.send(JSON.stringify(payload));
          }
        },
        sendTextTurn: (text: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            if (isDirect) {
              ws.send(
                JSON.stringify({
                  clientContent: {
                    turns: [{ role: 'user', parts: [{ text }] }],
                    turnComplete: true,
                  },
                })
              );
            } else {
              ws.send(JSON.stringify({ text }));
            }
          }
        },
        close: () => {
          try {
            ws.close(1000, 'Session closed');
          } catch (_) {}
        },
      };

      ws.onopen = () => {
        console.log('[MemGuard Live] session opened');
        if (isDirect && setupPayload) {
          ws.send(JSON.stringify(setupPayload));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[MemGuard Live] server message received');

          // 1. Setup Complete handshake
          if (data.setupComplete || data.type === 'setupComplete') {
            console.log('[MemGuard Live] setup complete');
            console.log('[MemGuard Live] Sending connection test text message: "Respond with: MemGuard Live session connected."');
            sessionHolder.sendTextTurn('Respond with: MemGuard Live session connected.');
            return;
          }

          // 2. Model Audio
          const audioChunk =
            data.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data || data.audio;
          if (audioChunk) {
            console.log('[MemGuard Live] model audio received');
            setConnectionState('PROCESSING');
            playAudioChunk(audioChunk);
          }

          // 3. Output Transcription
          const outputText =
            data.serverContent?.outputTranscription?.text ||
            data.serverContent?.modelTurn?.parts?.[0]?.text ||
            (data.type === 'text' && data.sender === 'agent' ? data.text : null);

          if (outputText) {
            console.log('[MemGuard Live] output transcription received:', outputText);

            // Confirm session verification upon receiving real Gemini response
            if (!sessionHolder.isVerified) {
              sessionHolder.isVerified = true;
              liveSessionRef.current = sessionHolder;
              console.log('[MemGuard Live] session reference assigned');
              setConnectionState('CONNECTED');
              setErrorMessage(null);
            }

            setMessages((prev) => {
              if (currentAgentMsgIdRef.current) {
                const existingId = currentAgentMsgIdRef.current;
                return prev.map((m) =>
                  m.id === existingId ? { ...m, text: m.text + outputText } : m
                );
              } else {
                const newId = `agent-${Date.now()}`;
                currentAgentMsgIdRef.current = newId;
                return [
                  ...prev,
                  {
                    id: newId,
                    sender: 'agent',
                    text: outputText,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ];
              }
            });
          }

          // 4. Input Transcription
          const inputText =
            data.serverContent?.inputTranscription?.text ||
            (data.type === 'transcript' && data.sender === 'user' ? data.text : null);

          if (inputText) {
            console.log('[MemGuard Live] input transcription received:', inputText);
            setMessages((prev) => [
              ...prev,
              {
                id: `user-${Date.now()}`,
                sender: 'user',
                text: inputText,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }

          // 5. Interruption
          if (data.serverContent?.interrupted || data.type === 'interrupted') {
            stopAudioPlayback();
            currentAgentMsgIdRef.current = null;
            if (isMicCapturingRef.current) {
              setConnectionState('LISTENING');
            }
          }

          // 6. Turn Complete
          if (data.serverContent?.turnComplete || data.type === 'turnComplete') {
            currentAgentMsgIdRef.current = null;
            if (!sessionHolder.isVerified) {
              sessionHolder.isVerified = true;
              liveSessionRef.current = sessionHolder;
              console.log('[MemGuard Live] session reference assigned');
              setConnectionState('CONNECTED');
              setErrorMessage(null);
            } else {
              setConnectionState(isMicCapturingRef.current ? 'LISTENING' : 'CONNECTED');
            }
          }

          // 7. Error payload
          if (data.error || data.type === 'error') {
            const errStr = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
            console.error('[MemGuard Live] ERROR:', errStr);
            setErrorMessage(`Live API error: ${errStr}`);
            setConnectionState('ERROR');
          }
        } catch (err) {
          console.error('[MemGuard Live] ERROR: message parse error', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[MemGuard Live] ERROR: WebSocket error', e);
        if (liveSessionRef.current === sessionHolder) {
          liveSessionRef.current = null;
        }

        // If local proxy failed and we haven't tried direct token yet, attempt direct token fallback
        if (!isDirect) {
          console.log('[MemGuard Live] Local proxy error, attempting /api/live/token ephemeral fallback...');
          tryTokenFallback();
          return;
        }

        setErrorMessage('WebSocket connection failed. Verify internet and API key configuration.');
        setConnectionState('ERROR');
      };

      ws.onclose = (e) => {
        console.log(`[MemGuard Live] session closed (code=${e.code}, reason=${e.reason || 'none'})`);
        if (liveSessionRef.current === sessionHolder) {
          liveSessionRef.current = null;
        }
        stopMicrophoneCapture();
        setConnectionState('OFFLINE');
        if (e.code !== 1000 && !errorMessage) {
          setErrorMessage(`Connection closed (Code ${e.code}: ${e.reason || 'Session ended'})`);
        }
      };

      return sessionHolder;
    },
    [playAudioChunk, stopAudioPlayback, stopMicrophoneCapture, errorMessage]
  );

  // Attempt direct Google Live API connection using an ephemeral token
  const tryTokenFallback = useCallback(async () => {
    try {
      const tokenRes = await fetch('/api/live/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        setErrorMessage(err.error || 'Server rejected token generation.');
        setConnectionState('ERROR');
        return;
      }
      const tokenData = await tokenRes.json();
      if (tokenData?.wsUrl) {
        const setupPayload = {
          setup: {
            model: tokenData.model || 'models/gemini-3.8-live',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Zephyr',
                  },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: tokenData.systemInstruction || 'You are MemGuard Voice Security Officer.',
                },
              ],
            },
          },
        };
        setupWebSocket(tokenData.wsUrl, true, setupPayload);
      }
    } catch (err: any) {
      console.error('[MemGuard Live] ERROR: token fallback failed', err);
      setErrorMessage(`Live API connection failed: ${err.message || err}`);
      setConnectionState('ERROR');
    }
  }, [setupWebSocket]);

  // Connect to Gemini Live API with end-to-end handshake verification
  const connectLiveSession = useCallback(() => {
    currentAgentMsgIdRef.current = null;
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }

    // Connect to local fullstack /live proxy first (works in dev and container deployments)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const localWsUrl = `${protocol}//${window.location.host}/live`;
    setupWebSocket(localWsUrl, false);
  }, [setupWebSocket]);

  // Start microphone capture with strict session guard
  const startRecording = useCallback(async () => {
    const session = liveSessionRef.current;
    if (!session || !session.isVerified || session.ws.readyState !== WebSocket.OPEN) {
      console.warn('[MemGuard Live] Microphone click rejected: Live API session is not connected');
      setErrorMessage('Live API session is not connected');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported by this browser.');
      setConnectionState('ERROR');
      return;
    }

    try {
      console.log('[MemGuard Live] microphone requested');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[MemGuard Live] microphone granted');
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx();
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      const source = inputCtx.createMediaStreamSource(stream);
      // 4096 buffer size gives ~250ms chunks at 16kHz
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const currentSession = liveSessionRef.current;
        if (!currentSession || currentSession.ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        let sumSq = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sumSq += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sumSq / inputChannelData.length);
        setActiveVolume(Math.min(1, rms * 5));

        const resampledData = resampleTo16kHz(inputChannelData, inputCtx.sampleRate);
        const base64PCM = floatTo16BitPCM(resampledData);

        currentSession.sendRealtimeAudio(base64PCM);

        const now = Date.now();
        if (now - lastChunkLogTimeRef.current > 3000) {
          console.log(`[MemGuard Live] audio chunk sent (${base64PCM.length} bytes, RMS: ${rms.toFixed(3)})`);
          lastChunkLogTimeRef.current = now;
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      isMicCapturingRef.current = true;
      setConnectionState('LISTENING');
      setErrorMessage(null);
    } catch (err: any) {
      console.error('[MemGuard Live] ERROR: microphone access error', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || err}`);
      }
      setConnectionState('ERROR');
    }
  }, []);

  // Connect on initial component mount
  useEffect(() => {
    connectLiveSession();
    return () => {
      cleanupSession();
    };
  }, [connectLiveSession, cleanupSession]);

  // Text input submission with fallback
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = textInput.trim();
    if (!query) return;

    // Add user message to transcript
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    // Case 1: Active verified Live API session
    const session = liveSessionRef.current;
    if (session && session.isVerified && session.ws.readyState === WebSocket.OPEN) {
      console.log('[MemGuard Live] Sending text turn through Live API session:', query);
      session.sendTextTurn(query);
      return;
    }

    // Case 2: Fallback to /api/live/chat
    console.log('[MemGuard Live] Session not active; dispatching query to /api/live/chat HTTP fallback');
    try {
      const res = await fetch('/api/live/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: data.reply || 'MemGuard zero-trust memory verified.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      console.error('[MemGuard Live] ERROR: HTTP chat fallback error', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: `Fallback error: ${err.message || 'Unable to connect to MemGuard server.'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const session = liveSessionRef.current;
    if (session && session.isVerified && session.ws.readyState === WebSocket.OPEN) {
      console.log('[MemGuard Live] Sending quick question through Live API session:', question);
      session.sendTextTurn(question);
    } else {
      fetch('/api/live/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-${Date.now()}`,
              sender: 'agent',
              text: data.reply || 'MemGuard zero-trust status nominal.',
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        })
        .catch((err) => console.error('[MemGuard Live] ERROR: quick question fallback failed', err));
    }
  };

  // Status badge appearance based on single source of truth connectionState
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return {
          label: 'LIVE API CONNECTED (gemini-3.8-live)',
          className: isDark
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-emerald-50 border-emerald-300 text-emerald-700',
          dotColor: 'bg-emerald-400 animate-ping',
        };
      case 'LISTENING':
        return {
          label: 'LISTENING (16kHz PCM STREAM)',
          className: isDark
            ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : 'bg-cyan-50 border-cyan-300 text-cyan-700',
          dotColor: 'bg-cyan-400 animate-pulse',
        };
      case 'PROCESSING':
        return {
          label: 'PROCESSING / SPEAKING (24kHz)',
          className: isDark
            ? 'bg-indigo-950/80 border-indigo-400/60 text-indigo-300'
            : 'bg-indigo-50 border-indigo-300 text-indigo-700',
          dotColor: 'bg-indigo-400 animate-bounce',
        };
      case 'CONNECTING':
        return {
          label: 'CONNECTING & VERIFYING...',
          className: isDark
            ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            : 'bg-amber-50 border-amber-300 text-amber-700',
          dotColor: 'bg-amber-400 animate-spin',
        };
      case 'ERROR':
        return {
          label: 'CONNECTION ERROR',
          className: isDark
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            : 'bg-rose-50 border-rose-300 text-rose-700',
          dotColor: 'bg-rose-500',
        };
      case 'OFFLINE':
      case 'IDLE':
      default:
        return {
          label: 'OFFLINE',
          className: isDark
            ? 'bg-slate-900 border-slate-700 text-slate-400'
            : 'bg-slate-100 border-slate-300 text-slate-600',
          dotColor: 'bg-slate-500',
        };
    }
  };

  const badge = getStatusBadge();
  const isMicCapturing = connectionState === 'LISTENING';
  const isSpeaking = connectionState === 'PROCESSING';
  const isSessionReady =
    connectionState === 'CONNECTED' ||
    connectionState === 'LISTENING' ||
    connectionState === 'PROCESSING';

  return (
    <div
      className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-colors ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}
            >
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              MEMGUARD VOICE SECURITY OFFICER (LIVE API)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Bidirectional real-time voice streaming with{' '}
            <code className={`font-mono font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              gemini-3.8-live
            </code>{' '}
            (16kHz input &bull; 24kHz output &bull; Zero-Trust memory enforcement)
          </p>
        </div>

        {/* Live Status Badge & Session Reconnect */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${badge.className}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
            <span>{badge.label}</span>
          </div>

          {!isSessionReady && (
            <button
              onClick={connectLiveSession}
              disabled={connectionState === 'CONNECTING'}
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow cursor-pointer disabled:opacity-50"
              title="Connect Live API Session"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionState === 'CONNECTING' ? 'animate-spin' : ''}`} />{' '}
              {connectionState === 'CONNECTING' ? 'Verifying...' : 'Connect'}
            </button>
          )}

          {isSessionReady && (
            <button
              onClick={cleanupSession}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Disconnect Session"
            >
              <WifiOff className="w-3.5 h-3.5 text-rose-400" /> Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-800/60 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">SECURITY NOTICE: </span>
            {errorMessage}
          </div>
          <button
            onClick={() => {
              setErrorMessage(null);
              connectLiveSession();
            }}
            className="text-[10px] underline hover:text-white cursor-pointer ml-2"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Center Interactive Audio Visualizer Box */}
      <div
        className={`p-6 rounded-2xl border text-center space-y-4 relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'
        }`}
      >
        {/* Dynamic Waveform bars reflecting mic/speaker RMS energy */}
        <div className="flex items-center justify-center gap-1.5 h-16">
          {[35, 55, 80, 45, 90, 70, 50, 85, 60, 30, 75, 45, 65, 90, 55].map((baseHeight, idx) => {
            const dynamicScale = activeVolume > 0 ? Math.max(0.25, activeVolume * 1.6) : 0.15;
            const barHeight = Math.max(10, Math.min(60, baseHeight * dynamicScale));

            return (
              <div
                key={idx}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isMicCapturing
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : isSpeaking
                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]'
                    : isDark
                    ? 'bg-slate-800'
                    : 'bg-slate-300'
                }`}
                style={{
                  height: `${barHeight}px`,
                }}
              />
            );
          })}
        </div>

        {/* Mic Control Button - Strictly gated by active verified session */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isMicCapturing ? stopMicrophoneCapture : startRecording}
            disabled={!isSessionReady}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isMicCapturing
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.6)] animate-pulse'
                : isSessionReady
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)]'
                : 'bg-slate-700 text-slate-400'
            }`}
            title={
              !isSessionReady
                ? 'Waiting for verified Live API session before enabling microphone...'
                : isMicCapturing
                ? 'Stop Microphone (Mute)'
                : 'Start Microphone (Speak)'
            }
          >
            {isMicCapturing ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>

        {/* Real-time State Hint */}
        <div className="text-xs font-mono">
          {connectionState === 'CONNECTING' ? (
            <span className="text-amber-400 animate-pulse">
              Connecting and verifying Live API session with gemini-3.8-live...
            </span>
          ) : isMicCapturing ? (
            <span className="text-cyan-400 font-bold animate-pulse">
              Listening to voice stream... (Streaming raw 16kHz PCM chunks to gemini-3.8-live)
            </span>
          ) : isSpeaking ? (
            <span className="text-indigo-400 font-bold animate-pulse">
              Security Officer speaking... (24kHz native audio stream output)
            </span>
          ) : connectionState === 'CONNECTED' ? (
            <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
              Session verified and live. Click microphone to speak, or select a security query below.
            </span>
          ) : (
            <span className="text-slate-400">
              Live session offline. Click "Connect" or type a query in the text fallback bar.
            </span>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Ask via Voice:</span>
          <button
            onClick={() => handleQuickQuestion('What is the current threat status of the agent memory?')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-800'
            }`}
          >
            "What is the current threat status?"
          </button>
          <button
            onClick={() => handleQuickQuestion('Why was invoice EML-102 quarantined?')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-amber-800'
            }`}
          >
            "Why was invoice EML-102 quarantined?"
          </button>
          <button
            onClick={() => handleQuickQuestion('How does the SHA-256 ledger prevent memory tampering?')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-emerald-800'
            }`}
          >
            "How does the SHA-256 ledger work?"
          </button>
          <button
            onClick={() => handleQuickQuestion('Why was the $250,000 payment to Acme Corp blocked?')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-rose-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-rose-800'
            }`}
          >
            "Why was the $250,000 payment blocked?"
          </button>
        </div>
      </div>

      {/* Real-time Live Audio Transcript */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>REAL-TIME LIVE AUDIO TRANSCRIPT</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {messages.length} exchanges recorded
          </span>
        </div>

        <div
          className={`space-y-2.5 max-h-60 overflow-y-auto pr-1 rounded-xl p-3 border transition-colors ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                m.sender === 'user'
                  ? isDark
                    ? 'bg-slate-900/90 border-slate-800 text-cyan-200 ml-8'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-900 ml-8'
                  : isDark
                  ? 'bg-cyan-950/20 border-cyan-800/40 text-slate-200 mr-8'
                  : 'bg-white border-slate-200 text-slate-800 mr-8 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="font-bold uppercase tracking-wider">
                  {m.sender === 'user' ? 'Operator' : 'MemGuard Voice Security Officer (Live)'}
                </span>
                <span>{m.timestamp}</span>
              </div>
              <p className="font-sans leading-relaxed text-sm">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Text Input Fallback Bar */}
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a security query (works via Live API WebSocket or HTTP fallback)..."
            className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition ${
              isDark
                ? 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500'
                : 'bg-white border border-slate-300 text-slate-900 focus:border-cyan-600'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
