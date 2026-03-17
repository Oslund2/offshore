import React, { useState, useEffect, useCallback } from 'react';
import { api as supabaseApi } from './utils/api';
import { demoApi } from './utils/demoApi';
import { seedSupabase } from './utils/seedSupabase';
import { ApiProvider } from './utils/ApiContext';
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
  const [needsSetup, setNeedsSetup] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [api, setApi] = useState(supabaseApi);

  const loadData = useCallback(async (activeApi) => {
    const currentApi = activeApi || api;
    try {
      setError(null);
      const [units, rollupData] = await Promise.all([
        currentApi.getBusinessUnits(),
        currentApi.getRollup(),
      ]);
      setBusinessUnits(units);
      setRollup(rollupData);
      if (!units || units.length === 0) {
        setNeedsSetup(true);
      } else {
        setNeedsSetup(false);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
      setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  const enterDemoMode = async () => {
    setIsDemo(true);
    setApi(demoApi);
    setNeedsSetup(false);
    setLoading(true);
    setError(null);
    // Small delay for state to settle
    setTimeout(async () => {
      try {
        const [units, rollupData] = await Promise.all([
          demoApi.getBusinessUnits(),
          demoApi.getRollup(),
        ]);
        setBusinessUnits(units);
        setRollup(rollupData);
      } catch (err) {
        console.error('Demo load failed:', err);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSupabase();
      setNeedsSetup(false);
      await loadData();
    } catch (err) {
      console.error('Seed failed:', err);
      setError(`Seed failed: ${err.message}`);
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
          <p className="text-gwoe-muted text-sm">{isDemo ? 'Loading Demo...' : 'Initializing GWOE...'}</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gwoe-bg p-6">
        <div className="card p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">GWOE</h1>
            <p className="text-sm text-gwoe-muted">Global Workforce Optimization Engine</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-md p-3 mb-5 text-left">
              <p className="text-xs text-red-400 font-mono break-all">{error}</p>
            </div>
          )}

          {/* Demo Mode — Primary CTA */}
          <div className="bg-gwoe-accent/5 border border-gwoe-accent/30 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gwoe-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">▶</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Launch Demo Mode</h3>
                <p className="text-xs text-gwoe-muted mb-3">
                  Explore GWOE instantly with realistic pre-loaded data — 42 roles across 6 business units
                  (Cyber, News, Data, Product, Development, Business). Full CRUD, AI insights, savings calculator,
                  and executive reports all work in demo mode. No database needed.
                </p>
                <button onClick={enterDemoMode} className="btn-primary px-6">
                  Enter Demo Mode
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gwoe-border"></div>
            <span className="text-xs text-gwoe-muted">or connect to Supabase</span>
            <div className="flex-1 h-px bg-gwoe-border"></div>
          </div>

          {/* Supabase Setup */}
          <div className="bg-gwoe-bg rounded-lg p-5 border border-gwoe-border">
            <h3 className="text-sm font-semibold text-white mb-3">Connect to Supabase (Persistent Storage)</h3>

            <div className="space-y-3 text-xs text-gwoe-muted">
              <div className="flex items-start gap-2">
                <span className={`font-mono font-bold ${process.env.REACT_APP_SUPABASE_URL ? 'text-gwoe-green' : 'text-gwoe-red'}`}>
                  {process.env.REACT_APP_SUPABASE_URL ? '✓' : '✗'}
                </span>
                <div>
                  <span className="text-white">REACT_APP_SUPABASE_URL</span>
                  <span className="ml-2">{process.env.REACT_APP_SUPABASE_URL ? 'Connected' : 'Not set in Netlify env vars'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className={`font-mono font-bold ${process.env.REACT_APP_SUPABASE_KEY ? 'text-gwoe-green' : 'text-gwoe-red'}`}>
                  {process.env.REACT_APP_SUPABASE_KEY ? '✓' : '✗'}
                </span>
                <div>
                  <span className="text-white">REACT_APP_SUPABASE_KEY</span>
                  <span className="ml-2">{process.env.REACT_APP_SUPABASE_KEY ? 'Connected' : 'Not set in Netlify env vars'}</span>
                </div>
              </div>
            </div>

            {process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_KEY && (
              <div className="mt-4">
                <p className="text-xs text-gwoe-muted mb-2">Run this SQL in Supabase SQL Editor first:</p>
                <details className="mb-3">
                  <summary className="text-xs text-gwoe-accent cursor-pointer hover:underline">Show CREATE TABLE SQL</summary>
                  <pre className="text-xs text-gwoe-accent font-mono mt-2 p-3 bg-gwoe-card rounded overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS business_units (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT
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
                </details>
                <button onClick={handleSeed} disabled={seeding} className="btn-secondary">
                  {seeding ? 'Seeding...' : 'Seed Supabase Database'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ApiProvider api={api}>
      <div className="flex h-screen bg-gwoe-bg overflow-hidden">
        <Sidebar
          businessUnits={businessUnits}
          activeView={activeView}
          activeUnitId={activeUnitId}
          onNavigate={handleNavigate}
          isDemo={isDemo}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            activeView={activeView}
            activeUnitId={activeUnitId}
            businessUnits={businessUnits}
            costRiskSlider={costRiskSlider}
            onSliderChange={setCostRiskSlider}
            isDemo={isDemo}
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
    </ApiProvider>
  );
}
