export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}:8443`;
export const WS_BASE_URL = BACKEND_URL.replace(/^http/, 'ws');

export const ROUTES = {
    HOME: '/',
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    DASHBOARD: '/interviewer/dashboard',
    INTERVIEWER_DASHBOARD: '/interviewer/dashboard',
    MEETING_SETUP: '/interviewer/meeting-setup',
    SETTINGS: '/interviewer/settings',
    CANDIDATE_LOGIN: '/auth/candidate/login',
    CANDIDATE_SIGNIN: '/candidate/signin',
    CANDIDATE_DASHBOARD: '/candidate/dashboard',
    CANDIDATE_SETTINGS: '/candidate/settings',
};
