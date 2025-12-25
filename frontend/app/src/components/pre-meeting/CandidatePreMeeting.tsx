import { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  VideoOff,
  MicOff,
  Wifi,
  Clock,
  Calendar,
  User,
  Briefcase,
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Volume2,
  Lightbulb,
  Smile
} from 'lucide-react';
import { Interview } from '../../types';

interface CandidatePreMeetingProps {
  interview: Interview;
  onJoinInterview: () => void;
}

export function CandidatePreMeeting({ interview, onJoinInterview }: CandidatePreMeetingProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [isReady, setIsReady] = useState(false);
  const [timeToStart, setTimeToStart] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<'neutral' | 'nervous' | 'confident'>('neutral');

  // Simulated real-time emotion detection for candidate
  useEffect(() => {
    const emotions: ('neutral' | 'nervous' | 'confident')[] = ['neutral', 'nervous', 'confident'];
    const interval = setInterval(() => {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(randomEmotion);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate time to start
    const calculateTimeToStart = () => {
      const now = new Date();
      const scheduledDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
      const diff = scheduledDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeToStart('Interview time has arrived - Ready to join!');
      } else {
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) {
          setTimeToStart(`Interview starts in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          const hours = Math.floor(minutes / 60);
          const remainingMins = minutes % 60;
          setTimeToStart(`Interview starts in ${hours}h ${remainingMins}m`);
        }
      }
    };

    calculateTimeToStart();
    const interval = setInterval(calculateTimeToStart, 60000);

    return () => clearInterval(interval);
  }, [interview]);

  const testSpeaker = () => {
    setSpeakerTested(true);
    // Play a test sound in real implementation
    setTimeout(() => setSpeakerTested(false), 3000);
  };

  const canJoinInterview = () => {
    const now = new Date();
    const scheduledDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
    // Allow joining 5 minutes before scheduled time
    const fiveMinsBefore = new Date(scheduledDateTime.getTime() - 5 * 60000);
    return now >= fiveMinsBefore && isReady;
  };

  const getEmotionFeedback = () => {
    switch (currentEmotion) {
      case 'nervous':
        return {
          emoji: '😰',
          status: 'Looking a bit nervous',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30'
        };
      case 'confident':
        return {
          emoji: '😊',
          status: 'Looking confident',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        };
      default:
        return {
          emoji: '😐',
          status: 'Looking neutral',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30'
        };
    }
  };

  const emotionFeedback = getEmotionFeedback();


  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header - Simple & Clean */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-normal text-gray-900 mb-1">Join Interview</h1>
          <p className="text-gray-500 text-sm">Review joining instructions and check your setup.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Interview Details & Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Details - Card Style */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Meeting Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Interviewer</p>
                      <p className="text-gray-900 font-medium">{interview.interviewerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Position</p>
                      <p className="text-gray-900 font-medium">{interview.jobRole}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date</p>
                      <p className="text-gray-900 font-medium">{interview.scheduledDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Time</p>
                      <p className="text-gray-900 font-medium">{interview.scheduledTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Duration</p>
                      <p className="text-gray-900 font-medium">{interview.duration} mins</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Meeting ID</p>
                      <p className="text-gray-900 font-medium">{interview.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Instructions */}
            <div className="bg-white rounded-lg border border-blue-100 p-6 shadow-sm ring-1 ring-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Important Instructions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Keep camera ON</p>
                    <p className="text-gray-500 text-xs">Builds rapport with interviewer</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Professional Dress</p>
                    <p className="text-gray-500 text-xs">Dress professionally</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Quiet Location</p>
                    <p className="text-gray-500 text-xs">Minimize background noise</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">Stable Internet</p>
                    <p className="text-gray-500 text-xs">Use wired connection if possible</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emotional Feedback (Private) */}
            <div className={`rounded-lg border p-6 ${currentEmotion === 'nervous' ? 'bg-yellow-50 border-yellow-200' :
              currentEmotion === 'confident' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
              <div className="flex items-center gap-2 mb-4">
                <Smile className={`w-5 h-5 ${currentEmotion === 'nervous' ? 'text-yellow-600' :
                  currentEmotion === 'confident' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                <h2 className="text-gray-900 font-medium">Live Emotion Prediction (Private)</h2>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{emotionFeedback.emoji}</div>
                <div>
                  <p className={`font-medium mb-1 ${currentEmotion === 'nervous' ? 'text-yellow-700' :
                    currentEmotion === 'confident' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                    {emotionFeedback.status}
                  </p>
                  <p className="text-gray-500 text-sm">Visible only to you</p>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-4 border border-gray-200/50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-medium mb-2 text-sm">Tips to improve:</p>
                    <ul className="text-gray-600 space-y-1 list-disc list-inside text-xs">
                      <li>Sit up straight with relaxed shoulders</li>
                      <li>Maintain a natural, pleasant expression</li>
                      <li>Look directly at the camera</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload (Optional) */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Required Documents (Optional)</h2>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 group">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-gray-900 font-medium text-sm">Upload Resume</p>
                      <p className="text-gray-500 text-xs">PDF, DOC, or DOCX</p>
                    </div>
                  </div>
                  <span className="text-primary text-sm font-medium group-hover:underline">Browse</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Technical Checks & Ready Status */}
          <div className="space-y-6">
            {/* Countdown */}
            <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-full text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-gray-900 font-medium">Time until interview</h3>
              </div>
              <p className="text-3xl font-light text-primary">{timeToStart || '--:--'}</p>
            </div>

            {/* Technical Checks */}
            <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Technical Check</h3>

              <div className="space-y-6">
                {/* Camera Preview */}
                <div>
                  <div className="aspect-video bg-gray-900 rounded-md flex items-center justify-center mb-3 overflow-hidden relative">
                    {cameraEnabled ? (
                      <div className="text-center">
                        <Video className="w-12 h-12 text-white/50 mx-auto mb-2" />
                        <p className="text-white/50 text-sm">Camera Active</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Camera Off</p>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                      You
                    </div>
                  </div>
                  <button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`w-full py-2.5 rounded-full font-medium text-sm transition-colors border ${cameraEnabled
                      ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                      : 'bg-primary text-white border-transparent hover:bg-blue-600 shadow-sm'
                      }`}
                  >
                    {cameraEnabled ? '✓ Camera Working' : 'Test Camera'}
                  </button>
                </div>

                {/* Microphone Test */}
                <div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 mb-3">
                    {micEnabled ? (
                      <Mic className="w-5 h-5 text-green-600" />
                    ) : (
                      <MicOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1 mx-3">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {micEnabled && (
                          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{micEnabled ? 'Active' : 'Off'}</span>
                  </div>
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`w-full py-2.5 rounded-full font-medium text-sm transition-colors border ${micEnabled
                      ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {micEnabled ? '✓ Microphone Working' : 'Test Microphone'}
                  </button>
                </div>

                {/* Speaker Test */}
                <div>
                  <button
                    onClick={testSpeaker}
                    className={`w-full py-2.5 rounded-full font-medium text-sm transition-colors flex items-center justify-center gap-2 border ${speakerTested
                      ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    {speakerTested ? '✓ Speaker Working' : 'Test Speaker'}
                  </button>
                </div>

                {/* Network Quality */}
                <div>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-4 h-4 ${networkQuality === 'excellent' ? 'text-green-500' :
                        networkQuality === 'good' ? 'text-yellow-500' :
                          'text-red-500'
                        }`} />
                      <span className="text-sm text-gray-600">Network Quality</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${networkQuality === 'excellent' ? 'bg-green-100 text-green-700' :
                      networkQuality === 'good' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready Checkbox */}
            <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isReady}
                  onChange={(e) => setIsReady(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-gray-900 font-medium mb-1">I'm ready to join</p>
                  <p className="text-gray-500 text-sm">
                    I have checked all technical requirements and I'm prepared for the interview
                  </p>
                </div>
              </label>
            </div>

            {/* Join Interview Button */}
            <button
              onClick={onJoinInterview}
              disabled={!canJoinInterview()}
              className={`w-full py-3.5 rounded-full font-medium transition-all shadow-md ${canJoinInterview()
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {!isReady ? 'Mark Yourself Ready First' : canJoinInterview() ? 'Join Now' : 'Waiting...'}
            </button>

            {/* Force Join for Testing */}
            {isReady && !canJoinInterview() && (
              <button
                onClick={onJoinInterview}
                className="w-full py-2 text-sm text-gray-500 hover:text-primary transition-colors hover:underline"
              >
                Join Anyway (Testing Code)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}