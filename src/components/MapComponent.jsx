import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../context/ThemeContext';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

/**
 * Classify a detection value into a severity tier.
 */
const getSeverity = (val, type = 'Shock') => {
    if (type === 'Rocking') {
        if (val < 50) return { level: 'low', color: '#10b981', label: 'Minor' };
        if (val < 120) return { level: 'medium', color: '#eab308', label: 'Moderate' };
        if (val < 200) return { level: 'high', color: '#f97316', label: 'Severe' };
        return { level: 'critical', color: '#ef4444', label: 'Critical' };
    }
    if (val < 0.15) return { level: 'low', color: '#10b981', label: 'Minor' };
    if (val < 0.35) return { level: 'medium', color: '#eab308', label: 'Moderate' };
    if (val < 0.55) return { level: 'high', color: '#f97316', label: 'Severe' };
    return { level: 'critical', color: '#ef4444', label: 'Critical' };
};

/**
 * Convert a timestamp to a readable 12-hour time string in IST.
 */
const formatTimestampIST = (ts) => {
    if (ts == null || ts === '') return null;
    const num = Number(ts);
    if (isNaN(num)) return String(ts);
    let date;
    if (num > 1e12) date = new Date(num);
    else if (num > 1e9) date = new Date(num * 1000);
    else return null;
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short',
        year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
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
    const { theme } = useTheme();

    // ── Refs for latest data (avoids stale closures in callbacks) ──
    const themeRef = useRef(theme);
    themeRef.current = theme;
    const potholesRef = useRef(potholes);
    potholesRef.current = potholes;
    const lastRouteDataRef = useRef(lastRouteData);
    lastRouteDataRef.current = lastRouteData;
    const selectedRouteIndexRef = useRef(selectedRouteIndex);
    selectedRouteIndexRef.current = selectedRouteIndex;

    // ── Build GeoJSON from potholes array ─────────────
    const buildGeoJSON = useCallback((data) => ({
        type: 'FeatureCollection',
        features: (data || []).map(p => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: {
                id: p.id, value: p.value, type: p.type || 'Shock',
                timestamp: p.timestamp, ...getSeverity(p.value, p.type)
            }
        }))
    }), []);

    // ── Add pothole source + layers to the map ──
    // Uses refs so it always has the latest data, even in async callbacks.
    const addPotholeLayers = useCallback(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        // Clean up if source already exists (defensive)
        if (map.current.getSource('potholes-source')) {
            if (map.current.getLayer('potholes-heat')) map.current.removeLayer('potholes-heat');
            if (map.current.getLayer('potholes-glow')) map.current.removeLayer('potholes-glow');
            if (map.current.getLayer('potholes-circles')) map.current.removeLayer('potholes-circles');
            map.current.removeSource('potholes-source');
        }

        // Always read from ref for latest data
        const currentPotholes = potholesRef.current;
        const isDark = themeRef.current === 'dark';

        map.current.addSource('potholes-source', {
            type: 'geojson',
            data: buildGeoJSON(currentPotholes)
        });
        potholeSourceAdded.current = true;

        // Heatmap
        map.current.addLayer({
            id: 'potholes-heat', type: 'heatmap', source: 'potholes-source', maxzoom: 17,
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0.1, 0.3, 0.5, 0.6, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 0.8, 15, 1.5],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0,0,0,0)', 0.1, 'rgba(34,197,94,0.3)',
                    0.3, 'rgba(250,204,21,0.5)', 0.5, 'rgba(249,115,22,0.6)',
                    0.7, 'rgba(239,68,68,0.7)', 1, 'rgba(220,38,38,0.9)'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 8, 14, 14, 16, 18],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.7, 15, 0.4, 16, 0.15, 17, 0]
            }
        });

        // Outer glow
        map.current.addLayer({
            id: 'potholes-glow', type: 'circle', source: 'potholes-source', minzoom: 14,
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 6, 17, 10, 20, 16],
                'circle-color': ['get', 'color'],
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.08, 16, 0.15],
                'circle-blur': 1
            }
        });

        // Precise circles
        map.current.addLayer({
            id: 'potholes-circles', type: 'circle', source: 'potholes-source', minzoom: 13,
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2, 15, 3.5, 17, 5, 20, 8],
                'circle-color': ['get', 'color'],
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 15, 0.9],
                'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 17, 1.5],
                'circle-stroke-color': isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)',
                'circle-blur': 0
            }
        });

        // Click interaction
        map.current.on('click', 'potholes-circles', (e) => {
            const feature = e.features[0];
            const { value, type, timestamp } = feature.properties;
            const [popLng, popLat] = feature.geometry.coordinates;
            const detectionType = type || 'Shock';
            const severity = getSeverity(value, detectionType);
            const formattedTime = formatTimestampIST(timestamp);
            const val = Number(value);
            const isLight = themeRef.current === 'light';

            const isShock = detectionType === 'Shock';
            const unit = isShock ? 'g' : '°/s';
            const typeIcon = isShock
                ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${severity.color}" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${severity.color}" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;

            const thresholds = isShock
                ? [{ t: 0, c: '#22c55e' }, { t: 0.15, c: '#f59e0b' }, { t: 0.35, c: '#f97316' }, { t: 0.55, c: '#ef4444' }]
                : [{ t: 0, c: '#22c55e' }, { t: 50, c: '#f59e0b' }, { t: 120, c: '#f97316' }, { t: 200, c: '#ef4444' }];
            const activeIndex = isShock
                ? (val >= 0.55 ? 3 : val >= 0.35 ? 2 : val >= 0.15 ? 1 : 0)
                : (val >= 200 ? 3 : val >= 120 ? 2 : val >= 50 ? 1 : 0);

            const inactiveSegBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
            const gaugeHTML = thresholds.map((seg, i) => {
                const isActive = i <= activeIndex;
                const isCurrent = i === activeIndex;
                return `<div class="gauge-seg ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}" style="
                    background: ${isActive ? seg.c : inactiveSegBg};
                    opacity: ${isActive ? (isCurrent ? 1 : 0.4) : 1};
                    ${isCurrent ? `box-shadow: 0 0 8px ${seg.c}66;` : ''}
                "></div>`;
            }).join('');

            const infoIconStroke = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';

            new maplibregl.Popup({
                closeButton: true, closeOnClick: true,
                className: 'pothole-popup', maxWidth: '310px', offset: 14
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${infoIconStroke}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span class="pp-info-text">${popLat.toFixed(5)}, ${popLng.toFixed(5)}</span>
                            </div>
                            ${formattedTime ? `
                            <div class="pp-info-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${infoIconStroke}" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span class="pp-info-text">${formattedTime}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `)
                .addTo(map.current);
        });

        map.current.on('mouseenter', 'potholes-circles', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'potholes-circles', () => {
            map.current.getCanvas().style.cursor = '';
        });
    }, [buildGeoJSON]);

    // ── Helper to cleanup all route layers and sources ──
    const cleanupRoutes = useCallback(() => {
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
    }, []);

    // ── Shared route rendering function ──
    const renderRoutes = useCallback((routeData, activeIndex) => {
        if (!map.current || !routeData) return;
        cleanupRoutes();

        routeData.forEach((r, idx) => {
            if (idx === activeIndex) return;
            const sourceId = `route-alt-${idx}`;
            const layerId = `route-alt-core-${idx}`;
            map.current.addSource(sourceId, {
                type: 'geojson', data: { type: 'Feature', geometry: r.geometry }
            });
            map.current.addLayer({
                id: layerId, type: 'line', source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-width': 5, 'line-color': '#94a3b8', 'line-opacity': 0.5 }
            });
        });

        const selected = routeData[activeIndex];
        map.current.addSource('route', {
            type: 'geojson', lineMetrics: true,
            data: { type: 'Feature', geometry: selected.geometry }
        });
        map.current.addLayer({
            id: 'route-glow', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#6366f1', 'line-width': 14, 'line-opacity': 0.25, 'line-blur': 4 }
        });
        map.current.addLayer({
            id: 'route-core', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-width': 6,
                'line-gradient': [
                    'interpolate', ['linear'], ['line-progress'],
                    0, '#6366f1', 0.5, '#3b82f6', 1, '#a78bfa'
                ]
            }
        });
    }, [cleanupRoutes]);

    // ── Initialize map ──────────────────────────────
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: themeRef.current === 'dark' ? DARK_STYLE : LIGHT_STYLE,
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.once('load', () => {
            addPotholeLayers();
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [lng, lat, zoom]);

    // Keep refs to the latest layer-adding functions (avoids stale closures)
    const addPotholeLayersRef = useRef(addPotholeLayers);
    addPotholeLayersRef.current = addPotholeLayers;
    const renderRoutesRef = useRef(renderRoutes);
    renderRoutesRef.current = renderRoutes;

    // ── Theme change — swap map style ──────────────
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!map.current) return;

        const newStyle = theme === 'dark' ? DARK_STYLE : LIGHT_STYLE;

        // Save camera state
        const center = map.current.getCenter();
        const currentZoom = map.current.getZoom();
        const bearing = map.current.getBearing();
        const pitch = map.current.getPitch();

        // Mark layers as removed (setStyle clears everything)
        potholeSourceAdded.current = false;

        const mapRef = map.current;
        let cancelled = false;

        const reAddLayers = () => {
            if (cancelled || !mapRef) return;
            // Restore camera
            mapRef.jumpTo({ center, zoom: currentZoom, bearing, pitch });

            // Re-add all layers (reads from refs for latest data)
            addPotholeLayersRef.current();

            // Re-add routes if present
            const routes = lastRouteDataRef.current;
            if (routes) {
                renderRoutesRef.current(routes, selectedRouteIndexRef.current);
            }
        };

        mapRef.setStyle(newStyle);

        // Use the 'load' event (not style.load) which is the most reliable
        // event after a full style change in MapLibre GL JS
        const onLoad = () => {
            if (cancelled) return;
            // Small delay to ensure style internals are fully initialized
            setTimeout(() => {
                if (!cancelled) reAddLayers();
            }, 50);
        };

        mapRef.once('load', onLoad);

        // Additional fallback with style.load
        const onStyleLoad = () => {
            if (cancelled) return;
            setTimeout(() => {
                if (!cancelled) reAddLayers();
            }, 50);
        };
        mapRef.once('style.load', onStyleLoad);

        // Safety: poll every 200ms for 5 seconds
        let attempts = 0;
        const pollId = setInterval(() => {
            attempts++;
            if (cancelled || attempts > 25) { clearInterval(pollId); return; }
            if (mapRef.isStyleLoaded() && !mapRef.getSource('potholes-source')) {
                clearInterval(pollId);
                reAddLayers();
            }
        }, 200);

        return () => {
            cancelled = true;
            clearInterval(pollId);
        };
    }, [theme]); // Only depend on theme — functions accessed via refs

    // ── Update source data when potholes change ──────────
    useEffect(() => {
        if (!map.current || !potholeSourceAdded.current) return;
        const source = map.current.getSource('potholes-source');
        if (source) {
            source.setData(buildGeoJSON(potholes));
        }
    }, [potholes, buildGeoJSON]);

    // ── Marker helper ─────────────────────────
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
            .setLngLat([lng, lat]).setOffset([0, 0]).addTo(map.current);
    };

    const startMarker = useRef(null);
    const endMarker = useRef(null);

    // Handle single target location flyTo
    useEffect(() => {
        if (targetLocation && map.current) {
            const { lat, lng, lon } = targetLocation;
            map.current.flyTo({ center: [lng || lon, lat], zoom: 14, essential: true });
            if (startMarker.current) startMarker.current.remove();
            if (endMarker.current) endMarker.current.remove();
            endMarker.current = addMarker(lng || lon, lat, 'dest');
        }
    }, [targetLocation]);

    // Main Route Fetching
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
                        headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            coordinates: [[startLng, start.lat], [endLng, end.lat]],
                            alternative_routes: { share_factor: 0.6, target_count: 3, weight_factor: 1.6 }
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
                allRoutes.sort((a, b) => a.duration - b.duration);

                if (allRoutes.length > 0) {
                    setLastRouteData(allRoutes);
                    const routeInfos = allRoutes.map((r, i) => ({
                        distance: r.distance, duration: r.duration, index: i,
                        coordinates: r.geometry.coordinates
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
        if (!map.current.isStyleLoaded()) return;
        renderRoutes(lastRouteData, selectedRouteIndex);
    }, [selectedRouteIndex, lastRouteData, renderRoutes]);

    return (
        <div className="map-wrap relative w-full h-full">
            <div ref={mapContainer} className="map w-full h-full absolute top-0 left-0" />
        </div>
    );
};

export default MapComponent;
