import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function CallbackPage() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    // authentication failed, send back to login with error message
    redirect('/login?message=Authentication%20failed');
  }
  // Successful login, redirect to dashboard or landing page
  redirect('/dashboard');
}
