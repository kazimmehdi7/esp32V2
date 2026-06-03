'use client';

import React, { useState, useEffect } from 'react';
import { LECTURES_STRUCTURED_DATA, LectureSection, LectureBlock, QuizQuestion } from '@/lib/lecturesStructuredData';
import { createClient } from '@/utils/supabase/client';

interface InteractiveLectureProps {
  levelId: string | number;
  lessonId: string;
  stepId: string;
}

/* ─── Glossary Dictionary for Technical Key Terms ─── */
const GLOSSARY: Record<string, string> = {
  'ESP32': 'A powerful, low-cost microcontroller with built-in Wi-Fi and Bluetooth, widely used for IoT and smart hardware projects.',
  'microcontroller': 'A compact integrated circuit designed to govern a specific operation in an embedded system, containing a processor, memory, and I/O pins.',
  'pinMode': 'A configuration command that defines whether a specific pin behaves as an INPUT (to read sensors) or an OUTPUT (to send power).',
  'OUTPUT': 'A pin configuration mode where the ESP32 pushes voltage (3.3V or 0V) out to control external components like LEDs or motors.',
  'INPUT': 'A pin configuration mode where the ESP32 listens to external voltage levels, used to read switches, buttons, and sensors.',
  'HIGH': 'The active ON state in digital control, applying full system voltage (3.3V) to a pin.',
  'LOW': 'The inactive OFF state in digital control, pulling the pin voltage down to ground level (0V).',
  'digitalWrite': 'A command that sets a digital pin to either HIGH (ON) or LOW (OFF) state.',
  'digitalRead': 'A command that checks whether a digital pin is receiving HIGH or LOW electrical signals.',
  'analogWrite': 'A command used to simulate analog voltages on digital pins using high-frequency Pulse Width Modulation (PWM).',
  'analogRead': 'A command that converts incoming variable voltage into a numerical value (0 to 4095 on the ESP32).',
  'PWM': 'Pulse Width Modulation—a technique to control average voltage by pulsing a digital signal ON and OFF at very high speeds.',
  'LDR': 'Light Dependent Resistor—a sensor whose physical resistance decreases when exposed to bright light.',
  'Photoresistor': 'Another term for an LDR, a sensor that measures light intensity.',
  'Duty Cycle': 'The percentage of time a digital signal remains HIGH compared to the total period of one ON/OFF pulse cycle.',
  'map': 'A mathematical function that scales a value from one source range (e.g., 0-4095) to a target range (e.g., 0-255) proportionally.',
  'Setup': 'A mandatory function in microcontroller code that runs once when power is applied, used to configure initial pin behaviors.',
  'Loop': 'A mandatory function in microcontroller code that repeats forever in a continuous cycle after the setup function completes.',
  'delay': 'An instruction that pauses code execution for a set duration of time (measured in milliseconds).',
  'variable': 'A labeled memory space in a program used to store and manipulate dynamic values (like sensor readings or counters).',
  'counter': 'A specific variable used to keep track of increments or occurrences of events in loops.',
  'Logical AND': 'A logical operation that returns true only if all of its comparison conditions are simultaneously true.',
  'Logical OR': 'A logical operation that returns true if at least one of its comparison conditions is true.',
  'Logical NOT': 'A logical operation that inverts a boolean value (turning true to false, and false to true).',
  'For Loop': 'A control structure used to repeat a block of code a specific, pre-determined number of times.',
  'While Loop': 'A control structure that continues to repeat a block of code as long as its specified condition remains true.',
  'nesting': 'The practice of placing one control structure (like an if statement or loop) inside another control structure.',
  'feedback control loop': 'A continuous system process that reads inputs, evaluates actions, and applies adjustments to match a desired target state automatically.'
};

/* ─── Browser Web Audio API sound chime synthesizer ─── */
const playSound = (type: 'correct' | 'incorrect') => {
  if (typeof window === 'undefined') return;
  const isMuted = localStorage.getItem('lecture_audio_muted') === 'true';
  if (isMuted) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    if (type === 'correct') {
      // High quality happy chime: C5 -> E5 -> G5
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else {
      // Soft low buzzer
      const now = ctx.currentTime;
      [150, 147].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.35);
      });
    }
  } catch (e) {
    console.warn('Audio Context initialization skipped or failed.', e);
  }
};

/* ─── Confetti Particle Canvas Shower ─── */
function ConfettiShower() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#14B8A6'];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Shooting particles up from bottom left and right
    for (let i = 0; i < 90; i++) {
      const fromLeft = Math.random() > 0.5;
      particles.push({
        x: fromLeft ? 0 : width,
        y: height,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (fromLeft ? 1 : -1) * (Math.random() * 9 + 4),
        speedY: -(Math.random() * 11 + 9),
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 12 - 6
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22; // Gravity simulation
        p.speedX *= 0.98; // Air resistance drag
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-[24px]" />;
}

/* ─── Callout Info/Warning Alert Box ─── */
function Callout({
  icon,
  children,
  bg = '#EFF6FF',
  border = '#BFDBFE',
  text = '#1E40AF',
}: {
  icon: string;
  children: React.ReactNode;
  bg?: string;
  border?: string;
  text?: string;
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-2xl px-5 py-4 text-xs md:text-sm shadow-sm transition-all duration-300 hover:shadow-md border-l-4"
      style={{ 
        background: bg, 
        borderTop: `1px solid ${border}`,
        borderRight: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        borderLeftColor: border,
        color: text 
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5 animate-bounce-slow">{icon}</span>
      <span className="leading-relaxed font-semibold">{children}</span>
    </div>
  );
}

/* ─── High-Fidelity 6 Bullet Icons ─── */
function BulletIcon({ styleIndex, color, blockIndex }: { styleIndex: number; color: string; blockIndex: number }) {
  switch (styleIndex) {
    case 0: // Glow Pinging Ring
      return (
        <div className="flex-shrink-0 mt-1 relative w-3.5 h-3.5 flex items-center justify-center">
          <span className="absolute w-2.5 h-2.5 rounded-full transition-all duration-300 animate-pulse" style={{ background: color }} />
          <span className="absolute w-3.5 h-3.5 rounded-full opacity-20 animate-ping" style={{ background: color }} />
        </div>
      );
    case 1: // Rotated Diamond
      return (
        <div className="flex-shrink-0 mt-1.5 relative w-2.5 h-2.5 flex items-center justify-center rotate-45 border border-white/20 transition-all duration-300 hover:rotate-90 shadow-sm" style={{ background: `linear-gradient(135deg, ${color}, #fff)` }}>
          <span className="absolute inset-0.5 rounded-[1px] bg-white opacity-80" />
        </div>
      );
    case 2: // Chevron Arrow
      return (
        <div className="flex-shrink-0 mt-1 text-xs font-black transition-transform duration-300 hover:translate-x-1" style={{ color }}>
          ➔
        </div>
      );
    case 3: // Sparkle Star
      return (
        <div className="flex-shrink-0 mt-1 text-sm animate-pulse-slow transition-transform hover:scale-125" style={{ color: '#F59E0B' }}>
          ★
        </div>
      );
    case 4: // High-Tech Hexagon
      return (
        <div className="flex-shrink-0 mt-1.5 w-2.5 h-2.5 flex items-center justify-center transition-all duration-300 hover:scale-110">
          <svg viewBox="0 0 100 100" className="w-2.5 h-2.5" fill={color}>
            <polygon points="50,1 95,25 95,75 50,99 5,75 5,25" />
          </svg>
        </div>
      );
    case 5: // Pill Step Number
    default:
      return (
        <span className="flex-shrink-0 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-black text-white leading-none shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: color }}>
          {(blockIndex + 1).toString().padStart(2, '0')}
        </span>
      );
  }
}

/* ─── Unified Bullet Item Picker ─── */
const getBulletStyleIndex = (text: string) => {
  let hash = 0;
  for (let j = 0; j < text.length; j++) {
    hash = text.charCodeAt(j) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 6; // Shuffled across 6 indices
};

function BulletItem({ 
  text, 
  blockIndex, 
  styleIndex,
  color, 
  highlightText 
}: { 
  text: string; 
  blockIndex: number; 
  styleIndex: number;
  color: string; 
  highlightText: (t: string) => React.ReactNode 
}) {
  return (
    <div className="flex items-start gap-3.5 pl-1 my-2.5 animate-fadeIn group">
      <BulletIcon styleIndex={styleIndex} color={color} blockIndex={blockIndex} />
      <span className="flex-1 leading-relaxed text-slate-700 transition-colors duration-200 group-hover:text-slate-900">
        {highlightText(text)}
      </span>
    </div>
  );
}

/* ─── Code Block with Copy Button ─── */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };
  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-slate-700/40 shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            {lang || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200 flex items-center gap-1.5 active:scale-95"
        >
          {copied ? '✓ Copied!' : '⎘ Copy'}
        </button>
      </div>
      <pre className="px-5 py-4 bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

/* ─── Reveal / Spoiler Block ─── */
function RevealBlock({ question, answer, accentColor }: { question: string; answer: string; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div
      className="my-4 rounded-2xl border overflow-hidden animate-fadeIn"
      style={{ borderColor: accentColor + '35' }}
    >
      <button
        type="button"
        onClick={() => setRevealed(r => !r)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200"
        style={{ background: accentColor + '0E' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">🔍</span>
          <span className="text-xs md:text-sm font-bold text-slate-700 leading-snug">{question}</span>
        </div>
        <span
          className="ml-3 flex-shrink-0 text-[10px] font-black px-3 py-1 rounded-full text-white transition-all duration-300"
          style={{ background: revealed ? '#10B981' : accentColor }}
        >
          {revealed ? 'Hide ▲' : 'Reveal ▼'}
        </span>
      </button>
      {revealed && (
        <div
          className="px-5 py-4 border-t text-xs md:text-sm text-slate-700 leading-relaxed font-medium animate-slideDown flex items-start gap-3"
          style={{ borderColor: accentColor + '25', background: accentColor + '05' }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <span>{answer}</span>
        </div>
      )}
    </div>
  );
}


/* ─── Preprocessed Render Type for Side-by-Side Comparison Grid ─── */
type RenderItem = 
  | { type: 'block'; block: LectureBlock; blockIndex: number }
  | { 
      type: 'list'; 
      bullets: Array<{ text: string; blockIndex: number }>;
      styleIndex: number;
    }
  | { 
      type: 'comparison'; 
      leftTitle: string; 
      leftBullets: Array<{ text: string; blockIndex: number }>;
      leftStyleIndex: number;
      rightTitle: string; 
      rightBullets: Array<{ text: string; blockIndex: number }>;
      rightStyleIndex: number;
    };

/* ─── Collapsible Panel Section ─── */
interface SectionProps {
  sec: LectureSection;
  isRead: boolean;
  onToggleRead: () => void;
}

function SectionCard({ sec, isRead, onToggleRead }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // High-fidelity rich glossary highlighting
  const highlightText = (text: string) => {
    const terms = Object.keys(GLOSSARY);
    terms.sort((a, b) => b.length - a.length); // Match longer strings first

    let processed = text;
    terms.forEach(term => {
      const definition = GLOSSARY[term].replace(/"/g, '&quot;');
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      // Must be a single line with no raw newlines or leading space padding to avoid breaking colons
      processed = processed.replace(regex, `<span class="glossary-term cursor-help border-b border-dashed border-indigo-400 hover:border-indigo-600 transition-colors font-bold text-slate-800">$1<span class="tooltip-text"><strong class="block text-indigo-300 font-extrabold text-[11px] mb-1">$1</strong>${definition}</span></span>`);
    });

    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  // Preprocess blocks to group consecutive comparison lists and normal bullet lists
  const preprocessBlocks = (blocks: LectureBlock[]): RenderItem[] => {
    const items: RenderItem[] = [];
    let i = 0;
    
    while (i < blocks.length) {
      const block = blocks[i];
      const textClean = block.text.trim().toLowerCase();
      
      // Look for negative counterpart (Without, Before, Instead, Option A, Incorrect, Poor)
      const isLeftHeader = 
        (block.type === 'bullet' || block.type === 'paragraph') &&
        (textClean.startsWith('without') || 
         textClean.startsWith('before') ||
         textClean.startsWith('instead') ||
         textClean.startsWith('option a') ||
         textClean.startsWith('incorrect') ||
         textClean.startsWith('poor'));

      if (isLeftHeader) {
        // Collect bullets belonging to the left side
        const leftTitle = block.text.trim();
        const leftBullets: Array<{ text: string; blockIndex: number }> = [];
        let j = i + 1;
        while (
          j < blocks.length && 
          blocks[j].type === 'bullet' && 
          !blocks[j].text.trim().toLowerCase().startsWith('with') &&
          !blocks[j].text.trim().toLowerCase().startsWith('after') &&
          !blocks[j].text.trim().toLowerCase().startsWith('option b') &&
          !blocks[j].text.trim().toLowerCase().startsWith('correct') &&
          !blocks[j].text.trim().toLowerCase().startsWith('better') &&
          !blocks[j].text.trim().endsWith(':')
        ) {
          leftBullets.push({ text: blocks[j].text, blockIndex: j });
          j++;
        }
        
        // Check if there is a direct positive counterpart following (With, After, Option B, Correct, Better)
        if (j < blocks.length) {
          const nextBlock = blocks[j];
          const nextTextClean = nextBlock.text.trim().toLowerCase();
          
          const isRightHeader = 
            (nextBlock.type === 'bullet' || nextBlock.type === 'paragraph') &&
            (nextTextClean.startsWith('with') || 
             nextTextClean.startsWith('after') ||
             nextTextClean.startsWith('option b') ||
             nextTextClean.startsWith('correct') ||
             nextTextClean.startsWith('better'));

          if (isRightHeader) {
            const rightTitle = nextBlock.text.trim();
            const rightBullets: Array<{ text: string; blockIndex: number }> = [];
            let k = j + 1;
            while (k < blocks.length && blocks[k].type === 'bullet' && !blocks[k].text.trim().endsWith(':')) {
              rightBullets.push({ text: blocks[k].text, blockIndex: k });
              k++;
            }
            
            // If both sides have bullets, form a comparison group
            if (leftBullets.length > 0 || rightBullets.length > 0) {
              const leftStyleIndex = leftBullets.length > 0 ? getBulletStyleIndex(leftBullets[0].text) : 0;
              const rightStyleIndex = rightBullets.length > 0 ? getBulletStyleIndex(rightBullets[0].text) : 1;

              items.push({
                type: 'comparison',
                leftTitle,
                leftBullets,
                leftStyleIndex,
                rightTitle,
                rightBullets,
                rightStyleIndex
              });
              i = k;
              continue;
            }
          }
        }
      }
      
      // Group consecutive standard bullets
      if (block.type === 'bullet') {
        const bullets: Array<{ text: string; blockIndex: number }> = [];
        let j = i;
        while (j < blocks.length && blocks[j].type === 'bullet') {
          bullets.push({ text: blocks[j].text, blockIndex: j });
          j++;
        }
        
        const styleIndex = bullets.length > 0 ? getBulletStyleIndex(bullets[0].text) : 0;
        items.push({
          type: 'list',
          bullets,
          styleIndex
        });
        
        i = j;
        continue;
      }

      items.push({ type: 'block', block, blockIndex: i });
      i++;
    }
    
    return items;
  };

  const currentThemeColor = isRead ? '#10B981' : sec.accent;
  const subtleThemeBg = currentThemeColor + '08'; 
  const subtleThemeBorder = currentThemeColor + '22';

  const preprocessedItems = preprocessBlocks(sec.blocks || []);

  // Comparison Grid Builder
  const renderComparison = (
    leftTitle: string, 
    leftBullets: Array<{ text: string; blockIndex: number }>,
    leftStyleIndex: number,
    rightTitle: string, 
    rightBullets: Array<{ text: string; blockIndex: number }>,
    rightStyleIndex: number
  ) => {
    const isLeftNegative = leftTitle.toLowerCase().includes('without') || leftTitle.toLowerCase().includes('poor') || leftTitle.toLowerCase().includes('incorrect') || leftTitle.toLowerCase().includes('instead');
    const isRightPositive = rightTitle.toLowerCase().includes('with') || rightTitle.toLowerCase().includes('correct') || rightTitle.toLowerCase().includes('better');

    const leftAccent = isLeftNegative ? '#EF4444' : '#64748B'; 
    const rightAccent = isRightPositive ? '#10B981' : currentThemeColor; 

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6 animate-fadeIn">
        {/* Left Card: Negatives / Comparative baseline */}
        <div 
          className="rounded-2xl border p-5 transition-all duration-300 hover:shadow-md"
          style={{ 
            borderColor: leftAccent + '22',
            background: leftAccent + '04',
            borderTop: `4px solid ${leftAccent}`
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{isLeftNegative ? '⚠️' : '📌'}</span>
            <h3 className="font-extrabold text-xs md:text-sm text-slate-800 uppercase tracking-wider">
              {leftTitle.replace(/:$/, '')}
            </h3>
          </div>
          <div className="space-y-1">
            {leftBullets.map(b => (
              <BulletItem 
                key={b.blockIndex} 
                text={b.text} 
                blockIndex={b.blockIndex} 
                styleIndex={leftStyleIndex}
                color={leftAccent} 
                highlightText={highlightText} 
              />
            ))}
          </div>
        </div>

        {/* Right Card: Positives / Better Approach */}
        <div 
          className="rounded-2xl border p-5 transition-all duration-300 hover:shadow-md"
          style={{ 
            borderColor: rightAccent + '22',
            background: rightAccent + '04',
            borderTop: `4px solid ${rightAccent}`
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{isRightPositive ? '✨' : '🔥'}</span>
            <h3 className="font-extrabold text-xs md:text-sm text-slate-800 uppercase tracking-wider">
              {rightTitle.replace(/:$/, '')}
            </h3>
          </div>
          <div className="space-y-1">
            {rightBullets.map(b => (
              <BulletItem 
                key={b.blockIndex} 
                text={b.text} 
                blockIndex={b.blockIndex} 
                styleIndex={rightStyleIndex}
                color={rightAccent} 
                highlightText={highlightText} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md"
      style={{ 
        borderLeft: `6px solid ${currentThemeColor}`,
        boxShadow: isOpen ? '0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02)' : 'none'
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        style={{ 
          background: isOpen ? subtleThemeBg : 'transparent',
          borderBottom: isOpen ? `1px solid ${subtleThemeBorder}` : 'none'
        }}
        className="w-full flex items-center gap-3.5 px-6 py-5 text-left hover:bg-slate-50/50 transition-all duration-300"
      >
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm transition-all duration-500"
          style={{ 
            background: currentThemeColor,
            transform: isRead ? 'scale(1.08) rotate(360deg)' : 'none'
          }}
        >
          {isRead ? '✓' : sec.number}
        </span>
        <span className="text-lg flex-shrink-0 transition-transform duration-300 hover:scale-125">{sec.icon}</span>
        <span className="flex-1 font-extrabold text-[#2E4862] text-sm md:text-base leading-snug">
          {sec.title}
        </span>
        <span className="text-slate-400 text-xs md:text-sm font-black transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-5 text-xs md:text-sm text-slate-600 leading-relaxed space-y-4 animate-slideDown">
          {preprocessedItems.map((item, idx) => {
            const stagger = { animationDelay: `${idx * 45}ms`, animationFillMode: 'forwards' as const, opacity: 0 };

            if (item.type === 'comparison') {
              return (
                <div key={idx} className="animate-fadeIn" style={stagger}>
                  {renderComparison(
                    item.leftTitle, item.leftBullets, item.leftStyleIndex,
                    item.rightTitle, item.rightBullets, item.rightStyleIndex
                  )}
                </div>
              );
            }

            if (item.type === 'list') {
              return (
                <div key={idx} className="space-y-1 animate-fadeIn" style={stagger}>
                  {item.bullets.map(b => (
                    <BulletItem
                      key={b.blockIndex}
                      text={b.text}
                      blockIndex={b.blockIndex}
                      styleIndex={item.styleIndex}
                      color={currentThemeColor}
                      highlightText={highlightText}
                    />
                  ))}
                </div>
              );
            }

            const { block, blockIndex } = item;

            if (block.type === 'code') {
              return (
                <div key={idx} className="animate-fadeIn" style={stagger}>
                  <CodeBlock code={block.text} lang={block.lang || 'code'} />
                </div>
              );
            }

            if (block.type === 'reveal') {
              return (
                <div key={idx} className="animate-fadeIn" style={stagger}>
                  <RevealBlock
                    question={block.question || 'Think about this...'}
                    answer={block.text}
                    accentColor={currentThemeColor}
                  />
                </div>
              );
            }

            if (block.type === 'paragraph') {
              return (
                <p
                  key={idx}
                  className={`leading-relaxed animate-fadeIn ${block.isSubheading ? 'font-black text-[#2E4862] text-sm md:text-base mt-6 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2' : 'text-slate-600'}`}
                  style={stagger}
                >
                  {block.isSubheading && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: currentThemeColor }} />}
                  {highlightText(block.text)}
                </p>
              );
            }
            if (block.type === 'callout') {
              return (
                <div key={idx} className="my-4 animate-fadeIn" style={stagger}>
                  <Callout icon={block.icon || '💡'} bg={block.bg} border={block.border} text={block.textColor}>
                    {block.text}
                  </Callout>
                </div>
              );
            }
            if (block.type === 'image') {
              return (
                <div key={idx} className="my-6 rounded-3xl overflow-hidden border border-slate-100 shadow-md max-w-xl mx-auto bg-slate-50 transition-all duration-300 hover:scale-[1.015] hover:shadow-lg animate-fadeIn relative group" style={stagger}>
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <img src={block.text} alt="Step illustration" className="w-full object-contain max-h-80 mx-auto" />
                </div>
              );
            }
            return null;
          })}

          {sec.images && sec.images.length > 0 && (
            <div className="space-y-4 my-6 max-w-xl mx-auto animate-fadeIn">
              {sec.images.map((imgUrl, imgIdx) => (
                <div key={imgIdx} className="rounded-3xl overflow-hidden border border-slate-100 shadow-md bg-slate-50 transition-all duration-300 hover:scale-[1.015] hover:shadow-lg relative group">
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <img src={imgUrl} alt={`${sec.title} - ${imgIdx + 1}`} className="w-full object-contain max-h-80 mx-auto" />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-end border-t border-slate-50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead();
              }}
              className="text-xs px-5 py-2.5 rounded-full border font-bold shadow-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/20"
              style={{
                backgroundColor: isRead ? '#10B981' : undefined,
                color: isRead ? '#FFFFFF' : undefined,
                borderColor: isRead ? '#10B981' : undefined
              }}
            >
              {isRead ? '✓ Completed Section' : 'Mark Section as Read'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Interactive Quiz Box ─── */
function QuizCard({ quiz, onQuizComplete }: { quiz: QuizQuestion[], onQuizComplete?: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMuted(localStorage.getItem('lecture_audio_muted') === 'true');
    }
  }, []);

  const toggleMuted = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    localStorage.setItem('lecture_audio_muted', String(nextMuted));
  };

  const pick = (qIdx: number, oIdx: number) => {
    if (revealed[qIdx]) return;
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const check = (qIdx: number) => {
    if (answers[qIdx] === undefined) return;
    const isCorrect = answers[qIdx] === quiz[qIdx].correct;
    playSound(isCorrect ? 'correct' : 'incorrect');
    setRevealed(prev => {
      const next = { ...prev, [qIdx]: true };
      
      // Calculate score based on new state
      const nextScore = Object.entries(next).filter(
        ([idx, done]) => done && answers[Number(idx)] === quiz[Number(idx)].correct
      ).length;
      
      if (Object.keys(next).length === quiz.length) {
        onQuizComplete?.(nextScore);
      }
      
      return next;
    });
  };

  const score = Object.entries(revealed).filter(
    ([idx, done]) => done && answers[Number(idx)] === quiz[Number(idx)].correct
  ).length;

  const allDone = Object.keys(revealed).length === quiz.length;
  const hasMissed = allDone && score < quiz.length;

  const retryMissed = () => {
    const missedIndices = quiz.reduce<number[]>((acc, _, i) => {
      if (revealed[i] && answers[i] !== quiz[i].correct) acc.push(i);
      return acc;
    }, []);
    const newRevealed = { ...revealed };
    const newAnswers = { ...answers };
    const newHints = { ...showHints };
    missedIndices.forEach(i => {
      delete newRevealed[i];
      delete newAnswers[i];
      delete newHints[i];
    });
    setRevealed(newRevealed);
    setAnswers(newAnswers);
    setShowHints(newHints);
  };

  return (
    <div className="rounded-3xl border border-indigo-50 bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl animate-pulse">🧠</span>
          <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-indigo-600">
            Quick Comprehension Check
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMuted}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-lg text-sm flex items-center justify-center"
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {allDone && (
            <span className="bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-md shadow-emerald-100 animate-bounce">
              Score: {score}/{quiz.length}
            </span>
          )}
        </div>
      </div>

      {quiz.map((q, qIdx) => {
        const chosen = answers[qIdx];
        const done = revealed[qIdx];
        const correct = q.correct;

        return (
          <div key={qIdx} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5 md:p-6 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-500 mt-0.5">
                {qIdx + 1}
              </span>
              <p className="font-extrabold text-[#2E4862] text-sm md:text-base leading-snug">
                {q.question}
              </p>
            </div>

            {/* Hint button — only before answering */}
            {q.hint && !done && (
              <div className="pl-9">
                {showHints[qIdx] ? (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 animate-fadeIn">
                    <span className="flex-shrink-0 mt-0.5">💡</span>
                    <span className="font-semibold leading-relaxed">{q.hint}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHints(prev => ({ ...prev, [qIdx]: true }))}
                    className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1.5 transition-colors duration-200 underline underline-offset-2 decoration-dashed"
                  >
                    💡 Show Hint
                  </button>
                )}
              </div>
            )}

            <div className="grid gap-3 pl-9">
              {q.options.map((opt, oIdx) => {
                const choiceLetter = String.fromCharCode(65 + oIdx);
                let choiceStyle = 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30';
                let pillStyle = 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600';

                if (done) {
                  if (oIdx === correct) {
                    choiceStyle = 'border-2 border-emerald-500 bg-emerald-50/60 text-emerald-800 font-extrabold shadow-sm shadow-emerald-50';
                    pillStyle = 'bg-emerald-500 text-white';
                  } else if (oIdx === chosen) {
                    choiceStyle = 'border-2 border-rose-500 bg-rose-50/60 text-rose-800';
                    pillStyle = 'bg-rose-500 text-white';
                  } else {
                    choiceStyle = 'border border-slate-150 bg-white text-slate-450 opacity-50';
                    pillStyle = 'bg-slate-100 text-slate-400';
                  }
                } else if (oIdx === chosen) {
                  choiceStyle = 'border-2 border-indigo-600 bg-indigo-50 text-indigo-800 font-extrabold shadow-sm shadow-indigo-50';
                  pillStyle = 'bg-indigo-600 text-white';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => pick(qIdx, oIdx)}
                    disabled={done}
                    className={`group w-full text-left rounded-2xl px-4 py-3 text-xs md:text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3.5 ${choiceStyle}`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-all duration-300 ${pillStyle}`}>
                      {choiceLetter}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="pl-9">
              {!done ? (
                <button
                  type="button"
                  onClick={() => check(qIdx)}
                  disabled={chosen === undefined}
                  className="text-xs font-black px-5 py-2.5 rounded-xl bg-[#2E4862] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-sm shadow-slate-100 hover:bg-[#1E3042] hover:scale-[1.03] hover:shadow-md"
                >
                  Verify Answer 🔍
                </button>
              ) : (
                <div className="mt-3 animate-fadeIn">
                  <Callout
                    icon={chosen === correct ? '🎉' : '💡'}
                    bg={chosen === correct ? '#ECFDF5' : '#FEF2F2'}
                    border={chosen === correct ? '#10B981' : '#EF4444'}
                    text={chosen === correct ? '#065F46' : '#991B1B'}
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-sm">{chosen === correct ? 'Correct! Excellent reasoning.' : "Incorrect. Let's learn why:"}</p>
                      <p className="text-xs leading-relaxed opacity-95 font-semibold">{q.explanation}</p>
                    </div>
                  </Callout>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Retry missed questions */}
      {hasMissed && (
        <div className="flex justify-center pt-2 animate-fadeIn">
          <button
            type="button"
            onClick={retryMissed}
            className="text-xs font-black px-6 py-3 rounded-xl border-2 border-rose-400 text-rose-600 hover:bg-rose-50 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2"
          >
            🔁 Retry {quiz.length - score} Missed Question{quiz.length - score > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function InteractiveLecture({ levelId, lessonId, stepId }: InteractiveLectureProps) {
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  const key = `${levelId}-${lessonId}-${stepId}`;
  const lecture = LECTURES_STRUCTURED_DATA[key];

  const renderMarkdownInline = (text: string) => {
    if (!text) return '';
    const processed = text
      .replace(/^#+\s*/, '')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[90%]">$1</code>');
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  };

  // Reset and fetch progress when step changes
  useEffect(() => {
    let currentUser: any = null;
    
    supabase.auth.getUser().then(({ data }) => {
      currentUser = data.user;
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch saved progress
        supabase.from('user_progress').select('read_sections').match({
          user_id: currentUser.id,
          level_id: levelId.toString(),
          lesson_id: lessonId,
          step_id: stepId
        }).single().then(({ data, error }) => {
          if (data && data.read_sections) {
            setProgress(new Set(data.read_sections));
          } else {
            setProgress(new Set());
          }
        });
      } else {
        setProgress(new Set());
      }
    });
  }, [key]);

  if (!lecture) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center p-6 bg-white border rounded-2xl shadow-sm max-w-sm">
          <span className="text-4xl">📚</span>
          <h2 className="mt-4 font-bold text-slate-800">No structured lecture found</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            There is no structured lecture for level {levelId} lesson {lessonId} ({stepId}).
          </p>
        </div>
      </div>
    );
  }

  // Calculate estimated reading time dynamically based on word count
  const wordCount = lecture.sections.reduce((acc, sec) => {
    let count = sec.title.split(/\s+/).length;
    sec.blocks.forEach(b => {
      if (b.type === 'paragraph' || b.type === 'bullet' || b.type === 'callout') {
        count += b.text.split(/\s+/).length;
      }
    });
    return acc;
  }, 0);
  const readTime = Math.max(1, Math.round(wordCount / 180)); // 180 Words per minute for learners

  const totalSections = lecture.sections.length;
  const pct = totalSections > 0 ? Math.round((progress.size / totalSections) * 100) : 0;
  const allRead = progress.size === totalSections;

  const toggleRead = (idx: number) => {
    setProgress(prev => {
      const next = new Set(prev);
      const isNewlyRead = !next.has(idx);
      isNewlyRead ? next.add(idx) : next.delete(idx);

      if (isNewlyRead && idx + 1 < totalSections) {
        setTimeout(() => {
          const nextEl = document.getElementById(`section-${idx + 1}`);
          if (nextEl) {
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      
      // Save to Supabase asynchronously
      console.log(next);
      // Save to Supabase asynchronously
if (user) {
  supabase
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        level_id: levelId.toString(),
        lesson_id: lessonId,
        step_id: stepId,
        read_sections: Array.from(next),
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id,level_id,lesson_id,step_id'
      }
    )
    .then(({ error }) => {
      if (error) {
        console.error('Failed to save progress:', error);
      }
    });
}

      return next;
    });
  };

  const getContextualSubtitle = () => {
    const t = lecture.stepType.toLowerCase();
    if (t.includes('intro')) return 'Build your mental model of this topic.';
    if (t.includes('concept')) return 'Deepen your understanding with structured theory.';
    if (t.includes('explore') || t.includes('exploration')) return 'Experiment and observe how things work.';
    if (t.includes('mapping')) return 'Connect block logic to real hardware.';
    return 'Follow each collapsible step, read carefully, and test your comprehension!';
  };

  // Hero Card gradient based on Level ID
  const getHeroGradient = () => {
    const l = Number(levelId);
    if (l === 1) return 'from-indigo-600 to-indigo-800';
    if (l === 2) return 'from-emerald-600 to-emerald-800';
    if (l === 3) return 'from-amber-600 to-amber-800';
    return 'from-rose-600 to-rose-800';
  };

  return (
    <div className="min-h-full bg-slate-50/50 pb-16 relative">
      {/* ── Sticky Mini Progress Bar ── */}
      <div className="sticky top-0 left-0 right-0 h-1.5 bg-slate-200 z-50 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-700 ease-out" 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite ease-in-out; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse-slow { animation: pulse-slow 2s infinite ease-in-out; }
        
        /* Premium Glossary Tooltips */
        .glossary-term {
          position: relative;
          display: inline-block;
        }
        .glossary-term .tooltip-text {
          visibility: hidden;
          width: 240px;
          background-color: #1E293B;
          color: #F8FAFC;
          text-align: left;
          border-radius: 12px;
          padding: 12px 14px;
          position: absolute;
          z-index: 50;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          opacity: 0;
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 11px;
          line-height: 1.45;
          font-weight: 500;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          border: 1px solid #334155;
        }
        .glossary-term:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      {/* ── Hero Header Card ── */}
      <div className={`mb-6 rounded-[32px] bg-gradient-to-br ${getHeroGradient()} px-8 py-8 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-16 translate-x-16 pointer-events-none blur-sm" />
        <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-white/5 translate-y-12 -translate-x-12 pointer-events-none blur-sm" />
        
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/80">
            Level {levelId} · Lesson {lessonId} · {renderMarkdownInline(lecture.stepType)}
          </p>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">
            ⏱️ {readTime} min read
          </span>
        </div>
        
        <h1 className="text-xl md:text-3xl font-black mb-2 leading-tight text-white flex items-center gap-2 drop-shadow-sm">
          {renderMarkdownInline(lecture.levelTitle)}
        </h1>
        <p className="text-xs md:text-sm text-white/90 max-w-xl leading-relaxed font-medium">
          {getContextualSubtitle()}
        </p>

        {/* Dynamic Progress Indicator */}
        <div className="mt-7 max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-xs font-black text-white mb-2">
            <span>Lesson Reading Progress</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/20 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Collapsible Sections List ── */}
      <div className="space-y-4 mb-6">
        {lecture.sections.map((sec, idx) => (
          <div key={idx} id={`section-${idx}`}>
            <SectionCard
              sec={sec}
              isRead={progress.has(idx)}
              onToggleRead={() => toggleRead(idx)}
            />
          </div>
        ))}
      </div>

      {/* ── Interactive Quiz Section ── */}
      {lecture.quiz && lecture.quiz.length > 0 && (
        <div className="mb-6 animate-fadeIn">
          <QuizCard 
            quiz={lecture.quiz} 
            onQuizComplete={(score) => {
              if (user) {
                supabase.from('user_progress').update({ quiz_score: score }).match({
                  user_id: user.id,
                  level_id: levelId.toString(),
                  lesson_id: lessonId,
                  step_id: stepId
                }).then(({ error }) => {
                  if (error) console.error('Failed to save quiz score:', error);
                });
              }
            }}
          />
        </div>
      )}

      {/* ── Congratulations Complete Banner ── */}
      {allRead && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-500 p-8 text-white text-center shadow-lg animate-fadeIn shadow-emerald-100 flex flex-col items-center justify-center relative overflow-hidden">
          <ConfettiShower />
          <div className="text-5xl mb-3 animate-bounce relative z-10">🎉</div>
          <h2 className="text-xl md:text-2xl font-black leading-snug relative z-10">Level complete! Amazing effort!</h2>
          <p className="text-xs md:text-sm text-emerald-50 mt-1.5 max-w-md leading-relaxed font-semibold relative z-10">
            You have marked all {totalSections} sections of this lesson as read. Click the <strong>Next →</strong> button in the sidebar to advance to your next task!
          </p>
        </div>
      )}
    </div>
  );
}
