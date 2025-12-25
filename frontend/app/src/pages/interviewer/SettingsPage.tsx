import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { BACKEND_URL } from '../../config';
import { Button } from '../../components/ui/button';
import {
    Video, ArrowLeft, User, Mail, Lock, Camera, Save, Loader2
} from 'lucide-react';

export function SettingsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (res.data) {
                    setFullName(res.data.full_name || '');
                    setEmail(res.data.email || res.data.username || '');
                    setProfilePhoto(res.data.profile_photo_url || null);
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/interviewer/dashboard')} className="text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Video className="w-6 h-6 text-blue-600" />
                            <span className="text-lg font-semibold">Settings</span>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Profile Photo */}
                    <div className="p-6 border-b border-gray-100 flex items-center gap-6">
                        <div className="relative">
                            {profilePhoto ? (
                                <img src={profilePhoto.startsWith('/') ? `${BACKEND_URL}${profilePhoto}` : profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                    {fullName ? fullName[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md cursor-pointer border border-gray-200 hover:bg-gray-50">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}