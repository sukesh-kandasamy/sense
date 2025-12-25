import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL, WS_BASE_URL } from '../../config';
import { VideoPanel } from '../../components/meeting/VideoPanel';
import { EmotionDetector } from '../../components/meeting/EmotionDetector';
import { SmartNudge } from '../../components/meeting/SmartNudge';
import { InterviewControls } from '../../components/meeting/InterviewControls';
import { EmotionData } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Share2, Copy, Check } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { usePageTransition } from '../../components/common/PageTransition';

interface InterviewRoomProps {
  userRole: 'interviewer' | 'candidate';
  userName: string;
  roomId: string;
}

export function InterviewRoom({ userRole, userName, roomId }: InterviewRoomProps) {
  const navigate = useNavigate();
  const { navigateWithTransition } = usePageTransition();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasJoined, setHasJoined] = useState(false); // Lobby State

  const [showEndConfirm, setShowEndConfirm] = useState(false); // New: Confirmation State
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Smooth transition state

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Checking devices...');
  const [peerName, setPeerName] = useState<string | null>(null); // Store peer's actual name

  // Lobby Refinements
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null); // New: Avatar URL state
  const [analysisMode, setAnalysisMode] = useState<'cloud' | 'local'>('cloud');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [displayName, setDisplayName] = useState(userName || localStorage.getItem('userName') || 'Guest'); // Name State - reads from localStorage for candidates

  // Refs - Moved to top level
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const constraintsRef = useRef(null);
  const ws = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const emotionWs = useRef<WebSocket | null>(null);
  const insightsWs = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State - Moved to top level
  const [emotionData, setEmotionData] = useState<EmotionData>({
    primary: 'neutral',
    confidence: 0,
    emotions: { nervous: 0, confident: 0, stressed: 0, calm: 0, engaged: 0 },
    heartRate: 72,
    blinkRate: 15,
  });
  const [emotionConnected, setEmotionConnected] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerWarning, setTimerWarning] = useState<'5min' | '1min' | null>(null);

  // Insights WebSocket Effect
  useEffect(() => {
    if (userRole !== 'interviewer' || !hasJoined) return;
    if (analysisMode === 'local') {
      console.log('[EMOTION] Local Analysis Mode Active - Cloud insights disabled.');
      return;
    }
    // Logic to connect insights would go here if not handled by initializeMedia or another effect
    // But keeping original structure where feasible
  }, [userRole, hasJoined, analysisMode, roomId]);

  // Main Media Initialization Effect
  useEffect(() => {
    // Only initialize media on mount (Lobby)
    const initializeMedia = async () => {
      try {
        const API_URL = `${BACKEND_URL}/auth`;

        // Fetch User Info including Analysis Mode
        try {
          const userRes = await axios.get(`${API_URL}/users/me`, { withCredentials: true });
          if (userRes.data) {
            if (userRes.data.email) setUserEmail(userRes.data.email);
            if (userRes.data.full_name) setDisplayName(userRes.data.full_name);
            if (userRes.data.profile_photo_url) setUserAvatar(userRes.data.profile_photo_url);
            if (userRes.data.analysis_mode) setAnalysisMode(userRes.data.analysis_mode);
          }
        } catch (e) {
          console.warn("Could not fetch user info", e);
        }


        // Check meeting status first
        try {
          const res = await axios.get(`${API_URL}/meetings/${roomId}`, { withCredentials: true });
          if (!res.data.active) {
            if (userRole === 'interviewer') navigateWithTransition('/interviewer/thank-you');
            else navigateWithTransition('/candidate/thank-you');
            return;
          }
          // Fetch remaining time from server for timing verification
          if (res.data.duration) {
            setMeetingDuration(res.data.duration);
            const timeRes = await axios.get(`${API_URL}/meetings/${roomId}/remaining-time`, { withCredentials: true });
            if (timeRes.data.remaining_seconds !== null) {
              setTimeRemaining(timeRes.data.remaining_seconds);
              if (timeRes.data.is_expired) {
                if (userRole === 'interviewer') navigateWithTransition('/interviewer/thank-you');
                else navigateWithTransition('/candidate/thank-you');
                return;
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch meeting status:", error);
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setConnectionStatus('Error: Camera access requires HTTPS or localhost');
          return;
        }

        // Enumerate Devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(cameras);
        if (cameras.length > 0) {
          setSelectedDeviceId(cameras[0].deviceId);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameras.length > 0 ? { deviceId: cameras[0].deviceId } : true,
          audio: true
        });
        console.log("Stream obtained", stream.getAudioTracks());
        setLocalStream(stream);
        setConnectionStatus('Ready to join');

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setConnectionStatus('Error accessing camera/mic');
      }
    };

    initializeMedia();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
    };
  }, [roomId]);

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });
      setLocalStream(stream);
    } catch (e) {
      console.error("Failed to switch device", e);
    }
  };

  const handleServerDisconnect = () => {
    console.log('[WebRTC] Server disconnected. Cleaning up...');
    setConnectionStatus('Disconnected (Server)');

    // Stop local media (solves "still running" issue)
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    // Close PeerConnection to stop P2P media
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Close other sockets
    if (emotionWs.current) {
      emotionWs.current.close();
      emotionWs.current = null;
    }
    if (insightsWs.current) {
      insightsWs.current.close();
      insightsWs.current = null;
    }

    // Show End Screen
    setIsMeetingEnded(true);
  };

  const connectToRoom = async () => {
    if (!localStream) return;
    setHasJoined(true);
    setConnectionStatus('Connecting...');

    try {
      // ... WebSocket setup ...
      const wsUrl = `${WS_BASE_URL}/ws/${roomId || 'default'}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebRTC] WebSocket connected to room:', roomId);
        setConnectionStatus(userRole === 'interviewer' ? 'Waiting for candidate...' : 'Waiting for interviewer...');
        // Send join with our name so peer can display it
        ws.current?.send(JSON.stringify({ type: 'join', name: displayName }));
        console.log('[WebRTC] Sent join message with name:', displayName);
      };

      ws.current.onclose = () => {
        console.log('[WebRTC] WebSocket closed by server');
        handleServerDisconnect();
      };

      ws.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('[WebRTC] Received message:', message.type, message);
        handleSignalingMessage(message);
      };

      // Initialize Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track:', event.streams[0]);
        setRemoteStream(event.streams[0]);
        setConnectionStatus('Connected');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.current?.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate
          }));
        }
      };

    } catch (e) {
      console.error("Connection failed", e);
      setConnectionStatus("Connection failed");
    }
  };

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    ws.current?.close();
    // Cleanup emotion analysis connections
    emotionWs.current?.close();
    insightsWs.current?.close();
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // --- Gemini Emotion Analysis Integration ---

  // For Candidates: Capture and send video frames for emotion analysis
  useEffect(() => {
    if (userRole !== 'candidate' || !localStream || !hasJoined) return;

    // Emotion Analysis WebSocket
    const emotionUrl = `${WS_BASE_URL}/ws/emotion/${roomId}`;

    console.log('[EMOTION] Candidate connecting to emotion analysis:', emotionUrl);
    emotionWs.current = new WebSocket(emotionUrl);

    // Audio Capture Variables
    let audioContext: AudioContext | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let audioSource: MediaStreamAudioSourceNode | null = null;
    const audioChunks: Float32Array[] = [];

    emotionWs.current.onopen = () => {
      console.log('[EMOTION] Connected to emotion analysis service');
      setEmotionConnected(true);

      // Create hidden video element for frame capture
      const video = document.createElement('video');
      video.srcObject = localStream;
      video.muted = true;
      video.play();
      localVideoRef.current = video;

      // Initialize Audio Capture
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
          audioSource = audioContext.createMediaStreamSource(localStream);
          scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

          audioSource.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);

          scriptProcessor.onaudioprocess = (e) => {
            if (emotionWs.current?.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              audioChunks.push(new Float32Array(inputData));
            }
          };
        }
      } catch (e) {
        console.error('[EMOTION] Audio capture setup failed:', e);
      }

      // Capture and send frames + audio at 0.2 FPS (every 5 seconds)
      frameIntervalRef.current = setInterval(() => {
        if (!localVideoRef.current || !emotionWs.current || emotionWs.current.readyState !== WebSocket.OPEN) return;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = 768;
          canvas.height = 768;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw video frame to canvas (centered crop)
          const vw = localVideoRef.current.videoWidth;
          const vh = localVideoRef.current.videoHeight;
          const size = Math.min(vw, vh);
          const sx = (vw - size) / 2;
          const sy = (vh - size) / 2;
          ctx.drawImage(localVideoRef.current, sx, sy, size, size, 0, 0, 768, 768);
          const frameData = canvas.toDataURL('image/jpeg', 0.7);

          // 2. Process Audio
          if (audioChunks.length > 0) {
            const totalLen = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const mergedAudio = new Float32Array(totalLen);
            let offset = 0;
            for (const chunk of audioChunks) {
              mergedAudio.set(chunk, offset);
              offset += chunk.length;
            }
            audioChunks.length = 0;

            const pcmBuffer = new Int16Array(mergedAudio.length);
            for (let i = 0; i < mergedAudio.length; i++) {
              const s = Math.max(-1, Math.min(1, mergedAudio[i]));
              pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const wavHeader = new ArrayBuffer(44);
            const view = new DataView(wavHeader);
            const sampleRate = audioContext?.sampleRate || 44100;
            // Simplified WAV header generation
            const writeString = (view: DataView, offset: number, string: string) => {
              for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
            };

            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + pcmBuffer.byteLength, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(view, 36, 'data');
            view.setUint32(40, pcmBuffer.byteLength, true);

            const wavBlob = new Blob([view, pcmBuffer], { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result as string;
              if (emotionWs.current?.readyState === WebSocket.OPEN) {
                emotionWs.current.send(JSON.stringify({
                  type: 'multimodal_frame',
                  video: frameData,
                  audio: base64Audio
                }));
              }
            };
            reader.readAsDataURL(wavBlob);
            return;
          }

          emotionWs.current.send(JSON.stringify({
            type: 'multimodal_frame',
            video: frameData
          }));
        } catch (e) {
          console.error('[EMOTION] Frame capture error:', e);
        }
      }, 7000); // ~0.14 FPS (every 7 seconds)
    };

    emotionWs.current.onclose = () => {
      console.log('[EMOTION] Disconnected from emotion analysis');
      setEmotionConnected(false);
    };

    emotionWs.current.onerror = (e) => {
      console.error('[EMOTION] WebSocket error:', e);
    };

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (scriptProcessor && audioContext) {
        scriptProcessor.disconnect();
        audioSource?.disconnect();
        audioContext.close();
      }
      emotionWs.current?.close();
    };
  }, [userRole, localStream, hasJoined, roomId]);

  // Helper for WAV writing
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // For Interviewers: Receive real-time emotion insights from Gemini
  useEffect(() => {
    if (userRole !== 'interviewer' || !hasJoined) return;

    // Insights/Nudge WebSocket (for Interviewer)
    const insightsUrl = `${WS_BASE_URL}/ws/insights/${roomId}`;

    console.log('[EMOTION] Interviewer connecting to insights:', insightsUrl);
    insightsWs.current = new WebSocket(insightsUrl);

    insightsWs.current.onopen = () => {
      console.log('[EMOTION] Connected to insights service');
      setEmotionConnected(true);
    };

    insightsWs.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'emotion_update' && data.emotion) {
          console.log('[EMOTION] Received emotion update:', data.emotion.primary);
          setEmotionData(data.emotion);
        }
      } catch (e) {
        console.error('[EMOTION] Failed to parse message:', e);
      }
    };

    insightsWs.current.onclose = () => {
      console.log('[EMOTION] Disconnected from insights');
      setEmotionConnected(false);
    };

    insightsWs.current.onerror = (e) => {
      console.error('[EMOTION] Insights WebSocket error:', e);
    };

    // Send periodic pings to keep connection alive
    const pingInterval = setInterval(() => {
      if (insightsWs.current?.readyState === WebSocket.OPEN) {
        insightsWs.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      insightsWs.current?.close();
    };
  }, [userRole, hasJoined, roomId]);



  // Recording Logic - Candidate records their own stream for reliability
  useEffect(() => {
    if (userRole !== 'candidate' || !localStream || !hasJoined) return;

    // Start Recording immediately when candidate joins
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(localStream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // 1s chunks
      console.log("[Rec] Candidate recording started from second 1");
    } catch (e) {
      console.error("[Rec] Recording failed", e);
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [userRole, localStream, hasJoined]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return null;
        const newTime = prev - 1;

        // Check for 5 minute warning
        if (newTime === 300 && !timerWarning) {
          setTimerWarning('5min');
          setTimeout(() => setTimerWarning(null), 5000);
        }
        // Check for 1 minute warning
        if (newTime === 60) {
          setTimerWarning('1min');
          setTimeout(() => setTimerWarning(null), 5000);
        }
        // Auto-end call when time is up
        if (newTime <= 0) {
          handleEndCall();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timeRemaining !== null]);

  const handleSignalingMessage = async (message: any) => {
    const pc = peerConnection.current;

    // Handle End Meeting Signal - redirect immediately
    if (message.type === 'end_meeting') {
      cleanup();
      // Redirect to appropriate thank you page
      if (userRole === 'interviewer') {
        navigate('/interviewer/thank-you');
      } else {
        navigate('/candidate/thank-you');
      }
      return;
    }

    if (!pc) return;

    if (message.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.current?.send(JSON.stringify({ type: 'answer', answer }));
    } else if (message.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.type === 'candidate') {
      await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } else if (message.type === 'peer_left') {
      setRemoteStream(null);
      setConnectionStatus(userRole === 'interviewer' ? 'Candidate disconnected' : 'Interviewer disconnected');
    } else if (message.type === 'join') {
      // Peer joined - store their name if provided
      if (message.name) {
        setPeerName(message.name);
        console.log('[WebRTC] Peer name received:', message.name);
      }
      console.log('[WebRTC] Peer joined, creating offer...');
      setConnectionStatus(userRole === 'interviewer' ? 'Connecting to candidate...' : 'Connecting to interviewer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Sending offer:', offer);
      ws.current?.send(JSON.stringify({ type: 'offer', offer }));
    }
  };

  const handleEndCall = async () => {
    // Show transition screen first
    setIsTransitioning(true);

    if (userRole === 'interviewer') {
      // End meeting in Database (API)
      try {
        const API_URL = `${BACKEND_URL}/auth`;
        await axios.post(`${API_URL}/meetings/${roomId}/end`, {}, { withCredentials: true });
      } catch (e) {
        console.error("Failed to mark meeting as ended", e);
      }

      // Interviewer ends for everyone (WebSocket)
      ws.current?.send(JSON.stringify({ type: 'end_meeting' }));

      // Cleanup and redirect interviewer
      cleanup();
      setTimeout(() => navigateWithTransition(`/interviewer/insights/${roomId}`), 800);
      return;
    }

    // Candidate: Stop & Upload Recording before leaving
    if (userRole === 'candidate' && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log("[Rec] Candidate stopping and uploading recording...");
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');

        try {
          const API_URL = `${BACKEND_URL}/auth`;
          await axios.post(`${API_URL}/meetings/${roomId}/recording`, formData, { withCredentials: true });
          console.log("[Rec] Candidate upload success");
        } catch (e) {
          console.error("[Rec] Candidate upload failed", e);
        }

        cleanup();
        navigateWithTransition('/candidate/thank-you');
      };
      mediaRecorderRef.current.stop();
      return; // onstop handles nav
    }

    // Candidate without recording
    cleanup();
    setTimeout(() => navigateWithTransition('/candidate/thank-you'), 800);
  };

  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const handleToggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (isSidebarOpen) panel.collapse();
      else panel.expand();
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining === null) return 'text-gray-600';
    if (timeRemaining <= 60) return 'text-red-600 bg-red-50';
    if (timeRemaining <= 300) return 'text-orange-600 bg-orange-50';
    return 'text-gray-700 bg-white';
  };



  return (
    <div className="min-h-screen bg-[#f8f9fa] relative font-sans">
      {/* Lobby Screen */}
      {!hasJoined ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-4xl border border-gray-100 grid md:grid-cols-2 gap-8 items-center">

            {/* Left: Preview */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ready to join?</h1>
                <p className="text-gray-500">Check your camera and microphone settings before entering.</p>
              </div>

              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-lg group">
                <VideoPanel
                  role={userRole}
                  name={displayName}
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isMain={true}
                  stream={localStream}
                  isMirrored={true}
                  muted={true} // Always mute self in preview to avoid feedback
                  showName={false} // Hidden in Lobby as requested
                // statusMessage removed to prevent blur overlay
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 items-center">
                  <button
                    onClick={handleToggleMic}
                    className={`p-3 rounded-full ${isMicOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-500 text-white hover:bg-red-600'}`}
                  >
                    {isMicOn ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.63" /><line x1="12" y1="19" x2="12" y2="22" /></svg>}
                  </button>
                  {/* Camera Selector Logic embedded in Camera Button if multiple? Or separate? 
                             User said: "in the green mark, just show the which camera you are going to use ... or disable the camera"
                             So I will add a small dropdown TRIGGER next to camera toggle OR just a select above/below.
                             Actually simplified: Let's put a select menu overlay or just a select box if multiple cameras.
                             Let's make it a clean absolute positioned element or part of the control bar.
                          */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleCamera}
                      className={`p-3 rounded-full ${isCameraOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                      {isCameraOn ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20" /><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /></svg>}
                    </button>
                    {/* Camera Selector Dropdown (Visible if multiple devices) */}
                    {videoDevices.length > 1 && isCameraOn && (
                      <select
                        className="h-11 px-3 rounded-full bg-black/50 text-white border-none text-xs focus:ring-0 cursor-pointer backdrop-blur-sm hover:bg-black/70 max-w-[120px]"
                        value={selectedDeviceId}
                        onChange={(e) => handleDeviceChange(e.target.value)}
                      >
                        {videoDevices.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info & Join */}
            <div className="flex flex-col justify-center gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{userRole === 'interviewer' ? 'Candidate Interview' : 'Tech Interview'}</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    {userAvatar ? (
                      <img
                        src={userAvatar.startsWith('http') ? userAvatar : `${BACKEND_URL}${userAvatar}`}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Fallback if load fails
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={displayName}
                        disabled
                        className="font-medium text-gray-900 w-full bg-transparent border-none focus:ring-0 px-0 cursor-default opacity-100 truncate"
                        placeholder="Your Name"
                      />
                      {userEmail && <p className="text-xs text-blue-500 mt-0.5 truncate">{userEmail}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={connectToRoom}
                disabled={!localStream}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Join Meeting
              </button>
              <p className="text-center text-xs text-gray-400">
                By joining, you agree to our terms of service and privacy policy.
              </p>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Transition Overlay */}
          {isTransitioning && (
            <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center transition-opacity duration-300">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Ending call...</p>
              </div>
            </div>
          )}

          {/* Timer Warning Alert */}
          {timerWarning && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2">
              <div className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 ${timerWarning === '1min'
                ? 'bg-red-500 text-white'
                : 'bg-orange-500 text-white'
                }`}>
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  {timerWarning === '5min' ? '5 minutes remaining' : '1 minute remaining!'}
                </span>
              </div>
            </div>
          )}

          <div className="h-screen flex flex-col md:flex-row">
            <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"}>
              {/* Main Video Area */}
              <ResizablePanel defaultSize={isMobile ? 65 : 75} minSize={30}>
                {/* Main Video Area - Wrapped in a Card */}
                <div className="h-full w-full p-2 md:p-4 flex flex-col relative" ref={constraintsRef}>
                  {/* Timer Display - Above the video card */}
                  {timeRemaining !== null && meetingDuration !== null && (
                    <div className="absolute top-4 left-4 md:top-6 md:left-6 z-30">
                      <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm shadow-sm ${timeRemaining <= 60
                        ? 'bg-red-500 text-white'
                        : timeRemaining <= 300
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-white'
                        }`}>
                        <span className="font-semibold tabular-nums tracking-wide">
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
                    <VideoPanel
                      role={userRole === 'interviewer' ? 'candidate' : 'interviewer'}
                      name={peerName || (userRole === 'interviewer' ? 'Candidate' : 'Interviewer')}
                      isCameraOn={true}
                      isMicOn={true}
                      isMain={true}
                      stream={remoteStream} // STRICT: Only show remote stream
                      isMirrored={false}
                      muted={false}
                      statusMessage={
                        remoteStream
                          ? undefined
                          : (userRole === 'interviewer'
                            ? 'Waiting for candidate to join...'
                            : 'Waiting for interviewer to join...')
                      }
                      // Pass emotion data to Candidate's video panel (when seen by Interviewer)
                      emotionData={userRole === 'interviewer' ? emotionData : undefined}
                    />

                    {/* Smart Nudge Overlay (Top-Center) */}
                    {userRole === 'interviewer' && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <div className="pointer-events-auto">
                          <SmartNudge nudge={emotionData?.smart_nudge || ''} />
                        </div>
                      </div>
                    )}

                    {/* Waiting Room Share Overlay - MOVED TO SIDEBAR */}

                    {/* Controls - Static Pill */}
                    <div
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-[90%] md:w-auto"
                    >
                      <InterviewControls
                        isMicOn={isMicOn}
                        isCameraOn={isCameraOn}
                        isScreenSharing={isScreenSharing}
                        onToggleMic={handleToggleMic}
                        onToggleCamera={handleToggleCamera}
                        onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
                        onEndCall={() => setShowEndConfirm(true)}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/20 transition-colors relative group hidden md:flex" />
              {/* Mobile Handle (Horizontal Divider) */}
              <ResizableHandle withHandle className="h-1 w-full bg-border hover:bg-primary/20 transition-colors relative group md:hidden" />

              {/* Right Sidebar - Emotion / Tips */}
              <ResizablePanel
                ref={sidebarPanelRef}
                defaultSize={isMobile ? 35 : 25}
                minSize={15}
                maxSize={isMobile ? 50 : 40}
                collapsible={true}
                onCollapse={() => setIsSidebarOpen(false)}
                onExpand={() => setIsSidebarOpen(true)}
                className="bg-[#f8f9fa] p-2 md:p-4 md:pl-0"
              >
                <div className="h-full flex flex-col   shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none border-t md:border-t-0 md:border-l border-gray-100">
                  {/* Sidebar Header - Clean, minimal like Google */}
                  <div className="px-4 pt-4 pb-3 flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                      {userRole === 'interviewer'
                        ? (remoteStream ? 'Live Insights' : '')
                        : 'Interview Guide'}
                    </h2>
                    {isMobile && (
                      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1">
                        <ChevronRight className="w-5 h-5 rotate-90 md:rotate-0 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
                    {userRole === 'interviewer' ? (
                      remoteStream ? (
                        <EmotionDetector emotionData={emotionData} connected={emotionConnected} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <WaitingRoomShare roomId={roomId} />
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="font-medium">Interview Tips</span>
                        </div>
                        <ul className="space-y-3 text-gray-600 text-sm">
                          <li className="flex gap-3 items-start">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>Relax and remember to breathe naturally.</span>
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>Look directly at the camera to simulate eye contact.</span>
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>Speak clearly and at a moderate pace.</span>
                          </li>
                        </ul>
                        <div className="pt-4 mt-4 border-t border-gray-100">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Status</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium text-gray-700">{connectionStatus}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>



            {/* End Meeting Confirmation Modal */}
            {showEndConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card p-6 rounded-2xl shadow-2xl border border-border max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-xl font-semibold text-foreground mb-2">End Interview?</h3>
                  <p className="text-muted-foreground mb-6">
                    Are you sure you want to end this interview session? {userRole === 'interviewer' ? 'This will end the call for everyone.' : 'You can rejoin if the interview is still active.'}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowEndConfirm(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowEndConfirm(false); handleEndCall(); }}
                      className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-lg transition-colors shadow-lg"
                    >
                      End Interview
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* End Meeting Modal (Success/Thank you) */}
            {isMeetingEnded && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-border animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Thank You!</h1>
                  <p className="text-muted-foreground mb-8">
                    The interview session has ended. We appreciate your time.
                  </p>
                  <button
                    onClick={() => {
                      if (userRole === 'interviewer') {
                        navigate('/interviewer/dashboard');
                      } else {
                        window.location.href = '/'; // Full reload for candidate to clear state
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all w-full shadow-lg"
                  >
                    {userRole === 'interviewer' ? 'Return to Dashboard' : 'Return to Home'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function WaitingRoomShare({ roomId }: { roomId: string }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Normalize code for display
  const displayCode = roomId.toUpperCase();

  const getMeetingShareUrl = () => {
    return `https://${window.location.hostname}/auth/candidate/login?access_code=${displayCode}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    const message = `Join my interview on Sense!\n\nMeeting Code: ${displayCode}\nLink: ${getMeetingShareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShareOpen(false);
  };

  return (
    <div className="relative group">
      {/* Clean Google-like Design */}
      <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-gray-900 font-medium text-lg">Share joining info</h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
            Send this code or link to the candidate so they can join the session.
          </p>
        </div>

        {/* Meeting Code Display */}
        <div
          className="w-full bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-200 group cursor-pointer hover:border-blue-400 transition-colors"
          onClick={copyToClipboard}
        >
          <span className="font-roboto font-medium text-gray-700 text-lg tracking-wider">{displayCode}</span>
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getMeetingShareUrl());
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-full transition-all shadow-sm active:scale-95"
          >
            <Copy className="w-4 h-4" />
            <span>Copy meeting link</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-full border border-gray-300 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}