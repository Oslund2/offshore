import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BusinessUnitView from './pages/BusinessUnitView';
import DashboardView from './pages/DashboardView';
import ExecutiveSummary from './pages/ExecutiveSummary';

export default function App() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [costRiskSlider, setCostRiskSlider] = useState(50);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [units, rollupData] = await Promise.all([
        api.getBusinessUnits(),
        api.getRollup(),
      ]);
      setBusinessUnits(units);
      setRollup(rollupData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNavigate = (view, unitId = null) => {
    setActiveView(view);
    setActiveUnitId(unitId);
  };

  const handleDataChange = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gwoe-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gwoe-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gwoe-muted text-sm">Initializing GWOE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gwoe-bg overflow-hidden">
      <Sidebar
        businessUnits={businessUnits}
        activeView={activeView}
        activeUnitId={activeUnitId}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeView={activeView}
          activeUnitId={activeUnitId}
          businessUnits={businessUnits}
          costRiskSlider={costRiskSlider}
          onSliderChange={setCostRiskSlider}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard' && (
            <DashboardView rollup={rollup} onNavigate={handleNavigate} />
          )}
          {activeView === 'unit' && activeUnitId && (
            <BusinessUnitView
              unitId={activeUnitId}
              costRiskSlider={costRiskSlider}
              onDataChange={handleDataChange}
            />
          )}
          {activeView === 'executive' && (
            <ExecutiveSummary rollup={rollup} />
          )}
        </main>
      </div>
    </div>
  );
}
