import React, { useState } from 'react';
import { useApi } from '../utils/ApiContext';
import { formatCurrency, getLevelColor, getRecommendationBadge } from '../utils/format';
import { getSliderAdjustedRecommendation, getSliderAdjustmentLabel } from '../utils/sliderLogic';
import RiskAssessmentModal from './RiskAssessmentModal';
import AIInsightsBadge from './AIInsightsBadge';

export default function RoleTable({ roles, departmentId, onDataChange, costRiskSlider }) {
  const api = useApi();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [riskModal, setRiskModal] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newRole, setNewRole] = useState({
    role_name: '', level: 'L1', candidate_for_offshore: 'N',
    recommendation: 'N', qualitative_why: '', current_fte: 0, estimated_spend: 0
  });

  const startEdit = (role) => {
    setEditingId(role.id);
    setEditForm({ ...role });
  };

  const saveEdit = async () => {
    try {
      await api.updateRole(editingId, editForm);
      setEditingId(null);
      onDataChange();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm('Remove this role from the analysis?')) return;
    try {
      await api.deleteRole(id);
      onDataChange();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const addRole = async () => {
    try {
      await api.createRole({ ...newRole, department_id: departmentId });
      setAddingNew(false);
      setNewRole({
        role_name: '', level: 'L1', candidate_for_offshore: 'N',
        recommendation: 'N', qualitative_why: '', current_fte: 0, estimated_spend: 0
      });
      onDataChange();
    } catch (err) {
      console.error('Failed to add:', err);
    }
  };

  const autoFillRationale = async (roleName, level, setter) => {
    try {
      const result = await api.getAutoRationale({ role_name: roleName, level, business_unit: '' });
      setter(prev => ({
        ...prev,
        qualitative_why: result.rationale,
        candidate_for_offshore: result.suggestedOffshore,
        recommendation: result.suggestedRecommendation,
      }));
    } catch (err) {
      console.error('Auto-rationale failed:', err);
    }
  };

  const showRiskAssessment = async (role) => {
    try {
      const result = await api.getRiskAssessment(role);
      setRiskModal({ role, assessment: result });
    } catch (err) {
      console.error('Risk assessment failed:', err);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gwoe-border text-gwoe-muted text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-3 font-medium">Role</th>
              <th className="text-center py-3 px-2 font-medium w-16">Level</th>
              <th className="text-center py-3 px-2 font-medium w-20">Candidate</th>
              <th className="text-center py-3 px-2 font-medium w-24">Rec.</th>
              <th className="text-left py-3 px-3 font-medium">Why</th>
              <th className="text-right py-3 px-2 font-medium w-16">FTE</th>
              <th className="text-right py-3 px-3 font-medium w-24">Spend</th>
              <th className="text-center py-3 px-2 font-medium w-20">AI</th>
              <th className="text-center py-3 px-2 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              editingId === role.id ? (
                <tr key={role.id} className="border-b border-gwoe-border bg-gwoe-accent/5">
                  <td className="py-2 px-3">
                    <input
                      className="input-field w-full"
                      value={editForm.role_name}
                      onChange={e => setEditForm({ ...editForm, role_name: e.target.value })}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      className="input-field w-full text-center"
                      value={editForm.level}
                      onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                    >
                      {['L1', 'L2', 'L3', 'L4'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <select
                      className="input-field w-full text-center"
                      value={editForm.candidate_for_offshore}
                      onChange={e => setEditForm({ ...editForm, candidate_for_offshore: e.target.value })}
                    >
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <select
                      className="input-field w-full text-center"
                      value={editForm.recommendation}
                      onChange={e => setEditForm({ ...editForm, recommendation: e.target.value })}
                    >
                      <option value="Y">Y — Offshore</option>
                      <option value="N">N — Retain</option>
                      <option value="P">P — Partial</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1">
                      <input
                        className="input-field flex-1"
                        value={editForm.qualitative_why}
                        onChange={e => setEditForm({ ...editForm, qualitative_why: e.target.value })}
                      />
                      <button
                        onClick={() => autoFillRationale(editForm.role_name, editForm.level, setEditForm)}
                        className="px-2 py-1 text-xs bg-gwoe-accent/20 text-gwoe-accent rounded hover:bg-gwoe-accent/30"
                        title="AI Auto-fill"
                      >
                        AI
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      className="input-field w-full text-right"
                      value={editForm.current_fte}
                      onChange={e => setEditForm({ ...editForm, current_fte: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      className="input-field w-full text-right"
                      value={editForm.estimated_spend}
                      onChange={e => setEditForm({ ...editForm, estimated_spend: Number(e.target.value) })}
                    />
                  </td>
                  <td></td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={saveEdit} className="px-2 py-1 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const adjustedRec = getSliderAdjustedRecommendation(role.recommendation, role.level, role.qualitative_why, costRiskSlider);
                  const adjustment = getSliderAdjustmentLabel(role.recommendation, adjustedRec);
                  const badge = getRecommendationBadge(adjustedRec);
                  const isAdjusted = adjustedRec !== role.recommendation;
                  return (
                <tr key={role.id} className={`border-b border-gwoe-border/50 hover:bg-gwoe-bg/50 transition-colors ${isAdjusted ? 'bg-gwoe-accent/[0.03]' : ''}`}>
                  <td className="py-3 px-3 font-medium text-white">{role.role_name}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`level-badge ${getLevelColor(role.level)}`}>{role.level}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={role.candidate_for_offshore === 'Y' ? 'text-gwoe-green' : 'text-gwoe-red'}>
                      {role.candidate_for_offshore}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div>
                      <span className={badge.class}>
                        {badge.label}
                      </span>
                      {adjustment && (
                        <div className={`text-xs mt-0.5 ${adjustment.color}`} title={`Original: ${getRecommendationBadge(role.recommendation).label}`}>
                          {adjustment.text}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gwoe-muted text-xs max-w-xs truncate" title={role.qualitative_why}>
                    {role.qualitative_why}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">{role.current_fte}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatCurrency(role.estimated_spend)}</td>
                  <td className="py-3 px-2 text-center">
                    <AIInsightsBadge role={role} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => showRiskAssessment(role)}
                        className="px-2 py-1 text-xs bg-gwoe-accent/20 text-gwoe-accent rounded hover:bg-gwoe-accent/30"
                        title="Pro/Con Analysis"
                      >
                        P/C
                      </button>
                      <button
                        onClick={() => startEdit(role)}
                        className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              )
            ))}

            {addingNew && (
              <tr className="border-b border-gwoe-border bg-gwoe-accent/5">
                <td className="py-2 px-3">
                  <input className="input-field w-full" placeholder="Role name" value={newRole.role_name}
                    onChange={e => setNewRole({ ...newRole, role_name: e.target.value })} />
                </td>
                <td className="py-2 px-2">
                  <select className="input-field w-full" value={newRole.level}
                    onChange={e => setNewRole({ ...newRole, level: e.target.value })}>
                    {['L1', 'L2', 'L3', 'L4'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select className="input-field w-full" value={newRole.candidate_for_offshore}
                    onChange={e => setNewRole({ ...newRole, candidate_for_offshore: e.target.value })}>
                    <option value="Y">Y</option><option value="N">N</option>
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select className="input-field w-full" value={newRole.recommendation}
                    onChange={e => setNewRole({ ...newRole, recommendation: e.target.value })}>
                    <option value="Y">Y</option><option value="N">N</option><option value="P">P</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-1">
                    <input className="input-field flex-1" placeholder="Rationale" value={newRole.qualitative_why}
                      onChange={e => setNewRole({ ...newRole, qualitative_why: e.target.value })} />
                    <button onClick={() => autoFillRationale(newRole.role_name, newRole.level, setNewRole)}
                      className="px-2 py-1 text-xs bg-gwoe-accent/20 text-gwoe-accent rounded hover:bg-gwoe-accent/30">AI</button>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <input type="number" className="input-field w-full text-right" value={newRole.current_fte}
                    onChange={e => setNewRole({ ...newRole, current_fte: Number(e.target.value) })} />
                </td>
                <td className="py-2 px-3">
                  <input type="number" className="input-field w-full text-right" value={newRole.estimated_spend}
                    onChange={e => setNewRole({ ...newRole, estimated_spend: Number(e.target.value) })} />
                </td>
                <td></td>
                <td className="py-2 px-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button onClick={addRole} className="px-2 py-1 text-xs bg-gwoe-green/20 text-gwoe-green rounded hover:bg-gwoe-green/30">Add</button>
                    <button onClick={() => setAddingNew(false)} className="px-2 py-1 text-xs bg-gwoe-border text-gwoe-muted rounded hover:bg-slate-600">Cancel</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!addingNew && (
        <button
          onClick={() => setAddingNew(true)}
          className="mt-3 px-3 py-1.5 text-xs text-gwoe-accent border border-gwoe-accent/30 rounded hover:bg-gwoe-accent/10 transition-colors"
        >
          + Add Role
        </button>
      )}

      {riskModal && (
        <RiskAssessmentModal
          role={riskModal.role}
          assessment={riskModal.assessment}
          onClose={() => setRiskModal(null)}
        />
      )}
    </div>
  );
}
