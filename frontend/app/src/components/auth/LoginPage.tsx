import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Video, Eye, EyeOff, Home } from 'lucide-react';
import { SenseLogo } from '../icons/SenseIcons';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function LoginPage({ onLogin, isLoading = false }: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (email.trim() && password.trim()) {
        await onLogin(email.trim(), password.trim());
      }
    } catch (err: any) {
      // Show backend error message if available
      const errorMessage = err.response?.data?.detail || "Invalid credentials. Please try again.";
      setError(typeof errorMessage === 'string' ? errorMessage : "Invalid credentials. Please try again.");
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


      <div className="w-full max-w-[448px] p-10 md:border md:border-[#dadce0] rounded-[8px] md:bg-white flex flex-col items-center shadow-sm">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <SenseLogo className="text-blue-600" size={64} />
          </div>
          <h1 className="text-[24px] font-normal text-gray-900 mb-3 text-center">Interviewer Login</h1>
          <p className="text-[16px] text-gray-600 text-center max-w-sm">Sign in to manage interviews and access candidate insights.</p>
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

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-full transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
