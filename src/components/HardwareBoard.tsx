import React from 'react';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { HardwarePeripheral } from '@/lib/hardwareParser';
import Breadboard from './Breadboard';

/* ── Design tokens ── */
const BG_BOARD  = '#060c14';
const PCB_DARK  = '#050d1a';
const PCB_MID   = '#0d1f38';
const PCB_EDGE  = '#1a3050';
const PIN_GOLD  = '#c49a00';
const TEXT_DIM  = '#4a6a8a';
const TEXT_MID  = '#6b90b0';
const BLUE      = '#3b82f6';
const RED_WIRE  = '#ef4444';
const GND_WIRE  = '#1e293b';

interface HardwareBoardProps {
  peripherals: HardwarePeripheral[];
}

/* ─── Pin map — unchanged logic ─────────────────────────────────────── */
const PIN_MAP: Record<string, { x: number; y: number; side: 'left' | 'right' }> = {
  '36': { x: 57, y: 65,  side: 'left'  },
  '39': { x: 57, y: 75,  side: 'left'  },
  '34': { x: 57, y: 85,  side: 'left'  },
  '35': { x: 57, y: 95,  side: 'left'  },
  '32': { x: 57, y: 105, side: 'left'  },
  '33': { x: 57, y: 115, side: 'left'  },
  '25': { x: 57, y: 125, side: 'left'  },
  '26': { x: 57, y: 135, side: 'left'  },
  '27': { x: 57, y: 145, side: 'left'  },
  '14': { x: 57, y: 155, side: 'left'  },
  '12': { x: 57, y: 165, side: 'left'  },
  '13': { x: 57, y: 175, side: 'left'  },
  'GND':{ x: 57, y: 185, side: 'left'  },
  'VIN':{ x: 57, y: 195, side: 'left'  },
  'EN': { x: 57, y: 205, side: 'left'  },
  '23': { x: 161, y: 65,  side: 'right' },
  '22': { x: 161, y: 75,  side: 'right' },
  '1':  { x: 161, y: 85,  side: 'right' },
  '3':  { x: 161, y: 95,  side: 'right' },
  '21': { x: 161, y: 105, side: 'right' },
  '19': { x: 161, y: 115, side: 'right' },
  '18': { x: 161, y: 125, side: 'right' },
  '5':  { x: 161, y: 135, side: 'right' },
  '17': { x: 161, y: 145, side: 'right' },
  '16': { x: 161, y: 155, side: 'right' },
  '4':  { x: 161, y: 165, side: 'right' },
  '0':  { x: 161, y: 175, side: 'right' },
  '2':  { x: 161, y: 185, side: 'right' },
  '15': { x: 161, y: 195, side: 'right' },
  '3V3':{ x: 161, y: 205, side: 'right' },
};

const getPinLoc = (pin: number | string) =>
  PIN_MAP[String(pin)] ?? { x: 110, y: 230, side: 'bottom' };

/* ─── Component size metrics — unchanged logic ───────────────────────── */
const getComponentMetrics = (type: string) => {
  switch (type) {
    case 'OLED':   return { height: 250, offset: 60 };
    case 'SERVO':  return { height: 60,  offset: 30 };
    case 'BUZZER': return { height: 60,  offset: 20 };
    case 'BUTTON': return { height: 50,  offset: 20 };
    case 'LED':    return { height: 50,  offset: 15 };
    default:       return { height: 50,  offset: 20 };
  }
};

const getWireCount = (type: string) => {
  if (type === 'OLED')  return 4;
  if (type === 'SERVO') return 3;
  return 2;
};

/* ─── ESP32 board — visual only ─────────────────────────────────────── */
const ESP32Board = React.memo(function ESP32Board() {
  return (
    <g transform="translate(52, 50)">
      {/* PCB base */}
      <rect width="116" height="170" rx="5" fill={PCB_DARK} stroke={PCB_EDGE} strokeWidth="1.2" />

      {/* Module body */}
      <rect x="25" y="18" width="66" height="74" rx="4" fill={PCB_MID} stroke={PCB_EDGE} strokeWidth="1" />

      {/* Module grid lines */}
      <g stroke="#0f2238" strokeWidth="0.6">
        <line x1="25" y1="34" x2="91" y2="34" />
        <line x1="25" y1="50" x2="91" y2="50" />
        <line x1="25" y1="66" x2="91" y2="66" />
        <line x1="25" y1="82" x2="91" y2="82" />
      </g>

      {/* ESP32 label */}
      <text x="58" y="52" fill={BLUE} fontSize="9.5" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace" fontWeight="700" opacity="0.9">
        ESP32
      </text>
      <text x="58" y="63" fill={TEXT_DIM} fontSize="5.5" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace">
        WROOM-32D
      </text>

      {/* Antenna trace */}
      <path
        d="M 36 6 L 36 14 L 44 14 L 44 6 L 52 6 L 52 14 L 60 14 L 60 6 L 68 6 L 68 14 L 80 14"
        fill="none" stroke={PIN_GOLD} strokeWidth="1.5" opacity="0.7" strokeLinecap="round"
      />

      {/* USB port */}
      <rect x="44" y="153" width="28" height="14" rx="2"
        fill="#1a2a40" stroke={PCB_EDGE} strokeWidth="0.8" />
      <rect x="47" y="156" width="22" height="8" rx="1" fill="#0d1a2e" />

      {/* BOOT button */}
      <rect x="9" y="143" width="13" height="12" rx="2" fill={PCB_MID} stroke={PCB_EDGE} strokeWidth="0.8" />
      <circle cx="15.5" cy="149" r="3.5" fill="#1a3050" stroke={PCB_EDGE} strokeWidth="0.6" />
      <text x="15.5" y="163" fill={TEXT_DIM} fontSize="4" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace">BOOT</text>

      {/* EN button */}
      <rect x="94" y="143" width="13" height="12" rx="2" fill={PCB_MID} stroke={PCB_EDGE} strokeWidth="0.8" />
      <circle cx="100.5" cy="149" r="3.5" fill="#1a3050" stroke={PCB_EDGE} strokeWidth="0.6" />
      <text x="100.5" y="163" fill={TEXT_DIM} fontSize="4" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace">EN</text>

      {/* Pin headers */}
      {Object.entries(PIN_MAP).map(([pin, loc]) => {
        const isLeft = loc.side === 'left';
        return (
          <g key={`pin-${pin}`}>
            <rect
              x={isLeft ? 4 : 107}
              y={loc.y - 50 - 2.5}
              width="5" height="5"
              fill={PIN_GOLD} rx="0.8"
              opacity="0.85"
            />
            <text
              x={isLeft ? 11 : 105}
              y={loc.y - 50 + 1.5}
              fill={TEXT_DIM}
              fontSize="4"
              textAnchor={isLeft ? 'start' : 'end'}
              fontFamily="'JetBrains Mono', monospace"
            >
              {pin}
            </text>
          </g>
        );
      })}
    </g>
  );
});

/* ─── Peripheral components — visual only, logic untouched ──────────── */
const PeripheralShape = React.memo(function PeripheralShape({
  p, pinState, setPin,
}: {
  p: HardwarePeripheral;
  pinState: number;
  setPin: (pin: number, value: number, mode?: string) => void;
}) {
  switch (p.type) {

    case 'LED': {
      const on = pinState > 0;
      const op = on ? Math.max(0.35, pinState / 255) : 0.75;
      return (
        <g>
          <defs>
            <radialGradient id={`lg-${p.pin}`}>
              <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0"    />
            </radialGradient>
          </defs>
          {on && <circle cx="0" cy="0" r="18" fill={`url(#lg-${p.pin})`} />}
          {/* body */}
          <path d="M -8 10 L -8 -5 A 8 8 0 0 1 8 -5 L 8 10 Z"
            fill={on ? '#ef4444' : '#1e3050'} opacity={op} />
          {/* flat */}
          <rect x="-9" y="10" width="18" height="3" fill={PCB_EDGE} rx="1" />
          {/* leads */}
          <line x1="-4" y1="13" x2="-4" y2="18" stroke={TEXT_DIM} strokeWidth="1" />
          <line x1=" 4" y1="13" x2=" 4" y2="18" stroke={TEXT_DIM} strokeWidth="1" />
          <text y="27" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">LED</text>
        </g>
      );
    }

    case 'SERVO': {
      const angle = Math.min(180, Math.max(0, pinState)) - 90;
      return (
        <g transform="scale(0.85)">
          <rect x="-22" y="-22" width="44" height="44" rx="5"
            fill="#0f2040" stroke={PCB_EDGE} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="13" fill={PCB_MID} stroke={BLUE} strokeWidth="1" />
          <g transform={`rotate(${angle})`} style={{ transition: 'transform 0.3s' }}>
            <rect x="-2" y="-14" width="4" height="28" rx="2" fill="#e2e8f0" />
            <circle cx="0" cy="0" r="4" fill={PCB_DARK} />
          </g>
          <text y="34" fill={TEXT_MID} fontSize="9" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">Servo</text>
        </g>
      );
    }

    case 'BUZZER': {
      const on = pinState > 0;
      return (
        <g>
          <circle r="16" fill={PCB_DARK} stroke={PCB_EDGE} strokeWidth="1.5" />
          <circle r="5" fill={PCB_MID} />
          {on && (
            <g style={{ animation: 'hw-ping 1s ease-out infinite' }}>
              <circle r="22" fill="none" stroke="#ef4444" strokeWidth="1.2" opacity="0.4" />
            </g>
          )}
          <text y="29" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">Buzzer</text>
        </g>
      );
    }

    case 'BUTTON': {
      const on = pinState === 1;
      return (
        <g
          onClick={() => setPin(Number(p.pin), on ? 0 : 1)}
          style={{ cursor: 'pointer' }}
        >
          <rect x="-16" y="-16" width="32" height="32" rx="7"
            fill={PCB_MID} stroke={on ? BLUE : PCB_EDGE} strokeWidth="1.5" />
          <circle r="10"
            fill={on ? 'rgba(59,130,246,0.5)' : '#0d1a2e'}
            stroke={on ? BLUE : PCB_EDGE} strokeWidth="1"
            style={{ transition: 'all 0.1s' }} />
          <text y="29" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">Button</text>
        </g>
      );
    }

    case 'OLED': {
      // logic/positioning untouched
      const { oledScreen } = useSimulatorStore.getState();
      return (
        <g transform="translate(-60, -50) scale(3)">
          <rect x="0" y="0" width="80" height="80" rx="4"
            fill={PCB_DARK} stroke={PCB_EDGE} strokeWidth="1.5" />
          {/* pin header */}
          <rect x="25" y="2" width="30" height="6" fill={PCB_MID} />
          {[28, 36, 44, 52].map(cx => (
            <circle key={cx} cx={cx} cy="5" r="1.5" fill={PIN_GOLD} />
          ))}
          {/* screen */}
          <rect x="8" y="15" width="64" height="32" fill="#000" stroke={PCB_EDGE} strokeWidth="0.8" />
          {oledScreen.map((line, idx) => (
            <text key={`oled-${idx}`}
              x={8 + line.x * 0.5} y={15 + line.y * 0.5 + 5}
              fill="#38bdf8" fontSize="5" fontFamily="monospace"
              style={{ whiteSpace: 'pre' }}>
              {line.text}
            </text>
          ))}
          <text x="40" y="74" fill={TEXT_DIM} fontSize="5.5" textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace">0.96&quot; OLED</text>
        </g>
      );
    }

    case 'ULTRASONIC':
      return (
        <g transform="scale(0.85)">
          <rect x="-26" y="-17" width="52" height="34" rx="4"
            fill="#0f2040" stroke={PCB_EDGE} strokeWidth="1.5" />
          {([-13, 13] as number[]).map(cx => (
            <g key={cx}>
              <circle cx={cx} cy="0" r="11" fill={PCB_MID} stroke={TEXT_DIM} strokeWidth="1.5" />
              <circle cx={cx} cy="0" r="5"  fill={PCB_DARK} />
            </g>
          ))}
          <text y="27" fill={TEXT_MID} fontSize="8" textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace" fontWeight="700">HC-SR04</text>
        </g>
      );

    case 'DHT':
      return (
        <g>
          <rect x="-15" y="-22" width="30" height="44" rx="3"
            fill="#0a3040" stroke="#0ea5e9" strokeWidth="1.5" />
          <g stroke="#0284c7" strokeWidth="0.8">
            {[-10, -5, 0, 5, 10].map(y => (
              <line key={y} x1="-10" y1={y} x2="10" y2={y} />
            ))}
          </g>
          <text y="32" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">DHT11</text>
        </g>
      );

    case 'PIR':
      return (
        <g>
          <circle r="20" fill="#0a2010" stroke="#14532d" strokeWidth="1.5" />
          <circle r="15" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="0.8" opacity="0.88" />
          <g stroke="#cbd5e1" strokeWidth="0.6" opacity="0.5">
            <line x1="0" y1="-15" x2="0"   y2="15"  />
            <line x1="-15" y1="0" x2="15"  y2="0"   />
            <line x1="-10" y1="-10" x2="10" y2="10" />
            <line x1="-10" y1="10"  x2="10" y2="-10"/>
          </g>
          <text y="32" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">PIR</text>
        </g>
      );

    case 'ANALOG_SENSOR':
      return (
        <g>
          <rect x="-16" y="-16" width="32" height="32" rx="5"
            fill={PCB_MID} stroke={PCB_EDGE} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="9" fill="#92400e" stroke="#d97706" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="0" y2="-9" stroke="#b45309" strokeWidth="2"
            strokeLinecap="round" />
          <text y="26" fill={TEXT_MID} fontSize="7" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui" fontWeight="600">LDR/POT</text>
        </g>
      );

    default:
      return (
        <g>
          <rect x="-16" y="-16" width="32" height="32" rx="4"
            fill={PCB_MID} stroke={PCB_EDGE} strokeWidth="1.5" />
          <text y="4" fill={TEXT_MID} fontSize="6" textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui">{p.type}</text>
        </g>
      );
  }
});

/* ─── Main component — layout logic unchanged ────────────────────────── */
export default function HardwareBoard({ peripherals }: HardwareBoardProps) {
  const pins    = useSimulatorStore((s) => s.pins);
  const setPin  = useSimulatorStore((s) => s.setPin);

  const hasLeftPeripherals  = peripherals.some(p => getPinLoc(p.pin).side === 'left');
  const hasRightPeripherals = peripherals.some(p => getPinLoc(p.pin).side === 'right');
  const hasOled             = peripherals.some(p => p.type === 'OLED');

  const leftPeripherals  = peripherals.filter(p => getPinLoc(p.pin).side === 'left');
  const rightPeripherals = peripherals.filter(p => getPinLoc(p.pin).side === 'right');

  const totalWiresLeft  = leftPeripherals.reduce((s, p) => s + getWireCount(p.type), 0);
  const totalWiresRight = rightPeripherals.reduce((s, p) => s + getWireCount(p.type), 0);

  const pxLeft  = -20 - totalWiresLeft  * 5 - (hasLeftPeripherals  && leftPeripherals.some(p => p.type === 'OLED') ? 60 : 20);
  const pxRight =  230 + totalWiresRight * 5 + (hasOled ? 60 : 20);

  const minX  = hasLeftPeripherals  ? pxLeft  - 40 : 0;
  const maxX  = hasRightPeripherals ? pxRight + (hasOled ? 180 : 40) : 220;
  const width = maxX - minX;

  const layoutMap = React.useMemo(() => {
    const map = new Map<string | number, number>();
    const buildStack = (stack: HardwarePeripheral[]) => {
      const sorted = [...stack].sort((a, b) => getPinLoc(a.pin).y - getPinLoc(b.pin).y);
      let currentY = 10;
      sorted.forEach(p => {
        const m = getComponentMetrics(p.type);
        const targetTopY = Math.max(currentY, getPinLoc(p.pin).y - m.offset);
        map.set(p.pin, targetTopY + m.offset);
        currentY = targetTopY + m.height + 15;
      });
      return currentY;
    };
    buildStack(leftPeripherals);
    buildStack(rightPeripherals);
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peripherals]);

  const maxLeftY  = React.useMemo(() => {
    const sorted = [...leftPeripherals].sort((a, b) => getPinLoc(a.pin).y - getPinLoc(b.pin).y);
    let y = 10;
    sorted.forEach(p => { const m = getComponentMetrics(p.type); y = Math.max(y, getPinLoc(p.pin).y - m.offset) + m.height + 15; });
    return y;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peripherals]);

  const maxRightY = React.useMemo(() => {
    const sorted = [...rightPeripherals].sort((a, b) => getPinLoc(a.pin).y - getPinLoc(b.pin).y);
    let y = 10;
    sorted.forEach(p => { const m = getComponentMetrics(p.type); y = Math.max(y, getPinLoc(p.pin).y - m.offset) + m.height + 15; });
    return y;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peripherals]);

  const viewBoxHeight = Math.max(300, Math.max(maxLeftY, maxRightY));

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: BG_BOARD, borderRadius: 10, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 8,
    }}>
      <svg
        style={{ width: '100%', height: '100%' }}
        viewBox={`${minX} 0 ${width} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Subtle radial bg */}
        <defs>
          <radialGradient id="hb-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={BLUE} stopOpacity="0.06" />
            <stop offset="100%" stopColor={BG_BOARD} stopOpacity="0" />
          </radialGradient>
          <filter id="hb-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
        </defs>
        <rect x={minX} y="0" width={width} height={viewBoxHeight} fill="url(#hb-bg)" />

        {/* Breadboard */}
        <Breadboard x={0} y={10} rows={30} />

        {/* Power rails */}
        <g>
          {/* Left GND */}
          <line x1="15" y1="15" x2="15" y2="310" stroke="#0f2030" strokeWidth="4" opacity="0.5" />
          <line x1="15" y1="15" x2="15" y2="310" stroke={BLUE}
            strokeWidth="1.8" filter="url(#hb-glow)"
            opacity={peripherals.length > 0 ? 0.75 : 0.25}
            style={{ transition: 'opacity 0.5s' }} />
          {/* Left VCC */}
          <line x1="25" y1="15" x2="25" y2="310" stroke="#2a0a0a" strokeWidth="4" opacity="0.5" />
          <line x1="25" y1="15" x2="25" y2="310" stroke={RED_WIRE}
            strokeWidth="1.8" filter="url(#hb-glow)"
            opacity={peripherals.length > 0 ? 0.75 : 0.25}
            style={{ transition: 'opacity 0.5s' }} />
          {/* Right VCC */}
          <line x1="193" y1="15" x2="193" y2="310" stroke="#2a0a0a" strokeWidth="4" opacity="0.5" />
          <line x1="193" y1="15" x2="193" y2="310" stroke={RED_WIRE}
            strokeWidth="1.8" filter="url(#hb-glow)"
            opacity={peripherals.length > 0 ? 0.75 : 0.25}
            style={{ transition: 'opacity 0.5s' }} />
          {/* Right GND */}
          <line x1="203" y1="15" x2="203" y2="310" stroke="#0f2030" strokeWidth="4" opacity="0.5" />
          <line x1="203" y1="15" x2="203" y2="310" stroke={BLUE}
            strokeWidth="1.8" filter="url(#hb-glow)"
            opacity={peripherals.length > 0 ? 0.75 : 0.25}
            style={{ transition: 'opacity 0.5s' }} />
        </g>

        {/* Wires — logic 100% unchanged, only colours updated */}
        {(() => {
          let wcL = 0;
          let wcR = 0;

          return peripherals.map((p, i) => {
            const loc   = getPinLoc(p.pin);
            const isLeft = loc.side === 'left';
            const px    = isLeft ? pxLeft : pxRight;
            const py    = layoutMap.get(p.pin) ?? loc.y;

            const drawWire = (
              sx: number, sy: number, ex: number, ey: number,
              color: string, thickness = 2, opacity = 0.85,
            ) => {
              let midX: number;
              if (isLeft) {
                midX = pxLeft + (hasLeftPeripherals && leftPeripherals.some(q => q.type === 'OLED') ? 65 : 25) + wcL * 5;
                wcL++;
              } else {
                midX = pxRight - (hasOled ? 65 : 25) - wcR * 5;
                wcR++;
              }
              const path = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
              return (
                <g key={`w-${sx}-${sy}-${ex}-${ey}-${color}-${wcL}-${wcR}`}>
                  <path d={path} fill="none" stroke={color}
                    strokeWidth={thickness} strokeOpacity={opacity}
                    strokeLinejoin="round" strokeLinecap="round"
                    style={{ transition: 'all 0.3s' }} />
                  <circle cx={ex} cy={ey} r="2" fill={color} opacity={opacity} />
                </g>
              );
            };

            const pinData  = pins[p.pin];
            const pinVal   = pinData?.value || 0;
            let sigColor   = '#1a3050';
            let sigOp      = 0.7;
            if (pinVal > 0) {
              sigColor = RED_WIRE;
              if (pinData?.mode === 'pwm' && pinVal <= 255) sigOp = Math.max(0.35, pinVal / 255);
            }

            const sigHoleX = isLeft ? loc.x - 12 : loc.x + 12;
            const sigHoleY = loc.y;
            const railGndX = isLeft ? 15  : 203;
            const railVccX = isLeft ? 25  : 193;

            if (p.type === 'OLED') {
              const bpx = px; const bpy = py;
              const pinY  = bpy - 50 + 15;
              const gndX  = bpx - 60 + 84;
              const vccX  = bpx - 60 + 108;
              const sclX  = bpx - 60 + 132;
              const sdaX  = bpx - 60 + 156;
              const sdaY  = getPinLoc('21').y;
              const sclY  = getPinLoc('22').y;
              return (
                <g key={`wg-${i}`}>
                  {drawWire(gndX, pinY, railGndX, pinY + 2,  GND_WIRE, 2, 0.8)}
                  {drawWire(vccX, pinY, railVccX, pinY - 2,  RED_WIRE, 2, 0.8)}
                  {drawWire(sclX, pinY, sigHoleX, sclY,      '#d97706', 2, 0.8)}
                  {drawWire(sdaX, pinY, sigHoleX, sdaY,      BLUE,      2, 0.8)}
                </g>
              );
            } else if (['LED', 'BUZZER', 'BUTTON'].includes(p.type)) {
              return (
                <g key={`wg-${i}`}>
                  {drawWire(px, py - 5, sigHoleX, sigHoleY,  sigColor, 2, sigOp)}
                  {drawWire(px, py + 5, railGndX, py + 5,    GND_WIRE, 2, 0.8)}
                </g>
              );
            } else if (p.type === 'SERVO') {
              return (
                <g key={`wg-${i}`}>
                  {drawWire(px, py - 10, railGndX, py - 10,  GND_WIRE, 2, 0.8)}
                  {drawWire(px, py,      railVccX, py,        RED_WIRE, 2, 0.8)}
                  {drawWire(px, py + 10, sigHoleX, sigHoleY, '#d97706', 2, sigOp)}
                </g>
              );
            } else {
              return (
                <g key={`wg-${i}`}>
                  {drawWire(px, py - 5, railVccX, py - 5,    RED_WIRE, 2, 0.8)}
                  {drawWire(px, py,     sigHoleX, sigHoleY,  sigColor, 2, sigOp)}
                  {drawWire(px, py + 5, railGndX, py + 5,    GND_WIRE, 2, 0.8)}
                </g>
              );
            }
          });
        })()}

        {/* Master power jumpers */}
        {(() => {
          const gndL = getPinLoc('GND');
          const vccR = getPinLoc('3V3');
          return (
            <g opacity={peripherals.length > 0 ? 0.9 : 0.35}
              style={{ transition: 'opacity 0.5s' }}>
              <path d={`M ${gndL.x - 5} ${gndL.y} L 15 ${gndL.y}`}
                stroke={GND_WIRE} strokeWidth="2.5" fill="none" />
              <circle cx={gndL.x - 5} cy={gndL.y} r="2.5" fill={GND_WIRE} />
              <circle cx="15" cy={gndL.y} r="2.5" fill={GND_WIRE} filter="url(#hb-glow)" />
              <path d={`M ${vccR.x + 5} ${vccR.y} L 193 ${vccR.y}`}
                stroke={RED_WIRE} strokeWidth="2.5" fill="none" />
              <circle cx={vccR.x + 5} cy={vccR.y} r="2.5" fill={RED_WIRE} />
              <circle cx="193" cy={vccR.y} r="2.5" fill={RED_WIRE} filter="url(#hb-glow)" />
            </g>
          );
        })()}

        {/* ESP32 board */}
        <ESP32Board />

        {/* Peripherals */}
        {peripherals.map((p, i) => {
          const loc    = getPinLoc(p.pin);
          const isLeft = loc.side === 'left';
          const px     = isLeft ? pxLeft : pxRight;
          const py     = layoutMap.get(p.pin) ?? loc.y;
          const pinState = pins[p.pin]?.value || 0;
          return (
            <g key={`per-${i}`} transform={`translate(${px}, ${py})`}>
              <PeripheralShape p={p} pinState={pinState} setPin={setPin} />
            </g>
          );
        })}
      </svg>

      <style suppressHydrationWarning>{`
        @keyframes hw-ping {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}