import React from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import PotholeStats from './components/PotholeStats';
import ThemeToggle from './components/ThemeToggle';
import usePotholes from './hooks/usePotholes';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const [targetLocation, setTargetLocation] = React.useState(null);
  const [route, setRoute] = React.useState(null);
  const [foundRoutes, setFoundRoutes] = React.useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);
  const { theme } = useTheme();

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

  const isDark = theme === 'dark';

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
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

      {/* Vignette overlay — adapts to theme */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.08) 100%)'
        }}
      />

      {/* Bottom fade — grounds the UI */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-[1]"
        style={{
          background: isDark
            ? 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'
            : 'linear-gradient(to top, rgba(240,242,245,0.3), transparent)'
        }}
      />

      {/* Floating UI — above overlays */}
      <Sidebar
        onLocationSelect={handleLocationSelect}
        onRouteSelect={handleRouteSelect}
        foundRoutes={foundRoutes}
        selectedRouteIndex={selectedRouteIndex}
        onSelectRoute={setSelectedRouteIndex}
      />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Pothole Stats Panel — bottom left */}
      <PotholeStats potholes={potholes} loading={potholesLoading} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
