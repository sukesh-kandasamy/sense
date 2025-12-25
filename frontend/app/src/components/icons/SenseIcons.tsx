import React from 'react';

export interface IconProps {
    className?: string;
    size?: number;
}

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
            {/* Top Bar - Blue */}
            <rect x="6" y="8" width="36" height="8" rx="4" fill="currentColor" className="text-blue-600" />

            {/* Middle Bar - Cyan/Light Blue */}
            <rect x="6" y="20" width="36" height="8" rx="4" fill="#38BDF8" />

            {/* Bottom Bar - Blue */}
            <rect x="6" y="32" width="36" height="8" rx="4" fill="currentColor" className="text-blue-600" />
        </svg>
    );
}

// Keeping other icons if they were there or likely needed, but for now just the Logo as requested.
// If there were other icons in the file, I should preserve them.
// I previously saw the file content, it seemed to only have SenseLogo or generic icons?
// Let me check the previous view_file content of SenseIcons.tsx from the conversation history
// to ensure I don't delete other icons.
