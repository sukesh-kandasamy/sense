import { Activity, Brain, AlertCircle, Lightbulb, Clock, AlertTriangle, Zap, Shield, HelpCircle } from 'lucide-react';
import { EmotionData } from '../../types';
import { motion } from 'motion/react';

interface EmotionDetectorProps {
  emotionData: EmotionData;
  connected?: boolean;
}

export function EmotionDetector({ emotionData, connected = true }: EmotionDetectorProps) {
  // --- 1. Determine System State ---
  // Standby: Connected but confidence is 0 (silence/no speech yet)
  // Live: Connected and confidence > 0
  // No Signal: Not connected
  let systemState: 'standby' | 'live' | 'no-signal' = 'standby';
  if (!connected) systemState = 'no-signal';
  else if (!emotionData || emotionData.confidence === 0) systemState = 'standby';
  else systemState = 'live';

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'nervous':
      case 'stressed': return 'text-orange-600 bg-orange-50';
      case 'confident':
      case 'engaged': return 'text-green-600 bg-green-50';
      case 'calm': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressBarColor = (emotion: string) => {
    switch (emotion) {
      case 'nervous':
      case 'stressed': return 'bg-orange-500';
      case 'confident':
      case 'engaged': return 'bg-green-500';
      case 'calm':
      case 'neutral': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  }

  // Ensure emotionData matches what we expect
  if (!emotionData) return null;

  return (
    <div className="h-full flex flex-col font-sans text-gray-800">

      {/* --- BANNER: System State Indicator --- */}
      <div className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b
        ${systemState === 'live' ? 'bg-green-50 border-green-100 text-green-800' : ''}
        ${systemState === 'standby' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' : ''}
        ${systemState === 'no-signal' ? 'bg-red-50 border-red-100 text-red-800' : ''}
      `}>
        {systemState === 'live' && (
          <>
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <div className="flex flex-col">
              <span>Live Analysis Active</span>
              <span className="text-xs font-normal opacity-80">Analyzing audio & facial cues...</span>
            </div>
          </>
        )}
        {systemState === 'standby' && (
          <>
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="flex flex-col">
              <span>Waiting for interview to start</span>
              <span className="text-xs font-normal opacity-80">Real-time insights appear when candidate speaks</span>
            </div>
          </>
        )}
        {systemState === 'no-signal' && (
          <>
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex flex-col">
              <span>No Signal / Paused</span>
              <span className="text-xs font-normal opacity-80">Check server connection</span>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 py-4 gap-6 overflow-hidden relative">

        {/* --- SECTION: Interviewer Insight (Guidance) --- */}
        <div className="flex-shrink-0 px-1">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 relative overflow-hidden">
            {/* Decorative Background Icon */}
            <Lightbulb className="absolute -right-2 -bottom-2 w-16 h-16 text-blue-100 rotate-12" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600 fill-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">Interviewer Insight</h4>
              </div>

              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                {systemState === 'standby'
                  ? "The interview has not started yet. Once the candidate begins speaking, real-time guidance will appear here."
                  : (emotionData.smart_nudge || "Listening for candidate responses...")
                }
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION: Metrics (Greyed out if Standby) --- */}
        <div className={`flex flex-col gap-6 transition-all duration-500 ${systemState === 'standby' ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}`}>

          {/* Dominant State */}
          <div className="flex-shrink-0 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dominant State</p>
                <div className="flex items-baseline gap-3">
                  <h2 className={`text-4xl font-bold capitalize tracking-tight ${getEmotionColor(emotionData.primary).split(' ')[0]}`}>
                    {emotionData.primary}
                  </h2>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">
                      {systemState === 'standby' ? '--' : `${emotionData.confidence.toFixed(0)}%`}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Confidence</span>
                  </div>
                </div>
              </div>

              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getEmotionColor(emotionData.primary).replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 text-')}`}>
                <Brain className="w-6 h-6 opacity-80" />
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="flex-1 overflow-y-auto px-1 scrollbar-hide">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Metrics</p>
            <div className="space-y-4">
              {emotionData.emotions && Object.entries(emotionData.emotions)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, value]) => (
                  <div key={emotion} className="group">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">{emotion}</span>
                      <span className="text-gray-500 tabular-nums">
                        {systemState === 'standby' ? '--' : `${(value * 100).toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getProgressBarColor(emotion)}`}
                        initial={{ width: 0 }}
                        animate={{ width: systemState === 'standby' ? '0%' : `${value * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Topic Tags - Optional add-on */}
            {emotionData.topic_tags && emotionData.topic_tags.length > 0 && systemState === 'live' && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Topics</p>
                <div className="flex flex-wrap gap-2">
                  {emotionData.topic_tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100/80 text-gray-600 text-[10px] font-medium rounded-md border border-gray-200">
                      {tag.topic} <span className="text-gray-400 ml-1">• {tag.confidence}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
