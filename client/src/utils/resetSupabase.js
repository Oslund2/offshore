// Resets Supabase to the template structure with no roles.
// Seeds business units and departments from seedData. Users add their own roles
// (with FTE, spend, recommendations) in live mode.

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

  // 2. Re-seed business units and departments only — no roles
  for (const bu of seedData.businessUnits) {
    const { error: buErr } = await supabase
      .from('business_units')
      .insert({ id: bu.id, name: bu.name, description: bu.description });
    if (buErr) throw new Error(`Failed to insert unit ${bu.name}: ${buErr.message}`);

    for (const dept of bu.departments) {
      const { error: deptErr } = await supabase
        .from('departments')
        .insert({ business_unit_id: bu.id, name: dept.name });
      if (deptErr) throw new Error(`Failed to insert dept ${dept.name}: ${deptErr.message}`);
    }
  }
}
