import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import {
    LogOut,
    Settings,
} from 'lucide-react';
import { SenseLogo } from '../icons/SenseIcons';

interface InterviewerNavbarProps {
    userName: string;
    userEmail: string;
    userPhoto: string | null;
}

export function InterviewerNavbar({ userName, userEmail, userPhoto }: InterviewerNavbarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
        } catch (e) { }
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <div onClick={() => navigate('/interviewer/dashboard')} className="flex items-center gap-2 cursor-pointer group">
                    <div className="p-2">
                        <SenseLogo className="text-blue-600" size={32} />
                    </div>
                    <span className="text-xl font-normal text-gray-900 tracking-tight">sense</span>
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="font-medium text-gray-900 text-sm">{userName}</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                        </div>
                        {userPhoto ? (
                            <img
                                src={userPhoto.startsWith('http') ? userPhoto : `${BACKEND_URL}${userPhoto}`}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                alt={userName}
                            />
                        ) : (
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/interviewer/settings')}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
