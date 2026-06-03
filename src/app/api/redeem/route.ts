import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'Activation code is required' }, { status: 400 });
    }

    // 1. Fetch matching code from database
    const { data: kitCode, error: fetchError } = await supabase
      .from('kit_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !kitCode) {
      return NextResponse.json({ error: 'Invalid activation code' }, { status: 404 });
    }

    // 2. Verify code status
    if (!kitCode.is_active) {
      return NextResponse.json({ error: 'This activation code is inactive' }, { status: 400 });
    }

    // 3. Verify if already redeemed
    if (kitCode.redeemed_by) {
      if (kitCode.redeemed_by === user.id) {
        return NextResponse.json({ error: 'You have already redeemed this kit code' }, { status: 400 });
      }
      return NextResponse.json({ error: 'This kit code has already been redeemed' }, { status: 400 });
    }

    // 4. Update the kit code entry (bind it to user with 1 year expiration)
    const redeemedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    const { error: updateError } = await supabase
      .from('kit_codes')
      .update({
        redeemed_by: user.id,
        redeemed_at: redeemedAt,
        expires_at: expiresAt
      })
      .eq('code', code);

    if (updateError) {
      return NextResponse.json({ error: 'Database update failed: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      kit_type: kitCode.kit_type,
      expires_at: expiresAt
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
