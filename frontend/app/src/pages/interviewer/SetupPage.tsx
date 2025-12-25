import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { Button } from '../../components/ui/button';
import {
    Video, Plus, Calendar, Clock, User, Trash2, Copy, LogOut, Settings, ExternalLink, Share2
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
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user info
                const userRes = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (userRes.data) {
                    setUserName(userRes.data.full_name || userRes.data.username || 'Interviewer');
                }

                // Fetch meetings
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
                setMeetings(prev => [res.data, ...prev]);
            }
        } catch (err) {
            console.error('Failed to create meeting:', err);
            alert('Failed to create meeting. Please try again.');
        } finally {
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
        alert('Meeting link copied!');
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
        } catch (e) { }
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">
                <div className="flex items-center gap-2 mb-10">
                    <Video className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-bold">Sense</span>
                </div>
                <nav className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start font-medium">
                        <Calendar className="w-4 h-4 mr-2" /> Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start text-gray-600" onClick={() => navigate('/interviewer/settings')}>
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                </nav>
                <div className="mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-600 hover:text-red-600 text-sm font-medium">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h1>
                        <p className="text-gray-500">Manage your interviews and meetings.</p>
                    </div>
                    <Button onClick={handleCreateMeeting} disabled={isCreating}>
                        <Plus className="w-4 h-4 mr-2" />
                        {isCreating ? 'Creating...' : 'New Meeting'}
                    </Button>
                </div>

                {/* Meetings List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-lg text-gray-800">Your Meetings</h2>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : meetings.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-2">No meetings yet</h3>
                            <p className="text-gray-500 text-sm mb-6">Create your first meeting to get started.</p>
                            <Button onClick={handleCreateMeeting} disabled={isCreating}>
                                <Plus className="w-4 h-4 mr-2" /> Create Meeting
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {meetings.map((meeting) => (
                                <div key={meeting.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <Video className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 font-mono">{meeting.id.toUpperCase()}</p>
                                            <p className="text-xs text-gray-500">Created {new Date(meeting.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => copyMeetingLink(meeting.id)}>
                                            <Share2 className="w-4 h-4 mr-1" /> Share
                                        </Button>
                                        <Button size="sm" onClick={() => navigate(`/meeting/${meeting.id}`)}>
                                            <ExternalLink className="w-4 h-4 mr-1" /> Join
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMeeting(meeting.id)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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