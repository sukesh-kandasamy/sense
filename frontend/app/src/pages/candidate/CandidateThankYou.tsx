import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CandidateThankYou() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-red-500 to-green-500"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full text-center space-y-8 relative z-10"
            >
                {/* Success Icon */}
                <div className="relative inline-block">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
                        </div>
                    </motion.div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-normal text-gray-900 tracking-tight">
                        You're all set!
                    </h1>
                    <p className="text-lg text-gray-500 max-w-sm mx-auto leading-relaxed">
                        Thank you for completing the interview. Your responses have been successfully recorded and submitted.
                    </p>
                </div>

                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-sm mx-auto"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Submission Confirmed</h3>
                            <p className="text-sm text-gray-500 mt-1">We've notified the hiring team.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-8"
                >
                    <button
                        onClick={() => window.location.href = '/'}
                        className="group inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors px-6 py-3 rounded-full hover:bg-blue-50"
                    >
                        Return to Home
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="mt-8 text-sm text-gray-400">
                        You can safely close this window now.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
