'use client';

import { useState } from 'react';
import type { BlockParam } from '@/types';
import { BLOCK_CATALOGUE, BLOCK_COLOURS } from '@/lib/blockCatalogue';
import { useAppStore } from '@/store/useAppStore';

/* ════════════════════════════════════════════════════════════════════════
   SIDEBAR — Block library for the Build Mind playground.
   Dark theme, SVG icons (no emojis), collapsible categories.
   ════════════════════════════════════════════════════════════════════════ */

// ── Category SVG icons ────────────────────────────────────────────────────────
const CatIco: Record<string, React.ReactNode> = {
  Output:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
  PWM:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12h4l2-8 4 16 2-8h8"/></svg>,
  Sensors:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  Control:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  WiFi:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  MQTT:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Serial:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Display:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Variables: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>,
};

// ── Categories (no emojis) ────────────────────────────────────────────────────
type Category = { title: string; types: string[] };

const CATEGORIES: Category[] = [
  { title: 'Output',    types: ['pinMode', 'dw_high', 'dw_low', 'blink', 'tone_on', 'tone_off'] },
  { title: 'PWM',       types: ['pwm_setup', 'pwm_write', 'servo_write'] },
  { title: 'Sensors',   types: ['dht_setup', 'dht_temp', 'dht_hum', 'btn_read', 'pir_read', 'analog_read', 'ultrasonic', 'map_val'] },
  { title: 'Control',   types: ['delay_ms', 'delay_sec', 'for_loop', 'while_loop', 'end_loop', 'if_block', 'else_block', 'end_if'] },
  { title: 'WiFi',      types: ['wifi_connect', 'wifi_wait', 'wifi_ip'] },
  { title: 'MQTT',      types: ['mqtt_setup', 'mqtt_publish', 'mqtt_subscribe', 'mqtt_loop'] },
  { title: 'Serial',    types: ['serial_begin', 'serial_print', 'serial_printvar', 'serial_println'] },
  { title: 'Display',   types: ['oled_setup', 'oled_clear', 'oled_set_cursor', 'oled_print', 'oled_display'] },
  { title: 'Variables', types: ['var_int', 'var_float', 'var_str', 'var_bool', 'var_add'] },
];

// ── Accent colors per category ────────────────────────────────────────────────
const CAT_ACCENT: Record<string, string> = {
  Output:    '#f59e0b',
  PWM:       '#f97316',
  Sensors:   '#10b981',
  Control:   '#8b5cf6',
  WiFi:      '#3b82f6',
  MQTT:      '#06b6d4',
  Serial:    '#6366f1',
  Display:   '#ec4899',
  Variables: '#64748b',
};

const makeShortName = (label: string): string =>
  label.replace(/<[^>]+>/g, '').replace(/\s+on\s+Pin.*$/i, '').replace(/\s+into\s+.*$/i, '')
    .replace(/\s+every\s+.*$/i, '').replace(/\s+to\s+topic.*$/i, '').replace(/\s+to\s+Serial.*$/i, '')
    .replace(/\s+\(put\s+in\s+loop\).*$/i, '').replace(/\s+/g, ' ').trim();

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps { allowedBlocks?: string[] }

export default function Sidebar({ allowedBlocks }: SidebarProps) {
  const addBlock = useAppStore((state) => state.addBlock);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => setCollapsed((p) => ({ ...p, [title]: !p[title] }));

  const handleAddBlock = (type: string) => {
    const template = BLOCK_CATALOGUE.find((b) => b.type === type);
    if (!template) return;
    const values: Record<string, string | number> = Object.fromEntries(
      template.params.map((p: BlockParam) => [p.name, p.default]),
    );
    addBlock({ type: template.type, icon: template.icon, label: template.label, params: template.params, values });
  };

  return (
    <aside style={{
      height: '100%', width: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: '#0a1422', padding: '12px 10px',
      fontFamily: '"Inter",system-ui,sans-serif',
    }}>
      <style suppressHydrationWarning>{`
        .sb-cat-btn{
          width:100%;display:flex;align-items:center;gap:8px;
          padding:8px 10px;border:none;cursor:pointer;
          border-radius:10px;background:transparent;
          transition:background .15s;
        }
        .sb-cat-btn:hover{background:rgba(255,255,255,0.05)}
        .sb-chevron{
          margin-left:auto;transition:transform .2s;
          color:rgba(234,240,250,0.25);
        }
        .sb-chevron-open{transform:rotate(90deg)}
        .sb-block{
          width:100%;display:flex;align-items:center;gap:8px;
          padding:8px 10px;border:none;cursor:pointer;
          border-radius:8px;text-align:left;
          font-size:12px;font-weight:600;color:#fff;
          font-family:"Inter",sans-serif;
          transition:filter .15s,transform .15s;
          position:relative;overflow:hidden;
        }
        .sb-block:hover{filter:brightness(1.2);transform:translateX(2px)}
        .sb-block:active{transform:scale(0.97)}
        .sb-block-icon{font-size:14px;line-height:1;flex-shrink:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))}
        .sb-block-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.3)}
      `}</style>

      {/* ── Title ── */}
      <div style={{ padding: '0 6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(234,240,250,0.3)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Block Library</p>
      </div>

      {CATEGORIES.map((cat) => {
        const blocks = cat.types
          .filter((t) => !allowedBlocks || allowedBlocks.includes(t))
          .map((t) => BLOCK_CATALOGUE.find((b) => b.type === t))
          .filter((b): b is NonNullable<typeof b> => Boolean(b));
        if (blocks.length === 0) return null;

        const open = !collapsed[cat.title];
        const accent = CAT_ACCENT[cat.title] ?? '#64748b';

        return (
          <section key={cat.title} style={{ marginBottom: 4 }}>
            {/* Category header — collapsible */}
            <button type="button" className="sb-cat-btn" onClick={() => toggle(cat.title)}>
              <span style={{
                width: 26, height: 26, borderRadius: 7,
                background: accent + '1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accent, flexShrink: 0,
              }}>
                {CatIco[cat.title] ?? CatIco.Output}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#eaf0fa', fontFamily: '"Space Grotesk",sans-serif' }}>{cat.title}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(234,240,250,0.25)', fontFamily: '"JetBrains Mono",monospace' }}>{blocks.length}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`sb-chevron ${open ? 'sb-chevron-open' : ''}`}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Block list */}
            {open && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0 6px 8px' }}>
                {blocks.map((block) => {
                  const gradient = BLOCK_COLOURS[block.type] ?? 'from-slate-500 to-slate-700';
                  const shortName = makeShortName(block.label);
                  return (
                    <button
                      key={block.type}
                      type="button"
                      draggable
                      onClick={() => handleAddBlock(block.type)}
                      className={`sb-block bg-gradient-to-r ${gradient}`}
                      title={block.label}
                      style={{ boxShadow: '0 2px 8px -3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
                    >
                      <span style={{
                        fontSize: 9, fontWeight: 800, fontFamily: '"JetBrains Mono",monospace',
                        background: 'rgba(0,0,0,0.25)', borderRadius: 4, padding: '2px 5px',
                        color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em',
                        lineHeight: 1, flexShrink: 0, minWidth: 28, textAlign: 'center',
                      }}>{block.icon}</span>
                      <span className="sb-block-label">{shortName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </aside>
  );
}