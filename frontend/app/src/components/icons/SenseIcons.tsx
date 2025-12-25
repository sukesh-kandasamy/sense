// Custom branded SVG icons for Sense platform
// Inspired by Google/Meta's clean, meaningful icon design

interface IconProps {
    className?: string;
    size?: number;
}

// Sense Logo - Abstract eye/perception symbol representing AI insight
export function SenseLogo({ className = "", size = 32 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer ring - represents connection/awareness */}
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
            {/* Inner eye shape - represents perception/insight */}
            <path
                d="M24 14C16 14 10 24 10 24C10 24 16 34 24 34C32 34 38 24 38 24C38 24 32 14 24 14Z"
                fill="currentColor"
                opacity="0.15"
            />
            <path
                d="M24 14C16 14 10 24 10 24C10 24 16 34 24 34C32 34 38 24 38 24C38 24 32 14 24 14Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Pupil - AI core */}
            <circle cx="24" cy="24" r="5" fill="currentColor" />
            {/* Highlight - intelligence spark */}
            <circle cx="22" cy="22" r="1.5" fill="white" opacity="0.8" />
        </svg>
    );
}

// Emotion Wave - Represents emotional analysis
export function EmotionWaveIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M2 12C2 12 4 8 7 8C10 8 10 16 13 16C16 16 16 8 19 8C22 8 22 12 22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
        </svg>
    );
}

// AI Brain - Represents intelligent processing
export function AIBrainIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Brain outline */}
            <path
                d="M12 4C8 4 5 7 5 11C5 13 6 14.5 7 15.5V19C7 20 8 21 9 21H15C16 21 17 20 17 19V15.5C18 14.5 19 13 19 11C19 7 16 4 12 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Neural connections */}
            <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Pulse dot */}
            <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        </svg>
    );
}

// Video Interview - Represents video communication
export function VideoInterviewIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Screen */}
            <rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
            {/* Camera arrow */}
            <path
                d="M16 9L21 6V18L16 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Person silhouette */}
            <circle cx="9" cy="8" r="2" fill="currentColor" opacity="0.4" />
            <path
                d="M5 14C5 12 7 11 9 11C11 11 13 12 13 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.4"
            />
        </svg>
    );
}

// Shield Check - Represents fairness and bias reduction
export function FairnessShieldIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Shield */}
            <path
                d="M12 3L4 7V12C4 17 8 20 12 21C16 20 20 17 20 12V7L12 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Balance/equality symbol */}
            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// Insight Spark - Represents real-time insights
export function InsightSparkIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Lightbulb body */}
            <path
                d="M12 2C8 2 5 5 5 9C5 12 7 14 8 15V18C8 19.5 9.5 21 12 21C14.5 21 16 19.5 16 18V15C17 14 19 12 19 9C19 5 16 2 12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Rays */}
            <path d="M12 0V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M4.5 4.5L5.2 5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M19.5 4.5L18.8 5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            {/* Spark center */}
            <circle cx="12" cy="9" r="2" fill="currentColor" />
        </svg>
    );
}

// Connection Users - Represents interview connection
export function ConnectionIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Person 1 */}
            <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M2 16C2 13 4 11 7 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

            {/* Person 2 */}
            <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M22 16C22 13 20 11 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

            {/* Connection wave */}
            <path
                d="M10 12C10 12 12 10 12 12C12 14 14 12 14 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

// Timer/Duration icon
export function DurationIcon({ className = "", size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 9V13L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
