import {
  Wire,
  Connection,
  ValidationFeedback,
  ValidationConnectionState,
  PlacedComponent,
  ValidationRules,
} from "@/types/game";
import { getBaseComponentType } from "@/engine/componentInstance";

type ParsedEndpoint = { componentId: string; pinId: string };
type ParsedConnection = {
  from: ParsedEndpoint;
  to: ParsedEndpoint;
};

function parseEndpoint(endpoint: string): ParsedEndpoint {
  const [componentId, pinId] = endpoint.split(".");
  return { componentId, pinId };
}

function parseConnection(connection: Connection): ParsedConnection {
  return {
    from: parseEndpoint(connection.from),
    to: parseEndpoint(connection.to),
  };
}

function normalizePin(
  componentId: string,
  pinId: string,
  rules?: ValidationRules
): string {
  const base = getBaseComponentType(componentId);
  let normalized = pinId;
  if (
    base === "resistor-220" ||
    base === "resistor-1k" ||
    base === "resistor-10k"
  ) {
    if (pinId === "leg1" || pinId === "leg2") normalized = "leg";
  }
  if (base === "push-button") {
    if (pinId === "pin1" || pinId === "pin2") normalized = "pin";
  }

  const aliasGroups =
    rules?.pinAliases?.[componentId] ?? rules?.pinAliases?.[base] ?? [];
  for (const group of aliasGroups) {
    if (!group.includes(normalized)) continue;
    return [...group].sort().join("|");
  }

  return normalized;
}

function getMappingGroup(componentId: string): string {
  const base = getBaseComponentType(componentId);
  if (base.startsWith("led-")) {
    return "led";
  }
  return base;
}

function makeUndirectedKey(
  aComponent: string,
  aPin: string,
  bComponent: string,
  bPin: string
): string {
  const left = `${aComponent}.${aPin}`;
  const right = `${bComponent}.${bPin}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function normalizeElectricalPin(pinId: string): string {
  return pinId.toUpperCase();
}

function isGroundPin(pinId: string): boolean {
  return normalizeElectricalPin(pinId) === "GND";
}

function isPowerPin(pinId: string): boolean {
  const normalized = normalizeElectricalPin(pinId);
  return normalized === "5V" || normalized === "VCC";
}

function endpointMatchesRule(
  endpoint: ParsedEndpoint,
  ruleEndpoint: ParsedEndpoint
): boolean {
  const endpointBase = getBaseComponentType(endpoint.componentId);
  const ruleBase = getBaseComponentType(ruleEndpoint.componentId);
  const componentMatches =
    endpoint.componentId === ruleEndpoint.componentId || endpointBase === ruleBase;
  return (
    componentMatches &&
    normalizePin(endpoint.componentId, endpoint.pinId) ===
      normalizePin(ruleEndpoint.componentId, ruleEndpoint.pinId)
  );
}

function detectDangerousWires(wires: Wire[], forbiddenConnections: Connection[]) {
  const dangerousWires: string[] = [];
  const dangerousLedIds = new Set<string>();
  const parsedForbidden = forbiddenConnections.map(parseConnection);

  for (const wire of wires) {
    const from = parseEndpoint(wire.fromPin);
    const to = parseEndpoint(wire.toPin);

    const globalDanger =
      (isPowerPin(from.pinId) && isGroundPin(to.pinId)) ||
      (isGroundPin(from.pinId) && isPowerPin(to.pinId));

    const levelDanger = parsedForbidden.some(
      (forbidden) =>
        (endpointMatchesRule(from, forbidden.from) &&
          endpointMatchesRule(to, forbidden.to)) ||
        (endpointMatchesRule(from, forbidden.to) &&
          endpointMatchesRule(to, forbidden.from))
    );

    if (globalDanger || levelDanger) {
      dangerousWires.push(wire.id);
      if (getBaseComponentType(from.componentId).startsWith("led-")) {
        dangerousLedIds.add(from.componentId);
      }
      if (getBaseComponentType(to.componentId).startsWith("led-")) {
        dangerousLedIds.add(to.componentId);
      }
    }
  }

  return {
    dangerousWires,
    dangerousLedIds: Array.from(dangerousLedIds),
  };
}

function collectExpectedByBase(
  connections: ParsedConnection[]
): Map<string, string[]> {
  const byBase = new Map<string, Set<string>>();
  for (const conn of connections) {
    for (const endpoint of [conn.from, conn.to]) {
      const base = getMappingGroup(endpoint.componentId);
      if (!byBase.has(base)) byBase.set(base, new Set<string>());
      byBase.get(base)?.add(endpoint.componentId);
    }
  }
  const result = new Map<string, string[]>();
  for (const [base, ids] of byBase.entries()) {
    result.set(base, Array.from(ids).sort());
  }
  return result;
}

function collectActualByBaseFromWires(wires: Wire[]): Map<string, string[]> {
  const byBase = new Map<string, Set<string>>();
  for (const wire of wires) {
    const endpoints = [parseEndpoint(wire.fromPin), parseEndpoint(wire.toPin)];
    for (const endpoint of endpoints) {
      const base = getMappingGroup(endpoint.componentId);
      if (!byBase.has(base)) byBase.set(base, new Set<string>());
      byBase.get(base)?.add(endpoint.componentId);
    }
  }
  const result = new Map<string, string[]>();
  for (const [base, ids] of byBase.entries()) {
    result.set(base, Array.from(ids).sort());
  }
  return result;
}

function collectActualByBaseFromPlacedComponents(
  placedComponents: PlacedComponent[]
): Map<string, string[]> {
  const byBase = new Map<string, Set<string>>();
  for (const component of placedComponents) {
    const base = getMappingGroup(component.id);
    if (!byBase.has(base)) byBase.set(base, new Set<string>());
    byBase.get(base)?.add(component.id);
  }
  const result = new Map<string, string[]>();
  for (const [base, ids] of byBase.entries()) {
    result.set(base, Array.from(ids).sort());
  }
  return result;
}

function generatePartialMappings(
  expectedIds: string[],
  actualIds: string[]
): Array<Map<string, string>> {
  const mappings: Array<Map<string, string>> = [];
  const usedActual = new Set<string>();
  const current = new Map<string, string>();
  const requireFullExpectedMapping = actualIds.length >= expectedIds.length;

  const dfs = (index: number) => {
    if (index === expectedIds.length) {
      mappings.push(new Map(current));
      return;
    }

    // Only allow leaving expected components unmapped when there are fewer
    // actual instances than expected instances for this base type.
    if (!requireFullExpectedMapping) {
      dfs(index + 1);
    }

    // Option 2: map this expected component to any unused actual component.
    for (const actualId of actualIds) {
      if (usedActual.has(actualId)) continue;
      usedActual.add(actualId);
      current.set(expectedIds[index], actualId);
      dfs(index + 1);
      current.delete(expectedIds[index]);
      usedActual.delete(actualId);
    }
  };

  dfs(0);
  return mappings;
}

function mergeMaps(base: Map<string, string>, next: Map<string, string>) {
  const merged = new Map(base);
  for (const [k, v] of next.entries()) merged.set(k, v);
  return merged;
}

function buildAllMappings(
  expectedByBase: Map<string, string[]>,
  actualByBase: Map<string, string[]>
): Array<Map<string, string>> {
  const bases = Array.from(expectedByBase.keys());
  let combined: Array<Map<string, string>> = [new Map()];

  for (const base of bases) {
    const expectedIds = expectedByBase.get(base) ?? [];
    const actualIds = actualByBase.get(base) ?? [];
    const localMappings = generatePartialMappings(expectedIds, actualIds);
    const nextCombined: Array<Map<string, string>> = [];
    for (const globalMap of combined) {
      for (const localMap of localMappings) {
        nextCombined.push(mergeMaps(globalMap, localMap));
      }
    }
    combined = nextCombined;
  }

  return combined;
}

function applyComponentMap(componentId: string, map: Map<string, string>) {
  return map.get(componentId) ?? componentId;
}

function evaluateMapping(
  wires: Wire[],
  expectedConnections: ParsedConnection[],
  componentMap: Map<string, string>,
  rules?: ValidationRules
) {
  const expectedConnectionStates = expectedConnections.map((connection, index) => {
    const fromComp = applyComponentMap(connection.from.componentId, componentMap);
    const toComp = applyComponentMap(connection.to.componentId, componentMap);
    const fromPin = normalizePin(fromComp, connection.from.pinId, rules);
    const toPin = normalizePin(toComp, connection.to.pinId, rules);
    const key = makeUndirectedKey(fromComp, fromPin, toComp, toPin);
    return {
      index,
      key,
      from: `${fromComp}.${connection.from.pinId}`,
      to: `${toComp}.${connection.to.pinId}`,
    };
  });

  const expectedKeys = new Set(expectedConnectionStates.map((conn) => conn.key));

  const userKeys = wires.map((w) => {
    const from = parseEndpoint(w.fromPin);
    const to = parseEndpoint(w.toPin);
    const fromPin = normalizePin(from.componentId, from.pinId, rules);
    const toPin = normalizePin(to.componentId, to.pinId, rules);
    return makeUndirectedKey(
      from.componentId,
      fromPin,
      to.componentId,
      toPin
    );
  });

  const userKeySet = new Set(userKeys);
  let correctCount = 0;
  for (const key of expectedKeys) {
    if (userKeySet.has(key)) correctCount++;
  }

  const wrongWires: string[] = [];
  wires.forEach((wire, idx) => {
    if (!expectedKeys.has(userKeys[idx])) wrongWires.push(wire.id);
  });

  return {
    correctCount,
    wrongWires,
    totalRequired: expectedConnections.length,
    expectedConnectionStates: expectedConnectionStates.map((conn) => ({
      ...conn,
      completed: userKeySet.has(conn.key),
    })),
  };
}

function pickBestEvaluation(
  evaluations: Array<{
    correctCount: number;
    wrongWires: string[];
    totalRequired: number;
    expectedConnectionStates: Array<{
      index: number;
      key: string;
      from: string;
      to: string;
      completed: boolean;
    }>;
  }>
) {
  let best = evaluations[0];
  for (const evalResult of evaluations.slice(1)) {
    if (evalResult.wrongWires.length < best.wrongWires.length) {
      best = evalResult;
      continue;
    }
    if (
      evalResult.wrongWires.length === best.wrongWires.length &&
      evalResult.correctCount > best.correctCount
    ) {
      best = evalResult;
    }
  }
  return best;
}

export interface CircuitAnalysis {
  result: "success" | "partial" | "wrong" | "danger";
  correctCount: number;
  totalRequired: number;
  wrongWires: string[];
  dangerousWires: string[];
  dangerousLedIds: string[];
  isHardFailed: boolean;
  connectionStates: ValidationConnectionState[];
}

export function analyzeCircuit(
  wires: Wire[],
  correctConnections: Connection[],
  placedComponents: PlacedComponent[] = [],
  dangerousConnections: Connection[] = [],
  rules?: ValidationRules
): CircuitAnalysis {
  const dangerAnalysis = detectDangerousWires(wires, dangerousConnections);

  if (correctConnections.length === 0) {
    if (dangerAnalysis.dangerousWires.length > 0) {
      return {
        result: "danger",
        correctCount: 0,
        totalRequired: 0,
        wrongWires: dangerAnalysis.dangerousWires,
        dangerousWires: dangerAnalysis.dangerousWires,
        dangerousLedIds: dangerAnalysis.dangerousLedIds,
        isHardFailed: true,
        connectionStates: [],
      };
    }
    if (wires.length === 0) {
      return {
        result: "partial",
        correctCount: 0,
        totalRequired: 0,
        wrongWires: [],
        dangerousWires: [],
        dangerousLedIds: [],
        isHardFailed: false,
        connectionStates: [],
      };
    }
    return {
      result: "success",
      correctCount: 0,
      totalRequired: 0,
      wrongWires: [],
      dangerousWires: [],
      dangerousLedIds: [],
      isHardFailed: false,
      connectionStates: [],
    };
  }

  const parsedExpected = correctConnections.map(parseConnection);
  const expectedByBase = collectExpectedByBase(parsedExpected);
  const actualByBase =
    placedComponents.length > 0
      ? collectActualByBaseFromPlacedComponents(placedComponents)
      : collectActualByBaseFromWires(wires);
  const allMappings = buildAllMappings(expectedByBase, actualByBase);
  const evaluations = allMappings.map((mapping) =>
    evaluateMapping(wires, parsedExpected, mapping, rules)
  );
  const bestEvaluation = pickBestEvaluation(evaluations);
  const { correctCount, wrongWires, expectedConnectionStates } = bestEvaluation;
  const mergedWrongWires = Array.from(
    new Set([...wrongWires, ...dangerAnalysis.dangerousWires])
  );

  if (dangerAnalysis.dangerousWires.length > 0) {
    return {
      result: "danger",
      correctCount,
      totalRequired: correctConnections.length,
      wrongWires: mergedWrongWires,
      dangerousWires: dangerAnalysis.dangerousWires,
      dangerousLedIds: dangerAnalysis.dangerousLedIds,
      isHardFailed: true,
      connectionStates: expectedConnectionStates.map(({ index, from, to, completed }) => ({
        index,
        from,
        to,
        completed,
      })),
    };
  }

  if (correctCount === correctConnections.length && wrongWires.length === 0) {
    return {
      result: "success",
      correctCount,
      totalRequired: correctConnections.length,
      wrongWires: [],
      dangerousWires: [],
      dangerousLedIds: [],
      isHardFailed: false,
      connectionStates: expectedConnectionStates.map(({ index, from, to, completed }) => ({
        index,
        from,
        to,
        completed,
      })),
    };
  }

  if (wrongWires.length > 0) {
    return {
      result: "wrong",
      correctCount,
      totalRequired: correctConnections.length,
      wrongWires,
      dangerousWires: [],
      dangerousLedIds: [],
      isHardFailed: false,
      connectionStates: expectedConnectionStates.map(({ index, from, to, completed }) => ({
        index,
        from,
        to,
        completed,
      })),
    };
  }

  return {
    result: "partial",
    correctCount,
    totalRequired: correctConnections.length,
    wrongWires: [],
    dangerousWires: [],
    dangerousLedIds: [],
    isHardFailed: false,
    connectionStates: expectedConnectionStates.map(({ index, from, to, completed }) => ({
      index,
      from,
      to,
      completed,
    })),
  };
}

export function validateCircuit(
  wires: Wire[],
  correctConnections: Connection[],
  placedComponents: PlacedComponent[] = [],
  dangerousConnections: Connection[] = [],
  rules?: ValidationRules
): ValidationFeedback {
  const analysis = analyzeCircuit(
    wires,
    correctConnections,
    placedComponents,
    dangerousConnections,
    rules
  );
  if (analysis.result === "danger") {
    return {
      ...analysis,
      message:
        "Dangerous short circuit detected! LED burst triggered and this attempt has failed. Reset to try again.",
    };
  }

  if (analysis.totalRequired === 0) {
    if (wires.length === 0) {
      return {
        ...analysis,
        message: "Place some components and connect wires first! 🔌",
      };
    }
    return {
      ...analysis,
      message: "Sandbox mode — nice build! 🎨",
    };
  }

  if (analysis.result === "success") {
    return {
      ...analysis,
      message: "Perfect circuit! Everything is connected correctly! 🎉",
    };
  }

  if (analysis.result === "wrong") {
    return {
      ...analysis,
      message: "Oops! Some wires aren't right — try checking the red ones! ⚡",
    };
  }

  return {
    ...analysis,
    message: `Getting there! ${analysis.correctCount}/${analysis.totalRequired} connections done. Keep going! 💪`,
  };
}
