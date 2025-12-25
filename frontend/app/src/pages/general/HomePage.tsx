import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Video, CheckCircle, BarChart2, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { SenseLogo } from '../../components/icons/SenseIcons';

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SenseLogo className="text-blue-600" size={32} />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Sense
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/auth/candidate/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            For Candidates
                        </Link>
                        <Link to="/signin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            Interviewer Login
                        </Link>
                        <Button onClick={() => navigate('/auth/candidate/login')}>
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Now supporting real-time emotion analysis
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8">
                            Master your interviews <br />
                            <span className="text-blue-600">with AI intelligence</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                            Sense analyzes your video interviews in real-time, providing actionable insights on confidence, emotion, and speech clarity.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate('/auth/candidate/login')}>
                                Start Mock Interview <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                                Watch Demo
                            </Button>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <Video className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Real-time Analysis</h3>
                                <p className="text-gray-600">
                                    Get instant feedback on your expressions and speech patterns during the interview.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                    <BarChart2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Detailed Reports</h3>
                                <p className="text-gray-600">
                                    Receive comprehensive performance reports with actionable tips for improvement.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                                <p className="text-gray-600">
                                    Your interview data is encrypted and processed securely. We prioritize your privacy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
                    <p>&copy; 2025 Sense AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}