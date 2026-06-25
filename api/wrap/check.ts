import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow passing a ?bypass=true or ?date=2026-06-30 query parameter in development/testing
  const bypass = req.query.bypass === 'true';
  const queryDate = req.query.date as string;

  let checkDateStr = '';
  if (queryDate) {
    checkDateStr = queryDate;
  } else {
    // Current date in Lagos time (Africa/Lagos)
    const options = { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA format yields YYYY-MM-DD
    checkDateStr = formatter.format(new Date());
  }

  // Launch Week Wrap: June 30, 2026
  // 3-Month Deep-Dive: September 30, 2026
  const isLaunchWeek = checkDateStr === '2026-06-30';
  const isThreeMonth = checkDateStr === '2026-09-30';

  const enabled = bypass || isLaunchWeek || isThreeMonth;
  const mode = isLaunchWeek ? 'launch-week' : isThreeMonth ? '3-month' : (bypass ? 'launch-week' : null);

  return res.status(200).json({ enabled, mode, date: checkDateStr });
}
