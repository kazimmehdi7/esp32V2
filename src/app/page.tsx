'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   BUILD MIND Premium Landing Page
   Fonts: Space Grotesk (display) · Inter (body) · JetBrains Mono (mono)
   Every interactive element routes to /signup (login + signup live there).
   ════════════════════════════════════════════════════════════════════════ */

// ─── Reveal on scroll ────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = 'up' }: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const t: Record<string, string> = { up: 'translateY(36px)', left: 'translateX(-40px)', right: 'translateX(40px)', none: 'none' };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : t[direction],
      transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─── Counter ─────────────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let s = 0;
    const step = Math.ceil(target / 60);
    const id = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(id); } else setCount(s); }, 20);
    return () => clearInterval(id);
  }, [started, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'inline-block', animation: `${reverse ? 'marqueeR' : 'marquee'} 50s linear infinite` }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '0 28px', fontSize: 11, fontWeight: 500,
            color: 'rgba(240,244,255,0.45)', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Wire-it-up stepper (the headline Activities feature) ─────────────────────
const WIRE_STEPS = [
  { from: 'DHT11 · VCC', to: 'ESP32 · 3V3', color: '#ef4444', note: 'Power the sensor from the 3.3V rail.' },
  { from: 'DHT11 · GND', to: 'ESP32 · GND', color: '#64748b', note: 'Common ground. Always connect this second.' },
  { from: 'DHT11 · DATA', to: 'ESP32 · IO4', color: '#f59e0b', note: 'Data line. Add a 10kΩ pullup resistor here.' },
  { from: 'HC-SR04 · TRIG', to: 'ESP32 · IO12', color: '#3b82f6', note: 'Trigger pin fires the ultrasonic pulse.' },
  { from: 'HC-SR04 · ECHO', to: 'ESP32 · IO13', color: '#8b5cf6', note: 'Echo returns the reflected signal timing.' },
];

function WireItUp({ go }: { go: () => void }) {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setStep(p => (p + 1) % WIRE_STEPS.length), 2600);
    return () => clearInterval(id);
  }, [auto]);
  const next = () => { setAuto(false); setStep(p => (p + 1) % WIRE_STEPS.length); };
  const prev = () => { setAuto(false); setStep(p => (p - 1 + WIRE_STEPS.length) % WIRE_STEPS.length); };
  const cur = WIRE_STEPS[step];

  const padPositions = [
    { y: 56, label: '3V3' }, { y: 78, label: 'GND' }, { y: 100, label: 'IO4' },
    { y: 122, label: 'IO12' }, { y: 144, label: 'IO13' },
  ];

  return (
    <div style={{ background: '#030609', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.12)', boxShadow: '0 32px 80px rgba(0,0,0,.65)' }}>
      <div style={{ background: '#04080f', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
        <span style={{ marginLeft: 10, fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.18)' }}>wire-it-up · guided connection</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(59,130,246,0.7)' }}>STEP {step + 1}/{WIRE_STEPS.length}</span>
      </div>

      <div style={{ padding: 20 }}>
        {/* Animated SVG diagram */}
        <svg viewBox="0 0 360 200" style={{ width: '100%', marginBottom: 16, borderRadius: 12, background: 'linear-gradient(135deg,#050e1c,#071524)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <defs>
            <filter id="wig"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* ESP32 board */}
          <rect x="230" y="34" width="96" height="140" rx="8" fill="#071c33" stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
          <text x="278" y="50" fill="rgba(59,130,246,0.55)" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">ESP32-WROOM</text>
          {padPositions.map((p, i) => {
            const activeTarget = i === step;
            return (
              <g key={i}>
                <rect x="230" y={p.y} width="14" height="9" rx="2"
                  fill={activeTarget ? 'rgba(59,130,246,0.3)' : '#13263d'}
                  stroke={activeTarget ? '#3b82f6' : 'rgba(59,130,246,0.25)'} strokeWidth={activeTarget ? 1.2 : 0.5}
                  style={{ transition: 'all .4s' }} />
                <text x="252" y={p.y + 6.5} fill={activeTarget ? '#93c5fd' : 'rgba(147,197,253,0.4)'} fontSize="6" fontFamily="JetBrains Mono,monospace" style={{ transition: 'fill .4s' }}>{p.label}</text>
              </g>
            );
          })}

          {/* Sensor block */}
          <rect x="26" y="60" width="78" height="88" rx="7" fill="#04111f" stroke="rgba(245,158,11,0.22)" strokeWidth="1" />
          <text x="65" y="80" fill="rgba(245,158,11,0.7)" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">SENSOR</text>
          {WIRE_STEPS.map((w, i) => (
            <g key={i}>
              <circle cx="104" cy={92 + i * 11} r={i === step ? 3.4 : 2.4}
                fill={w.color} opacity={i === step ? 1 : 0.35}
                filter={i === step ? 'url(#wig)' : undefined} style={{ transition: 'all .4s' }} />
            </g>
          ))}

          {/* Active wire */}
          <path
            d={`M104,${92 + step * 11} C 160,${92 + step * 11} 175,${padPositions[step].y + 4.5} 230,${padPositions[step].y + 4.5}`}
            stroke={cur.color} strokeWidth="2.2" fill="none"
            className="flow-wire" filter="url(#wig)" key={step} />
          {/* Faded prior wires */}
          {WIRE_STEPS.slice(0, step).map((w, i) => (
            <path key={i}
              d={`M104,${92 + i * 11} C 160,${92 + i * 11} 175,${padPositions[i].y + 4.5} 230,${padPositions[i].y + 4.5}`}
              stroke={w.color} strokeWidth="1.4" fill="none" opacity="0.28" />
          ))}
        </svg>

        {/* Instruction card */}
        <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '14px 16px', minHeight: 92 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cur.color, boxShadow: `0 0 8px ${cur.color}` }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', fontFamily: '"JetBrains Mono",monospace' }}>{cur.from}</span>
            <span style={{ color: 'rgba(240,244,255,0.55)' }}>→</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: cur.color, fontFamily: '"JetBrains Mono",monospace' }}>{cur.to}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'rgba(240,244,255,0.5)', lineHeight: 1.6, margin: 0 }}>{cur.note}</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <button onClick={prev} style={ctrlBtn}>‹ Back</button>
          <div style={{ display: 'flex', gap: 5, flex: 1, justifyContent: 'center' }}>
            {WIRE_STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 99, background: i === step ? cur.color : 'rgba(255,255,255,0.12)', transition: 'all .3s', display: 'block' }} />
            ))}
          </div>
          {step === WIRE_STEPS.length - 1
            ? <button onClick={go} style={{ ...ctrlBtn, color: '#fff', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', border: 'none' }}>Build it →</button>
            : <button onClick={next} style={{ ...ctrlBtn, color: '#fff', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', border: 'none' }}>Next ›</button>}
        </div>
      </div>
    </div>
  );
}

const ctrlBtn: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
  color: 'rgba(240,244,255,0.7)', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', cursor: 'none',
  fontFamily: '"Inter",sans-serif', transition: 'all .2s',
};

// ─── Kit data ─────────────────────────────────────────────────────────────────
const KIT_CATEGORIES = [
  { label: 'Microcontrollers', color: '#3b82f6', items: [{ name: 'ESP32 WROOM-32', qty: 1 }, { name: 'ESP32-CAM with OV2640', qty: 1 }] },
  { label: 'Sensors', color: '#10b981', items: [
    { name: 'DHT11 Temp & Humidity', qty: 1 }, { name: 'Ultrasonic HC-SR04', qty: 1 },
    { name: 'PIR Motion Sensor', qty: 1 }, { name: 'Soil Moisture Sensor', qty: 1 },
    { name: 'Sound Sensor', qty: 1 }, { name: 'Infrared Receiver', qty: 1 },
    { name: 'Photoresistor', qty: 1 }, { name: 'Thermistor', qty: 1 }, { name: 'Joystick', qty: 1 },
  ] },
  { label: 'Displays', color: '#8b5cf6', items: [
    { name: 'LCD 1602', qty: 1 }, { name: '0.96 inch OLED', qty: 1 },
    { name: '7-Segment Display', qty: 2 }, { name: 'Max7219 8x8 Dot Matrix', qty: 1 },
  ] },
  { label: 'Actuators', color: '#ef4444', items: [
    { name: '9G Servo Motor', qty: 1 }, { name: 'DC Motor + Fan', qty: 1 },
    { name: 'Stepping Motor + ULN2003', qty: 1 }, { name: 'Water Pump', qty: 1 },
    { name: 'Active Buzzer', qty: 1 }, { name: 'Passive Buzzer', qty: 1 }, { name: 'Relay Module', qty: 1 },
  ] },
  { label: 'Components', color: '#f59e0b', items: [
    { name: 'Breadboard', qty: 1 }, { name: 'RGB LED', qty: 1 }, { name: 'LEDs x5 each color', qty: 25 },
    { name: 'RFID RC522 Reader', qty: 1 }, { name: '4x4 Membrane Keypad', qty: 1 },
    { name: 'Push Buttons', qty: 5 }, { name: 'Potentiometer', qty: 1 },
    { name: 'Micro SD Card Reader', qty: 1 }, { name: 'Jumper Wires', qty: 80 },
    { name: 'Resistors 10 values', qty: 80 }, { name: 'Organizer Box', qty: 1 },
  ] },
];

const MARQUEE_ITEMS = ['ESP32 WROOM-32', 'DHT11 Sensor', 'OLED Display', 'Servo Motor', 'Ultrasonic Sensor', 'RFID Reader', 'DC Motor', 'LCD 1602', 'PIR Motion Sensor', 'Soil Moisture', 'Sound Sensor', 'Dot Matrix', 'Water Pump', 'Membrane Keypad', 'ESP32-CAM', 'Stepping Motor'];

const FEATURES = [
  { label: 'Block Coding', color: '#3b82f6' },
  { label: 'Live Simulator', color: '#14b8a6' },
  { label: 'Wire It Up', color: '#8b5cf6' },
  { label: 'Flash to ESP32', color: '#ef4444' },
  { label: 'AI Assistant', color: '#f59e0b' },
];

const SERIAL_TEMPS = ['22.4', '23.1', '24.2', '24.8', '23.5', '22.9', '24.1', '25.0'];
const SERIAL_HUMS = ['58', '57', '55', '53', '56', '59', '54', '52'];
const SERIAL_DISTS = ['18', '20', '22', '15', '25', '19', '21', '17'];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const go = () => router.push('/login');            // ← single funnel: everything → /signup

  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [kitTab, setKitTab] = useState(0);
  const [serialLines, setSerialLines] = useState([
    '> T:22.4°C  H:58%  D:18cm',
    '> T:23.1°C  H:57%  D:20cm',
    '> T:24.2°C  H:55%  D:22cm',
  ]);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const ringRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [cursorBig, setCursorBig] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; setMousePos({ x: e.clientX, y: e.clientY }); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  useEffect(() => {
    const animate = () => {
      ringRef.current.x += (mouseRef.current.x - ringRef.current.x) * 0.12;
      ringRef.current.y += (mouseRef.current.y - ringRef.current.y) * 0.12;
      setRingPos({ x: ringRef.current.x, y: ringRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 2400);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let p = 2;
    const id = setInterval(() => {
      p = (p + 1) % SERIAL_TEMPS.length;
      const newLine = `> T:${SERIAL_TEMPS[p]}°C  H:${SERIAL_HUMS[p]}%  D:${SERIAL_DISTS[p]}cm`;
      setSerialLines(prev => [prev[1], prev[2], newLine]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const interactiveProps = {
    onMouseEnter: () => setCursorBig(true),
    onMouseLeave: () => setCursorBig(false),
  };

  return (
    <div style={{
      fontFamily: '"Inter", system-ui, sans-serif',
      background: '#04080f', color: '#f0f4ff', cursor: 'none',
    }}>

      {/* ── Fonts ── */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Global styles ── */}
      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: clip; }
        html { scroll-behavior: smooth; }
        body { cursor: none !important; }
        a, button { cursor: none !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #04080f; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 99px; }
        ::selection { background: rgba(59,130,246,0.3); color: #fff; }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes marqueeR { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes flow { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
        @keyframes glow-node { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        .flow-wire { stroke-dasharray:6 4; animation:flow 1.6s linear infinite; }
        .node-pulse { animation:glow-node 2s ease-in-out infinite; }
        .nav-link { color:rgba(240,244,255,0.5); text-decoration:none; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:500; transition:all .15s; }
        .nav-link:hover { color:#f0f4ff; background:rgba(255,255,255,0.05); }
        .platform-card:hover { transform:translateY(-8px) !important; border-color:rgba(255,255,255,0.14) !important; background:rgba(255,255,255,0.04) !important; box-shadow:0 32px 80px rgba(0,0,0,.5) !important; }
        .platform-card:hover .card-top-line { opacity:1 !important; }
        .platform-card:hover .card-bg-glow { opacity:0.14 !important; }
        .platform-card:hover .card-link-arrow { margin-left:8px !important; }
        .act-card:hover { transform:translateY(-6px) !important; border-color:rgba(255,255,255,0.14) !important; box-shadow:0 24px 60px -20px rgba(0,0,0,.6) !important; }
        .act-card:hover .act-glow { opacity:1 !important; }
        .act-card:hover .act-top-bar { opacity:1 !important; }
        .act-card:hover .act-icon { transform:scale(1.08) rotate(-3deg) !important; }
        .act-card:hover .act-cta-text { opacity:1 !important; transform:translateX(0) !important; }
        .step-card:hover { border-color:rgba(255,255,255,0.13) !important; background:rgba(255,255,255,0.035) !important; transform:translateY(-4px) !important; }
        .about-item:hover { border-color:rgba(255,255,255,0.12) !important; background:rgba(255,255,255,0.04) !important; transform:translateX(4px) !important; }
        .btn-primary:hover { transform:translateY(-3px) !important; box-shadow:0 16px 48px rgba(37,99,235,0.5) !important; }
        .btn-amber:hover { transform:translateY(-3px) !important; box-shadow:0 16px 48px rgba(217,119,6,0.4) !important; }
        .btn-outline:hover { transform:translateY(-3px) !important; background:rgba(245,158,11,0.1) !important; border-color:rgba(245,158,11,0.4) !important; box-shadow:0 12px 36px rgba(245,158,11,0.15) !important; }
        .kit-item:hover { background:rgba(255,255,255,0.04) !important; border-color:rgba(255,255,255,0.1) !important; }
        .footer-link:hover { color:rgba(240,244,255,0.8) !important; }
        .act-view-all:hover { background:rgba(255,255,255,0.06) !important; color:#f0f4ff !important; border-color:rgba(255,255,255,0.14) !important; }
        .equip-pill:hover { background:rgba(255,255,255,0.05) !important; border-color:rgba(255,255,255,0.13) !important; }
        h1,h2,h3 { font-family:'Space Grotesk',sans-serif; }

        /* ════════ RESPONSIVE ════════ */
        /* Tablet and below */
        @media (max-width: 980px) {
          .bm-two-col { grid-template-columns: 1fr !important; gap: 48px !important; }
          .bm-three-col { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none !important; }
          .bm-section { padding-top: 90px !important; padding-bottom: 90px !important; }
          .hero-visual { order: 2; }
        }
        /* Phone */
        @media (max-width: 680px) {
          .bm-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .nav-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .bm-three-col { grid-template-columns: 1fr !important; }
          .bm-four-col { grid-template-columns: 1fr 1fr !important; }
          .stat-cell { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .hero-stats { flex-wrap: wrap !important; gap: 18px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .nav-login { display: none !important; }
          .kit-mini-grid { grid-template-columns: 1fr !important; }
          .bm-section { padding-top: 70px !important; padding-bottom: 70px !important; }
          h1 { font-size: 40px !important; }
        }
        /* Disable custom cursor on touch / small screens */
        @media (max-width: 980px), (hover: none), (pointer: coarse) {
          body, a, button { cursor: auto !important; }
          .bm-cursor { display: none !important; }
        }
      `}</style>

      {/* ── Custom cursor ── */}
      <div className="bm-cursor" style={{ position: 'fixed', width: cursorBig ? 6 : 10, height: cursorBig ? 6 : 10, borderRadius: '50%', background: '#3b82f6', pointerEvents: 'none', zIndex: 9999, left: mousePos.x, top: mousePos.y, transform: 'translate(-50%,-50%)', transition: 'width .2s,height .2s', mixBlendMode: 'difference' }} />
      <div className="bm-cursor" style={{ position: 'fixed', width: cursorBig ? 50 : 36, height: cursorBig ? 50 : 36, borderRadius: '50%', border: `1px solid rgba(59,130,246,${cursorBig ? 0.7 : 0.4})`, pointerEvents: 'none', zIndex: 9998, left: ringPos.x, top: ringPos.y, transform: 'translate(-50%,-50%)', transition: 'width .25s,height .25s,border-color .25s' }} />

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav className="nav-pad" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 48px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .5s',
        background: scrolled ? 'rgba(4,8,15,0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(32px)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'none' }} onClick={go} {...interactiveProps}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(59,130,246,0.3),0 8px 24px rgba(37,99,235,0.25)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.1),transparent)' }} />
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', fontFamily: '"Space Grotesk",sans-serif' }}>Build Mind</p>
            <p style={{ fontSize: 9.5, color: 'rgba(240,244,255,0.62)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>by Mediatiz Foundation</p>
          </div>
        </div>

        <div className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          {[{ label: 'Playground', href: '#playground' }, { label: 'Learn', href: '#learn' }, { label: 'Activities', href: '#activities' }, { label: 'The Kit', href: '#kit' }, { label: 'About', href: '#about' }].map(item => (
            <a key={item.label} href={item.href} className="nav-link" {...interactiveProps}>{item.label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={go} {...interactiveProps} className="nav-login" style={{ padding: '8px 20px', background: 'none', border: 'none', cursor: 'none', fontSize: 13, fontWeight: 500, color: 'rgba(240,244,255,0.5)', fontFamily: '"Inter",sans-serif', transition: 'color .15s' }}>Log in</button>
          <button onClick={go} className="btn-primary" {...interactiveProps} style={{ padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', transition: 'all .25s', whiteSpace: 'nowrap' }}>Sign up free</button>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="bm-pad" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', padding: '120px 48px 80px', overflow: 'hidden', background: 'linear-gradient(160deg,#04080f 0%,#060d19 40%,#081120 70%,#06101c 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)' }} />
        <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(217,119,6,0.06) 0%,transparent 60%)', pointerEvents: 'none' }} />

        <div className="bm-two-col" style={{ maxWidth: 1300, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1, animation: 'fadeInUp .9s ease .1s both' }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 99, padding: '6px 16px', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Mediatiz Foundation · ESP32 IoT Platform</span>
            </div>

            <h1 style={{ fontWeight: 700, fontSize: 'clamp(48px,5vw,76px)', lineHeight: 0.98, letterSpacing: -2.5, marginBottom: 24, color: '#f0f4ff' }}>
              <span style={{ display: 'block' }}>Learn to build</span>
              <span style={{ display: 'block', background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>real ESP32 hardware</span>
              <span style={{ display: 'block', background: 'linear-gradient(90deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>without the guesswork.</span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.55)', lineHeight: 1.8, maxWidth: 500, marginBottom: 40 }}>
              Build Mind pairs a 60+ component hardware kit with a complete learning platform: block coding, a live simulator, guided wiring, and one-click flashing to a real ESP32. Designed to make electronics, robotics, and AI accessible for young learners and future innovators.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ padding: '7px 15px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: activeFeature === i ? f.color + '20' : 'rgba(255,255,255,0.03)', color: activeFeature === i ? f.color : 'rgba(240,244,255,0.55)', border: `1px solid ${activeFeature === i ? f.color + '50' : 'rgba(255,255,255,0.06)'}`, transition: 'all .4s cubic-bezier(0.16,1,0.3,1)', transform: activeFeature === i ? 'scale(1.05)' : 'scale(1)', boxShadow: activeFeature === i ? `0 0 20px ${f.color}25` : 'none', letterSpacing: '0.03em' }}>{f.label}</div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={go} className="btn-primary" {...interactiveProps} style={{ padding: '15px 40px', borderRadius: 13, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 8px 32px rgba(37,99,235,0.4)', transition: 'all .25s' }}>Start free →</button>
              <button onClick={() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })} className="btn-outline" {...interactiveProps} style={{ padding: '15px 40px', borderRadius: 13, fontSize: 15, fontWeight: 600, color: '#fbbf24', background: 'transparent', border: '1px solid rgba(245,158,11,0.25)', cursor: 'none', fontFamily: '"Inter",sans-serif', transition: 'all .25s' }}>See how it works</button>
            </div>

            <div className="hero-stats" style={{ display: 'flex', gap: 28, alignItems: 'center', marginTop: 44, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {[{ v: '550K+', l: 'Students' }, { v: '10K+', l: 'Teachers' }, { v: '3,500+', l: 'Schools' }].map((s) => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                  <div>
                    <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 20, fontWeight: 700, color: '#f0f4ff', lineHeight: 1 }}>{s.v}</p>
                    <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.l}</p>
                  </div>
                  <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)' }} />
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)', maxWidth: 140, lineHeight: 1.5 }}>UNESCO Global MIL Alliance Member</p>
            </div>
          </div>

          {/* Right side terminal mockup */}
          <div className="hero-visual" style={{ position: 'relative', height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 8s ease-in-out infinite' }}>
            <div style={{ width: '100%', background: 'rgba(3,7,14,.95)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,.7)', overflow: 'hidden' }}>
              <div style={{ background: '#050a14', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'block' }} />)}</div>
                <span style={{ marginLeft: 10, fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>DHT11 · Build Mind Wire Simulator</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ background: 'linear-gradient(135deg,#071524,#0a1e34)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: 14, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                  <p style={{ fontSize: 8, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(59,130,246,0.6)', letterSpacing: '0.15em', marginBottom: 10 }}>ESP-WROOM-32 · WiFi+BLE · 240MHz · Xtensa LX6</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                    {['3V3', 'GND', 'IO4', 'IO2', 'IO21', 'GND', 'IO22', 'IO23', 'IO25', 'IO26', 'IO12', 'IO13'].map((pin, i) => (
                      <div key={i} style={{ background: i === 2 ? 'rgba(59,130,246,0.2)' : '#112233', border: `1px solid ${i === 2 ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.12)'}`, borderRadius: 5, padding: '4px 0', textAlign: 'center', fontSize: 7, fontFamily: '"JetBrains Mono",monospace', color: i === 2 ? '#93c5fd' : i === 8 || i === 9 ? '#fbbf24' : '#60a5fa', fontWeight: 600, boxShadow: i === 2 ? '0 0 8px rgba(59,130,246,0.3)' : 'none' }}>{pin}</div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(240,244,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Wire Connections</p>
                {[
                  { from: 'VCC', to: '3V3', color: '#ef4444', done: true },
                  { from: 'GND', to: 'GND', color: '#6b7280', done: true },
                  { from: 'DATA', to: 'IO4', color: '#f59e0b', done: true },
                  { from: 'TRIG', to: 'IO12', color: '#3b82f6', done: false },
                  { from: 'ECHO', to: 'IO13', color: '#8b5cf6', done: false },
                ].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginBottom: 4, borderRadius: 9, background: w.done ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${w.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)'}` }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: w.color, flexShrink: 0, boxShadow: w.done ? `0 0 6px ${w.color}` : 'none' }} />
                    <div style={{ height: 2, width: 16, background: w.done ? w.color : 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
                    <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: `4px solid ${w.done ? w.color : 'rgba(255,255,255,0.06)'}` }} />
                    <span style={{ flex: 1, fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.32)' }}>{w.from} → {w.to}</span>
                    <span style={{ fontSize: 9, color: w.done ? '#10b981' : 'rgba(255,255,255,0.1)' }}>{w.done ? '✓' : '○'}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 8, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em' }}>115200 BAUD</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'blink 1.5s infinite', display: 'block' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#10b981', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.1em' }}>LIVE</span>
                    </div>
                  </div>
                  {serialLines.map((line, i) => (
                    <p key={i} style={{ margin: '2px 0', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: i === 2 ? '#10b981' : 'rgba(16,185,129,0.25)', transition: 'color .5s' }}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(transparent,#04080f)', pointerEvents: 'none' }} />
      </section>

      {/* ══════════════ MARQUEE ══════════════ */}
      <section style={{ position: 'sticky', top: 0, zIndex: 110, background: '#050d1a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 0' }}>
        <Marquee items={MARQUEE_ITEMS} />
      </section>

      {/* ══════════════ WHAT IS IT / WHY ══════════════ */}
      <section className="bm-pad bm-section" style={{ padding: '120px 0 90px', background: '#04080f' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 99, padding: '6px 18px', marginBottom: 28 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>What is Build Mind</span>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 'clamp(32px,3.4vw,46px)', letterSpacing: -1.5, lineHeight: 1.15, marginBottom: 26 }}>
              The gap between learning to code and building real hardware is huge.<br />
              <span style={{ color: 'rgba(240,244,255,0.4)' }}>Build Mind closes it.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.5)', lineHeight: 1.85, maxWidth: 720, margin: '0 auto 14px' }}>
              Most students never touch real electronics. Kits are expensive, wiring is intimidating, and a single wrong connection can fry a board. Build Mind solves that with a guided, simulate first platform: learn the concept, wire it virtually with step by step animation, watch it run live, then flash the exact same code to a real ESP32 with one click.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(240,244,255,0.6)', lineHeight: 1.8, maxWidth: 680, margin: '0 auto' }}>
              Built by <strong style={{ color: 'rgba(240,244,255,0.6)', fontWeight: 600 }}>Mediatiz Foundation</strong>, a UNESCO Global MIL Alliance member, to bring hands-on technology education to every classroom in Pakistan and beyond.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ PLATFORM OVERVIEW ══════════════ */}
      <section id="platform" className="bm-pad" style={{ padding: '40px 0 130px', background: '#04080f' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <h2 style={{ fontWeight: 700, fontSize: 'clamp(38px,4vw,54px)', letterSpacing: -2, lineHeight: 1.05, marginBottom: 18 }}>
                Three ways to learn.<br />
                <span style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>One connected platform.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.45)', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
                Playground, structured Learn, and guided Activities, all sharing the same simulator and the same real hardware.
              </p>
            </div>
          </Reveal>

          <div className="bm-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Playground', title: 'Build freely with blocks', desc: 'Drag and drop coding blocks that generate real Arduino C++ in real time. Run it on the built in live simulator, then flash it straight to your ESP32.', color: '#3b82f6', features: ['Custom block library', 'Live block → code sync', 'Built in simulator', 'One click flash to ESP32'] },
              { label: 'Learn', title: 'Structured levels and sub levels', desc: 'A full curriculum split into levels, each broken into focused sub levels. Move from blinking an LED to WiFi and IoT cloud, one concept at a time.', color: '#f59e0b', features: ['Multiple learning levels', 'Sub levels inside each level', 'Interactive lessons', 'Concept-by-concept path'] },
              { label: 'Activities', title: 'Guided real-world projects', desc: 'End-to-end projects that list the exact equipment you need, then walk you through the "Wire it up" stepper with live animated connections.', color: '#10b981', features: ['Equipment checklist', '"Wire it up" animated steps', 'Live simulation', 'Flash to real hardware'] },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="platform-card" onClick={go} {...interactiveProps} style={{ borderRadius: 22, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '32px 28px', cursor: 'none', transition: 'all .45s cubic-bezier(0.16,1,0.3,1)', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div className="card-top-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${item.color},transparent)`, opacity: 0.5, transition: 'opacity .3s' }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: item.color + '18', borderRadius: 99, padding: '5px 14px', marginBottom: 24, border: `1px solid ${item.color}25` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>{item.label}</span>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 600, color: '#f0f4ff', margin: '0 0 14px', lineHeight: 1.2 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.45)', lineHeight: 1.8, margin: '0 0 28px' }}>{item.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {item.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', fontWeight: 500 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card-link" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: item.color }}>
                    <span>Open {item.label}</span>
                    <span className="card-link-arrow" style={{ transition: 'margin-left .2s', marginLeft: 0 }}>→</span>
                  </div>
                  <div className="card-bg-glow" style={{ position: 'absolute', bottom: -60, right: -60, width: 160, height: 160, borderRadius: '50%', background: item.color, pointerEvents: 'none', opacity: 0.06, transition: 'opacity .3s' }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PLAYGROUND (deep dive) ══════════════ */}
      <section id="playground" className="bm-pad bm-section" style={{ padding: '130px 0', background: 'linear-gradient(180deg,#04080f 0%,#060d19 50%,#04080f 100%)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <div className="bm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' }}>
            <Reveal direction="left">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>The Playground</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 'clamp(36px,4vw,50px)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
                  Snap blocks together.<br />
                  <span style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Watch real code appear.</span>
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', lineHeight: 1.85, marginBottom: 32 }}>
                  The Playground is where ideas start. Drag coding blocks from a custom library and they instantly generate clean Arduino C++. Run it on the built in live simulator to see exactly what your circuit does, then flash the very same code to a real ESP32 with one click. No IDE, no setup, no broken boards.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 40 }}>
                  {['Custom block library', 'Real Arduino C++ output', 'Built in live simulator', 'One click flash to ESP32', 'Switch to raw code anytime', 'AI assistant built in'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={go} className="btn-primary" {...interactiveProps} style={{ padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 6px 24px rgba(59,130,246,0.4)', transition: 'all .25s' }}>Open the Playground →</button>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ background: '#030609', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,.65)' }}>
                <div style={{ background: '#04080f', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
                  <span style={{ marginLeft: 10, fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.18)' }}>build-mind-playground · blocks</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ background: '#040b16', padding: 16 }}>
                    <p style={{ fontSize: 8, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(240,244,255,0.42)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Blocks</p>
                    {[
                      { t: 'on start', c: '#10b981', pad: 0 },
                      { t: 'set pin IO4 → INPUT', c: '#3b82f6', pad: 14 },
                      { t: 'forever', c: '#f59e0b', pad: 0 },
                      { t: 'read temperature', c: '#8b5cf6', pad: 14 },
                      { t: 'show on OLED', c: '#ef4444', pad: 14 },
                      { t: 'wait 2 sec', c: '#06b6d4', pad: 14 },
                    ].map((b, i) => (
                      <div key={i} style={{ marginLeft: b.pad, marginBottom: 7, padding: '8px 12px', borderRadius: 8, background: b.c + '1a', border: `1px solid ${b.c}40`, borderLeft: `3px solid ${b.c}`, fontSize: 11, fontWeight: 600, color: b.c, fontFamily: '"Inter",sans-serif' }}>{b.t}</div>
                    ))}
                  </div>
                  <div style={{ background: '#020509', padding: 16, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, lineHeight: 1.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Generated C++</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'blink 1.5s infinite', display: 'block' }} />
                        <span style={{ fontSize: 8, color: '#10b981', fontWeight: 700 }}>SYNC</span>
                      </span>
                    </div>
                    <p style={{ color: 'rgba(139,92,246,0.85)', margin: 0 }}>#include &lt;DHT.h&gt;</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', margin: 0 }}>#define <span style={{ color: '#fbbf24' }}>PIN</span> <span style={{ color: '#f87171' }}>4</span></p>
                    <p style={{ color: 'rgba(16,185,129,0.7)', margin: 0 }}>DHT dht(PIN, DHT11);</p>
                    <p style={{ color: 'rgba(59,130,246,0.8)', margin: 0 }}>void <span style={{ color: '#93c5fd' }}>setup</span>() {'{'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, paddingLeft: 12 }}>dht.<span style={{ color: '#67e8f9' }}>begin</span>();</p>
                    <p style={{ color: 'rgba(59,130,246,0.8)', margin: 0 }}>{'}'}</p>
                    <p style={{ color: 'rgba(59,130,246,0.8)', margin: 0 }}>void <span style={{ color: '#93c5fd' }}>loop</span>() {'{'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, paddingLeft: 12 }}>float t = dht.<span style={{ color: '#67e8f9' }}>read</span>();</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, paddingLeft: 12 }}>oled.<span style={{ color: '#67e8f9' }}>print</span>(t);</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, paddingLeft: 12 }}>delay(<span style={{ color: '#f87171' }}>2000</span>);</p>
                    <p style={{ color: 'rgba(59,130,246,0.8)', margin: 0 }}>{'}'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#04080f', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(16,185,129,0.7)' }}>● ESP32 connected · COM4</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', padding: '6px 14px', borderRadius: 8 }}>⚡ Flash to board</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════ LEARN (levels + sub-levels) ══════════════ */}
      <section id="learn" className="bm-pad bm-section" style={{ padding: '130px 0', background: '#04080f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <div className="bm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' }}>
            <Reveal direction="left">
              <div style={{ background: '#030609', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(245,158,11,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
                <div style={{ background: '#04080f', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
                  <span style={{ marginLeft: 10, fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(240,244,255,0.4)' }}>build-mind-learn · curriculum</span>
                </div>
                <div style={{ padding: 20 }}>
                  {[
                    { n: 1, title: 'ESP32 Fundamentals', color: '#10b981', subs: ['Meet the board', 'Blink an LED', 'Digital outputs'] },
                    { n: 2, title: 'Inputs & Sensors', color: '#3b82f6', subs: ['Buttons & debounce', 'DHT11 temperature', 'Ultrasonic distance'] },
                    { n: 3, title: 'Analog & PWM', color: '#f59e0b', subs: ['Potentiometers', 'Fading LEDs', 'Servo control'] },
                    { n: 4, title: 'Displays & Logic', color: '#8b5cf6', subs: ['OLED graphics', 'State machines'] },
                    { n: 5, title: 'WiFi & IoT Cloud', color: '#ef4444', subs: ['Connect to WiFi', 'Send data to cloud'] },
                  ].map(lvl => (
                    <div key={lvl.n} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: lvl.color + '0d', border: `1px solid ${lvl.color}22` }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Space Grotesk",sans-serif', fontSize: 13, fontWeight: 700, background: lvl.color, color: '#fff', boxShadow: `0 4px 12px ${lvl.color}40` }}>{lvl.n}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, margin: '0 0 2px', letterSpacing: '0.1em', color: lvl.color, textTransform: 'uppercase' }}>Level {lvl.n}</p>
                          <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 13.5, fontWeight: 600, margin: 0, color: 'rgba(240,244,255,0.92)' }}>{lvl.title}</p>
                        </div>
                        <span style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: lvl.color, opacity: 0.7 }}>{lvl.subs.length} sub-levels</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 42, paddingTop: 6 }}>
                        {lvl.subs.map(s => (
                          <span key={s} style={{ fontSize: 10, fontFamily: '"Inter",sans-serif', fontWeight: 500, color: 'rgba(240,244,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, padding: '4px 9px' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Structured Learning</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 'clamp(36px,4vw,50px)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
                  Levels inside levels.<br />
                  <span style={{ background: 'linear-gradient(90deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nothing skipped.</span>
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', lineHeight: 1.85, marginBottom: 28 }}>
                  Learn is a complete curriculum organised into clear levels, and every level breaks down into focused sub levels, so students master one small idea before moving to the next. From a first blinking LED all the way to sending live sensor data to the cloud.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                  {[
                    { t: 'Top level Levels', d: 'Broad themes: Fundamentals, Sensors, Analog, Displays, IoT.' },
                    { t: 'Nested sub levels', d: 'Each level contains bite-sized lessons that build on one another.' },
                    { t: 'Interactive every step', d: 'Every sub level runs in the same simulator used everywhere else.' },
                  ].map(x => (
                    <div key={x.t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 14.5, fontWeight: 600, color: 'rgba(240,244,255,0.9)', margin: 0 }}>{x.t}</p>
                        <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', lineHeight: 1.6, margin: '3px 0 0' }}>{x.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={go} className="btn-amber" {...interactiveProps} style={{ padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#92400e', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 6px 24px rgba(245,158,11,0.35)', transition: 'all .25s' }}>Explore the curriculum →</button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════ ACTIVITIES + WIRE IT UP ══════════════ */}
      <section id="activities" className="bm-pad bm-section" style={{ padding: '130px 0', background: '#060d19', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '12%', left: '-8%', width: 480, height: 480, background: 'radial-gradient(circle,rgba(20,184,166,0.07),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '-5%', width: 420, height: 420, background: 'radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 99, padding: '6px 16px', marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Guided Activities</span>
              </div>
              <h2 style={{ fontWeight: 700, fontSize: 'clamp(38px,4vw,54px)', letterSpacing: -2, lineHeight: 1.05, marginBottom: 16 }}>
                Real projects, wired up<br />
                <span style={{ background: 'linear-gradient(90deg,#14b8a6,#5eead4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>one guided step at a time.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,244,255,0.45)', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
                Each activity tells you exactly which components to grab, then the <strong style={{ color: '#34d399', fontWeight: 600 }}>Wire It Up</strong> stepper animates every single connection. Click next, and watch the wire light up.
              </p>
            </div>
          </Reveal>

          <div className="bm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', marginBottom: 80 }}>
            <Reveal direction="left">
              <WireItUp go={go} />
            </Reveal>
            <Reveal direction="right">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 99, padding: '6px 16px', marginBottom: 24 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Signature Feature · Wire It Up</span>
                </div>
                <h3 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 18 }}>
                  Next. Next. Next.<br />
                  <span style={{ color: 'rgba(240,244,255,0.4)' }}>Never fry a board again.</span>
                </h3>
                <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', lineHeight: 1.85, marginBottom: 28 }}>
                  Wiring is where most beginners give up. Wire It Up removes the fear: every connection is one click. The instruction tells you which pin goes where and why, and the diagram animates the exact wire lighting up as you go. Make every mistake safely in simulation before you ever touch the real hardware.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { t: 'Step by step connections', d: 'One wire per step, impossible to get lost.' },
                    { t: 'Live animated wires', d: 'The active connection glows and flows on the board diagram.' },
                    { t: 'Plain-language reasons', d: 'Each step explains the why, not just the where.' },
                    { t: 'Resistor & safety warnings', d: 'Get warned before a connection could damage a component.' },
                  ].map(x => (
                    <div key={x.t} className="step-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', transition: 'all .25s', cursor: 'default' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(240,244,255,0.92)', margin: 0 }}>{x.t}</p>
                        <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', lineHeight: 1.6, margin: '3px 0 0' }}>{x.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, margin: 0 }}>Starter projects</h3>
              <button onClick={go} {...interactiveProps} className="act-view-all" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'rgba(240,244,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'none', fontFamily: '"Inter",sans-serif', transition: 'all .25s' }}>
                View all projects
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </Reveal>

          <div className="bm-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { title: 'DHT11 Temperature Monitor', diff: 'Beginner', dur: '45 min', steps: 5, color: '#3b82f6', equip: ['ESP32', 'DHT11', 'OLED', '10kΩ resistor'] },
              { title: 'Ultrasonic Distance Alarm', diff: 'Intermediate', dur: '60 min', steps: 7, color: '#f59e0b', equip: ['ESP32', 'HC-SR04', 'Buzzer', 'RGB LED'] },
              { title: 'RFID Door Access Control', diff: 'Advanced', dur: '90 min', steps: 9, color: '#10b981', equip: ['ESP32', 'RC522', 'Servo', 'Keypad'] },
            ].map((act, i) => {
              const diffStyle: Record<string, { bg: string; text: string }> = {
                Beginner: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
                Intermediate: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
                Advanced: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
              };
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="act-card" onClick={go} {...interactiveProps} style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))', overflow: 'hidden', cursor: 'none', transition: 'transform .45s cubic-bezier(0.16,1,0.3,1), border-color .3s, box-shadow .3s', position: 'relative' }}>
                    <div className="act-glow" style={{ position: 'absolute', inset: 0, background: `radial-gradient(600px circle at 50% 0%,${act.color}12,transparent 60%)`, opacity: 0, transition: 'opacity .4s', pointerEvents: 'none' }} />
                    <div className="act-top-bar" style={{ height: 3, background: `linear-gradient(90deg,${act.color},${act.color}30)`, opacity: 0.4, transition: 'opacity .35s' }} />
                    <div style={{ padding: '26px 26px 22px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                        <div className="act-icon" style={{ width: 52, height: 52, borderRadius: 15, background: act.color + '18', border: `1px solid ${act.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .35s cubic-bezier(0.16,1,0.3,1)' }}>
                          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={act.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6M9 12h4M9 15h5" /></svg>
                        </div>
                        <span style={{ padding: '5px 11px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: diffStyle[act.diff].bg, color: diffStyle[act.diff].text, border: `1px solid ${diffStyle[act.diff].text}20`, fontFamily: '"JetBrains Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{act.diff}</span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: '#f0f4ff', margin: '0 0 14px', lineHeight: 1.3 }}>{act.title}</h3>

                      <p style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(240,244,255,0.48)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>You'll need</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                        {act.equip.map(e => (
                          <span key={e} className="equip-pill" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10.5, fontWeight: 600, background: 'rgba(255,255,255,0.03)', color: 'rgba(240,244,255,0.55)', border: '1px solid rgba(255,255,255,0.07)', fontFamily: '"Inter",sans-serif', transition: 'all .2s' }}>{e}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(240,244,255,0.55)', fontFamily: '"JetBrains Mono",monospace' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{act.dur}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(240,244,255,0.55)', fontFamily: '"JetBrains Mono",monospace' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6H18M6 8.5V18" /></svg>{act.steps} wire steps
                          </span>
                        </div>
                        <span className="act-cta-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: act.color, opacity: 0, transform: 'translateX(-6px)', transition: 'opacity .3s, transform .3s' }}>
                          Start<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={300}>
            <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'rgba(240,244,255,0.48)', fontFamily: '"JetBrains Mono",monospace' }}>
              Sign up to unlock the full project library →
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ THE KIT ══════════════ */}
      <section id="kit" className="bm-pad bm-section" style={{ padding: '130px 0', background: '#04080f', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse,rgba(245,158,11,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>
          <div className="bm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 72 }}>
            <Reveal direction="left">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Physical Hardware Kit</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 'clamp(36px,4vw,50px)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
                  Build Mind<br />
                  <span style={{ background: 'linear-gradient(90deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Ultimate Kit</span>
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', lineHeight: 1.85, marginBottom: 36 }}>
                  Everything needed to build every project on the platform: 60+ professional components in one organised box. Sensors, displays, motors, a camera, and wireless modules, all matched to the simulator so the screen and the real board always agree.
                </p>
                <div className="bm-four-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
                  {[{ v: '60+', l: 'Components', c: '#3b82f6' }, { v: '2', l: 'ESP32 Boards', c: '#10b981' }, { v: '9', l: 'Sensor Types', c: '#f59e0b' }, { v: '4', l: 'Display Types', c: '#8b5cf6' }].map(s => (
                    <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.c}20`, borderRadius: 14, padding: '16px 20px' }}>
                      <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, color: s.c, margin: 0, lineHeight: 1 }}>{s.v}</p>
                      <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.55)', margin: '4px 0 0', fontWeight: 500 }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <button onClick={go} className="btn-amber" {...interactiveProps} style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#92400e', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 8px 28px rgba(245,158,11,0.35)', transition: 'all .25s' }}>Get the Kit →</button>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ background: 'rgba(3,7,14,.9)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
                <div style={{ background: '#04080f', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
                  <span style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(240,244,255,0.4)', marginLeft: 8 }}>ultimate-kit.inventory</span>
                </div>
                <div style={{ padding: 24 }}>
                  {KIT_CATEGORIES.slice(0, 3).map(cat => (
                    <div key={cat.label} style={{ marginBottom: 18 }}>
                      <p style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: cat.color + 'cc', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{cat.label}</p>
                      <div className="kit-mini-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                        {cat.items.slice(0, 4).map(item => (
                          <div key={item.name} className="kit-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }}>
                            <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.55)', fontWeight: 500 }}>{item.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: cat.color + '18', color: cat.color }}>x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 15, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>Full component list</p>
                  <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.48)', margin: '2px 0 0', fontFamily: '"JetBrains Mono",monospace' }}>Everything inside the Build Mind Ultimate Kit</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {KIT_CATEGORIES.map((cat, i) => (
                    <button key={i} onClick={() => setKitTab(i)} {...interactiveProps} style={{ padding: '6px 15px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: kitTab === i ? '#fff' : 'rgba(240,244,255,0.6)', background: kitTab === i ? cat.color : 'transparent', border: `1px solid ${kitTab === i ? cat.color + '80' : 'rgba(255,255,255,0.06)'}`, cursor: 'none', transition: 'all .2s', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>{cat.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div className="bm-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {KIT_CATEGORIES[kitTab].items.map((item, i) => (
                    <div key={i} className="kit-item" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(240,244,255,0.55)', margin: 0 }}>{item.name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: KIT_CATEGORIES[kitTab].color + '18', color: KIT_CATEGORIES[kitTab].color }}>x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="bm-pad" style={{ padding: '80px 0', background: '#060d19', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <div className="bm-four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { target: 3, suffix: '', label: 'Core Modules', sub: 'Playground · Learn · Activities', color: '#3b82f6' },
              { target: 60, suffix: '+', label: 'Kit Components', sub: 'Professional hardware', color: '#f59e0b' },
              { target: 5, suffix: '', label: 'Learning Levels', sub: 'Basics to IoT Cloud', color: '#10b981' },
              { target: 11, suffix: '', label: 'Class Levels', sub: 'Class 2 through Class 12', color: '#8b5cf6' },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="stat-cell" style={{ textAlign: 'center', padding: '40px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 56, fontWeight: 700, color: stat.color, margin: '0 0 8px', lineHeight: 1 }}>
                    <Counter target={stat.target} suffix={stat.suffix} />
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(240,244,255,0.65)', margin: '0 0 4px' }}>{stat.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.48)', margin: 0, fontFamily: '"JetBrains Mono",monospace' }}>{stat.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ABOUT ══════════════ */}
      <section id="about" className="bm-pad bm-section" style={{ padding: '130px 0', background: '#04080f' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <div className="bm-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' }}>
            <Reveal direction="left">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Who built this & why</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 'clamp(36px,4vw,50px)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 20 }}>
                  Product by<br />
                  <span style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Mediatiz Foundation</span>
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.45)', lineHeight: 1.85, marginBottom: 32 }}>
                  Mediatiz Foundation is a UNESCO Global MIL Alliance member that has reached over 550,000 students across Pakistan. We built Build Mind because we kept seeing the same problem: students learn about technology but rarely get to build it. Build Mind is our flagship ESP32 IoT platform, created to put real, hands on hardware education into every classroom.
                </p>
                <div className="bm-four-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
                  {[{ v: '550K+', l: 'Students Reached', c: '#3b82f6' }, { v: '10K+', l: 'Teachers Trained', c: '#10b981' }, { v: '3,500+', l: 'Schools Registered', c: '#f59e0b' }, { v: 'UNESCO', l: 'Alliance Member', c: '#8b5cf6' }].map(s => (
                    <div key={s.l} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.c}18`, borderRadius: 14, padding: '16px 20px' }}>
                      <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 22, fontWeight: 700, color: s.c, margin: 0 }}>{s.v}</p>
                      <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.55)', margin: '4px 0 0' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <button onClick={go} className="btn-primary" {...interactiveProps} style={{ padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 6px 24px rgba(37,99,235,0.4)', transition: 'all .25s' }}>Join Build Mind →</button>
              </div>
            </Reveal>

            <Reveal direction="right">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { title: 'Government-approved curriculum', desc: 'Bilingual curricula aligned with Pakistan national standards and the UNESCO 2030 Agenda.', color: '#3b82f6' },
                  { title: 'Part of the AI Mind program', desc: 'Build Mind sits inside the AI Mind program, equipping students from Grade 1 to 12 with modern 21st century skills.', color: '#f59e0b' },
                  { title: 'Proven at national scale', desc: 'Delivered through camps, seminars, workshops and school programs across all major cities of Pakistan.', color: '#10b981' },
                  { title: 'National recognition', desc: "Pakistan's National Assembly resolved to consider MIL compulsory, driven by Mediatiz Foundation advocacy.", color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} className="about-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all .25s', cursor: 'default' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 14.5, fontWeight: 600, color: 'rgba(240,244,255,0.9)', margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.4)', lineHeight: 1.7, margin: '4px 0 0' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="bm-pad bm-section" style={{ padding: '140px 0', background: '#04080f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 400, background: 'radial-gradient(ellipse,rgba(37,99,235,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 99, padding: '6px 18px', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace' }}>Build Mind by Mediatiz Foundation</span>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 'clamp(46px,6vw,74px)', letterSpacing: -2.5, lineHeight: 0.98, marginBottom: 22 }}>
              Start building<br />
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>something </span>
              <span style={{ background: 'linear-gradient(90deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>real.</span>
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(240,244,255,0.45)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 52px' }}>
              Create a free account and open the platform. The Ultimate Kit ships everything else, from Class 2 to Class 12.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={go} className="btn-primary" {...interactiveProps} style={{ padding: '16px 52px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', border: 'none', cursor: 'none', fontFamily: '"Inter",sans-serif', boxShadow: '0 8px 32px rgba(37,99,235,0.4)', transition: 'all .25s' }}>Sign up free →</button>
              <button onClick={go} className="btn-outline" {...interactiveProps} style={{ padding: '16px 52px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#fbbf24', background: 'transparent', border: '1px solid rgba(245,158,11,0.25)', cursor: 'none', fontFamily: '"Inter",sans-serif', transition: 'all .25s' }}>Log in</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bm-pad" style={{ background: '#030509', padding: '64px 0 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1a3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <div>
                  <p style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>Build Mind</p>
                  <p style={{ fontSize: 9.5, color: 'rgba(240,244,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>by Mediatiz Foundation</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', lineHeight: 1.75, maxWidth: 240, margin: '0 0 18px' }}>
                The complete ESP32 IoT learning platform and hardware kit for students from Class 2 to Class 12.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['info@mediatiz.org', '+92 051 8482366', 'H-8/1, Islamabad, Pakistan'].map(t => (
                  <p key={t} style={{ fontSize: 12, color: 'rgba(240,244,255,0.42)', margin: 0 }}>{t}</p>
                ))}
              </div>
            </div>

            {[
              { title: 'Platform', links: ['Playground', 'Learn', 'Activities', 'Wire It Up'] },
              { title: 'Features', links: ['Block Coding', 'Live Simulator', 'Flash to ESP32', 'AI Assistant'] },
              { title: 'Foundation', links: ['About Mediatiz', 'AI Mind Program', 'Our Projects', 'Contact Us'] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(240,244,255,0.42)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: '"JetBrains Mono",monospace', margin: '0 0 18px' }}>{col.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <button key={link} onClick={go} className="footer-link" {...interactiveProps} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', fontSize: 13, color: 'rgba(240,244,255,0.5)', cursor: 'none', transition: 'color .15s', fontFamily: '"Inter",sans-serif' }}>{link}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', margin: 0 }}>© 2026 Mediatiz Foundation. All rights reserved.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'block' }} />
              <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', margin: 0 }}>UNESCO Global MIL Alliance Member</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}