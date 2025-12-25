# InterviewIQ - Smart Interview Platform with Emotion Insights

## Overview
A comprehensive online meeting platform designed specifically for interview purposes, featuring real-time emotion detection capabilities to help interviewers assess candidate emotional states during interviews.

## Application Flow

### 1. Login Page (`/components/LoginPage.tsx`)
**Features:**
- Email/Password authentication
- User role selection (Interviewer/Candidate)
- Social login options (Google/Microsoft)
- Security notice and help support link
- Professional, trustworthy design

**Test Access:**
- Enter any email and password
- Select Interviewer or Candidate role
- Click "Sign In" to proceed

---

### 2. Pre-Meeting Screens

#### 2A. Interviewer Pre-Meeting (`/components/InterviewerPreMeeting.tsx`)
**Features:**
- **Interview Overview:**
  - Candidate name, job role, date/time, duration
  - Meeting ID and shareable link
  
- **Candidate Information:**
  - Email, skills list, resume download
  - Previous interview notes
  
- **AI Emotion & Behavior Prediction:**
  - Pre-interview nervousness level assessment
  - Confidence score prediction
  - Communication style analysis
  
- **Technical Checks:**
  - Camera preview and toggle
  - Microphone test with visual feedback
  - Network quality indicator
  
- **Status & Notifications:**
  - Candidate online/offline status
  - Countdown to interview start time
  
- **Controls:**
  - Start Interview button (enabled at scheduled time)
  - Force start option for testing
  - View candidate profile option

#### 2B. Candidate Pre-Meeting (`/components/CandidatePreMeeting.tsx`)
**Features:**
- **Interview Details:**
  - Interviewer name, position, date/time
  - Interview duration and meeting ID
  
- **Important Instructions:**
  - Camera requirements
  - Professional dress code reminder
  - Quiet environment guidelines
  - Network stability tips
  - Eye contact best practices
  
- **Live Emotion Feedback (Private):**
  - Real-time emotion detection preview
  - Personalized tips for improvement
  - Only visible to candidate (NOT shared with interviewer)
  
- **Technical Checks:**
  - Camera test
  - Microphone test with level indicator
  - Speaker test
  - Network quality check
  
- **Document Upload:**
  - Optional resume upload
  - Portfolio upload option
  
- **Ready Status:**
  - Ready checkbox confirmation
  - Join button (enabled 5 mins before scheduled time)
  - Force join option for testing

---

### 3. Interview Room (`/components/InterviewRoom.tsx`)
**Features for Interviewers:**
- **Video panels** for both interviewer and candidate
- **Real-time emotion detection** with visual analytics
- **Interview notes** taking capability
- **Smart alerts** for high stress detection

**Features for Candidates:**
- **Video panels** for communication
- **Interview tips** sidebar
- Basic controls without emotion visibility

**Shared Features:**
- Camera/microphone controls
- Screen sharing capability
- Live session indicator

---

## Key Components

### Core Features
1. **Login System** - Role-based authentication
2. **Pre-Meeting Preparation** - Separate experiences for interviewers and candidates
3. **Technical Checks** - Audio/video/network verification
4. **Emotion Detection** - AI-powered emotion analysis (simulated)
5. **Interview Controls** - Full meeting controls
6. **Notes System** - Real-time note-taking for interviewers

### Technology Stack
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Simulated emotion detection (ready for AI/ML API integration)

---

## Mock Data
The application includes realistic mock interview data:
- **Interview ID:** INT-2024-12345
- **Candidate:** Sarah Johnson
- **Interviewer:** Michael Chen
- **Role:** Senior Frontend Developer
- **Skills:** React, TypeScript, Node.js, UI/UX Design, System Design
- **Scheduled:** 10 minutes from current time (for testing)

---

## Testing the Application

### Login Flow:
1. Start at the login page
2. Enter any email (e.g., `test@example.com`) and password
3. Select either "Interviewer" or "Candidate" role
4. Click "Sign In"

### Interviewer Flow:
1. After login, review interview overview and candidate information
2. Check the AI emotion prediction panel
3. Test camera, microphone, and check network status
4. Wait for scheduled time OR click "Start Anyway (For Testing)"
5. Enter the interview room with emotion detection enabled

### Candidate Flow:
1. After login, review interview details and instructions
2. View private emotion feedback (updates every 5 seconds)
3. Test camera, microphone, speaker
4. Check "I'm ready to join" checkbox
5. Wait for scheduled time OR click "Join Anyway (For Testing)"
6. Enter the interview room

---

## Future Enhancements

### AI/ML Integration (Production Ready):
- Replace simulated emotion data with actual AI/ML APIs
- Integration points:
  - Face detection and emotion recognition APIs
  - Voice tone analysis
  - Physiological monitoring (if hardware available)
  - Behavior pattern analysis

### Backend Integration:
- Real authentication system
- Database for interview scheduling
- User management
- Document storage for resumes/portfolios
- Real-time video/audio streaming

### Additional Features:
- Recording capability
- Automated interview reports
- Calendar integration
- Email notifications
- Multi-interviewer support
- Question bank management

---

## Privacy & Security Notes
⚠️ **Important:** This platform is designed for interview assessment purposes.
- Emotion detection is only visible to interviewers during the interview
- Candidates see private feedback before interviews to help them prepare
- Not designed for collecting PII or highly sensitive data
- All data should be encrypted in production
- Compliance with data protection regulations required

---

## File Structure
```
/App.tsx                              # Main application with routing
/types/index.ts                       # TypeScript interfaces
/components/
  ├── LoginPage.tsx                   # Authentication screen
  ├── InterviewerPreMeeting.tsx       # Interviewer preparation
  ├── CandidatePreMeeting.tsx         # Candidate preparation
  ├── InterviewRoom.tsx               # Main interview interface
  ├── VideoPanel.tsx                  # Video display component
  ├── EmotionDetector.tsx             # Emotion analytics display
  ├── InterviewControls.tsx           # Meeting controls
  ├── InterviewNotes.tsx              # Note-taking component
  └── JoinScreen.tsx                  # Legacy join screen
```

---

## Development Notes
- Interview is scheduled 10 minutes from current time for easy testing
- "Force Start/Join" buttons available when not at scheduled time
- All emotion data is currently simulated (updates every 3-5 seconds)
- Network quality is mocked as "excellent"
- No actual video streaming implemented (UI only)
