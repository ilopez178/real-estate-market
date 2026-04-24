// Supabase Edge Function: db-keepalive
// Runs a lightweight heartbeat query to prevent free-tier DB hibernation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async () => {
  const { error } = await supabase.from('mortgage_rate_cache').select('cache_key').limit(1);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
