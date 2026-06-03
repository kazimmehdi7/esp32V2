'use client';

import React, { useState } from 'react';

import { generateCode } from '@/lib/codeGenerator';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import type { Block } from '@/types';
import LiveOutput from '@/components/LiveOutput';
import LiveSimulator from '@/components/LiveSimulator';

interface CodePanelProps {
  showLiveOutput?: boolean;
}

export default function CodePanel({ showLiveOutput = true }: CodePanelProps) {
  const blocks: Block[] = useAppStore((state) => state.blocks);
  const hasAccess = useActivityStore((state) => state.hasAccess);
  const hasEsp32 = hasAccess('esp32');
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'simulator'>('code');

  const { code, english } = React.useMemo(() => generateCode(blocks), [blocks]);

  const codeHtml = React.useMemo(() => {
    if (blocks.length === 0) {
      return '<span class="cmt">// Your code will appear here!\n// Click blocks to get started 👈</span>';
    }
    return code;
  }, [blocks.length, code]);

  const handleCopy = async () => {
    const plainText = codeHtml
      .replace(/<\/?span[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="h-full flex flex-col">
      <style>{`
        .kw { color: #ff7b72; }
        .fn { color: #79c0ff; }
        .num { color: #f0883e; }
        .str { color: #a5d6ff; }
        .cmt { color: #8b949e; font-style: italic; }
        .pp { color: #ff7b72; }
        .tp { color: #ffa657; }
      `}</style>

      {/* Tab switcher */}
      <div className="flex items-center bg-gray-100 border-b border-gray-200 rounded-t-xl px-2 pt-2 gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'code'
              ? 'bg-[#2E4862] text-white'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📟 Code
        </button>
        <button
          type="button"
          onClick={() => {
            if (!hasEsp32) {
              alert('Simulator is locked. Please activate your hardware kit code to access the real-time simulator!');
              return;
            }
            setActiveTab('simulator');
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'bg-[#2E4862] text-white'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>🎮 Simulator</span>
          {!hasEsp32 && <span className="text-xs" title="Requires kit activation">🔒</span>}
        </button>
      </div>

      {activeTab === 'code' ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Code header */}
          <div className="h-10 bg-[#2E4862] text-white px-4 flex items-center justify-between flex-shrink-0">
            <div className="text-xs font-medium">Arduino Code</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="bg-white/10 hover:bg-white/20 text-white rounded-md px-2.5 py-1 text-[10px]"
              >
                {copied ? 'Copied!' : '📋 Copy'}
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-flash-modal'))}
                className="bg-white/10 hover:bg-white/20 text-white rounded-md px-2.5 py-1 text-[10px]"
              >
                ⚡ Flash
              </button>
            </div>
          </div>

          {/* Code view */}
          <div className="flex-1 overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-[#c9d1d9] min-h-0">
            <pre
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: codeHtml }}
            />
          </div>

          <div className="border-t border-gray-200 flex-shrink-0" />

          {/* What your program does */}
          <div className="max-h-[180px] overflow-y-auto bg-white px-4 py-3 flex-shrink-0">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              📖 What your program does
            </div>
            {english.length === 0 ? (
              <p className="text-xs text-gray-400">Add blocks to get started!</p>
            ) : (
              <div>
                {english.map((step, index) => (
                  <div key={`${step}-${index}`} className="flex gap-2 items-start mb-1.5">
                    <span className="bg-[#2E4862] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]">
                      {index + 1}
                    </span>
                    <p className="text-xs text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showLiveOutput && <LiveOutput />}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden min-h-0">
          <LiveSimulator />
        </div>
      )}
    </section>
  );
}