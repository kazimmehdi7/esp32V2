'use client';

import React, { useMemo } from 'react';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { runLoop, stopSimulation } from '@/lib/simulatorEngine';
import { useAppStore } from '@/store/useAppStore';
import HardwareBoard from '@/components/HardwareBoard';
import { deriveHardwareLayout } from '@/lib/hardwareParser';

/* ── Design tokens (match playground page exactly) ── */
const BG     = '#04080f';
const PANEL  = '#0a1422';
const CARD   = '#0d1a2e';
const LINE   = 'rgba(255,255,255,0.07)';
const TEXT   = '#eaf0fa';
const MUTED  = 'rgba(234,240,250,0.5)';
const FAINT  = 'rgba(234,240,250,0.2)';
const GREEN  = '#10b981';
const RED    = '#ef4444';
const BLUE   = '#3b82f6';
const MONO   = '"JetBrains Mono", monospace';
const SANS   = '"Space Grotesk", system-ui, sans-serif';

/* ── Icons (inline, no extra deps) ── */
function IcoPlay() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IcoStop() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

/* ── Serial line row ── */
const SerialLine = React.memo(function SerialLine({ line, index }: { line: string; index: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      minHeight: '1.4em',
      padding: '1px 0',
    }}>
      <span style={{
        fontFamily: MONO,
        fontSize: 9,
        color: FAINT,
        minWidth: 28,
        textAlign: 'right',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span style={{
        fontFamily: MONO,
        fontSize: 11,
        color: line ? '#a5d6ff' : FAINT,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        lineHeight: 1.6,
      }}>
        {line || '\u00A0'}
      </span>
    </div>
  );
});

export default function LiveSimulator() {
  const { serial, isRunning } = useSimulatorStore();
  const blocks = useAppStore((s) => s.blocks);

  const handleRunToggle = React.useCallback(() => {
    if (isRunning) stopSimulation();
    else runLoop(blocks);
  }, [isRunning, blocks]);

  const peripherals = useMemo(() => deriveHardwareLayout(blocks), [blocks]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [serial]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: BG,
      overflow: 'hidden',
      fontFamily: SANS,
    }}>

      {/* ── Control bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        height: 42,
        flexShrink: 0,
        background: PANEL,
        borderBottom: `1px solid ${LINE}`,
      }}>
        {/* Left: label + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: MUTED,
            fontFamily: MONO,
          }}>
            Simulator
          </span>
          {/* Status pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: MONO,
            background: isRunning ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isRunning ? 'rgba(16,185,129,0.3)' : LINE}`,
            color: isRunning ? GREEN : FAINT,
            transition: 'all 0.2s',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isRunning ? GREEN : FAINT,
              boxShadow: isRunning ? `0 0 6px ${GREEN}` : 'none',
              animation: isRunning ? 'sim-pulse 1.6s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>

        {/* Right: run/stop button */}
        <button
          onClick={handleRunToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 14px',
            height: 28,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: SANS,
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.01em',
            ...(isRunning
              ? {
                  background: 'rgba(239,68,68,0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.3)',
                }
              : {
                  background: 'rgba(16,185,129,0.15)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: `0 0 14px rgba(16,185,129,0.15)`,
                }),
          }}
        >
          {isRunning ? <IcoStop /> : <IcoPlay />}
          {isRunning ? 'Stop' : 'Run'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: 12,
        overflow: 'hidden',
      }}>

        {/* Hardware board */}
        <div style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${LINE}`,
          background: CARD,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Board header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 14px',
            borderBottom: `1px solid ${LINE}`,
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(59,130,246,0.5)',
              fontFamily: MONO,
            }}>
              Interactive Hardware
            </span>
            {peripherals.length > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: MONO,
                background: 'rgba(59,130,246,0.1)',
                color: 'rgba(147,197,253,0.7)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                {peripherals.length} component{peripherals.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Board canvas */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <HardwareBoard peripherals={peripherals} />
          </div>
        </div>

        {/* Serial monitor */}
        <div style={{
          height: 160,
          flexShrink: 0,
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${LINE}`,
          background: '#060c14',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Serial header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(52,211,153,0.7)',
              fontFamily: MONO,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: serial.length > 0 ? GREEN : FAINT,
                boxShadow: serial.length > 0 ? `0 0 5px ${GREEN}` : 'none',
                animation: isRunning ? 'sim-pulse 1.6s ease-in-out infinite' : 'none',
              }} />
              Serial Monitor
            </span>
            {serial.length > 0 && (
              <span style={{
                fontFamily: MONO,
                fontSize: 9,
                color: FAINT,
              }}>
                {serial.length} {serial.length === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>

          {/* Serial output */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 12px',
              scrollbarWidth: 'thin',
            }}
          >
            {serial.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: FAINT,
                  fontStyle: 'italic',
                }}>
                  Waiting for output…
                </span>
              </div>
            ) : (
              serial.map((line, i) => (
                <SerialLine key={i} line={line} index={i} />
              ))
            )}
          </div>
        </div>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes sim-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>
    </div>
  );
}