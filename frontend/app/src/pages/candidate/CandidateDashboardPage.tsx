import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import {
    Calendar,
    Clock,
    Video,
    User,
    LogOut,
    ChevronRight,
    Briefcase,
    CheckCircle,
    AlertCircle,
    Settings,
    FileText,
    UploadCloud
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
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [showResumeAlert, setShowResumeAlert] = useState(false);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user info
                const userRes = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (userRes.data) {
                    setUserName(userRes.data.full_name || userRes.data.email?.split('@')[0] || 'Candidate');
                    setUserEmail(userRes.data.email || '');
                    setUserPhoto(userRes.data.profile_photo_url || null);
                    setResumeFilename(userRes.data.resume_filename || null);
                }

                // Fetch candidate's meetings
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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Skeleton */}
            <div className="w-64 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">
                <div className="flex items-center gap-2 mb-10">
                    <Video className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-bold">Sense</span>
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start"><Briefcase className="w-4 h-4 mr-2" /> Dashboard</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/candidate/settings')}><Settings className="w-4 h-4 mr-2" /> Settings</Button>
                </div>
                <div className="mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-600 hover:text-red-600 text-sm font-medium">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-700">{userName}</span>
                        {userPhoto ?
                            <img src={userPhoto} className="w-10 h-10 rounded-full" /> :
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{userName[0]}</div>
                        }
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Resume Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between mb-4">
                            <div className={`p-3 rounded-lg ${resumeFilename ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                <FileText className="w-6 h-6" />
                            </div>
                            {resumeFilename && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <h3 className="font-semibold mb-1">{resumeFilename ? 'Resume Uploaded' : 'Upload Resume'}</h3>
                        <p className="text-sm text-gray-500 mb-4 truncate">{resumeFilename || "Required to join interviews"}</p>
                        <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />
                        <Button
                            className="w-full"
                            variant={resumeFilename ? "outline" : "default"}
                            onClick={() => resumeInputRef.current?.click()}
                            disabled={isUploadingResume}
                        >
                            {isUploadingResume ? 'Uploading...' : (resumeFilename ? 'Update Resume' : 'Upload Now')}
                        </Button>
                    </div>

                    {/* Join Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">Join Interview</h3>
                            <p className="text-sm text-gray-500">Enter access code to join</p>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={() => {
                                if (!resumeFilename) {
                                    setShowResumeAlert(true);
                                    return;
                                }
                                setIsJoinModalOpen(true);
                            }}
                        >
                            Join Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Resume Required Modal */}
            <Dialog open={showResumeAlert} onOpenChange={setShowResumeAlert}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resume Required</DialogTitle>
                        <DialogDescription>Please upload your resume to proceed.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => { setShowResumeAlert(false); setTimeout(() => resumeInputRef.current?.click(), 100); }}>
                            Upload Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Join Modal - Skeleton */}
            <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Join Interview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <input
                            className="w-full border p-2 rounded"
                            placeholder="Enter Access Code"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                        />
                        <p className="text-xs text-red-500 mt-2">Note: Join logic needs full restoration from Git.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => navigate(`/meeting/${accessCode}`)}>Join (Simulated)</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
