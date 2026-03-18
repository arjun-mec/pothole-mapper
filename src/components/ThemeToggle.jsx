import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle-btn absolute top-4 right-16 z-20 w-10 h-10 flex items-center justify-center pointer-events-auto"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="relative w-5 h-5">
                {/* Sun icon — visible in dark mode (click to go light) */}
                <Sun
                    className="absolute inset-0 w-5 h-5 transition-all duration-400"
                    style={{
                        color: isDark ? 'rgba(251, 191, 36, 0.85)' : 'rgba(251, 191, 36, 0)',
                        opacity: isDark ? 1 : 0,
                        transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                />
                {/* Moon icon — visible in light mode (click to go dark) */}
                <Moon
                    className="absolute inset-0 w-5 h-5 transition-all duration-400"
                    style={{
                        color: isDark ? 'rgba(99, 102, 241, 0)' : 'rgba(99, 102, 241, 0.85)',
                        opacity: isDark ? 0 : 1,
                        transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                />
            </div>
        </button>
    );
};

export default ThemeToggle;
