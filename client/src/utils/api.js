const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'API request failed');
  }
  return res.json();
}

export const api = {
  // Business Units
  getBusinessUnits: () => fetchJSON('/business-units'),
  getBusinessUnit: (id) => fetchJSON(`/business-units/${id}`),

  // Roles
  createRole: (data) => fetchJSON('/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id, data) => fetchJSON(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id) => fetchJSON(`/roles/${id}`, { method: 'DELETE' }),

  // Dashboard
  getRollup: () => fetchJSON('/dashboard/rollup'),
  getUnitRollup: (unitId) => fetchJSON(`/dashboard/rollup/${unitId}`),

  // AI
  getAutoRationale: (data) => fetchJSON('/ai/rationale', { method: 'POST', body: JSON.stringify(data) }),
  getRiskAssessment: (data) => fetchJSON('/ai/risk-assessment', { method: 'POST', body: JSON.stringify(data) }),
  getAIInsights: (data) => fetchJSON('/ai/insights', { method: 'POST', body: JSON.stringify(data) }),
  getExecutiveSummary: () => fetchJSON('/ai/executive-summary', { method: 'POST', body: '{}' }),
};
