import React from 'react';
import { Map, ScrollText, BarChart3 } from 'lucide-react';

const tabs = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
];

const NavPill = ({ activeTab, onTabChange }) => {
  return (
    <div className="nav-pill-container">
      <div className="nav-pill liquid-glass">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-pill-btn ${isActive ? 'nav-pill-btn-active' : ''}`}
              title={tab.label}
            >
              <Icon className="nav-pill-icon" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="nav-pill-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavPill;
