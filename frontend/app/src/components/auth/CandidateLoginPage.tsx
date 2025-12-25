import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Home, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import { BACKEND_URL } from '../../config';

interface CandidateLoginPageProps {
    onLogin?: (email: string, password: string) => void;
}

export function CandidateLoginPage({ onLogin }: CandidateLoginPageProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const passwordParam = searchParams.get('password');
        if (emailParam) setEmail(emailParam);
        if (passwordParam) setPassword(passwordParam);
    }, [searchParams]);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Using URLSearchParams because OAuth2PasswordRequestForm expects form-data
            const params = new URLSearchParams();
            params.append('username', email.trim());
            params.append('password', password.trim());

            await axios.post(
                `${BACKEND_URL}/auth/login`,
                params,
                { withCredentials: true }
            );

            // Fetch user info to get role
            const userRes = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
            const userRole = userRes.data?.role || 'candidate';

            // Strict Role Check
            if (userRole !== 'candidate') {
                // Logout the mismatched user immediately
                await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
                setError("You are an Interviewer. Please login from the Interviewer page.");
                // Optional: Automatically redirect after a delay or let them click
                // For now, just show error. Or better, redirect to interviewer login?
                // Let's redirect to interviewer login with a message? 
                // Simple error is safer for now to avoid confusion.
                return;
            }

            // Store role and name
            localStorage.setItem('role', userRole);
            localStorage.setItem('userName', userRes.data?.full_name || email.split('@')[0]);

            // Navigate to candidate dashboard
            navigate('/candidate/dashboard');

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans relative">
            {/* Error Toast */}
            {error && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200 shadow-md animate-in fade-in slide-in-from-top-4 z-50 max-w-sm w-full">
                    <div className="bg-red-100 p-1 rounded-full shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    </div>
                    <div className="flex-1 text-sm">{error}</div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                    </button>
                </div>
            )}

            {/* Home Link - Top */}
            <Link
                to="/"
                className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
            >
                <Home className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="w-full max-w-[448px] p-10 md:border md:border-[#dadce0] rounded-[8px] md:bg-white flex flex-col items-center shadow-sm">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2.5 mb-6">
                        <img src="/logo.svg" alt="Sense Logo" className="w-16 h-16 rounded-xl" />
                        <span className="text-2xl font-normal text-gray-800 tracking-tight">sense</span>
                    </div>
                    <h1 className="text-[24px] font-normal text-gray-900 mb-3 text-center">Candidate Login</h1>
                    <p className="text-[16px] text-gray-600 text-center max-w-sm">
                        Sign in to access your interview dashboard and scheduled sessions.
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="relative group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block w-full px-3 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary peer transition-shadow"
                            placeholder=" "
                        />
                        <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 rounded-sm">
                            Email
                        </label>
                    </div>

                    <div className="relative group">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="block w-full px-3 py-3 text-base text-gray-900 bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary peer transition-shadow"
                            placeholder=" "
                        />
                        <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 rounded-sm">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
