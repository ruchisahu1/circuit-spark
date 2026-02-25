import { getBaseComponentType } from "@/engine/componentInstance";
import { LevelDefinition } from "@/types/game";

type ParsedEndpoint = { componentId: string; pinId: string };

function parseEndpoint(endpoint: string): ParsedEndpoint {
  const [componentId, pinId] = endpoint.split(".");
  return { componentId, pinId };
}

function collectExpectedInstanceCounts(level: LevelDefinition): Map<string, number> {
  const byBase = new Map<string, Set<string>>();

  for (const connection of level.correctConnections) {
    for (const endpoint of [connection.from, connection.to]) {
      const parsed = parseEndpoint(endpoint);
      const base = getBaseComponentType(parsed.componentId);
      if (!byBase.has(base)) byBase.set(base, new Set<string>());
      byBase.get(base)?.add(parsed.componentId);
    }
  }

  const result = new Map<string, number>();
  for (const [base, ids] of byBase.entries()) {
    result.set(base, ids.size);
  }
  return result;
}

function collectAvailableTypeCounts(level: LevelDefinition): Map<string, number> {
  const counts = new Map<string, number>();
  for (const type of level.components) {
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return counts;
}

export function getLevelConsistencyIssues(levels: LevelDefinition[]): string[] {
  const issues: string[] = [];

  for (const level of levels) {
    const expectedByBase = collectExpectedInstanceCounts(level);
    const availableByType = collectAvailableTypeCounts(level);

    for (const [base, requiredCount] of expectedByBase.entries()) {
      const availableCount = availableByType.get(base) ?? 0;
      if (requiredCount !== availableCount) {
        issues.push(
          `Level ${level.id} (${level.title}): expected ${requiredCount} "${base}" instance(s) in correctConnections, but components tray provides ${availableCount}.`
        );
      }
    }
  }

  return issues;
}
