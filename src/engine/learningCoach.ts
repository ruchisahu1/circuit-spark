import { analyzeCircuit } from "@/engine/circuitValidator";
import { ConnectionTask, LevelDefinition, PlacedComponent, Wire } from "@/types/game";

export interface LearningCoachFeedback {
  tasks: ConnectionTask[];
  primaryMessage: string;
  progressText: string;
}

type Endpoint = { componentId: string; pinId: string };

function parseEndpoint(endpoint: string): Endpoint {
  const [componentId, pinId] = endpoint.split(".");
  return { componentId, pinId };
}

function buildPrimaryMessage(matched: number, total: number) {
  if (total === 0) {
    return "Sandbox mode: pick one small idea, wire it, then test.";
  }
  if (matched === 0) {
    return "Follow the task list from top to bottom. Start with Task 1.";
  }
  if (matched < total) {
    return `Nice progress: ${matched}/${total} tasks done. Continue the next unchecked task.`;
  }
  return "All tasks look complete. Press Check Circuit.";
}

function cleanComponentId(componentId: string): string {
  return componentId.replace(/-[a-z]$/, "");
}

function formatComponentName(componentId: string): string {
  const base = cleanComponentId(componentId);
  if (base === "arduino-nano") return "Arduino";
  if (base.startsWith("led-")) {
    const color = base.replace("led-", "");
    return `${color} LED`;
  }
  if (base.startsWith("resistor-")) return "resistor";
  if (base === "push-button") return "button";
  if (base === "lcd-i2c") return "LCD";
  return base.replace(/-/g, " ");
}

function formatPinName(pinId: string): string {
  if (pinId === "GND" || pinId === "VCC" || pinId === "TX" || pinId === "RX") return pinId;
  if (/^pin\d+$/.test(pinId)) return pinId.replace("pin", "pin ");
  return pinId;
}

function toInstruction(from: string, to: string): string {
  const fromEndpoint = parseEndpoint(from);
  const toEndpoint = parseEndpoint(to);
  return `Connect ${formatComponentName(fromEndpoint.componentId)} ${formatPinName(fromEndpoint.pinId)} to ${formatComponentName(toEndpoint.componentId)} ${formatPinName(toEndpoint.pinId)}.`;
}

export function analyzeLearningCoach(
  level: LevelDefinition,
  wires: Wire[],
  placedComponents: PlacedComponent[] = []
): LearningCoachFeedback {
  const analysis = analyzeCircuit(wires, level.correctConnections, placedComponents);
  const tasks: ConnectionTask[] = analysis.connectionStates.map((connection) => ({
    id: `connection-task-${connection.index}`,
    fromPin: connection.from,
    toPin: connection.to,
    instruction: toInstruction(connection.from, connection.to),
    completed: connection.completed,
  }));

  return {
    tasks,
    primaryMessage: buildPrimaryMessage(analysis.correctCount, analysis.totalRequired),
    progressText: `${analysis.correctCount}/${analysis.totalRequired} tasks completed`,
  };
}
