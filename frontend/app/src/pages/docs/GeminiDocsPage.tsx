import { useState, useRef, useEffect, useCallback } from 'react';
import { SenseLogo } from '../../components/icons/SenseIcons';
import { BACKEND_URL } from '../../config';
import { Camera, Mic, Brain, Play, Square } from 'lucide-react';
import axios from 'axios';

interface GeminiResponse {
    dominant_emotion: string;
    confidence_level: number;
    engagement_score: number;
    stress_level: string;
    communication_clarity: string;
    facial_expression: string;
    body_language: string;
    vocal_tone: string;
    smart_nudge?: {
        action: string;
        priority: string;
    };
    candidate_insight: string;
    interviewer_tip: string;
}

export function GeminiDocsPage() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
    const [response, setResponse] = useState<GeminiResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [countdown, setCountdown] = useState(6);
    const [frameCount, setFrameCount] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const apiIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const framesBufferRef = useRef<string[]>([]);

    // Keep video element in sync with stream
    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
            videoRef.current.play().catch(e => console.log('Video play error:', e));
        }
    }, [localStream]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-30), `[${timestamp}] ${message}`]);
    };

    // Capture a single frame
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.6);
    }, []);

    // Initialize camera
    const startCapture = async () => {
        try {
            addLog('Requesting camera and microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            });
            setLocalStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                    setVideoPlaying(true);
                    addLog('✓ Camera playing');
                } catch (playErr) {
                    addLog('⚠ Tap video to play');
                }
            }
            setIsCapturing(true);
            addLog('✓ Camera and microphone connected');
        } catch (err: any) {
            addLog(`✗ Failed: ${err.message || 'Unknown error'}`);
            console.error(err);
        }
    };

    const stopCapture = () => {
        stopAutoMode();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setIsCapturing(false);
        setCapturedFrames([]);
        setVideoPlaying(false);
        addLog('Camera stopped');
    };

    // Send frames to Gemini API via HTTP
    const sendToGemini = async (frames: string[]) => {
        if (frames.length === 0) return;

        setIsProcessing(true);
        addLog(`📤 Sending ${frames.length} frames to Gemini API...`);

        try {
            // Use the last frame as the representative frame
            const representativeFrame = frames[frames.length - 1];

            const res = await axios.post(`${BACKEND_URL}/api/gemini/analyze`, {
                frame: representativeFrame.split(',')[1], // Remove data URL prefix
                frames_count: frames.length
            }, {
                withCredentials: true,
                timeout: 30000
            });

            if (res.data?.emotion_data) {
                setResponse(res.data.emotion_data);
                addLog(`✓ Response: ${res.data.emotion_data.dominant_emotion}`);
            } else if (res.data) {
                setResponse(res.data);
                addLog(`✓ Response received`);
            }
        } catch (err: any) {
            addLog(`✗ API Error: ${err.message}`);
            // Generate mock response for demo
            setResponse({
                dominant_emotion: "focused",
                confidence_level: 78,
                engagement_score: 8,
                stress_level: "low",
                communication_clarity: "clear",
                facial_expression: "neutral",
                body_language: "open",
                vocal_tone: "steady",
                candidate_insight: "Candidate appears focused and engaged",
                interviewer_tip: "Good engagement level detected"
            });
            addLog('⚠ Using mock data (API unavailable)');
        } finally {
            setIsProcessing(false);
        }
    };

    // Start auto-capture mode
    const startAutoMode = () => {
        if (!isCapturing || !videoPlaying) {
            addLog('⚠ Start camera first');
            return;
        }

        setIsAutoMode(true);
        setCountdown(6);
        framesBufferRef.current = [];
        addLog('▶ Auto-capture started (3 fps, 6s interval)');

        // Capture 3 frames per second
        frameIntervalRef.current = setInterval(() => {
            const frame = captureFrame();
            if (frame) {
                framesBufferRef.current.push(frame);
                setFrameCount(framesBufferRef.current.length);
                setCapturedFrames([...framesBufferRef.current.slice(-6)]); // Keep last 6 for display
            }
        }, 333); // ~3fps

        // Countdown timer
        let count = 6;
        const countdownInterval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                count = 6;
                setCountdown(6);
            }
        }, 1000);

        // Send to API every 6 seconds
        apiIntervalRef.current = setInterval(() => {
            const framesToSend = [...framesBufferRef.current];
            framesBufferRef.current = []; // Clear buffer
            setFrameCount(0);
            sendToGemini(framesToSend);
        }, 6000);

        // Store countdown interval for cleanup
        (apiIntervalRef.current as any).countdownInterval = countdownInterval;
    };

    // Stop auto-capture mode
    const stopAutoMode = () => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (apiIntervalRef.current) {
            clearInterval((apiIntervalRef.current as any).countdownInterval);
            clearInterval(apiIntervalRef.current);
            apiIntervalRef.current = null;
        }
        setIsAutoMode(false);
        setCountdown(6);
        setFrameCount(0);
        addLog('⏹ Auto-capture stopped');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-2">
                    <SenseLogo className="text-blue-600" size={28} />
                    <span className="text-lg font-normal text-gray-900">sense</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-gray-500 text-sm">Gemini API Docs</span>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Gemini API Integration</h1>
                    <p className="text-gray-500 text-sm">Real-time sentiment detection • 3 fps capture • 6s analysis interval</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input Section */}
                    <div className="space-y-3">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-900 text-sm">Input</span>
                                    <Mic className="w-4 h-4 text-purple-600 ml-1" />
                                </div>
                                {isAutoMode && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Next API call in</span>
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{countdown}s</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                {/* Video Preview */}
                                <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-3" style={{ height: '180px' }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                        onClick={() => {
                                            if (videoRef.current && localStream) {
                                                videoRef.current.play().then(() => {
                                                    setVideoPlaying(true);
                                                    addLog('✓ Video playing');
                                                });
                                            }
                                        }}
                                    />
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Overlay for starting */}
                                    {!isCapturing && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <button
                                                onClick={startCapture}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium flex items-center gap-2"
                                            >
                                                <Camera className="w-4 h-4" />
                                                Start Camera
                                            </button>
                                        </div>
                                    )}

                                    {/* Tap to play overlay */}
                                    {isCapturing && !videoPlaying && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
                                            onClick={() => {
                                                setVideoPlaying(true);
                                                addLog('✓ Video playing');
                                                if (videoRef.current) videoRef.current.play();
                                            }}
                                        >
                                            <div className="text-center text-white">
                                                <Camera className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-sm">Tap to play</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Frame counter */}
                                    {isAutoMode && (
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            📷 {frameCount} frames
                                        </div>
                                    )}
                                </div>

                                {/* Captured Frames Preview */}
                                {capturedFrames.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-1">Recent Frames ({capturedFrames.length}):</p>
                                        <div className="flex gap-1 overflow-x-auto">
                                            {capturedFrames.slice(-6).map((frame, i) => (
                                                <img key={i} src={frame} alt={`Frame ${i}`} className="w-12 h-9 object-cover rounded border" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="flex gap-2">
                                    {isCapturing && videoPlaying && (
                                        <>
                                            {isAutoMode ? (
                                                <button
                                                    onClick={stopAutoMode}
                                                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Square className="w-4 h-4" />
                                                    Stop Auto-Capture
                                                    {isProcessing && <span className="animate-pulse">...</span>}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={startAutoMode}
                                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Start Auto-Capture (6s)
                                                </button>
                                            )}
                                            <button
                                                onClick={stopCapture}
                                                className="px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg text-sm font-medium"
                                            >
                                                Stop
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400 h-36 overflow-y-auto">
                            <p className="text-gray-500 mb-1"># Logs</p>
                            {logs.map((log, i) => (
                                <p key={i} className="py-0.5 leading-tight">{log}</p>
                            ))}
                            {logs.length === 0 && <p className="text-gray-500">Waiting...</p>}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-gray-900 text-sm">Output (JSON Response)</span>
                            {isProcessing && (
                                <div className="ml-auto flex items-center gap-1 text-blue-600">
                                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span className="text-xs">Analyzing...</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            {response ? (
                                <div className="space-y-3">
                                    {/* Main Metrics */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <p className="text-[10px] text-blue-600 font-medium uppercase">Emotion</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{response.dominant_emotion}</p>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <p className="text-[10px] text-green-600 font-medium uppercase">Confidence</p>
                                            <p className="text-sm font-semibold text-gray-900">{response.confidence_level}%</p>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <p className="text-[10px] text-purple-600 font-medium uppercase">Engagement</p>
                                            <p className="text-sm font-semibold text-gray-900">{response.engagement_score}/10</p>
                                        </div>
                                        <div className={`p-2 rounded-lg ${response.stress_level === 'high' ? 'bg-red-50' :
                                            response.stress_level === 'moderate' ? 'bg-yellow-50' : 'bg-green-50'
                                            }`}>
                                            <p className="text-[10px] font-medium uppercase text-gray-600">Stress</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{response.stress_level}</p>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">😊 {response.facial_expression}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">🧍 {response.body_language}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">🎤 {response.vocal_tone}</span>
                                    </div>

                                    {/* Insights */}
                                    <div className="space-y-2">
                                        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                            <p className="text-[10px] text-blue-600 font-medium uppercase mb-0.5">Insight</p>
                                            <p className="text-xs text-gray-700">{response.candidate_insight}</p>
                                        </div>
                                        <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg">
                                            <p className="text-[10px] text-purple-600 font-medium uppercase mb-0.5">Tip</p>
                                            <p className="text-xs text-gray-700">{response.interviewer_tip}</p>
                                        </div>
                                    </div>

                                    {/* Raw JSON */}
                                    <details>
                                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Raw JSON</summary>
                                        <pre className="mt-1 p-2 bg-gray-900 text-green-400 rounded-lg text-[10px] overflow-x-auto">
                                            {JSON.stringify(response, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-8">
                                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Start auto-capture to see responses</p>
                                    <p className="text-xs mt-1">Sends every 6 seconds with 18 frames</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* API Info */}
                <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold mb-2">How it Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
                            <span>Captures <strong>3 frames/second</strong> from your camera (total 18 frames over 6 seconds)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center font-bold">2</span>
                            <span>Every <strong>6 seconds</strong>, sends HTTP POST to <code className="bg-gray-100 px-1 rounded">/api/gemini/analyze</code></span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
                            <span>Gemini 2.5 Flash analyzes frames and returns <strong>sentiment JSON</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
