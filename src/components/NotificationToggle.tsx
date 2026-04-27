import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  isPushSupported,
  getCurrentSubscription,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../utils/pushNotifications';

export default function NotificationToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!isPushSupported()) { setSupported(false); return; }
    getCurrentSubscription().then(sub => setSubscribed(!!sub));
  }, []);

  if (!supported) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromNotifications();
        setSubscribed(false);
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        const result = await subscribeToNotifications();
        if (result) setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
        subscribed
          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] hover:bg-sky-400'
          : 'bg-[#111111] text-[#6b7280] border-[#333333] hover:border-[#0ea5e9] hover:text-[#0ea5e9]'
      }`}
      title={subscribed ? 'Turn off rate alerts' : 'Get rate change alerts'}
    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {loading ? 'Updating…' : subscribed ? 'Alerts On' : 'Get Alerts'}
    </button>
  );
}
