// Supabase integration module
// Uses the Supabase REST API for cloud data persistence
// Falls back to local SQLite when SUPABASE_URL is not configured

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const isConfigured = SUPABASE_URL && SUPABASE_KEY;

async function supabaseFetch(path, options = {}) {
  if (!isConfigured) return null;

  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Supabase error [${res.status}]: ${text}`);
    return null;
  }

  return res.json();
}

module.exports = {
  isConfigured,
  supabaseFetch,
  SUPABASE_URL,
  SUPABASE_KEY,
};
