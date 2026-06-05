// src/app/activities/page.tsx
'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useActivityStore } from '@/store/useActivityStore';
import { ACTIVITIES, type Activity } from '@/lib/activitiesData';
import { createClient } from '@/utils/supabase/client';

/* ── tokens ── */
const BG = '#04080f';
const PANEL = '#0a1422';
const CARD = '#0f1c30';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#EAF0FA';
const MUTED = 'rgba(234,240,250,0.55)';
const FAINT = 'rgba(234,240,250,0.28)';
const SANS = '"Space Grotesk",system-ui,sans-serif';
const INTER = '"Inter",system-ui,sans-serif';
const MONO = '"JetBrains Mono",monospace';

/* ── one accent per mission ── */
const ACC: Record<string, string> = {
  dht_sensor: '#10b981',
  blink_led: '#3b82f6',
  button_led: '#8b5cf6',
  traffic_light: '#f59e0b',
  distance_alarm: '#ef4444',
};
const accent = (id: string) => ACC[id] ?? '#3b82f6';

const DIFF: Record<string, { label: string; xp: number }> = {
  Beginner: { label: 'Easy', xp: 100 },
  Intermediate: { label: 'Medium', xp: 200 },
  Advanced: { label: 'Hard', xp: 350 },
};

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
type Filter = typeof FILTERS[number];

function calcLocked(a: Activity, all: Activity[], mounted: boolean, hasEsp32: boolean, done: (id: string) => boolean) {
  if (!mounted) return false;
  const i = all.findIndex(x => x.id === a.id);
  if (i === 0) return false;
  return !hasEsp32 || !done(all[i - 1].id);
}

/* ── circuit bg ── */
function CircuitBg() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          maskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.4) 55%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.4) 55%,transparent 100%)'
        }}>
        <defs>
          <pattern id="cir" width="200" height="200" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.16">
              <path d="M10 30 H70 a10 10 0 0 0 10-10 V0" />
              <path d="M0 90 H50 a12 12 0 0 1 12 12 V150" />
              <path d="M200 40 H150 a10 10 0 0 1-10 10 V120 a14 14 0 0 0 14 14 H200" />
              <path d="M30 200 V150 a10 10 0 0 1 10-10 H110" />
              <path d="M120 0 V40 a10 10 0 0 0 10 10 H180 a12 12 0 0 1 12 12 V120" />
              <path d="M70 200 V170 H140 a10 10 0 0 0 10-10 V110" />
              <path d="M0 150 H30" />
              <path d="M160 200 V175 a8 8 0 0 1 8-8 H200" />
            </g>
            <g fill="#3b82f6">
              {([[10, 30], [80, 0], [0, 90], [62, 150], [150, 40], [200, 134], [30, 200], [110, 140], [120, 0], [192, 120], [70, 200], [150, 110], [0, 150], [160, 200], [200, 167]] as [number, number][]).map(([x, y], i) => (
                <g key={i} style={{ animation: `pad ${5 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }}>
                  <circle cx={x} cy={y} r="3.4" fillOpacity="0.22" />
                  <circle cx={x} cy={y} r="1.5" fillOpacity="0.5" />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#cir)" />
      </svg>
    </div>
  );
}

/* ── mission icons ── */
function MIcon({ id, size = 22, color }: { id: string; size?: number; color: string }) {
  const s = { width: size, height: size, fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'dht_sensor') return <svg viewBox="0 0 24 24" {...s}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /><circle cx="11.5" cy="19" r="1.2" fill={color} /></svg>;
  if (id === 'blink_led') return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.25" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
  if (id === 'button_led') return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" fill={color} fillOpacity="0.35" /></svg>;
  if (id === 'traffic_light') return <svg viewBox="0 0 24 24" {...s}><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="2" fill={color} fillOpacity="0.35" /><circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.65" /><circle cx="12" cy="17" r="2" fill={color} /></svg>;
  if (id === 'distance_alarm') return <svg viewBox="0 0 24 24" {...s}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
  return <svg viewBox="0 0 24 24" {...s}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" fill={color} fillOpacity="0.3" /></svg>;
}

/* ══════════════════════════════════
   MISSION CARD — FeatureRow style
══════════════════════════════════ */
function MissionCard({
  a,
  done,
  progress,
  locked,
  hasEsp32,
  onOpen,
  idx,
  isCurrent
}: {
  a: Activity;
  done: boolean;
  progress: number;
  locked: boolean;
  hasEsp32: boolean;
  onOpen: () => void;
  idx: number;
  isCurrent: boolean;
}) {
  const [isClicking, setIsClicking] = useState(false);
  const [hovered, setHovered] = useState(false);

  const color = accent(a.id);
  const diff = DIFF[a.difficulty] ?? DIFF.Beginner;

  const isInteractable = !locked || !hasEsp32;

  const handleClick = () => {
    if (!isInteractable) return;
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 180);
    onOpen();
  };

  return (
    <div
      className="mc"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        borderRadius: 18,
        padding: 20,
        background: isCurrent && !done
          ? `linear-gradient(135deg, ${color}0a, ${CARD})`
          : CARD,
        border: `1px solid ${done ? `${color}40` : hovered ? `${color}70` : isCurrent ? `${color}35` : LINE}`,
        cursor: !isInteractable ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.48 : 1,
        overflow: 'hidden',
        animationDelay: `${idx * 0.06}s`,

        // === MATCHED FEATURE-ROW ANIMATION SPECIFICATIONS ===
        transform: hovered && !locked
          ? 'translateY(-4px) scale(1.005)'
          : isClicking
            ? 'scale(0.98)'
            : 'scale(1)',

        boxShadow: hovered && !locked
          ? `0 16px 32px -10px ${color}20, 0 0 0 1px ${color}40`
          : '0 4px 12px -6px rgba(0,0,0,0.05)',

        transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), ' +
                    'box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1), ' +
                    'border-color 0.25s ease, background 0.3s ease',
      }}
    >
      {/* Left Accent Bar */}
      <span style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderRadius: '4px 0 0 4px',
        background: `linear-gradient(to bottom, ${color}, ${color}dd)`,
        opacity: done ? 1 : hovered ? 0.95 : isCurrent ? 0.8 : locked ? 0.2 : 0.5,
        transition: 'opacity 0.3s ease',
      }} />

      {/* Icon with Dashboard-style Hover */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hovered && !locked ? `${color}20` : `${color}12`,
          color: locked ? FAINT : color,
          transform: hovered && !locked
            ? 'scale(1.12) rotate(-6deg)'
            : isClicking
              ? 'scale(0.88)'
              : 'scale(1)',
          boxShadow: hovered && !locked ? `0 0 30px ${color}45` : 'none',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        }}
      >
        {locked ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <MIcon id={a.id} color={color} size={26} />
        )}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h3 style={{
            margin: 0,
            fontSize: 15.5,
            fontWeight: 700,
            color: TEXT,
            fontFamily: SANS,
            lineHeight: 1.25,
            transition: 'color 0.2s ease'
          }}>
            {a.title}
          </h3>

          <span style={{
            fontSize: 9.5,
            fontWeight: 700,
            fontFamily: MONO,
            letterSpacing: '0.1em',
            padding: '2px 10px',
            borderRadius: 9999,
            background: done ? `${color}18` : hovered ? `${color}25` : `${color}0d`,
            color: done ? color : hovered ? '#fff' : FAINT,
            border: `1px solid ${done ? color : hovered ? color + '50' : LINE}`,
            transition: 'all 0.25s ease',
          }}>
            {done ? '✓ COMPLETED' : isCurrent && !locked ? 'ACTIVE' : locked ? '🔒 LOCKED' : diff.label}
          </span>
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 12px',
          fontSize: 13,
          color: MUTED,
          fontFamily: INTER,
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {a.description}
        </p>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {a.teaches.slice(0, 4).map((t: string) => (
            <span
              key={t}
              style={{
                padding: '3px 9px',
                borderRadius: 6,
                fontSize: 9.5,
                fontWeight: 600,
                fontFamily: MONO,
                background: hovered ? `${color}20` : `${color}0d`,
                border: `1px solid ${hovered ? color + '40' : color + '20'}`,
                color: hovered ? '#fff' : TEXT,
                transition: 'all 0.2s ease',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Progress */}
        {!locked && !done && progress > 0 && (
          <div style={{
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            marginBottom: 14,
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${color}, #fff)`,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: `1px solid ${hovered ? color + '25' : LINE}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: FAINT, fontFamily: MONO }}>
            <span>{a.duration}</span>
            <span style={{ color: color, fontWeight: 700 }}>+{diff.xp} XP</span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: SANS,
              color: locked ? FAINT : hovered ? '#fff' : color,
              transform: hovered && !locked ? 'translateX(6px)' : 'translateX(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {locked
              ? (!hasEsp32 ? 'Unlock Kit' : 'Locked')
              : done ? 'Review' : progress > 0 ? 'Continue' : 'Start Mission'
            }
            {!locked && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hovered ? 'translateX(4px)' : 'translateX(0)'
                }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </span>
        </div>
      </div>

      {/* Shimmer Overlay matching background position changes */}
      {hovered && !locked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(60deg, transparent 30%, ${color}12 50%, transparent 70%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer-row 1.4s infinite cubic-bezier(0.25, 1, 0.5, 1)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      <style jsx>{`
        @keyframes shimmer-row {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
/* ══════════════════════════════════
   LEARNING PATH PANEL (right)
══════════════════════════════════ */
function PathPanel({ activities, mounted, isCompleted, hasEsp32, onNav }: {
  activities: Activity[]; mounted: boolean; isCompleted: (id: string) => boolean;
  hasEsp32: boolean; onNav: (a: Activity) => void;
}) {
  const doneCount = mounted ? activities.filter(a => isCompleted(a.id)).length : 0;
  const pct = activities.length ? Math.round(doneCount / activities.length * 100) : 0;
  const currIdx = mounted ? activities.findIndex(a => !isCompleted(a.id)) : 0;

  return (
    <div style={{
      position: 'sticky', top: 20,
      borderRadius: 18, background: PANEL,
      border: `1px solid ${LINE}`,
      overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${LINE}` }}>
        <p style={{
          margin: '0 0 1px', fontSize: 9, fontWeight: 700, color: FAINT, fontFamily: MONO,
          textTransform: 'uppercase', letterSpacing: '0.12em'
        }}>Learning Path</p>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TEXT, fontFamily: SANS }}>Your Journey</p>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399', fontFamily: SANS }}>{pct}%</span>
        </div>
        <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 99,
            background: 'linear-gradient(90deg,#10b981,#3b82f6 60%,#8b5cf6)',
            transition: 'width 1s ease'
          }} />
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 9, color: FAINT, fontFamily: MONO }}>
          {doneCount} of {activities.length} missions complete
        </p>
      </div>

      {/* timeline */}
      <div style={{ padding: '14px 16px 16px', position: 'relative' }}>
        {/* bg line */}
        <div style={{
          position: 'absolute', left: 30, top: 14, bottom: 16, width: 1,
          background: 'rgba(255,255,255,0.06)', borderRadius: 1
        }} />
        {/* progress fill */}
        <div style={{
          position: 'absolute', left: 30, top: 14, width: 1, borderRadius: 1,
          background: 'linear-gradient(180deg,#10b981,#3b82f6)',
          height: `${Math.max(0, doneCount / Math.max(activities.length, 1) * 100)}%`,
          transition: 'height 1s ease'
        }} />

        {activities.map((a, i) => {
          const isDone = mounted && isCompleted(a.id);
          const isActive = !isDone && i === currIdx;
          const isLock = calcLocked(a, activities, mounted, hasEsp32, isCompleted);
          const color = accent(a.id);
          const clickable = isDone || isActive;

          return (
            <div key={a.id} className={clickable ? 'pi-click' : ''}
              onClick={() => clickable && onNav(a)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: i < activities.length - 1 ? 16 : 0,
                position: 'relative', zIndex: 1,
                borderRadius: 10, padding: '6px',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'background .15s',
              }}>

              {/* node */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? color : isActive ? `${color}20` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isDone || isActive ? color : LINE}`,
                boxShadow: isActive ? `0 0 10px ${color}50` : 'none',
                transition: 'all .3s',
              }}>
                {isDone
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : isLock
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    : <MIcon id={a.id} color={isActive ? color : FAINT} size={13} />
                }
              </div>

              {/* text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 1px', fontSize: 11.5, fontWeight: 700, fontFamily: SANS,
                  color: isDone ? TEXT : isActive ? TEXT : MUTED,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {a.title}
                </p>
                <p style={{
                  margin: 0, fontSize: 9.5, fontFamily: MONO,
                  color: isDone ? color : isActive ? color : FAINT
                }}>
                  {DIFF[a.difficulty]?.label} · +{DIFF[a.difficulty]?.xp} XP
                </p>
              </div>

              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />}
              {isDone && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
          );
        })}

        {/* more soon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, position: 'relative', zIndex: 1, padding: '6px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <div>
            <p style={{ margin: '0 0 1px', fontSize: 11, fontWeight: 600, fontFamily: SANS, color: FAINT }}>More missions</p>
            <p style={{ margin: 0, fontSize: 9.5, fontFamily: MONO, color: FAINT }}>WiFi, MQTT & more</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function ActivitiesPage() {
  const router = useRouter();
  const { isCompleted, getProgress, initialize, hasAccess, streak } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [completedCount, setDone] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) await initialize();
      const res = await fetch('/api/activities');
      const data = await res.json();
      setActivities(data);
      if (user?.id) setDone(data.filter((a: Activity) => isCompleted(a.id)).length);
      setLoading(false);
      setMounted(true);
    };
    load();
  }, []);

  const filtered = activities.filter(a => {
    const mf = filter === 'All' || a.difficulty === filter;
    const ms = search === '' || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    return mf && ms;
  });

  const xp = completedCount * 250;
  const xpMax = 1000;
  const xpPct = Math.min(100, Math.round(xp / xpMax * 100));
  const lvl = completedCount === 0 ? 1 : completedCount <= 2 ? 2 : 3;
  const lvlN = ['', 'Beginner', 'Explorer', 'Maker'][lvl];

  const safeNav = (a: Activity) => {
    if (calcLocked(a, activities, mounted, hasEsp32, isCompleted)) {
      if (!hasEsp32) router.push('/redeem');
      return;
    }
    router.push(`/activities/${a.id}`);
  };

  const next = mounted
    ? activities.find(a => !isCompleted(a.id) && !calcLocked(a, activities, mounted, hasEsp32, isCompleted))
    : null;

  if (loading) return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      <Header />
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 16px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2.5px solid ${LINE}` }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #3b82f6',
              borderTopColor: 'transparent', animation: 'spin .85s linear infinite'
            }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: SANS, color: MUTED }}>Loading missions…</p>
        </div>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT }}>
      <style suppressHydrationWarning>{`
        @keyframes pad   {0%,100%{opacity:.22}50%{opacity:.9}}
        @keyframes pulse {0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin  {to{transform:rotate(360deg)}}
        @keyframes rise  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

        *,*::before,*::after{box-sizing:border-box;}
        h1,h2,h3{font-family:${SANS};}

        /* mission card — FeatureRow style */
        .mc{
          transition:transform .25s cubic-bezier(.16,1,.3,1),
                     box-shadow .25s, border-color .25s;
          animation:rise .45s cubic-bezier(.16,1,.3,1) both;
        }
        .mc:hover{
          transform:translateY(-4px);
          box-shadow:0 14px 36px rgba(0,0,0,0.5)!important;
        }
        .mc:hover .mc-icon { transform:scale(1.08) rotate(-3deg); }
        .mc:hover .mc-arrow { transform:translateX(4px); }
        .mc-icon { transition:transform .3s cubic-bezier(.16,1,.3,1); }
        .mc-arrow{ transition:transform .2s; }

        /* path items */
        .pi-click{transition:background .15s;}
        .pi-click:hover{background:rgba(255,255,255,0.04)!important;}

        /* filter */
        .fb{cursor:pointer;border:none;font-family:${SANS};transition:all .15s;}
        .fb:hover{opacity:.82;transform:translateY(-1px);}

        /* search */
        .srch{outline:none;transition:border-color .2s,box-shadow .2s;}
        .srch:focus{border-color:rgba(59,130,246,.45)!important;box-shadow:0 0 0 3px rgba(59,130,246,.08)!important;}
        .srch::placeholder{color:${FAINT};}

        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:99px;}

        .r1{animation:rise .5s cubic-bezier(.16,1,.3,1) .03s both;}
        .r2{animation:rise .5s cubic-bezier(.16,1,.3,1) .10s both;}
        .r3{animation:rise .5s cubic-bezier(.16,1,.3,1) .17s both;}
      `}</style>

      <Header />
      <div style={{ height: 2, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6 50%,#f59e0b)' }} />
      <CircuitBg />

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '28px 22px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <div className="r1" style={{
          borderRadius: 20, overflow: 'hidden', marginBottom: 24,
          border: `1px solid ${LINE}`,
          background: `linear-gradient(160deg,${BG} 0%,#060d19 60%,${BG} 100%)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -100, right: -40, width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(59,130,246,0.12),transparent 60%)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 60% 100% at 70% 0%,black,transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 100% at 70% 0%,black,transparent)'
          }} />
          <div style={{ height: 2, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6 50%,#f59e0b)' }} />

          <div style={{ padding: '26px 30px 28px', position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>

              {/* left */}
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99,
                  marginBottom: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)'
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#93c5fd', fontFamily: MONO }}>ESP32 IoT Platform</span>
                </div>
                <h1 style={{
                  margin: '0 0 6px', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900, color: TEXT,
                  letterSpacing: '-0.025em', lineHeight: 1.05
                }}>Activities</h1>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: MUTED, fontFamily: INTER, lineHeight: 1.65, maxWidth: 400 }}>
                  Guided hardware missions wire up, simulate, code, and flash to real ESP32.
                </p>
                {next && (
                  <button onClick={() => safeNav(next)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 11,
                      background: 'linear-gradient(135deg,#1a3a8a,#3b82f6)', border: 'none', cursor: 'pointer',
                      color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SANS,
                      boxShadow: '0 6px 20px -6px rgba(59,130,246,0.6)',
                      transition: 'transform .2s,box-shadow .2s'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    {mounted && completedCount > 0 ? `Continue — ${next.title}` : 'Start First Mission'}
                  </button>
                )}
              </div>

              {/* right: level + stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`
                }}>
                  <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                    <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#10b981" strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - xpPct / 100)}`}
                        style={{
                          transition: 'stroke-dashoffset 1.4s ease',
                          filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))'
                        }} />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: TEXT, fontFamily: SANS, lineHeight: 1 }}>{lvl}</span>
                      <span style={{
                        fontSize: 7, fontWeight: 700, color: '#10b981', fontFamily: MONO,
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>{lvlN}</span>
                    </div>
                  </div>
                  <div>
                    <p style={{
                      margin: '0 0 1px', fontSize: 9, color: FAINT, fontFamily: MONO,
                      textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>XP Progress</p>
                    <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: TEXT, fontFamily: SANS }}>
                      {mounted ? xp.toLocaleString() : 0}
                      <span style={{ fontSize: 10, color: FAINT, fontWeight: 400 }}> / {xpMax}</span>
                    </p>
                    <div style={{ width: 100, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${xpPct}%`, borderRadius: 99,
                        background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width 1.2s ease'
                      }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { val: mounted ? completedCount : 0, label: 'Done', color: '#10b981' },
                    { val: activities.length, label: 'Total', color: '#3b82f6' },
                    { val: mounted ? (streak ?? 0) : 0, label: 'Streak', color: '#ef4444' },
                    { val: mounted ? completedCount * 4 : 0, label: 'Skills', color: '#8b5cf6' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, textAlign: 'center', minWidth: 48
                    }}>
                      <p style={{ margin: '0 0 1px', fontSize: 16, fontWeight: 900, color: s.color, fontFamily: SANS, lineHeight: 1 }}>{s.val}</p>
                      <p style={{ margin: 0, fontSize: 8, color: FAINT, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTERS + SEARCH ── */}
        <div className="r2" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 10, marginBottom: 20
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {FILTERS.map(f => {
              const on = filter === f;
              const count = f === 'All' ? activities.length : activities.filter(a => a.difficulty === f).length;
              return (
                <button key={f} type="button" className="fb" onClick={() => setFilter(f)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  background: on ? '#3b82f6' : PANEL, color: on ? '#fff' : MUTED,
                  border: on ? 'none' : `1px solid ${LINE}`,
                  boxShadow: on ? '0 2px 10px rgba(59,130,246,0.35)' : 'none',
                }}>
                  {f}
                  <span style={{
                    padding: '0 5px', borderRadius: 99, fontSize: 8, fontWeight: 800, fontFamily: MONO,
                    background: on ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : FAINT
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: FAINT, display: 'flex', pointerEvents: 'none'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search missions…" className="srch"
              style={{
                height: 36, borderRadius: 9, padding: '0 30px 0 30px', background: PANEL,
                border: `1px solid ${LINE}`, fontSize: 12, color: TEXT, fontFamily: INTER, width: 200
              }} />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: FAINT, display: 'flex'
                }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN: cards + path ── */}
        <div className="r3" style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, alignItems: 'start' }}>

          {/* LEFT: mission cards — stacked list like FeatureRow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '44px 24px', borderRadius: 16, textAlign: 'center', background: PANEL, border: `1px solid ${LINE}` }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: MUTED, fontFamily: SANS }}>No missions found</p>
                <p style={{ margin: '0 0 14px', fontSize: 11, color: FAINT, fontFamily: INTER }}>Try a different filter</p>
                <button type="button" onClick={() => { setSearch(''); setFilter('All'); }} style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: SANS
                }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {filtered.map((a, idx) => {
                  const done = mounted && isCompleted(a.id);
                  const progress = mounted ? getProgress(a.id, a.assemble?.steps?.length ?? 5) : 0;
                  const locked = calcLocked(a, activities, mounted, hasEsp32, isCompleted);
                  const currIdx = mounted ? activities.findIndex(x => !isCompleted(x.id)) : -1;
                  const origIdx = activities.findIndex(x => x.id === a.id);
                  return (
                    <MissionCard key={a.id} a={a} done={done} progress={progress}
                      locked={locked} hasEsp32={hasEsp32} idx={idx}
                      isCurrent={origIdx === currIdx}
                      onOpen={() => safeNav(a)} />
                  );
                })}

                {/* coming soon */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18,
                  border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'rgba(245,158,11,0.25)', borderRadius: '3px 0 0 3px' }} />
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: 'rgba(245,158,11,0.07)', marginLeft: 4
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: MUTED, fontFamily: SANS }}>More Missions Coming</h3>
                    <p style={{ margin: 0, fontSize: 12, color: FAINT, fontFamily: INTER }}>WiFi, MQTT, sensors & more are on the way.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: path panel */}
          <PathPanel activities={activities} mounted={mounted}
            isCompleted={isCompleted} hasEsp32={hasEsp32} onNav={safeNav} />
        </div>

        {/* unlock banner */}
        {!hasEsp32 && (
          <div style={{
            marginTop: 20, padding: '12px 16px', borderRadius: 12, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', gap: 14,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)'
          }}>
            <div>
              <p style={{
                margin: '0 0 1px', fontSize: 11, fontWeight: 700, color: '#f59e0b', fontFamily: SANS,
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Limited Preview
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,158,11,0.5)', fontFamily: INTER }}>
                Only the first mission is available. Unlock all with your kit code.
              </p>
            </div>
            <Link href="/redeem" style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 9, textDecoration: 'none',
              background: 'linear-gradient(135deg,#92400e,#f59e0b)', color: '#1a0f00',
              fontSize: 11, fontWeight: 800, fontFamily: SANS
            }}>
              Unlock All
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}