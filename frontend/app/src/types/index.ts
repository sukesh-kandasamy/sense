export interface EmotionData {
  primary: 'nervous' | 'confident' | 'stressed' | 'calm' | 'engaged' | 'neutral';
  confidence: number;
  emotions: {
    nervous: number;
    confident: number;
    stressed: number;
    calm: number;
    engaged: number;
  };
  smart_nudge?: string;
  topic_tags?: Array<{
    topic: string;
    confidence: 'High' | 'Medium' | 'Low';
  }>;
  reasoning?: string;
  heartRate: number;
  blinkRate: number;
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