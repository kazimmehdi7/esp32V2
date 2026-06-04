'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-[#2E4862] text-white h-14 flex items-center justify-between px-8 shadow-md">
      {/* Left side: Logo and Tagline */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
        <span className="text-2xl">🤖</span>
        <div>
          <h1 className="font-poppins font-semibold text-base leading-tight">
            ESP32 IoT Platform
          </h1>
          <p className="font-poppins text-xs text-gray-300 leading-tight">
            Build real IoT projects visually
          </p>
        </div>
      </div>

      {/* Center: Nav links */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => router.push('/playground')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          🧩 Playground
        </button>
        <button
          onClick={() => router.push('/learn')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/learn' || pathname?.startsWith('/learn/')
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          📚 Learn
        </button>
        <button
          onClick={() => router.push('/activities')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/activities' || pathname?.startsWith('/activities/')
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          ⚡ Activities
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          🏠 Dashboard
        </button>
      </div>

      {/* Right side: Badge chips / Profile */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-poppins font-medium">
              {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full text-xs font-poppins font-medium transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <span className="bg-white text-[#2E4862] px-3 py-1 rounded-full text-xs font-poppins font-medium">
              ESP32
            </span>
            <button
              onClick={() => router.push('/login')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded-full text-xs font-poppins font-bold transition-colors"
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </header>
  );
}