
import { Activity, Brain, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import { EmotionData } from '../../types';
import { motion } from 'motion/react';

interface EmotionDetectorProps {
  emotionData: EmotionData;
  connected?: boolean;
}

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😔',
  angry: '😠',
  fear: '😱',
  surprise: '😲',
  disgust: '🤢',
  neutral: '😐',
  confident: '🤠',
  nervous: '😰',
  enthusiastic: '🤩',
  calm: '😌',
  stressed: '😫',
  hesitant: '🤔',
  focused: '🧐'
};

export function EmotionDetector({ emotionData, connected = true }: EmotionDetectorProps) {
  // System State Determination
  let systemState: 'standby' | 'live' | 'no-signal' = 'standby';
  if (!connected) systemState = 'no-signal';
  else if (!emotionData || (!emotionData.dominant_emotion && !emotionData.primary) || emotionData.confident_meter === 0) systemState = 'standby';
  else systemState = 'live';

  // Fallback for backward compatibility
  const dominant = emotionData.dominant_emotion || emotionData.primary || 'neutral';
  const confidence = emotionData.confident_meter ?? emotionData.confidence ?? 0;
  // If emotion_meter is empty, try to use old emotions object, or empty
  const emotionMeter = (emotionData.emotion_meter && Object.keys(emotionData.emotion_meter).length > 0)
    ? emotionData.emotion_meter
    : (emotionData.emotions || {});

  const getEmoji = (emotion: string) => EMOTION_EMOJIS[emotion.toLowerCase()] || '😐';

  const getProgressBarColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'nervous':
      case 'anxiety':
      case 'fear':
      case 'stress': return 'bg-orange-500';
      case 'confident':
      case 'determination':
      case 'excitement':
      case 'happy': return 'bg-green-500';
      case 'neutral':
      case 'calm':
      case 'relief': return 'bg-blue-500';
      case 'sad':
      case 'self-doubt': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

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
              <span className="text-xs font-normal opacity-80">Detecting emotional shifts...</span>
            </div>
          </>
        )}
        {systemState === 'standby' && (
          <>
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="flex flex-col">
              <span>Waiting for speech</span>
              <span className="text-xs font-normal opacity-80">Insights appear when candidate speaks</span>
            </div>
          </>
        )}
        {systemState === 'no-signal' && (
          <>
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex flex-col">
              <span>No Signal</span>
              <span className="text-xs font-normal opacity-80">Analysis paused</span>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 py-4 gap-6 overflow-hidden relative px-4">

        {/* --- 1. DOMINANT EMOTION (Hero) --- */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dominant Emotion</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold capitalize text-gray-900 leading-none">
                {dominant}
              </h2>
            </div>
          </div>
          <div className="text-5xl filter drop-shadow-sm transition-transform hover:scale-110 cursor-default">
            {getEmoji(dominant)}
          </div>
        </div>

        {/* --- 2. CONFIDENT METER --- */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confident Meter</p>
            <span className="text-sm font-bold text-gray-900">{systemState === 'standby' ? '--' : confidence}%</span>
          </div>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">Voice & Expression Confidence</p>
        </div>

        {/* --- 3. EMOTION METER (Breakdown) --- */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white z-10 py-1">Emotion Meter</p>
          <div className="space-y-3">
            {Object.entries(emotionMeter)
              .sort(([, a], [, b]) => b - a) // Sort by value desc
              .map(([emotion, value]) => (
                <div key={emotion}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 capitalize">{emotion}</span>
                    <span className="text-gray-500 tabular-nums">{value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getProgressBarColor(emotion)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>



      </div>
    </div>
  );
}
