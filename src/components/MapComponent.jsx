import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

/**
 * Classify a detection value into a severity tier.
 * Shock (accelerometer, in g) and Rocking (gyro, in °/s) use different thresholds.
 */
const getSeverity = (val, type = 'Shock') => {
    if (type === 'Rocking') {
        // Gyro magnitude in °/s
        if (val < 50) return { level: 'low', color: '#22c55e', label: 'Minor' };
        if (val < 120) return { level: 'medium', color: '#f59e0b', label: 'Moderate' };
        if (val < 200) return { level: 'high', color: '#f97316', label: 'Severe' };
        return { level: 'critical', color: '#ef4444', label: 'Critical' };
    }
    // Shock — accelerometer in g
    if (val < 0.15) return { level: 'low', color: '#22c55e', label: 'Minor' };
    if (val < 0.35) return { level: 'medium', color: '#f59e0b', label: 'Moderate' };
    if (val < 0.55) return { level: 'high', color: '#f97316', label: 'Severe' };
    return { level: 'critical', color: '#ef4444', label: 'Critical' };
};

/**
 * Convert a timestamp to a readable 12-hour time string in IST.
 *   - If > 1e12  → Firebase ServerValue.TIMESTAMP (epoch ms)
 *   - If > 1e9   → epoch seconds
 *   - Otherwise  → device millis() — show as 12-hour time-of-day
 */
const formatTimestampIST = (ts) => {
    if (ts == null || ts === '') return null;

    const num = Number(ts);
    if (isNaN(num)) return String(ts);

    let date;
    if (num > 1e12) {
        // Epoch milliseconds (Firebase ServerValue.TIMESTAMP)
        date = new Date(num);
    } else if (num > 1e9) {
        // Epoch seconds
        date = new Date(num * 1000);
    } else {
        // Small number (device millis/uptime) — not a real clock time
        return null;
    }

    // Format in IST (Asia/Kolkata, UTC+5:30) — 12-hour, no seconds
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const MapComponent = ({ targetLocation, route, onRoutesFound, selectedRouteIndex = 0, potholes = [] }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = React.useState(76.3289);
    const [lat] = React.useState(10.0284);
    const [zoom] = React.useState(17);
    const [lastRouteData, setLastRouteData] = React.useState(null);
    const potholeSourceAdded = useRef(false);

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [lng, lat, zoom]);

    // ── Build GeoJSON from potholes array ─────────────
    const buildGeoJSON = useCallback((data) => ({
        type: 'FeatureCollection',
        features: (data || []).map(p => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [p.lng, p.lat]
            },
            properties: {
                id: p.id,
                value: p.value,
                type: p.type || 'Shock',
                timestamp: p.timestamp,
                ...getSeverity(p.value, p.type)
            }
        }))
    }), []);

    // ── One-time layer setup (runs after map style loads) ──
    const setupPotholeLayers = useCallback(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;
        if (potholeSourceAdded.current) return; // already set up

        // Add the GeoJSON source (initially empty)
        map.current.addSource('potholes-source', {
            type: 'geojson',
            data: buildGeoJSON(potholes)
        });
        potholeSourceAdded.current = true;

        // Heatmap layer — overview at lower zoom
        map.current.addLayer({
            id: 'potholes-heat',
            type: 'heatmap',
            source: 'potholes-source',
            maxzoom: 17,
            paint: {
                'heatmap-weight': [
                    'interpolate', ['linear'], ['get', 'value'],
                    0, 0.1, 0.3, 0.5, 0.6, 1
                ],
                'heatmap-intensity': [
                    'interpolate', ['linear'], ['zoom'],
                    11, 0.8, 15, 1.5
                ],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0, 0, 0, 0)',
                    0.1, 'rgba(34, 197, 94, 0.3)',
                    0.3, 'rgba(250, 204, 21, 0.5)',
                    0.5, 'rgba(249, 115, 22, 0.6)',
                    0.7, 'rgba(239, 68, 68, 0.7)',
                    1, 'rgba(220, 38, 38, 0.9)'
                ],
                'heatmap-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    11, 8, 14, 14, 16, 18
                ],
                'heatmap-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0.7, 15, 0.4, 16, 0.15, 17, 0
                ]
            }
        });

        // Outer glow ring
        map.current.addLayer({
            id: 'potholes-glow',
            type: 'circle',
            source: 'potholes-source',
            minzoom: 14,
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 6, 17, 10, 20, 16
                ],
                'circle-color': ['get', 'color'],
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0.08, 16, 0.15
                ],
                'circle-blur': 1
            }
        });

        // Precise circle dots
        map.current.addLayer({
            id: 'potholes-circles',
            type: 'circle',
            source: 'potholes-source',
            minzoom: 13,
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 2, 15, 3.5, 17, 5, 20, 8
                ],
                'circle-color': ['get', 'color'],
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0.5, 15, 0.9
                ],
                'circle-stroke-width': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0.5, 17, 1.5
                ],
                'circle-stroke-color': 'rgba(255, 255, 255, 0.5)',
                'circle-blur': 0
            }
        });

        // Click interaction for pothole info
        map.current.on('click', 'potholes-circles', (e) => {
            const feature = e.features[0];
            const { value, type, timestamp } = feature.properties;
            const [popLng, popLat] = feature.geometry.coordinates;
            const detectionType = type || 'Shock';
            const severity = getSeverity(value, detectionType);
            const formattedTime = formatTimestampIST(timestamp);
            const val = Number(value);

            // Type-specific config
            const isShock = detectionType === 'Shock';
            const unit = isShock ? 'g' : '°/s';
            const typeIcon = isShock
                ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${severity.color}" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${severity.color}" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

            // 4-segment severity gauge
            const thresholds = isShock
                ? [{ t: 0, c: '#22c55e' }, { t: 0.15, c: '#f59e0b' }, { t: 0.35, c: '#f97316' }, { t: 0.55, c: '#ef4444' }]
                : [{ t: 0, c: '#22c55e' }, { t: 50, c: '#f59e0b' }, { t: 120, c: '#f97316' }, { t: 200, c: '#ef4444' }];
            const activeIndex = isShock
                ? (val >= 0.55 ? 3 : val >= 0.35 ? 2 : val >= 0.15 ? 1 : 0)
                : (val >= 200 ? 3 : val >= 120 ? 2 : val >= 50 ? 1 : 0);

            const gaugeHTML = thresholds.map((seg, i) => {
                const isActive = i <= activeIndex;
                const isCurrent = i === activeIndex;
                return `<div class="gauge-seg ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}" style="
                    background: ${isActive ? seg.c : 'rgba(255,255,255,0.06)'};
                    opacity: ${isActive ? (isCurrent ? 1 : 0.4) : 1};
                    ${isCurrent ? `box-shadow: 0 0 8px ${seg.c}66;` : ''}
                "></div>`;
            }).join('');

            new maplibregl.Popup({
                closeButton: true,
                closeOnClick: true,
                className: 'pothole-popup',
                maxWidth: '310px',
                offset: 14
            })
                .setLngLat([popLng, popLat])
                .setHTML(`
                    <div class="pp-card">
                        <div class="pp-accent" style="background: linear-gradient(180deg, ${severity.color}20 0%, transparent 100%);"></div>
                        <div class="pp-body">
                            <div class="pp-top">
                                <div class="pp-badge" style="background: ${severity.color}15; border-color: ${severity.color}35;">
                                    <span class="pp-dot" style="background: ${severity.color}; box-shadow: 0 0 6px ${severity.color};"></span>
                                    <span class="pp-badge-text" style="color: ${severity.color};">${severity.label}</span>
                                </div>
                                <div class="pp-type-chip">
                                    ${typeIcon}
                                    <span>${detectionType}</span>
                                </div>
                            </div>

                            <div class="pp-gauge-row">
                                <div class="pp-gauge">${gaugeHTML}</div>
                                <div class="pp-val-group">
                                    <span class="pp-shock-val" style="color: ${severity.color};">${isShock ? val.toFixed(2) : val.toFixed(0)}</span>
                                    <span class="pp-val-unit" style="color: ${severity.color};">${unit}</span>
                                </div>
                            </div>

                            <div class="pp-divider"></div>

                            <div class="pp-info-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span class="pp-info-text">${popLat.toFixed(5)}, ${popLng.toFixed(5)}</span>
                            </div>
                            ${formattedTime ? `
                            <div class="pp-info-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span class="pp-info-text">${formattedTime}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `)
                .addTo(map.current);
        });

        // Cursor change on hover
        map.current.on('mouseenter', 'potholes-circles', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'potholes-circles', () => {
            map.current.getCanvas().style.cursor = '';
        });
    }, []); // intentionally stable — layers are created once

    // ── Initialize layers once when map is ready ──────────
    useEffect(() => {
        if (!map.current) return;

        if (map.current.isStyleLoaded()) {
            setupPotholeLayers();
        } else {
            map.current.once('load', setupPotholeLayers);
        }
    }, [setupPotholeLayers]);

    // ── Update source data when potholes change ──────────
    // This is the efficient path — only the GeoJSON data is swapped,
    // layers/styles stay intact. No teardown, no rebuild.
    useEffect(() => {
        if (!map.current || !potholeSourceAdded.current) return;

        const source = map.current.getSource('potholes-source');
        if (source) {
            source.setData(buildGeoJSON(potholes));
        }
    }, [potholes, buildGeoJSON]);

    // ── Existing marker helper ─────────────────────────
    const addMarker = (lng, lat, type = 'start') => {
        if (!map.current) return null;

        const el = document.createElement('div');
        el.className = 'marker-container';
        el.innerHTML = `
            <div class="${type === 'start' ? 'marker-start' : 'marker-dest'} w-full h-full flex items-center justify-center relative">
                <div class="marker-ring w-full h-full absolute"></div>
                <div class="marker-core w-4 h-4 rounded-full z-10 relative"></div>
            </div>
        `;

        return new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setOffset([0, 0])
            .addTo(map.current);
    };

    const startMarker = useRef(null);
    const endMarker = useRef(null);

    // Handle single target location flyTo
    useEffect(() => {
        if (targetLocation && map.current) {
            const { lat, lng, lon } = targetLocation;
            map.current.flyTo({
                center: [lng || lon, lat],
                zoom: 14,
                essential: true
            });

            if (startMarker.current) startMarker.current.remove();
            if (endMarker.current) endMarker.current.remove();
            endMarker.current = addMarker(lng || lon, lat, 'dest');
        }
    }, [targetLocation]);

    // Helper to cleanup all route layers and sources
    const cleanupRoutes = () => {
        if (!map.current) return;
        for (let i = 0; i < 5; i++) {
            const layerId = `route-alt-core-${i}`;
            if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
            const sourceId = `route-alt-${i}`;
            if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
        }
        if (map.current.getLayer('route-core')) map.current.removeLayer('route-core');
        if (map.current.getLayer('route-glow')) map.current.removeLayer('route-glow');
        if (map.current.getSource('route')) map.current.removeSource('route');
    };

    // Main Route Fetching — OpenRouteService Directions API
    useEffect(() => {
        if (!map.current || !route) {
            cleanupRoutes();
            if (startMarker.current) { startMarker.current.remove(); startMarker.current = null; }
            if (endMarker.current) { endMarker.current.remove(); endMarker.current = null; }
            setLastRouteData(null);
            return;
        }

        const fetchRoute = async () => {
            const { start, end } = route;
            if (!start || !end) return;

            const startLng = start.lng || start.lon;
            const endLng = end.lng || end.lon;

            if (startMarker.current) startMarker.current.remove();
            startMarker.current = addMarker(startLng, start.lat, 'start');
            if (endMarker.current) endMarker.current.remove();
            endMarker.current = addMarker(endLng, end.lat, 'dest');

            try {
                const response = await fetch(
                    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': ORS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            coordinates: [
                                [startLng, start.lat],
                                [endLng, end.lat]
                            ],
                            alternative_routes: {
                                share_factor: 0.6,
                                target_count: 3,
                                weight_factor: 1.6
                            }
                        })
                    }
                );
                const data = await response.json();

                let allRoutes = [];

                if (data.features && data.features.length > 0) {
                    allRoutes = data.features.map(feature => ({
                        geometry: feature.geometry,
                        distance: feature.properties.summary.distance,
                        duration: feature.properties.summary.duration
                    }));
                }

                // Deduplicate
                const uniqueRoutes = [allRoutes[0]];
                for (let i = 1; i < allRoutes.length; i++) {
                    const candidate = allRoutes[i];
                    const isDuplicate = uniqueRoutes.some(existing => {
                        const distDiff = Math.abs(existing.distance - candidate.distance) / Math.max(existing.distance, 1);
                        const durDiff = Math.abs(existing.duration - candidate.duration) / Math.max(existing.duration, 1);
                        return distDiff < 0.03 && durDiff < 0.03;
                    });
                    if (!isDuplicate) uniqueRoutes.push(candidate);
                }
                allRoutes = uniqueRoutes.slice(0, 3);

                // Sort by duration (fastest first)
                allRoutes.sort((a, b) => a.duration - b.duration);

                if (allRoutes.length > 0) {
                    setLastRouteData(allRoutes);
                    const routeInfos = allRoutes.map((r, i) => ({
                        distance: r.distance,
                        duration: r.duration,
                        index: i
                    }));
                    if (onRoutesFound) onRoutesFound(routeInfos);

                    const allBounds = new maplibregl.LngLatBounds();
                    allRoutes.forEach(r => r.geometry.coordinates.forEach(coord => allBounds.extend(coord)));
                    map.current.fitBounds(allBounds, { padding: 100 });
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        };

        fetchRoute();
    }, [route]);

    // Layer Management — re-renders when selectedRouteIndex or lastRouteData changes
    useEffect(() => {
        if (!map.current || !lastRouteData) return;

        cleanupRoutes();

        // 1) Render unselected routes (background, subtle)
        lastRouteData.forEach((r, idx) => {
            if (idx === selectedRouteIndex) return;
            const sourceId = `route-alt-${idx}`;
            const layerId = `route-alt-core-${idx}`;

            map.current.addSource(sourceId, {
                type: 'geojson',
                data: { type: 'Feature', geometry: r.geometry }
            });

            map.current.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-width': 5, 'line-color': '#94a3b8', 'line-opacity': 0.5 }
            });
        });

        // 2) Render selected route (foreground, prominent)
        const selected = lastRouteData[selectedRouteIndex];

        map.current.addSource('route', {
            type: 'geojson',
            lineMetrics: true,
            data: { type: 'Feature', geometry: selected.geometry }
        });

        map.current.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#6366f1', 'line-width': 14, 'line-opacity': 0.25, 'line-blur': 4 }
        });

        map.current.addLayer({
            id: 'route-core',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-width': 6,
                'line-gradient': [
                    'interpolate', ['linear'], ['line-progress'],
                    0, '#6366f1', 0.5, '#3b82f6', 1, '#a78bfa'
                ]
            }
        });

    }, [selectedRouteIndex, lastRouteData]);

    return (
        <div className="map-wrap relative w-full h-full">
            <div ref={mapContainer} className="map w-full h-full absolute top-0 left-0" />
        </div>
    );
};

export default MapComponent;
