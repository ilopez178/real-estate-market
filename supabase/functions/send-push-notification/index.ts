// Supabase Edge Function: send-push-notification
// Broadcasts a Web Push notification to all stored subscribers.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { title = 'Mortgage Rate Alert', body = 'Rates have changed — check the dashboard.', url = '/' } =
    await req.json() as { title?: string; body?: string; url?: string };

  const { data: subs, error } = await supabase.from('push_subscriptions').select('subscription');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const results = await Promise.allSettled(
    (subs ?? []).map(row =>
      webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        JSON.stringify({ title, body, url })
      ).catch(async (e: { statusCode?: number }) => {
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Subscription expired — remove it
          await supabase.from('push_subscriptions')
            .delete()
            .eq('subscription->>endpoint', (row.subscription as { endpoint: string }).endpoint);
        }
        throw e;
      })
    )
  );

  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return new Response(
    JSON.stringify({ sent, failed, total: results.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
