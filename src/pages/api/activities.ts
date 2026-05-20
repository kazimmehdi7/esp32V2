import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only GET is supported
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { data, error } = await createClient()
      .from('activities')
      .select(`
        *,
        intro_headline,
        intro_what,
        intro_why,
        assemble,
        code,
        playgroundBlocks,
        output,
        bonusChallenge,
        wiringComponent`
      );

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    // Transform DB rows into expected shape
    const transformed = (data ?? []).map((a: any) => ({
      ...a,
      intro: {
        headline: a.intro_headline,
        what: a.intro_what,
        why: a.intro_why,
      },
    }));

    // Return the array of activities
    return res.status(200).json(transformed);

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    // Return the array of activities
    return res.status(200).json(data);
  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
