export interface EmotionData {
  dominant_emotion: string;
  confident_meter: number;
  emotion_meter: {
    [key: string]: number;
  };
  // Backward compatibility (optional)
  primary?: string;
  confidence?: number;
  emotions?: Record<string, number>;
  heartRate?: number;
  blinkRate?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'interviewer' | 'candidate';
}

export interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  interviewerName: string;
  jobRole: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  meetingLink: string;
  resumeUrl?: string;
  skills?: string[];
  previousNotes?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface CandidateEmotionPrediction {
  nervousnessLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  communicationStyle: string;
}