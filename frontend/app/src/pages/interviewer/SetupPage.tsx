import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { InterviewerNavbar } from '../../components/interviewer/InterviewerNavbar';
import { SenseLogo } from '../../components/icons/SenseIcons';
import {
    AlertTriangle, X,
    Video,
    Plus,
    Calendar,
    Trash2,
    Share2,
    ArrowRight,
    CheckCircle,
    Cog,
    Clock,
    TrendingUp,
    Mail,
    MessageCircle,
    Check
} from 'lucide-react';

interface Meeting {
    id: string;
    host_username: string;
    created_at: string;
    active: boolean;
    duration?: number;
    candidate_name?: string;
    candidate_profile_photo_url?: string;
    candidate_email?: string;
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
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create meeting modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [candidateEmail, setCandidateEmail] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    // Multi-select and share state
    const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
    const [shareDropdownId, setShareDropdownId] = useState<string | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

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
        if (!candidateEmail.trim()) {
            setCreateError('Please enter candidate email');
            return;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(candidateEmail)) {
            setCreateError('Please enter a valid email address');
            return;
        }

        setIsCreating(true);
        setCreateError(null);
        try {
            const res = await axios.post(`${BACKEND_URL}/auth/meetings`,
                { candidate_email: candidateEmail.toLowerCase() },
                { withCredentials: true }
            );
            if (res.data?.id) {
                setShowCreateModal(false);
                setCandidateEmail('');
                navigate(`/interviewer/meeting/${res.data.id}/setup`);
            }
        } catch (err: any) {
            console.error('Failed to create meeting:', err);
            setCreateError(err.response?.data?.detail || 'Failed to create meeting. Please try again.');
            setIsCreating(false);
        }
    };


    const handleDeleteMeeting = async (id: string) => {
        setIsDeleting(true);
        try {
            await axios.delete(`${BACKEND_URL}/auth/meetings/${id}`, { withCredentials: true });
            setMeetings(prev => prev.filter(m => m.id !== id));
            setDeleteModalId(null);
        } catch (err) {
            console.error('Failed to delete meeting:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const copyMeetingLink = (id: string) => {
        const link = `${window.location.origin}/auth/candidate/login?access_code=${id.toUpperCase()}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getMeetingLink = (id: string) => `${window.location.origin}/auth/candidate/login?access_code=${id.toUpperCase()}`;

    const shareOnWhatsApp = (id: string) => {
        const link = getMeetingLink(id);
        const message = `You are invited to an interview. Join here: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        setShareDropdownId(null);
    };

    const shareViaEmail = (meeting: Meeting) => {
        const link = getMeetingLink(meeting.id);
        const subject = 'Interview Invitation';
        const body = `You are invited to an interview.\n\nJoin here: ${link}`;
        const recipient = meeting.candidate_email || '';
        window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        setShareDropdownId(null);
    };

    const toggleMeetingSelection = (id: string) => {
        setSelectedMeetings(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedMeetings.size === 0) return;
        setIsDeleting(true);
        try {
            await axios.post(`${BACKEND_URL}/auth/meetings/delete`, {
                ids: Array.from(selectedMeetings)
            }, {
                withCredentials: true
            });
            setMeetings(prev => prev.filter(m => !selectedMeetings.has(m.id)));
            setSelectedMeetings(new Set());
        } catch (err) {
            console.error('Failed to delete meetings:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const allIds = meetings.map(m => m.id);
            await axios.post(`${BACKEND_URL}/auth/meetings/delete`, {
                ids: allIds
            }, {
                withCredentials: true
            });
            setMeetings([]);
            setSelectedMeetings(new Set());
            setShowDeleteAllModal(false);
        } catch (err) {
            console.error('Failed to delete all meetings:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans">
            {/* Delete Confirmation Modal */}
            {deleteModalId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Delete Meeting</h3>
                                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this meeting? This action cannot be undone.</p>
                            </div>
                            <button onClick={() => setDeleteModalId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setDeleteModalId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteMeeting(deleteModalId)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Confirmation Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Delete All Meetings</h3>
                                <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete all {meetings.length} meetings? This action cannot be undone.</p>
                            </div>
                            <button onClick={() => setShowDeleteAllModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Meeting Modal - Candidate Email */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
                                <p className="text-sm text-gray-500 mt-1">Enter the candidate's email address. They must be registered on Sense.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Email</label>
                            <input
                                type="email"
                                value={candidateEmail}
                                onChange={(e) => setCandidateEmail(e.target.value)}
                                placeholder="candidate@example.com"

                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                            {createError && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {createError}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMeeting}
                                disabled={isCreating}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isCreating ? 'Creating...' : 'Create Meeting'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <InterviewerNavbar
                userName={userName}
                userEmail={userEmail}
                userPhoto={userPhoto}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left side - Hero Section */}
                    <div className="w-full lg:w-1/3 lg:shrink-0">
                        <div className="lg:sticky lg:top-24 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                            <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 mb-3 sm:mb-4 leading-tight">
                                Smart Interviews for Everyone.
                            </h1>
                            <p className="text-gray-500 font-light mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                                Connect, collaborate, and gain insights with AI-powered video interviews. Accessible and secure for everyone.
                            </p>
                            <button
                                onClick={() => { setShowCreateModal(true); setCreateError(null); setCandidateEmail(''); }}
                                disabled={isCreating}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Video className="w-5 h-5" />
                                <span>{isCreating ? 'Creating...' : 'New Meeting'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right side - Meetings list */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                <p>Loading your dashboard...</p>
                            </div>
                        ) : meetings.length === 0 ? (
                            /* Empty State - Clean Design */
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                    <Calendar className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                                <p className="text-gray-500 text-center max-w-sm mb-8">
                                    Get started by creating a new meeting room for your upcoming interviews.
                                </p>
                                <button
                                    onClick={() => { setShowCreateModal(true); setCreateError(null); setCandidateEmail(''); }}
                                    disabled={isCreating}
                                    className="px-6 py-2.5 text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    Create your first meeting
                                </button>
                            </div>
                        ) : (
                            /* Meetings List - Google Material Design Style */
                            <div className="space-y-1">
                                {/* Bulk Action Bar */}
                                {selectedMeetings.size > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-700">
                                            {selectedMeetings.size} meeting{selectedMeetings.size > 1 ? 's' : ''} selected
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedMeetings(new Set())}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteSelected}
                                                disabled={isDeleting}
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Selected
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete All Button */}
                                {meetings.length > 1 && selectedMeetings.size === 0 && (
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() => setShowDeleteAllModal(true)}
                                            className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete All
                                        </button>
                                    </div>
                                )}

                                {meetings.map((meeting) => (
                                    <div
                                        key={meeting.id}
                                        className={`group bg-white border rounded-lg transition-all duration-200 ${selectedMeetings.has(meeting.id) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100'}`}
                                    >
                                        <div className="p-3 sm:p-4">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => toggleMeetingSelection(meeting.id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMeetings.has(meeting.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-500'}`}
                                                >
                                                    {selectedMeetings.has(meeting.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </button>

                                                {/* Avatar */}
                                                <div className="relative shrink-0">
                                                    <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 ${meeting.candidate_profile_photo_url ? '' : 'bg-gray-100'}`}>
                                                        {meeting.candidate_profile_photo_url ? (
                                                            <img
                                                                src={`${BACKEND_URL}${meeting.candidate_profile_photo_url}`}
                                                                alt={meeting.candidate_name || 'Candidate'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Video className={`w-5 h-5 ${meeting.active ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        )}
                                                    </div>
                                                    {meeting.active && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                                    )}
                                                </div>

                                                {/* Meeting Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                            {meeting.candidate_name || meeting.id.toUpperCase()}
                                                        </h3>
                                                        {!meeting.active && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                                Finished
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{new Date(meeting.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                        {meeting.duration && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{meeting.duration} min</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions - Grid for perfect alignment */}
                                                <div className="grid grid-cols-[40px_1px_40px_auto] items-center gap-1 shrink-0">
                                                    {/* Delete - Column 1 */}
                                                    <button
                                                        onClick={() => setDeleteModalId(meeting.id)}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Divider - Column 2 */}
                                                    <div className="w-px h-5 bg-gray-200" />

                                                    {/* Share - Column 3 */}
                                                    {meeting.active ? (
                                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                                            <button
                                                                onClick={() => setShareDropdownId(shareDropdownId === meeting.id ? null : meeting.id)}
                                                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Share"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                            {shareDropdownId === meeting.id && (
                                                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
                                                                    <button
                                                                        onClick={() => shareOnWhatsApp(meeting.id)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                                                        Share on WhatsApp
                                                                    </button>
                                                                    <button
                                                                        onClick={() => shareViaEmail(meeting)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <Mail className="w-4 h-4 text-blue-600" />
                                                                        Share via Email
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10" /> /* Placeholder for alignment */
                                                    )}

                                                    {/* Primary Action - Column 4 */}
                                                    {meeting.active ? (
                                                        <button
                                                            onClick={() => navigate(`/meeting/${meeting.id}`)}
                                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 justify-center min-w-[120px]"
                                                        >
                                                            Join
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/interviewer/report/${meeting.id}`)}
                                                            className="px-4 py-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 justify-center min-w-[120px]"
                                                        >
                                                            View Insights
                                                            <TrendingUp className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}