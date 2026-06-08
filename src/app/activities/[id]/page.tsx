// src/app/activities/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { runLoop, stopSimulation } from '@/lib/simulatorEngine';
import { deriveHardwareLayout } from '@/lib/hardwareParser';
import HardwareBoard from '@/components/HardwareBoard';
import DynamicWiringSimulator from '@/components/DynamicWiringSimulator';
type Activity = any;

/* ── tokens — exact dashboard ── */
const BG = '#04080f';
const PANEL = '#0a1422';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_S = 'rgba(255,255,255,0.05)';
const TEXT = '#ffffff';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.35)';
const BLUE = '#3b82f6';
const BLUE_LT = '#93c5fd';
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const GREEN_LT = '#34d399';
const VIOLET = '#8b5cf6';
const SANS = '"Space Grotesk",sans-serif';
const MONO = '"JetBrains Mono",monospace';
const INTER = '"Inter",system-ui,sans-serif';

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── step definitions (no emojis) ── */
const STEPS = [
  { id: 0, label: 'Intro', time: '2 min' },
  { id: 1, label: 'Equipment', time: '5 min' },
  { id: 2, label: 'Assemble', time: '10 min' },
  { id: 3, label: 'Code', time: '10 min' },
  { id: 4, label: 'Output', time: '3 min' },
];

/* ── SVG icons ── */
const Ic = {
  check: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12l5 5L20 6" /></svg>,
  arrow: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  arrowL: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  lock: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  play: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  stop: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>,
  copy: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  chip: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /></svg>,
  bolt: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>,
  tool: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  target: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>,
  info: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
  terminal: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
  cpu: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>,
  wire: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h6a4 4 0 0 1 4 4v6" /></svg>,
  video: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
  blocks: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
};

/* ── circuit bg — dashboard identical ── */
function CircuitBg() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          maskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.5) 45%,transparent 85%)',
          WebkitMaskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.5) 45%,transparent 85%)'
        }}>
        <defs>
          <pattern id="bm-cir" width="200" height="200" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.16">
              <path d="M10 30 H70 a10 10 0 0 0 10-10 V0" />
              <path d="M0 90 H50 a12 12 0 0 1 12 12 V150" />
              <path d="M200 40 H150 a10 10 0 0 1-10 10 V120 a14 14 0 0 0 14 14 H200" />
              <path d="M30 200 V150 a10 10 0 0 1 10-10 H110" />
              <path d="M120 0 V40 a10 10 0 0 0 10 10 H180 a12 12 0 0 1 12 12 V120" />
              <path d="M70 200 V170 H140 a10 10 0 0 0 10-10 V110" />
              <path d="M0 150 H30" /><path d="M160 200 V175 a8 8 0 0 1 8-8 H200" />
            </g>
            <g fill="#3b82f6">
              {([[10, 30], [80, 0], [0, 90], [62, 150], [150, 40], [200, 134], [30, 200], [110, 140], [120, 0], [192, 120], [70, 200], [150, 110], [0, 150], [160, 200], [200, 167]] as [number, number][]).map(([x, y], i) => (
                <g key={i} style={{ animation: `bm-pad ${5 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}>
                  <circle cx={x} cy={y} r="3.4" fillOpacity="0.22" />
                  <circle cx={x} cy={y} r="1.5" fillOpacity="0.5" />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#bm-cir)" />
      </svg>
    </div>
  );
}

/* ── step content animation ── */
function StepContent({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    setVis(false);
    const t = setTimeout(() => setVis(true), 40);
    return () => clearTimeout(t);
  }, [stepKey]);
  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)', transition: 'opacity .22s ease, transform .22s ease' }}>
      {children}
    </div>
  );
}

/* ══════════════ INLINE SIMULATOR ══════════════ */
function InlineSimulator({ activity }: { activity: any }) {
  const { serial, isRunning } = useSimulatorStore();
  const addBlock = useAppStore(s => s.addBlock);
  const clearBlocks = useAppStore(s => s.clearBlocks);
  const blocks = useAppStore(s => s.blocks);
  const router = useRouter();
  const [tab, setTab] = useState<'hardware' | 'code' | 'serial'>('hardware');

  useEffect(() => {
    clearBlocks();
    activity.playgroundBlocks?.forEach((b: any) =>
      addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })
    );
  }, [activity.id]);

  const peripherals = useMemo(() => deriveHardwareLayout(blocks), [blocks]);

  const SIM_TABS = useMemo(() => [
    { id: 'hardware' as const, label: 'Hardware' },
    { id: 'code' as const, label: 'Code' },
    { id: 'serial' as const, label: `Serial${serial.length > 0 ? ` (${serial.length})` : ''}` },
  ], [serial.length]);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}`, background: PANEL }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${LINE}`, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontFamily: SANS }}>ESP32 Simulator</span>
          {isRunning && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 99, border: `1px solid ${hexA(GREEN, 0.3)}`, background: hexA(GREEN, 0.1), padding: '2px 9px', fontSize: 10, fontWeight: 700, color: GREEN_LT }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, animation: 'bm-pulse 1.2s infinite' }} />
              Running
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button"
            onClick={() => { clearBlocks(); activity.playgroundBlocks?.forEach((b: any) => addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })); router.push('/'); }}
            style={{ fontSize: 10, fontWeight: 600, color: FAINT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}>
            Open full
          </button>
          <button type="button" onClick={() => isRunning ? stopSimulation() : runLoop(blocks)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', background: isRunning ? '#ef4444' : `linear-gradient(135deg,#1a3a8a,${BLUE})`, fontFamily: SANS }}>
            {isRunning ? <><Ic.stop width={10} height={10} /> Stop</> : <><Ic.play width={10} height={10} /> Run</>}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', padding: '0 16px', borderBottom: `1px solid ${LINE}`, background: CARD }}>
        {SIM_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            padding: '9px 12px', fontSize: 11, fontWeight: 700, fontFamily: SANS, border: 'none', cursor: 'pointer', background: 'none',
            borderBottom: tab === t.id ? `2px solid ${BLUE}` : '2px solid transparent',
            color: tab === t.id ? BLUE_LT : FAINT,
            transition: 'color .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* content */}
      <div style={{ minHeight: 520 }}>
        {tab === 'hardware' && (
          <div style={{ height: 520 }}>
            {peripherals.length === 0
              ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <Ic.cpu width={28} height={28} style={{ color: FAINT }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: FAINT, fontFamily: SANS }}>No hardware detected</p>
                <p style={{ fontSize: 11, color: FAINT, fontFamily: INTER, textAlign: 'center', maxWidth: 240 }}>Blocks like LED, buzzer, and button appear here automatically.</p>
              </div>
              : <HardwareBoard peripherals={peripherals} />
            }
          </div>
        )}
        {tab === 'code' && (
          <div style={{ height: 520, overflow: 'auto', background: '#060e18', padding: 20 }}>
            <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: GREEN_LT, fontFamily: MONO }}><code>{activity.code?.arduino}</code></pre>
          </div>
        )}
        {tab === 'serial' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 520, background: '#060e18' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', borderBottom: `1px solid ${LINE_S}` }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: FAINT, fontFamily: MONO }}>115200 baud</span>
              {serial.length > 0 && <button type="button" onClick={() => useSimulatorStore.getState().resetSimulation()} style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}>Clear</button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {serial.length === 0
                ? <p style={{ fontSize: 11, fontStyle: 'italic', color: FAINT, fontFamily: MONO }}>Press Run to start…</p>
                : serial.map((l, i) => <p key={i} style={{ margin: '0 0 2px', fontSize: 11, fontFamily: MONO, color: GREEN_LT }}><span style={{ color: FAINT, marginRight: 8 }}>{'>'}</span>{l}</p>)
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════ STEP PANELS ══════════════ */

function IntroStep({ activity }: { activity: any }) {
  const DIFF: Record<string, string> = { Beginner: GREEN, Intermediate: AMBER, Advanced: '#ef4444' };
  const color = DIFF[activity.difficulty] ?? BLUE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* hero card */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '28px 28px 24px', background: `linear-gradient(160deg,${BG} 0%,#060d19 60%,${BG} 100%)`, border: `1px solid ${hexA(color, 0.3)}`, boxShadow: `0 0 0 1px ${hexA(color, 0.1)}` }}>
        <div style={{ position: 'absolute', top: -80, right: -40, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle,${hexA(color, 0.18)},transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', height: 3, top: 0, left: 0, right: 0, background: `linear-gradient(90deg,${color},${hexA(color, 0.2)})` }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 11px', borderRadius: 99, marginBottom: 14, background: hexA(color, 0.12), border: `1px solid ${hexA(color, 0.25)}` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color, fontFamily: MONO }}>{activity.difficulty} Project</span>
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: 700, color: TEXT, fontFamily: SANS, lineHeight: 1.2 }}>{activity.intro_headline}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', padding: '4px 11px', fontSize: 11, fontWeight: 600, color: MUTED, fontFamily: MONO }}>
              <Ic.chip width={11} height={11} /> {activity.duration}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', padding: '4px 11px', fontSize: 11, fontWeight: 600, color: MUTED, fontFamily: MONO }}>
              <Ic.tool width={11} height={11} /> {activity.equipment?.length} parts
            </span>
            {activity.tags?.map((tag: string) => (
              <span key={tag} style={{ borderRadius: 99, background: 'rgba(255,255,255,0.05)', padding: '4px 11px', fontSize: 11, color: FAINT, fontFamily: MONO }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* what + why */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {[
          { Icon: Ic.target, title: 'What you will build', body: activity.intro_what, accent: BLUE },
          { Icon: Ic.info, title: 'Why this matters', body: activity.intro_why, accent: AMBER },
        ].map(c => (
          <div key={c.title} className="bm-card" style={{ borderRadius: 16, padding: 20, background: CARD, border: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: hexA(c.accent, 0.14), color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><c.Icon width={17} height={17} /></span>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{c.title}</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.65, fontFamily: INTER }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* skills */}
      <div className="bm-card" style={{ borderRadius: 16, padding: 20, background: CARD, border: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: hexA(GREEN, 0.14), color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.bolt width={17} height={17} /></span>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Skills you will unlock</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {activity.teaches?.map((t: string) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 99, border: `1px solid ${hexA(GREEN, 0.25)}`, background: hexA(GREEN, 0.1), padding: '5px 11px', fontSize: 11, fontWeight: 700, color: GREEN_LT, fontFamily: MONO }}>
              <Ic.check width={9} height={9} /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EquipmentStep({ activity }: { activity: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* header card */}
      <div style={{ borderRadius: 16, padding: '18px 20px', background: PANEL, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: hexA(AMBER, 0.14), color: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.tool width={20} height={20} /></span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Gather Your Parts</p>
            <p style={{ margin: 0, fontSize: 11.5, color: MUTED, fontFamily: INTER }}>Get everything ready before you start building.</p>
          </div>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 99, background: hexA(AMBER, 0.12), border: `1px solid ${hexA(AMBER, 0.25)}`, fontSize: 10, fontWeight: 700, color: AMBER, fontFamily: MONO, whiteSpace: 'nowrap' }}>
          {activity.equipment?.length} items
        </span>
      </div>

      {/* list */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}` }}>
        {activity.equipment?.map((item: any, idx: number) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', background: idx % 2 === 0 ? CARD : hexA(BLUE, 0.03),
            borderBottom: idx < activity.equipment.length - 1 ? `1px solid ${LINE_S}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: SANS, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: MUTED, fontFamily: INTER }}>{item.description}</p>
              </div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: hexA(AMBER, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: AMBER, fontFamily: SANS, flexShrink: 0 }}>
              {item.quantity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssembleStep({ activity }: { activity: any }) {
  const hasWiring = !!activity.wiringComponent;
  const [view, setView] = useState<'wiring' | 'video'>(hasWiring ? 'wiring' : 'video');
  const tabs = useMemo(() => [
    ...(hasWiring ? [{ id: 'wiring' as const, label: 'Wire It Up', Icon: Ic.wire }] : []),
    { id: 'video' as const, label: 'Video Tutorial', Icon: Ic.video },
  ], [hasWiring]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* tab pills */}
      <div style={{ display: 'flex', gap: 6, padding: '5px', borderRadius: 14, background: PANEL, border: `1px solid ${LINE}` }}>
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setView(t.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: view === t.id ? CARD : 'transparent',
            color: view === t.id ? TEXT : MUTED,
            fontSize: 12, fontWeight: 700, fontFamily: SANS,
            boxShadow: view === t.id ? `0 2px 8px rgba(0,0,0,0.3)` : 'none',
            transition: 'all .15s',
          }}>
            <t.Icon width={13} height={13} /> {t.label}
          </button>
        ))}
      </div>

      {view === 'wiring' && activity.wiringComponent && (
        <div
          style={{
            width: '1400px',
            maxWidth: 'calc(100vw - 320px)',
            marginLeft: '50%',
            transform: 'translateX(-50%)',
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${LINE}`,
            minHeight: 520,
          }}
        >
          <DynamicWiringSimulator component={activity.wiringComponent} />
        </div>
      )}

      {view === 'video' && (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: `1px solid ${LINE}`, background: CARD }}>
            <Ic.video width={14} height={14} style={{ color: BLUE_LT }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Video Tutorial</p>
          </div>
          <iframe src={activity.assemble?.videoUrl} style={{ display: 'block', width: '100%', height: 520, border: 'none' }}
            title="Video Tutorial" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )}

      {/* wiring steps */}
      <div style={{ borderRadius: 16, padding: 20, background: CARD, border: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: hexA(BLUE, 0.14), color: BLUE_LT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.wire width={16} height={16} /></span>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Wiring steps</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.assemble?.steps?.map((step: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderRadius: 10, border: `1px solid ${LINE}`, padding: '11px 14px', background: PANEL }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: SANS, flexShrink: 0, marginTop: 1 }}>{idx + 1}</div>
              <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.65, fontFamily: INTER }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeStep({ activity }: { activity: any }) {
  const router = useRouter();
  const addBlock = useAppStore(s => s.addBlock);
  const clearBlocks = useAppStore(s => s.clearBlocks);
  const [tab, setTab] = useState<'platform' | 'arduino'>('platform');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activity.code?.arduino ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activity.code?.arduino]);

  const CODE_TABS = [
    { id: 'platform' as const, label: 'Our Platform', Icon: Ic.blocks },
    { id: 'arduino' as const, label: 'Arduino IDE', Icon: Ic.chip },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 6, padding: '5px', borderRadius: 14, background: PANEL, border: `1px solid ${LINE}` }}>
        {CODE_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? CARD : 'transparent',
            color: tab === t.id ? TEXT : MUTED,
            fontSize: 12, fontWeight: 700, fontFamily: SANS,
            boxShadow: tab === t.id ? `0 2px 8px rgba(0,0,0,0.3)` : 'none',
            transition: 'all .15s',
          }}>
            <t.Icon width={13} height={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'platform' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="bm-card" style={{ borderRadius: 16, padding: 18, background: CARD, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: hexA(BLUE, 0.14), color: BLUE_LT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic.blocks width={20} height={20} /></span>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Block Playground</p>
              <p style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.6, fontFamily: INTER }}>{activity.code?.platformDescription}</p>
            </div>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${LINE}`, background: CARD }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Live Simulator</span>
              <button type="button" onClick={() => { clearBlocks(); activity.playgroundBlocks?.forEach((b: any) => addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })); router.push('/'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: BLUE_LT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}>
                Open full <Ic.arrow width={11} height={11} />
              </button>
            </div>
            <div style={{ background: PANEL }}><InlineSimulator activity={activity} /></div>
          </div>
        </div>
      )}

      {tab === 'arduino' && (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${LINE}`, background: CARD }}>
            <span style={{ fontSize: 10, color: FAINT, fontFamily: MONO }}>{activity.title}.ino</span>
            <button type="button" onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '5px 12px',
              fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: SANS,
              background: copied ? hexA(GREEN, 0.15) : 'rgba(255,255,255,0.06)',
              color: copied ? GREEN_LT : FAINT,
              transition: 'all .15s',
            }}>
              {copied ? <><Ic.check width={10} height={10} /> Copied</> : <><Ic.copy width={10} height={10} /> Copy</>}
            </button>
          </div>
          <div style={{ overflow: 'auto', padding: 22, background: '#060e18', maxHeight: 600 }}>
            <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.75, color: GREEN_LT, fontFamily: MONO }}><code>{activity.code?.arduino}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
}

function OutputStep({ activity }: { activity: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 22, background: `linear-gradient(160deg,${BG} 0%,#060d19 100%)`, border: `1px solid ${hexA(GREEN, 0.3)}` }}>
        <div style={{ position: 'absolute', top: -60, right: -30, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${hexA(GREEN, 0.15)},transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: hexA(GREEN, 0.14), color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.terminal width={17} height={17} /></span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SANS }}>Expected Output</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: INTER }}>{activity.output?.description}</p>
        </div>
      </div>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${LINE}` }}>
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${LINE_S}`, background: CARD }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Serial output</span>
        </div>
        <div style={{ padding: 20, background: '#060e18' }}>
          {activity.output?.expected?.map((line: string, idx: number) => (
            <p key={idx} style={{ margin: '0 0 3px', fontSize: 11.5, fontFamily: MONO, color: GREEN_LT }}>
              <span style={{ color: FAINT, marginRight: 10 }}>{'>'}</span>{line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── confetti ── */
function useConfetti() {
  const fire = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).confetti) {
      (window as any).confetti({ spread: 60, startVelocity: 45, particleCount: 60, colors: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ffffff'], origin: { y: 0.6 } });
    }
  }, []);
  return { fire };
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function ActivityDetailPage() {
  const { id: activityId } = useParams() as { id: string };
  const router = useRouter();
  const { initialize, markStepComplete, markActivityComplete, getLastStep, isCompleted } = useActivityStore();
  const { fire: fireConfetti } = useConfetti();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [justCompleted, setJustDone] = useState<number | null>(null);

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/activities');
        const data = await res.json();
        const act = data.find((a: any) => a.id === activityId);
        setActivity(act ?? null);
        const last = getLastStep(activityId);
        setCurrentStep(last);
        setCompleted(Array.from({ length: last }, (_, i) => i));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [activityId]);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch { } };
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCompleted(prev => {
      if (!prev.includes(currentStep)) {
        markStepComplete(activityId, currentStep);
        setJustDone(currentStep);
        setTimeout(() => setJustDone(null), 600);
        return [...prev, currentStep];
      }
      return prev;
    });
    setCurrentStep(step);
  }, [currentStep, activityId, markStepComplete]);

  const handleDone = useCallback(() => {
    markStepComplete(activityId, STEPS.length - 1);
    markActivityComplete(activityId);
    fireConfetti();
    setTimeout(() => router.push('/activities'), 2200);
  }, [activityId, markStepComplete, markActivityComplete, fireConfetti, router]);

  const alreadyDone = activity ? isCompleted(activity.id) : false;
  const progressPercent = alreadyDone ? 100 : Math.round((completed.length / STEPS.length) * 100);

  const DIFF_COLOR: Record<string, string> = { Beginner: GREEN, Intermediate: AMBER, Advanced: '#ef4444' };
  const diffColor = activity ? (DIFF_COLOR[activity.difficulty] ?? BLUE) : BLUE;

  /* ── loading ── */
  if (loading) return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: INTER }}>
      <Header />
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 18px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${LINE}` }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${BLUE}`, borderTopColor: 'transparent', animation: 'spin .85s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: SANS, color: MUTED }}>Loading mission…</p>
        </div>
      </div>
    </main>
  );

  /* ── not found ── */
  if (!activity) return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: INTER }}>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: MUTED, fontFamily: SANS }}>Mission not found</p>
        <button type="button" onClick={() => router.push('/activities')} style={{ marginTop: 12, padding: '9px 22px', borderRadius: 11, border: 'none', cursor: 'pointer', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS }}>
          Back to Activities
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: INTER }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <style suppressHydrationWarning>{`
        h1,h2,h3,h4 { font-family:${SANS}; }
        @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes bm-pad   { 0%,100%{opacity:.25} 50%{opacity:.9} }
        @keyframes bm-rise  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .bm-card { transition: transform .28s cubic-bezier(0.16,1,0.3,1), box-shadow .28s, border-color .28s; }
        .bm-ghost { transition: background .2s, border-color .2s; }
        .bm-ghost:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.2) !important; }
        .step-btn { transition: background .15s, color .15s; }
        .step-btn:hover { background: rgba(255,255,255,0.07) !important; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:99px; }
        * { box-sizing:border-box; }
      `}</style>

      <Header />
      {/* progress line */}
      <div style={{ height: 3, background: LINE }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: `linear-gradient(90deg,${BLUE},${VIOLET} 60%,${AMBER})`, transition: 'width .7s ease' }} />
      </div>
      <CircuitBg />

      <div style={{ display: 'flex', height: 'calc(100vh - 59px)', position: 'relative', zIndex: 1 }}>

        {/* ══ SIDEBAR ══ */}
        <aside style={{
          width: 224, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: `linear-gradient(180deg,#060e1a 0%,${PANEL} 100%)`,
          borderRight: `1px solid ${LINE}`, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: 18, height: '100%' }}>

            {/* back */}
            <button type="button" onClick={() => router.push('/activities')} className="bm-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, padding: '7px 10px', borderRadius: 9, border: `1px solid transparent`, background: 'transparent', cursor: 'pointer', color: FAINT, fontSize: 11, fontWeight: 600, fontFamily: SANS }}>
              <Ic.arrowL width={12} height={12} /> Activities
            </button>

            {/* title */}
            <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Mission</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, lineHeight: 1.3 }}>{activity.title}</p>

            {/* progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: FAINT, fontFamily: MONO }}>Progress</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: GREEN_LT, fontFamily: SANS }}>{progressPercent}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${GREEN},${BLUE})`, width: `${progressPercent}%`, transition: 'width .7s ease' }} />
              </div>
            </div>

            {/* steps */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {STEPS.map((step, idx) => {
                const isDone = completed.includes(step.id);
                const isActive = currentStep === step.id;
                const isBounce = justCompleted === step.id;

                return (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button type="button" className="step-btn" onClick={() => handleStepChange(step.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderRadius: 11, padding: '9px 10px', textAlign: 'left', border: 'none', cursor: 'pointer',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: isActive ? TEXT : isDone ? GREEN_LT : FAINT,
                      }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? AMBER : isDone ? GREEN : 'rgba(255,255,255,0.07)',
                        color: isActive ? '#1a0f00' : isDone ? '#fff' : FAINT,
                        transform: isBounce ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background .2s',
                      }}>
                        {isDone && !isActive
                          ? <Ic.check width={13} height={13} />
                          : <span style={{ fontSize: 11, fontWeight: 800, fontFamily: SANS }}>{idx + 1}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 700, lineHeight: 1.2, fontFamily: SANS }}>{step.label}</p>
                        <p style={{ margin: 0, fontSize: 9.5, fontFamily: MONO, color: isActive ? MUTED : FAINT }}>{step.time}</p>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div style={{ marginLeft: 25, width: 2, height: 10, borderRadius: 1, background: isDone ? hexA(GREEN, 0.5) : 'rgba(255,255,255,0.07)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* diff badge */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${LINE_S}`, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 99, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: MONO, background: hexA(diffColor, 0.14), color: diffColor, border: `1px solid ${hexA(diffColor, 0.25)}` }}>
                {activity.difficulty}
              </span>
              {alreadyDone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 99, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: MONO, background: hexA(GREEN, 0.14), color: GREEN_LT, border: `1px solid ${hexA(GREEN, 0.25)}` }}>
                  <Ic.check width={8} height={8} /> Done
                </span>
              )}
            </div>

            {/* nav buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
              <button type="button" disabled={currentStep === 0}
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                style={{ padding: '9px', borderRadius: 11, border: `1px solid ${LINE}`, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.04)', color: MUTED, fontSize: 11, fontWeight: 700, fontFamily: SANS, opacity: currentStep === 0 ? 0.35 : 1, transition: 'opacity .15s' }}>
                Previous
              </button>
              {currentStep < STEPS.length - 1
                ? <button type="button" onClick={() => handleStepChange(currentStep + 1)}
                  style={{ padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,#78350f,${AMBER})`, color: '#1a0f00', fontSize: 11, fontWeight: 800, fontFamily: SANS }}>
                  Next: {STEPS[currentStep + 1].label}
                </button>
                : <button type="button" onClick={handleDone}
                  style={{ padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,#065f46,${GREEN})`, color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: SANS }}>
                  {alreadyDone ? 'Review Complete' : 'Complete Mission'}
                </button>
              }
            </div>
          </div>
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 28px 60px' }}>

            {/* breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20, fontSize: 11, color: FAINT, fontFamily: MONO }}>
              <button type="button" onClick={() => router.push('/activities')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: FAINT, fontFamily: MONO, fontSize: 11, padding: 0 }}>Activities</button>
              <span>/</span>
              <span style={{ color: MUTED, fontWeight: 700 }}>{activity.title}</span>
              {alreadyDone && (
                <span style={{ borderRadius: 99, padding: '2px 9px', fontSize: 9, fontWeight: 700, fontFamily: MONO, background: hexA(GREEN, 0.12), border: `1px solid ${hexA(GREEN, 0.25)}`, color: GREEN_LT }}>
                  Completed
                </span>
              )}
            </div>

            <StepContent stepKey={currentStep}>
              {currentStep === 0 && <IntroStep activity={activity} />}
              {currentStep === 1 && <EquipmentStep activity={activity} />}
              {currentStep === 2 && <AssembleStep activity={activity} />}
              {currentStep === 3 && <CodeStep activity={activity} />}
              {currentStep === 4 && <OutputStep activity={activity} />}
            </StepContent>

            {/* mobile nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${LINE_S}` }}>
              <button type="button" disabled={currentStep === 0} onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, border: `1px solid ${LINE}`, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', background: PANEL, color: MUTED, fontSize: 13, fontWeight: 700, fontFamily: SANS, opacity: currentStep === 0 ? 0.35 : 1 }}>
                <Ic.arrowL width={14} height={14} /> Previous
              </button>
              {currentStep < STEPS.length - 1
                ? <button type="button" onClick={() => handleStepChange(currentStep + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,#1a3a8a,${BLUE})`, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS, boxShadow: `0 6px 20px -6px ${hexA(BLUE, 0.6)}` }}>
                  {STEPS[currentStep + 1].label} <Ic.arrow width={14} height={14} />
                </button>
                : <button type="button" onClick={handleDone}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,#065f46,${GREEN})`, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS, boxShadow: `0 6px 20px -6px ${hexA(GREEN, 0.6)}` }}>
                  <Ic.check width={14} height={14} /> {alreadyDone ? 'Review Complete' : 'Complete Mission'}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}