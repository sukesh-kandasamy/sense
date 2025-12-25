import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, ArrowRight, Home } from 'lucide-react';

import { SenseLogo } from '../icons/SenseIcons';

interface CandidateLoginProps {
    onJoin: (code: string, name: string) => void;
    defaultCode?: string;
}

export function CandidateLogin({ onJoin, defaultCode = '' }: CandidateLoginProps) {
    const [code, setCode] = useState(defaultCode);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim().length !== 8) {
            setError('Please enter a valid 8-digit code.');
            return;
        }
        if (name.trim().length < 2) {
            setError('Please enter your full name.');
            return;
        }
        setError(null);
        onJoin(code.trim(), name.trim());
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans relative">
            <div className="w-full max-w-[448px] p-10 md:border md:border-[#dadce0] rounded-[8px] md:bg-white flex flex-col items-center shadow-sm">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2.5 mb-6">
                        <SenseLogo className="text-blue-600" size={64} />
                        <span className="text-2xl font-normal text-gray-800 tracking-tight">sense</span>
                    </div>
                    <h1 className="text-[24px] font-normal text-gray-900 mb-2 text-center">Join Interview</h1>
                    <p className="text-[16px] text-gray-600 text-center max-w-sm">
                        Enter your access code to verify your identity and join the session.
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="relative w-full">
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="peer block w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-transparent"
                            placeholder=" "
                            required
                        />
                        <label
                            htmlFor="name"
                            className="absolute left-3 bg-white px-2 text-gray-500 text-sm duration-300 transform rounded-sm z-10 origin-[0] top-2 -translate-y-4 scale-75 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-primary peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                        >
                            Your Full Name
                        </label>
                    </div>

                    <div className="relative w-full">
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="peer block w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-transparent uppercase tracking-widest font-mono"
                            placeholder=" "
                            autoCapitalize="characters"
                            required
                        />
                        <label
                            htmlFor="code"
                            className="absolute left-3 bg-white px-2 text-gray-500 text-sm duration-300 transform rounded-sm z-10 origin-[0] top-2 -translate-y-4 scale-75 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-primary peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100"
                        >
                            Enter 8-digit code
                        </label>
                        {error && <p className="text-xs text-red-500 mt-2 text-left ml-3">{error}</p>}
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                        >
                            Join Meeting <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
            <p className="mt-8 text-xs text-gray-400">
                Powered by Sense Interview Intelligence
            </p>
            <Link
                to="/"
                className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
            >
                <Home className="w-4 h-4" />
                Back to Home
            </Link>
        </div>
    );
}
