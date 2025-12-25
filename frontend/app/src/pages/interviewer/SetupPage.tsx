import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { InterviewerNavbar } from '../../components/interviewer/InterviewerNavbar';
import { SenseLogo } from '../../components/icons/SenseIcons';
import {
    Video,
    Plus,
    Calendar,
    Trash2,
    Share2,
    ArrowRight,
    CheckCircle,
    Cog,
    Clock
} from 'lucide-react';

interface Meeting {
    id: string;
    host_username: string;
    created_at: string;
    active: boolean;
    duration?: number;
}

export function SetupPage() {
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Interviewer');
    const [userEmail, setUserEmail] = useState('');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (userRes.data) {
                    setUserName(userRes.data.full_name || userRes.data.username || 'Interviewer');
                    setUserEmail(userRes.data.email || '');
                    setUserPhoto(userRes.data.profile_photo_url || null);
                }

                const meetingsRes = await axios.get(`${BACKEND_URL}/auth/meetings`, { withCredentials: true });
                setMeetings(meetingsRes.data || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateMeeting = async () => {
        setIsCreating(true);
        try {
            const res = await axios.post(`${BACKEND_URL}/auth/meetings`, {}, { withCredentials: true });
            if (res.data?.id) {
                navigate(`/interviewer/meeting/${res.data.id}/setup`);
            }
        } catch (err) {
            console.error('Failed to create meeting:', err);
            alert('Failed to create meeting. Please try again.');
            setIsCreating(false);
        }
    };

    const handleDeleteMeeting = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;
        try {
            await axios.delete(`${BACKEND_URL}/auth/meetings/${id}`, { withCredentials: true });
            setMeetings(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Failed to delete meeting:', err);
        }
    };

    const copyMeetingLink = (id: string) => {
        const link = `${window.location.origin}/auth/candidate/login?access_code=${id.toUpperCase()}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans">
            <InterviewerNavbar
                userName={userName}
                userEmail={userEmail}
                userPhoto={userPhoto}
            />

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900 mb-2">Welcome, {userName}</h1>
                        <p className="text-gray-500 font-light">Manage your scheduled interviews and view reports.</p>
                    </div>

                    <button
                        onClick={handleCreateMeeting}
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{isCreating ? 'Creating...' : 'New Meeting'}</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                ) : meetings.length === 0 ? (
                    /* Empty State - Clean Design */
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <SenseLogo className="text-blue-600 opacity-80" size={40} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                        <p className="text-gray-500 text-center max-w-sm mb-8">
                            Get started by creating a new meeting room for your upcoming interviews.
                        </p>
                        <button
                            onClick={handleCreateMeeting}
                            disabled={isCreating}
                            className="px-6 py-2.5 text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                        >
                            Create your first meeting
                        </button>
                    </div>
                ) : (
                    /* Meetings Grid - No wrapper card, direct grid of cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meetings.map((meeting) => (
                            <div key={meeting.id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                        <Video className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {meeting.active ? 'Active' : 'Finished'}
                                    </div>
                                </div>

                                <h3 className="text-xl font-mono font-medium text-gray-900 tracking-wider mb-2">{meeting.id.toUpperCase()}</h3>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {meeting.duration && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{meeting.duration} min</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => navigate(`/interviewer/meeting/${meeting.id}/setup`)}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                                        title="Configure"
                                    >
                                        <Cog className="w-4 h-4" /> Configure
                                    </button>

                                    <div className="w-px h-8 bg-gray-100"></div>

                                    <button
                                        onClick={() => copyMeetingLink(meeting.id)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${copiedId === meeting.id ? 'text-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                        title="Copy Link"
                                    >
                                        {copiedId === meeting.id ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                        {copiedId === meeting.id ? 'Copied' : 'Share'}
                                    </button>

                                    <div className="w-px h-8 bg-gray-100"></div>

                                    <button
                                        onClick={() => handleDeleteMeeting(meeting.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                                    className="w-full mt-3 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Join Room</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}