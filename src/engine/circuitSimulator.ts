import { Wire, PlacedComponent, JoystickDirection } from "@/types/game";
import { getBaseComponentType } from "@/engine/componentInstance";
import { ARDUINO_POWER_PINS, ARDUINO_GROUND_PINS } from "@/engine/componentDefinitions";

type Graph = Map<string, Set<string>>;

function addEdge(graph: Graph, a: string, b: string): void {
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a)!.add(b);
  graph.get(b)!.add(a);
}

function getInternalConnections(
  component: PlacedComponent,
  pressedButtonIds: string[],
  joystickDirection: JoystickDirection
): Array<[string, string]> {
  const base = getBaseComponentType(component.id);
  const id = component.id;
  const edges: Array<[string, string]> = [];

  if (base.startsWith("resistor-")) {
    edges.push([`${id}.leg1`, `${id}.leg2`]);
  } else if (base === "push-button") {
    if (pressedButtonIds.includes(id)) {
      edges.push([`${id}.pin1`, `${id}.pin2`]);
    }
  } else if (base === "capacitor") {
    edges.push([`${id}.positive`, `${id}.negative`]);
  } else if (base === "buzzer") {
    edges.push([`${id}.positive`, `${id}.negative`]);
  } else if (base === "motor") {
    edges.push([`${id}.positive`, `${id}.negative`]);
  }
  // LEDs are intentionally excluded — they are not pass-through.
  // Joystick internal connections are handled via dynamic power/ground sets.

  return edges;
}

function buildCircuitGraph(
  wires: Wire[],
  placedComponents: PlacedComponent[],
  pressedButtonIds: string[],
  joystickDirection: JoystickDirection
): Graph {
  const graph: Graph = new Map();

  for (const wire of wires) {
    addEdge(graph, wire.fromPin, wire.toPin);
  }

  for (const component of placedComponents) {
    const internal = getInternalConnections(component, pressedButtonIds, joystickDirection);
    for (const [a, b] of internal) {
      addEdge(graph, a, b);
    }
  }

  return graph;
}

function canReachAny(graph: Graph, start: string, targets: Set<string>): boolean {
  if (targets.has(start)) return true;
  const visited = new Set<string>();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      if (targets.has(neighbor)) return true;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
  return false;
}

function collectPowerAndGroundPins(
  placedComponents: PlacedComponent[],
  joystickDirection: JoystickDirection
): { powerPins: Set<string>; groundPins: Set<string> } {
  const powerPins = new Set<string>();
  const groundPins = new Set<string>();

  for (const component of placedComponents) {
    const base = getBaseComponentType(component.id);

    if (base === "arduino-nano") {
      for (const pinId of ARDUINO_POWER_PINS) {
        powerPins.add(`${component.id}.${pinId}`);
      }
      for (const pinId of ARDUINO_GROUND_PINS) {
        groundPins.add(`${component.id}.${pinId}`);
      }
    } else if (base === "joystick") {
      if (joystickDirection === "up") {
        powerPins.add(`${component.id}.VRy`);
      } else if (joystickDirection === "down") {
        groundPins.add(`${component.id}.VRy`);
      }
    }
  }

  return { powerPins, groundPins };
}

export function getSimulatedPoweredLedIds(
  wires: Wire[],
  placedComponents: PlacedComponent[],
  pressedButtonIds: string[],
  joystickDirection: JoystickDirection
): string[] {
  const graph = buildCircuitGraph(wires, placedComponents, pressedButtonIds, joystickDirection);
  const { powerPins, groundPins } = collectPowerAndGroundPins(placedComponents, joystickDirection);

  const poweredLeds: string[] = [];

  for (const component of placedComponents) {
    const base = getBaseComponentType(component.id);
    if (!base.startsWith("led-")) continue;

    const anodePin = `${component.id}.anode`;
    const cathodePin = `${component.id}.cathode`;

    const anodePowered = canReachAny(graph, anodePin, powerPins);
    const cathodeGrounded = canReachAny(graph, cathodePin, groundPins);

    if (anodePowered && cathodeGrounded) {
      poweredLeds.push(component.id);
    }
  }

  return poweredLeds;
}

export function getSimulatedActiveLcdIds(
  wires: Wire[],
  placedComponents: PlacedComponent[],
  pressedButtonIds: string[],
  joystickDirection: JoystickDirection
): string[] {
  const graph = buildCircuitGraph(wires, placedComponents, pressedButtonIds, joystickDirection);
  const { powerPins, groundPins } = collectPowerAndGroundPins(placedComponents, joystickDirection);

  const activeLcds: string[] = [];

  for (const component of placedComponents) {
    if (getBaseComponentType(component.id) !== "lcd-i2c") continue;

    const vccPowered = canReachAny(graph, `${component.id}.VCC`, powerPins);
    const gndGrounded = canReachAny(graph, `${component.id}.GND`, groundPins);

    if (vccPowered && gndGrounded) {
      activeLcds.push(component.id);
    }
  }

  return activeLcds;
}

export function getSimulatedActiveMotorIds(
  wires: Wire[],
  placedComponents: PlacedComponent[],
  pressedButtonIds: string[],
  joystickDirection: JoystickDirection
): string[] {
  const graph = buildCircuitGraph(wires, placedComponents, pressedButtonIds, joystickDirection);
  const { powerPins, groundPins } = collectPowerAndGroundPins(placedComponents, joystickDirection);

  const activeMotors: string[] = [];

  for (const component of placedComponents) {
    if (getBaseComponentType(component.id) !== "motor") continue;

    const posPowered = canReachAny(graph, `${component.id}.positive`, powerPins);
    const negGrounded = canReachAny(graph, `${component.id}.negative`, groundPins);

    if (posPowered && negGrounded) {
      activeMotors.push(component.id);
    }
  }

  return activeMotors;
}
