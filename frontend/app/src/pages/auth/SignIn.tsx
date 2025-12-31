import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LoginPage } from '../../components/auth/LoginPage';
import { CandidateLogin } from '../../components/auth/CandidateLogin';
import { BACKEND_URL } from '../../config';
import { SenseLogo } from '../../components/icons/SenseIcons';
import { User, Briefcase, ArrowRight } from 'lucide-react';

export function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const persona = searchParams.get('p'); // 'interviewer' or 'candidate'
    const [isLoading, setIsLoading] = useState(false);

    // Interviewer login handler
    const handleInterviewerLogin = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', pass);

            await axios.post(`${BACKEND_URL}/auth/login`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                withCredentials: true
            });

            localStorage.setItem('role', 'interviewer');
            navigate('/interviewer/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };


    // Candidate login handler (email/password)
    const handleCandidateLogin = async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        await axios.post(`${BACKEND_URL}/auth/login`, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            withCredentials: true
        });

        localStorage.setItem('role', 'candidate');
        navigate('/candidate/dashboard');
    };

    // No persona selected - show role selection
    if (!persona) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg border border-gray-100">
                    <div className="flex items-center justify-center mb-8">
                        <SenseLogo className="text-blue-600" size={48} />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Welcome to Sense</h1>
                    <p className="text-gray-500 text-center mb-10">Tell us who you are to get started</p>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/auth/signin?p=interviewer')}
                            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-gray-900">I'm an Interviewer</p>
                                <p className="text-sm text-gray-500">Create and manage interview sessions</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>

                        <button
                            onClick={() => navigate('/auth/signin?p=candidate')}
                            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                        >
                            <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-gray-900">I'm a Candidate</p>
                                <p className="text-sm text-gray-500">Join an interview with a code</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // Interviewer login
    if (persona === 'interviewer') {
        return <LoginPage onLogin={handleInterviewerLogin} isLoading={isLoading} />;
    }

    // Candidate login
    if (persona === 'candidate') {
        return <CandidateLogin onLogin={handleCandidateLogin} />;
    }

    // Fallback
    return null;
}