import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../utils/ApiContext';
import { formatCurrency } from '../utils/format';

export default function ManageUnits({ onDataChange }) {
  const api = useApi();
  const [units, setUnits] = useState([]);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [unitDetail, setUnitDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add BU state
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', description: '' });

  // Edit BU state
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editUnit, setEditUnit] = useState({ name: '', description: '' });

  // Add Dept state
  const [addingDeptFor, setAddingDeptFor] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');

  // Edit Dept state
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');

  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBusinessUnits();
      setUnits(data);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const loadUnitDetail = useCallback(async (id) => {
    try {
      const data = await api.getBusinessUnit(id);
      setUnitDetail(data);
    } catch (err) {
      console.error('Failed to load unit detail:', err);
    }
  }, [api]);

  const toggleExpand = (id) => {
    if (expandedUnit === id) {
      setExpandedUnit(null);
      setUnitDetail(null);
    } else {
      setExpandedUnit(id);
      loadUnitDetail(id);
    }
  };

  const refresh = () => {
    loadUnits();
    if (expandedUnit) loadUnitDetail(expandedUnit);
    onDataChange();
  };

  // Business Unit CRUD
  const handleAddUnit = async () => {
    if (!newUnit.name.trim()) return;
    try {
      await api.createBusinessUnit(newUnit);
      setAddingUnit(false);
      setNewUnit({ name: '', description: '' });
      refresh();
    } catch (err) {
      console.error('Failed to create unit:', err);
    }
  };

  const handleEditUnit = async (id) => {
    if (!editUnit.name.trim()) return;
    try {
      await api.updateBusinessUnit(id, editUnit);
      setEditingUnitId(null);
      refresh();
    } catch (err) {
      console.error('Failed to update unit:', err);
    }
  };

  const handleDeleteUnit = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and ALL its departments and roles? This cannot be undone.`)) return;
    try {
      await api.deleteBusinessUnit(id);
      if (expandedUnit === id) { setExpandedUnit(null); setUnitDetail(null); }
      refresh();
    } catch (err) {
      console.error('Failed to delete unit:', err);
    }
  };

  // Department CRUD
  const handleAddDept = async (unitId) => {
    if (!newDeptName.trim()) return;
    try {
      await api.createDepartment({ business_unit_id: unitId, name: newDeptName });
      setAddingDeptFor(null);
      setNewDeptName('');
      loadUnitDetail(unitId);
      onDataChange();
    } catch (err) {
      console.error('Failed to create department:', err);
    }
  };

  const handleEditDept = async (deptId) => {
    if (!editDeptName.trim()) return;
    try {
      await api.updateDepartment(deptId, { name: editDeptName });
      setEditingDeptId(null);
      loadUnitDetail(expandedUnit);
      onDataChange();
    } catch (err) {
      console.error('Failed to update department:', err);
    }
  };

  const handleDeleteDept = async (deptId, name) => {
    if (!window.confirm(`Delete department "${name}" and all its roles?`)) return;
    try {
      await api.deleteDepartment(deptId);
      loadUnitDetail(expandedUnit);
      onDataChange();
    } catch (err) {
      console.error('Failed to delete department:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gwoe-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Manage Business Units</h2>
          <p className="text-xs text-gwoe-muted mt-0.5">Add, edit, or remove business units and departments</p>
        </div>
        {!addingUnit && (
          <button onClick={() => setAddingUnit(true)} className="btn-primary text-xs px-4 py-2">
            + Add Business Unit
          </button>
        )}
      </div>

      {/* Add Unit Form */}
      {addingUnit && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">New Business Unit</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gwoe-muted block mb-1">Name</label>
              <input
                className="input-field w-full"
                placeholder="e.g. Engineering"
                value={newUnit.name}
                onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gwoe-muted block mb-1">Description</label>
              <input
                className="input-field w-full"
                placeholder="Optional description"
                value={newUnit.description}
                onChange={e => setNewUnit({ ...newUnit, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddUnit} className="px-3 py-1.5 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Create</button>
            <button onClick={() => { setAddingUnit(false); setNewUnit({ name: '', description: '' }); }} className="px-3 py-1.5 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Unit List */}
      {units.length === 0 && !addingUnit && (
        <div className="card p-8 text-center">
          <p className="text-gwoe-muted text-sm">No business units yet. Click "Add Business Unit" to get started.</p>
        </div>
      )}

      {units.map(unit => (
        <div key={unit.id} className="card">
          <div className="px-5 py-4 border-b border-gwoe-border flex items-center justify-between">
            {editingUnitId === unit.id ? (
              <div className="flex-1 flex items-center gap-3">
                <input
                  className="input-field flex-1"
                  value={editUnit.name}
                  onChange={e => setEditUnit({ ...editUnit, name: e.target.value })}
                  autoFocus
                />
                <input
                  className="input-field flex-1"
                  value={editUnit.description}
                  onChange={e => setEditUnit({ ...editUnit, description: e.target.value })}
                  placeholder="Description"
                />
                <button onClick={() => handleEditUnit(unit.id)} className="px-3 py-1.5 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Save</button>
                <button onClick={() => setEditingUnitId(null)} className="px-3 py-1.5 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(unit.id)}>
                  <span className="text-gwoe-muted text-xs">{expandedUnit === unit.id ? '▼' : '▶'}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{unit.name}</h3>
                    {unit.description && <p className="text-xs text-gwoe-muted mt-0.5">{unit.description}</p>}
                  </div>
                  <span className="text-xs text-gwoe-muted ml-2">
                    {unit.departments ? `${unit.departments.length} dept${unit.departments.length !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingUnitId(unit.id); setEditUnit({ name: unit.name, description: unit.description || '' }); }}
                    className="px-3 py-1.5 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit.id, unit.name)}
                    className="px-3 py-1.5 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Expanded: show departments */}
          {expandedUnit === unit.id && unitDetail && (
            <div className="p-4 space-y-3">
              {unitDetail.departments.map(dept => (
                <div key={dept.id} className="flex items-center justify-between bg-gwoe-bg rounded-md px-4 py-3">
                  {editingDeptId === dept.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        className="input-field flex-1"
                        value={editDeptName}
                        onChange={e => setEditDeptName(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleEditDept(dept.id)} className="px-2 py-1 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Save</button>
                      <button onClick={() => setEditingDeptId(null)} className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm text-white font-medium">{dept.name}</span>
                        <span className="text-xs text-gwoe-muted ml-3">
                          {dept.roles ? `${dept.roles.length} roles` : ''}
                          {dept.roles && dept.roles.length > 0 && ` — ${dept.roles.reduce((s, r) => s + r.current_fte, 0)} FTE — ${formatCurrency(dept.roles.reduce((s, r) => s + r.estimated_spend, 0))}`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingDeptId(dept.id); setEditDeptName(dept.name); }}
                          className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.id, dept.name)}
                          className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add Department */}
              {addingDeptFor === unit.id ? (
                <div className="flex items-center gap-3 bg-gwoe-bg rounded-md px-4 py-3">
                  <input
                    className="input-field flex-1"
                    placeholder="Department name"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => handleAddDept(unit.id)} className="px-2 py-1 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Add</button>
                  <button onClick={() => { setAddingDeptFor(null); setNewDeptName(''); }} className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingDeptFor(unit.id)}
                  className="px-3 py-1.5 text-xs text-gwoe-accent border border-gwoe-accent/30 rounded hover:bg-gwoe-accent/10 transition-colors"
                >
                  + Add Department
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
