'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';

import { generateCode } from '@/lib/codeGenerator';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import type { Block } from '@/types';
import LiveOutput from '@/components/LiveOutput';
import LiveSimulator from '@/components/LiveSimulator';

interface CodePanelProps { showLiveOutput?: boolean; }
type MainTab = 'code' | 'serial' | 'simulator';
type CodeFocus = 'split' | 'code' | 'steps';

/* ── Styles ─────────────────────────────────────────────────────────── */
const CP_STYLES = `
  .cp-syntax .kw  { color:#ff7b72; }
  .cp-syntax .fn  { color:#79c0ff; }
  .cp-syntax .num { color:#f0883e; }
  .cp-syntax .str { color:#a5d6ff; }
  .cp-syntax .cmt { color:#3d5068; font-style:italic; }
  .cp-syntax .pp  { color:#ff7b72; }
  .cp-syntax .tp  { color:#ffa657; }

  /* ── ROW 1: Tab buttons ── */
  .cp-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 40px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: "Space Grotesk", system-ui, sans-serif;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #2e4a60;
    position: relative;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }
  .cp-tab::after {
    content: '';
    position: absolute;
    bottom: 0; left: 10px; right: 10px;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: transparent;
    transition: background 0.2s;
  }
  /* Code tab active */
  .cp-tab-code.cp-tab-active        { color: #93c5fd; }
  .cp-tab-code.cp-tab-active::after { background: #3b82f6; }
  /* Serial tab active */
  .cp-tab-serial.cp-tab-active        { color: #6ee7b7; }
  .cp-tab-serial.cp-tab-active::after { background: #10b981; }
  /* Simulator tab active */
  .cp-tab-sim.cp-tab-active        { color: #c4b5fd; }
  .cp-tab-sim.cp-tab-active::after { background: #8b5cf6; }
  /* Inactive hover */
  .cp-tab:not(.cp-tab-active):hover {
    color: #4a6a86;
    background: rgba(255,255,255,0.03);
  }

  /* ── ROW 2: Toolbar buttons ── */

  /* Focus toggle pills */
  .cp-focus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 11px;
    border-radius: 7px;
    font-size: 11.5px;
    font-weight: 600;
    font-family: "Space Grotesk", system-ui, sans-serif;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    background: transparent;
    color: #243a4e;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }
  /* inactive hover — subtle, not clickable feel */
  .cp-focus:hover {
    color: #3d6280;
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.07);
  }
  /* active — filled, clearly selected */
 .cp-focus-on {
  background: rgba(59,130,246,0.25);
  border-color: rgba(59,130,246,0.5);
  color: #bfdbfe;
}
  /* inactive dim — clearly not selected */
  .cp-focus-off {
  opacity: 0.65;
  color: #4a6a86;
}

  /* Copy button */
  .cp-btn-copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 28px;
    padding: 0 13px;
    border-radius: 7px;
    font-size: 11.5px;
    font-weight: 600;
    font-family: "Space Grotesk", system-ui, sans-serif;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    color: #4a6a86;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }
  .cp-btn-copy:hover {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.3);
    color: #93c5fd;
  }
  .cp-btn-copy:active { transform: scale(0.96); }

  /* Copied state */
  .cp-btn-copied {
    background: rgba(16,185,129,0.12) !important;
    border-color: rgba(16,185,129,0.28) !important;
    color: #34d399 !important;
  }

  /* Flash button — premium filled, always stands out */
  .cp-btn-flash {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 28px;
    padding: 0 16px;
    border-radius: 7px;
    font-size: 11.5px;
    font-weight: 700;
    font-family: "Space Grotesk", system-ui, sans-serif;
    cursor: pointer;
    border: 1px solid rgba(251,191,36,0.45);
    background: linear-gradient(135deg, #d97706, #f59e0b);
    color: #1a0f00;
    letter-spacing: 0.02em;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.15s;
    box-shadow: 0 2px 10px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .cp-btn-flash:hover {
    background: linear-gradient(135deg, #b45309, #d97706);
    box-shadow: 0 4px 16px rgba(245,158,11,0.5);
    transform: translateY(-1px);
    border-color: rgba(251,191,36,0.6);
  }
  .cp-btn-flash:active { transform: scale(0.96); }

  /* Steps list */
  .cp-step {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    padding: 6px 8px;
    border-radius: 7px;
    transition: background 0.12s;
  }
  .cp-step:hover { background: rgba(59,130,246,0.06); }
  .cp-step-n {
    min-width: 18px; height: 18px;
    border-radius: 5px; flex-shrink: 0;
    background: rgba(37,99,235,0.12);
    border: 1px solid rgba(37,99,235,0.22);
    color: #4d7eb8;
    font-size: 9px; font-weight: 700; margin-top: 2px;
    display: flex; align-items: center; justify-content: center;
    font-family: "JetBrains Mono", monospace;
  }

  /* Scrollbars */
  .cp-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
  .cp-scroll::-webkit-scrollbar-track { background: transparent; }
  .cp-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.18); border-radius: 99px; }
  .cp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.32); }

  @keyframes cp-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes cp-fadein { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:none} }
`;

/* ── Icons ──────────────────────────────────────────────────────────── */
const IcoCode = memo(() => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>);
IcoCode.displayName = 'IcoCode';

const IcoSerial = memo(() => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>);
IcoSerial.displayName = 'IcoSerial';

const IcoSim = memo(() => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>);
IcoSim.displayName = 'IcoSim';

const IcoLock = memo(() => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
IcoLock.displayName = 'IcoLock';

const IcoCopy = memo(() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
IcoCopy.displayName = 'IcoCopy';

const IcoCheck = memo(() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
IcoCheck.displayName = 'IcoCheck';

const IcoFlash = memo(() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
IcoFlash.displayName = 'IcoFlash';

const IcoList = memo(() => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>);
IcoList.displayName = 'IcoList';

const EMPTY_CODE_HTML =
  '<span class="cmt">// Your code will appear here.\n// Add blocks on the canvas to get started.</span>';

/* ── ROW 1: Tab Bar ─────────────────────────────────────────────────── */
interface TabBarProps {
  activeTab: MainTab;
  hasEsp32: boolean;
  setTab: (t: MainTab) => void;
}
const TabBar = memo(function TabBar({ activeTab, hasEsp32, setTab }: TabBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(0,0,0,0.3)',
    }}>
      {/* Code tab */}
      <button
        type="button"
        onClick={() => setTab('code')}
        className={`cp-tab cp-tab-code ${activeTab === 'code' ? 'cp-tab-active' : ''}`}
      >
        <IcoCode />
        Code
      </button>

      {/* Serial tab */}
      <button
        type="button"
        onClick={() => setTab('serial')}
        className={`cp-tab cp-tab-serial ${activeTab === 'serial' ? 'cp-tab-active' : ''}`}
      >
        <IcoSerial />
        Serial
        {/* live pulse dot */}
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          marginLeft: 2, flexShrink: 0, display: 'inline-block',
          background: activeTab === 'serial' ? '#10b981' : '#1a3028',
          boxShadow: activeTab === 'serial' ? '0 0 5px rgba(16,185,129,0.8)' : 'none',
          animation: activeTab === 'serial' ? 'cp-pulse 2s ease-in-out infinite' : 'none',
          transition: 'all 0.3s',
        }} />
      </button>

      {/* Simulator tab */}
      <button
        type="button"
        onClick={() => setTab('simulator')}
        className={`cp-tab cp-tab-sim ${activeTab === 'simulator' ? 'cp-tab-active' : ''}`}
      >
        <IcoSim />
        Simulator
        {!hasEsp32 && (
          <span style={{ opacity: 0.4, display: 'inline-flex', marginLeft: 2 }} title="Requires kit activation">
            <IcoLock />
          </span>
        )}
      </button>

      {/* C++ badge — right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 14 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
          color: 'rgba(59,130,246,0.28)', textTransform: 'uppercase',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          C++
        </span>
      </div>
    </div>
  );
});

/* ── ROW 2: Toolbar ─────────────────────────────────────────────────── */
interface ToolbarProps {
  copied: boolean;
  focus: CodeFocus;
  onCopy: () => void;
  onFlash: () => void;
  onFocus: (f: CodeFocus) => void;
}
const Toolbar = memo(function Toolbar({ copied, focus, onCopy, onFlash, onFocus }: ToolbarProps) {
  const FOCUS_OPTIONS: { key: CodeFocus; label: string }[] = [
    { key: 'split', label: 'Split' },
    { key: 'code', label: 'Code' },
    { key: 'steps', label: 'Steps' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      /* generous padding so Flash is never clipped */
      padding: '7px 12px',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(0,0,0,0.18)',
      gap: 8,
      minWidth: 0,
    }}>

      {/* Left: Focus toggle group — pill container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 9,
        padding: '2px',
        gap: 1,
        flexShrink: 0,
      }}>
        {FOCUS_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onFocus(key)}
            className={`cp-focus ${focus === key
              ? 'cp-focus-on'
              : 'cp-focus-off'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: Copy + Flash */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onCopy}
          className={`cp-btn-copy ${copied ? 'cp-btn-copied' : ''}`}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <IcoCheck /> : <IcoCopy />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          type="button"
          onClick={onFlash}
          className="cp-btn-flash"
          aria-label="Flash to ESP32"
        >
          <IcoFlash />
          Flash
        </button>
      </div>
    </div>
  );
});

/* ── Code view ──────────────────────────────────────────────────────── */
const CodeView = memo(function CodeView({ codeHtml }: { codeHtml: string }) {
  return (
    <div
      className="cp-syntax cp-scroll"
      style={{
        flex: 1, overflowY: 'auto', overflowX: 'auto',
        background: '#080e17',
        padding: '16px 18px',
        minHeight: 0,
      }}
    >
      <pre
        style={{
          margin: 0,
          fontFamily: '"JetBrains Mono","Fira Code",monospace',
          fontSize: 12, lineHeight: 1.8,
          color: '#c9d1d9',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: codeHtml }}
      />
    </div>
  );
});

/* ── Steps view ─────────────────────────────────────────────────────── */
const StepsView = memo(function StepsView({ english }: { english: string[] }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Steps header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 14px 7px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(0,0,0,0.12)',
      }}>
        <span style={{ color: 'rgba(59,130,246,0.45)', display: 'flex' }}>
          <IcoList />
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(59,130,246,0.45)', textTransform: 'uppercase',
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
        }}>
          What your program does
        </span>
      </div>

      {/* Steps list */}
      <div className="cp-scroll" style={{ flex: 1, overflowY: 'auto', padding: '5px 8px 10px' }}>
        {english.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              fontSize: 12, color: 'rgba(240,244,255,0.14)',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              textAlign: 'center', margin: 0, lineHeight: 1.7,
            }}>
              Add blocks to see<br />a summary here.
            </p>
          </div>
        ) : (
          english.map((step, i) => (
            <div key={`${i}-${step}`} className="cp-step">
              <span className="cp-step-n">{i + 1}</span>
              <p style={{
                margin: 0, fontSize: 12,
                color: 'rgba(240,244,255,0.55)',
                lineHeight: 1.55,
                fontFamily: '"Space Grotesk", system-ui, sans-serif',
              }}>
                {step}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

/* ── Serial header ──────────────────────────────────────────────────── */
const SerialHeader = memo(function SerialHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 14px', flexShrink: 0,
      background: 'rgba(0,0,0,0.25)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
      }}>
        <IcoSerial />Serial Monitor
      </span>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#10b981',
        boxShadow: '0 0 6px rgba(16,185,129,0.8)',
        display: 'inline-block',
        animation: 'cp-pulse 2s ease-in-out infinite',
      }} />
    </div>
  );
});

/* ── Main ───────────────────────────────────────────────────────────── */
export default function CodePanel({ showLiveOutput = true }: CodePanelProps) {
  const router = useRouter();
  const blocks = useAppStore((s) => s.blocks) as Block[];
  const hasAccess = useActivityStore((s) => s.hasAccess);
  const hasEsp32 = useMemo(() => hasAccess('esp32'), [hasAccess]);

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('code');
  const [focus, setFocus] = useState<CodeFocus>('split');

  const { code, english } = useMemo(() => generateCode(blocks), [blocks]);
  const codeHtml = useMemo(
    () => (blocks.length === 0 ? EMPTY_CODE_HTML : code),
    [blocks.length, code],
  );

  const handleCopy = useCallback(async () => {
    const plain = codeHtml
      .replace(/<\/?span[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [codeHtml]);

  const handleFlash = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-flash-modal'));
  }, []);

  const handleSetTab = useCallback((t: MainTab) => {
    if (t === 'simulator' && !hasEsp32) { router.push('/redeem'); return; }
    setActiveTab(t);
  }, [hasEsp32, router]);

  const handleFocus = useCallback((f: CodeFocus) => setFocus(f), []);

  /* flex split ratios */
  const codeFlex = focus === 'code' ? '1 1 0' : focus === 'steps' ? '0 0 0' : '55 1 0';
  const stepsFlex = focus === 'steps' ? '1 1 0' : focus === 'code' ? '0 0 0' : '45 1 0';
  const showCode = focus !== 'steps';
  const showSteps = focus !== 'code';

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: CP_STYLES }} />

      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        overflow: 'hidden',
        minWidth: 0,
      }}>

        {/* ── ROW 1: Tabs ── */}
        <TabBar
          activeTab={activeTab}
          hasEsp32={hasEsp32}
          setTab={handleSetTab}
        />

        {/* ══ CODE TAB ══════════════════════════════════════════ */}
        {activeTab === 'code' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* ── ROW 2: Toolbar ── */}
            <Toolbar
              copied={copied}
              focus={focus}
              onCopy={handleCopy}
              onFlash={handleFlash}
              onFocus={handleFocus}
            />

            {/* Code area */}
            {showCode && (
              <div style={{ flex: codeFlex, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <CodeView codeHtml={codeHtml} />
              </div>
            )}

            {/* Divider between code and steps */}
            {focus === 'split' && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
            )}

            {/* Steps area */}
            {showSteps && (
              <div style={{ flex: stepsFlex, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <StepsView english={english} />
              </div>
            )}
          </div>
        )}

        {/* ══ SERIAL TAB ══════════════════════════════════════════ */}
        {activeTab === 'serial' && showLiveOutput && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <SerialHeader />
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <LiveOutput />
            </div>
          </div>
        )}

        {/* ══ SIMULATOR TAB ════════════════════════════════════════ */}
        {activeTab === 'simulator' && (
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <LiveSimulator />
          </div>
        )}

      </div>
    </>
  );
}