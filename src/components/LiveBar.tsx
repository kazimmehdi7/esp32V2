'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { DeviceStatus } from '@/types';

/* ════════════════════════════════════════════════════════════════════════
   LIVEBAR — Loop/Run/Save/Flash grouped on the right side.
   Constant colors always visible. Glow activates when enabled/active.
   ════════════════════════════════════════════════════════════════════════ */

const PANEL = '#0a1422';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#eaf0fa';
const FAINT = 'rgba(234,240,250,0.3)';
const BLUE = '#3b82f6';
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const RED = '#ef4444';
const VIOLET = '#8b5cf6';

/* ── Icons ── */
const Icons = {
  device: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width={13} height={13}>
      <path d="M6 4.75a.75.75 0 0 1 1.14-.643l11.5 7.25a.75.75 0 0 1 0 1.286l-11.5 7.25A.75.75 0 0 1 6 19.25z" />
    </svg>
  ),
  save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  loop: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  connect: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  disconnect: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  flash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width={10} height={10}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

/* ── Status config ── */
type StatusConfig = { dot: string; pulse: boolean; label: string; bg: string; color: string; };
const STATUS_MAP: Record<DeviceStatus, StatusConfig> = {
  idle: { dot: FAINT, pulse: false, label: 'Not connected', bg: 'rgba(255,255,255,0.06)', color: FAINT },
  connecting: { dot: AMBER, pulse: true, label: 'Connecting…', bg: 'rgba(245,158,11,0.14)', color: '#fbbf24' },
  online: { dot: GREEN, pulse: true, label: 'Online', bg: 'rgba(16,185,129,0.14)', color: '#34d399' },
  offline: { dot: RED, pulse: false, label: 'Offline', bg: 'rgba(239,68,68,0.14)', color: '#fca5a5' },
};

interface LiveBarProps {
  onConnect: () => void;
  onDisconnect: () => void;
  onRun: () => void;
  onSave: () => void;
  onClearSaved: () => void;
  hasBlocks: boolean;
}

export default function LiveBar({
  onConnect, onDisconnect, onRun, onSave, onClearSaved, hasBlocks,
}: LiveBarProps) {
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const deviceStatus = useAppStore((s) => s.deviceStatus);
  const loopMode = useAppStore((s) => s.loopMode);
  const savedProgramExists = useAppStore((s) => s.savedProgramExists);
  const savedProgramLoop = useAppStore((s) => s.savedProgramLoop);
  const setActiveDeviceId = useAppStore((s) => s.setActiveDeviceId);
  const setLoopMode = useAppStore((s) => s.setLoopMode);

  const status = STATUS_MAP[deviceStatus];
  const isOnline = deviceStatus === 'online';
  const isConnecting = deviceStatus === 'connecting';
  const canAct = isOnline && hasBlocks;

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes lb-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes lb-glow-green  { 0%,100%{box-shadow:0 0 8px 1px rgba(16,185,129,0.5)}  50%{box-shadow:0 0 18px 4px rgba(16,185,129,0.85)} }
        @keyframes lb-glow-violet { 0%,100%{box-shadow:0 0 8px 1px rgba(139,92,246,0.5)}  50%{box-shadow:0 0 18px 4px rgba(139,92,246,0.85)} }
        @keyframes lb-glow-blue   { 0%,100%{box-shadow:0 0 8px 1px rgba(59,130,246,0.5)}  50%{box-shadow:0 0 18px 4px rgba(59,130,246,0.85)} }
        @keyframes lb-glow-amber  { 0%,100%{box-shadow:0 0 8px 1px rgba(245,158,11,0.5)}  50%{box-shadow:0 0 18px 4px rgba(245,158,11,0.85)} }
        .lb-pulse { animation: lb-pulse 1.6s ease-in-out infinite; }

        /* ── Tooltip ── */
        .lb-tip { position:relative; flex-shrink:0; }
        .lb-tip::after {
          content:attr(data-tip); position:absolute; bottom:calc(100% + 10px); left:50%;
          transform:translateX(-50%) scale(0.88);
          background:#0f1c30; color:#eaf0fa; border:1px solid rgba(255,255,255,0.12);
          border-radius:7px; padding:5px 10px; font-size:11px; font-weight:600;
          font-family:"Inter",sans-serif; white-space:nowrap; pointer-events:none;
          opacity:0; transition:opacity .15s,transform .15s;
          box-shadow:0 8px 24px rgba(0,0,0,0.5); z-index:100;
        }
        .lb-tip:hover::after { opacity:1; transform:translateX(-50%) scale(1); }

        /* ── Base button ── */
        .lb-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          height:34px; padding:0 14px; border-radius:9px; border:none; cursor:pointer;
          font-size:12px; font-weight:700; font-family:"Inter",sans-serif;
          white-space:nowrap; flex-shrink:0; letter-spacing:0.01em;
          transition:filter .15s, transform .15s, opacity .15s;
          position:relative; overflow:hidden;
        }
        .lb-btn:active:not(:disabled) { transform:scale(0.95) !important; }
        .lb-btn:disabled { opacity:0.38; cursor:not-allowed; filter:none !important; transform:none !important; animation:none !important; }

        /* ── Connect (blue) ── */
        .lb-connect {
          background:linear-gradient(135deg,#1a3a8a,#2563eb);
          color:#fff;
          box-shadow:0 3px 12px -3px rgba(37,99,235,0.65), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .lb-connect:hover { filter:brightness(1.15); transform:translateY(-1px); }

        /* ── Disconnect (red) ── */
        .lb-disconnect {
          background:linear-gradient(135deg,#7f1d1d,#dc2626);
          color:#fff;
          box-shadow:0 3px 12px -3px rgba(220,38,38,0.6), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .lb-disconnect:hover { filter:brightness(1.1); transform:translateY(-1px); }

        /* ── Connecting (muted) ── */
        .lb-connecting {
          background:rgba(255,255,255,0.07); color:rgba(234,240,250,0.35); cursor:not-allowed;
          border:1px solid rgba(255,255,255,0.08);
        }

        /* ── Loop — always violet, glow when ON ── */
        .lb-loop {
          background:linear-gradient(135deg,#4c1d95,${VIOLET});
          color:#fff;
          box-shadow:0 3px 12px -3px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .lb-loop:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .lb-loop-active { animation:lb-glow-violet 2s ease-in-out infinite; }

        /* ── Run — always green, glow when enabled ── */
        .lb-run {
          background:linear-gradient(135deg,#064e3b,${GREEN});
          color:#fff;
          box-shadow:0 3px 12px -3px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .lb-run:not(:disabled):hover { filter:brightness(1.12); transform:translateY(-1px); }
        .lb-run-active { animation:lb-glow-green 2s ease-in-out infinite; }

        /* ── Save — always blue, glow when enabled ── */
        .lb-save {
          background:linear-gradient(135deg,#1e3a8a,${BLUE});
          color:#fff;
          box-shadow:0 3px 12px -3px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .lb-save:not(:disabled):hover { filter:brightness(1.12); transform:translateY(-1px); }
        .lb-save-active { animation:lb-glow-blue 2s ease-in-out infinite; }

        /* ── Flash — always amber ── */
        .lb-flash {
         background:linear-gradient(135deg,#92400e,${AMBER});
         color:#1a0f00;
         box-shadow:0 3px 14px -3px rgba(99, 93, 83, 0.55), inset 0 1px 0 rgba(255,255,255,0.2);
         font-weight:800;
         animation:lb-glow-amber 2.4s ease-in-out infinite;
         font-family:"Inter",system-ui,sans-serif;
         letter-spacing:0.01em;
}
        .lb-flash:hover { filter:brightness(1.12); transform:translateY(-1px); }

        /* ── Input ── */
        .lb-input {
          font-family:"JetBrains Mono",monospace; font-size:11px; font-weight:500;
          background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1);
          border-radius:9px; padding:0 12px; height:34px; color:#eaf0fa;
          width:148px; outline:none; transition:border-color .2s, box-shadow .2s; flex-shrink:0;
        }
        .lb-input::placeholder { color:rgba(234,240,250,0.28); }
        .lb-input:focus { border-color:rgba(59,130,246,0.55); box-shadow:0 0 0 3px rgba(59,130,246,0.12); }

        /* ── Divider ── */
        .lb-div { width:1px; height:20px; background:rgba(255,255,255,0.1); flex-shrink:0; }

        /* ── Status badge ── */
        .lb-status {
          display:inline-flex; align-items:center; gap:6px;
          border-radius:99px; padding:0 11px; height:28px;
          font-size:10px; font-weight:700;
          font-family:"JetBrains Mono",monospace; flex-shrink:0; letter-spacing:0.04em;
        }

        /* ── Saved chip ── */
        .lb-saved-clear { background:none; border:none; cursor:pointer; display:flex; align-items:center; padding:0; }
        .lb-saved-clear:hover svg { stroke:#fca5a5; }
      `}</style>

      <div style={{
        width: '100%', background: PANEL,
        borderBottom: `1px solid ${LINE}`,
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden',
      }}>

        {/* ══ LEFT: Device + Connect + Status ══ */}
        <span style={{
          fontSize: 9, fontWeight: 700, color: FAINT,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          fontFamily: '"JetBrains Mono",monospace', flexShrink: 0,
        }}>
          Device
        </span>

        <input
          type="text"
          placeholder="esp32_XXXXXXXX"
          className="lb-input"
          value={activeDeviceId ?? ''}
          onChange={(e) => setActiveDeviceId(e.target.value || null)}
        />

        <div className="lb-tip" data-tip={isConnecting ? 'Connecting…' : isOnline ? 'Disconnect' : 'Connect to ESP32'}>
          <button
            type="button"
            disabled={isConnecting}
            onClick={isOnline ? onDisconnect : onConnect}
            className={`lb-btn ${isConnecting ? 'lb-connecting' : isOnline ? 'lb-disconnect' : 'lb-connect'}`}
          >
            {isOnline ? <Icons.disconnect /> : <Icons.connect />}
            {isConnecting ? 'Connecting…' : isOnline ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        {/* Status pill */}
        <div className="lb-status" style={{ background: status.bg, color: status.color }}>
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }}
            className={status.pulse ? 'lb-pulse' : ''}
          />
          {status.label}
        </div>

        {/* ══ SPACER — pushes right group to far right ══ */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* ══ RIGHT GROUP: Loop + Run + Save + divider + Flash ══ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>

          {/* Saved chip — shown inline in right group if exists */}
          {savedProgramExists && (
            <>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.28)',
                borderRadius: 99, padding: '0 10px 0 12px', height: 28,
                fontSize: 10, fontWeight: 700, color: '#c4b5fd',
                fontFamily: '"JetBrains Mono",monospace', flexShrink: 0,
              }}>
                <Icons.flash />
                <span>Saved{savedProgramLoop ? ' · Loop' : ''}</span>
                <button
                  type="button"
                  onClick={onClearSaved}
                  className="lb-saved-clear"
                  aria-label="Clear saved program"
                  style={{ marginLeft: 2, color: 'rgba(196,181,253,0.5)' }}
                >
                  <Icons.close />
                </button>
              </div>
              <div className="lb-div" />
            </>
          )}

          {/* Loop */}
          <div className="lb-tip" data-tip={loopMode ? 'Loop ON — click to disable' : 'Loop OFF — click to enable'}>
            <button
              type="button"
              onClick={() => setLoopMode(!loopMode)}
              className={`lb-btn lb-loop ${loopMode ? 'lb-loop-active' : ''}`}
            >
              <Icons.loop />
              Loop
              {loopMode && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)', flexShrink: 0,
                }} className="lb-pulse" />
              )}
            </button>
          </div>

          {/* Run */}
          <div className="lb-tip" data-tip={canAct ? 'Run program on device' : 'Connect device + add blocks first'}>
            <button
              type="button"
              onClick={onRun}
              disabled={!canAct}
              className={`lb-btn lb-run ${canAct ? 'lb-run-active' : ''}`}
            >
              <Icons.play />
              Run
            </button>
          </div>

          {/* Save */}
          <div className="lb-tip" data-tip={canAct ? 'Save program to device' : 'Connect device + add blocks first'}>
            <button
              type="button"
              onClick={onSave}
              disabled={!canAct}
              className={`lb-btn lb-save ${canAct ? 'lb-save-active' : ''}`}
            >
              <Icons.save />
              Save
            </button>
          </div>

          {/* Divider before Flash */}
          <div className="lb-div" />

          {/* Flash — primary CTA, always glowing */}
          <div className="lb-tip" data-tip="Flash compiled code to ESP32">
            <button
              type="button"
              className="lb-btn lb-flash"
              onClick={() => window.dispatchEvent(new Event('open-flash-modal'))}
            >
              <Icons.flash />
              Flash to ESP32
            </button>
          </div>
        </div>

      </div>
    </>
  );
}