import React, { useState } from 'react';

export default function Settings({ onClearDatabase, isDemo }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    await onClearDatabase();
    setClearing(false);
    setConfirmClear(false);
  };

  if (isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="text-sm text-gwoe-muted mt-1">Demo mode — data resets on refresh. No persistent settings available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gwoe-muted mt-1">Manage your Supabase database and application configuration.</p>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-gwoe-red/30 rounded-xl overflow-hidden">
        <div className="bg-gwoe-red/10 px-6 py-4 border-b border-gwoe-red/30">
          <h3 className="text-base font-bold text-gwoe-red">Danger Zone</h3>
          <p className="text-xs text-gwoe-muted mt-1">Irreversible actions that affect your database.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Clear All Data */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-white">Clear All Data</p>
              <p className="text-xs text-gwoe-muted mt-1">
                Permanently delete all business units, departments, and roles from your Supabase database.
                This cannot be undone.
              </p>
            </div>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-4 py-2 text-xs font-semibold text-gwoe-red border border-gwoe-red/40 rounded-md hover:bg-gwoe-red/10 transition-colors whitespace-nowrap"
              >
                Clear All Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="px-4 py-2 text-xs font-semibold bg-gwoe-red text-white rounded-md hover:bg-gwoe-red/80 transition-colors whitespace-nowrap"
                >
                  {clearing ? 'Clearing...' : 'Yes, delete everything'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  disabled={clearing}
                  className="px-4 py-2 text-xs font-semibold text-gwoe-muted border border-gwoe-border rounded-md hover:bg-gwoe-bg transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
