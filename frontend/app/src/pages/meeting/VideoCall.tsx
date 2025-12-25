import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import { InterviewRoom } from '../../components/meeting/InterviewRoom';
import { Loader2 } from 'lucide-react';

export function VideoCall() {
    const { roomId } = useParams<{ roomId: string }>();
    const [userRole, setUserRole] = useState<'interviewer' | 'candidate' | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (res.data) {
                    // Determine role from localStorage or response
                    const storedRole = localStorage.getItem('role') as 'interviewer' | 'candidate';
                    setUserRole(storedRole || (res.data.role === 'candidate' ? 'candidate' : 'interviewer'));
                    setUserName(res.data.full_name || res.data.username || 'User');
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
                setError('Authentication required. Please log in.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading meeting room...</p>
                </div>
            </div>
        );
    }

    if (error || !userRole || !roomId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to Join</h2>
                    <p className="text-gray-600">{error || 'Invalid meeting room or session.'}</p>
                </div>
            </div>
        );
    }

    return (
        <InterviewRoom
            userRole={userRole}
            userName={userName}
            roomId={roomId}
        />
    );
}