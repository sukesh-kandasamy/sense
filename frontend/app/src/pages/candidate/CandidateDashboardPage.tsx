import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import { SenseLogo } from '../../components/icons/SenseIcons';
import {
    Video,
    User,
    LogOut,
    Briefcase,
    CheckCircle,
    Settings,
    FileText,
    Upload,
    Clock,
    Calendar,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

interface Meeting {
    id: string;
    creator_username: string;
    candidate_email: string;
    created_at: string;
    active: boolean;
    duration?: number;
    interviewer_name?: string;
    interviewer_email?: string;
}

export function CandidateDashboardPage() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Candidate');
    const [userEmail, setUserEmail] = useState('');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);

    // Join Modal State
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    // Resume State
    const [resumeFilename, setResumeFilename] = useState<string | null>(null);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [showResumeAlert, setShowResumeAlert] = useState(false);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (userRes.data) {
                    setUserName(userRes.data.full_name || userRes.data.email?.split('@')[0] || 'Candidate');
                    setUserEmail(userRes.data.email || '');
                    setUserPhoto(userRes.data.profile_photo_url || null);
                    setResumeFilename(userRes.data.resume_filename || null);
                    setResumeUrl(userRes.data.resume_url || null);
                }

                try {
                    const meetingsRes = await axios.get(`${BACKEND_URL}/auth/candidate/meetings`, { withCredentials: true });
                    setMeetings(meetingsRes.data || []);
                } catch (e) {
                    console.log('Meetings endpoint not available yet');
                    setMeetings([]);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
        } catch (e) {
            console.error('Logout error:', e);
        }
        localStorage.clear();
        navigate('/');
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingResume(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(`${BACKEND_URL}/auth/users/me/resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setResumeFilename(res.data.filename);
        } catch (err: any) {
            console.error(err);
            setUploadError(err.response?.data?.detail || "Failed to upload resume.");
        } finally {
            setIsUploadingResume(false);
            if (resumeInputRef.current) resumeInputRef.current.value = '';
        }
    };

    const handleJoinMeeting = async () => {
        if (!accessCode.trim()) {
            setJoinError('Please enter a meeting code');
            return;
        }
        setIsJoining(true);
        setJoinError(null);
        try {
            // Verify meeting exists
            await axios.get(`${BACKEND_URL}/auth/meetings/${accessCode.toLowerCase()}`, { withCredentials: true });
            navigate(`/candidate/meeting/${accessCode.toLowerCase()}`);
        } catch (err: any) {
            setJoinError(err.response?.data?.detail || 'Invalid meeting code');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 flex items-center justify-between mb-8 shadow-sm">
                <div className="flex items-center gap-3">
                    <SenseLogo className="text-blue-600" size={32} />
                    <span className="text-xl font-normal text-gray-900 tracking-tight">sense</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="font-medium text-gray-900 text-sm">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                        </div>
                        {userPhoto ? (
                            <img src={userPhoto.startsWith('http') ? userPhoto : `${BACKEND_URL}${userPhoto}`} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/candidate/settings')}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
                        title="Account Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="h-8 w-px bg-gray-200"></div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile & Resume */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Resume Card */}
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-800">Your Resume</h2>
                            </div>
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${resumeFilename ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-gray-900">
                                                {resumeFilename ? 'Resume Uploaded' : 'No Resume Uploaded'}
                                            </h3>
                                            {resumeFilename && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {resumeFilename || 'Upload your resume to apply for interviews'}
                                        </p>
                                        <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />

                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={() => resumeInputRef.current?.click()}
                                                disabled={isUploadingResume}
                                                className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-lg font-medium text-sm transition-all ${resumeFilename
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                    } ${isUploadingResume ? 'opacity-80 cursor-not-allowed' : ''}`}
                                            >
                                                {isUploadingResume ? (
                                                    <>
                                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        <span className="relative">
                                                            Uploading
                                                            <span className="animate-pulse">...</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        {resumeFilename ? 'Update' : 'Upload Resume'}
                                                    </>
                                                )}
                                            </button>

                                            {resumeUrl && (
                                                <a
                                                    href={resumeUrl.startsWith('http') ? resumeUrl : `${BACKEND_URL}${resumeUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg font-medium text-sm transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Resume
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scheduled Interviews Card */}
                        {meetings.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                                    <h2 className="text-lg font-medium text-blue-800 flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Scheduled Interviews
                                    </h2>
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        {meetings.length} pending
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {meetings.map((meeting) => (
                                        <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                                            {meeting.id.toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Scheduled by <span className="font-medium">{meeting.interviewer_name || meeting.creator_username}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(meeting.created_at).toLocaleDateString()} at {new Date(meeting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/candidate/meeting/${meeting.id}`)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                >
                                                    Join <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column - Join Interview */}
                    <div className="space-y-6">
                        {/* Join Interview Card */}
                        <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2">
                                    <SenseLogo className="text-blue-600" size={24} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800">Join Interview</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">Enter your meeting code to join an interview session.</p>

                            <button
                                onClick={() => {
                                    if (!resumeFilename) {
                                        setShowResumeAlert(true);
                                        return;
                                    }
                                    setIsJoinModalOpen(true);
                                }}
                                className="w-full py-3.5 rounded-lg font-medium transition-all shadow-md bg-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                            >
                                Join Now <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>


                    </div>
                </div>
            </div>

            {/* Resume Required Modal */}
            <Dialog open={showResumeAlert} onOpenChange={setShowResumeAlert}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resume Required</DialogTitle>
                        <DialogDescription>Please upload your resume before joining an interview.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => { setShowResumeAlert(false); setTimeout(() => resumeInputRef.current?.click(), 100); }}>
                            Upload Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Join Modal */}
            <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Join Interview</DialogTitle>
                        <DialogDescription>Enter the 8-character meeting code provided by your interviewer.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <input
                            className="w-full border border-gray-300 p-3 rounded-lg text-center uppercase tracking-widest font-mono text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            placeholder="ABCD1234"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                            maxLength={8}
                        />
                        {joinError && <p className="text-sm text-red-500 text-center">{joinError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsJoinModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleJoinMeeting} disabled={isJoining}>
                            {isJoining ? 'Joining...' : 'Join Meeting'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Error Modal */}
            {uploadError && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Upload Failed
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-gray-700">{uploadError}</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setUploadError(null)}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
