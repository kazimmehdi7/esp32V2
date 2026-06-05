'use client';

import React from 'react';
import { BLOCK_CATALOGUE } from '@/lib/blockCatalogue';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import type { Block } from '@/types';

/* ── Design tokens ── */
const BG     = '#04080f';
const PANEL  = '#0a1422';
const CARD   = '#0d1a2e';
const LINE   = 'rgba(255,255,255,0.07)';
const TEXT   = '#eaf0fa';
const MUTED  = 'rgba(234,240,250,0.5)';
const FAINT  = 'rgba(234,240,250,0.18)';
const BLUE   = '#3b82f6';
const GREEN  = '#10b981';
const VIOLET = '#8b5cf6';
const MONO   = '"JetBrains Mono",monospace';
const SANS   = '"Space Grotesk",system-ui,sans-serif';
const INTER  = '"Inter",system-ui,sans-serif';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  isLoading?: boolean;
};

/* ── Send icon ── */
function IcoSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

/* ── Close icon ── */
function IcoClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

/* ── Lock icon ── */
function IcoLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

/* ── Bot icon (replaces /robot images) ── */
function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,#1a3a8a,${VIOLET})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 10px ${VIOLET}40`,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24"
        fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M12 2v4M8 11V9a4 4 0 0 1 8 0v2"/>
        <circle cx="9" cy="16" r="1" fill="#fff"/>
        <circle cx="15" cy="16" r="1" fill="#fff"/>
        <path d="M9 19h6"/>
      </svg>
    </span>
  );
}

/* ── Loading dots ── */
function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: MUTED,
          animation: `ai-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </span>
  );
}

/* ── Message bubble ── */
const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '82%',
          background: `linear-gradient(135deg,#1a3a8a,${BLUE})`,
          borderRadius: '14px 14px 3px 14px',
          padding: '9px 13px',
          fontSize: 12,
          color: '#fff',
          lineHeight: 1.55,
          fontFamily: INTER,
          boxShadow: `0 2px 10px rgba(37,99,235,0.3)`,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <BotAvatar size={26} />
      <div style={{
        maxWidth: '82%',
        background: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: '14px 14px 14px 3px',
        padding: '9px 13px',
        fontSize: 12,
        color: TEXT,
        lineHeight: 1.6,
        fontFamily: INTER,
      }}>
        {msg.isLoading ? <LoadingDots /> : msg.text}
      </div>
    </div>
  );
});

export default function AIAssistant() {
  const addBlock    = useAppStore((s) => s.addBlock);
  const clearBlocks = useAppStore((s) => s.clearBlocks);
  const hasAccess   = useActivityStore((s) => s.hasAccess);
  const hasEsp32    = hasAccess('esp32');

  const [isOpen,        setIsOpen]        = React.useState(false);
  const [messages,      setMessages]      = React.useState<Message[]>([{
    id: 1, role: 'bot',
    text: "Hi! Describe what you want your ESP32 to do and I'll generate the blocks for you.",
  }]);
  const [inputText,     setInputText]     = React.useState('');
  const [isLoading,     setIsLoading]     = React.useState(false);
  const [replaceBlocks, setReplaceBlocks] = React.useState(true);

  const nextId       = React.useRef(2);
  const bottomRef    = React.useRef<HTMLDivElement>(null);
  const textareaRef  = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  React.useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  /* auto-grow textarea */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const uid = nextId.current++;
    const lid = nextId.current++;

    setMessages(p => [
      ...p,
      { id: uid, role: 'user', text },
      { id: lid, role: 'bot', text: '', isLoading: true },
    ]);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res  = await fetch('/api/generate-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          catalogue: BLOCK_CATALOGUE.map(b => ({
            type: b.type, icon: b.icon, label: b.label,
            params: b.params.map(p => ({
              name: p.name, type: p.type,
              default: p.default, options: p.options,
            })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');

      const blocks: Block[] = data?.blocks;
      if (!Array.isArray(blocks) || blocks.length === 0)
        throw new Error('No blocks returned');

      if (replaceBlocks) clearBlocks();
      blocks.forEach(b => addBlock({
        type: b.type, icon: b.icon, label: b.label,
        params: b.params, values: { ...b.values },
      }));

      setMessages(p => p.map(m => m.id === lid
        ? { ...m, text: `Done! Created ${blocks.length} block${blocks.length !== 1 ? 's' : ''} on the canvas.`, isLoading: false }
        : m));
    } catch {
      setMessages(p => p.map(m => m.id === lid
        ? { ...m, text: "Couldn't generate blocks. Try being more specific — e.g. \"blink LED on pin 2 every 500ms\"", isLoading: false }
        : m));
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  if (!isOpen) return null;

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes ai-in {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes ai-bounce {
          0%,80%,100% { transform:translateY(0);    opacity:.4; }
          40%         { transform:translateY(-5px); opacity:1;  }
        }
        .ai-scroll::-webkit-scrollbar { width:3px; }
        .ai-scroll::-webkit-scrollbar-track { background:transparent; }
        .ai-scroll::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:99px; }
        .ai-send:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .ai-send:active { transform:scale(0.95); }
        .ai-send:disabled { opacity:0.35; cursor:not-allowed; filter:none; transform:none; }
        .ai-textarea:focus { outline:none; border-color:rgba(59,130,246,0.5) !important; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .ai-textarea::placeholder { color:rgba(234,240,250,0.25); }
        .ai-check:focus-visible { outline:2px solid ${BLUE}; outline-offset:2px; }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 72,
        right: 24,
        zIndex: 200,
        width: 340,
        height: 480,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: PANEL,
        border: `1px solid ${LINE}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12)`,
        animation: 'ai-in 0.2s ease-out',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', flexShrink: 0,
          background: `linear-gradient(135deg,#0d1a30,#12204a)`,
          borderBottom: `1px solid ${LINE}`,
        }}>
          <BotAvatar size={32} />
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0, fontSize: 13, fontWeight: 700,
              color: TEXT, fontFamily: SANS, lineHeight: 1.2,
            }}>
              Build Mind Assistant
            </p>
            <p style={{
              margin: 0, fontSize: 9, color: MUTED,
              fontFamily: MONO, lineHeight: 1.2,
            }}>
              Powered by Gemini
            </p>
          </div>
          {/* status dot */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99,
            background: 'rgba(16,185,129,0.14)',
            border: '1px solid rgba(16,185,129,0.25)',
            fontSize: 9, fontWeight: 700, color: '#34d399',
            fontFamily: MONO,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: GREEN, flexShrink: 0,
              animation: 'ai-bounce 2s ease-in-out infinite',
            }}/>
            Online
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI assistant"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${LINE}`,
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: MUTED,
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
              (e.currentTarget as HTMLElement).style.color = '#fca5a5';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.color = MUTED;
            }}
          >
            <IcoClose />
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          className="ai-scroll"
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            padding: '14px 14px 6px',
            display: 'flex', flexDirection: 'column', gap: 10,
            background: BG,
          }}
        >
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* ── Footer: locked or active ── */}
        {hasEsp32 ? (
          <div style={{
            flexShrink: 0,
            background: PANEL,
            borderTop: `1px solid ${LINE}`,
          }}>
            {/* Replace checkbox */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px 6px',
              borderBottom: `1px solid ${LINE}`,
            }}>
              <input
                id="ai-replace"
                type="checkbox"
                checked={replaceBlocks}
                onChange={e => setReplaceBlocks(e.target.checked)}
                className="ai-check"
                style={{
                  width: 13, height: 13, cursor: 'pointer',
                  accentColor: BLUE,
                }}
              />
              <label htmlFor="ai-replace" style={{
                fontSize: 11, color: MUTED, cursor: 'pointer',
                fontFamily: INTER, userSelect: 'none',
              }}>
                Replace existing blocks
              </label>
            </div>

            {/* Input row */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              padding: '10px 12px 12px',
            }}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInput}
                onKeyDown={onKeyDown}
                placeholder="Describe what you want to build…"
                className="ai-textarea"
                style={{
                  flex: 1, resize: 'none',
                  fontSize: 12, lineHeight: 1.55,
                  fontFamily: INTER,
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: 12,
                  padding: '8px 12px',
                  color: TEXT,
                  minHeight: 36, maxHeight: 96,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  scrollbarWidth: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="ai-send"
                aria-label="Send message"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  flexShrink: 0,
                  background: `linear-gradient(135deg,#1a3a8a,${BLUE})`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 3px 12px rgba(37,99,235,0.5)`,
                  transition: 'filter 0.15s, transform 0.15s',
                }}
              >
                <IcoSend />
              </button>
            </div>
          </div>
        ) : (
          /* Locked state */
          <div style={{
            flexShrink: 0, padding: '20px 20px',
            background: PANEL, borderTop: `1px solid ${LINE}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, textAlign: 'center',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(139,92,246,0.15)',
              border: `1px solid rgba(139,92,246,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: VIOLET,
            }}>
              <IcoLock />
            </span>
            <p style={{
              margin: 0, fontSize: 12, fontWeight: 700,
              color: TEXT, fontFamily: SANS,
            }}>
              AI Assistant Locked
            </p>
            <p style={{
              margin: 0, fontSize: 11, color: MUTED,
              fontFamily: INTER, lineHeight: 1.65, maxWidth: 240,
            }}>
              Activate your physical hardware kit to unlock chat with the AI assistant.
            </p>
          </div>
        )}
      </div>
    </>
  );
}