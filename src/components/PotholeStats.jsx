import React, { useState } from 'react';
import { AlertTriangle, Activity, TrendingUp, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const getMetrics = (items) => {
    if (items.length === 0) return { count: 0, avg: 0, peak: 0 };
    const vals = items.map(p => p.value || 0);
    return {
        count: items.length,
        avg: vals.reduce((s, v) => s + v, 0) / vals.length,
        peak: Math.max(...vals),
    };
};

const getSeverityCounts = (potholes) => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    potholes.forEach(p => {
        const v = p.value || 0;
        const isRocking = p.type === 'Rocking';
        if (isRocking) {
            if (v < 50) counts.low++;
            else if (v < 120) counts.medium++;
            else if (v < 200) counts.high++;
            else counts.critical++;
        } else {
            if (v < 0.15) counts.low++;
            else if (v < 0.35) counts.medium++;
            else if (v < 0.55) counts.high++;
            else counts.critical++;
        }
    });
    return counts;
};

const PotholeStats = ({ potholes = [], loading = false }) => {
    const [expanded, setExpanded] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Theme-aware styles
    const textStrong = 'var(--color-text-strong)';
    const textMuted = 'var(--color-text-muted)';
    const textSubtle = 'var(--color-text-subtle)';
    const textFaint = 'var(--color-text-faint)';
    const dividerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const barTrackBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';

    if (loading) {
        return (
            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
                <div className="liquid-glass rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs font-medium" style={{ color: textMuted }}>Loading data...</span>
                </div>
            </div>
        );
    }

    if (potholes.length === 0) return null;

    const shockItems = potholes.filter(p => (p.type || 'Shock') === 'Shock');
    const rockingItems = potholes.filter(p => p.type === 'Rocking');
    const shockMetrics = getMetrics(shockItems);
    const rockingMetrics = getMetrics(rockingItems);
    const counts = getSeverityCounts(potholes);

    const severityBars = [
        { label: 'Minor', count: counts.low, color: '#22c55e' },
        { label: 'Moderate', count: counts.medium, color: '#f59e0b' },
        { label: 'Severe', count: counts.high, color: '#f97316' },
        { label: 'Critical', count: counts.critical, color: '#ef4444' },
    ];
    const maxBarCount = Math.max(...severityBars.map(s => s.count), 1);

    /* ── Collapsed: compact mini bar ────────────────────── */
    if (!expanded) {
        return (
            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
                <button
                    onClick={() => setExpanded(true)}
                    className="liquid-glass rounded-2xl px-4 py-3 flex items-center gap-3 hover:brightness-110 transition-all duration-200 cursor-pointer border-0 outline-none"
                >
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Total */}
                        <div className="text-center">
                            <div className="text-base font-bold tabular-nums leading-none" style={{ color: textStrong }}>{potholes.length}</div>
                            <div className="text-[8px] font-medium uppercase tracking-wider mt-0.5" style={{ color: textSubtle }}>Total</div>
                        </div>

                        <div className="w-px h-5" style={{ background: textFaint }}></div>

                        {/* Shock peak */}
                        <div className="text-center">
                            <div className="flex items-center gap-0.5">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                <span className="text-sm font-bold tabular-nums leading-none" style={{ color: textStrong }}>{shockMetrics.peak.toFixed(2)}</span>
                                <span className="text-[8px] text-amber-400 font-semibold">g</span>
                            </div>
                            <div className="text-[8px] font-medium uppercase tracking-wider mt-0.5" style={{ color: textSubtle }}>Peak</div>
                        </div>

                        <div className="w-px h-5" style={{ background: textFaint }}></div>

                        {/* Rocking peak */}
                        <div className="text-center">
                            <div className="flex items-center gap-0.5">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
                                    <path d="M23 4v6h-6M1 20v-6h6" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                                <span className="text-sm font-bold tabular-nums leading-none" style={{ color: textStrong }}>{rockingMetrics.peak.toFixed(0)}</span>
                                <span className="text-[8px] text-violet-400 font-semibold">°/s</span>
                            </div>
                            <div className="text-[8px] font-medium uppercase tracking-wider mt-0.5" style={{ color: textSubtle }}>Peak</div>
                        </div>
                    </div>

                    <ChevronUp className="w-3.5 h-3.5 ml-1 shrink-0" style={{ color: textSubtle }} />
                </button>
            </div>
        );
    }

    /* ── Expanded: full detail panel ─────────────────────── */
    return (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
            <div className="liquid-glass rounded-2xl p-4 w-[300px] animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold leading-tight" style={{ color: textStrong }}>Pothole Monitor</h3>
                        <p className="text-[10px] font-medium" style={{ color: textSubtle }}>Real-time detection data</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                            <span className="text-[10px] text-emerald-400/70 font-medium">Live</span>
                        </div>
                        <button
                            onClick={() => setExpanded(false)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer outline-none"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                            }}
                        >
                            <ChevronDown className="w-3 h-3" style={{ color: textMuted }} />
                        </button>
                    </div>
                </div>

                {/* Total count */}
                <div className="liquid-glass-inset rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textSubtle }}>Total Detections</span>
                    <span className="text-lg font-bold tabular-nums leading-none" style={{ color: textStrong }}>{potholes.length}</span>
                </div>

                {/* Sensor metrics — stacked */}
                <div className="grid grid-cols-1 gap-2 mb-3.5">
                    {/* Shock */}
                    <div className="liquid-glass-inset rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Shock</span>
                            <span className="text-[9px] text-amber-400 font-semibold ml-auto">g</span>
                        </div>
                        <div className="flex items-end justify-between gap-1">
                            <div className="text-center flex-1">
                                <div className="text-base font-bold tabular-nums leading-none mb-0.5" style={{ color: textStrong }}>{shockMetrics.count}</div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Count</div>
                            </div>
                            <div className="w-px h-6" style={{ background: dividerBg }}></div>
                            <div className="text-center flex-1">
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <Activity className="w-2.5 h-2.5 text-amber-400/60" />
                                    <span className="text-base font-bold tabular-nums leading-none" style={{ color: textStrong }}>{shockMetrics.avg.toFixed(2)}</span>
                                </div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Avg</div>
                            </div>
                            <div className="w-px h-6" style={{ background: dividerBg }}></div>
                            <div className="text-center flex-1">
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <TrendingUp className="w-2.5 h-2.5 text-red-400/60" />
                                    <span className="text-base font-bold tabular-nums leading-none" style={{ color: textStrong }}>{shockMetrics.peak.toFixed(2)}</span>
                                </div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Peak</div>
                            </div>
                        </div>
                    </div>

                    {/* Rocking */}
                    <div className="liquid-glass-inset rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Rocking</span>
                            <span className="text-[9px] text-violet-400 font-semibold ml-auto">°/s</span>
                        </div>
                        <div className="flex items-end justify-between gap-1">
                            <div className="text-center flex-1">
                                <div className="text-base font-bold tabular-nums leading-none mb-0.5" style={{ color: textStrong }}>{rockingMetrics.count}</div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Count</div>
                            </div>
                            <div className="w-px h-6" style={{ background: dividerBg }}></div>
                            <div className="text-center flex-1">
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <Activity className="w-2.5 h-2.5 text-violet-400/60" />
                                    <span className="text-base font-bold tabular-nums leading-none" style={{ color: textStrong }}>{rockingMetrics.avg.toFixed(0)}</span>
                                </div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Avg</div>
                            </div>
                            <div className="w-px h-6" style={{ background: dividerBg }}></div>
                            <div className="text-center flex-1">
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                    <TrendingUp className="w-2.5 h-2.5 text-red-400/60" />
                                    <span className="text-base font-bold tabular-nums leading-none" style={{ color: textStrong }}>{rockingMetrics.peak.toFixed(0)}</span>
                                </div>
                                <div className="text-[8px] font-medium uppercase" style={{ color: textSubtle }}>Peak</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Severity Distribution */}
                <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: textSubtle }}>Severity Distribution</div>
                    {severityBars.map(({ label, count, color }) => (
                        <div key={label} className="flex items-center gap-2.5">
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                            />
                            <span className="text-[11px] font-medium w-14" style={{ color: textMuted }}>{label}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: barTrackBg }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${(count / maxBarCount) * 100}%`,
                                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                                        boxShadow: `0 0 8px ${color}44`
                                    }}
                                />
                            </div>
                            <span className="text-[11px] tabular-nums font-semibold w-5 text-right" style={{ color: textMuted }}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PotholeStats;
