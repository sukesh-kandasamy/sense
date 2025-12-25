import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import {
    Video,
    Plus,
    Calendar,
    Trash2,
    LogOut,
    Settings,
    Share2,
    ArrowRight,
    CheckCircle,
    Cog
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
                // Navigate to meeting setup page after creation
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

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
        } catch (e) { }
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-white p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-gray-200 pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-normal text-gray-900 mb-1">Interviewer Dashboard</h1>
                        <p className="text-gray-500 text-sm">Manage your meetings and interviews.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {userPhoto ? (
                                <img src={userPhoto.startsWith('http') ? userPhoto : `${BACKEND_URL}${userPhoto}`} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            ) : (
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{userName}</p>
                                <p className="text-xs text-gray-500">{userEmail}</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/interviewer/settings')} className="p-2 text-gray-500 hover:text-gray-900 transition-colors" title="Settings">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Meetings Card */}
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-800">Your Meetings</h2>
                        <button
                            onClick={handleCreateMeeting}
                            disabled={isCreating}
                            className="py-2.5 px-5 rounded-full font-medium text-sm bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {isCreating ? 'Creating...' : 'New Meeting'}
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : meetings.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2">No meetings yet</h3>
                            <p className="text-gray-500 text-sm mb-6">Create your first meeting to get started.</p>
                            <button
                                onClick={handleCreateMeeting}
                                disabled={isCreating}
                                className="py-2.5 px-6 rounded-full font-medium text-sm bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create Meeting
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {meetings.map((meeting) => (
                                <div key={meeting.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 rounded-full text-primary">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 font-mono text-lg">{meeting.id.toUpperCase()}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(meeting.created_at).toLocaleDateString()}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${meeting.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {meeting.active ? 'Active' : 'Ended'}
                                                </span>
                                                {meeting.duration && (
                                                    <span className="text-xs text-gray-500">{meeting.duration} mins</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => copyMeetingLink(meeting.id)}
                                            className={`py-2 px-4 rounded-full font-medium text-sm border transition-colors flex items-center gap-2 ${copiedId === meeting.id
                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {copiedId === meeting.id ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                            {copiedId === meeting.id ? 'Copied!' : 'Share'}
                                        </button>
                                        <button
                                            onClick={() => navigate(`/interviewer/meeting/${meeting.id}/setup`)}
                                            className="py-2 px-4 rounded-full font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                            <Cog className="w-4 h-4" /> Configure
                                        </button>
                                        <button
                                            onClick={() => navigate(`/meeting/${meeting.id}`)}
                                            className="py-2 px-4 rounded-full font-medium text-sm bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            Join <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMeeting(meeting.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}