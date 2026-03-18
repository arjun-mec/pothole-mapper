import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('pothole-theme') || 'dark';
        } catch {
            return 'dark';
        }
    });

    // Apply data-theme attribute and transition class
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.classList.add('theme-transitioning');

        const timeout = setTimeout(() => {
            root.classList.remove('theme-transitioning');
        }, 600);

        try {
            localStorage.setItem('pothole-theme', theme);
        } catch { /* ignore */ }

        return () => clearTimeout(timeout);
    }, [theme]);

    // Set initial theme without transition
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
