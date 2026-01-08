import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../config';
import { Button } from '../../components/ui/button';
import { ImageCropModal } from '../../components/ui/ImageCropModal';
import {
    ArrowLeft, User, Mail, Camera, Save, Loader2, Lock, Eye, EyeOff, Monitor, Cloud
} from 'lucide-react';

export function SettingsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Analysis mode state
    const [analysisMode, setAnalysisMode] = useState<'local' | 'cloud'>('cloud');

    // Photo crop state
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedPhotoSrc, setSelectedPhotoSrc] = useState<string | null>(null);
    const [showPhotoPreview, setShowPhotoPreview] = useState(false);
    const photoInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (res.data) {
                    setFullName(res.data.full_name || '');
                    setEmail(res.data.email || res.data.username || '');
                    setProfilePhoto(res.data.profile_photo_url || null);
                    setAnalysisMode(res.data.analysis_mode || 'cloud');
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
            await axios.put(`${BACKEND_URL}/auth/users/me`, {
                full_name: fullName,
            }, { withCredentials: true });
            toast.success('Settings saved!');
        } catch (err) {
            console.error('Failed to save:', err);
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalysisModeChange = async (mode: 'local' | 'cloud') => {
        setAnalysisMode(mode);
        try {
            await axios.put(`${BACKEND_URL}/auth/users/me`, {
                analysis_mode: mode
            }, { withCredentials: true });
        } catch (err) {
            console.error('Failed to save analysis mode:', err);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError(null);

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await axios.post(`${BACKEND_URL}/auth/change-password`, {
                old_password: oldPassword,
                new_password: newPassword
            }, { withCredentials: true });
            toast.success('Password changed successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordSection(false);
        } catch (err: any) {
            setPasswordError(err.response?.data?.detail || 'Failed to change password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedPhotoSrc(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
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
            toast.error('Failed to upload photo.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Actions - No Navbar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/interviewer/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Profile Photo */}
                    <div className="p-6 border-b border-gray-100 flex items-center gap-6">
                        <div className="relative">
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto.startsWith('http') ? profilePhoto : `${BACKEND_URL}${profilePhoto}`}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-200"
                                    onClick={() => setShowPhotoPreview(true)}
                                />
                            ) : (
                                <div
                                    className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold cursor-pointer hover:bg-blue-200 transition-colors"
                                    onClick={() => photoInputRef.current?.click()}
                                >
                                    {fullName ? fullName[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                            </label>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{fullName || 'Your Name'}</h2>
                            <p className="text-sm text-gray-500">{email}</p>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis Mode Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Analysis Mode</h3>
                                <p className="text-sm text-gray-500 mt-1">Choose how interview analysis is processed.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => handleAnalysisModeChange('local')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === 'local'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Monitor className="w-4 h-4" />
                                    Local
                                </button>
                                <button
                                    onClick={() => handleAnalysisModeChange('cloud')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${analysisMode === 'cloud'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Cloud className="w-4 h-4" />
                                    Cloud
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                                <p className="text-sm text-gray-500">Update your account password.</p>
                            </div>
                            {!showPasswordSection && (
                                <Button variant="outline" onClick={() => setShowPasswordSection(true)}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Button>
                            )}
                        </div>

                        {showPasswordSection && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-red-500">{passwordError}</p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                                        {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Update Password
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        setShowPasswordSection(false);
                                        setOldPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setPasswordError(null);
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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