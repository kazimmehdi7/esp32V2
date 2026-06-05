'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ACTIVITIES } from '@/lib/activitiesData';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND — DASHBOARD
   Sections: stats · features · status. Drop-in for src/app/dashboard/page.tsx
   ════════════════════════════════════════════════════════════════════════ */

const BG = '#04080f';
const PANEL = '#0a1422';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_SOFT = 'rgba(255,255,255,0.05)';
const TEXT = '#ffffff';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const BLUE_LT = '#93c5fd';
const AMBER = '#f59e0b';
const AMBER_LT = '#fbbf24';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const VIOLET = '#8b5cf6';

// ─── icons (stroke = currentColor) ────────────────────────────────────────────
const I = {
  blocks: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  book: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19V6a2 2 0 0 1 2-2h13v15M4 19a2 2 0 0 0 2 2h13M4 19a2 2 0 0 1 2-2h13" /></svg>),
  bolt: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>),
  target: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>),
  check: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12l5 5L20 6" /></svg>),
  flame: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 9 8 12 3z" /><path d="M12 21a6 6 0 0 0 6-6c0-3-2-5-3-6 .2 2-1 3-2 3.5C12 9 11 7 11 5c-2 2-5 4.5-5 10a6 6 0 0 0 6 6z" opacity="0" /></svg>),
  chip: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /></svg>),
  arrow: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>),
  lock: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>),
  wire: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h6a4 4 0 0 1 4 4v6" /></svg>),
  cpu: (p: any) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>),
};

export default function DashboardPage() {
  const router = useRouter();
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const { completed, streak, isCompleted } = useActivityStore();
  const totalActivities = ACTIVITIES.length;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const completedCount = mounted ? completed.length : 0;
  const clientStreak = mounted ? streak : 0;
  const deviceId = mounted ? (activeDeviceId || 'Not linked') : 'Not linked';
  const deviceLinked = mounted && !!activeDeviceId;
  const pct = totalActivities ? Math.round((completedCount / totalActivities) * 100) : 0;
  const nextActivity = mounted ? ACTIVITIES.find((a) => !isCompleted(a.id)) : ACTIVITIES[0];

  return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <style suppressHydrationWarning>{`
        h1,h2,h3{ font-family:"Space Grotesk",sans-serif; }
        @keyframes bm-pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes bm-pad{ 0%,100%{opacity:.25} 50%{opacity:.9} }
        @keyframes bm-rise{ from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        .bm-rise{ animation:bm-rise .6s cubic-bezier(0.16,1,0.3,1) both; }
        .bm-d1{ animation-delay:.06s } .bm-d2{ animation-delay:.12s } .bm-d3{ animation-delay:.18s }
        .bm-card{ transition: transform .28s cubic-bezier(0.16,1,0.3,1), box-shadow .28s, border-color .28s, background .2s; }
        .bm-mod{ cursor:pointer; }
        .bm-mod:hover{ transform:translateY(-6px); border-color:rgba(255,255,255,0.16) !important; box-shadow:0 28px 60px -28px rgba(0,0,0,0.8) !important; }
        .bm-mod:hover .bm-arrow{ transform:translateX(5px); }
        .bm-mod:hover .bm-modicon{ transform:scale(1.08) rotate(-4deg); }
        .bm-mod:hover .bm-modglow{ opacity:1 !important; }
        .bm-arrow{ transition:transform .25s; display:inline-block; }
        .bm-modicon{ transition:transform .35s cubic-bezier(0.16,1,0.3,1); }
        .bm-ghost{ transition:background .2s, border-color .2s; }
        .bm-ghost:hover{ background:rgba(255,255,255,0.08) !important; border-color:rgba(255,255,255,0.28) !important; }
        .bm-stat:hover{ border-color:rgba(255,255,255,0.16) !important; }

        .bm-wrap{ max-width:1180px; margin:0 auto; padding:22px 16px 72px; }
        .bm-hero{ padding:26px 22px; }
        .bm-hero-grid{ display:flex; flex-direction:column; gap:24px; }
        .bm-hero-side{ width:100%; }
        .bm-stats{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .bm-mods{ display:grid; grid-template-columns:1fr; gap:16px; }
        .bm-split{ display:grid; grid-template-columns:1fr; gap:24px; align-items:start; }
        .bm-feat-list{ display:flex; flex-direction:column; gap:14px; }
        .bm-status-stack{ display:flex; flex-direction:column; gap:14px; }

        @media (min-width:768px){
          .bm-wrap{ padding:32px 26px 84px; }
          .bm-hero{ padding:34px 38px; }
          .bm-hero-grid{ flex-direction:row; align-items:center; justify-content:space-between; }
          .bm-hero-side{ width:auto; }
          .bm-stats{ grid-template-columns:repeat(4,1fr); gap:14px; }
          .bm-mods{ grid-template-columns:repeat(3,1fr); gap:18px; }
        }
        @media (min-width:1000px){
          .bm-split{ grid-template-columns:minmax(0,1.35fr) minmax(0,1fr); gap:28px; }
        }
      `}</style>

      <Header />

      {/* brand accent line under header */}
      <div style={{ height: 3, width: '100%', background: `linear-gradient(90deg,${BLUE},${VIOLET} 45%,${AMBER})` }} />

      {/* subtle circuit-trace background — sits behind everything, fades out lower down */}
      <CircuitBg />

      <div className="bm-wrap" style={{ position: 'relative', zIndex: 1 }}>

        {/* ════════ HERO / STATUS ════════ */}
        <section className="bm-hero bm-rise" style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, background: `linear-gradient(160deg,${BG} 0%,#060d19 45%,#081120 100%)`, border: `1px solid ${LINE}`, boxShadow: '0 26px 60px -32px rgba(0,0,0,0.9)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse 80% 100% at 75% 25%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 75% 25%,black,transparent)' }} />
          <div style={{ position: 'absolute', top: -120, right: -40, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.18),transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -150, right: 180, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.1),transparent 62%)', pointerEvents: 'none' }} />

          <div className="bm-hero-grid" style={{ position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 99, padding: '5px 13px', marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'bm-pulse 2s infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE_LT, fontFamily: '"JetBrains Mono",monospace' }}>Your Workspace</span>
              </div>
              <h1 style={{ fontSize: 'clamp(27px,4vw,36px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: -0.6, color: TEXT }}>Welcome back</h1>
              <p style={{ marginTop: 10, fontSize: 14.5, color: MUTED, maxWidth: 440, lineHeight: 1.6 }}>
                {completedCount === 0
                  ? 'Start your first guided project and begin building real ESP32 hardware, one step at a time.'
                  : `You've completed ${completedCount} of ${totalActivities} projects. Keep the momentum going.`}
              </p>

              <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {nextActivity && (
                  <button onClick={() => router.push(`/activities/${nextActivity.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, borderRadius: 13, background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', color: '#fff', border: 'none', padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 28px -10px rgba(37,99,235,0.6)' }}>
                    {completedCount === 0 ? 'Start first project' : 'Continue building'}
                    <I.arrow width={15} height={15} className="bm-arrow" />
                  </button>
                )}
                <button onClick={() => router.push('/')} className="bm-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 13, background: 'rgba(255,255,255,0.04)', color: TEXT, border: `1px solid rgba(255,255,255,0.14)`, padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <I.blocks width={16} height={16} /> Open Playground
                </button>
              </div>
            </div>

            {/* progress ring */}
            <div className="bm-hero-side" style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 20, padding: '18px 22px', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
                <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="38" cy="38" r="31" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                  <circle cx="38" cy="38" r="31" fill="none" stroke={AMBER} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 31}`} strokeDashoffset={`${2 * Math.PI * 31 * (1 - pct / 100)}`} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }} />
                </svg>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: '"Space Grotesk",sans-serif', color: TEXT }}>{pct}%</span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: FAINT, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Progress</p>
                <p style={{ marginTop: 3, fontSize: 24, fontWeight: 700, fontFamily: '"Space Grotesk",sans-serif', lineHeight: 1, color: TEXT }}>{completedCount}<span style={{ fontSize: 14, fontWeight: 500, color: FAINT }}> / {totalActivities}</span></p>
                <p style={{ marginTop: 4, fontSize: 11, color: FAINT }}>projects done</p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ STATS ════════ */}
        <section className="bm-rise bm-d1" style={{ marginTop: 24 }}>
          <div className="bm-stats">
            <StatCard Icon={I.target} label="Current Level" value="Level 1" accent={VIOLET} />
            <StatCard Icon={I.check} label="Projects Done" value={`${completedCount} / ${totalActivities}`} accent={GREEN} />
            <StatCard Icon={I.flame} label="Day Streak" value={`${clientStreak} ${clientStreak === 1 ? 'day' : 'days'}`} accent={AMBER} />
            <StatCard Icon={I.chip} label="Device" value={deviceLinked ? 'Linked' : 'Not linked'} sub={deviceLinked ? deviceId : undefined} accent={deviceLinked ? GREEN : FAINT} live={deviceLinked} />
          </div>
        </section>

        {/* ════════ FEATURES (left) + STATUS (right) — side by side ════════ */}
        <section className="bm-rise bm-d2" style={{ marginTop: 32 }}>
          <div className="bm-split">

            {/* ── LEFT: Where to next ── */}
            <div>
              <SectionTitle title="Where to next?" sub="Three connected ways to learn and build." />
              <div className="bm-feat-list" style={{ marginTop: 16 }}>
                <FeatureRow primary Icon={I.blocks} title="Playground" tone={BLUE} tag="Build"
                  desc="Drag blocks that generate real Arduino code, test on the live simulator, then flash to a real ESP32."
                  onClick={() => router.push('/playground')} />
                <FeatureRow Icon={I.book} title="Learn" tone={AMBER} tag="5 Levels · 25 Lessons"
                  desc="A structured path from LED basics to WiFi and IoT cloud, each level split into focused sub-lessons."
                  onClick={() => router.push('/learn')} />
                <FeatureRow Icon={I.bolt} title="Activities" tone={GREEN}
                  tag={completedCount > 0 ? `${completedCount} of ${totalActivities} done` : `${totalActivities} projects`}
                  desc="Guided projects with the Wire It Up stepper, live simulation, and step-by-step code you can flash."
                  onClick={() => router.push('/activities')} />
              </div>
            </div>

            {/* ── RIGHT: Status ── */}
            <div>
              <SectionTitle title="Status" sub="Your account and hardware at a glance." />
              <div className="bm-status-stack" style={{ marginTop: 16 }}>

                {/* Device status */}
                <div className="bm-card" style={{ borderRadius: 18, background: CARD, border: `1px solid ${LINE}`, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 42, height: 42, borderRadius: 12, background: hexA(deviceLinked ? GREEN : FAINT, 0.12), color: deviceLinked ? GREEN_LT : FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.cpu width={21} height={21} /></span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: '"Space Grotesk",sans-serif' }}>ESP32 Device</p>
                        <p style={{ fontSize: 11.5, color: MUTED }}>For flashing your code</p>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 99, background: hexA(deviceLinked ? GREEN : FAINT, 0.12), padding: '5px 11px', fontSize: 11, fontWeight: 700, color: deviceLinked ? GREEN_LT : FAINT }}>
                      {deviceLinked && <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'bm-pulse 1.4s infinite' }} />}
                      {deviceLinked ? 'Connected' : 'Not linked'}
                    </span>
                  </div>
                  {deviceLinked && (
                    <p style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${LINE_SOFT}`, fontSize: 11, color: FAINT, fontFamily: '"JetBrains Mono",monospace' }}>ID · {deviceId}</p>
                  )}
                </div>

                {/* Completion overview */}
                <div className="bm-card" style={{ borderRadius: 18, background: CARD, border: `1px solid ${LINE}`, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 42, height: 42, borderRadius: 12, background: hexA(BLUE, 0.12), color: BLUE_LT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.bolt width={21} height={21} /></span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: '"Space Grotesk",sans-serif' }}>Project Completion</p>
                        <p style={{ fontSize: 11.5, color: MUTED }}>{completedCount} of {totalActivities} projects done</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 19, fontWeight: 700, color: AMBER_LT, fontFamily: '"Space Grotesk",sans-serif' }}>{pct}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {ACTIVITIES.map((a) => {
                      const done = mounted && isCompleted(a.id);
                      return <span key={a.id} title={a.title} style={{ flex: 1, height: 8, borderRadius: 99, background: done ? GREEN : 'rgba(255,255,255,0.08)', boxShadow: done ? `0 0 8px ${hexA(GREEN, 0.5)}` : 'none', transition: 'background .4s, box-shadow .4s' }} />;
                    })}
                  </div>
                  <p style={{ marginTop: 12, fontSize: 11.5, color: MUTED }}>
                    {nextActivity ? <>Next up: <span style={{ color: TEXT, fontWeight: 600 }}>{nextActivity.title}</span></> : 'All projects complete. Nice work.'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

// ─── Circuit-trace background ─────────────────────────────────────────────────
// Fixed, full-viewport, very faint. Traces + solder pads in the blue accent,
// faded toward the bottom so it never competes with content.
function CircuitBg() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        // fade the whole layer out toward the lower half of the page
        maskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 85%)',
        WebkitMaskImage: 'linear-gradient(180deg, black 0%, rgba(0,0,0,0.5) 45%, transparent 85%)',
      }}>
        <defs>
          <pattern id="bm-circuit" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            {/* traces */}
            <g fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.16">
              <path d="M10 30 H70 a10 10 0 0 0 10 -10 V0" />
              <path d="M0 90 H50 a12 12 0 0 1 12 12 V150" />
              <path d="M200 40 H150 a10 10 0 0 1 -10 10 V120 a14 14 0 0 0 14 14 H200" />
              <path d="M30 200 V150 a10 10 0 0 1 10 -10 H110" />
              <path d="M120 0 V40 a10 10 0 0 0 10 10 H180 a12 12 0 0 1 12 12 V120" />
              <path d="M70 200 V170 H140 a10 10 0 0 0 10 -10 V110" />
              <path d="M0 150 H30" />
              <path d="M160 200 V175 a8 8 0 0 1 8 -8 H200" />
            </g>
            {/* solder pads */}
            <g fill="#3b82f6">
              {[
                [10, 30], [80, 0], [0, 90], [62, 150], [150, 40], [200, 134],
                [30, 200], [110, 140], [120, 0], [192, 120], [70, 200], [150, 110],
                [0, 150], [160, 200], [200, 167],
              ].map(([x, y], i) => (
                <g key={i} style={{ animation: `bm-pad ${5 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}>
                  <circle cx={x} cy={y} r="3.4" fillOpacity="0.22" />
                  <circle cx={x} cy={y} r="1.5" fillOpacity="0.5" />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#bm-circuit)" />
      </svg>
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{title}</h3>
      {sub && <p style={{ marginTop: 3, fontSize: 13, color: MUTED }}>{sub}</p>}
    </div>
  );
}

// ─── Feature row (horizontal, for the left column) ───────────────────────────
function FeatureRow({ primary, Icon, title, desc, tone, tag, onClick }: {
  primary?: boolean; Icon: (p: any) => JSX.Element; title: string; desc: string;
  tone: string; tag?: string; onClick: () => void;
}) {
  return (
    <div className="bm-card bm-mod" onClick={onClick} style={{
      position: 'relative', overflow: 'hidden', display: 'flex', gap: 16, alignItems: 'flex-start',
      borderRadius: 18, padding: 20,
      background: primary ? 'linear-gradient(135deg,#0a1422,#11304e)' : CARD,
      border: `1px solid ${primary ? 'rgba(59,130,246,0.25)' : LINE}`,
      boxShadow: primary ? '0 16px 40px -26px rgba(0,0,0,0.8)' : 'none',
    }}>
      {/* left accent bar */}
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: tone, opacity: primary ? 0.9 : 0.55 }} />
      <div className="bm-modglow" style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${hexA(tone, 0.32)},transparent 60%)`, opacity: primary ? 0.8 : 0, transition: 'opacity .4s', pointerEvents: 'none' }} />

      <div className="bm-modicon" style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 13, background: hexA(tone, primary ? 0.2 : 0.13), color: primary ? '#bfdbfe' : tone, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Icon width={23} height={23} />
      </div>

      <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: primary ? '#fff' : TEXT }}>{title}</h2>
          {tag && <span style={{ borderRadius: 99, background: hexA(tone, 0.14), color: primary ? '#bfdbfe' : tone, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: '"JetBrains Mono",monospace' }}>{tag}</span>}
        </div>
        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: primary ? 'rgba(255,255,255,0.66)' : MUTED }}>{desc}</p>
        <p style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: primary ? '#bfdbfe' : tone }}>
          Open {title} <I.arrow width={14} height={14} className="bm-arrow" />
        </p>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ Icon, label, value, accent, live, sub }: { Icon: (p: any) => JSX.Element; label: string; value: string; accent: string; live?: boolean; sub?: string }) {
  return (
    <div className="bm-card bm-stat" style={{ borderRadius: 16, background: CARD, border: `1px solid ${LINE}`, padding: '15px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: hexA(accent, 0.14), color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon width={15} height={15} /></span>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: MUTED }}>{label}</p>
      </div>
      <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
        {live && <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'bm-pulse 1.4s infinite', flexShrink: 0 }} />}
        <p style={{ fontSize: 17, fontWeight: 700, color: TEXT, fontFamily: '"Space Grotesk",sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      </div>
      {sub && <p style={{ marginTop: 3, fontSize: 9.5, color: FAINT, fontFamily: '"JetBrains Mono",monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
    </div>
  );
}

// ─── helper ───────────────────────────────────────────────────────────────────
function hexA(hex: string, a: number) {
  if (hex.startsWith('rgba')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}