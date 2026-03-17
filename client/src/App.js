import React, { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api';
import { seedSupabase } from './utils/seedSupabase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BusinessUnitView from './pages/BusinessUnitView';
import DashboardView from './pages/DashboardView';
import ExecutiveSummary from './pages/ExecutiveSummary';
import SavingsCalculator from './pages/SavingsCalculator';

export default function App() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [costRiskSlider, setCostRiskSlider] = useState(50);
  const [loading, setLoading] = useState(true);
  const [needsSeed, setNeedsSeed] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [units, rollupData] = await Promise.all([
        api.getBusinessUnits(),
        api.getRollup(),
      ]);
      setBusinessUnits(units);
      setRollup(rollupData);
      if (!units || units.length === 0) setNeedsSeed(true);
    } catch (err) {
      console.error('Failed to load data:', err);
      setNeedsSeed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSupabase();
      setNeedsSeed(false);
      await loadData();
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  };

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

  if (needsSeed) {
    return (
      <div className="flex items-center justify-center h-screen bg-gwoe-bg">
        <div className="text-center card p-8 max-w-md">
          <h1 className="text-xl font-semibold text-white mb-2">GWOE Setup</h1>
          <p className="text-sm text-gwoe-muted mb-6">
            Your Supabase database is empty. Click below to seed it with the default workforce data (42 roles across 6 business units).
          </p>
          <button onClick={handleSeed} disabled={seeding} className="btn-primary">
            {seeding ? 'Seeding Database...' : 'Seed Database'}
          </button>
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
          {activeView === 'calculator' && (
            <SavingsCalculator />
          )}
        </main>
      </div>
    </div>
  );
}
