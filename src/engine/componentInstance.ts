import { componentDefinitions } from "@/engine/componentDefinitions";

const knownTypes = Object.keys(componentDefinitions).sort(
  (a, b) => b.length - a.length
);

function hasInstanceSuffix(componentId: string, baseType: string): boolean {
  if (componentId === baseType) return false;
  if (!componentId.startsWith(`${baseType}-`)) return false;
  return componentId.length > baseType.length + 1;
}

export function getBaseComponentType(componentId: string): string {
  for (const type of knownTypes) {
    if (componentId === type || hasInstanceSuffix(componentId, type)) {
      return type;
    }
  }
  return componentId;
}
