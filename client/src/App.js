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

  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      let units = [];
      try {
        units = await api.getBusinessUnits();
      } catch (e) {
        console.error('getBusinessUnits failed:', e);
        setError(`Database connection failed: ${e.message}. Check that tables exist in Supabase and env vars are set.`);
        setNeedsSeed(true);
        return;
      }

      if (!units || units.length === 0) {
        setNeedsSeed(true);
        return;
      }

      setBusinessUnits(units);

      try {
        const rollupData = await api.getRollup();
        setRollup(rollupData);
      } catch (e) {
        console.error('getRollup failed:', e);
        // Rollup can fail on empty roles — still show the app
        setRollup({ overall: { total_roles: 0, total_fte: 0, total_spend: 0, offshore_fte: 0, offshore_spend: 0, partial_fte: 0, partial_spend: 0, retain_fte: 0, retain_spend: 0 }, byUnit: [], byLevel: [] });
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
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
        <div className="text-center card p-8 max-w-lg">
          <h1 className="text-xl font-semibold text-white mb-2">GWOE Setup</h1>
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-md p-3 mb-4 text-left">
              <p className="text-xs text-red-400 font-mono break-all">{error}</p>
            </div>
          )}
          <p className="text-sm text-gwoe-muted mb-4">
            Your Supabase database appears empty or the tables haven't been created yet.
          </p>
          <div className="bg-gwoe-bg rounded-md p-4 mb-4 text-left">
            <p className="text-xs text-gwoe-muted mb-2">1. Run this SQL in <strong className="text-white">Supabase SQL Editor</strong>:</p>
            <pre className="text-xs text-gwoe-accent font-mono overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS business_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('L1','L2','L3','L4')),
  candidate_for_offshore TEXT NOT NULL DEFAULT 'N',
  recommendation TEXT NOT NULL DEFAULT 'N',
  qualitative_why TEXT,
  current_fte REAL NOT NULL DEFAULT 0,
  estimated_spend REAL NOT NULL DEFAULT 0
);
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON business_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON roles FOR ALL USING (true) WITH CHECK (true);`}
            </pre>
            <p className="text-xs text-gwoe-muted mt-3">2. Then click the button below to seed data:</p>
          </div>
          <button onClick={handleSeed} disabled={seeding} className="btn-primary">
            {seeding ? 'Seeding Database...' : 'Seed Database (42 roles)'}
          </button>
          <div className="mt-4 text-left bg-gwoe-bg rounded-md p-3">
            <p className="text-xs text-gwoe-muted">
              <strong className="text-white">Debug:</strong> SUPABASE_URL = {process.env.REACT_APP_SUPABASE_URL ? '✓ Set' : '✗ Missing'} | SUPABASE_KEY = {process.env.REACT_APP_SUPABASE_KEY ? '✓ Set' : '✗ Missing'}
            </p>
          </div>
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
