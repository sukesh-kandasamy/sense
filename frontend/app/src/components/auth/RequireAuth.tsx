import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { ROUTES, BACKEND_URL } from '../../config';
import axios from 'axios';

interface RequireAuthProps {
    children?: JSX.Element;
    allowedRole?: 'interviewer' | 'candidate';
}

export function RequireAuth({ children, allowedRole }: RequireAuthProps) {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/auth/users/me`, { withCredentials: true });
                if (response.data) {
                    setIsAuthenticated(true);
                    setUserRole(response.data.role || 'interviewer');
                    // Also update localStorage for UI consistency
                    localStorage.setItem('role', response.data.role || 'interviewer');
                }
            } catch (err) {
                setIsAuthenticated(false);
                setUserRole(null);
                localStorage.removeItem('role');
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to appropriate login based on what route they're trying to access
        if (allowedRole === 'candidate') {
            return <Navigate to={ROUTES.CANDIDATE_SIGNIN} state={{ from: location }} replace />;
        }
        return <Navigate to={ROUTES.SIGNIN} state={{ from: location }} replace />;
    }

    if (allowedRole && userRole !== allowedRole) {
        // Redirect to their correct dashboard instead of blocking
        if (userRole === 'candidate') {
            return <Navigate to={ROUTES.CANDIDATE_DASHBOARD} replace />;
        } else {
            return <Navigate to={ROUTES.DASHBOARD} replace />;
        }
    }

    return children ? children : <Outlet />;
}

