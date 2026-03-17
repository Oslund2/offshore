// Demo mode API — fully in-memory, no Supabase required
// Uses seedData.json to provide a realistic, interactive experience

import seedData from './seedData.json';
import { generateRationale, generateRiskAssessment, analyzeInsights, generateExecutiveSummary } from './aiEngine';

// Build in-memory database from seed data
let nextDeptId = 1;
let nextRoleId = 1;
const db = { businessUnits: [], departments: [], roles: [] };

function initDemo() {
  if (db.businessUnits.length > 0) return; // already initialized

  for (const bu of seedData.businessUnits) {
    db.businessUnits.push({ id: bu.id, name: bu.name, description: bu.description });

    for (const dept of bu.departments) {
      const deptId = nextDeptId++;
      db.departments.push({ id: deptId, business_unit_id: bu.id, name: dept.name });

      for (const role of dept.roles) {
        db.roles.push({
          id: nextRoleId++,
          department_id: deptId,
          role_name: role.roleName,
          level: role.level,
          candidate_for_offshore: role.candidateForOffshore,
          recommendation: role.recommendation,
          qualitative_why: role.qualitativeWhy,
          current_fte: role.currentFTE,
          estimated_spend: role.estimatedSpend,
        });
      }
    }
  }
}

initDemo();

export const demoApi = {
  async getBusinessUnits() {
    return db.businessUnits.map(bu => ({
      ...bu,
      departments: db.departments.filter(d => d.business_unit_id === bu.id),
    }));
  },

  async getBusinessUnit(id) {
    const bu = db.businessUnits.find(b => b.id === id);
    if (!bu) throw new Error('Business unit not found');

    const departments = db.departments
      .filter(d => d.business_unit_id === id)
      .map(d => ({
        ...d,
        roles: db.roles.filter(r => r.department_id === d.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { ...bu, departments };
  },

  async createRole(data) {
    const role = { id: nextRoleId++, ...data };
    db.roles.push(role);
    return role;
  },

  async updateRole(id, data) {
    const idx = db.roles.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    db.roles[idx] = { ...db.roles[idx], ...data };
    return db.roles[idx];
  },

  async deleteRole(id) {
    const idx = db.roles.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    db.roles.splice(idx, 1);
    return { success: true };
  },

  async getRollup() {
    const allRoles = db.roles;

    const overall = {
      total_roles: allRoles.length,
      total_fte: allRoles.reduce((s, r) => s + r.current_fte, 0),
      total_spend: allRoles.reduce((s, r) => s + r.estimated_spend, 0),
      offshore_fte: allRoles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.current_fte, 0),
      offshore_spend: allRoles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.estimated_spend, 0),
      partial_fte: allRoles.filter(r => r.recommendation === 'P').reduce((s, r) => s + r.current_fte, 0),
      partial_spend: allRoles.filter(r => r.recommendation === 'P').reduce((s, r) => s + r.estimated_spend, 0),
      retain_fte: allRoles.filter(r => r.recommendation === 'N').reduce((s, r) => s + r.current_fte, 0),
      retain_spend: allRoles.filter(r => r.recommendation === 'N').reduce((s, r) => s + r.estimated_spend, 0),
    };

    const unitMap = {};
    for (const r of allRoles) {
      const dept = db.departments.find(d => d.id === r.department_id);
      if (!dept) continue;
      const bu = db.businessUnits.find(b => b.id === dept.business_unit_id);
      if (!bu) continue;
      if (!unitMap[bu.id]) unitMap[bu.id] = { id: bu.id, name: bu.name, total_roles: 0, total_fte: 0, total_spend: 0, offshore_fte: 0, offshore_spend: 0, retain_fte: 0 };
      unitMap[bu.id].total_roles++;
      unitMap[bu.id].total_fte += r.current_fte;
      unitMap[bu.id].total_spend += r.estimated_spend;
      if (r.recommendation === 'Y') { unitMap[bu.id].offshore_fte += r.current_fte; unitMap[bu.id].offshore_spend += r.estimated_spend; }
      if (r.recommendation === 'N') { unitMap[bu.id].retain_fte += r.current_fte; }
    }
    const byUnit = Object.values(unitMap).sort((a, b) => a.name.localeCompare(b.name));

    const levelMap = {};
    for (const r of allRoles) {
      if (!levelMap[r.level]) levelMap[r.level] = { level: r.level, count: 0, total_fte: 0, offshore_count: 0, retain_count: 0 };
      levelMap[r.level].count++;
      levelMap[r.level].total_fte += r.current_fte;
      if (r.recommendation === 'Y') levelMap[r.level].offshore_count++;
      if (r.recommendation === 'N') levelMap[r.level].retain_count++;
    }
    const byLevel = Object.values(levelMap).sort((a, b) => a.level.localeCompare(b.level));

    return { overall, byUnit, byLevel };
  },

  getAutoRationale(data) {
    return Promise.resolve(generateRationale(data));
  },

  getRiskAssessment(data) {
    return Promise.resolve(generateRiskAssessment(data));
  },

  getAIInsights(data) {
    return Promise.resolve(analyzeInsights(data));
  },

  async getExecutiveSummary() {
    const allRoles = db.roles;
    const unitMap = {};
    for (const r of allRoles) {
      const dept = db.departments.find(d => d.id === r.department_id);
      if (!dept) continue;
      const bu = db.businessUnits.find(b => b.id === dept.business_unit_id);
      if (!bu) continue;
      if (!unitMap[bu.id]) unitMap[bu.id] = { name: bu.name, roles: [] };
      unitMap[bu.id].roles.push(r);
    }
    return generateExecutiveSummary(allRoles, Object.values(unitMap));
  },
};
