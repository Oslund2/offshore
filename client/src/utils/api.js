import { supabase } from './supabaseClient';
import { generateRationale, generateRiskAssessment, analyzeInsights, generateExecutiveSummary } from './aiEngine';

export const api = {
  // Business Units
  async getBusinessUnits() {
    const { data, error } = await supabase
      .from('business_units')
      .select('*, departments(id, name)')
      .order('name');
    if (error) throw new Error(error.message);
    return data;
  },

  async getBusinessUnit(id) {
    const { data: unit, error: unitErr } = await supabase
      .from('business_units')
      .select('*')
      .eq('id', id)
      .single();
    if (unitErr) throw new Error(unitErr.message);

    const { data: departments, error: deptErr } = await supabase
      .from('departments')
      .select('*, roles(*)')
      .eq('business_unit_id', id)
      .order('name');
    if (deptErr) throw new Error(deptErr.message);

    return { ...unit, departments };
  },

  // Business Unit CRUD
  async createBusinessUnit(data) {
    const { data: bu, error } = await supabase
      .from('business_units')
      .insert({ id: data.id || data.name.toLowerCase().replace(/\s+/g, '-'), name: data.name, description: data.description || '' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return bu;
  },

  async updateBusinessUnit(id, data) {
    const { data: bu, error } = await supabase
      .from('business_units')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return bu;
  },

  async deleteBusinessUnit(id) {
    // Delete roles in departments first, then departments, then BU
    const { data: depts } = await supabase.from('departments').select('id').eq('business_unit_id', id);
    if (depts && depts.length > 0) {
      const deptIds = depts.map(d => d.id);
      await supabase.from('roles').delete().in('department_id', deptIds);
      await supabase.from('departments').delete().eq('business_unit_id', id);
    }
    const { error } = await supabase.from('business_units').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Department CRUD
  async createDepartment(data) {
    const { data: dept, error } = await supabase
      .from('departments')
      .insert({ business_unit_id: data.business_unit_id, name: data.name })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return dept;
  },

  async updateDepartment(id, data) {
    const { data: dept, error } = await supabase
      .from('departments')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return dept;
  },

  async deleteDepartment(id) {
    await supabase.from('roles').delete().eq('department_id', id);
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Roles CRUD
  async createRole(data) {
    const { data: role, error } = await supabase
      .from('roles')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return role;
  },

  async updateRole(id, data) {
    const { data: role, error } = await supabase
      .from('roles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return role;
  },

  async deleteRole(id) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Dashboard
  async getRollup() {
    const { data: allRoles, error } = await supabase
      .from('roles')
      .select('*, departments!inner(name, business_unit_id, business_units!inner(id, name))');
    if (error) throw new Error(error.message);

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

    // Group by unit
    const unitMap = {};
    for (const r of allRoles) {
      const uid = r.departments.business_units.id;
      const uname = r.departments.business_units.name;
      if (!unitMap[uid]) unitMap[uid] = { id: uid, name: uname, total_roles: 0, total_fte: 0, total_spend: 0, offshore_fte: 0, offshore_spend: 0, retain_fte: 0 };
      unitMap[uid].total_roles++;
      unitMap[uid].total_fte += r.current_fte;
      unitMap[uid].total_spend += r.estimated_spend;
      if (r.recommendation === 'Y') { unitMap[uid].offshore_fte += r.current_fte; unitMap[uid].offshore_spend += r.estimated_spend; }
      if (r.recommendation === 'N') { unitMap[uid].retain_fte += r.current_fte; }
    }
    const byUnit = Object.values(unitMap).sort((a, b) => a.name.localeCompare(b.name));

    // Group by level
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

  // AI — all client-side now
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
    const { data: allRoles, error } = await supabase
      .from('roles')
      .select('*, departments!inner(name, business_unit_id, business_units!inner(id, name))');
    if (error) throw new Error(error.message);

    // Group roles by unit for the summary generator
    const unitMap = {};
    for (const r of allRoles) {
      const uid = r.departments.business_units.id;
      const uname = r.departments.business_units.name;
      if (!unitMap[uid]) unitMap[uid] = { name: uname, roles: [] };
      unitMap[uid].roles.push(r);
    }
    const byUnit = Object.values(unitMap);

    return generateExecutiveSummary(allRoles, byUnit);
  },
};
