import { useEffect, useRef } from 'react';
import { User, Tag } from 'lucide-react';
import { EmotionData } from '../../types';

interface VideoPanelProps {
  role: 'interviewer' | 'candidate';
  name: string;
  isCameraOn: boolean;
  isMicOn: boolean;
  isMain: boolean;
  stream?: MediaStream | null;
  muted?: boolean;
  isMirrored?: boolean; // New prop for mirroring local video
  statusMessage?: string;
  showName?: boolean; // New prop to control name overlay visibility
  emotionData?: EmotionData; // New: Emotion data for Pulse and Tags
}

export function VideoPanel({ role, name, isCameraOn, isMicOn, isMain, stream, muted = false, isMirrored = false, statusMessage, showName = true, emotionData }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Determine Pulse Color
  const getPulseColor = () => {
    if (!emotionData || !stream) return '';
    const { primary, confidence } = emotionData;
    // Green = Good Flow (Confident, Engaged, Calm)
    if (['confident', 'engaged', 'calm'].includes(primary)) {
      return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
    }
    // Amber = Hesitation (Nervous, Stressed)
    if (['nervous', 'stressed'].includes(primary)) {
      return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    }
    return 'border-transparent';
  };

  return (
    <div className={`bg-black overflow-hidden relative group transition-all duration-500 ${isMain ? 'h-full w-full' : 'absolute inset-0'} border-[3px] ${getPulseColor()}`}>
      <div className="relative w-full h-full">
        {/* Video Area */}
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
          {stream && isCameraOn ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted} // Local video (waiting state) should usually be muted to prevent echo, or controlled by prop
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
              {/* Overlay Status Message (if stream exists, e.g. waiting state with local video) */}
              {statusMessage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">
                  <div className="text-center px-6 animate-pulse">
                    <div className="w-16 h-16 bg-neutral-800/80 rounded-full flex items-center justify-center mb-3 mx-auto border border-neutral-700/50 shadow-lg">
                      <User className="w-6 h-6 text-neutral-400" />
                    </div>
                    <p className="text-white font-medium text-lg tracking-wide drop-shadow-md">{statusMessage}</p>
                  </div>
                </div>
              )}
            </>
          ) : statusMessage ? (
            // Specific Status Message (No Stream)
            <div className="text-center px-6">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4 mx-auto border border-neutral-700/50 shadow-inner animate-pulse">
                <User className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-neutral-400 font-medium text-lg tracking-wide">{statusMessage}</p>
            </div>
          ) : isCameraOn ? (
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">Loading camera...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-4 mx-auto border border-neutral-700 shadow-inner">
                <User className="w-10 h-10 text-neutral-500" />
              </div>
              <p className="text-neutral-500 font-medium text-sm">Camera is off</p>
            </div>
          )}
        </div>

        {/* Topic Tags Overlay - Floating below center */}
        {emotionData?.topic_tags && emotionData.topic_tags.length > 0 && stream && !statusMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 w-full px-4 z-20">
            {emotionData.topic_tags.map((tag, idx) => (
              <div key={idx} className="bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 fade-in duration-500">
                <Tag className="w-3 h-3 text-blue-400" />
                <span className="font-medium">{tag.topic}</span>
                {tag.confidence === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="High Confidence" />}
                {tag.confidence === 'Medium' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Medium Confidence" />}
              </div>
            ))}
          </div>
        )}

        {/* Name overlay - Google Meet Style (Bottom Left) */}
        {/* Only show name if we have a stream AND NO waiting status (connected) AND showName is true */}
        {(stream && !statusMessage && showName) && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="text-white text-sm font-medium tracking-wide">{name}</span>
              {muted && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Muted" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}