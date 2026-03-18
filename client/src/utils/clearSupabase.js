import { supabase } from './supabaseClient';

export async function clearSupabase() {
  // Delete in order: roles → departments → business_units (respecting FK constraints)
  const { error: rolesErr } = await supabase.from('roles').delete().neq('id', 0);
  if (rolesErr) throw new Error(`Failed to clear roles: ${rolesErr.message}`);

  const { error: deptsErr } = await supabase.from('departments').delete().neq('id', 0);
  if (deptsErr) throw new Error(`Failed to clear departments: ${deptsErr.message}`);

  const { error: busErr } = await supabase.from('business_units').delete().neq('id', '');
  if (busErr) throw new Error(`Failed to clear business units: ${busErr.message}`);
}
