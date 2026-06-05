'use client';

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'esp-web-install-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>, HTMLElement
      > & { manifest?: string; };
    }
  }
}

const BG    = '#04080f';
const PANEL = '#0a1422';
const CARD  = '#0d1a2e';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#eaf0fa';
const MUTED = 'rgba(234,240,250,0.5)';
const FAINT = 'rgba(234,240,250,0.18)';
const BLUE  = '#3b82f6';
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const SANS  = '"Space Grotesk",system-ui,sans-serif';
const INTER = '"Inter",system-ui,sans-serif';
const MONO  = '"JetBrains Mono",monospace';

/* ── Icons ── */
const IcoFlash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
  </svg>
);
const IcoLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IcoClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

interface FlashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceLinked: (deviceId: string) => void;
}

export default function FlashModal({ isOpen, onClose, onDeviceLinked }: FlashModalProps) {
  const [step,          setStep]          = React.useState<1 | 2>(1);
  const [deviceIdInput, setDeviceIdInput] = React.useState('');
  const [errorMessage,  setErrorMessage]  = React.useState('');

  const handleLink = () => {
    const trimmed = deviceIdInput.trim();
    if (!trimmed.startsWith('esp32_')) {
      setErrorMessage('Device ID must start with esp32_');
      return;
    }
    setErrorMessage('');
    onDeviceLinked(trimmed);
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setDeviceIdInput('');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes fm-in {
          from { opacity:0; transform:scale(0.95) translateY(12px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes fm-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

        .fm-close {
          width:30px; height:30px; border-radius:8px;
          border:1px solid ${LINE}; background:rgba(255,255,255,0.04);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:${MUTED}; transition:all .15s; flex-shrink:0;
        }
        .fm-close:hover { background:rgba(239,68,68,0.12); color:#fca5a5; border-color:rgba(239,68,68,0.2); }

        .fm-btn-blue {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          width:100%; height:42px; border-radius:11px; border:none; cursor:pointer;
          font-size:13.5px; font-weight:700; font-family:${SANS}; letter-spacing:0.01em;
          background:linear-gradient(135deg,#1a3a8a,${BLUE}); color:#fff;
          box-shadow:0 4px 16px -4px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
          transition:filter .15s,transform .15s;
        }
        .fm-btn-blue:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .fm-btn-blue:active { transform:scale(0.97); }

        .fm-btn-amber {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          height:42px; padding:0 22px; border-radius:11px; border:none; cursor:pointer;
          font-size:13px; font-weight:700; font-family:${SANS}; letter-spacing:0.01em;
          background:linear-gradient(135deg,#92400e,${AMBER}); color:#1a0f00;
          box-shadow:0 4px 14px -4px rgba(245,158,11,0.55), inset 0 1px 0 rgba(255,255,255,0.2);
          transition:filter .15s,transform .15s; flex-shrink:0; white-space:nowrap;
        }
        .fm-btn-amber:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .fm-btn-amber:active { transform:scale(0.97); }

        .fm-btn-ghost {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          width:100%; height:42px; border-radius:11px; cursor:pointer;
          font-size:13px; font-weight:600; font-family:${SANS};
          background:transparent; border:1px solid rgba(255,255,255,0.1); color:${MUTED};
          transition:all .15s;
        }
        .fm-btn-ghost:hover { background:rgba(255,255,255,0.05); color:${TEXT}; border-color:rgba(255,255,255,0.18); }
        .fm-btn-ghost:active { transform:scale(0.97); }

        .fm-input {
          flex:1; height:42px; border-radius:11px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(0,0,0,0.35); padding:0 14px;
          font-family:${MONO}; font-size:12px; font-weight:500; color:${TEXT};
          outline:none; transition:border-color .2s,box-shadow .2s;
          min-width:0;
        }
        .fm-input::placeholder { color:${FAINT}; }
        .fm-input:focus { border-color:rgba(245,158,11,0.5); box-shadow:0 0 0 3px rgba(245,158,11,0.1); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position:'fixed', inset:0, zIndex:50,
          background:'rgba(0,0,0,0.75)',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'0 16px',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:'100%', maxWidth:430,
            borderRadius:22,
            background:PANEL,
            border:`1px solid ${LINE}`,
            boxShadow:'0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(59,130,246,0.06)',
            overflow:'hidden',
            animation:'fm-in 0.22s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* ── Top accent bar ── */}
          <div style={{
            height:3,
            background:`linear-gradient(90deg,${BLUE},#8b5cf6 50%,${AMBER})`,
          }}/>

          {/* ── Header ── */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'18px 20px 16px',
            borderBottom:`1px solid ${LINE}`,
          }}>
            {/* Icon */}
            <span style={{
              width:40, height:40, borderRadius:12, flexShrink:0,
              background:`linear-gradient(135deg,#92400e,${AMBER})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#1a0f00',
              boxShadow:`0 4px 14px rgba(245,158,11,0.4)`,
            }}>
              <IcoFlash/>
            </span>
            <div style={{flex:1}}>
              <h2 style={{
                margin:0, fontSize:16, fontWeight:700,
                color:TEXT, fontFamily:SANS, lineHeight:1.2,
              }}>
                Setup Your ESP32
              </h2>
              <p style={{
                margin:'3px 0 0', fontSize:11, color:MUTED,
                fontFamily:INTER, lineHeight:1.3,
              }}>
                Flash firmware once, control over WiFi forever
              </p>
            </div>
            <button type="button" onClick={handleClose} className="fm-close" aria-label="Close">
              <IcoClose/>
            </button>
          </div>

          {/* ── Step indicator ── */}
          <div style={{
            display:'flex', alignItems:'center', gap:0,
            padding:'14px 20px',
            borderBottom:`1px solid ${LINE}`,
            background:'rgba(0,0,0,0.2)',
          }}>
            {/* Step 1 */}
            <div style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
              <span style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, fontFamily:MONO,
                background: step === 1
                  ? `linear-gradient(135deg,#1a3a8a,${BLUE})`
                  : step > 1 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                color: step === 1 ? '#fff' : step > 1 ? GREEN : FAINT,
                border: step > 1 ? `1px solid rgba(16,185,129,0.3)` : 'none',
                boxShadow: step === 1 ? `0 3px 10px rgba(37,99,235,0.5)` : 'none',
              }}>
                {step > 1 ? <IcoCheck/> : '1'}
              </span>
              <span style={{
                fontSize:12, fontWeight:700, fontFamily:SANS,
                color: step === 1 ? TEXT : step > 1 ? '#34d399' : FAINT,
              }}>
                Install Firmware
              </span>
            </div>

            {/* Connector */}
            <div style={{
              flex:1, height:1.5, borderRadius:2, margin:'0 8px',
              background: step > 1
                ? `linear-gradient(90deg,rgba(16,185,129,0.5),rgba(245,158,11,0.4))`
                : 'rgba(255,255,255,0.08)',
              transition:'background 0.4s',
            }}/>

            {/* Step 2 */}
            <div style={{display:'flex', alignItems:'center', gap:8, flex:1, justifyContent:'flex-end'}}>
              <span style={{
                fontSize:12, fontWeight:700, fontFamily:SANS,
                color: step === 2 ? TEXT : FAINT,
              }}>
                Link Device
              </span>
              <span style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, fontFamily:MONO,
                background: step === 2
                  ? `linear-gradient(135deg,#92400e,${AMBER})`
                  : 'rgba(255,255,255,0.06)',
                color: step === 2 ? '#1a0f00' : FAINT,
                boxShadow: step === 2 ? `0 3px 10px rgba(245,158,11,0.45)` : 'none',
              }}>
                2
              </span>
            </div>
          </div>

          {/* ── Step content ── */}
          <div style={{padding:'22px 20px 24px'}}>

            {/* ═══ STEP 1 ═══ */}
            {step === 1 && (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {/* Info */}
                <div style={{
                  padding:'12px 14px', borderRadius:12,
                  background:'rgba(59,130,246,0.07)',
                  border:`1px solid rgba(59,130,246,0.15)`,
                }}>
                  <p style={{
                    margin:0, fontSize:12, color:MUTED,
                    fontFamily:INTER, lineHeight:1.7,
                  }}>
                    Use <strong style={{color:TEXT}}>Chrome</strong> or <strong style={{color:TEXT}}>Edge</strong>.
                    Connect your ESP32 via USB before clicking install.
                  </p>
                </div>

                {/* Install button */}
                <esp-web-install-button manifest="/firmware/manifest.json">
                  <button slot="activate" className="fm-btn-blue">
                    <IcoFlash/> Install Firmware to ESP32
                  </button>
                </esp-web-install-button>

                <p style={{
                  margin:0, textAlign:'center', fontSize:11,
                  color:FAINT, fontFamily:INTER,
                }}>
                  This will erase the device and install the IoT Platform firmware
                </p>

                {/* Next step */}
                <button
                  type="button"
                  className="fm-btn-ghost"
                  onClick={() => setStep(2)}
                >
                  Already flashed — go to Step 2
                  <IcoChevron/>
                </button>
              </div>
            )}

            {/* ═══ STEP 2 ═══ */}
            {step === 2 && (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {/* Info */}
                <div style={{
                  padding:'12px 14px', borderRadius:12,
                  background:'rgba(245,158,11,0.07)',
                  border:`1px solid rgba(245,158,11,0.15)`,
                }}>
                  <p style={{
                    margin:0, fontSize:12, color:MUTED,
                    fontFamily:INTER, lineHeight:1.7,
                  }}>
                    After flashing, your ESP32 creates a WiFi hotspot. Connect to it,
                    enter your WiFi password, then copy the{' '}
                    <strong style={{color:TEXT}}>Device ID</strong> shown and paste below.
                  </p>
                </div>

                {/* Device ID input + Link */}
                <div>
                  <label style={{
                    display:'block', marginBottom:7,
                    fontSize:10, fontWeight:700,
                    color:FAINT, fontFamily:MONO,
                    letterSpacing:'0.12em', textTransform:'uppercase',
                  }}>
                    Device ID
                  </label>
                  <div style={{display:'flex', gap:8}}>
                    <input
                      type="text"
                      placeholder="esp32_XXXXXXXX"
                      className="fm-input"
                      value={deviceIdInput}
                      onChange={e => {
                        setDeviceIdInput(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') handleLink(); }}
                    />
                    <button type="button" className="fm-btn-amber" onClick={handleLink}>
                      <IcoLink/> Link
                    </button>
                  </div>
                  {errorMessage && (
                    <p style={{
                      margin:'8px 0 0', fontSize:11,
                      color:'#fca5a5', fontFamily:INTER,
                      display:'flex', alignItems:'center', gap:5,
                    }}>
                      <IcoAlert/> {errorMessage}
                    </p>
                  )}
                </div>

                {/* Back */}
                <button
                  type="button"
                  className="fm-btn-ghost"
                  onClick={() => setStep(1)}
                >
                  Back to Step 1
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}