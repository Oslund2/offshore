// Run this once to seed your Supabase database with the default GWOE data
// Usage: In browser console or as a one-time script

import { supabase } from './supabaseClient';
import seedData from './seedData.json';

export async function seedSupabase() {
  console.log('Seeding Supabase...');

  // Check if already seeded
  const { data: existing } = await supabase.from('business_units').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  for (const bu of seedData.businessUnits) {
    // Insert business unit
    const { error: buErr } = await supabase
      .from('business_units')
      .insert({ id: bu.id, name: bu.name, description: bu.description });
    if (buErr) { console.error('BU insert error:', buErr); continue; }

    for (const dept of bu.departments) {
      // Insert department
      const { data: deptData, error: deptErr } = await supabase
        .from('departments')
        .insert({ business_unit_id: bu.id, name: dept.name })
        .select('id')
        .single();
      if (deptErr) { console.error('Dept insert error:', deptErr); continue; }

      // Insert roles
      const roles = dept.roles.map(r => ({
        department_id: deptData.id,
        role_name: r.roleName,
        level: r.level,
        candidate_for_offshore: r.candidateForOffshore,
        recommendation: r.recommendation,
        qualitative_why: r.qualitativeWhy,
        current_fte: r.currentFTE,
        estimated_spend: r.estimatedSpend,
      }));

      const { error: roleErr } = await supabase.from('roles').insert(roles);
      if (roleErr) console.error('Role insert error:', roleErr);
    }
  }

  console.log('Seeding complete!');
}
