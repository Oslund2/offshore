import React, { useState } from 'react';
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
import AICommandCenter from './pages/AICommandCenter';

export default function App() {
  // mode: null = not selected, 'demo' = in-memory, 'live' = supabase
  const [mode, setMode] = useState(null);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [costRiskSlider, setCostRiskSlider] = useState(50);
  const [initialLoading, setInitialLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  // Derive API from mode — deterministic, no ref/effect needed
  const activeApi = mode === 'demo' ? demoApi : supabaseApi;
  const isDemo = mode === 'demo';

  // Debug: track which source loaded the data
  const [dataSource, setDataSource] = useState(null);

  // Central data loader — fetches EVERYTHING, including per-role data.
  // This is the SINGLE source of truth. No child component fetches independently.
  const loadData = async (api, sourceName) => {
    // Clear stale data FIRST to prevent any bleed between modes
    setBusinessUnits([]);
    setAllRoles([]);
    setRollup(null);
    setDataSource(null);

    try {
      setError(null);
      const [units, rollupData] = await Promise.all([
        api.getBusinessUnits(),
        api.getRollup(),
      ]);

      // Fetch all roles with unit/dept context (needed for slider adjustments)
      const roles = [];
      for (const unit of units) {
        const full = await api.getBusinessUnit(unit.id);
        for (const dept of full.departments) {
          for (const role of dept.roles) {
            roles.push({ ...role, unitId: unit.id, unitName: unit.name, deptName: dept.name });
          }
        }
      }

      setBusinessUnits(units);
      setRollup(rollupData);
      setAllRoles(roles);
      setDataSource(sourceName);
      return units;
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(`[${sourceName}] ${err.message}`);
      setDataSource(`${sourceName} (FAILED)`);
      return null;
    }
  };

  const enterDemoMode = async () => {
    setMode('demo');
    setInitialLoading(true);
    setError(null);
    await loadData(demoApi, 'DEMO (in-memory)');
    setInitialLoading(false);
  };

  const enterLiveMode = async () => {
    setMode('live');
    setInitialLoading(true);
    setError(null);
    const units = await loadData(supabaseApi, 'SUPABASE (live)');
    if (units && units.length === 0) {
      setError('Connected but no data found. Seed the database first.');
    }
    setInitialLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSupabase();
      setMode('live');
      setInitialLoading(true);
      await loadData(supabaseApi, 'SUPABASE (post-seed)');
      setInitialLoading(false);
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

  // Background refresh — reloads all data from the current API
  const handleDataChange = async () => {
    await loadData(activeApi, mode === 'demo' ? 'DEMO (refresh)' : 'SUPABASE (refresh)');
  };

  // Initial loading spinner — only before first data load
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gwoe-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gwoe-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gwoe-muted text-sm">{isDemo ? 'Loading Demo...' : 'Connecting to Supabase...'}</p>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (!mode) {
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
                <button onClick={enterLiveMode} className="w-full py-3 text-sm font-semibold bg-gwoe-green/20 text-gwoe-green border border-gwoe-green/30 rounded-md hover:bg-gwoe-green/30 transition-colors">
                  Connect to Supabase
                </button>
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

  // Compute data fingerprint for debug
  const totalSpend = allRoles.reduce((s, r) => s + r.estimated_spend, 0);

  // Main app — ApiProvider stays for mutation-only components (RoleTable, ManageUnits, BusinessUnitView)
  return (
    <ApiProvider api={activeApi}>
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

          {/* Debug status bar — visible diagnostic */}
          <div className={`px-4 py-1.5 text-xs font-mono flex items-center gap-4 border-b ${
            mode === 'live' ? 'bg-gwoe-green/10 border-gwoe-green/30 text-gwoe-green' : 'bg-gwoe-amber/10 border-gwoe-amber/30 text-gwoe-amber'
          }`}>
            <span>Mode: <strong>{mode}</strong></span>
            <span>Source: <strong>{dataSource || 'none'}</strong></span>
            <span>Roles: <strong>{allRoles.length}</strong></span>
            <span>BUs: <strong>{businessUnits.length}</strong></span>
            <span>Spend: <strong>${totalSpend.toLocaleString()}</strong></span>
            {error && <span className="text-gwoe-red">ERR: {error}</span>}
            {allRoles.length === 42 && totalSpend === 16255000 && (
              <span className="text-gwoe-amber">[matches demo seed fingerprint]</span>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-900/30 border border-red-700/50 rounded-md p-3">
              <p className="text-xs text-red-400 font-mono break-all">{error}</p>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-6">
            {activeView === 'dashboard' && (
              <DashboardView allRoles={allRoles} onNavigate={handleNavigate} costRiskSlider={costRiskSlider} />
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
              <SavingsCalculator allRoles={allRoles} />
            )}
            {activeView === 'command' && (
              <AICommandCenter allRoles={allRoles} />
            )}
          </main>
        </div>
      </div>
    </ApiProvider>
  );
}
