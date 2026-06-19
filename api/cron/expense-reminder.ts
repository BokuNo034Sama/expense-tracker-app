import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BHQmgmTx9pHYNVB5IQRgwxIzY6eBFBYTUExkRCLnrEC305sIUN7VEpxGCEEKD76TRmEdzTSHUg9S1jndYAIEibY';

const slangAlerts = [
  {
    title: '⚠️ KINY_OS: Abeg, how money take waka today?',
    body: 'You never log any expense today o. Chook eye inside your budget make your money no evaporate.'
  },
  {
    title: '🚨 KINY_OS: Your money dey bleed!',
    body: 'No let urgent 2k enter you unawares. Log your expenses now to trace where your cash go.'
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const webpushPrivateKey = process.env.WEBPUSH_PRIVATE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration is missing on the server.' });
  }

  // Setup Web Push credentials
  if (webpushPrivateKey) {
    try {
      webpush.setVapidDetails(
        'mailto:support@kiny.os',
        VAPID_PUBLIC_KEY,
        webpushPrivateKey
      );
    } catch (vapidErr) {
      console.error('[API] Failed to configure VAPID details:', vapidErr);
    }
  } else {
    console.warn('[API] WEBPUSH_PRIVATE_KEY not configured. Web push triggers will be mocked/logged.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST Request: Direct Notification trigger (e.g. for testing a specific subscription)
  if (req.method === 'POST') {
    try {
      const { subscription, title, body } = req.body;
      if (!subscription) {
        return res.status(400).json({ error: 'Missing subscription payload' });
      }

      const selectedAlert = slangAlerts[Math.floor(Math.random() * slangAlerts.length)];
      const payload = JSON.stringify({
        title: title || selectedAlert.title,
        body: body || selectedAlert.body,
        icon: '/kiny-logo.png',
        badge: '/badge-72x72.png',
        tag: 'daily-reminder',
        vibrate: [100, 50, 100]
      });

      if (webpushPrivateKey) {
        await webpush.sendNotification(subscription, payload);
        return res.status(200).json({ success: true, message: 'Push notification sent successfully.' });
      } else {
        console.log('[API] Mock Push Sent to subscription:', subscription, 'Payload:', payload);
        return res.status(200).json({ 
          success: true, 
          mocked: true, 
          message: 'Notification trigger mocked. Add WEBPUSH_PRIVATE_KEY to send live.' 
        });
      }
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  // GET Request: Scheduled Cron-job (reminds all users who haven't logged a transaction today)
  if (req.method === 'GET') {
    // Basic verification for cron authorization (if CRON_SECRET is configured)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}` && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized cron execution request' });
    }

    try {
      // Fetch all user profiles that have a push subscription
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, push_subscription, last_logged_date');

      if (profileError) {
        throw new Error(`Failed to query profiles: ${profileError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        return res.status(200).json({ message: 'No profiles found in database.' });
      }

      // Calculate today's date in Africa/Lagos (Lagos timezone Kiny OS standard)
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

      let attempted = 0;
      let sent = 0;
      let skipped = 0;
      let failed = 0;

      const results = [];

      for (const profile of profiles) {
        if (!profile.push_subscription) {
          skipped++;
          continue;
        }

        // Check if user has already logged a transaction today
        if (profile.last_logged_date === todayStr) {
          skipped++;
          continue;
        }

        attempted++;
        const selectedAlert = slangAlerts[Math.floor(Math.random() * slangAlerts.length)];
        const payload = JSON.stringify({
          title: selectedAlert.title,
          body: selectedAlert.body,
          icon: '/kiny-logo.png',
          badge: '/badge-72x72.png',
          tag: 'daily-reminder',
          vibrate: [100, 50, 100]
        });

        try {
          const subscriptionObj = typeof profile.push_subscription === 'string' 
            ? JSON.parse(profile.push_subscription) 
            : profile.push_subscription;

          if (webpushPrivateKey) {
            await webpush.sendNotification(subscriptionObj, payload);
            sent++;
          } else {
            console.log(`[API] Mock push to ${profile.name || profile.id}:`, payload);
            sent++;
          }
          results.push({ id: profile.id, status: 'success' });
        } catch (pushErr) {
          failed++;
          console.error(`[API] Failed to push to profile ${profile.id}:`, pushErr);
          results.push({ id: profile.id, status: 'failed', error: (pushErr as Error).message });
        }
      }

      return res.status(200).json({
        success: true,
        summary: {
          total_profiles: profiles.length,
          skipped_or_no_sub: skipped,
          attempted_reminders: attempted,
          successfully_sent: sent,
          failures: failed
        },
        results
      });

    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
