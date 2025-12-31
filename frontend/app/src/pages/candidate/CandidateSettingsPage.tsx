import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { ImageCropModal } from '../../components/ui/ImageCropModal';
import {
    Video,
    User,
    Mail,
    Camera,
    Save,
    ArrowLeft,
    FileText,
    Upload,
    CheckCircle,
    Loader2
} from 'lucide-react';

export function CandidateSettingsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [resumeFilename, setResumeFilename] = useState<string | null>(null);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Photo crop state
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedPhotoSrc, setSelectedPhotoSrc] = useState<string | null>(null);
    const [showPhotoPreview, setShowPhotoPreview] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (res.data) {
                    setFullName(res.data.full_name || '');
                    setEmail(res.data.email || res.data.username || '');
                    setProfilePhoto(res.data.profile_photo_url || null);
                    setResumeFilename(res.data.resume_filename || null);
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`${BACKEND_URL}/auth/users/me`, { full_name: fullName }, { withCredentials: true });
            alert('Settings saved!');
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a URL for the selected image to show in crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedPhotoSrc(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    const handleCroppedPhotoUpload = async (croppedBlob: Blob) => {
        setShowCropModal(false);
        setSelectedPhotoSrc(null);

        const formData = new FormData();
        formData.append('file', croppedBlob, 'profile.jpg');

        try {
            const res = await axios.post(`${BACKEND_URL}/auth/users/me/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            setProfilePhoto(res.data.profile_photo_url);
        } catch (err) {
            console.error('Photo upload failed:', err);
            alert('Failed to upload photo.');
        }
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-gray-200 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/candidate/dashboard')} className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-normal text-gray-900 mb-1">Account Settings</h1>
                            <p className="text-gray-500 text-sm">Manage your profile and preferences.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="py-2.5 px-6 rounded-lg font-medium text-sm bg-primary text-white hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Photo */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-300 p-6">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">Profile Photo</h2>
                            <div className="flex flex-col items-center">
                                <div className="relative mb-4">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto.startsWith('http') ? profilePhoto : `${BACKEND_URL}${profilePhoto}`}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-200"
                                            onClick={() => setShowPhotoPreview(true)}
                                        />
                                    ) : (
                                        <div
                                            className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold cursor-pointer hover:bg-blue-200 transition-colors"
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                            {fullName ? fullName[0].toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <input type="file" ref={photoInputRef} onChange={handlePhotoSelect} className="hidden" accept="image/*" />
                                </div>
                                <p className="text-sm text-gray-500 text-center mb-4">Click photo to view, or camera icon to change</p>

                                <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 py-2 px-3 rounded-full text-sm font-medium border border-gray-100">
                                    <Mail className="w-4 h-4" />
                                    <span>{email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Info */}
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-800">Personal Information</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                                        placeholder="Enter your full name"
                                    />
                                </div>


                            </div>
                        </div>

                        {/* Resume */}
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-800">Resume</h2>
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
                                            {resumeFilename || 'Upload your resume for interviews'}
                                        </p>
                                        <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />
                                        <button
                                            onClick={() => resumeInputRef.current?.click()}
                                            disabled={isUploadingResume}
                                            className={`py-2.5 px-6 rounded-lg font-medium text-sm transition-colors border inline-flex items-center gap-2 ${resumeFilename
                                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                : 'bg-primary text-white border-transparent hover:bg-blue-600 shadow-sm'
                                                } ${isUploadingResume ? 'opacity-80 cursor-not-allowed' : ''}`}
                                        >
                                            {isUploadingResume ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Uploading<span className="animate-pulse">...</span></span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4" />
                                                    {resumeFilename ? 'Update Resume' : 'Upload Resume'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
            {/* Image Crop Modal */}
            {showCropModal && selectedPhotoSrc && (
                <ImageCropModal
                    imageSrc={selectedPhotoSrc}
                    onClose={() => {
                        setShowCropModal(false);
                        setSelectedPhotoSrc(null);
                    }}
                    onCropComplete={handleCroppedPhotoUpload}
                />
            )}

            {/* Photo Preview Modal */}
            {showPhotoPreview && profilePhoto && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoPreview(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                            <button
                                onClick={() => setShowPhotoPreview(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 flex justify-center bg-gray-50">
                            <img
                                src={profilePhoto.startsWith('http') ? profilePhoto : `${BACKEND_URL}${profilePhoto}`}
                                alt="Profile"
                                className="w-48 h-48 rounded-full object-cover shadow-lg"
                            />
                        </div>
                        <div className="p-4 flex justify-center border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowPhotoPreview(false);
                                    photoInputRef.current?.click();
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Change Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}