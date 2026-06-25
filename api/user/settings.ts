import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration is missing on the server.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the user corresponding to the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: ' + (authError?.message || 'Invalid token') });
  }

  const { payday_anchor_day } = req.body;
  
  if (payday_anchor_day === undefined || payday_anchor_day === null) {
    return res.status(400).json({ error: 'Missing payday_anchor_day parameter' });
  }

  const parsedDay = Number(payday_anchor_day);
  if (!Number.isInteger(parsedDay)) {
    return res.status(400).json({ error: 'payday_anchor_day must be an integer' });
  }

  try {
    // Retrieve the user profile to inspect their income_type/role
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('income_type')
      .eq('id', user.id)
      .single();

    if (fetchError || !profile) {
      return res.status(500).json({ error: 'Failed to fetch user profile: ' + (fetchError?.message || 'Profile not found') });
    }

    const incomeType = profile.income_type;

    // Perform validation depending on the user track/role
    if (incomeType === 'student') {
      // Students can choose Weekly Reset (0) or customizable flexible date (1-31)
      if (parsedDay < 0 || parsedDay > 31) {
        return res.status(400).json({ error: 'For students, payday_anchor_day must be between 0 (Weekly Reset) and 31' });
      }
    } else {
      // Default / Salary Earner track: strictly day 25 to day 31
      if (parsedDay < 25 || parsedDay > 31) {
        return res.status(400).json({ error: 'For salary earners, payday_anchor_day must be strictly between 25 and 31' });
      }
    }

    // Update profiles table row
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ anchor_day: parsedDay })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Database update failed: ' + updateError.message });
    }

    return res.status(200).json({ success: true, profile: updatedProfile });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
