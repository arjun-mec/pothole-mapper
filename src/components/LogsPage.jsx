import React, { useState, useMemo } from 'react';
import { ScrollText, MapPin, Activity, ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ROWS_PER_PAGE = 15;

const getSeverity = (value, type) => {
    const isRocking = type === 'Rocking';
    if (isRocking) {
        if (value < 50) return { label: 'Minor', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' };
        if (value < 120) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
        if (value < 200) return { label: 'Severe', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' };
        return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
    }
    if (value < 0.15) return { label: 'Minor', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' };
    if (value < 0.35) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
    if (value < 0.55) return { label: 'Severe', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' };
    return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
};

const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });
};

const formatValue = (value, type) => {
    if (type === 'Rocking') return `${value.toFixed(0)} °/s`;
    return `${value.toFixed(3)} g`;
};

const LogsPage = ({ potholes = [], loading = false }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', dir: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'Shock' | 'Rocking'

    // Filter + search
    const filtered = useMemo(() => {
        let items = [...potholes];
        if (filterType !== 'all') items = items.filter(p => (p.type || 'Shock') === filterType);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            items = items.filter(p =>
                p.id?.toLowerCase().includes(q) ||
                String(p.lat).includes(q) ||
                String(p.lng).includes(q) ||
                (p.type || 'Shock').toLowerCase().includes(q) ||
                getSeverity(p.value, p.type).label.toLowerCase().includes(q)
            );
        }
        return items;
    }, [potholes, filterType, searchQuery]);

    // Sort
    const sorted = useMemo(() => {
        const items = [...filtered];
        items.sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.key) {
                case 'value': aVal = a.value; bVal = b.value; break;
                case 'type': aVal = a.type || 'Shock'; bVal = b.type || 'Shock'; break;
                case 'lat': aVal = a.lat; bVal = b.lat; break;
                case 'lng': aVal = a.lng; bVal = b.lng; break;
                case 'severity':
                    aVal = getSeverity(a.value, a.type).label;
                    bVal = getSeverity(b.value, b.type).label;
                    break;
                case 'timestamp':
                default:
                    aVal = a.timestamp || 0; bVal = b.timestamp || 0; break;
            }
            if (typeof aVal === 'string') {
                const cmp = aVal.localeCompare(bVal);
                return sortConfig.dir === 'asc' ? cmp : -cmp;
            }
            return sortConfig.dir === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return items;
    }, [filtered, sortConfig]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageData = sorted.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

    const handleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'desc' }
        );
        setCurrentPage(1);
    };

    const SortIcon = ({ colKey }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown className="logs-sort-icon" />;
        return sortConfig.dir === 'asc'
            ? <ArrowUp className="logs-sort-icon logs-sort-active" />
            : <ArrowDown className="logs-sort-icon logs-sort-active" />;
    };

    const textStrong = 'var(--color-text-strong)';
    const textMuted = 'var(--color-text-muted)';
    const textSubtle = 'var(--color-text-subtle)';

    return (
        <div className="logs-page">
            <div className="logs-container liquid-glass">
                {/* Header */}
                <div className="logs-header">
                    <div className="logs-header-left">
                        <div className="logs-header-icon">
                            <ScrollText className="w-5 h-5" style={{ color: '#818cf8' }} />
                        </div>
                        <div>
                            <h2 className="logs-title" style={{ color: textStrong }}>Detection Logs</h2>
                            <p className="logs-subtitle" style={{ color: textSubtle }}>
                                {potholes.length} total records • Real-time synced
                            </p>
                        </div>
                    </div>

                    <div className="logs-header-right">
                        {/* Type filter pills */}
                        <div className="logs-filter-pills">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'Shock', label: 'Shock' },
                                { id: 'Rocking', label: 'Rocking' },
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => { setFilterType(f.id); setCurrentPage(1); }}
                                    className={`logs-filter-pill ${filterType === f.id ? 'logs-filter-pill-active' : ''}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="logs-search-wrap liquid-glass-inset">
                            <Search className="logs-search-icon" style={{ color: textSubtle }} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="logs-search-input"
                                style={{ color: 'var(--color-text)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="logs-table-wrap">
                    {loading ? (
                        <div className="logs-empty">
                            <div className="logs-empty-spinner" />
                            <span style={{ color: textMuted }}>Loading detection data...</span>
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="logs-empty">
                            <AlertTriangle className="w-8 h-8" style={{ color: textSubtle }} />
                            <span style={{ color: textMuted }}>No records found</span>
                        </div>
                    ) : (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th className="logs-th logs-th-num" style={{ color: textSubtle }}>#</th>
                                    <th className="logs-th logs-th-sortable" onClick={() => handleSort('type')} style={{ color: textSubtle }}>
                                        <span>Type</span><SortIcon colKey="type" />
                                    </th>
                                    <th className="logs-th logs-th-sortable" onClick={() => handleSort('value')} style={{ color: textSubtle }}>
                                        <span>Value</span><SortIcon colKey="value" />
                                    </th>
                                    <th className="logs-th logs-th-sortable" onClick={() => handleSort('severity')} style={{ color: textSubtle }}>
                                        <span>Severity</span><SortIcon colKey="severity" />
                                    </th>
                                    <th className="logs-th" style={{ color: textSubtle }}>
                                        <span>Location</span>
                                    </th>
                                    <th className="logs-th logs-th-sortable" onClick={() => handleSort('timestamp')} style={{ color: textSubtle }}>
                                        <span>Timestamp</span><SortIcon colKey="timestamp" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.map((p, idx) => {
                                    const severity = getSeverity(p.value, p.type);
                                    const rowNum = (safePage - 1) * ROWS_PER_PAGE + idx + 1;
                                    const typeColor = (p.type || 'Shock') === 'Shock' ? '#f59e0b' : '#8b5cf6';
                                    return (
                                        <tr key={p.id} className="logs-tr">
                                            <td className="logs-td logs-td-num" style={{ color: textSubtle }}>{rowNum}</td>
                                            <td className="logs-td">
                                                <span className="logs-type-chip" style={{
                                                    background: `${typeColor}15`,
                                                    border: `1px solid ${typeColor}30`,
                                                    color: typeColor
                                                }}>
                                                    <Activity className="w-3 h-3" />
                                                    {p.type || 'Shock'}
                                                </span>
                                            </td>
                                            <td className="logs-td">
                                                <span className="logs-value" style={{ color: textStrong }}>
                                                    {formatValue(p.value, p.type)}
                                                </span>
                                            </td>
                                            <td className="logs-td">
                                                <span className="logs-severity-badge" style={{
                                                    background: severity.bg,
                                                    border: `1px solid ${severity.border}`,
                                                    color: severity.color
                                                }}>
                                                    <span className="logs-severity-dot" style={{
                                                        background: severity.color,
                                                        boxShadow: `0 0 6px ${severity.color}66`
                                                    }} />
                                                    {severity.label}
                                                </span>
                                            </td>
                                            <td className="logs-td">
                                                <span className="logs-location" style={{ color: textMuted }}>
                                                    <MapPin className="w-3 h-3" style={{ color: textSubtle, flexShrink: 0 }} />
                                                    {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}
                                                </span>
                                            </td>
                                            <td className="logs-td">
                                                <span className="logs-timestamp" style={{ color: textMuted }}>
                                                    {formatTimestamp(p.timestamp)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer / Pagination */}
                {!loading && sorted.length > 0 && (
                    <div className="logs-footer">
                        <span className="logs-footer-info" style={{ color: textSubtle }}>
                            Showing {(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                        </span>
                        <div className="logs-pagination">
                            <button
                                disabled={safePage <= 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="logs-page-btn"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (totalPages <= 7) return true;
                                    if (page === 1 || page === totalPages) return true;
                                    if (Math.abs(page - safePage) <= 1) return true;
                                    return false;
                                })
                                .reduce((acc, page, i, arr) => {
                                    if (i > 0 && page - arr[i - 1] > 1) acc.push('...');
                                    acc.push(page);
                                    return acc;
                                }, [])
                                .map((item, i) =>
                                    item === '...' ? (
                                        <span key={`ellipsis-${i}`} className="logs-page-ellipsis" style={{ color: textSubtle }}>…</span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setCurrentPage(item)}
                                            className={`logs-page-btn ${item === safePage ? 'logs-page-btn-active' : ''}`}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}

                            <button
                                disabled={safePage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="logs-page-btn"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPage;
