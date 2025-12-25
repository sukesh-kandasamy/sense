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
    title: string;
    scheduled_date: string;
    scheduled_time: string;
    duration: number;
    status: 'scheduled' | 'completed' | 'cancelled';
    interviewer_name?: string;
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
            alert(err.response?.data?.detail || "Failed to upload resume.");
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
            navigate(`/meeting/${accessCode.toLowerCase()}`);
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
                    <span className="text-xl font-semibold text-gray-900 tracking-tight">Sense</span>
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
                                                className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-full font-medium text-sm transition-all ${resumeFilename
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                    }`}
                                            >
                                                <Upload className="w-4 h-4" />
                                                {isUploadingResume ? 'Uploading...' : (resumeFilename ? 'Update' : 'Upload Resume')}
                                            </button>

                                            {resumeUrl && (
                                                <a
                                                    href={resumeUrl.startsWith('http') ? resumeUrl : `${BACKEND_URL}${resumeUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full font-medium text-sm transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
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


                    </div>

                    {/* Right Column - Join Interview */}
                    <div className="space-y-6">
                        {/* Join Interview Card */}
                        <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 transition-transform transform hover:scale-105">
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
                                className="w-full py-3.5 rounded-full font-medium transition-all shadow-md bg-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2"
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
        </div>
    );
}
