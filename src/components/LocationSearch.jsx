import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const LocationSearch = ({ placeholder, onLocationSelect, icon: Icon = Search, className, hideIcon = false, defaultValue = '' }) => {
    const [query, setQuery] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const isSelectionRef = useRef(false);
    const abortControllerRef = useRef(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (isSelectionRef.current) {
            isSelectionRef.current = false;
            return;
        }

        const fetchSuggestions = async () => {
            if (query.length < 3) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setLoading(true);
            try {
                const params = new URLSearchParams({
                    api_key: ORS_API_KEY,
                    text: query,
                    'focus.point.lat': '10.0284',
                    'focus.point.lon': '76.3289',
                    'boundary.country': 'IN',
                    size: '5',
                    layers: 'locality,venue,neighbourhood,street,address'
                });

                const response = await fetch(
                    `https://api.openrouteservice.org/geocode/autocomplete?${params}`,
                    { signal: abortControllerRef.current.signal }
                );
                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    const formattedSuggestions = data.features.map(feature => {
                        const p = feature.properties;
                        return {
                            display_name: p.label || [p.name, p.locality, p.region, p.country]
                                .filter(Boolean)
                                .join(', '),
                            lat: feature.geometry.coordinates[1],
                            lon: feature.geometry.coordinates[0]
                        };
                    });
                    setSuggestions(formattedSuggestions);
                    setIsOpen(true);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Suggestion error:", error);
                    setSuggestions([]);
                }
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 200);
        return () => {
            clearTimeout(timeoutId);
        };
    }, [query]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const handleSelect = (s) => {
        isSelectionRef.current = true;
        setQuery(s.display_name);
        setIsOpen(false);
        if (onLocationSelect) {
            onLocationSelect(s);
        }
    };

    const renderIcon = () => {
        if (loading) {
            return <Loader2 className="w-4 h-4 text-blue-400/70 animate-spin flex-shrink-0" />;
        }
        if (hideIcon) return null;
        return <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-icon-muted)' }} />;
    };

    const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            {/* Input field */}
            <div className={cn("liquid-glass-inset rounded-2xl px-3.5 py-2.5 flex items-center", hideIcon && !loading ? "gap-0" : "gap-3")}>
                {renderIcon()}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length === 0 && onLocationSelect) {
                            onLocationSelect(null);
                        }
                    }}
                    onFocus={() => {
                        if (suggestions.length > 0) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="bg-transparent border-none outline-none w-full text-sm font-medium tracking-tight"
                    style={{
                        color: 'var(--color-text-strong)',
                    }}
                />
            </div>
            {/* Placeholder styling via CSS — the input placeholder inherits from the glass */}
            <style>{`
                .liquid-glass-inset input::placeholder {
                    color: var(--color-text-subtle);
                }
            `}</style>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="liquid-glass rounded-2xl overflow-hidden mt-2 absolute w-full z-50 animate-fade-in">
                    {suggestions.map((s, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(s)}
                            className="px-3.5 py-3 text-sm cursor-pointer last:border-none truncate flex items-center gap-2.5 transition-all duration-150"
                            style={{
                                color: 'var(--color-text-muted)',
                                borderBottom: `1px solid ${borderColor}`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-strong)';
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                                e.currentTarget.style.background = '';
                            }}
                        >
                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
                            <span className="truncate">{s.display_name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
