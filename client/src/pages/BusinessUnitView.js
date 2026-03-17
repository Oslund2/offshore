import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';
import RoleTable from '../components/RoleTable';

export default function BusinessUnitView({ unitId, costRiskSlider, onDataChange }) {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUnit = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBusinessUnit(unitId);
      setUnit(data);
    } catch (err) {
      console.error('Failed to load unit:', err);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => { loadUnit(); }, [loadUnit]);

  const handleDataChange = () => {
    loadUnit();
    onDataChange();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gwoe-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!unit) return <p className="text-gwoe-muted">Unit not found.</p>;

  // Calculate unit-level stats
  const allRoles = unit.departments.flatMap(d => d.roles);
  const totalFTE = allRoles.reduce((s, r) => s + r.current_fte, 0);
  const totalSpend = allRoles.reduce((s, r) => s + r.estimated_spend, 0);
  const offshoreRoles = allRoles.filter(r => r.recommendation === 'Y');
  const offshoreFTE = offshoreRoles.reduce((s, r) => s + r.current_fte, 0);
  const offshoreSpend = offshoreRoles.reduce((s, r) => s + r.estimated_spend, 0);
  const savingsEstimate = Math.round(offshoreSpend * 0.55);

  return (
    <div className="space-y-6">
      {/* Unit Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Total Roles</p>
          <p className="text-2xl font-semibold text-white mt-1">{allRoles.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Total FTE</p>
          <p className="text-2xl font-semibold text-white mt-1">{totalFTE}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Total Spend</p>
          <p className="text-2xl font-semibold text-white mt-1">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="card p-4 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Offshore FTE</p>
          <p className="text-2xl font-semibold text-gwoe-green mt-1">{offshoreFTE}</p>
          <p className="text-xs text-gwoe-muted">{Math.round((offshoreFTE / totalFTE) * 100)}% of total</p>
        </div>
        <div className="card p-4 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Est. Savings</p>
          <p className="text-2xl font-semibold text-gwoe-green mt-1">{formatCurrency(savingsEstimate)}</p>
          <p className="text-xs text-gwoe-muted">55% cost reduction</p>
        </div>
      </div>

      {/* Department Tables */}
      {unit.departments.map((dept) => (
        <div key={dept.id} className="card">
          <div className="px-5 py-4 border-b border-gwoe-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">{dept.name}</h3>
              <p className="text-xs text-gwoe-muted mt-0.5">
                {dept.roles.length} roles — {dept.roles.reduce((s, r) => s + r.current_fte, 0)} FTE — {formatCurrency(dept.roles.reduce((s, r) => s + r.estimated_spend, 0))}
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="badge-yes">{dept.roles.filter(r => r.recommendation === 'Y').length} offshore</span>
              <span className="badge-partial">{dept.roles.filter(r => r.recommendation === 'P').length} partial</span>
              <span className="badge-no">{dept.roles.filter(r => r.recommendation === 'N').length} retain</span>
            </div>
          </div>
          <div className="p-4">
            <RoleTable
              roles={dept.roles}
              departmentId={dept.id}
              onDataChange={handleDataChange}
              costRiskSlider={costRiskSlider}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
