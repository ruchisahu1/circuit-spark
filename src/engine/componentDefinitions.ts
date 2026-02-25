import { ComponentType, Pin, PlacedComponent } from "@/types/game";

export const ARDUINO_POWER_PINS = [
  "5V", "pin2", "pin3", "pin9", "pin10", "pin11", "pin12", "pin13", "TX", "RX",
];
export const ARDUINO_GROUND_PINS = ["GND"];

interface ComponentDefinition {
  type: ComponentType;
  label: string;
  emoji: string;
  width: number;
  height: number;
  color: string;
  pins: { id: string; label: string; offsetX: number; offsetY: number }[];
}

export const componentDefinitions: Record<string, ComponentDefinition> = {
  "arduino-nano": {
    type: "arduino-nano",
    label: "Arduino Nano",
    emoji: "🔲",
    width: 140,
    height: 200,
    color: "hsl(200, 75%, 50%)",
    pins: [
      { id: "5V", label: "5V", offsetX: 0, offsetY: 20 },
      { id: "GND", label: "GND", offsetX: 0, offsetY: 50 },
      { id: "pin2", label: "D2", offsetX: 0, offsetY: 80 },
      { id: "pin9", label: "D9~", offsetX: 0, offsetY: 110 },
      { id: "pin10", label: "D10~", offsetX: 0, offsetY: 140 },
      { id: "pin11", label: "D11~", offsetX: 0, offsetY: 170 },
      { id: "pin12", label: "D12", offsetX: 140, offsetY: 20 },
      { id: "pin13", label: "D13", offsetX: 140, offsetY: 50 },
      { id: "TX", label: "TX", offsetX: 140, offsetY: 80 },
      { id: "RX", label: "RX", offsetX: 140, offsetY: 110 },
      { id: "A0", label: "A0", offsetX: 140, offsetY: 140 },
      { id: "A1", label: "A1", offsetX: 140, offsetY: 170 },
      { id: "A4", label: "A4", offsetX: 70, offsetY: 200 },
      { id: "A5", label: "A5", offsetX: 100, offsetY: 200 },
    ],
  },
  "led-red": {
    type: "led-red",
    label: "Red LED",
    emoji: "🔴",
    width: 50,
    height: 70,
    color: "hsl(0, 80%, 55%)",
    pins: [
      { id: "anode", label: "+", offsetX: 15, offsetY: 0 },
      { id: "cathode", label: "−", offsetX: 35, offsetY: 0 },
    ],
  },
  "led-green": {
    type: "led-green",
    label: "Green LED",
    emoji: "🟢",
    width: 50,
    height: 70,
    color: "hsl(140, 70%, 45%)",
    pins: [
      { id: "anode", label: "+", offsetX: 15, offsetY: 0 },
      { id: "cathode", label: "−", offsetX: 35, offsetY: 0 },
    ],
  },
  "led-yellow": {
    type: "led-yellow",
    label: "Yellow LED",
    emoji: "🟡",
    width: 50,
    height: 70,
    color: "hsl(50, 100%, 55%)",
    pins: [
      { id: "anode", label: "+", offsetX: 15, offsetY: 0 },
      { id: "cathode", label: "−", offsetX: 35, offsetY: 0 },
    ],
  },
  "led-blue": {
    type: "led-blue",
    label: "Blue LED",
    emoji: "🔵",
    width: 50,
    height: 70,
    color: "hsl(210, 100%, 55%)",
    pins: [
      { id: "anode", label: "+", offsetX: 15, offsetY: 0 },
      { id: "cathode", label: "−", offsetX: 35, offsetY: 0 },
    ],
  },
  "resistor-220": {
    type: "resistor-220",
    label: "220Ω Resistor",
    emoji: "⚡",
    width: 70,
    height: 30,
    color: "hsl(30, 60%, 50%)",
    pins: [
      { id: "leg1", label: "1", offsetX: 0, offsetY: 15 },
      { id: "leg2", label: "2", offsetX: 70, offsetY: 15 },
    ],
  },
  "resistor-1k": {
    type: "resistor-1k",
    label: "1kΩ Resistor",
    emoji: "⚡",
    width: 70,
    height: 30,
    color: "hsl(20, 60%, 45%)",
    pins: [
      { id: "leg1", label: "1", offsetX: 0, offsetY: 15 },
      { id: "leg2", label: "2", offsetX: 70, offsetY: 15 },
    ],
  },
  "resistor-10k": {
    type: "resistor-10k",
    label: "10kΩ Resistor",
    emoji: "⚡",
    width: 70,
    height: 30,
    color: "hsl(25, 50%, 40%)",
    pins: [
      { id: "leg1", label: "1", offsetX: 0, offsetY: 15 },
      { id: "leg2", label: "2", offsetX: 70, offsetY: 15 },
    ],
  },
  "push-button": {
    type: "push-button",
    label: "Push Button",
    emoji: "🔘",
    width: 60,
    height: 60,
    color: "hsl(0, 0%, 50%)",
    pins: [
      { id: "pin1", label: "1", offsetX: 0, offsetY: 20 },
      { id: "pin2", label: "2", offsetX: 60, offsetY: 20 },
    ],
  },
  joystick: {
    type: "joystick",
    label: "Joystick",
    emoji: "🕹️",
    width: 80,
    height: 100,
    color: "hsl(200, 60%, 40%)",
    pins: [
      { id: "VCC", label: "VCC", offsetX: 0, offsetY: 15 },
      { id: "GND", label: "GND", offsetX: 0, offsetY: 40 },
      { id: "VRx", label: "VRx", offsetX: 0, offsetY: 65 },
      { id: "VRy", label: "VRy", offsetX: 0, offsetY: 90 },
    ],
  },
  "lcd-i2c": {
    type: "lcd-i2c",
    label: "LCD Display",
    emoji: "📺",
    width: 120,
    height: 60,
    color: "hsl(180, 50%, 30%)",
    pins: [
      { id: "VCC", label: "VCC", offsetX: 10, offsetY: 60 },
      { id: "GND", label: "GND", offsetX: 40, offsetY: 60 },
      { id: "SDA", label: "SDA", offsetX: 70, offsetY: 60 },
      { id: "SCL", label: "SCL", offsetX: 100, offsetY: 60 },
    ],
  },
  capacitor: {
    type: "capacitor",
    label: "Capacitor",
    emoji: "🔋",
    width: 40,
    height: 50,
    color: "hsl(50, 40%, 50%)",
    pins: [
      { id: "positive", label: "+", offsetX: 10, offsetY: 0 },
      { id: "negative", label: "−", offsetX: 30, offsetY: 0 },
    ],
  },
  buzzer: {
    type: "buzzer",
    label: "Buzzer",
    emoji: "🔊",
    width: 50,
    height: 50,
    color: "hsl(0, 0%, 30%)",
    pins: [
      { id: "positive", label: "+", offsetX: 15, offsetY: 0 },
      { id: "negative", label: "−", offsetX: 35, offsetY: 0 },
    ],
  },
  motor: {
    type: "motor",
    label: "DC Motor",
    emoji: "⚙️",
    width: 60,
    height: 60,
    color: "hsl(30, 70%, 45%)",
    pins: [
      { id: "positive", label: "+", offsetX: 15, offsetY: 0 },
      { id: "negative", label: "−", offsetX: 45, offsetY: 0 },
    ],
  },
};

export function createPlacedComponent(
  type: ComponentType,
  x: number,
  y: number,
  existingComponents: PlacedComponent[]
): PlacedComponent {
  const def = componentDefinitions[type];
  if (!def) throw new Error(`Unknown component type: ${type}`);

  // Generate unique instance ID with suffix for duplicates
  const sameTypeCount = existingComponents.filter((c) => c.type === type).length;
  const suffix = sameTypeCount > 0 ? `-${String.fromCharCode(96 + sameTypeCount)}` : "";
  const instanceId = `${type}${suffix}`;

  const pins: Pin[] = def.pins.map((p) => ({
    id: `${instanceId}.${p.id}`,
    x: x + p.offsetX,
    y: y + p.offsetY,
    label: p.label,
  }));

  return { id: instanceId, type, x, y, pins };
}

export function getComponentDef(type: ComponentType) {
  return componentDefinitions[type];
}

// Auto-place components in reasonable positions on the canvas
export function getAutoPlacePosition(
  type: ComponentType,
  existingComponents: PlacedComponent[]
): { x: number; y: number } {
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const SAFE_MARGIN = 10;
  const SPACING = 20;

  const def = componentDefinitions[type];
  if (!def) return { x: 300, y: 200 };

  const preferredPositions: Record<string, { x: number; y: number }> = {
    "arduino-nano": { x: 50, y: 80 },
    "led-red": { x: 330, y: 70 },
    "led-green": { x: 330, y: 180 },
    "led-yellow": { x: 330, y: 290 },
    "led-blue": { x: 330, y: 400 },
    "resistor-220": { x: 220, y: 90 },
    "resistor-1k": { x: 220, y: 170 },
    "resistor-10k": { x: 220, y: 250 },
    "push-button": { x: 220, y: 330 },
    joystick: { x: 470, y: 80 },
    "lcd-i2c": { x: 430, y: 220 },
    capacitor: { x: 470, y: 330 },
    buzzer: { x: 500, y: 420 },
    motor: { x: 330, y: 330 },
  };

  const clampPosition = (x: number, y: number) => ({
    x: Math.min(
      CANVAS_WIDTH - def.width - SAFE_MARGIN,
      Math.max(SAFE_MARGIN, x)
    ),
    y: Math.min(
      CANVAS_HEIGHT - def.height - SAFE_MARGIN,
      Math.max(SAFE_MARGIN, y)
    ),
  });

  const overlaps = (x: number, y: number) => {
    const left = x - SPACING;
    const right = x + def.width + SPACING;
    const top = y - SPACING;
    const bottom = y + def.height + SPACING;
    return existingComponents.some((c) => {
      const existingDef = componentDefinitions[c.type];
      if (!existingDef) return false;
      const existingLeft = c.x;
      const existingRight = c.x + existingDef.width;
      const existingTop = c.y;
      const existingBottom = c.y + existingDef.height;
      return !(
        right < existingLeft ||
        left > existingRight ||
        bottom < existingTop ||
        top > existingBottom
      );
    });
  };

  if (type === "arduino-nano") {
    return clampPosition(50, 80);
  }

  const preferred = preferredPositions[type] || { x: 300, y: 200 };
  const sameType = existingComponents.filter((c) => c.type === type).length;

  const candidates: Array<{ x: number; y: number }> = [];
  candidates.push(clampPosition(preferred.x, preferred.y));

  // Nearby fallback spots for same component type.
  for (let i = 0; i < 6; i++) {
    candidates.push(
      clampPosition(preferred.x + (i % 3) * 110, preferred.y + Math.floor(i / 3) * 110)
    );
  }

  // Broad grid sweep for truly open space.
  for (let y = 40; y <= 420; y += 90) {
    for (let x = 180; x <= 520; x += 100) {
      candidates.push(clampPosition(x, y));
    }
  }

  for (const pos of candidates) {
    if (!overlaps(pos.x, pos.y)) {
      return pos;
    }
  }

  // Last-resort offset if canvas is packed.
  return clampPosition(preferred.x + sameType * 25, preferred.y + sameType * 25);
}
