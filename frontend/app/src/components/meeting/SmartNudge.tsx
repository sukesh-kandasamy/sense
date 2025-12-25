import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartNudgeProps {
    nudge: string;
}

export function SmartNudge({ nudge }: SmartNudgeProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentNudge, setCurrentNudge] = useState('');

    useEffect(() => {
        if (nudge && nudge !== currentNudge) {
            setCurrentNudge(nudge);
            setIsVisible(true);

            // Auto-hide after 10 seconds
            const timer = setTimeout(() => setIsVisible(false), 10000);
            return () => clearTimeout(timer);
        } else if (!nudge) {
            setIsVisible(false);
        }
    }, [nudge, currentNudge]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 max-w-sm backdrop-blur-md border border-blue-500/50"
                >
                    <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div className="flex-1 mr-2">
                        <p className="font-semibold text-xs uppercase tracking-wider text-blue-100 mb-0.5">Smart Suggestion</p>
                        <p className="text-sm font-medium leading-snug">{currentNudge}</p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-blue-200 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
