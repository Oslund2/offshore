import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
