import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './pages/auth/SignIn';

import { VideoCall } from './pages/meeting/VideoCall';
import { SetupPage } from './pages/interviewer/SetupPage';
import { SettingsPage } from './pages/interviewer/SettingsPage';
// keeping original components for now for other routes if needed
import { JoinScreen } from './components/auth/JoinScreen';
import { InterviewerPreMeeting } from './components/pre-meeting/InterviewerPreMeeting';
import { CandidatePreMeeting } from './components/pre-meeting/CandidatePreMeeting';

// import { ProtectedRoute } from './components/ProtectedRoute'; // Deprecated
import { RequireAuth } from './components/auth/RequireAuth';
import { PageTransitionProvider } from './components/common/PageTransition';

import { HomePage } from './pages/general/HomePage';
import { CandidateSignIn } from './pages/candidate/CandidateSignIn';
import { NotFoundPage } from './pages/general/NotFoundPage';
import { InterviewerThankYou } from './pages/interviewer/InterviewerThankYou';
import { CandidateThankYou } from './pages/candidate/CandidateThankYou';
import { MeetingSetup } from './pages/interviewer/MeetingSetup';
import { ReportPage } from './pages/interviewer/ReportPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
import { CookiePolicyPage } from './pages/legal/CookiePolicyPage';
import { CandidateDashboardPage } from './pages/candidate/CandidateDashboardPage';
import { CandidateSettingsPage } from './pages/candidate/CandidateSettingsPage';
import { CandidateMeetingPage } from './pages/candidate/CandidateMeetingPage';
import { CandidateLoginPage } from './components/auth/CandidateLoginPage';
import { GeminiDocsPage } from './pages/docs/GeminiDocsPage';
import { ROUTES } from './config'; // Added import for ROUTES

function AppRoutes() {
  return (
    <PageTransitionProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Auth Routes */}
        <Route path={ROUTES.SIGNIN} element={<SignIn />} />
        {/* <Route path={ROUTES.SIGNUP} element={<SignupPage />} /> */}
        <Route
          path="/auth/candidate/login"
          element={
            <RequireAuth allowedRole="candidate">
              <CandidateSignIn />
            </RequireAuth>
          }
        />
        <Route path="/docs/gemini" element={<GeminiDocsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/policy" element={<CookiePolicyPage />} />

        {/* Candidate Auth Routes */}
        <Route path={ROUTES.CANDIDATE_SIGNIN} element={<CandidateLoginPage />} />


        {/* Protected Routes for Attendees (Interviewer or Candidate) */}
        <Route element={<RequireAuth />}>
          <Route path="/meeting/:roomId" element={<VideoCall />} />
          <Route path="/join" element={<JoinScreen onJoin={(role, name, meetingId) => {
            localStorage.setItem('role', role);
            window.location.href = `/meeting/${meetingId}`;
          }} />} />
          <Route path="/candidate/thank-you" element={<CandidateThankYou />} />
        </Route>

        {/* Interviewer Routes */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <RequireAuth allowedRole="interviewer">
              <SetupPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.MEETING_SETUP}
          element={
            <RequireAuth allowedRole="interviewer">
              <MeetingSetup />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <RequireAuth allowedRole="interviewer">
              <SettingsPage />
            </RequireAuth>
          }
        />
        {/* Remaining Interviewer Protected Routes */}
        <Route element={<RequireAuth allowedRole="interviewer" />}>
          <Route path="/interviewer/thank-you" element={<InterviewerThankYou />} />
          <Route path="/interviewer/meeting-setup" element={<MeetingSetup />} />
          <Route path="/interviewer/meeting/:meetingId/setup" element={<MeetingSetup />} />
          <Route path="/interviewer/report/:meetingId" element={<ReportPage />} />
        </Route>

        {/* Candidate Protected Routes */}
        <Route
          path={ROUTES.CANDIDATE_SETTINGS}
          element={
            <RequireAuth allowedRole="candidate">
              <CandidateSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.CANDIDATE_DASHBOARD}
          element={
            <RequireAuth allowedRole="candidate">
              <CandidateDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/meeting/:roomId"
          element={
            <RequireAuth allowedRole="candidate">
              <CandidateMeetingPage />
            </RequireAuth>
          }
        />


        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PageTransitionProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;