'use client';

import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';

import { BLOCK_COLOURS } from '@/lib/blockCatalogue';
import { validateBlocks } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Block, BlockParam } from '@/types';

/* ════════════════════════════════════════════════════════════════════════
   CANVAS — block editor workspace with dark/light toggle.
   No emojis. SVG icons. Matches Build Mind design system.
   ════════════════════════════════════════════════════════════════════════ */

const TOKEN_REGEX = /(<[^>]+>)/g;

// ── Theme presets ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#04080f',
    dot: 'rgba(59,130,246,0.12)',
    emptyTitle: 'rgba(234,240,250,0.4)',
    emptySub: 'rgba(234,240,250,0.25)',
    connector: 'rgba(59,130,246,0.25)',
    selectBar: 'rgba(15,28,48,0.95)',
    selectBorder: 'rgba(255,255,255,0.1)',
    selectText: 'rgba(234,240,250,0.7)',
    // bottom bar buttons
    btnBg: 'rgba(255,255,255,0.06)',
    btnBorder: 'rgba(255,255,255,0.15)',
    btnText: 'rgba(234,240,250,0.75)',
    btnHover: 'rgba(255,255,255,0.12)',
    // theme toggle
    toggleBg: 'rgba(255,255,255,0.08)',
    toggleActive: '#3b82f6',
    toggleIcon: '#eaf0fa',
    // AI button shadow
    aiShadow: '0 4px 18px -4px rgba(59,130,246,0.6)',
  },
  light: {
    bg: '#eef1f7',
    dot: 'rgba(0,0,0,0.07)',
    emptyTitle: 'rgba(0,0,0,0.65)',
    emptySub: 'rgba(0,0,0,0.42)',
    connector: 'rgba(0,0,0,0.18)',
    selectBar: 'rgba(255,255,255,0.97)',
    selectBorder: 'rgba(0,0,0,0.12)',
    selectText: '#1e293b',
    // bottom bar buttons — darker surface so they stand out on light canvas
    btnBg: '#1e293b',
    btnBorder: 'rgba(0,0,0,0)',
    btnText: '#f1f5f9',
    btnHover: '#334155',
    // theme toggle
    toggleBg: 'rgba(0,0,0,0.07)',
    toggleActive: '#2563eb',
    toggleIcon: '#1e293b',
    // AI button shadow
    aiShadow: '0 4px 18px -4px rgba(37,99,235,0.45)',
  },
} as const;

type Theme = typeof THEMES[keyof typeof THEMES];

// ── SVG Icons (stable references — defined outside component) ─────────────────
const Ico = {
  grip: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.45">
      <circle cx="8" cy="4" r="1.5"/><circle cx="16" cy="4" r="1.5"/>
      <circle cx="8" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
      <circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/>
      <circle cx="8" cy="22" r="1.5"/><circle cx="16" cy="22" r="1.5"/>
    </svg>
  ),
  x: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  template: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  sun: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  moon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  warn: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 9v4M12 17h.01"/>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="9" cy="13" r="1" fill="#fff"/>
      <circle cx="15" cy="13" r="1" fill="#fff"/>
      <path d="M9 17h6"/>
    </svg>
  ),
} as const;

// ── Stop propagation helper (stable ref) ──────────────────────────────────────
const stop = (e: React.MouseEvent) => e.stopPropagation();

// ── Param control (memoised) ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 5,
  padding: '3px 7px',
  color: '#fff',
  fontSize: 12,
  outline: 'none',
  fontFamily: '"JetBrains Mono",monospace',
};

interface ParamControlProps {
  block: Block;
  param: BlockParam;
  updateBlockValue: (id: number, param: string, value: string | number) => void;
}

const ParamControl = React.memo(function ParamControl({ block, param, updateBlockValue }: ParamControlProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.value;
      if (param.type === 'number') {
        if (v.trim() === '') updateBlockValue(block.id, param.name, '');
        else if (!isNaN(Number(v))) updateBlockValue(block.id, param.name, Number(v));
        else updateBlockValue(block.id, param.name, v);
      } else {
        updateBlockValue(block.id, param.name, v);
      }
    },
    [block.id, param.name, param.type, updateBlockValue],
  );

  if (param.type === 'number') {
    return (
      <input
        type="text"
        style={{ ...inputStyle, width: 56 }}
        value={block.values[param.name] ?? ''}
        onMouseDown={stop}
        onClick={stop}
        onChange={handleChange}
      />
    );
  }
  if (param.type === 'select') {
    return (
      <select
        style={{ ...inputStyle, width: 96 }}
        value={String(block.values[param.name] ?? '')}
        onMouseDown={stop}
        onClick={stop}
        onChange={handleChange}
      >
        {(param.options ?? []).map((o) => (
          <option key={o} value={o} style={{ color: '#000' }}>{o}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      style={{ ...inputStyle, width: 96 }}
      value={String(block.values[param.name] ?? '')}
      onMouseDown={stop}
      onClick={stop}
      onChange={handleChange}
    />
  );
});

// ── Inline label renderer (memoised) ─────────────────────────────────────────
interface InlineLabelProps {
  block: Block;
  updateBlockValue: (id: number, param: string, value: string | number) => void;
}

const InlineLabel = React.memo(function InlineLabel({ block, updateBlockValue }: InlineLabelProps) {
  const paramsByName = React.useMemo(
    () => new Map(block.params.map((p) => [p.name, p])),
    [block.params],
  );

  return (
    <>
      {block.label.split(TOKEN_REGEX).map((part, i) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          const param = paramsByName.get(part.slice(1, -1));
          if (!param) return <span key={i} style={{ opacity: 0.6 }}>{part}</span>;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', margin: '0 3px' }}>
              <ParamControl block={block} param={param} updateBlockValue={updateBlockValue} />
            </span>
          );
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
});

// ── Single block row (memoised to avoid re-renders when sibling state changes) ─
interface BlockRowProps {
  block: Block;
  index: number;
  isSelected: boolean;
  hasError: boolean;
  errorMsg: string | undefined;
  isLast: boolean;
  connectorColor: string;
  updateBlockValue: (id: number, param: string, value: string | number) => void;
  onDeleteBlock: (id: number) => void;
  onClickBlock: (id: number, shift: boolean) => void;
}

const BlockRow = React.memo(function BlockRow({
  block, index, isSelected, hasError, errorMsg, isLast,
  connectorColor, updateBlockValue, onDeleteBlock, onClickBlock,
}: BlockRowProps) {
  const colourClass = BLOCK_COLOURS[block.type] ?? 'bg-slate-500';

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => onClickBlock(block.id, e.shiftKey),
    [block.id, onClickBlock],
  );
  const handleDelete = React.useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onDeleteBlock(block.id); },
    [block.id, onDeleteBlock],
  );

  return (
    <React.Fragment>
      <Draggable draggableId={String(block.id)} index={index}>
        {(drag) => (
          <div
            ref={drag.innerRef}
            {...drag.draggableProps}
            onClick={handleClick}
            className={`bg-gradient-to-r ${colourClass}`}
            style={{
              position: 'relative',
              borderRadius: 12,
              padding: '10px 12px',
              color: '#fff',
              outline: isSelected ? '2px solid #fff' : hasError ? '2px solid #ef4444' : 'none',
              outlineOffset: isSelected || hasError ? 2 : 0,
              boxShadow: '0 3px 10px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              cursor: 'pointer',
              transition: 'outline .15s',
              ...drag.draggableProps.style,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Drag handle */}
              <span
                {...drag.dragHandleProps}
                style={{ cursor: 'grab', display: 'flex' }}
                onMouseDown={stop}
                onClick={stop}
              >
                {Ico.grip}
              </span>

              {/* Block type badge */}
              <span style={{
                fontSize: 9, fontWeight: 800, fontFamily: '"JetBrains Mono",monospace',
                background: 'rgba(0,0,0,0.25)', borderRadius: 4, padding: '2px 5px',
                color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em',
                lineHeight: 1, flexShrink: 0, minWidth: 26, textAlign: 'center',
              }}>
                {block.icon}
              </span>

              {/* Inline label with param controls */}
              <div style={{
                flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.5,
                display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              }}>
                <InlineLabel block={block} updateBlockValue={updateBlockValue} />
              </div>

              {/* Delete button */}
              <button
                type="button"
                onMouseDown={stop}
                onClick={handleDelete}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(0,0,0,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                  transition: 'background .15s, color .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                {Ico.x}
              </button>
            </div>

            {/* Error tooltip */}
            {hasError && (
              <div style={{
                position: 'absolute', top: -28, left: 0, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#ef4444', color: '#fff', borderRadius: 6,
                padding: '3px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
              }}>
                {Ico.warn}
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </Draggable>

      {/* Connector line between blocks */}
      {!isLast && (
        <div style={{ height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 2, height: 10, background: connectorColor, borderRadius: 1 }} />
        </div>
      )}
    </React.Fragment>
  );
});

// ── Custom hooks ──────────────────────────────────────────────────────────────

/** Keeps selection in sync when blocks are removed externally */
function useSelection(blockIds: number[]) {
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const ids = new Set(blockIds);
    setSelected((prev) => {
      const next = new Set<number>();
      prev.forEach((id) => { if (ids.has(id)) next.add(id); });
      // Only update if something actually changed
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [blockIds]);

  const clickBlock = React.useCallback((id: number, shift: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift) { next.add(id); }
      else if (next.has(id)) { next.delete(id); }
      else { next.add(id); }
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => setSelected(new Set()), []);

  return { selected, clickBlock, clearSelection };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CanvasProps { showAIButton?: boolean }

// ── Component ─────────────────────────────────────────────────────────────────
export default function Canvas({ showAIButton = true }: CanvasProps) {
  const blocks = useAppStore((s) => s.blocks);
  const removeBlock = useAppStore((s) => s.removeBlock);
  const updateBlockValue = useAppStore((s) => s.updateBlockValue);
  const reorderBlocks = useAppStore((s) => s.reorderBlocks);
  const clearBlocks = useAppStore((s) => s.clearBlocks);

  const errors = React.useMemo(() => validateBlocks(blocks), [blocks]);

  // Stable block id list (avoid recreating array on every render for the hook dep)
  const blockIds = React.useMemo(() => blocks.map((b) => b.id), [blocks]);
  const { selected, clickBlock, clearSelection } = useSelection(blockIds);

  const [mode, setMode] = React.useState<'dark' | 'light'>('dark');
  const t: Theme = THEMES[mode];

  // ── Stable callbacks ───────────────────────────────────────────────────────
  const onDragEnd = React.useCallback(
    (r: DropResult) => {
      if (r.destination && r.source.index !== r.destination.index) {
        reorderBlocks(r.source.index, r.destination.index);
      }
    },
    [reorderBlocks],
  );

  const deleteSelected = React.useCallback(() => {
    selected.forEach((id) => removeBlock(id));
    clearSelection();
  }, [selected, removeBlock, clearSelection]);

  const deleteBlock = React.useCallback(
    (id: number) => {
      if (selected.has(id)) { deleteSelected(); return; }
      removeBlock(id);
    },
    [selected, removeBlock, deleteSelected],
  );

  const handleClearAll = React.useCallback(() => {
    clearBlocks();
    clearSelection();
  }, [clearBlocks, clearSelection]);

  const openTemplates = React.useCallback(
    () => window.dispatchEvent(new CustomEvent('open-templates')),
    [],
  );
  const openAI = React.useCallback(
    () => window.dispatchEvent(new CustomEvent('open-ai-assistant')),
    [],
  );

  const setDark = React.useCallback(() => setMode('dark'), []);
  const setLight = React.useCallback(() => setMode('light'), []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'relative', height: '100%', width: '100%', overflow: 'hidden',
      background: t.bg,
      backgroundImage: `radial-gradient(${t.dot} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      transition: 'background .3s',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Selection bar */}
        {selected.size >= 2 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: t.selectBar, border: `1px solid ${t.selectBorder}`,
            borderRadius: 10, padding: '6px 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.selectText }}>
              {selected.size} blocks selected
            </span>
            <button type="button" onClick={deleteSelected} style={{
              fontSize: 12, fontWeight: 700, color: '#f87171',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Delete selected
            </button>
          </div>
        ) : <div />}

        {/* Theme toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: t.toggleBg, borderRadius: 9, padding: 3,
          border: `1px solid ${t.selectBorder}`,
        }}>
          <button type="button" onClick={setDark} title="Dark canvas" style={{
            width: 30, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: mode === 'dark' ? t.toggleActive : 'transparent',
            color: mode === 'dark' ? '#fff' : t.toggleIcon,
            transition: 'background .2s, color .2s',
          }}>
            {Ico.moon}
          </button>
          <button type="button" onClick={setLight} title="Light canvas" style={{
            width: 30, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: mode === 'light' ? t.toggleActive : 'transparent',
            color: mode === 'light' ? '#fff' : t.toggleIcon,
            transition: 'background .2s, color .2s',
          }}>
            {Ico.sun}
          </button>
        </div>
      </div>

      {/* ── DnD Canvas ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="canvas">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ height: '100%', overflowY: 'auto', padding: '56px 16px 72px' }}
            >
              {blocks.length === 0 ? (
                <div style={{
                  height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  pointerEvents: 'none', gap: 8,
                }}>
                  <p style={{
                    marginTop: 8, fontSize: 15, fontWeight: 700,
                    color: t.emptyTitle, fontFamily: '"Space Grotesk",sans-serif',
                  }}>
                    Drag blocks to get started
                  </p>
                  <p style={{ fontSize: 13, color: t.emptySub }}>
                    Click any block in the sidebar to add it here
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 520 }}>
                  {blocks.map((block, idx) => (
                    <BlockRow
                      key={block.id}
                      block={block}
                      index={idx}
                      isSelected={selected.has(block.id)}
                      hasError={errors.has(idx)}
                      errorMsg={errors.get(idx)}
                      isLast={idx === blocks.length - 1}
                      connectorColor={t.connector}
                      updateBlockValue={updateBlockValue}
                      onDeleteBlock={deleteBlock}
                      onClickBlock={clickBlock}
                    />
                  ))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* ── Bottom bar ── */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, right: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        {/* Templates button */}
        <button
          type="button"
          onClick={openTemplates}
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
            background: t.btnBg,
            border: `1px solid ${t.btnBorder}`,
            color: t.btnText,
            fontSize: 12.5, fontWeight: 700, fontFamily: '"Inter",sans-serif',
            boxShadow: '0 4px 14px -6px rgba(0,0,0,0.4)',
            transition: 'background .15s, transform .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = t.btnHover;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = t.btnBg;
            e.currentTarget.style.transform = '';
          }}
        >
          {Ico.template}
          Templates
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          {/* Clear all */}
          {blocks.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 36, padding: '0 14px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: mode === 'light' ? '#b91c1c' : '#fca5a5',
                fontSize: 12.5, fontWeight: 700, fontFamily: '"Inter",sans-serif',
                transition: 'background .15s, transform .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.28)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                e.currentTarget.style.transform = '';
              }}
            >
              {Ico.trash}
              Clear All
            </button>
          )}

          {/* AI button */}
          {showAIButton && (
            <button
              type="button"
              onClick={openAI}
              aria-label="AI Block Generator"
              title="AI Block Generator"
              style={{
                width: 40, height: 40, borderRadius: 12, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                boxShadow: `${t.aiShadow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'filter .15s, transform .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = '';
                e.currentTarget.style.transform = '';
              }}
            >
              {Ico.ai}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}