"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signInWithGoogle, signInWithGithub } from './actions';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — Auth (login / signup)
   Premium split screen. Email is the default method; Google + GitHub below.

   Server actions (signIn / signUp / signInWithGoogle / signInWithGithub)
   are kept exactly as-is and wired via form action / formAction.

   Password strength meter + requirement checklist is shown live. On sign up,
   a weak password is blocked client-side (UX guard). NOTE: this is a
   client-side guard only — the signUp server action should ALSO validate
   password strength for real security.
   ════════════════════════════════════════════════════════════════════════ */

// ── password strength helper ──
function scorePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let score = 0;
  if (pw.length > 0) {
    if (passed <= 1) score = 0;
    else if (passed === 2) score = 1;
    else if (passed === 3) score = 2;
    else if (passed === 4) score = 3;
    else score = 4;
  }
  return { checks, passed, score };
}

const STRENGTH = [
  { label: 'Very weak', color: '#ef4444' },
  { label: 'Weak', color: '#f59e0b' },
  { label: 'Fair', color: '#eab308' },
  { label: 'Good', color: '#22c55e' },
  { label: 'Strong', color: '#10b981' },
];

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');

  const { checks, score } = scorePassword(password);
  // require: 8+ chars and at least 3 of the 4 character-type checks
  const isStrongEnough =
    checks.length &&
    [checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean).length >= 3;

  // ── custom cursor (matches landing page) ──
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [cursorBig, setCursorBig] = useState(false);
  const ringRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; setMousePos({ x: e.clientX, y: e.clientY }); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  useEffect(() => {
    const animate = () => {
      ringRef.current.x += (mouseRef.current.x - ringRef.current.x) * 0.12;
      ringRef.current.y += (mouseRef.current.y - ringRef.current.y) * 0.12;
      setRingPos({ x: ringRef.current.x, y: ringRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  const ip = { onMouseEnter: () => setCursorBig(true), onMouseLeave: () => setCursorBig(false) };

  // block weak password on sign up (client-side UX guard)
  const guardSignup: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!isStrongEnough) {
      e.preventDefault();
      setPwError('Please choose a stronger password before creating your account.');
    } else {
      setPwError('');
    }
  };

  return (
    <div style={{ fontFamily: '"Inter",system-ui,sans-serif', background: '#04080f', color: '#f0f4ff', minHeight: '100vh', display: 'flex', cursor: 'none' }}>

      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: clip; }
        body { cursor: none !important; }
        a, button, input { cursor: none !important; }
        input::placeholder { color: rgba(240,244,255,0.3); }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
        .auth-input { width:100%; padding:13px 15px; border-radius:11px; font-size:14px; font-weight:500;
          color:#f0f4ff; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.09);
          outline:none; transition:all .2s; font-family:"Inter",sans-serif; }
        .auth-input:focus { border-color:rgba(59,130,246,0.5); background:rgba(59,130,246,0.05); box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .submit-btn:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(37,99,235,0.45) !important; }
        .oauth-btn:hover { background:rgba(255,255,255,0.05) !important; border-color:rgba(255,255,255,0.16) !important; }
        .ghost-link:hover { color:#93c5fd !important; }
        .animate-slideDown { animation: slideDown .3s ease-out forwards; }
        h1,h2,h3 { font-family:"Space Grotesk",sans-serif; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* custom cursor */}
      <div style={{ position: 'fixed', width: cursorBig ? 6 : 10, height: cursorBig ? 6 : 10, borderRadius: '50%', background: '#3b82f6', pointerEvents: 'none', zIndex: 9999, left: mousePos.x, top: mousePos.y, transform: 'translate(-50%,-50%)', transition: 'width .2s,height .2s', mixBlendMode: 'difference' }} />
      <div style={{ position: 'fixed', width: cursorBig ? 50 : 36, height: cursorBig ? 50 : 36, borderRadius: '50%', border: `1px solid rgba(59,130,246,${cursorBig ? 0.7 : 0.4})`, pointerEvents: 'none', zIndex: 9998, left: ringPos.x, top: ringPos.y, transform: 'translate(-50%,-50%)', transition: 'width .25s,height .25s,border-color .25s' }} />

      {/* ════════ LEFT — branded panel ════════ */}
      <div className="auth-left" style={{ flex: '1 1 50%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px', background: 'linear-gradient(160deg,#04080f 0%,#060d19 45%,#081120 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)', backgroundSize: '54px 54px', maskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%,black,transparent)' }} />
        <div style={{ position: 'absolute', top: '-25%', right: '-20%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-25%', left: '-15%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(217,119,6,0.07) 0%,transparent 60%)', pointerEvents: 'none' }} />

        {/* brand: name + clear "A product by Mediatiz Foundation" text */}
        <div onClick={() => router.push('/home')} {...ip} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 13, cursor: 'none', alignSelf: 'flex-start' }}>
          <div style={{ width: 100, height: 100, borderRadius: 12, background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(59,130,246,0.3),0 8px 24px rgba(37,99,235,0.25)' }}>
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <p style={{ fontSize: 56, fontWeight: 700, color: '#f0f4ff', fontFamily: '"Space Grotesk",sans-serif' }}>BuildMind</p>
            <p style={{ fontSize: 31, color: 'rgba(240,244,255,0.7)', fontWeight: 500 }}>
              A product by <span style={{ color: '#93c5fd', fontWeight: 600 }}>Mediatiz Foundation</span>
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 99, padding: '6px 15px', marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>ESP32 IoT Learning Platform</span>
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(34px,3.4vw,46px)', lineHeight: 1.05, letterSpacing: -1.8, marginBottom: 22 }}>
            Build real hardware,<br />
            <span style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>one guided step</span> at a time.
          </h1>
          <p style={{ fontSize: 15.5, color: 'rgba(240,244,255,0.55)', lineHeight: 1.8, marginBottom: 30 }}>
            Block coding, a live simulator, guided wiring, and one click flashing to a real ESP32. Everything a student needs from Class 2 to Class 12.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[
              'Drag and drop block coding with real Arduino output',
              'Wire It Up stepper that animates every connection',
              'Flash the same code straight to your ESP32',
            ].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>
                </span>
                <span style={{ fontSize: 13.5, color: 'rgba(240,244,255,0.6)', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 30, alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[{ v: '550K+', l: 'Students' }, { v: '10K+', l: 'Teachers' }, { v: '3,500+', l: 'Schools' }].map(s => (
            <div key={s.l}>
              <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 19, fontWeight: 700, color: '#f0f4ff', lineHeight: 1 }}>{s.v}</p>
              <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.45)', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.l}</p>
            </div>
          ))}
          <p style={{ fontSize: 10.5, color: 'rgba(240,244,255,0.4)', maxWidth: 140, lineHeight: 1.5, marginLeft: 'auto' }}>UNESCO Global MIL Alliance Member</p>
        </div>
      </div>

      {/* ════════ RIGHT — auth card ════════ */}
      <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 408, animation: 'fadeIn .5s ease' }}>

          {/* mobile-only brand line (left panel hidden under 880px) */}
          <p className="brand-mobile" style={{ display: 'none', textAlign: 'center', marginBottom: 22, fontSize: 12, color: 'rgba(240,244,255,0.6)' }}>
            <strong style={{ color: '#f0f4ff', fontFamily: '"Space Grotesk",sans-serif', fontWeight: 700, fontSize: 15 }}>Build Mind</strong><br />
            A product by <span style={{ color: '#93c5fd', fontWeight: 600 }}>Mediatiz Foundation</span>
          </p>

          {/* login / signup toggle */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, marginBottom: 26 }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setPwError(''); }} {...ip} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'none',
                fontFamily: '"Inter",sans-serif', border: 'none', transition: 'all .25s',
                color: mode === m ? '#fff' : 'rgba(240,244,255,0.5)',
                background: mode === m ? 'linear-gradient(135deg,#1a3a8a,#2563eb)' : 'transparent',
                boxShadow: mode === m ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
              }}>{m === 'login' ? 'Log in' : 'Sign up'}</button>
            ))}
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.5)', marginBottom: 26, lineHeight: 1.6 }}>
            {mode === 'login'
              ? 'Log in to sync your progress and open the platform.'
              : 'Start building with the free platform in under a minute.'}
          </p>

          {/* message banner (kept from original) */}
          {searchParams?.message && (
            <div className="animate-slideDown" style={{ marginBottom: 18, padding: '12px 15px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 11, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6ee7b7' }}>
              {searchParams.message}
            </div>
          )}

          {/* weak password warning */}
          {pwError && (
            <div className="animate-slideDown" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 18, padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 11 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
              <span style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{pwError}</span>
            </div>
          )}

          {/* ── EMAIL FORM (default / primary) ── */}
          {/* action={signIn} makes Enter default to Log in; the buttons override with formAction */}
          <form action={signIn}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle} htmlFor="email">Email</label>
              <input className="auth-input" id="email" name="email" type="email" placeholder="you@example.com" required {...ip} />
            </div>
            <div style={{ marginBottom: mode === 'signup' && password ? 14 : 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle} htmlFor="password">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => router.push('/reset-password')} {...ip} className="ghost-link" style={{ background: 'none', border: 'none', cursor: 'none', fontSize: 11.5, fontWeight: 600, color: 'rgba(240,244,255,0.45)', fontFamily: '"Inter",sans-serif', transition: 'color .2s', marginBottom: 8 }}>Forgot password?</button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" id="password" name="password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => { setPassword(e.target.value); if (pwError) setPwError(''); }}
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Your password'} required style={{ paddingRight: 44 }} {...ip} />
                <button type="button" onClick={() => setShowPw(s => !s)} {...ip} aria-label="Toggle password visibility" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'none', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPw
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(240,244,255,0.45)" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(240,244,255,0.45)" strokeWidth="2"><path d="M17.94 17.94A10 10 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.16 3.19M1 1l22 22" /></svg>}
                </button>
              </div>
            </div>

            {/* ── PASSWORD STRENGTH (sign up only, after typing) ── */}
            {mode === 'signup' && password.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <span key={i} style={{ flex: 1, height: 4, borderRadius: 99, transition: 'background .25s', background: i <= score ? STRENGTH[score].color : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: STRENGTH[score].color, fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.04em' }}>{STRENGTH[score].label}</span>
                  {isStrongEnough && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Good to go</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 12px' }}>
                  {[
                    { ok: checks.length, t: 'At least 8 characters' },
                    { ok: checks.upper, t: 'An uppercase letter' },
                    { ok: checks.lower, t: 'A lowercase letter' },
                    { ok: checks.number, t: 'A number' },
                    { ok: checks.symbol, t: 'A symbol (!?@#)' },
                  ].map(r => (
                    <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.ok ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${r.ok ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, transition: 'all .2s' }}>
                        {r.ok
                          ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>
                          : <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />}
                      </span>
                      <span style={{ fontSize: 11.5, color: r.ok ? 'rgba(240,244,255,0.7)' : 'rgba(240,244,255,0.4)', transition: 'color .2s' }}>{r.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary button changes with mode; both use your server actions */}
            {mode === 'login' ? (
              <button formAction={signIn} className="submit-btn" {...ip} style={primaryBtn}>Log in →</button>
            ) : (
              <button formAction={signUp} onClick={guardSignup} className="submit-btn" {...ip}
                style={{ ...primaryBtn, opacity: password.length > 0 && !isStrongEnough ? 0.6 : 1 }}>
                Create account →
              </button>
            )}
          </form>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── OAUTH (secondary) ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <form action={signInWithGoogle} style={{ flex: 1 }}>
              <button type="submit" className="oauth-btn" {...ip} style={oauthStyle}>
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </form>
            <form action={signInWithGithub} style={{ flex: 1 }}>
              <button type="submit" className="oauth-btn" {...ip} style={oauthStyle}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#f0f4ff"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                GitHub
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 26, fontSize: 13.5, color: 'rgba(240,244,255,0.5)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setPwError(''); }} {...ip} className="ghost-link" style={{ background: 'none', border: 'none', cursor: 'none', fontSize: 13.5, fontWeight: 700, color: '#60a5fa', fontFamily: '"Inter",sans-serif', transition: 'color .2s' }}>
              {mode === 'login' ? 'Sign up free' : 'Log in'}
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: 'rgba(240,244,255,0.35)', lineHeight: 1.6, fontFamily: '"JetBrains Mono",monospace' }}>
            © 2026 Mediatiz Foundation
          </p>
        </div>
      </div>

      {/* responsive: hide left panel + show mobile brand line under 880px */}
      <style>{`
        @media (max-width: 880px){
          .auth-left{ display:none !important; }
          .brand-mobile{ display:block !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(240,244,255,0.6)',
  marginBottom: 8, letterSpacing: '0.02em', fontFamily: '"Inter",sans-serif',
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff',
  background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', border: 'none', cursor: 'none',
  fontFamily: '"Inter",sans-serif', boxShadow: '0 8px 28px rgba(37,99,235,0.4)', transition: 'all .25s',
};

const oauthStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  padding: '11px 0', borderRadius: 11, fontSize: 13.5, fontWeight: 700, color: 'rgba(240,244,255,0.85)',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
  cursor: 'none', fontFamily: '"Inter",sans-serif', transition: 'all .2s',
};
