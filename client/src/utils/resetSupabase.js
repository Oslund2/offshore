// Resets Supabase to the template structure with zeroed placeholder roles.
// Same units, departments, and role names as demo — but $0 spend, 0 FTE,
// and blank recommendations. Users edit the values in live mode.

import { supabase } from './supabaseClient';
import seedData from './seedData.json';

export async function resetSupabase() {
  // 1. Clear everything (roles → departments → business_units)
  const { error: rolesErr } = await supabase.from('roles').delete().neq('id', 0);
  if (rolesErr) throw new Error(`Failed to clear roles: ${rolesErr.message}`);

  const { error: deptsErr } = await supabase.from('departments').delete().neq('id', 0);
  if (deptsErr) throw new Error(`Failed to clear departments: ${deptsErr.message}`);

  const { error: busErr } = await supabase.from('business_units').delete().neq('id', '');
  if (busErr) throw new Error(`Failed to clear business units: ${busErr.message}`);

  // 2. Re-seed with zeroed placeholder roles
  for (const bu of seedData.businessUnits) {
    const { error: buErr } = await supabase
      .from('business_units')
      .insert({ id: bu.id, name: bu.name, description: bu.description });
    if (buErr) throw new Error(`Failed to insert unit ${bu.name}: ${buErr.message}`);

    for (const dept of bu.departments) {
      const { data: deptData, error: deptErr } = await supabase
        .from('departments')
        .insert({ business_unit_id: bu.id, name: dept.name })
        .select('id')
        .single();
      if (deptErr) throw new Error(`Failed to insert dept ${dept.name}: ${deptErr.message}`);

      const roles = dept.roles.map(r => ({
        department_id: deptData.id,
        role_name: r.roleName,
        level: r.level,
        candidate_for_offshore: 'N',
        recommendation: 'N',
        qualitative_why: '',
        current_fte: 0,
        estimated_spend: 0,
      }));

      const { error: roleErr } = await supabase.from('roles').insert(roles);
      if (roleErr) throw new Error(`Failed to insert roles for ${dept.name}: ${roleErr.message}`);
    }
  }
}
