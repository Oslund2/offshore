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
import ManageUnits from './pages/ManageUnits';

export default function App() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [costRiskSlider, setCostRiskSlider] = useState(50);
  const [loading, setLoading] = useState(false);
  const [modeSelected, setModeSelected] = useState(false);
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
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const enterDemoMode = async () => {
    setIsDemo(true);
    setApi(demoApi);
    setModeSelected(true);
    setLoading(true);
    setError(null);
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

  const enterLiveMode = async () => {
    setIsDemo(false);
    setApi(supabaseApi);
    setModeSelected(true);
    setLoading(true);
    setError(null);
    try {
      const [units, rollupData] = await Promise.all([
        supabaseApi.getBusinessUnits(),
        supabaseApi.getRollup(),
      ]);
      setBusinessUnits(units);
      setRollup(rollupData);
      if (!units || units.length === 0) {
        setError('Connected but no data found. Seed the database first.');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSupabase();
      await loadData(supabaseApi);
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
          <p className="text-gwoe-muted text-sm">{isDemo ? 'Loading Demo...' : 'Connecting to Supabase...'}</p>
        </div>
      </div>
    );
  }

  if (!modeSelected) {
    const hasSupabase = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_KEY;
    return (
      <div className="flex items-center justify-center min-h-screen bg-gwoe-bg p-6">
        <div className="card p-8 max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">GWOE</h1>
            <p className="text-sm text-gwoe-muted">Global Workforce Optimization Engine</p>
            <p className="text-xs text-gwoe-muted mt-2">Select a mode to get started</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-md p-3 mb-6 text-left">
              <p className="text-xs text-red-400 font-mono break-all">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Demo Mode Card */}
            <div className="bg-gwoe-accent/5 border-2 border-gwoe-accent/40 rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gwoe-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">▶</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Demo Mode</h3>
                  <span className="text-xs bg-gwoe-accent/20 text-gwoe-accent px-2 py-0.5 rounded">Recommended</span>
                </div>
              </div>
              <p className="text-xs text-gwoe-muted mb-4 flex-1">
                Explore instantly with pre-loaded sample data. 42 roles across 6 business units with full CRUD,
                AI insights, savings calculator, and executive reports. No database required.
              </p>
              <ul className="text-xs text-gwoe-muted space-y-1.5 mb-5">
                <li className="flex items-center gap-2"><span className="text-gwoe-green">&#10003;</span> No setup needed</li>
                <li className="flex items-center gap-2"><span className="text-gwoe-green">&#10003;</span> 42 pre-loaded roles</li>
                <li className="flex items-center gap-2"><span className="text-gwoe-green">&#10003;</span> All features active</li>
                <li className="flex items-center gap-2"><span className="text-gwoe-amber">!</span> Data resets on refresh</li>
              </ul>
              <button onClick={enterDemoMode} className="btn-primary w-full py-3 text-sm font-semibold">
                Launch Demo Mode
              </button>
            </div>

            {/* Live Mode Card */}
            <div className={`border-2 rounded-xl p-6 flex flex-col ${hasSupabase ? 'bg-gwoe-green/5 border-gwoe-green/40' : 'bg-gwoe-bg border-gwoe-border'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${hasSupabase ? 'bg-gwoe-green/20' : 'bg-gwoe-border'}`}>
                  <span className="text-2xl">&#9879;</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Mode</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${hasSupabase ? 'bg-gwoe-green/20 text-gwoe-green' : 'bg-gwoe-border text-gwoe-muted'}`}>
                    {hasSupabase ? 'Supabase Connected' : 'Setup Required'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gwoe-muted mb-4 flex-1">
                Connect to Supabase for persistent data storage. Enter your own workforce data, and changes are saved permanently.
                Requires Supabase environment variables.
              </p>
              <ul className="text-xs text-gwoe-muted space-y-1.5 mb-5">
                <li className="flex items-center gap-2">
                  <span className={process.env.REACT_APP_SUPABASE_URL ? 'text-gwoe-green' : 'text-gwoe-red'}>
                    {process.env.REACT_APP_SUPABASE_URL ? '✓' : '✗'}
                  </span>
                  REACT_APP_SUPABASE_URL
                </li>
                <li className="flex items-center gap-2">
                  <span className={process.env.REACT_APP_SUPABASE_KEY ? 'text-gwoe-green' : 'text-gwoe-red'}>
                    {process.env.REACT_APP_SUPABASE_KEY ? '✓' : '✗'}
                  </span>
                  REACT_APP_SUPABASE_KEY
                </li>
                <li className="flex items-center gap-2"><span className="text-gwoe-green">&#10003;</span> Persistent data storage</li>
                <li className="flex items-center gap-2"><span className="text-gwoe-green">&#10003;</span> Real workforce data</li>
              </ul>
              {hasSupabase ? (
                <div className="space-y-2">
                  <button onClick={enterLiveMode} className="w-full py-3 text-sm font-semibold bg-gwoe-green/20 text-gwoe-green border border-gwoe-green/30 rounded-md hover:bg-gwoe-green/30 transition-colors">
                    Connect to Supabase
                  </button>
                  <details>
                    <summary className="text-xs text-gwoe-accent cursor-pointer hover:underline">Setup: Create tables &amp; seed data</summary>
                    <div className="mt-2 space-y-2">
                      <details>
                        <summary className="text-xs text-gwoe-muted cursor-pointer hover:underline">Show CREATE TABLE SQL</summary>
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
                      <button onClick={handleSeed} disabled={seeding} className="btn-secondary text-xs">
                        {seeding ? 'Seeding...' : 'Seed Sample Data'}
                      </button>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-gwoe-muted border border-gwoe-border rounded-md bg-gwoe-bg">
                  Set env vars in Netlify to enable
                </div>
              )}
            </div>
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
              <DashboardView rollup={rollup} onNavigate={handleNavigate} costRiskSlider={costRiskSlider} />
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
            {activeView === 'manage' && (
              <ManageUnits onDataChange={handleDataChange} />
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
