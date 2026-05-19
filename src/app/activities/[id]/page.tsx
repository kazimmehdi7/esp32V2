'use client';

// src/app/activities/[id]/page.tsx — FULL REDESIGN
// Replace your existing file entirely with this

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ACTIVITIES } from '@/lib/activitiesData';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { runLoop, stopSimulation } from '@/lib/simulatorEngine';
import { deriveHardwareLayout } from '@/lib/hardwareParser';
import HardwareBoard from '@/components/HardwareBoard';
import DynamicWiringSimulator from '@/components/DynamicWiringSimulator';


// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Intro', icon: '📋', time: '2 min' },
  { id: 1, label: 'Equipment', icon: '🔧', time: '5 min' },
  { id: 2, label: 'Assemble', icon: '🛠️', time: '10 min' },
  { id: 3, label: 'Code', icon: '💻', time: '10 min' },
  { id: 4, label: 'Output', icon: '📊', time: '3 min' },
];

const DIFF_CONFIG: Record<string, { label: string; color: string; stars: string }> = {
  Beginner: { label: 'Easy', color: 'bg-emerald-100 text-emerald-700', stars: '⭐' },
  Intermediate: { label: 'Medium', color: 'bg-amber-100 text-amber-700', stars: '⭐⭐' },
  Advanced: { label: 'Hard', color: 'bg-red-100 text-red-700', stars: '⭐⭐⭐' },
};

const CARD_COLORS = [
  { border: 'hover:border-blue-400', shadow: 'hover:shadow-blue-100', badge: 'bg-blue-500' },
  { border: 'hover:border-violet-400', shadow: 'hover:shadow-violet-100', badge: 'bg-violet-500' },
  { border: 'hover:border-emerald-400', shadow: 'hover:shadow-emerald-100', badge: 'bg-emerald-500' },
  { border: 'hover:border-orange-400', shadow: 'hover:shadow-orange-100', badge: 'bg-orange-500' },
  { border: 'hover:border-pink-400', shadow: 'hover:shadow-pink-100', badge: 'bg-pink-500' },
  { border: 'hover:border-amber-400', shadow: 'hover:shadow-amber-100', badge: 'bg-amber-500' },
  { border: 'hover:border-red-400', shadow: 'hover:shadow-red-100', badge: 'bg-red-500' },
];

// ─── Animated Step Content Wrapper ───────────────────────────────────────────

function StepContent({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      {children}
    </div>
  );
}

// ─── Inline All-in-One Simulator ────────────────────────────────────────────

function InlineSimulator({ activity }: { activity: any }) {
  const { serial, isRunning } = useSimulatorStore();
  const addBlock = useAppStore((s) => s.addBlock);
  const clearBlocks = useAppStore((s) => s.clearBlocks);
  const blocks = useAppStore((s) => s.blocks);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'hardware' | 'code' | 'serial'>('hardware');

  useEffect(() => {
    clearBlocks();
    activity.playgroundBlocks?.forEach((b: any) =>
      addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })
    );
  }, [activity.id]);

  const handleRunToggle = () => {
    if (isRunning) stopSimulation();
    else runLoop(blocks);
  };

  const peripherals = useCallback(() => deriveHardwareLayout(blocks), [blocks])();

  const tabs = [
    { id: 'hardware', label: '🔌 Hardware' },
    { id: 'code', label: '💻 Code' },
    { id: 'serial', label: `📟 Serial${serial.length > 0 ? ` (${serial.length})` : ''}` },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-[#1a2d45]">ESP32 Simulator</span>
          {isRunning && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { clearBlocks(); activity.playgroundBlocks?.forEach((b: any) => addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })); router.push('/'); }}
            className="text-[10px] font-semibold text-gray-400 transition-colors hover:text-[#1a2d45]"
          >
            Open full ↗
          </button>
          <button
            type="button"
            onClick={handleRunToggle}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold text-white transition-all duration-200 active:scale-95 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1a2d45] hover:bg-[#243d5a]'
              }`}
          >
            {isRunning ? '⏹ Stop' : '▶ Run'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 bg-white px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`mr-1 border-b-2 px-3 py-2.5 text-[11px] font-bold transition-all duration-150 ${activeTab === t.id
                ? 'border-[#1a2d45] text-[#1a2d45]'
                : 'border-transparent text-gray-400 hover:text-[#1a2d45]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[340px]">
        {activeTab === 'hardware' && (
          <div className="h-[340px] w-full">
            {peripherals.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="text-4xl">🔌</span>
                <p className="text-sm font-bold text-gray-400">No hardware detected</p>
                <p className="text-xs leading-relaxed text-gray-300">
                  Blocks like LED, buzzer, and button will appear here automatically.
                </p>
              </div>
            ) : (
              <HardwareBoard peripherals={peripherals} />
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-[340px] overflow-auto bg-[#0d1b2a] p-5">
            <pre className="text-[11px] leading-relaxed text-emerald-300">
              <code>{activity.code.arduino}</code>
            </pre>
          </div>
        )}

        {activeTab === 'serial' && (
          <div className="flex h-[340px] flex-col bg-[#0d1b2a]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <span className="text-[10px] font-bold text-white/30">115200 baud</span>
              {serial.length > 0 && (
                <button
                  type="button"
                  onClick={() => useSimulatorStore.getState().resetSimulation()}
                  className="text-[10px] font-bold text-red-400 transition-colors hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {serial.length === 0 ? (
                <p className="text-[11px] italic text-white/20">Press Run to start...</p>
              ) : (
                serial.map((line, i) => (
                  <p key={i} className="font-mono text-[11px] text-emerald-400">
                    <span className="mr-2 text-white/20">{'>'}</span>{line}
                  </p>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 0: Intro ────────────────────────────────────────────────────────────

function IntroStep({ activity }: { activity: any }) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-[#1a2d45] p-7 text-white">
        <div className="pointer-events-none absolute -right-6 -top-6 select-none text-[130px] opacity-[0.07]">
          {activity.icon}
        </div>
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1">
            <span className="text-sm">{activity.icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              {activity.difficulty} Project
            </span>
          </div>
          <h2 className="text-xl font-extrabold leading-snug">{activity.intro.headline}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
              ⏱ {activity.duration}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
              🔧 {activity.equipment?.length} parts
            </span>
            {activity.tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="group rounded-2xl border-2 border-dashed border-[#1a2d45]/20 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#1a2d45]/40 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a2d45] text-sm">🎯</div>
            <h3 className="font-extrabold text-[#1a2d45]">What you will build</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">{activity.intro.what}</p>
        </div>
        <div className="group rounded-2xl border-2 border-dashed border-[#1a2d45]/20 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#1a2d45]/40 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-sm">💡</div>
            <h3 className="font-extrabold text-[#1a2d45]">Why this matters</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">{activity.intro.why}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-sm">🏆</div>
          <h3 className="font-extrabold text-[#1a2d45]">Skills you will unlock</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.teaches.map((t: string, i: number) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-emerald-400">✦</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Equipment ────────────────────────────────────────────────────────

function EquipmentStep({ activity }: { activity: any }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl bg-[#1a2d45] p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-xl">🔧</div>
          <div>
            <h2 className="font-extrabold">Gather Your Parts</h2>
            <p className="text-[11px] text-white/60">Get everything ready before you start building!</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5">
          <p className="text-[11px] font-semibold text-white/80">
            🛒 {activity.equipment.length} items needed — All of them are available in "Build Mind" mediatiz foundation kit.
          </p>
        </div>
      </div>

      {/* Equipment list — clean rows, no images, no emoji */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {activity.equipment.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[#f8f9fb]"
            >
              <div className="flex items-center gap-4">
                {/* Index number */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a2d45] text-[11px] font-bold text-white">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1a2d45]">{item.name}</p>
                  <p className="text-[11px] text-gray-400">{item.description}</p>
                </div>
              </div>
              {/* Quantity badge */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-extrabold text-amber-700">
                {item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 rounded-2xl border-2 border-blue-100 bg-blue-50 p-4">
        <p className="text-[11px] font-semibold leading-relaxed text-blue-700">
          💡 Search for an &quot;ESP32 Starter Kit&quot; on Amazon or AliExpress — usually includes most parts in one box!
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Assemble ─────────────────────────────────────────────────────────

function AssembleStep({ activity }: { activity: any }) {
  const hasWiring = !!activity.wiringComponent;
  const [view, setView] = useState<'wiring' | 'video'>(hasWiring ? 'wiring' : 'video');

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-1.5 rounded-2xl bg-[#f0f2f5] p-1.5">
        {[
          ...(hasWiring ? [{ id: 'wiring' as const, label: '🔌 Wire It Up' }] : []),
          { id: 'video' as const, label: '▶ Video' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-200 ${view === t.id
                ? 'bg-white text-[#1a2d45] shadow-sm'
                : 'text-gray-400 hover:text-[#1a2d45]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Wiring Simulator */}
      {view === 'wiring' && activity.wiringComponent && (
        <DynamicWiringSimulator component={activity.wiringComponent} />
      )}

      {/* Video */}
      {view === 'video' && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <p className="text-[12px] font-semibold text-[#1a2d45]">▶ Video Tutorial</p>
          </div>
          <iframe
            src={activity.assemble.videoUrl}
            className="h-[400px] w-full"
            title="Video Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Wiring Steps */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1a2d45] text-sm">🛠️</div>
          <h3 className="text-[13px] font-semibold text-[#1a2d45]">Wiring steps</h3>
        </div>
        <div className="space-y-2">
          {activity.assemble.steps.map((step: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#f8f9fb] px-4 py-3 transition-all hover:border-[#1a2d45]/20 hover:bg-[#f0f4f8]">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1a2d45] text-[10px] font-semibold text-white mt-0.5">
                {idx + 1}
              </div>
              <p className="text-[13px] leading-relaxed text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Step 3: Code ─────────────────────────────────────────────────────────────

function CodeStep({ activity }: { activity: any }) {
  const router = useRouter();
  const clearBlocks = useAppStore((s) => s.clearBlocks);
  const addBlock = useAppStore((s) => s.addBlock);
  const [tab, setTab] = useState<'platform' | 'arduino'>('platform');
  const [copied, setCopied] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiQ, setAiQ] = useState('');
  const [aiA, setAiA] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activity.code.arduino);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPlayground = () => {
    clearBlocks();
    activity.playgroundBlocks?.forEach((b: any) =>
      addBlock({ type: b.type, icon: b.icon, label: b.label, params: b.params, values: b.values })
    );
    router.push('/');
  };

  const askAi = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true); setAiA('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: `You help kids learn ESP32. Project: ${activity.title}. Code: ${activity.code.arduino}. Expected: ${activity.output.expected.join(', ')}. Be friendly, simple, concise.`,
          messages: [{ role: 'user', content: aiQ }],
        }),
      });
      const d = await res.json();
      setAiA(d.content?.map((c: any) => c.text || '').join('') || 'No response.');
    } catch { setAiA('Something went wrong. Try again!'); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-4">

      {/* ── Tab switcher ── */}
      <div className="flex gap-1.5 rounded-2xl bg-[#f0f2f5] p-1.5">
        {([
          { id: 'platform', label: '🧩 Our Platform' },
          { id: 'arduino',  label: '⚙️ Arduino IDE'  },
        ] as const).map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-[12px] font-bold transition-all duration-200 ${
              tab === t.id ? 'bg-white text-[#1a2d45] shadow-sm' : 'text-gray-400 hover:text-[#1a2d45]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Platform tab ── */}
      {tab === 'platform' && (
        <div className="space-y-3">

          {/* Description card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1a2d45] text-lg">🧩</div>
              <div>
                <p className="font-extrabold text-[#1a2d45]">Block Playground</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{activity.code.platformDescription}</p>
              </div>
            </div>
          </div>

          {/* Blocks grid */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {activity.playgroundBlocks?.length ?? 0} Blocks
              </p>
              <button type="button" onClick={openPlayground}
                className="flex items-center gap-1.5 rounded-xl bg-[#1a2d45] px-4 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#243d5a] active:scale-95">
                Open Full →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activity.playgroundBlocks?.map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-[#f8f9fb] px-3 py-2.5">
                  <span className="text-base">{b.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-[#1a2d45]">{b.type}</p>
                    <p className="text-[9px] text-gray-400 truncate max-w-[80px]">{b.label?.replace(/<[^>]+>/g, '…')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inline simulator */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <p className="text-[11px] font-bold text-[#1a2d45]">▶ Run it here</p>
              <span className="text-[10px] text-gray-400">No upload needed</span>
            </div>
            <div className="p-4">
              <InlineSimulator activity={activity} />
            </div>
          </div>

        </div>
      )}

      {/* ── Arduino tab ── */}
      {tab === 'arduino' && (
        <div className="overflow-hidden rounded-2xl bg-[#020508] shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {['bg-red-400','bg-yellow-400','bg-emerald-400'].map(c=>(
                  <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`}/>
                ))}
              </div>
              <span className="text-[10px] text-white/25 font-mono">{activity.title}.ino</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/20">
                {activity.code.arduino.split('\n').length} lines
              </span>
              <button type="button" onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all duration-200 ${
                  copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white/70'
                }`}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
          <div className="overflow-auto p-5">
            <pre className="text-[11px] leading-relaxed text-emerald-300">
              <code>{activity.code.arduino}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ── AI Assistant ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <button type="button" onClick={() => setShowAi(!showAi)}
          className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-lg">✨</div>
            <div className="text-left">
              <p className="text-[13px] font-extrabold text-[#1a2d45]">Ask AI for help</p>
              <p className="text-[10px] text-gray-400">Stuck? Ask anything about this project</p>
            </div>
          </div>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[11px] text-gray-400 transition-transform duration-200 ${showAi ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>

        {showAi && (
          <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-3">

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2">
              {[
                'Why is nothing happening?',
                'What does this line do?',
                'How do I change the speed?',
              ].map((q) => (
                <button key={q} type="button" onClick={() => setAiQ(q)}
                  className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-600 transition-colors hover:bg-violet-100">
                  {q}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQ}
                onChange={(e) => setAiQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAi()}
                placeholder="Ask anything about this project..."
                className="flex-1 rounded-xl border border-gray-200 bg-[#f4f6f9] px-4 py-2.5 text-[11px] text-gray-700 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <button type="button" onClick={askAi}
                disabled={aiLoading || !aiQ.trim()}
                className="rounded-xl bg-violet-500 px-4 py-2 text-[11px] font-bold text-white transition-all hover:bg-violet-600 disabled:opacity-30 active:scale-95">
                {aiLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                  </span>
                ) : 'Ask'}
              </button>
            </div>

            {/* Response */}
            {aiA && (
              <div className="overflow-hidden rounded-xl border border-violet-100 bg-violet-50">
                <div className="flex items-center gap-2 border-b border-violet-100 px-4 py-2.5">
                  <span className="text-violet-400 text-sm">✨</span>
                  <p className="text-[10px] font-bold text-violet-500">AI Assistant</p>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-700">{aiA}</pre>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

// ─── Step 4: Output ───────────────────────────────────────────────────────────

function OutputStep({ activity }: { activity: any }) {
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="rounded-3xl bg-[#1a2d45] px-7 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-2xl">📊</div>
          <div>
            <h2 className="text-lg font-extrabold">Expected Output</h2>
            <p className="mt-0.5 text-[12px] text-white/50">{activity.output.description}</p>
          </div>
        </div>
      </div>

      {/* Serial Monitor */}
      <div className="overflow-hidden rounded-2xl bg-[#020508] shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {['bg-red-400', 'bg-yellow-400', 'bg-emerald-400'].map(c => (
                <div key={c} className={`h-3 w-3 rounded-full ${c}`} />
              ))}
            </div>
            <p className="text-[10px] font-semibold text-white/20">Serial Monitor — 115200 baud</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        {/* Output lines */}
        <div className="space-y-0.5 p-5">
          {activity.output.expected.map((line: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 font-mono text-[11px]">
              {line.startsWith('(') ? (
                <span className="italic text-white/20">{line}</span>
              ) : (
                <>
                  <span className="mt-0.5 shrink-0 text-white/20">›</span>
                  <span className={`${idx === 0 ? 'text-white/60' : 'text-emerald-400'}`}>{line}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-base shadow-sm">🔍</div>
            <div>
              <h3 className="font-extrabold text-[#1a2d45]">Troubleshooting Tips</h3>
              <p className="text-[10px] text-gray-400">{activity.output.tips.length} common issues</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-600">
            If stuck
          </span>
        </div>

        {/* Tips */}
        <div className="divide-y divide-gray-50">
          {activity.output.tips.map((tip: string, idx: number) => (
            <div key={idx}
              className="group flex items-start gap-4 px-5 py-4 transition-all duration-150 hover:bg-amber-50"
            >
              {/* Number */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-600 mt-0.5 group-hover:bg-amber-400 group-hover:text-white transition-colors duration-150">
                {idx + 1}
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600 group-hover:text-gray-800 transition-colors duration-150">
                {tip}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Bonus Challenge */}
      {activity.bonusChallenge && (
        <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-5 transition-all hover:border-violet-300 hover:bg-violet-100/50">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500 text-sm">🚀</div>
            <h3 className="font-extrabold text-violet-800">Bonus Challenge</h3>
            <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-600">Optional</span>
          </div>
          <p className="text-[12px] leading-relaxed text-violet-700">{activity.bonusChallenge}</p>
        </div>
      )}

      {/* Completion card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#1a2d45] p-7 text-white">
        <div className="pointer-events-none absolute -bottom-8 -right-8 select-none text-[120px] opacity-[0.06]">🎉</div>
        <div className="pointer-events-none absolute -top-8 -left-8 select-none text-[80px] opacity-[0.04]">⚡</div>
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5">
            <span>🏆</span>
            <span className="text-[11px] font-bold text-emerald-300">Almost Done!</span>
          </div>
          <h3 className="text-2xl font-extrabold">Project Complete!</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">
            You built <span className="font-bold text-white">{activity.title}</span>! Click Done to save your progress and unlock the next project.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="/activities"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-[11px] font-bold transition-all hover:bg-white/20">
              ← More Activities
            </a>
            <a href="/"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-[11px] font-bold text-[#1a2d45] transition-all hover:bg-amber-300 hover:scale-[1.02] active:scale-95">
              Open Simulator →
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function useConfetti() {
  const fire = () => {
    const colors = ['#1a2d45', '#f59e0b', '#4ade80', '#a78bfa', '#60a5fa', '#ffffff'];
    if (typeof window !== 'undefined' && (window as any).confetti) {
      const c = (window as any).confetti;
      c({ spread: 60, startVelocity: 45, particleCount: 60, colors, origin: { y: 0.6 } });
      setTimeout(() => c({ spread: 100, decay: 0.91, scalar: 0.8, particleCount: 40, colors, origin: { y: 0.6 } }), 150);
      setTimeout(() => c({ spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, particleCount: 30, colors, origin: { y: 0.6 } }), 300);
    }
  };
  return { fire };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const activity = ACTIVITIES.find((a) => a.id === params.id);
  const { markStepComplete, markActivityComplete, getLastStep, isCompleted } = useActivityStore();
  const { fire: fireConfetti } = useConfetti();

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  useEffect(() => {
    const last = getLastStep(params.id);
    setCurrentStep(last);
    setCompleted(Array.from({ length: last }, (_, i) => i));
  }, [params.id]);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch { } };
  }, []);

  if (!activity) {
    return (
      <main className="min-h-screen bg-[#eef1f5]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-5xl">😕</p>
          <p className="mt-3 text-lg font-extrabold text-[#1a2d45]">Activity not found</p>
          <button type="button" onClick={() => router.push('/activities')}
            className="mt-4 rounded-xl bg-[#1a2d45] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#243d5a]">
            ← Back to Activities
          </button>
        </div>
      </main>
    );
  }

  const diffCfg = DIFF_CONFIG[activity.difficulty] ?? DIFF_CONFIG.Beginner;
  const alreadyCompleted = isCompleted(activity.id);
  const progressPercent = alreadyCompleted ? 100 : Math.round((completed.length / STEPS.length) * 100);

  const handleStepChange = (step: number) => {
    if (!completed.includes(currentStep)) {
      setCompleted((p) => [...p, currentStep]);
      markStepComplete(activity.id, currentStep);
      setJustCompleted(currentStep);
      setTimeout(() => setJustCompleted(null), 600);
    }
    setCurrentStep(step);
  };

  const handleDone = () => {
    markStepComplete(activity.id, STEPS.length - 1);
    markActivityComplete(activity.id);
    fireConfetti();
    setTimeout(() => router.push('/activities'), 2200);
  };

  return (
    <main className="min-h-screen bg-[#eef1f5]">
      <Header />

      {/* Top amber progress bar */}
      <div className="h-1 w-full bg-gray-200">
        <div className="h-1 bg-amber-400 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* ── CHANGE 1: Full width flex, no max-w, no padding, sidebar touches edge ── */}
      <div className="flex" style={{ height: 'calc(100vh - 60px)' }}>

        {/* ── SIDEBAR — touches left edge, full height ── */}
        {/* ── CHANGE 2: no rounded corners, no margin, bg directly on aside ── */}
        <aside className="hidden w-56 shrink-0 md:flex md:flex-col bg-[#1a2d45] overflow-y-auto">
          <div className="flex flex-col p-4 h-full">

            <button
              type="button"
              onClick={() => router.push('/activities')}
              className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-white/40 transition-colors hover:text-white/70"
            >
              ← Activities
            </button>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Project</p>
            <p className="mb-4 text-[12px] font-extrabold leading-snug text-white">{activity.title}</p>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] text-white/30">Progress</span>
                <span className="text-[10px] font-bold text-emerald-400">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flex flex-col">
              {STEPS.map((step, idx) => {
                const isDone = completed.includes(step.id);
                const isActive = currentStep === step.id;
                const isBouncing = justCompleted === step.id;
                return (
                  <div key={step.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleStepChange(step.id)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${isActive
                          ? 'bg-white/15 text-white'
                          : isDone
                            ? 'text-emerald-400 hover:bg-white/8'
                            : 'text-white/35 hover:bg-white/8 hover:text-white/60'
                        }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] transition-all duration-300 ${isActive ? 'bg-amber-400 text-[#1a2d45] shadow' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10'
                          }`}
                        style={{
                          transform: isBouncing ? 'scale(1.3)' : 'scale(1)',
                          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      >
                        {isDone && !isActive ? '✓' : step.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold leading-tight">{step.label}</p>
                        <p className={`text-[10px] ${isActive ? 'text-white/50' : 'text-white/20'}`}>{step.time}</p>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className={`ml-[22px] h-3 w-0.5 rounded-full transition-colors duration-300 ${isDone ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold ${diffCfg.color}`}>
                {diffCfg.stars} {diffCfg.label}
              </span>
              {alreadyCompleted && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  ✓ Done
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { if (currentStep > 0) setCurrentStep(currentStep - 1); }}
                disabled={currentStep === 0}
                className="w-full rounded-xl bg-white/10 py-2 text-[11px] font-bold text-white/70 transition-all hover:bg-white/15 disabled:opacity-30"
              >
                ← Previous
              </button>
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="w-full rounded-xl bg-amber-400 py-2 text-[11px] font-extrabold text-[#1a2d45] transition-all hover:bg-amber-300 active:scale-95"
                >
                  Next: {STEPS[currentStep + 1].label} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full rounded-xl bg-emerald-500 py-2 text-[11px] font-extrabold text-white transition-all hover:bg-emerald-400 active:scale-95"
                >
                  {alreadyCompleted ? '✓ Done' : '🎉 Complete!'}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">

            {/* Mobile topbar */}
            <div className="mb-4 flex items-center justify-between md:hidden">
              <button type="button" onClick={() => router.push('/activities')} className="text-xs text-gray-500 hover:text-[#1a2d45]">
                ← Activities
              </button>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${diffCfg.color}`}>{diffCfg.stars} {diffCfg.label}</span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="mb-4 hidden items-center gap-2 text-[11px] text-gray-400 md:flex">
              <span>⚡ Activities</span>
              <span>/</span>
              <span className="font-bold text-[#1a2d45]">{activity.title}</span>
              {alreadyCompleted && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ Completed</span>
              )}
            </div>

            <StepContent stepKey={currentStep}>
              {currentStep === 0 && <IntroStep activity={activity} />}
              {currentStep === 1 && <EquipmentStep activity={activity} />}
              {currentStep === 2 && <AssembleStep activity={activity} />}
              {currentStep === 3 && <CodeStep activity={activity} />}
              {currentStep === 4 && <OutputStep activity={activity} />}
            </StepContent>

            {/* Mobile bottom nav */}
            <div className="mt-6 flex items-center justify-between md:hidden">
              <button
                type="button"
                onClick={() => { if (currentStep > 0) setCurrentStep(currentStep - 1); }}
                disabled={currentStep === 0}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1a2d45] shadow-sm disabled:opacity-30"
              >
                ← Prev
              </button>
              {currentStep < STEPS.length - 1 ? (
                <button type="button" onClick={() => handleStepChange(currentStep + 1)}
                  className="rounded-xl bg-[#1a2d45] px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={handleDone}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                  🎉 Complete!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}