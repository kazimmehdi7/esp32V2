'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useMQTT } from '@/hooks/useMQTT';
import { blocksToCommands, validateBlocks } from '@/lib/utils';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import CodePanel from '@/components/CodePanel';
import LiveBar from '@/components/LiveBar';
import FlashModal from '@/components/FlashModal';
import AIAssistant from '@/components/AIAssistant';
import TemplatesModal from '@/components/TemplatesModal';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG       = '#04080f';
const PANEL    = '#0a1422';
const CARD     = '#0f1c30';
const LINE     = 'rgba(255,255,255,0.08)';
const TEXT     = '#eaf0fa';
const MUTED    = 'rgba(234,240,250,0.55)';
const FAINT    = 'rgba(234,240,250,0.35)';
const BLUE     = '#3b82f6';
const BLUE_LT  = '#93c5fd';
const AMBER    = '#f59e0b';
const GREEN    = '#10b981';
const GREEN_LT = '#34d399';
const VIOLET   = '#8b5cf6';

const RIGHT_MIN = 260;
const RIGHT_MAX = 560;
const RIGHT_DEF = 400;

// ─── Circuit-trace background ─────────────────────────────────────────────────
function CircuitBg() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          maskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.4) 55%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg,black 0%,rgba(0,0,0,0.4) 55%,transparent 100%)',
        }}>
        <defs>
          <pattern id="pg-circuit" width="200" height="200" patternUnits="userSpaceOnUse">
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
            <g fill="#3b82f6">
              {([
                [10,30],[80,0],[0,90],[62,150],[150,40],[200,134],
                [30,200],[110,140],[120,0],[192,120],[70,200],[150,110],
                [0,150],[160,200],[200,167],
              ] as [number,number][]).map(([x,y],i) => (
                <g key={i} style={{ animation: `pg-pad ${5+(i%5)}s ease-in-out ${i*0.4}s infinite` }}>
                  <circle cx={x} cy={y} r="3.4" fillOpacity="0.22" />
                  <circle cx={x} cy={y} r="1.5"  fillOpacity="0.5"  />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#pg-circuit)" />
      </svg>
    </div>
  );
}

// ─── Drag-to-resize hook ──────────────────────────────────────────────────────
function useRightPanelResize(defaultWidth = RIGHT_DEF) {
  const [width, setWidth]         = useState(defaultWidth);
  const [dragging, setDragging]   = useState(false);
  const startX  = useRef(0);
  const startW  = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    setDragging(true);
  }, [width]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      // handle is on the LEFT edge of the right panel:
      // moving mouse LEFT → panel grows, moving RIGHT → panel shrinks
      const delta = startX.current - e.clientX;
      setWidth(Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, startW.current + delta)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [dragging]);

  return { width, dragging, onMouseDown };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const blocks            = useAppStore((s) => s.blocks);
  const activeDeviceId    = useAppStore((s) => s.activeDeviceId);
  const loopMode          = useAppStore((s) => s.loopMode);
  const setActiveDeviceId = useAppStore((s) => s.setActiveDeviceId);

  const [flashModalOpen, setFlashModalOpen] = React.useState(false);
  const [templatesOpen,  setTemplatesOpen]  = React.useState(false);

  const { connect, disconnect, runProgram, saveProgram, clearSavedProgram } = useMQTT();
  const { width: rightW, dragging: rightDragging, onMouseDown: onRightDragStart } = useRightPanelResize();

  const handleConnect = useCallback(() => {
    if (!activeDeviceId) return;
    connect(activeDeviceId);
  }, [activeDeviceId, connect]);

  const handleRun = useCallback(() => {
    const errors = validateBlocks(blocks);
    if (errors.size > 0) { alert('Fix block errors before running'); return; }
    const commands = blocksToCommands(blocks);
    if (!commands.length) { alert('No executable commands found'); return; }
    runProgram(commands);
  }, [blocks, runProgram]);

  const handleSave = useCallback(() => {
    const errors = validateBlocks(blocks);
    if (errors.size > 0) { alert('Fix block errors before saving'); return; }
    const commands = blocksToCommands(blocks);
    if (!commands.length) { alert('No executable commands found'); return; }
    saveProgram(commands, loopMode);
  }, [blocks, loopMode, saveProgram]);

  const handleDeviceLinked = useCallback((deviceId: string) => {
    setActiveDeviceId(deviceId);
    connect(deviceId);
  }, [setActiveDeviceId, connect]);

  useEffect(() => {
    const openFlash     = () => setFlashModalOpen(true);
    const openTemplates = () => setTemplatesOpen(true);
    window.addEventListener('open-flash-modal', openFlash);
    window.addEventListener('open-templates',   openTemplates);
    return () => {
      window.removeEventListener('open-flash-modal', openFlash);
      window.removeEventListener('open-templates',   openTemplates);
    };
  }, []);

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: clip; }
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 99px; }

        @keyframes pg-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes pg-pad   { 0%,100%{opacity:.25} 50%{opacity:.9} }

        .pg-root, .pg-root * { font-family: "Inter", system-ui, sans-serif; color: ${TEXT}; }
        .pg-root h1,.pg-root h2,.pg-root h3,.pg-root h4,.pg-root h5,.pg-root h6 { font-family: "Space Grotesk", sans-serif; }
        .pg-root code,.pg-root pre,.pg-root [class*="mono"],.pg-root [class*="code"] { font-family: "JetBrains Mono", monospace; }

        .pg-root {
          --pg-bg:${BG}; --pg-panel:${PANEL}; --pg-card:${CARD};
          --pg-line:${LINE}; --pg-text:${TEXT}; --pg-muted:${MUTED}; --pg-faint:${FAINT};
          --pg-blue:${BLUE}; --pg-blue-lt:${BLUE_LT}; --pg-amber:${AMBER};
          --pg-green:${GREEN}; --pg-green-lt:${GREEN_LT}; --pg-violet:${VIOLET};
        }

        .pg-shell { display:flex; flex-direction:column; height:100vh; overflow:hidden; background:${BG}; position:relative; }
        .pg-header-zone { position:relative; z-index:20; flex-shrink:0; background:${BG}; border-bottom:1px solid ${LINE}; }
        .pg-accent-line { height:3px; width:100%; background:linear-gradient(90deg,${BLUE},${VIOLET} 45%,${AMBER}); flex-shrink:0; }
        .pg-livebar-zone { position:relative; z-index:20; flex-shrink:0; background:${PANEL}; border-bottom:1px solid ${LINE}; box-shadow:0 1px 0 0 rgba(59,130,246,0.1); }
        .pg-workspace { position:relative; z-index:10; flex:1; min-height:0; display:flex; overflow:hidden; }

        .pg-pane-left { flex-shrink:0; width:220px; border-right:1px solid ${LINE}; background:${PANEL}; overflow-y:auto; overflow-x:hidden; }
        .pg-pane-center { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; background:${BG}; box-shadow:inset 0 4px 24px rgba(0,0,0,0.4); }

        /* drag handle for right panel */
        .pg-resize-handle {
          width: 5px; flex-shrink: 0; cursor: col-resize;
          background: transparent; position: relative;
          transition: background 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .pg-resize-handle::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 1px; height: 40px;
          background: rgba(59,130,246,0.2);
          border-radius: 99px;
          transition: background 0.15s, height 0.15s;
        }
        .pg-resize-handle:hover::after,
        .pg-resize-handle.dragging::after {
          background: rgba(59,130,246,0.6);
          height: 60px;
        }
        .pg-resize-handle:hover,
        .pg-resize-handle.dragging {
          background: rgba(59,130,246,0.05);
        }

        @media (max-width: 900px) { .pg-pane-left { width: 56px; } .pg-pane-right { display: none; } }
        @media (max-width: 600px) { .pg-pane-left { display: none; } .pg-pane-right { display: none; } }

        .pg-modal-layer { position:relative; z-index:50; }
        .pg-card { background:${CARD}; border:1px solid ${LINE}; border-radius:14px; padding:16px; transition:border-color .25s,box-shadow .25s; }
        .pg-card:hover { border-color:rgba(255,255,255,0.14); box-shadow:0 8px 28px -16px rgba(0,0,0,0.7); }
        .pg-btn { display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;cursor:pointer;font-family:"Inter",sans-serif;font-weight:700;transition:transform .2s,box-shadow .2s,opacity .15s;border-radius:10px;padding:9px 18px;font-size:13px; }
        .pg-btn:active { transform:scale(0.97); }
        .pg-btn-primary { background:linear-gradient(135deg,#1a3a8a,${BLUE}); color:#fff; box-shadow:0 6px 20px -8px rgba(37,99,235,0.6); }
        .pg-btn-primary:hover { box-shadow:0 10px 28px -8px rgba(37,99,235,0.8); transform:translateY(-2px); }
        .pg-btn-ghost { background:rgba(255,255,255,0.04); color:${MUTED}; border:1px solid ${LINE}; }
        .pg-btn-ghost:hover { background:rgba(255,255,255,0.08); color:${TEXT}; border-color:rgba(255,255,255,0.2); }
        .pg-btn-success { background:linear-gradient(135deg,#065f46,${GREEN}); color:#fff; box-shadow:0 6px 20px -8px rgba(16,185,129,0.5); }
        .pg-btn-success:hover { box-shadow:0 10px 28px -8px rgba(16,185,129,0.7); transform:translateY(-2px); }
        .pg-btn-amber { background:linear-gradient(135deg,#92400e,${AMBER}); color:#fff; box-shadow:0 6px 20px -8px rgba(245,158,11,0.5); }
        .pg-btn-amber:hover { box-shadow:0 10px 28px -8px rgba(245,158,11,0.7); transform:translateY(-2px); }
        .pg-btn-danger { background:rgba(239,68,68,0.14); color:#fca5a5; border:1px solid rgba(239,68,68,0.25); }
        .pg-btn-danger:hover { background:rgba(239,68,68,0.22); border-color:rgba(239,68,68,0.4); }
        .pg-badge { display:inline-flex;align-items:center;gap:5px;border-radius:99px;padding:4px 10px;font-size:10px;font-weight:700;font-family:"JetBrains Mono",monospace;letter-spacing:0.06em; }
        .pg-badge-green { background:rgba(16,185,129,0.14); color:${GREEN_LT}; }
        .pg-badge-amber { background:rgba(245,158,11,0.14); color:#fbbf24; }
        .pg-badge-blue  { background:rgba(59,130,246,0.14); color:${BLUE_LT}; }
        .pg-badge-muted { background:rgba(255,255,255,0.06); color:${FAINT}; }
        .pg-dot-live { width:6px;height:6px;border-radius:50%;background:${GREEN};animation:pg-pulse 1.6s ease-in-out infinite; }
        .pg-dot-idle { width:6px;height:6px;border-radius:50%;background:${FAINT}; }
        .pg-mono { font-family:"JetBrains Mono",monospace;font-size:11px;line-height:1.7;color:${GREEN_LT}; }
        .pg-mono-dim { color:${FAINT}; }
        .pg-panel-label { font-family:"JetBrains Mono",monospace;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${FAINT}; }
        .pg-divider { height:1px;background:${LINE};margin:12px 0; }
        .pg-selected { border-left:3px solid ${BLUE} !important; background:rgba(59,130,246,0.06) !important; }
      `}</style>

      <div className="pg-shell pg-root" style={{ userSelect: rightDragging ? 'none' : 'auto' }}>
        <CircuitBg />

        <div className="pg-header-zone"><Header /></div>
        <div className="pg-accent-line" />
        <div className="pg-livebar-zone">
          <LiveBar
            onConnect={handleConnect}
            onDisconnect={disconnect}
            onRun={handleRun}
            onSave={handleSave}
            onClearSaved={clearSavedProgram}
            hasBlocks={blocks.length > 0}
          />
        </div>

        <div className="pg-workspace">
          {/* LEFT */}
          <div className="pg-pane-left">
            <Sidebar />
          </div>

          {/* CENTER */}
          <div className="pg-pane-center">
            <Canvas />
          </div>

          {/* DRAG HANDLE — sits between center and right panel */}
          <div
            className={`pg-resize-handle${rightDragging ? ' dragging' : ''}`}
            onMouseDown={onRightDragStart}
            title="Drag to resize"
          />

          {/* RIGHT — width controlled by drag state */}
          <div
            className="pg-pane-right"
            style={{
              flexShrink: 0,
              width: rightW,
              borderLeft: `1px solid ${LINE}`,
              background: PANEL,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <CodePanel />
          </div>
        </div>

        <div className="pg-modal-layer">
          <FlashModal isOpen={flashModalOpen} onClose={() => setFlashModalOpen(false)} onDeviceLinked={handleDeviceLinked} />
          <TemplatesModal isOpen={templatesOpen} onClose={() => setTemplatesOpen(false)} />
        </div>

        <AIAssistant />
      </div>
    </>
  );
}