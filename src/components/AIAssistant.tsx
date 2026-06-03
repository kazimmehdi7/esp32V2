'use client';

import React from 'react';

import { BLOCK_CATALOGUE } from '@/lib/blockCatalogue';
import { useAppStore } from '@/store/useAppStore';
import { useActivityStore } from '@/store/useActivityStore';
import type { Block } from '@/types';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  isLoading?: boolean;
};

export default function AIAssistant() {
  const addBlock = useAppStore((state) => state.addBlock);
  const clearBlocks = useAppStore((state) => state.clearBlocks);
  const hasAccess = useActivityStore((state) => state.hasAccess);
  const hasEsp32 = hasAccess('esp32');

  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: "Hello! I'm your IoT assistant. Describe what you want your ESP32 to do and I'll generate the blocks for you! 🤖",
    },
  ]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [replaceBlocks, setReplaceBlocks] = React.useState(true);

  const nextMessageIdRef = React.useRef(2);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  React.useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  const handleSend = async () => {
    const userText = inputText.trim();
    if (!userText || isLoading) {
      return;
    }

    const userMessageId = nextMessageIdRef.current;
    nextMessageIdRef.current += 1;

    const loadingMessageId = nextMessageIdRef.current;
    nextMessageIdRef.current += 1;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: userText },
      { id: loadingMessageId, role: 'bot', text: '', isLoading: true },
    ]);

    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          catalogue: BLOCK_CATALOGUE.map((b) => ({
            type: b.type,
            icon: b.icon,
            label: b.label,
            params: b.params.map((p) => ({
              name: p.name,
              type: p.type,
              default: p.default,
              options: p.options,
            })),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate blocks');
      }

      const blocks: Block[] = data?.blocks;
      if (!Array.isArray(blocks) || blocks.length === 0) {
        throw new Error('No blocks returned from AI');
      }

      if (replaceBlocks) {
        clearBlocks();
      }

      blocks.forEach((block) => {
        addBlock({
          type: block.type,
          icon: block.icon,
          label: block.label,
          params: block.params,
          values: { ...block.values },
        });
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                id: loadingMessageId,
                role: 'bot',
                text: `✨ Done! I created ${blocks.length} blocks for you. Check the canvas!`,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                id: loadingMessageId,
                role: 'bot',
                text: "❌ That didn't work. Try being more specific, e.g. 'blink LED on pin 48 three times'",
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-16 right-[355px] z-50 h-[420px] w-80 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden origin-bottom-right animate-[chatIn_180ms_ease-out]">
          <style>{`@keyframes chatIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

          <div className="bg-[#2E4862] px-4 py-3 flex items-center gap-3">
            <img src="/robot3.png" alt="IoT Assistant" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">IoT Assistant</p>
              <p className="text-xs text-white/60">Powered by Gemini</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white"
              aria-label="Close AI assistant"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-white flex flex-col gap-3">
            {messages.map((message) => {
              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-[#2E4862] px-3 py-2 text-xs text-white">
                      {message.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="flex gap-2 items-start">
                  <img src="/robot2.png" alt="Bot" className="w-6 h-6 rounded-full object-cover" />
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                    {message.isLoading ? (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {hasEsp32 ? (
            <>
              <div className="px-3 py-1.5 border-t border-gray-100 bg-white flex items-center gap-2">
                <input
                  id="replace-blocks-chat"
                  type="checkbox"
                  checked={replaceBlocks}
                  onChange={(event) => setReplaceBlocks(event.target.checked)}
                />
                <label htmlFor="replace-blocks-chat" className="text-xs text-gray-400">
                  Replace blocks
                </label>
              </div>

              <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2 items-end">
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask me to build something..."
                  className="flex-1 resize-none text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#2E4862]"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isLoading || !inputText.trim()}
                  className="h-8 w-8 rounded-full bg-[#2E4862] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-4 bg-slate-50 border-t border-gray-100 text-center flex flex-col gap-1.5 flex-shrink-0">
              <p className="text-xs text-[#2E4862] font-bold flex items-center justify-center gap-1.5">
                <span>🔒 Gemini Assistant Locked</span>
              </p>
              <p className="text-[10px] text-gray-400 leading-relaxed px-2">
                Activate your physical hardware kit activation code to chat with the AI assistant.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
