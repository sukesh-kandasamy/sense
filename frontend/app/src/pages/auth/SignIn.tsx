import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../../components/auth/LoginPage';
import { BACKEND_URL } from '../../config';

export function SignIn() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', pass);

            // Cookie-based auth via /auth/login
            await axios.post(`${BACKEND_URL}/auth/login`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                withCredentials: true // Important for cookies
            });

            localStorage.setItem('role', 'interviewer');
            navigate('/interviewer/dashboard');

        } catch (err: any) {
            console.error('Login error:', err);
            // Re-throw to let LoginPage handle error
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return <LoginPage onLogin={handleLogin} isLoading={isLoading} />;
}