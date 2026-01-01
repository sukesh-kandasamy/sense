import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import {
    ArrowLeft,
    Download,
    Share2,
    Calendar,
    Clock,
    User,
    TrendingUp,
    MessageSquare,
    Brain,
    AlertCircle,
    CheckCircle2,
    Eye,
    Target,
    FileText,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Info
} from 'lucide-react';

// Helper to format time (e.g., 65 -> "01:05")
const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const CustomVideoPlayer = ({ src, totalDuration }: { src: string, totalDuration?: number }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = React.useRef<any>();

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const onEnded = () => setPlaying(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (playing) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setPlaying(!playing);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const val = parseFloat(e.target.value);
        videoRef.current.volume = val;
        setVolume(val);
        setIsMuted(val === 0);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (playing) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
        }
    };

    useEffect(() => {
        if (!playing) setShowControls(true);
    }, [playing]);

    if (!src) return (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-900">
            <p>No recording available</p>
        </div>
    );

    return (
        <div
            className="absolute inset-0 bg-black group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
            />

            {/* Center Play Button Overlay */}
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                </div>
            )}

            {/* Bottom Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div className="group/slider relative h-1.5 w-full bg-gray-600 rounded-full cursor-pointer mb-4">
                    {(() => {
                        const effectiveDuration = totalDuration || duration || 0;
                        const progressPercent = effectiveDuration > 0 ? Math.min((currentTime / effectiveDuration) * 100, 100) : 0;

                        return (
                            <>
                                <div
                                    className="absolute h-full bg-blue-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={effectiveDuration}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </>
                        );
                    })()}
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                            {playing ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume relative">
                            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>

                        <div className="text-sm font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>
                            <span>{formatTime(currentTime)}</span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span>{formatTime(totalDuration || duration || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function ReportPage() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'insights'>('insights');

    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState<any>({
        candidateName: "Loading...",
        role: "Candidate",
        date: "",
        duration: "",
        videoDurationSeconds: 0,
        overallScore: 0,
        videoUrl: "",
        sentiment: "Neutral",
        summary: "Analysis in progress...",
        strengths: [],
        improvements: []
    });
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (!meetingId) return;
            try {
                const response = await axios.get(`${BACKEND_URL}/auth/meetings/${meetingId}/report`, { withCredentials: true });

                if (response.data) {
                    const data = response.data;

                    // Transform Data
                    setReportData({
                        candidateName: data.meeting.candidates?.[0] || "Candidate",
                        candidatePhoto: data.meeting.candidate_photo ? `${BACKEND_URL}${data.meeting.candidate_photo}` : null,
                        role: "Applicant",
                        date: new Date(data.meeting.created_at).toLocaleDateString(),
                        // Prefer video duration (seconds) -> formatted, else fallback to planned duration (mins)
                        duration: data.meeting.video_duration_seconds
                            ? formatTime(data.meeting.video_duration_seconds)
                            : (data.meeting.duration ? `${data.meeting.duration} mins` : "Unknown"),
                        videoDurationSeconds: data.meeting.video_duration_seconds || 0,
                        candidateDuration: data.meeting.candidate_duration_seconds
                            ? formatTime(data.meeting.candidate_duration_seconds)
                            : "N/A",
                        overallScore: 85, // Mock score
                        videoUrl: data.meeting.recording_url ? `${BACKEND_URL}/auth/meetings/${meetingId}/stream` : "",
                        resumeUrl: data.meeting.resume_url ? `${BACKEND_URL}${data.meeting.resume_url}` : null,
                        sentiment: "Positive",
                        summary: "Session analysis available below.",
                        strengths: ["Communication", "Technical Skills"],
                        improvements: ["Pacing"]
                    });

                    // Transform Insights from emotion_data (Sentiment Detection)
                    // Transform Insights from emotion_data (Sentiment Detection)
                    const events = data.insights.map((insight: any) => {
                        const emotionData = insight.emotion_data || {};

                        return {
                            time: new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            type: 'ANALYSIS', // Simplified type
                            dominantEmotion: emotionData.dominant_emotion || emotionData.primary || 'neutral',
                            confidence: emotionData.confident_meter ?? emotionData.confidence ?? 0,
                            emotionMeter: emotionData.emotion_meter || emotionData.emotions || {},
                        };
                    });
                    setTimelineEvents(events);
                }
            } catch (error) {
                console.error("Failed to fetch report:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [meetingId]);

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans">
            {/* Top Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/interviewer/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-normal text-gray-900">Interview Report</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            {reportData.date} • <Clock className="w-3.5 h-3.5" /> {reportData.duration} • ID: {meetingId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-6 space-y-6">

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                    {/* Left Panel: Video Player (Takes up 2 cols) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 flex-1 relative group">
                            <CustomVideoPlayer src={reportData.videoUrl} totalDuration={reportData.videoDurationSeconds} />
                        </div>
                    </div>

                    {/* Right Panel: Tabbed Insights Interface */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                        {/* Tabs Header */}
                        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                            <TabButton id="overview" label="Overview" icon={Brain} />
                            <TabButton id="insights" label="Analysis" icon={TrendingUp} />
                            <TabButton id="transcript" label="Transcript" icon={MessageSquare} />
                        </div>

                        {/* Tab Content Area */}
                        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 space-y-8"
                                >
                                    {/* Candidate Card */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-medium text-gray-900">{reportData.candidateName}</h2>
                                            <p className="text-gray-500">{reportData.role}</p>

                                            {reportData.resumeUrl && (
                                                <a
                                                    href={reportData.resumeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Resume
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {reportData.candidatePhoto ? (
                                                <img
                                                    src={reportData.candidatePhoto}
                                                    alt={reportData.candidateName}
                                                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">
                                                    {reportData.candidateName?.charAt(0).toUpperCase() || 'C'}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                <span>Attended: {reportData.candidateDuration || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Overall Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-light text-gray-900">{reportData.overallScore}</span>
                                            <span className="text-gray-400 text-xl">/ 100</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${reportData.overallScore}%` }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed font-normal">{reportData.summary}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* TIMELINE INSIGHTS TAB (The requested design) */}
                            {activeTab === 'insights' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-[#F8F9FA] min-h-full"
                                >
                                    {/* Header */}
                                    <div className="px-6 py-5 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                                                <Brain className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900">Timeline Insights</h3>
                                                <p className="text-xs text-blue-600 font-medium">AI-powered analysis</p>
                                            </div>
                                        </div>
                                        <span className="bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                            {timelineEvents.length} Events
                                        </span>
                                    </div>

                                    {/* Timeline List */}
                                    <div className="p-6 relative">
                                        {/* Vertical Timeline Line */}
                                        <div className="absolute left-[47px] top-6 bottom-6 w-0.5 bg-gray-200"></div>

                                        <div className="space-y-8 relative z-10">
                                            {timelineEvents.map((event, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="relative pl-10 group"
                                                >
                                                    {/* Timeline Node */}
                                                    <div className="absolute left-0 top-6 w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center transform -translate-x-1/2 shadow-sm z-20 group-hover:scale-110 transition-transform">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    </div>

                                                    {/* Card */}
                                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                                            <span className="text-xs font-mono text-gray-500 font-medium">{event.time}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100">
                                                                    {event.dominantEmotion}
                                                                </span>
                                                                <button
                                                                    onClick={() => setExpandedEventIndex(expandedEventIndex === index ? null : index)}
                                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <Info className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-5">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Dominant Emotion</p>
                                                                    <h4 className="text-2xl font-bold text-gray-900 capitalize leading-tight">{event.dominantEmotion}</h4>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Confidence</p>
                                                                    <p className="text-xl font-bold text-gray-900">{event.confidence}%</p>
                                                                </div>
                                                            </div>

                                                            {/* Expandable Emotion Meter */}
                                                            {expandedEventIndex === index && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="mt-4 pt-4 border-t border-gray-100"
                                                                >
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detailed Breakdown</p>
                                                                    <div className="space-y-3">
                                                                        {Object.entries(event.emotionMeter)
                                                                            .sort(([, a]: any, [, b]: any) => b - a)
                                                                            .map(([emotion, value]: any) => (
                                                                                <div key={emotion}>
                                                                                    <div className="flex justify-between text-xs mb-1">
                                                                                        <span className="font-medium text-gray-700 capitalize">{emotion}</span>
                                                                                        <span className="text-gray-500 tabular-nums">{value}%</span>
                                                                                    </div>
                                                                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                                        <motion.div
                                                                                            className="h-full rounded-full bg-blue-500"
                                                                                            initial={{ width: 0 }}
                                                                                            animate={{ width: `${value}%` }}
                                                                                            transition={{ duration: 0.5 }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TRANSCRIPT TAB */}
                            {activeTab === 'transcript' && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Transcript generation is in progress...</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
