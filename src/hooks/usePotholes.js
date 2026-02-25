import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, onChildAdded, onChildChanged, onChildRemoved, off } from 'firebase/database';
import { database } from '../lib/firebase';

/**
 * Efficient real-time hook for /potholes in Firebase RTDB.
 *
 * Strategy:
 *   1. Initial load: onValue (once) to get all existing potholes.
 *   2. After initial load: onChildAdded / onChildChanged / onChildRemoved
 *      for incremental updates — Firebase only sends the delta, not the
 *      entire collection.
 *
 * Returns { potholes, loading, error }
 */
export default function usePotholes() {
    const [potholes, setPotholes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialLoadDone = useRef(false);
    const potholesMapRef = useRef(new Map()); // id → pothole object

    // Stable callback to push the Map contents into state
    const syncState = useCallback(() => {
        setPotholes(Array.from(potholesMapRef.current.values()));
    }, []);

    useEffect(() => {
        const potholesRef = ref(database, 'potholes');

        // ── Step 1: Initial bulk load (runs once) ──────────────
        const unsubInit = onValue(
            potholesRef,
            (snapshot) => {
                const data = snapshot.val();
                potholesMapRef.current.clear();

                if (data) {
                    Object.entries(data).forEach(([id, value]) => {
                        potholesMapRef.current.set(id, {
                            id,
                            lat: value.lat,
                            lng: value.lng,
                            value: value.value ?? value.shock ?? 0,
                            type: value.type || 'Shock',
                            timestamp: value.timestamp,
                        });
                    });
                }

                syncState();
                setLoading(false);
                initialLoadDone.current = true;

                // Detach the onValue listener — we only needed the initial load
                off(potholesRef, 'value', unsubInit);

                // ── Step 2: Incremental listeners ──────────────────
                // onChildAdded fires for existing children too, but since
                // we already have them in the Map, the set() is a no-op update.
                onChildAdded(potholesRef, (childSnap) => {
                    const id = childSnap.key;
                    const value = childSnap.val();

                    // Skip if we already processed this in the initial load
                    if (!initialLoadDone.current) return;

                    potholesMapRef.current.set(id, {
                        id,
                        lat: value.lat,
                        lng: value.lng,
                        value: value.value ?? value.shock ?? 0,
                        type: value.type || 'Shock',
                        timestamp: value.timestamp,
                    });
                    syncState();
                });

                onChildChanged(potholesRef, (childSnap) => {
                    const id = childSnap.key;
                    const value = childSnap.val();
                    potholesMapRef.current.set(id, {
                        id,
                        lat: value.lat,
                        lng: value.lng,
                        value: value.value ?? value.shock ?? 0,
                        type: value.type || 'Shock',
                        timestamp: value.timestamp,
                    });
                    syncState();
                });

                onChildRemoved(potholesRef, (childSnap) => {
                    potholesMapRef.current.delete(childSnap.key);
                    syncState();
                });
            },
            (err) => {
                console.error('Firebase pothole read error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            // Detach all listeners on cleanup
            off(potholesRef);
        };
    }, [syncState]);

    return { potholes, loading, error };
}
