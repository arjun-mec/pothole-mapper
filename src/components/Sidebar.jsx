import React, { useState, useMemo } from 'react';
import { Search, X, Route, Clock, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import LocationSearch from './LocationSearch';
import { useTheme } from '../context/ThemeContext';

// ── Pothole-near-route helpers ──────────────────────────────
const BUFFER_M = 20; // metres from route centreline

/** Shortest distance (in metres) from point P to segment AB, all in [lng, lat]. */
const pointToSegmentDist = (p, a, b) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const avgLat = toRad((p[1] + a[1] + b[1]) / 3);
    const mPerLng = 111_320 * Math.cos(avgLat);
    const mPerLat = 110_540;

    // Project into a local metre grid
    const px = (p[0] - a[0]) * mPerLng, py = (p[1] - a[1]) * mPerLat;
    const bx = (b[0] - a[0]) * mPerLng, by = (b[1] - a[1]) * mPerLat;
    const lenSq = bx * bx + by * by;
    let t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
    const dx = px - t * bx, dy = py - t * by;
    return Math.sqrt(dx * dx + dy * dy);
};

/** Count potholes within BUFFER_M of a polyline given as [[lng,lat], …]. */
const countPotholesAlongRoute = (coords, potholes) => {
    if (!coords || coords.length < 2 || !potholes || potholes.length === 0) return 0;
    let count = 0;
    for (const p of potholes) {
        const pt = [p.lng, p.lat];
        for (let i = 0; i < coords.length - 1; i++) {
            if (pointToSegmentDist(pt, coords[i], coords[i + 1]) <= BUFFER_M) {
                count++;
                break; // already counted, move to next pothole
            }
        }
    }
    return count;
};

const Sidebar = ({
    onLocationSelect,
    onRouteSelect,
    foundRoutes = [],
    selectedRouteIndex = 0,
    onSelectRoute,
    potholes = []
}) => {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [resetKey, setResetKey] = useState(0);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Pre-compute pothole counts per route (only recalculates when routes or potholes change)
    const potholeCounts = useMemo(() =>
        foundRoutes.map(r => countPotholesAlongRoute(r.coordinates, potholes)),
        [foundRoutes, potholes]
    );

    const formatDistance = (meters) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const formatDuration = (seconds) => {
        const mins = Math.round(seconds / 60);
        if (mins < 60) return `${mins} min`;
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hrs}h ${remainingMins}m`;
    };

    const handleStartSelect = (location) => {
        setStart(location);
        if (location && end) {
            onRouteSelect(location, end);
        } else if (location) {
            onLocationSelect(location);
        } else {
            onLocationSelect(null);
        }
    };

    const handleEndSelect = (location) => {
        setEnd(location);
        if (start && location) {
            onRouteSelect(start, location);
        } else if (location) {
            onLocationSelect(location);
        } else {
            onLocationSelect(null);
        }
    };

    const handleSwap = () => {
        const prevStart = start;
        const prevEnd = end;
        setStart(prevEnd);
        setEnd(prevStart);
        setResetKey(prev => prev + 1);
        if (prevStart && prevEnd) {
            onRouteSelect(prevEnd, prevStart);
        } else if (prevEnd) {
            onLocationSelect(prevEnd);
        } else if (prevStart) {
            onLocationSelect(prevStart);
        }
    };

    const handleExit = () => {
        setStart(null);
        setEnd(null);
        if (onLocationSelect) onLocationSelect(null);
        if (onRouteSelect) onRouteSelect(null, null);
        setResetKey(prev => prev + 1);
    };

    // Theme-aware color helpers
    const textColor = 'var(--color-text)';
    const textMuted = 'var(--color-text-muted)';
    const textSubtle = 'var(--color-text-subtle)';
    const textFaint = 'var(--color-text-faint)';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
    const borderHover = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
    const bgSubtle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const bgHover = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const dotBorderColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
    const connectorDotColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

    return (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3 w-96 pointer-events-auto"
            style={{ color: textColor }}
        >
            {/* Unified Panel — search, routes, and clear all in one glass card */}
            <div className="liquid-glass rounded-2xl p-3.5 flex flex-col gap-3">
                {/* Navigation Inputs — Google Maps style */}
                <div className="flex items-stretch gap-2.5">
                    {/* Left: Icons column (circle, dots, pin) */}
                    <div className="flex flex-col items-center pt-[14px] pb-[14px] gap-0 shrink-0 w-5">
                        {/* Starting point — hollow circle */}
                        <div className="w-[14px] h-[14px] rounded-full border-2 shrink-0"
                            style={{ borderColor: dotBorderColor }}
                        />

                        {/* Vertical dots connector */}
                        <div className="flex flex-col items-center gap-[3px] py-[5px] flex-1 justify-center">
                            <div className="w-[3px] h-[3px] rounded-full" style={{ background: connectorDotColor }} />
                            <div className="w-[3px] h-[3px] rounded-full" style={{ background: connectorDotColor }} />
                            <div className="w-[3px] h-[3px] rounded-full" style={{ background: connectorDotColor }} />
                        </div>

                        {/* Destination — purple pin icon */}
                        <div className="shrink-0 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#a78bfa" stroke="none">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                    </div>

                    {/* Center: Input fields */}
                    <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                        <div className="z-20 relative">
                            <LocationSearch
                                key={`start-${resetKey}`}
                                placeholder="Choose starting point..."
                                onLocationSelect={handleStartSelect}
                                defaultValue={start?.display_name || ''}
                                hideIcon
                            />
                        </div>

                        <div className="z-10 relative">
                            <LocationSearch
                                key={`end-${resetKey}`}
                                placeholder="Choose destination..."
                                onLocationSelect={handleEndSelect}
                                icon={Search}
                                defaultValue={end?.display_name || ''}
                                hideIcon
                            />
                        </div>
                    </div>

                    {/* Right: Swap button */}
                    <div className="flex items-center shrink-0">
                        <button
                            onClick={handleSwap}
                            className="nav-swap-btn w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
                            style={{
                                border: `1px solid ${borderSubtle}`,
                                background: bgSubtle,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = borderHover;
                                e.currentTarget.style.background = bgHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = borderSubtle;
                                e.currentTarget.style.background = bgSubtle;
                            }}
                            title="Swap starting point and destination"
                        >
                            <ArrowUpDown className="w-[15px] h-[15px] transition-colors duration-200"
                                style={{ color: textMuted }}
                            />
                        </button>
                    </div>
                </div>

                {/* Route Options — integrated */}
                {foundRoutes.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1 animate-fade-in">
                        {/* Subtle divider */}
                        <div className="h-px mb-1"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)'
                                    : 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)'
                            }}
                        />

                        {foundRoutes.map((r, i) => {
                            const isActive = i === selectedRouteIndex;
                            const isFastest = i === 0;
                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelectRoute(i)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border",
                                        isActive
                                            ? "liquid-glass-inset shadow-[0_0_16px_rgba(99,102,241,0.08)]"
                                            : "border-transparent"
                                    )}
                                    style={isActive ? {
                                        borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.12)',
                                    } : undefined}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = '';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }
                                    }}
                                >
                                    {/* Active indicator dot */}
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                                    )}
                                        style={{
                                            background: isActive ? '#818cf8' : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'),
                                            boxShadow: isActive ? '0 0 6px rgba(99,102,241,0.5)' : 'none',
                                        }}
                                    />

                                    {/* Duration */}
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock className={cn(
                                            "size-3.5 shrink-0 transition-colors duration-200"
                                        )}
                                            style={{ color: isActive ? textMuted : textSubtle }}
                                        />
                                        <span className="text-sm font-semibold tabular-nums whitespace-nowrap tracking-tight transition-colors duration-200"
                                            style={{ color: isActive ? 'var(--color-text-strong)' : textMuted }}
                                        >
                                            {formatDuration(r.duration)}
                                        </span>
                                    </div>

                                    {/* Distance */}
                                    <div className="flex items-center gap-1 text-xs tabular-nums whitespace-nowrap transition-colors duration-200"
                                        style={{ color: isActive ? textMuted : textSubtle }}
                                    >
                                        <Route className="size-3 shrink-0" />
                                        {formatDistance(r.distance)}
                                    </div>

                                    {/* Pothole count */}
                                    {(() => {
                                        const count = potholeCounts[i] ?? 0;
                                        const pColor = count === 0
                                            ? { text: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' }
                                            : count <= 3
                                                ? { text: '#eab308', bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.25)' }
                                                : { text: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' };
                                        return (
                                            <div className="flex items-center gap-1 text-[11px] font-medium tabular-nums whitespace-nowrap transition-all duration-200 px-1.5 py-0.5 rounded-md"
                                                style={{
                                                    color: isActive ? pColor.text : (isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.25)'),
                                                    background: isActive ? pColor.bg : 'transparent',
                                                    border: `1px solid ${isActive ? pColor.border : 'transparent'}`,
                                                }}
                                            >
                                                <AlertTriangle className="size-3 shrink-0" />
                                                {count}
                                            </div>
                                        );
                                    })()}

                                    {/* Fastest badge */}
                                    {isFastest && (
                                        <span className={cn(
                                            "ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 tracking-wide transition-all duration-200",
                                            isActive
                                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                                                : "bg-emerald-500/5 text-emerald-500/30 border border-emerald-500/10"
                                        )}>
                                            Fastest
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Clear Route Button */}
                {(start || end) && (
                    <button
                        onClick={handleExit}
                        className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400/70 hover:text-red-300 border border-red-500/15 hover:border-red-500/35 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear Route
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
