import { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  VideoOff,
  MicOff,
  Wifi,
  Download,
  Clock,
  Calendar,
  User,
  Briefcase,
  FileText,
  Share2,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { Interview, CandidateEmotionPrediction } from '../../types';

interface InterviewerPreMeetingProps {
  interview: Interview;
  onStartInterview: () => void;
}

export function InterviewerPreMeeting({ interview, onStartInterview }: InterviewerPreMeetingProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [candidateOnline, setCandidateOnline] = useState(false);
  const [timeToStart, setTimeToStart] = useState('');

  // Mock emotion prediction data
  const emotionPrediction: CandidateEmotionPrediction = {
    nervousnessLevel: 'medium',
    confidenceScore: 72,
    communicationStyle: 'Analytical and detail-oriented'
  };

  useEffect(() => {
    // Simulate candidate coming online
    const timer = setTimeout(() => setCandidateOnline(true), 2000);

    // Calculate time to start
    const calculateTimeToStart = () => {
      const now = new Date();
      const scheduledDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
      const diff = scheduledDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeToStart('Interview time has arrived');
      } else {
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) {
          setTimeToStart(`Starts in ${minutes} minutes`);
        } else {
          const hours = Math.floor(minutes / 60);
          setTimeToStart(`Starts in ${hours} hour${hours > 1 ? 's' : ''}`);
        }
      }
    };

    calculateTimeToStart();
    const interval = setInterval(calculateTimeToStart, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [interview]);

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(interview.meetingLink);
    alert('Meeting link copied to clipboard!');
  };

  const canStartInterview = () => {
    const now = new Date();
    const scheduledDateTime = new Date(`${interview.scheduledDate} ${interview.scheduledTime}`);
    return now >= scheduledDateTime;
  };

  // return (
  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header - Simple & Clean */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-normal text-gray-900 mb-1">Interview Room</h1>
          <p className="text-gray-500 text-sm">Check your audio and video before joining.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Interview Overview & Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Overview - Card Style */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Interview Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Candidate</p>
                      <p className="text-gray-900 font-medium">{interview.candidateName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Role</p>
                      <p className="text-gray-900 font-medium">{interview.jobRole}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date & Time</p>
                      <p className="text-gray-900 font-medium">{interview.scheduledDate}, {interview.scheduledTime}</p>
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
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                    <span className="text-xs font-mono">ID: {interview.id}</span>
                  </div>
                  <button
                    onClick={copyMeetingLink}
                    className="text-primary hover:text-blue-700 text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy joining info
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Information */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-6">Candidate Information</h2>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Email</p>
                  <p className="text-gray-900">{interview.candidateEmail}</p>
                </div>

                {interview.skills && interview.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {interview.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview.resumeUrl && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-2">Resume</p>
                    <a
                      href={interview.resumeUrl}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-primary rounded-md transition-colors border border-gray-300 shadow-sm text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Resume
                    </a>
                  </div>
                )}

                {interview.previousNotes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-2">Previous Interview Notes</p>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 text-sm text-gray-800">
                      {interview.previousNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emotion & Behavior Prediction */}
            <div className="bg-white rounded-lg border border-purple-100 p-6 shadow-sm ring-1 ring-purple-50">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">AI Insights Preview</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Nervousness</p>
                  <p className={`font-medium ${emotionPrediction.nervousnessLevel === 'low' ? 'text-green-600' :
                      emotionPrediction.nervousnessLevel === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                    {emotionPrediction.nervousnessLevel.charAt(0).toUpperCase() + emotionPrediction.nervousnessLevel.slice(1)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Confidence</p>
                  <p className="text-primary font-medium">{emotionPrediction.confidenceScore}%</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Style</p>
                  <p className="text-purple-600 font-medium text-sm leading-tight">{emotionPrediction.communicationStyle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Technical Checks & Controls */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Status</h3>

              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-md ${candidateOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  {candidateOnline ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${candidateOnline ? 'text-green-700' : 'text-gray-500'}`}>
                      Candidate {candidateOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">{timeToStart}</p>
                  </div>
                </div>
              </div>
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
                        ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                        : 'bg-primary text-white border-transparent hover:bg-blue-600 shadow-sm'
                      }`}
                  >
                    {cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
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
                        ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {micEnabled ? 'Mute Microphone' : 'Test Microphone'}
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

            {/* Start Interview Button */}
            <button
              onClick={onStartInterview}
              disabled={!canStartInterview()}
              className={`w-full py-3.5 rounded-full font-medium transition-all shadow-md ${canStartInterview()
                  ? 'bg-primary hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {canStartInterview() ? 'Join Now' : 'Waiting...'}
            </button>

            {/* Force Start for Testing */}
            {!canStartInterview() && (
              <button
                onClick={onStartInterview}
                className="w-full py-2 text-sm text-gray-500 hover:text-primary transition-colors hover:underline"
              >
                Start Anyway (Testing Code)
              </button>
            )}

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <button className="w-full text-left py-2 px-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                View Candidate Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}