import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface TransitionContextType {
    navigateWithTransition: (to: string) => void;
    isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error('usePageTransition must be used within PageTransitionProvider');
    }
    return context;
}

interface PageTransitionProviderProps {
    children: ReactNode;
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayLocation, setDisplayLocation] = useState(location);

    const navigateWithTransition = (to: string) => {
        if (to === location.pathname) return;

        setIsTransitioning(true);
        setTimeout(() => {
            navigate(to);
        }, 200);
    };

    useEffect(() => {
        if (location !== displayLocation) {
            setDisplayLocation(location);
            // Small delay to allow fade-in
            setTimeout(() => {
                setIsTransitioning(false);
            }, 50);
        }
    }, [location, displayLocation]);

    return (
        <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
            {/* Transition Overlay */}
            <div
                className={`fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-200 ${isTransitioning ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Page Content with fade effect */}
            <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </div>
        </TransitionContext.Provider>
    );
}
