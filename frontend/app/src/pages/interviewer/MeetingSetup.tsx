import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import {
    Video,
    Clock,
    Share2,
    Copy,
    Check,
    ArrowLeft,
    Play,
    Link2,
    Calendar,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DURATION_OPTIONS = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hr' },
    { value: 0, label: 'No limit' }
];

export function MeetingSetup() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [duration, setDuration] = useState<number>(30);
    const [customDuration, setCustomDuration] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');

    const meetingCode = meetingId?.toUpperCase() || 'UNKNOWN';
    const shareLink = `${window.location.origin}/auth/candidate/login?access_code=${meetingCode}`;

    useEffect(() => {
        const fetchMeeting = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/meetings/${meetingId}`, { withCredentials: true });
                if (res.data?.duration !== undefined) {
                    const dur = res.data.duration;
                    const isPredefined = DURATION_OPTIONS.some(o => o.value === dur);
                    if (isPredefined) {
                        setDuration(dur);
                        setIsCustom(false);
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

    const handleCustomSave = async () => {
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

    return (
        <div className="min-h-screen bg-[#F0F4F8] font-sans flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Header Section */}
                <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => navigate('/interviewer/dashboard')}
                        className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ready to Setup</span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Title Area */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Meeting Details</h1>
                        <p className="text-gray-500 text-lg">Configure and share your interview session</p>
                    </div>

                    {/* Main Card Content */}
                    <div className="space-y-6">
                        {/* 1. Meeting URL & Code */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* Code Box */}
                                <div className="text-center md:text-left">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meeting Code</h3>
                                    <div
                                        onClick={copyCode}
                                        className="cursor-pointer group relative bg-white border border-gray-200 rounded-lg px-6 py-3 flex items-center gap-3 hover:border-blue-400 hover:shadow-sm transition-all"
                                    >
                                        <span className="text-2xl font-mono font-bold text-gray-800 tracking-widest">{meetingCode}</span>
                                        <div className="p-1.5 rounded-md text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px h-16 bg-gray-200"></div>

                                {/* Link Box */}
                                <div className="flex-1 w-full">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Candidate Link</h3>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 overflow-hidden">
                                            <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-600 truncate font-mono">{shareLink}</span>
                                        </div>
                                        <button
                                            onClick={copyLink}
                                            className="px-4 rounded-lg font-medium text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0 flex items-center gap-2"
                                        >
                                            {isLinkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                            {isLinkCopied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Configuration */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-700">Duration Limit</h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {DURATION_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleDurationChange(option.value)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${!isCustom && duration === option.value
                                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}

                                {/* Custom Input */}
                                <div className={`flex items-center rounded-full border transition-all overflow-hidden ${isCustom ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="number"
                                        placeholder="Custom"
                                        value={customDuration}
                                        onChange={(e) => {
                                            setCustomDuration(e.target.value);
                                            setIsCustom(true);
                                        }}
                                        className="w-20 pl-4 py-2.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400 text-center remove-arrow"
                                    />
                                    <span className="text-xs text-gray-400 pr-2">min</span>
                                    {isCustom && (
                                        <button
                                            onClick={handleCustomSave}
                                            disabled={isSaving}
                                            className="pr-3 pl-1 text-gray-600 hover:text-green-600"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Video className="w-4 h-4" />
                        <span>Camera & Mic check next</span>
                    </div>
                    <button
                        onClick={() => navigate(`/meeting/${meetingId}`)}
                        className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-full font-medium shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <span>Start Meeting</span>
                        <Play className="w-4 h-4 fill-current" />
                    </button>
                </div>
            </motion.div>

            <style>{`
                .remove-arrow::-webkit-inner-spin-button, 
                .remove-arrow::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
            `}</style>
        </div>
    );
}