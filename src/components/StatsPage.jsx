import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area,
    RadialBarChart, RadialBar,
    ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
    AlertTriangle, Activity, TrendingUp, Zap, RotateCcw,
    Gauge, Target, MapPin, Clock, Loader2,
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────── */

const getSeverity = (value, type) => {
    const isRocking = type === 'Rocking';
    if (isRocking) {
        if (value < 50) return 'Minor';
        if (value < 120) return 'Moderate';
        if (value < 200) return 'Severe';
        return 'Critical';
    }
    if (value < 0.15) return 'Minor';
    if (value < 0.35) return 'Moderate';
    if (value < 0.55) return 'Severe';
    return 'Critical';
};

const SEVERITY_COLORS = {
    Minor: '#22c55e',
    Moderate: '#f59e0b',
    Severe: '#f97316',
    Critical: '#ef4444',
};

const SEVERITY_ORDER = ['Minor', 'Moderate', 'Severe', 'Critical'];

/* ─── custom tooltip ───────────────────────────────────── */

const GlassTooltip = ({ active, payload, label, isDark }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: isDark
                ? 'linear-gradient(145deg, rgba(20,20,20,0.92), rgba(0,0,0,0.96))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,242,248,0.98))',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.6)'
                : '0 8px 32px rgba(0,0,0,0.08)',
        }}>
            {label && (
                <p style={{
                    margin: '0 0 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>{label}</p>
            )}
            {payload.map((entry, i) => (
                <p key={i} style={{
                    margin: '2px 0',
                    fontSize: 13,
                    fontWeight: 600,
                    color: entry.color || (isDark ? 'rgba(255,255,255,0.87)' : 'rgba(15,23,42,0.87)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: entry.color || '#818cf8',
                        boxShadow: `0 0 6px ${entry.color || '#818cf8'}66`,
                        flexShrink: 0,
                    }} />
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                </p>
            ))}
        </div>
    );
};

/* ─── bento card wrapper ───────────────────────────────── */

const BentoCard = ({ children, className = '', style = {} }) => (
    <div
        className={`liquid-glass ${className}`}
        style={{
            borderRadius: 20,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...style,
        }}
    >
        {children}
    </div>
);

const CardHeader = ({ icon: Icon, iconColor, title, subtitle, isDark }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: `${iconColor}15`,
            border: `1px solid ${iconColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
        }}>
            <Icon style={{ width: 18, height: 18, color: iconColor }} />
        </div>
        <div>
            <h3 style={{
                margin: 0, fontSize: 14, fontWeight: 600,
                color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
                lineHeight: 1.3,
            }}>{title}</h3>
            {subtitle && (
                <p style={{
                    margin: 0, fontSize: 11, fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                }}>{subtitle}</p>
            )}
        </div>
    </div>
);

/* ─── stat "big number" mini card ──────────────────────── */

const StatMini = ({ icon: Icon, iconColor, label, value, unit, isDark }) => (
    <div className="liquid-glass-inset" style={{
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        minWidth: 0,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${iconColor}12`,
                border: `1px solid ${iconColor}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon style={{ width: 14, height: 14, color: iconColor }} />
            </div>
            <span style={{
                fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
            }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
                fontSize: 28, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
            }}>{value}</span>
            {unit && (
                <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: iconColor, opacity: 0.8,
                }}>{unit}</span>
            )}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

const StatsPage = ({ potholes = [], loading = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    /* ── derived data ─────────────────────────────────────── */

    const stats = useMemo(() => {
        if (!potholes.length) return null;

        const shockItems = potholes.filter(p => (p.type || 'Shock') === 'Shock');
        const rockingItems = potholes.filter(p => p.type === 'Rocking');

        const shockVals = shockItems.map(p => p.value || 0);
        const rockingVals = rockingItems.map(p => p.value || 0);

        const shockPeak = shockVals.length ? Math.max(...shockVals) : 0;
        const rockingPeak = rockingVals.length ? Math.max(...rockingVals) : 0;
        const shockAvg = shockVals.length ? shockVals.reduce((a, b) => a + b, 0) / shockVals.length : 0;
        const rockingAvg = rockingVals.length ? rockingVals.reduce((a, b) => a + b, 0) / rockingVals.length : 0;

        // severity counts
        const severityCounts = { Minor: 0, Moderate: 0, Severe: 0, Critical: 0 };
        potholes.forEach(p => { severityCounts[getSeverity(p.value || 0, p.type || 'Shock')]++; });

        // severity pie data
        const severityPie = SEVERITY_ORDER.map(s => ({
            name: s,
            value: severityCounts[s],
            color: SEVERITY_COLORS[s],
        })).filter(d => d.value > 0);

        // type split
        const typePie = [
            { name: 'Shock', value: shockItems.length, color: '#f59e0b' },
            { name: 'Rocking', value: rockingItems.length, color: '#8b5cf6' },
        ].filter(d => d.value > 0);

        // hourly distribution
        const hourMap = {};
        potholes.forEach(p => {
            if (!p.timestamp) return;
            const d = new Date(p.timestamp);
            if (isNaN(d.getTime())) return;
            const h = d.getHours();
            const label = `${h.toString().padStart(2, '0')}:00`;
            if (!hourMap[label]) hourMap[label] = { hour: label, shock: 0, rocking: 0 };
            if ((p.type || 'Shock') === 'Shock') hourMap[label].shock++;
            else hourMap[label].rocking++;
        });
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
            const label = `${i.toString().padStart(2, '0')}:00`;
            return hourMap[label] || { hour: label, shock: 0, rocking: 0 };
        });

        // daily distribution
        const dayMap = {};
        potholes.forEach(p => {
            if (!p.timestamp) return;
            const d = new Date(p.timestamp);
            if (isNaN(d.getTime())) return;
            const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            if (!dayMap[key]) dayMap[key] = { date: key, count: 0, shock: 0, rocking: 0 };
            dayMap[key].count++;
            if ((p.type || 'Shock') === 'Shock') dayMap[key].shock++;
            else dayMap[key].rocking++;
        });
        const dailyData = Object.values(dayMap).sort((a, b) => {
            // parse back
            const parse = s => new Date(s + ' 2026');
            return parse(a.date) - parse(b.date);
        });

        // value distribution (histogram-like)
        const shockBuckets = [
            { range: '0–0.15', min: 0, max: 0.15, count: 0 },
            { range: '0.15–0.35', min: 0.15, max: 0.35, count: 0 },
            { range: '0.35–0.55', min: 0.35, max: 0.55, count: 0 },
            { range: '0.55+', min: 0.55, max: Infinity, count: 0 },
        ];
        shockItems.forEach(p => {
            const v = p.value || 0;
            const bucket = shockBuckets.find(b => v >= b.min && v < b.max);
            if (bucket) bucket.count++;
        });

        const rockingBuckets = [
            { range: '0–50', min: 0, max: 50, count: 0 },
            { range: '50–120', min: 50, max: 120, count: 0 },
            { range: '120–200', min: 120, max: 200, count: 0 },
            { range: '200+', min: 200, max: Infinity, count: 0 },
        ];
        rockingItems.forEach(p => {
            const v = p.value || 0;
            const bucket = rockingBuckets.find(b => v >= b.min && v < b.max);
            if (bucket) bucket.count++;
        });

        // scatter data for shock vs rocking map position
        const scatterData = potholes.map(p => ({
            lat: p.lat,
            lng: p.lng,
            value: p.value || 0,
            type: p.type || 'Shock',
            severity: getSeverity(p.value || 0, p.type || 'Shock'),
        }));

        // radial gauge data for severity distribution
        const total = potholes.length;
        const radialData = SEVERITY_ORDER.map(s => ({
            name: s,
            value: Math.round((severityCounts[s] / total) * 100),
            fill: SEVERITY_COLORS[s],
        })).reverse();

        // recent 5
        const recent = [...potholes]
            .filter(p => p.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        return {
            total: potholes.length,
            shockCount: shockItems.length,
            rockingCount: rockingItems.length,
            shockPeak, rockingPeak, shockAvg, rockingAvg,
            severityCounts, severityPie, typePie,
            hourlyData, dailyData,
            shockBuckets, rockingBuckets,
            scatterData, radialData, recent,
        };
    }, [potholes]);

    /* ── chart axis / grid styles ─────────────────────────── */

    const axisColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)';
    const axisTickColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';

    /* ── loading / empty ──────────────────────────────────── */

    if (loading) {
        return (
            <div className="stats-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="liquid-glass" style={{ borderRadius: 20, padding: '32px 48px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)' }}>
                        Loading statistics...
                    </span>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="stats-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="liquid-glass" style={{ borderRadius: 20, padding: '32px 48px', textAlign: 'center' }}>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)' }} />
                    <p style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)' }}>
                        No detection data available
                    </p>
                </div>
            </div>
        );
    }

    /* ── render ────────────────────────────────────────────── */

    const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                fontSize={11} fontWeight={700}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="stats-page">
            <div className="stats-scroll">
                {/* ── Page header ──────────────────────────────── */}
                <div className="stats-page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        }}>
                            <Activity style={{ width: 22, height: 22, color: 'white' }} />
                        </div>
                        <div>
                            <h1 style={{
                                margin: 0, fontSize: 22, fontWeight: 700,
                                color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
                                letterSpacing: '-0.02em',
                            }}>Statistics</h1>
                            <p style={{
                                margin: 0, fontSize: 13, fontWeight: 500,
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)',
                            }}>
                                {stats.total} detections • Real-time synced
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                            animation: 'pulse 2s ease-in-out infinite',
                        }} />
                        <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: '#22c55e',
                            opacity: 0.8,
                        }}>Live</span>
                    </div>
                </div>

                {/* ── Row 1: KPI cards ─────────────────────────── */}
                <div className="stats-bento-row stats-kpi-row">
                    <StatMini icon={AlertTriangle} iconColor="#ef4444" label="Total Detections" value={stats.total} isDark={isDark} />
                    <StatMini icon={Zap} iconColor="#f59e0b" label="Shock Events" value={stats.shockCount} isDark={isDark} />
                    <StatMini icon={RotateCcw} iconColor="#8b5cf6" label="Rocking Events" value={stats.rockingCount} isDark={isDark} />
                    <StatMini icon={TrendingUp} iconColor="#f59e0b" label="Peak Shock" value={stats.shockPeak.toFixed(2)} unit="g" isDark={isDark} />
                    <StatMini icon={Gauge} iconColor="#8b5cf6" label="Peak Rocking" value={stats.rockingPeak.toFixed(0)} unit="°/s" isDark={isDark} />
                </div>

                {/* ── Row 2: Severity Pie + Type Split + Severity Radial */}
                <div className="stats-bento-row stats-charts-row">
                    {/* Severity Distribution — Donut */}
                    <BentoCard style={{ flex: '1 1 340px' }}>
                        <CardHeader icon={Target} iconColor="#ef4444" title="Severity Distribution" subtitle="Breakdown by severity level" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.severityPie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                        stroke="none"
                                    >
                                        {stats.severityPie.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span style={{
                                                fontSize: 12, fontWeight: 500,
                                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                            }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>

                    {/* Type Split — Donut */}
                    <BentoCard style={{ flex: '1 1 280px' }}>
                        <CardHeader icon={Activity} iconColor="#818cf8" title="Detection Type" subtitle="Shock vs Rocking events" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.typePie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomPieLabel}
                                        stroke="none"
                                    >
                                        {stats.typePie.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span style={{
                                                fontSize: 12, fontWeight: 500,
                                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                            }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>

                    {/* Severity Gauge — Radial Bar */}
                    <BentoCard style={{ flex: '1 1 320px' }}>
                        <CardHeader icon={Gauge} iconColor="#f97316" title="Severity Gauge" subtitle="Percentage by category" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="20%"
                                    outerRadius="90%"
                                    barSize={14}
                                    data={stats.radialData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        background={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                                        dataKey="value"
                                        cornerRadius={7}
                                    />
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={8}
                                        payload={stats.radialData.map(d => ({
                                            value: `${d.name} (${d.value}%)`,
                                            type: 'circle',
                                            color: d.fill,
                                        }))}
                                        formatter={(value) => (
                                            <span style={{
                                                fontSize: 11, fontWeight: 500,
                                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                            }}>{value}</span>
                                        )}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>
                </div>

                {/* ── Row 3: Hourly Activity Area Chart (full width) ─ */}
                <div className="stats-bento-row">
                    <BentoCard style={{ flex: 1 }}>
                        <CardHeader icon={Clock} iconColor="#818cf8" title="Hourly Activity" subtitle="Detection count by hour of day" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradShock" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradRocking" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis
                                        dataKey="hour"
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                        interval={2}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Area type="monotone" dataKey="shock" name="Shock" stroke="#f59e0b" fillOpacity={1} fill="url(#gradShock)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="rocking" name="Rocking" stroke="#8b5cf6" fillOpacity={1} fill="url(#gradRocking)" strokeWidth={2} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span style={{
                                                fontSize: 12, fontWeight: 500,
                                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                            }}>{value}</span>
                                        )}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>
                </div>

                {/* ── Row 4: Value Distribution Bars + Daily Trend ── */}
                <div className="stats-bento-row stats-charts-row">
                    {/* Shock Value Distribution */}
                    <BentoCard style={{ flex: '1 1 360px' }}>
                        <CardHeader icon={Zap} iconColor="#f59e0b" title="Shock Distribution" subtitle="Value range frequency (g)" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.shockBuckets} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis
                                        dataKey="range"
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Bar
                                        dataKey="count"
                                        name="Shock Events"
                                        fill="#f59e0b"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                    >
                                        {stats.shockBuckets.map((entry, i) => {
                                            const colors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];
                                            return <Cell key={i} fill={colors[i]} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>

                    {/* Rocking Value Distribution */}
                    <BentoCard style={{ flex: '1 1 360px' }}>
                        <CardHeader icon={RotateCcw} iconColor="#8b5cf6" title="Rocking Distribution" subtitle="Value range frequency (°/s)" isDark={isDark} />
                        <div style={{ flex: 1, minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.rockingBuckets} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis
                                        dataKey="range"
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: axisTickColor }}
                                        axisLine={{ stroke: axisColor }}
                                        tickLine={{ stroke: axisColor }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                    <Bar
                                        dataKey="count"
                                        name="Rocking Events"
                                        fill="#8b5cf6"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={48}
                                    >
                                        {stats.rockingBuckets.map((entry, i) => {
                                            const colors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];
                                            return <Cell key={i} fill={colors[i]} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </BentoCard>
                </div>

                {/* ── Row 5: Daily Trend (full width) ───────────── */}
                {stats.dailyData.length > 0 && (
                    <div className="stats-bento-row">
                        <BentoCard style={{ flex: 1 }}>
                            <CardHeader icon={TrendingUp} iconColor="#22c55e" title="Daily Trend" subtitle="Detections over time" isDark={isDark} />
                            <div style={{ flex: 1, minHeight: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: axisTickColor }}
                                            axisLine={{ stroke: axisColor }}
                                            tickLine={{ stroke: axisColor }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: axisTickColor }}
                                            axisLine={{ stroke: axisColor }}
                                            tickLine={{ stroke: axisColor }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip content={<GlassTooltip isDark={isDark} />} />
                                        <Bar dataKey="shock" name="Shock" stackId="stack" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={32} />
                                        <Bar dataKey="rocking" name="Rocking" stackId="stack" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                                <span style={{
                                                    fontSize: 12, fontWeight: 500,
                                                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                                                }}>{value}</span>
                                            )}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </BentoCard>
                    </div>
                )}

                {/* ── Row 6: Recent Detections + Averages ─────── */}
                <div className="stats-bento-row stats-charts-row">
                    {/* Average Values */}
                    <BentoCard style={{ flex: '1 1 340px' }}>
                        <CardHeader icon={Activity} iconColor="#06b6d4" title="Average Values" subtitle="Mean readings per type" isDark={isDark} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
                            {/* Shock avg */}
                            <div className="liquid-glass-inset" style={{ borderRadius: 12, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)' }}>
                                            Shock Average
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#f59e0b' }}>
                                        {stats.shockAvg.toFixed(3)}
                                        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3, opacity: 0.7 }}>g</span>
                                    </span>
                                </div>
                                <div style={{
                                    height: 6, borderRadius: 3, overflow: 'hidden',
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: 3,
                                        width: `${Math.min((stats.shockAvg / stats.shockPeak) * 100, 100)}%`,
                                        background: 'linear-gradient(90deg, #f59e0b88, #f59e0b)',
                                        boxShadow: '0 0 8px #f59e0b44',
                                        transition: 'width 0.7s ease-out',
                                    }} />
                                </div>
                            </div>

                            {/* Rocking avg */}
                            <div className="liquid-glass-inset" style={{ borderRadius: 12, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <RotateCcw style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)' }}>
                                            Rocking Average
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#8b5cf6' }}>
                                        {stats.rockingAvg.toFixed(0)}
                                        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3, opacity: 0.7 }}>°/s</span>
                                    </span>
                                </div>
                                <div style={{
                                    height: 6, borderRadius: 3, overflow: 'hidden',
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: 3,
                                        width: `${Math.min((stats.rockingAvg / (stats.rockingPeak || 1)) * 100, 100)}%`,
                                        background: 'linear-gradient(90deg, #8b5cf688, #8b5cf6)',
                                        boxShadow: '0 0 8px #8b5cf644',
                                        transition: 'width 0.7s ease-out',
                                    }} />
                                </div>
                            </div>

                            {/* Severity summary row */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {SEVERITY_ORDER.map(s => (
                                    <div key={s} className="liquid-glass-inset" style={{
                                        borderRadius: 10, padding: '10px 14px',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        flex: '1 1 auto',
                                    }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: SEVERITY_COLORS[s],
                                            boxShadow: `0 0 6px ${SEVERITY_COLORS[s]}66`,
                                            flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 500,
                                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                                        }}>{s}</span>
                                        <span style={{
                                            fontSize: 14, fontWeight: 700,
                                            fontVariantNumeric: 'tabular-nums',
                                            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)',
                                            marginLeft: 'auto',
                                        }}>{stats.severityCounts[s]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </BentoCard>

                    {/* Recent Detections */}
                    <BentoCard style={{ flex: '1 1 400px' }}>
                        <CardHeader icon={MapPin} iconColor="#22c55e" title="Recent Detections" subtitle="Latest 5 recorded events" isDark={isDark} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            {stats.recent.map((p, i) => {
                                const severity = getSeverity(p.value || 0, p.type || 'Shock');
                                const typeColor = (p.type || 'Shock') === 'Shock' ? '#f59e0b' : '#8b5cf6';
                                const ts = p.timestamp ? new Date(p.timestamp) : null;
                                const timeStr = ts && !isNaN(ts.getTime())
                                    ? ts.toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short',
                                        hour: '2-digit', minute: '2-digit',
                                        hour12: true,
                                    })
                                    : '—';
                                return (
                                    <div key={p.id || i} className="liquid-glass-inset" style={{
                                        borderRadius: 12, padding: '12px 14px',
                                        display: 'flex', alignItems: 'center', gap: 12,
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: `${typeColor}12`,
                                            border: `1px solid ${typeColor}25`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {(p.type || 'Shock') === 'Shock'
                                                ? <Zap style={{ width: 14, height: 14, color: typeColor }} />
                                                : <RotateCcw style={{ width: 14, height: 14, color: typeColor }} />
                                            }
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    fontSize: 13, fontWeight: 600,
                                                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)',
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {(p.type || 'Shock') === 'Shock'
                                                        ? `${(p.value || 0).toFixed(3)} g`
                                                        : `${(p.value || 0).toFixed(0)} °/s`
                                                    }
                                                </span>
                                                <span style={{
                                                    fontSize: 9.5, fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    padding: '2px 7px',
                                                    borderRadius: 20,
                                                    background: `${SEVERITY_COLORS[severity]}15`,
                                                    border: `1px solid ${SEVERITY_COLORS[severity]}30`,
                                                    color: SEVERITY_COLORS[severity],
                                                }}>{severity}</span>
                                            </div>
                                            <div style={{
                                                fontSize: 11, fontWeight: 500,
                                                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.35)',
                                                marginTop: 2,
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                <MapPin style={{ width: 10, height: 10, opacity: 0.6, flexShrink: 0 }} />
                                                {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 10, fontWeight: 500,
                                            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}>{timeStr}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </BentoCard>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
