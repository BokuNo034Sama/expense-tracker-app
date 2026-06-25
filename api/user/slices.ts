import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
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

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: ' + (authError?.message || 'Invalid token') });
  }

  const { slices } = req.body;
  if (!slices || !Array.isArray(slices)) {
    return res.status(400).json({ error: 'Missing or invalid slices parameter. Must be an array.' });
  }

  // Validate slice total percentage
  const totalPercentage = slices.reduce((sum: number, s: any) => sum + (Number(s.allocated_percentage) || 0), 0);
  if (totalPercentage !== 100) {
    return res.status(400).json({ error: `Total percentage must equal exactly 100% (got ${totalPercentage}%)` });
  }

  // Validate each slice
  for (const s of slices) {
    if (!s.slice_name || !s.slice_name.trim()) {
      return res.status(400).json({ error: 'Slice name is required for all slices.' });
    }
    if (!s.slice_type || !s.slice_type.trim()) {
      return res.status(400).json({ error: 'Slice type is required for all slices.' });
    }
    const pct = Number(s.allocated_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ error: `Invalid percentage for slice "${s.slice_name}".` });
    }
  }

  try {
    // 1. Delete all existing slices for the user
    const { error: deleteError } = await supabase
      .from('budget_slices')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to clear old configurations: ' + deleteError.message });
    }

    // 2. Insert new slices
    const payload = slices.map((s: any) => ({
      user_id: user.id,
      slice_name: s.slice_name.trim(),
      slice_type: s.slice_type.trim(),
      allocated_percentage: Number(s.allocated_percentage)
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('budget_slices')
      .insert(payload)
      .select();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to save new slices: ' + insertError.message });
    }

    // 3. Update enabled_slices on the profile for compatibility
    const sliceNames = slices.map((s: any) => s.slice_name.trim());
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ enabled_slices: sliceNames })
      .eq('id', user.id);

    if (profileError) {
      console.error('[KINY] Warning: Failed to sync enabled_slices to profile:', profileError.message);
    }

    return res.status(200).json({ success: true, slices: insertedData });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
