import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CandidateLogin } from '../../components/auth/CandidateLogin';
import { BACKEND_URL } from '../../config';

export function CandidateSignIn() {
    const navigate = useNavigate();

    const handleJoin = async (code: string, name: string) => {
        try {
            // Login with code
            await axios.post(`${BACKEND_URL}/auth/candidate-login`, { code }, { withCredentials: true });

            // Update name (since login only uses code)
            await axios.put(`${BACKEND_URL}/auth/users/me`, { full_name: name }, { withCredentials: true });

            navigate('/candidate/dashboard');
        } catch (err: any) {
            console.error('Join error:', err);
            alert(err.response?.data?.detail || "Failed to join session. Please check your code.");
        }
    };

    return <CandidateLogin onJoin={handleJoin} />;
}