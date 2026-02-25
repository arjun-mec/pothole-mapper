import React from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import PotholeStats from './components/PotholeStats';
import usePotholes from './hooks/usePotholes';

function App() {
  const [targetLocation, setTargetLocation] = React.useState(null);
  const [route, setRoute] = React.useState(null);
  const [foundRoutes, setFoundRoutes] = React.useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);

  const { potholes, loading: potholesLoading } = usePotholes();

  const handleRouteSelect = (start, end) => {
    if (!start || !end) {
      setRoute(null);
      setFoundRoutes([]);
      setSelectedRouteIndex(0);
      return;
    }
    setRoute({ start, end });
  };

  const handleLocationSelect = (location) => {
    setRoute(null);
    setFoundRoutes([]);
    setSelectedRouteIndex(0);
    setTargetLocation(location);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapComponent
          targetLocation={targetLocation}
          route={route}
          onRoutesFound={setFoundRoutes}
          selectedRouteIndex={selectedRouteIndex}
          potholes={potholes}
        />
      </div>

      {/* Vignette overlay — subtle dark edges for depth */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Bottom fade — grounds the UI */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-[1] bg-gradient-to-t from-black/30 to-transparent" />

      {/* Floating UI — above overlays */}
      <Sidebar
        onLocationSelect={handleLocationSelect}
        onRouteSelect={handleRouteSelect}
        foundRoutes={foundRoutes}
        selectedRouteIndex={selectedRouteIndex}
        onSelectRoute={setSelectedRouteIndex}
      />

      {/* Pothole Stats Panel — bottom right */}
      <PotholeStats potholes={potholes} loading={potholesLoading} />
    </div>
  );
}

export default App;
