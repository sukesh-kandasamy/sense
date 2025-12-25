import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import {
    Video,
    Clock,
    Share2,
    Copy,
    CheckCircle,
    ArrowLeft,
    Play,
    Users,
    Link2
} from 'lucide-react';

const DURATION_OPTIONS = [
    { value: 10, label: '10 mins' },
    { value: 15, label: '15 mins' },
    { value: 20, label: '20 mins' },
    { value: 30, label: '30 mins' },
    { value: 0, label: 'No limit' }
];

export function MeetingSetup() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [duration, setDuration] = useState<number>(15);
    const [customDuration, setCustomDuration] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const meetingCode = meetingId?.toUpperCase() || 'UNKNOWN';
    const shareLink = `${window.location.origin}/auth/candidate/login?access_code=${meetingCode}`;

    useEffect(() => {
        // Fetch meeting details if needed
        const fetchMeeting = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/meetings/${meetingId}`, { withCredentials: true });
                if (res.data?.duration) {
                    const dur = res.data.duration;
                    if (DURATION_OPTIONS.find(o => o.value === dur)) {
                        setDuration(dur);
                    } else {
                        setIsCustom(true);
                        setCustomDuration(String(dur));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch meeting:', err);
            }
        };
        if (meetingId) fetchMeeting();
    }, [meetingId]);

    const handleDurationChange = async (value: number) => {
        setIsCustom(false);
        setDuration(value);
        await saveDuration(value);
    };

    const handleCustomDuration = async () => {
        const val = parseInt(customDuration);
        if (val > 0) {
            await saveDuration(val);
        }
    };

    const saveDuration = async (dur: number) => {
        setIsSaving(true);
        try {
            await axios.patch(`${BACKEND_URL}/auth/meetings/${meetingId}`, { duration: dur || null }, { withCredentials: true });
        } catch (err) {
            console.error('Failed to save duration:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(meetingCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
    };

    const handleStartMeeting = () => {
        navigate(`/meeting/${meetingId}`);
    };

    return (
        <div className="min-h-screen bg-white p-6 font-sans">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => navigate('/interviewer/dashboard')} className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-normal text-gray-900">Meeting Setup</h1>
                            <p className="text-gray-500 text-sm">Configure your interview session before starting.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Meeting Code Card */}
                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-800">Interview Code</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-8 py-4">
                                    <p className="text-4xl font-mono font-bold text-primary tracking-wider">{meetingCode}</p>
                                </div>
                                <button
                                    onClick={copyCode}
                                    className={`p-3 rounded-full transition-colors ${isCopied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {isCopied ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                </button>
                            </div>
                            <p className="text-center text-gray-500 text-sm">Share this code with your candidate to join the interview.</p>
                        </div>
                    </div>

                    {/* Share Link Card */}
                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-gray-600" />
                            <h2 className="text-lg font-medium text-gray-800">Share Link</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-600 truncate">
                                    {shareLink}
                                </div>
                                <button
                                    onClick={copyLink}
                                    className={`py-2.5 px-5 rounded-full font-medium text-sm transition-colors flex items-center gap-2 ${isLinkCopied
                                            ? 'bg-green-100 text-green-600 border border-green-200'
                                            : 'bg-primary text-white hover:bg-blue-600'
                                        }`}
                                >
                                    {isLinkCopied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                    {isLinkCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Duration Card */}
                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <h2 className="text-lg font-medium text-gray-800">Interview Duration</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                                {DURATION_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleDurationChange(option.value)}
                                        className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border ${!isCustom && duration === option.value
                                                ? 'bg-primary text-white border-primary shadow-md'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Duration */}
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                <span className="text-sm text-gray-500">Custom:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="180"
                                    placeholder="Minutes"
                                    value={customDuration}
                                    onChange={(e) => {
                                        setCustomDuration(e.target.value);
                                        setIsCustom(true);
                                    }}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                />
                                <button
                                    onClick={handleCustomDuration}
                                    disabled={!customDuration || isSaving}
                                    className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Set'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStartMeeting}
                        className="w-full py-4 rounded-full font-medium text-lg bg-primary hover:bg-blue-600 text-white transition-all shadow-lg flex items-center justify-center gap-3"
                    >
                        <Play className="w-5 h-5" />
                        Start Meeting
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        You'll enter the meeting lobby where you can test your camera and microphone.
                    </p>
                </div>
            </div>
        </div>
    );
}