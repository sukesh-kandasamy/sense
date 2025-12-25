import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import {
    Copy,
    Check,
    ArrowLeft,
    Clock,
    Link as LinkIcon,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen bg-white md:bg-[#f8f9fa] flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="max-w-md w-full bg-white md:rounded-2xl md:shadow-sm md:border border-gray-200 overflow-hidden"
            >
                {/* Header Actions */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/interviewer/dashboard')}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                        Ready to join
                    </div>
                </div>

                <div className="px-6 pb-8">
                    {/* Main Title Area */}
                    <div className="space-y-2 mb-8">
                        <h1 className="text-[22px] leading-tight text-gray-900 font-normal">
                            Here's your joining info
                        </h1>
                        <p className="text-gray-500 text-sm leading-6">
                            Send this to the candidate so they can join the session.
                        </p>
                    </div>

                    {/* Sharing Section */}
                    <div className="space-y-6 mb-8">
                        {/* Link Box */}
                        <div>
                            <div className="bg-[#f1f3f4] rounded-lg p-1.5 pr-2 flex items-center gap-2 group transition-colors hover:bg-gray-200">
                                <div className="pl-3 py-2 flex-1 min-w-0">
                                    <div className="text-sm text-gray-700 truncate font-sans select-all">
                                        {shareLink}
                                    </div>
                                </div>
                                <button
                                    onClick={copyLink}
                                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-all shadow-sm"
                                    title="Copy link"
                                >
                                    {isLinkCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Meeting Code Display */}
                            <div className="mt-3 flex items-center gap-2 pl-1">
                                <span className="text-xs font-medium text-gray-500">MEETING CODE</span>
                                <div className="flex items-center gap-2 cursor-pointer group" onClick={copyCode}>
                                    <span className="text-xs font-bold text-gray-700 tracking-wider font-mono bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                                        {meetingCode}
                                    </span>
                                    {isCopied ?
                                        <Check className="w-3 h-3 text-green-600" /> :
                                        <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Configuration Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-800">
                                <Clock className="w-4 h-4 text-[#1a73e8]" />
                                <span className="text-sm font-medium">Session Duration</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {DURATION_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleDurationChange(option.value)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${!isCustom && duration === option.value
                                            ? 'bg-[#e8f0fe] text-[#1967d2] border-transparent hover:bg-[#d2e3fc]'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}

                                <div className={`flex items-center rounded-full border px-3 py-1.5 transition-all ${isCustom ? 'border-[#1967d2] ring-1 ring-[#1967d2] bg-[#e8f0fe]' : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}>
                                    <input
                                        type="number"
                                        placeholder="Custom"
                                        value={customDuration}
                                        onChange={(e) => {
                                            setCustomDuration(e.target.value);
                                            setIsCustom(true);
                                        }}
                                        className={`w-12 text-sm outline-none bg-transparent text-center remove-arrow ${isCustom ? 'text-[#1967d2] placeholder-[#aecbfa]' : 'text-gray-900 placeholder-gray-500'
                                            }`}
                                    />
                                    <span className={`text-xs ${isCustom ? 'text-[#1967d2]' : 'text-gray-500'}`}>min</span>
                                    {isCustom && (
                                        <button
                                            onClick={handleCustomSave}
                                            disabled={isSaving}
                                            className="ml-2 text-[#1967d2] hover:text-[#174ea6]"
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
                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                    <button
                        onClick={() => navigate(`/meeting/${meetingId}`)}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        Start now
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