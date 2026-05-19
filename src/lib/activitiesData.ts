// src/lib/activitiesData.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export type Equipment = {
  name: string;
  description: string;
  emoji: string;
  image?: string;
  quantity: number;
};

export type WiringStep = {
  text: string;
  wire?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: string;
    label?: string;
  };
};

export type PlaygroundBlock = {
  type: string;
  icon: string;
  label: string;
  values: Record<string, string | number>;
  params: { name: string; type: 'number' | 'text' | 'select'; default: string | number; options?: string[] }[];
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  icon: string;
  tags: string[];
  teaches: string[];
  intro: {
    headline: string;
    what: string;
    why: string;
  };
  equipment: Equipment[];
  assemble: {
    videoUrl: string;
    wokwiUrl: string;
    steps: string[];
    wiringSteps?: WiringStep[]; // interactive step-by-step wiring
  };
  code: {
    arduino: string;
    platformDescription: string;
  };
  playgroundBlocks: PlaygroundBlock[];
  output: {
    description: string;
    expected: string[];
    tips: string[];
  };
  bonusChallenge?: string; // Optional extra challenge for curious students
  wiringComponent?: {     // Auto-generates step-by-step wiring simulator
    type: string;
    label?: string;
    pins: { name: string; connectTo: string; color: 'red'|'black'|'yellow'|'orange'|'blue'|'green'|'white'|'purple' }[];
  };
};

// ─── Common Equipment ─────────────────────────────────────────────────────────
// These are reused across activities.
// Images available: esp32.jpg, jumper-wires.jpg, cable.jpg, breadboard.jpg, dht22-sensor.png
//
// ❌ NO IMAGE YET — add these to /public/images/equipment/ to show photos:
//   → led.jpg          (for LED component)
//   → resistor.jpg     (for 220Ω Resistor)
//   → push-button.jpg  (for Push Button)
//   Until then, they fall back to emoji in the UI automatically.

const ESP32: Equipment = {
  name: 'ESP32 Dev Board',
  description: 'The main microcontroller. Any ESP32 dev board works.',
  emoji: '🖥️',
  image: '/images/equipment/esp32.jpg',
  quantity: 1,
};

const JUMPER_WIRES = (quantity: number): Equipment => ({
  name: 'Jumper Wires',
  description: 'Male-to-female jumper wires to connect components.',
  emoji: '🔌',
  image: '/images/equipment/jumper-wires.jpg',
  quantity,
});

const USB_CABLE: Equipment = {
  name: 'USB Cable',
  description: 'Micro-USB or USB-C cable to connect ESP32 to your computer.',
  emoji: '🔋',
  image: '/images/equipment/cable.jpg',
  quantity: 1,
};

const BREADBOARD: Equipment = {
  name: 'Breadboard',
  description: 'For easy component connections.',
  emoji: '🧱',
  image: '/images/equipment/breadboard.jpg',
  quantity: 1,
};

const DHT22: Equipment = {
  name: 'DHT22 Sensor',
  description: 'Digital temperature and humidity sensor. Blue module with 3 pins.',
  emoji: '🌡️',
  image: '/images/equipment/dht22-sensor.png',
  quantity: 1,
};

// ❌ No image yet — add /public/images/equipment/led.jpg
const LED: Equipment = {
  name: 'LED',
  description: 'Any 5mm LED works. Red, green, or blue.',
  emoji: '💡',
  // image: '/images/equipment/led.jpg',
  quantity: 1,
};

// ❌ No image yet — add /public/images/equipment/resistor.jpg
const RESISTOR_220: Equipment = {
  name: '220Ω Resistor',
  description: 'Protects the LED from burning out. Always use with an LED.',
  emoji: '🔩',
  // image: '/images/equipment/resistor.jpg',
  quantity: 1,
};

// ❌ No image yet — add /public/images/equipment/push-button.jpg
const PUSH_BUTTON: Equipment = {
  name: 'Push Button',
  description: '4-pin tactile switch.',
  emoji: '🔘',
  // image: '/images/equipment/push-button.jpg',
  quantity: 1,
};

// ─── Activities ───────────────────────────────────────────────────────────────

export const ACTIVITIES: Activity[] = [

  // ── 1. DHT Sensor ──────────────────────────────────────────────────────────
  {
    id: 'dht_sensor',
    title: 'Read Temperature & Humidity',
    description:
      'Connect a DHT22 sensor to your ESP32 and read real temperature and humidity data every 2 seconds.',
    difficulty: 'Beginner',
    duration: '20 min',
    icon: '🌡️',
    tags: ['Sensor', 'Serial', 'DHT22'],
    teaches: ['Sensor wiring', 'DHT library', 'Serial output', 'Variables'],
    intro: {
      headline: 'Read real-world temperature & humidity with your ESP32!',
      what: 'Connect a DHT22 sensor to your ESP32 and write a program that reads temperature and humidity every 2 seconds and prints the results to the Serial Monitor.',
      why: 'Temperature and humidity sensing is one of the most common IoT use cases — from smart home thermostats to industrial monitoring systems.',
    },
    equipment: [
      ESP32,
      DHT22,
      JUMPER_WIRES(3),
      USB_CABLE,
      { ...BREADBOARD, description: 'Helps organize your wiring. Optional if using a DHT module.' },
    ],
    assemble: {
      videoUrl: 'https://www.youtube.com/embed/bHhRxw3CgBQ?origin=http://localhost:3000',
      wokwiUrl: 'https://wokwi.com/projects/463700449068203009',
      steps: [
        'Connect DHT22 VCC pin → ESP32 3.3V (red wire)',
        'Connect DHT22 GND pin → ESP32 GND (black wire)',
        'Connect DHT22 DATA pin → ESP32 GPIO 4 (yellow wire)',
        'Plug ESP32 into your computer via USB',
        'Open Arduino IDE or use the Platform Playground',
      ],
      // Interactive wiring simulator steps
      // Coordinates match the SVG viewBox in WiringSimulator.tsx
      // DHT22 pins: VCC cx=50 cy=45, DATA cx=50 cy=55, GND cx=50 cy=65 (in group at -80,80)
      // So absolute: VCC=(-30,125), DATA=(-30,135), GND=(-30,145)
      // ESP32 3.3V pin: group(52,40) + rect x=106 y=55 → absolute (158,95)
      // ESP32 GND pin:  group(52,40) + rect x=106 y=65 → absolute (158,105)
      // ESP32 GPIO4:    group(52,40) + rect x=106 y=75 → absolute (158,115)
      wiringSteps: [
        {
          text: 'Start here — this is your ESP32 board (left) and DHT22 sensor (right). We will connect them wire by wire.',
        },
        {
          text: 'Connect DHT22 VCC pin → ESP32 3.3V pin using a RED wire. This powers the sensor.',
          wire: {
            fromX: -30, fromY: 125,
            toX: 158,   toY: 95,
            color: '#ef4444',
            label: 'VCC',
          },
        },
        {
          text: 'Connect DHT22 GND pin → ESP32 GND pin using a BLACK wire. This completes the circuit ground.',
          wire: {
            fromX: -30, fromY: 145,
            toX: 158,   toY: 105,
            color: '#1f2937',
            label: 'GND',
          },
        },
        {
          text: 'Connect DHT22 DATA pin → ESP32 GPIO 4 using a YELLOW wire. This sends sensor readings to the ESP32.',
          wire: {
            fromX: -30, fromY: 135,
            toX: 158,   toY: 115,
            color: '#facc15',
            label: 'DATA',
          },
        },
        {
          text: 'Plug your ESP32 into your computer via USB cable. All wires are connected — you are ready to code!',
        },
      ],
    },
    code: {
      arduino: `#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("DHT22 Sensor Ready!");
}

void loop() {
  delay(2000);

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
}`,
      platformDescription:
        'These blocks start Serial, set up the DHT22 sensor on pin 4, read temperature and humidity into variables, print them to the Serial Monitor, then wait 2 seconds before repeating.',
    },
    playgroundBlocks: [
      {
        type: 'serial_begin',
        icon: '🔌',
        label: 'Start Serial Monitor',
        params: [],
        values: {},
      },
      {
        type: 'dht_setup',
        icon: '🌡️',
        label: 'Setup DHT22 sensor on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 4 }],
        values: { pin: 4 },
      },
      {
        type: 'dht_temp',
        icon: '🌡️',
        label: 'Read temperature into <var>',
        params: [{ name: 'var', type: 'text', default: 'temp' }],
        values: { var: 'temp' },
      },
      {
        type: 'dht_hum',
        icon: '💧',
        label: 'Read humidity into <var>',
        params: [{ name: 'var', type: 'text', default: 'humidity' }],
        values: { var: 'humidity' },
      },
      {
        type: 'serial_println',
        icon: '📃',
        label: 'Print "<label>" + <var> on new line',
        params: [
          { name: 'label', type: 'text', default: 'Temp: ' },
          { name: 'var', type: 'text', default: 'temp' },
        ],
        values: { label: 'Temperature: ', var: 'temp' },
      },
      {
        type: 'serial_println',
        icon: '📃',
        label: 'Print "<label>" + <var> on new line',
        params: [
          { name: 'label', type: 'text', default: 'Humidity: ' },
          { name: 'var', type: 'text', default: 'humidity' },
        ],
        values: { label: 'Humidity: ', var: 'humidity' },
      },
      {
        type: 'delay_sec',
        icon: '🕐',
        label: 'Wait <sec> seconds',
        params: [{ name: 'sec', type: 'number', default: 2 }],
        values: { sec: 2 },
      },
    ],
    output: {
      description:
        'Open the Serial Monitor at 115200 baud. You should see temperature and humidity readings every 2 seconds.',
      expected: [
        'DHT22 Sensor Ready!',
        'Temperature: 24.00 °C',
        'Humidity: 55.00 %',
        '(values update every 2 seconds)',
      ],
      tips: [
        'If you see "nan" values, check your wiring — especially the DATA pin on GPIO 4.',
        'The DHT22 takes about 1 second to stabilize after power-on.',
        'Try breathing on the sensor — you will see the humidity value jump!',
        'DHT22 accuracy: ±2°C temperature, ±5% humidity.',
      ],
    },
    bonusChallenge: 'Can you make an LED on pin 48 turn ON automatically when the temperature goes above 30°C? Hint: use an if_block with condition "temp > 30" and a dw_high block!',
    wiringComponent: {
      type: 'DHT22',
      label: 'DHT22 Sensor',
      pins: [
        { name: 'VCC',  connectTo: '3.3V',  color: 'red'    },
        { name: 'GND',  connectTo: 'GND',   color: 'black'  },
        { name: 'DATA', connectTo: 'GPIO4', color: 'yellow' },
      ],
    },
  },

  // ── 2. Blink LED ───────────────────────────────────────────────────────────
  {
    id: 'blink_led',
    title: 'Blink an LED',
    description:
      'The classic first ESP32 project. Make an LED blink on and off every 500ms using GPIO pins.',
    difficulty: 'Beginner',
    duration: '10 min',
    icon: '💡',
    tags: ['Output', 'GPIO', 'LED'],
    teaches: ['pinMode', 'digitalWrite', 'delay', 'GPIO basics'],
    intro: {
      headline: 'Make your first LED blink with the ESP32!',
      what: 'Wire up an LED to your ESP32 and write a simple program that turns it on and off every 500ms — the "Hello World" of electronics.',
      why: 'Blinking an LED teaches you the fundamental building blocks of any microcontroller program: setup, loop, digital output, and timing.',
    },
    equipment: [
      ESP32,
      LED,
      RESISTOR_220,
      BREADBOARD,
      JUMPER_WIRES(2),
      USB_CABLE,
    ],
    assemble: {
      videoUrl: 'https://www.youtube.com/embed/5XH8n8d1ZCM',
      wokwiUrl: 'https://wokwi.com/projects/305568836183130690',
      steps: [
        'Place the LED on the breadboard (longer leg = positive/anode)',
        'Connect a 220Ω resistor from LED anode → ESP32 GPIO 48',
        'Connect LED cathode (short leg) → GND rail on breadboard',
        'Connect GND rail → ESP32 GND pin',
        'Plug in USB and upload the code',
      ],
    },
    code: {
      arduino: `#define LED_PIN 48

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED Blink Ready!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(500);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(500);
}`,
      platformDescription:
        'These blocks start Serial, set pin 48 as OUTPUT, then repeatedly turn the LED on, wait 500ms, turn it off, and wait 500ms.',
    },
    playgroundBlocks: [
      {
        type: 'serial_begin',
        icon: '🔌',
        label: 'Start Serial Monitor',
        params: [],
        values: {},
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 48, mode: 'OUTPUT' },
      },
      {
        type: 'dw_high',
        icon: '💡',
        label: 'Turn ON LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 48 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello ESP32!' }],
        values: { msg: 'LED ON' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 500 },
      },
      {
        type: 'dw_low',
        icon: '🌑',
        label: 'Turn OFF LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 48 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello ESP32!' }],
        values: { msg: 'LED OFF' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 500 },
      },
    ],
    output: {
      description:
        'Your LED should blink on and off every 500ms. The Serial Monitor will confirm with ON/OFF messages.',
      expected: ['LED Blink Ready!', 'LED ON', 'LED OFF', '(repeats every 500ms)'],
      tips: [
        "If the LED doesn't light up, flip it around — LEDs are polarity sensitive.",
        'No resistor = burnt LED. Always use a 220Ω or 330Ω resistor.',
        'Try changing the delay value to make it blink faster or slower!',
        'GPIO 48 is the built-in LED on many ESP32-S3 boards.',
      ],
    },
    bonusChallenge: 'Can you make the LED blink 3 times fast, then pause for 2 seconds, then repeat? Hint: use a for_loop block set to 3 repeats with a short delay inside!',
    wiringComponent: {
      type: 'LED',
      label: 'LED',
      pins: [
        { name: '+', connectTo: 'GPIO48', color: 'red'   },
        { name: '-', connectTo: 'GND',    color: 'black' },
      ],
    },
  },

  // ── 3. Button Controls LED ─────────────────────────────────────────────────
  {
    id: 'button_led',
    title: 'Button Controls LED',
    description:
      'Press a physical button to toggle an LED on and off. Learn digital input and if/else logic.',
    difficulty: 'Beginner',
    duration: '15 min',
    icon: '🔘',
    tags: ['Input', 'Output', 'Logic'],
    teaches: ['digitalRead', 'if/else', 'INPUT_PULLUP', 'Debouncing'],
    intro: {
      headline: 'Control hardware with a button press!',
      what: 'Wire up a push button and LED. When you press the button, the LED turns on. Release it, the LED turns off.',
      why: 'Reading digital inputs is half of all IoT projects. Understanding pull-up resistors and if/else logic is essential for any embedded system.',
    },
    equipment: [
      ESP32,
      PUSH_BUTTON,
      LED,
      RESISTOR_220,
      BREADBOARD,
      JUMPER_WIRES(4),
      USB_CABLE,
    ],
    assemble: {
      videoUrl: 'https://www.youtube.com/embed/GkH5J0YJVBM',
      wokwiUrl: 'https://wokwi.com/projects/323048568863048276',
      steps: [
        'Place the button on the breadboard straddling the center gap',
        'Connect one button leg → GPIO 0 on ESP32',
        'Connect other button leg → GND',
        'Wire LED anode → 220Ω resistor → GPIO 4',
        'Wire LED cathode → GND',
        'Upload code — the built-in pull-up does the rest',
      ],
    },
    code: {
      arduino: `#define BTN_PIN 0
#define LED_PIN 48

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
}

void loop() {
  int btnState = digitalRead(BTN_PIN);

  if (btnState == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed - LED ON");
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(50);
}`,
      platformDescription:
        'These blocks set up Serial, configure pin 48 as OUTPUT and pin 0 as INPUT_PULLUP, then read the button state. If the button is pressed (LOW), the LED turns on. Otherwise it turns off. 50ms delay prevents bouncing.',
    },
    playgroundBlocks: [
      {
        type: 'serial_begin',
        icon: '🔌',
        label: 'Start Serial Monitor',
        params: [],
        values: {},
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 48, mode: 'OUTPUT' },
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 0, mode: 'INPUT_PULLUP' },
      },
      {
        type: 'btn_read',
        icon: '🔘',
        label: 'Read button on Pin <pin> into <var>',
        params: [
          { name: 'pin', type: 'number', default: 12 },
          { name: 'var', type: 'text', default: 'btnState' },
        ],
        values: { pin: 0, var: 'btnState' },
      },
      {
        type: 'if_block',
        icon: '❓',
        label: 'If <cond> then ▼',
        params: [{ name: 'cond', type: 'text', default: 'temp > 30' }],
        values: { cond: 'btnState == LOW' },
      },
      {
        type: 'dw_high',
        icon: '💡',
        label: 'Turn ON LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 48 },
      },
      {
        type: 'else_block',
        icon: '↩️',
        label: 'Otherwise ▼',
        params: [],
        values: {},
      },
      {
        type: 'dw_low',
        icon: '🌑',
        label: 'Turn OFF LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 48 },
      },
      {
        type: 'end_if',
        icon: '🔚',
        label: 'End If ▲',
        params: [],
        values: {},
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 50 },
      },
    ],
    output: {
      description: 'LED turns on while button is held. Releases when you let go.',
      expected: ['Button pressed - LED ON', '(LED off when released)'],
      tips: [
        'INPUT_PULLUP means the pin reads HIGH by default. Pressing the button pulls it LOW.',
        'The 50ms delay prevents "bouncing" — rapid on/off flickers from the button.',
        'Try making it toggle instead: flip a boolean variable on each press.',
      ],
    },
    bonusChallenge: 'Can you make the LED stay ON after one button press and turn OFF on the next press (toggle)? Hint: create a var_bool called "isOn" and flip it each time the button is pressed!',
    wiringComponent: {
      type: 'BUTTON_LED',
      label: 'Button + LED',
      pins: [
        { name: 'PIN1', connectTo: 'GPIO0',  color: 'orange' },
        { name: 'PIN2', connectTo: 'GND',    color: 'black'  },
        { name: '+',    connectTo: 'GPIO48', color: 'red'    },
        { name: '-',    connectTo: 'GND',    color: 'black'  },
      ],
    },
  },

  // ── 4. Traffic Light System (Intermediate) ─────────────────────────────────
  {
    id: 'traffic_light',
    title: 'Traffic Light System',
    description:
      'Build a working traffic light with 3 LEDs! Red, yellow, and green blink in sequence just like a real traffic signal.',
    difficulty: 'Intermediate',
    duration: '20 min',
    icon: '🚦',
    tags: ['Output', 'GPIO', 'Timing', 'LED'],
    teaches: ['Multiple pins', 'Sequencing', 'delay', 'Real-world logic'],
    intro: {
      headline: 'Build your own traffic light with ESP32!',
      what: 'Wire up 3 LEDs (red, yellow, green) and program them to blink in sequence — just like a real traffic signal on the road.',
      why: 'Traffic lights are a perfect example of sequencing and timing in programming. You will learn how to control multiple outputs and create timed patterns — a skill used in robots, animations, and machines.',
    },
    equipment: [
      ESP32,
      { ...LED, name: 'Red LED', description: 'Red 5mm LED for the stop signal.', emoji: '🔴' },
      { ...LED, name: 'Yellow LED', description: 'Yellow 5mm LED for the slow down signal.', emoji: '🟡' },
      { ...LED, name: 'Green LED', description: 'Green 5mm LED for the go signal.', emoji: '🟢' },
      { ...RESISTOR_220, quantity: 3 },
      BREADBOARD,
      JUMPER_WIRES(6),
      USB_CABLE,
    ],
    assemble: {
      videoUrl: 'https://www.youtube.com/embed/GGi7YRE8pBc',
      wokwiUrl: 'https://wokwi.com/projects/306072285550977600',
      steps: [
        'Place all 3 LEDs on the breadboard in a row (Red, Yellow, Green)',
        'Connect each LED anode (long leg) through a 220Ω resistor to ESP32',
        'Red LED → resistor → GPIO 25',
        'Yellow LED → resistor → GPIO 26',
        'Green LED → resistor → GPIO 27',
        'Connect all LED cathodes (short legs) → GND rail → ESP32 GND',
        'Plug in USB and upload the code',
      ],
    },
    code: {
      arduino: `#define RED_PIN    25
#define YELLOW_PIN 26
#define GREEN_PIN  27

void setup() {
  Serial.begin(115200);
  pinMode(RED_PIN,    OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(GREEN_PIN,  OUTPUT);
  Serial.println("Traffic Light Ready!");
}

void allOff() {
  digitalWrite(RED_PIN,    LOW);
  digitalWrite(YELLOW_PIN, LOW);
  digitalWrite(GREEN_PIN,  LOW);
}

void loop() {
  // RED — Stop
  allOff();
  digitalWrite(RED_PIN, HIGH);
  Serial.println("🔴 RED   — Stop!");
  delay(3000);

  // YELLOW — Get Ready
  allOff();
  digitalWrite(YELLOW_PIN, HIGH);
  Serial.println("🟡 YELLOW — Get Ready...");
  delay(1000);

  // GREEN — Go!
  allOff();
  digitalWrite(GREEN_PIN, HIGH);
  Serial.println("🟢 GREEN  — Go!");
  delay(3000);

  // YELLOW — Slowing Down
  allOff();
  digitalWrite(YELLOW_PIN, HIGH);
  Serial.println("🟡 YELLOW — Slowing down...");
  delay(1000);
}`,
      platformDescription:
        'These blocks set up 3 LED pins as OUTPUT, then cycle through Red (3s) → Yellow (1s) → Green (3s) → Yellow (1s) in a loop, printing each state to Serial Monitor.',
    },
    playgroundBlocks: [
      {
        type: 'serial_begin',
        icon: '🔌',
        label: 'Start Serial Monitor',
        params: [],
        values: {},
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 25, mode: 'OUTPUT' },
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 26, mode: 'OUTPUT' },
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 27, mode: 'OUTPUT' },
      },
      // RED phase
      {
        type: 'dw_high',
        icon: '💡',
        label: 'Turn ON LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 25 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello!' }],
        values: { msg: 'RED - Stop!' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 3000 },
      },
      {
        type: 'dw_low',
        icon: '🌑',
        label: 'Turn OFF LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 25 },
      },
      // YELLOW phase
      {
        type: 'dw_high',
        icon: '💡',
        label: 'Turn ON LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 26 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello!' }],
        values: { msg: 'YELLOW - Get Ready!' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 1000 },
      },
      {
        type: 'dw_low',
        icon: '🌑',
        label: 'Turn OFF LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 26 },
      },
      // GREEN phase
      {
        type: 'dw_high',
        icon: '💡',
        label: 'Turn ON LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 27 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello!' }],
        values: { msg: 'GREEN - Go!' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 3000 },
      },
      {
        type: 'dw_low',
        icon: '🌑',
        label: 'Turn OFF LED on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 2 }],
        values: { pin: 27 },
      },
    ],
    output: {
      description:
        'Your 3 LEDs will cycle Red → Yellow → Green → Yellow in a loop like a real traffic light. Serial Monitor shows each phase.',
      expected: [
        'Traffic Light Ready!',
        '🔴 RED   — Stop!',
        '🟡 YELLOW — Get Ready...',
        '🟢 GREEN  — Go!',
        '🟡 YELLOW — Slowing down...',
        '(repeats forever)',
      ],
      tips: [
        'Make sure each LED has its own 220Ω resistor — sharing one resistor will make them dim.',
        'Try changing the delay values — make green longer or red shorter!',
        'Challenge: add a button that acts as a pedestrian crossing button.',
        'If an LED does not light up, check polarity — long leg to resistor, short leg to GND.',
      ],
    },
    bonusChallenge: 'Can you add a buzzer that beeps once when the light turns GREEN? Connect a buzzer to pin 14 and add a tone_on block for 200ms right after the green LED turns on!',
    wiringComponent: {
      type: 'TRAFFIC_LIGHT',
      label: 'Traffic Light (3 LEDs)',
      pins: [
        { name: 'RED+',   connectTo: 'GPIO25', color: 'red'    },
        { name: 'R-GND',  connectTo: 'GND',    color: 'black'  },
        { name: 'YEL+',   connectTo: 'GPIO26', color: 'yellow' },
        { name: 'Y-GND',  connectTo: 'GND',    color: 'black'  },
        { name: 'GRN+',   connectTo: 'GPIO27', color: 'green'  },
        { name: 'G-GND',  connectTo: 'GND',    color: 'black'  },
      ],
    },
  },

  // ── 5. Distance Alarm (Advanced) ───────────────────────────────────────────
  {
    id: 'distance_alarm',
    title: 'Distance Alarm',
    description:
      'Use an ultrasonic sensor to measure distance. When something gets too close, a buzzer goes off — just like a parking sensor!',
    difficulty: 'Advanced',
    duration: '25 min',
    icon: '📡',
    tags: ['Sensor', 'Buzzer', 'Ultrasonic', 'Logic'],
    teaches: ['Ultrasonic sensor', 'Distance measurement', 'Buzzer', 'If/else conditions'],
    intro: {
      headline: 'Build a parking sensor with your ESP32!',
      what: 'Connect an HC-SR04 ultrasonic sensor and a buzzer to your ESP32. The sensor measures the distance to the nearest object. When something comes within 20cm, the buzzer beeps — just like a car parking sensor!',
      why: 'Ultrasonic sensors are used in cars, robots, automatic doors, and security systems. Learning to measure distance and trigger an alarm teaches you how real-world smart devices work.',
    },
    equipment: [
      ESP32,
      {
        name: 'HC-SR04 Ultrasonic Sensor',
        description: 'Measures distance using sound waves. Has 4 pins: VCC, GND, TRIG, ECHO.',
        emoji: '📡',
        // image: '/images/equipment/hc-sr04.jpg',  ← add this image when available
        quantity: 1,
      },
      {
        name: 'Buzzer',
        description: 'Passive or active buzzer. Makes a beep sound when triggered.',
        emoji: '🔔',
        // image: '/images/equipment/buzzer.jpg',  ← add this image when available
        quantity: 1,
      },
      BREADBOARD,
      JUMPER_WIRES(6),
      USB_CABLE,
    ],
    assemble: {
      videoUrl: 'https://www.youtube.com/embed/ZejQEQqAVnA',
      wokwiUrl: 'https://wokwi.com/projects/304993675:undefined',
      steps: [
        'Place the HC-SR04 sensor on the breadboard',
        'Connect HC-SR04 VCC → ESP32 5V (or 3.3V)',
        'Connect HC-SR04 GND → ESP32 GND',
        'Connect HC-SR04 TRIG → ESP32 GPIO 12',
        'Connect HC-SR04 ECHO → ESP32 GPIO 13',
        'Connect Buzzer positive leg → ESP32 GPIO 14',
        'Connect Buzzer negative leg → ESP32 GND',
        'Plug in USB and upload the code',
      ],
    },
    code: {
      arduino: `#define TRIG_PIN  12
#define ECHO_PIN  13
#define BUZZ_PIN  14
#define THRESHOLD 20   // cm — alarm triggers below this

long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2; // convert to cm
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZ_PIN, OUTPUT);
  Serial.println("Distance Alarm Ready!");
}

void loop() {
  long distance = getDistance();

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance < THRESHOLD && distance > 0) {
    digitalWrite(BUZZ_PIN, HIGH);
    Serial.println("⚠️ TOO CLOSE — ALARM!");
    delay(200);
    digitalWrite(BUZZ_PIN, LOW);
    delay(200);
  } else {
    digitalWrite(BUZZ_PIN, LOW);
  }

  delay(100);
}`,
      platformDescription:
        'These blocks set up the ultrasonic sensor on pins 12 and 13, read the distance into a variable, then check if it is less than 20cm. If yes, the buzzer on pin 14 beeps. Otherwise it stays off.',
    },
    playgroundBlocks: [
      {
        type: 'serial_begin',
        icon: '🔌',
        label: 'Start Serial Monitor',
        params: [],
        values: {},
      },
      {
        type: 'pinMode',
        icon: '📌',
        label: 'Set Pin <pin> as <mode>',
        params: [
          { name: 'pin', type: 'number', default: 2 },
          { name: 'mode', type: 'select', default: 'OUTPUT', options: ['OUTPUT', 'INPUT', 'INPUT_PULLUP'] },
        ],
        values: { pin: 14, mode: 'OUTPUT' },
      },
      {
        type: 'ultrasonic',
        icon: '📏',
        label: 'Read ultrasonic Trig <trig> Echo <echo> into <var>',
        params: [
          { name: 'trig', type: 'number', default: 12 },
          { name: 'echo', type: 'number', default: 13 },
          { name: 'var', type: 'text', default: 'distance' },
        ],
        values: { trig: 12, echo: 13, var: 'distance' },
      },
      {
        type: 'serial_println',
        icon: '📃',
        label: 'Print "<label>" + <var> on new line',
        params: [
          { name: 'label', type: 'text', default: 'Distance: ' },
          { name: 'var', type: 'text', default: 'distance' },
        ],
        values: { label: 'Distance: ', var: 'distance' },
      },
      {
        type: 'if_block',
        icon: '❓',
        label: 'If <cond> then ▼',
        params: [{ name: 'cond', type: 'text', default: 'temp > 30' }],
        values: { cond: 'distance < 20' },
      },
      {
        type: 'tone_on',
        icon: '🔊',
        label: 'Play buzzer on Pin <pin> at <freq> Hz',
        params: [
          { name: 'pin', type: 'number', default: 13 },
          { name: 'freq', type: 'number', default: 1000 },
        ],
        values: { pin: 14, freq: 1000 },
      },
      {
        type: 'serial_print',
        icon: '💬',
        label: 'Print "<msg>" to monitor',
        params: [{ name: 'msg', type: 'text', default: 'Hello!' }],
        values: { msg: '⚠️ TOO CLOSE — ALARM!' },
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 200 },
      },
      {
        type: 'tone_off',
        icon: '🔕',
        label: 'Stop buzzer on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 13 }],
        values: { pin: 14 },
      },
      {
        type: 'else_block',
        icon: '↩️',
        label: 'Otherwise ▼',
        params: [],
        values: {},
      },
      {
        type: 'tone_off',
        icon: '🔕',
        label: 'Stop buzzer on Pin <pin>',
        params: [{ name: 'pin', type: 'number', default: 13 }],
        values: { pin: 14 },
      },
      {
        type: 'end_if',
        icon: '🔚',
        label: 'End If ▲',
        params: [],
        values: {},
      },
      {
        type: 'delay_ms',
        icon: '⏳',
        label: 'Wait <ms> milliseconds',
        params: [{ name: 'ms', type: 'number', default: 1000 }],
        values: { ms: 100 },
      },
    ],
    output: {
      description:
        'Serial Monitor shows distance readings every 100ms. When you put your hand within 20cm of the sensor, the buzzer beeps rapidly.',
      expected: [
        'Distance Alarm Ready!',
        'Distance: 45 cm',
        'Distance: 32 cm',
        'Distance: 18 cm',
        '⚠️ TOO CLOSE — ALARM!',
        'Distance: 8 cm',
        '⚠️ TOO CLOSE — ALARM!',
        '(move hand away — alarm stops)',
      ],
      tips: [
        'HC-SR04 works best between 2cm and 400cm — closer than 2cm gives wrong readings.',
        'Try changing THRESHOLD from 20 to 30 or 10 — see how sensitive it becomes.',
        'If you get 0 or very large numbers, check your TRIG and ECHO pin connections.',
        'Challenge: make the buzzer beep faster as the object gets closer!',
        'Point the sensor at a wall and slowly walk towards it — just like a parking sensor.',
      ],
    },
    bonusChallenge: 'Can you make the buzzer beep faster the closer something gets? Try changing the delay between beeps based on distance — short delay when close, long delay when far!',
    wiringComponent: {
      type: 'DISTANCE_ALARM',
      label: 'HC-SR04 + Buzzer',
      pins: [
        { name: 'VCC',    connectTo: 'VIN',    color: 'red'    },
        { name: 'TRIG',   connectTo: 'GPIO12', color: 'orange' },
        { name: 'ECHO',   connectTo: 'GPIO13', color: 'yellow' },
        { name: 'SR-GND', connectTo: 'GND',    color: 'black'  },
        { name: 'BUZ+',   connectTo: 'GPIO14', color: 'blue'   },
        { name: 'BUZ-',   connectTo: 'GND',    color: 'black'  },
      ],
    },
  },
];