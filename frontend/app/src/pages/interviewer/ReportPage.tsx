import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import {
    ArrowLeft,

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
    Info,
    Mail
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

interface SeekTarget {
    time: number;
    timestamp: number;
}

const CustomVideoPlayer = ({ src, totalDuration, seekTarget }: { src: string, totalDuration?: number, seekTarget?: SeekTarget | null }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const controlsTimeoutRef = React.useRef<any>();

    // Handle external seek requests
    useEffect(() => {
        if (seekTarget && videoRef.current) {
            videoRef.current.currentTime = seekTarget.time;
            // Optional: Auto-play after seek
            videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
            setPlaying(true);
        }
    }, [seekTarget]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const onEnded = () => setPlaying(false);
        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => {
            setIsBuffering(false);
            setPlaying(true);
        };
        const onCanPlay = () => setIsBuffering(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', onEnded);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('canplay', onCanPlay);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, [src]);

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

            {/* Buffering Loader */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}

            {/* Center Play Button Overlay */}
            {!playing && !isBuffering && (
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

// Helper to format time to IST
const formatIST = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

export function ReportPage() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'resume'>('insights');
    const [resumeData, setResumeData] = useState<any>(null);

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
    const [seekTarget, setSeekTarget] = useState<SeekTarget | null>(null);

    const handleTimestampClick = (seconds: number) => {
        setSeekTarget({
            time: seconds,
            timestamp: Date.now()
        });
    };

    useEffect(() => {
        const fetchReport = async () => {
            if (!meetingId) return;
            try {
                const response = await axios.get(`${BACKEND_URL}/auth/meetings/${meetingId}/report`, { withCredentials: true });

                if (response.data) {
                    const data = response.data;

                    // Transform Data
                    setReportData({
                        candidateName: data.meeting.candidate_name || "Candidate",
                        candidatePhoto: data.meeting.candidate_photo ? `${BACKEND_URL}${data.meeting.candidate_photo}` : null,
                        candidateEmail: data.meeting.candidate_email || null,
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
                        // Map analysis data if available
                        overallScore: data.analysis?.overall_score || "N/A",
                        summary: data.analysis?.summary || null,
                        videoUrl: data.meeting.recording_url ? `${BACKEND_URL}/auth/meetings/${meetingId}/stream` : "",
                        resumeUrl: data.meeting.resume_url ? `${BACKEND_URL}${data.meeting.resume_url}` : null,
                        sentiment: "Positive",
                        strengths: ["Communication", "Technical Skills"],
                        improvements: ["Pacing"]
                    });

                    // Transform Insights
                    // Use started_at if available, else created_at as the anchor for relative time
                    const meetingStartTime = new Date(data.meeting.started_at || data.meeting.created_at).getTime();

                    const events = data.insights.map((insight: any) => {
                        const emotionData = insight.emotion_data || {};
                        const insightTime = new Date(insight.timestamp).getTime();

                        // Use stored relative seconds if available, else calculate
                        const calculatedRelative = Math.max(0, Math.floor((insightTime - meetingStartTime) / 1000));
                        const displayRelative = (insight.relative_seconds !== null && insight.relative_seconds !== undefined)
                            ? insight.relative_seconds
                            : calculatedRelative;

                        // Use stored request timestamp if available, else response timestamp
                        const displayTime = insight.request_timestamp || insight.timestamp;

                        return {
                            time: formatIST(displayTime),
                            relativeSeconds: displayRelative,
                            relativeTime: `(+${displayRelative}s)`,
                            type: 'ANALYSIS',
                            dominantEmotion: emotionData.dominant_emotion || emotionData.primary || 'neutral',
                            confidence: emotionData.confident_meter ?? emotionData.confidence ?? 0,
                            emotionMeter: emotionData.emotion_meter || emotionData.emotions || {},
                            reasoning: emotionData.reasoning
                        };
                    });
                    setTimelineEvents(events);

                    // Fetch resume data if candidate email is available
                    if (data.meeting.candidate_email) {
                        try {
                            const resumeResponse = await axios.get(
                                `${BACKEND_URL}/auth/users/${data.meeting.candidate_email}/resume-data`,
                                { withCredentials: true }
                            );
                            if (resumeResponse.data) {
                                setResumeData(resumeResponse.data);
                            }
                        } catch (err) {
                            console.error("Failed to fetch resume data:", err);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch report:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [meetingId]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeMeeting = async () => {
        setIsAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${BACKEND_URL}/auth/meetings/${meetingId}/analyze`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data) {
                setReportData((prev: any) => ({
                    ...prev,
                    summary: response.data.summary,
                    overallScore: response.data.overall_score
                }));
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
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
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-6 space-y-6">

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                    {/* Left Panel: Video Player (Takes up 2 cols) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 flex-1 relative group">
                            <CustomVideoPlayer
                                src={reportData.videoUrl}
                                totalDuration={reportData.videoDurationSeconds}
                                seekTarget={seekTarget}
                            />
                        </div>
                    </div>

                    {/* Right Panel: Tabbed Insights Interface */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
                        {/* Tabs Header */}
                        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                            <TabButton id="overview" label="Overview" icon={Brain} />
                            <TabButton id="insights" label="Analysis" icon={TrendingUp} />
                            <TabButton id="resume" label="Resume" icon={FileText} />
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

                                            {reportData.candidateEmail && (
                                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    {reportData.candidateEmail}
                                                </p>
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
                                                animate={{ width: `${typeof reportData.overallScore === 'number' ? reportData.overallScore : 0}%` }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary / Analysis Button */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                        {reportData.summary ? (
                                            <p className="text-gray-700 leading-relaxed font-normal">{reportData.summary}</p>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-gray-500 mb-4 text-sm">No analysis generated yet.</p>
                                                <button
                                                    onClick={handleAnalyzeMeeting}
                                                    disabled={isAnalyzing}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm font-medium text-sm"
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                            Generating Analysis...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingUp className="w-4 h-4" />
                                                            Get Overall Analysis
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
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
                                                    <div
                                                        onClick={() => handleTimestampClick(event.relativeSeconds)}
                                                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer active:scale-99"
                                                    >
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
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {event.reasoning && (
                                                                        <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                                                <Brain className="w-3 h-3" /> AI Reasoning
                                                                            </p>
                                                                            <p className="text-sm text-gray-700 italic leading-relaxed">"{event.reasoning}"</p>
                                                                        </div>
                                                                    )}

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

                            {/* RESUME TAB */}
                            {activeTab === 'resume' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 space-y-6"
                                >
                                    {resumeData && Object.keys(resumeData).length > 0 ? (
                                        <>
                                            {/* Personal Info */}
                                            {resumeData.personal_info && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Info</h3>
                                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                        {resumeData.personal_info.name && <p className="font-medium text-gray-900">{resumeData.personal_info.name}</p>}
                                                        {resumeData.personal_info.email && <p className="text-sm text-gray-600">{resumeData.personal_info.email}</p>}
                                                        {resumeData.personal_info.phone && <p className="text-sm text-gray-600">{resumeData.personal_info.phone}</p>}
                                                        {resumeData.personal_info.location && <p className="text-sm text-gray-600">{resumeData.personal_info.location}</p>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {(resumeData.skills_hard || resumeData.skills_soft) && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills</h3>
                                                    <div className="space-y-3">
                                                        {resumeData.skills_hard && resumeData.skills_hard.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 mb-2">Technical Skills</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {resumeData.skills_hard.map((skill: string, i: number) => (
                                                                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{skill}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {resumeData.skills_soft && resumeData.skills_soft.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 mb-2">Soft Skills</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {resumeData.skills_soft.map((skill: string, i: number) => (
                                                                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">{skill}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Experience */}
                                            {resumeData.experience && resumeData.experience.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Experience</h3>
                                                    <div className="space-y-4">
                                                        {resumeData.experience.map((exp: any, i: number) => (
                                                            <div key={i} className="border-l-2 border-blue-200 pl-4">
                                                                <p className="font-medium text-gray-900">{exp.title || exp.role}</p>
                                                                <p className="text-sm text-blue-600">{exp.company}</p>
                                                                {exp.duration && <p className="text-xs text-gray-500">{exp.duration}</p>}
                                                                {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Education */}
                                            {resumeData.education && resumeData.education.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Education</h3>
                                                    <div className="space-y-3">
                                                        {resumeData.education.map((edu: any, i: number) => (
                                                            <div key={i} className="bg-gray-50 rounded-lg p-3">
                                                                <p className="font-medium text-gray-900">{edu.degree}</p>
                                                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                                                {edu.year && <p className="text-xs text-gray-500">{edu.year}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Projects */}
                                            {resumeData.projects && resumeData.projects.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Projects</h3>
                                                    <div className="space-y-3">
                                                        {resumeData.projects.map((proj: any, i: number) => (
                                                            <div key={i} className="border border-gray-200 rounded-lg p-3">
                                                                <p className="font-medium text-gray-900">{proj.name || proj.title}</p>
                                                                {proj.description && <p className="text-sm text-gray-600 mt-1">{proj.description}</p>}
                                                                {proj.technologies && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).map((tech: string, j: number) => (
                                                                            <span key={j} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tech}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Certificates */}
                                            {resumeData.certificates && resumeData.certificates.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Certificates</h3>
                                                    <div className="space-y-3">
                                                        {resumeData.certificates.map((cert: any, i: number) => (
                                                            <div key={i} className="border border-gray-200 rounded-lg p-3">
                                                                <div className="flex items-start gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{typeof cert === 'string' ? cert : (cert.title || cert.name)}</p>
                                                                        {cert.description && <p className="text-sm text-gray-600 mt-1">{cert.description}</p>}
                                                                        {cert.tech_stack && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {(Array.isArray(cert.tech_stack) ? cert.tech_stack : [cert.tech_stack]).map((tech: string, j: number) => (
                                                                                    <span key={j} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tech}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Links */}
                                            {resumeData.links && Object.keys(resumeData.links).length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Links</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(resumeData.links).map(([key, url]: [string, any]) => (
                                                            url && (
                                                                <a
                                                                    key={key}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors capitalize"
                                                                >
                                                                    {key}
                                                                </a>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No resume data available for this candidate.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}



                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
