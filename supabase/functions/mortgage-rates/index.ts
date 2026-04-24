// Supabase Edge Function: mortgage-rates
// Proxies FRED API calls with 5-minute DB cache and handles push subscription management.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FRED_KEY = Deno.env.get('FRED_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CACHE_TTL_SECONDS = 300;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Push subscription management via POST
  if (req.method === 'POST') {
    const body = await req.json() as { action: string; subscription?: object; endpoint?: string };

    if (body.action === 'subscribe' && body.subscription) {
      const { error } = await supabase.from('push_subscriptions').upsert(
        { subscription: body.subscription, created_at: new Date().toISOString() },
        { onConflict: 'subscription->endpoint' }
      );
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (body.action === 'unsubscribe' && body.endpoint) {
      await supabase.from('push_subscriptions').delete().eq('subscription->>endpoint', body.endpoint);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders });
  }

  // FRED proxy via GET
  const seriesId = url.searchParams.get('series_id');
  if (!seriesId) {
    return new Response(JSON.stringify({ error: 'series_id required' }), { status: 400, headers: corsHeaders });
  }

  const cacheKey = `${seriesId}:${url.searchParams.get('observation_start') ?? 'latest'}`;

  // Check cache
  const { data: cached } = await supabase
    .from('mortgage_rate_cache')
    .select('payload, cached_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cached) {
    const age = (Date.now() - new Date(cached.cached_at as string).getTime()) / 1000;
    if (age < CACHE_TTL_SECONDS) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }
  }

  // Fetch from FRED
  const fredParams = new URLSearchParams(url.searchParams);
  fredParams.set('api_key', FRED_KEY);
  fredParams.set('file_type', 'json');
  const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${fredParams}`;

  const fredRes = await fetch(fredUrl);
  if (!fredRes.ok) {
    return new Response(JSON.stringify({ error: 'FRED API error', status: fredRes.status }), {
      status: 502,
      headers: corsHeaders,
    });
  }

  const payload = await fredRes.json();

  // Upsert cache
  await supabase.from('mortgage_rate_cache').upsert({
    cache_key: cacheKey,
    payload,
    cached_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
});
