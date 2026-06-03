"use client";
import { useState } from 'react';
// Server actions will dynamically import supabase server client
import { redirect } from 'next/navigation';
import { signIn, signUp, signInWithGoogle, signInWithGithub } from './actions';

export default function Login({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const [showEmailForm, setShowEmailForm] = useState(false);



  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen bg-slate-50 mx-auto">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-500/30 mb-4 animate-bounce-slow">
          V
        </div>
        <h1 className="text-3xl font-black text-[#2E4862]">BuildMind</h1>
        <p className="text-slate-500 font-medium mt-2">Sign in to sync your progress</p>
      </div>

      {/* OAuth Buttons always visible */}
      <div className="flex flex-col gap-3 mb-6">
        <form action={signInWithGoogle}>
          <button type="submit" className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </form>
        <form action={signInWithGithub}>
          <button type="submit" className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 border border-slate-200 bg-[#24292F] text-white font-bold hover:bg-[#1b1f24] transition-colors shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0.319.694.192.576.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </form>
      </div>
        {/* Toggle Email Form */}
        {!showEmailForm && (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full rounded-xl px-4 py-3 border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Sign in with Email
          </button>
        )}
      

      {/* Email/Password Form */}
      {showEmailForm && (
        <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={signIn}>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-6">
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-bold text-slate-700" htmlFor="email">Email</label>
              <input
                className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-slate-700"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2 mb-8">
              <label className="text-sm font-bold text-slate-700" htmlFor="password">Password</label>
              <input
                className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-slate-700"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>
            <button className="bg-[#2E4862] w-full rounded-xl px-4 py-3 text-white mb-3 font-bold hover:bg-[#1f3143] transition-colors shadow-sm">
              Sign In
            </button>
            <button formAction={signUp} className="w-full rounded-xl px-4 py-3 border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors mb-6">
              Sign Up
            </button>
          </div>
        </form>
      )}

      {searchParams?.message && (
        <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 text-center text-sm font-bold rounded-xl border border-emerald-100 animate-slideDown">
          {searchParams.message}
        </div>
      )}

      <style>{`\n        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }\n        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }\n        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }\n        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }\n      `}</style>
    </div>
  );
}