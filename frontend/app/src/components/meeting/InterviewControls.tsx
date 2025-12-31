import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, MoreVertical, Phone } from 'lucide-react';

interface InterviewControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export function InterviewControls({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}: InterviewControlsProps) {

  return (
    <>
      <div className="flex justify-start relative z-40">
        <div className="bg-white rounded-full px-3 py-1.5 shadow-xl flex items-center gap-2 border border-gray-100 ring-1 ring-black/5">
          {/* Microphone Toggle */}
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-full transition-colors duration-200 ${isMicOn
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-100'
              }`}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={onToggleCamera}
            className={`p-2 rounded-full transition-colors duration-200 ${isCameraOn
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-100'
              }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* More Options */}
          <button
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

          {/* End Call */}
          <button
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm font-medium flex items-center gap-1.5"
            title="End interview"
            onClick={onEndCall}
          >
            <Phone className="w-3.5 h-3.5 rotate-[135deg]" />
            <span className="hidden sm:inline text-xs">End</span>
          </button>
        </div>
      </div>
    </>
  );
}