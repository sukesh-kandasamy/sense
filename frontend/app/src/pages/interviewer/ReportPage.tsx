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
    FileText
} from 'lucide-react';

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
        overallScore: 0,
        videoUrl: "",
        sentiment: "Neutral",
        summary: "Analysis in progress...",
        strengths: [],
        improvements: []
    });
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

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
                        duration: data.meeting.duration ? `${data.meeting.duration} mins` : "Unknown",
                        overallScore: 85, // Mock score
                        videoUrl: data.meeting.recording_url ? `${BACKEND_URL}/auth/meetings/${meetingId}/stream` : "",
                        resumeUrl: data.meeting.resume_url ? `${BACKEND_URL}${data.meeting.resume_url}` : null,
                        sentiment: "Positive",
                        summary: "Session analysis available below.",
                        strengths: ["Communication", "Technical Skills"],
                        improvements: ["Pacing"]
                    });

                    // Transform Insights from emotion_data (Sentiment Detection)
                    const events = data.insights.map((insight: any) => {
                        const emotionData = insight.emotion_data || {};
                        const stressLevel = emotionData.stress_level || 'low';
                        const isHighStress = stressLevel === 'high';
                        const isPositive = emotionData.engagement_score >= 7 || emotionData.dominant_emotion === 'confident' || emotionData.dominant_emotion === 'enthusiastic';

                        return {
                            time: new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            type: isHighStress ? 'CONCERN' : (isPositive ? 'POSITIVE' : 'NEUTRAL'),
                            title: insight.smart_nudge || emotionData.dominant_emotion?.toUpperCase() || 'Analysis',
                            desc: emotionData.insight || emotionData.candidate_insight || "Sentiment analysis captured",
                            confidence: emotionData.confidence_level || emotionData.confidence || 0,
                            engagement: emotionData.engagement_score || 0,
                            stressLevel: stressLevel,
                            facialExpression: emotionData.facial_expression || 'neutral',
                            bodyLanguage: emotionData.body_language || 'neutral',
                            vocalTone: emotionData.vocal_tone || 'steady',
                            interviewerTip: emotionData.interviewer_tip || '',
                            dominantEmotion: emotionData.dominant_emotion || emotionData.primary || 'neutral'
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
                            {reportData.date} • {reportData.duration} • ID: {meetingId}
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
                            {reportData.videoUrl ? (
                                <video
                                    src={reportData.videoUrl}
                                    controls
                                    className="w-full h-full object-contain"
                                    style={{ position: 'absolute', top: 0, left: 0 }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <p>No recording available</p>
                                </div>
                            )}
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
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${event.type === 'POSITIVE' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                event.type === 'CONCERN' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                                }`}>
                                                                {event.type}
                                                            </span>
                                                        </div>
                                                        <div className="p-5">
                                                            <div className="flex items-start gap-4 mb-3">
                                                                <div className={`p-2 rounded-lg flex-shrink-0 ${event.type === 'POSITIVE' ? 'bg-green-50 text-green-600' :
                                                                    event.type === 'CONCERN' ? 'bg-red-50 text-red-600' :
                                                                        'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    <Brain className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{event.title}</h4>
                                                                    <p className="text-sm text-gray-600 leading-relaxed">{event.desc}</p>
                                                                    {event.interviewerTip && (
                                                                        <p className="text-xs text-blue-600 mt-2 italic">💡 {event.interviewerTip}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Sentiment Metrics */}
                                                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                                                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Confidence</p>
                                                                    <p className="text-sm font-semibold text-gray-900">{event.confidence}%</p>
                                                                </div>
                                                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Engagement</p>
                                                                    <p className="text-sm font-semibold text-gray-900">{event.engagement}/10</p>
                                                                </div>
                                                                <div className={`text-center p-2 rounded-lg ${event.stressLevel === 'high' ? 'bg-red-50' :
                                                                    event.stressLevel === 'moderate' ? 'bg-yellow-50' :
                                                                        'bg-green-50'
                                                                    }`}>
                                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Stress</p>
                                                                    <p className={`text-sm font-semibold capitalize ${event.stressLevel === 'high' ? 'text-red-700' :
                                                                        event.stressLevel === 'moderate' ? 'text-yellow-700' :
                                                                            'text-green-700'
                                                                        }`}>{event.stressLevel}</p>
                                                                </div>
                                                            </div>

                                                            {/* Body Language Tags */}
                                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                                <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-700 rounded-full">😊 {event.facialExpression}</span>
                                                                <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">🧍 {event.bodyLanguage}</span>
                                                                <span className="text-[10px] px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full">🎤 {event.vocalTone}</span>
                                                            </div>
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
            </main>
        </div>
    );
}
