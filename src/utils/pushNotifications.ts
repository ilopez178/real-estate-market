import type { PushSubscriptionData } from '../types';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToNotifications(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
  });

  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    await fetch(`${SUPABASE_URL}/functions/v1/mortgage-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'subscribe', subscription: json }),
    }).catch(() => undefined);
  }

  return json;
}

export async function unsubscribeFromNotifications(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (!sub) return;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    await fetch(`${SUPABASE_URL}/functions/v1/mortgage-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'unsubscribe', endpoint: sub.endpoint }),
    }).catch(() => undefined);
  }

  await sub.unsubscribe();
}
