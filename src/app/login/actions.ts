"use server";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }
  return redirect('/learn/level/1/lesson/1-1');
}

export async function signUp(formData: FormData) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }
  return redirect('/login?message=Check email to continue sign in process');
}

export async function signInWithGoogle() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return redirect('/login?message=OAuth%20error');
  }
  if (data?.url) {
    return redirect(data.url);
  }
  return redirect('/login?message=OAuth%20failed');
}

export async function signInWithGithub() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return redirect('/login?message=OAuth%20error');
  }
  if (data?.url) {
    return redirect(data.url);
  }
  return redirect('/login?message=OAuth%20failed');
}
