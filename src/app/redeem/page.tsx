'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActivityStore } from '@/store/useActivityStore';
import { createClient } from '@/utils/supabase/client';

export default function RedeemPage() {
  const router = useRouter();
  const { addRedeemedKit, redeemedKits, initialize } = useActivityStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setActiveUser(user);
        await initialize();
      }
    };
    checkUser();
  }, [router, initialize]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem code');
      }

      setSuccess(true);
      addRedeemedKit(data.kit_type || 'esp32');
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/learn');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#121b28] via-[#1a293d] to-[#111a24] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-300">
        
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-3xl shadow-lg shadow-orange-500/20 mb-4 animate-pulse">
            🤖
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Activate Hardware Kit</h1>
          <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Enter the activation code printed on the back of your ESP32 physical kit packaging to unlock the full simulator, curriculum, and AI assistant.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6 animate-pulse">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl mb-4 border border-emerald-500/30">
              ✓
            </div>
            <h2 className="text-lg font-bold text-white">Activation Successful!</h2>
            <p className="text-xs text-gray-400 mt-1">Unlocking your learning materials...</p>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Activation Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ESP32-XXXX-XXXX"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 font-mono text-center tracking-widest"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-orange-500/10"
            >
              {loading ? 'Verifying...' : 'Activate Access'}
            </button>
          </form>
        )}

        {/* Footer info/Skip */}
        {!success && (
          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              Skip for Now (Limited Preview)
            </button>
            
            {redeemedKits.length > 0 && (
              <div className="text-[10px] text-gray-500 mt-2">
                Already active: <span className="text-emerald-400 font-bold uppercase">{redeemedKits.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
