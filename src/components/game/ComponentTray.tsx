import { ComponentType } from "@/types/game";
import { componentDefinitions } from "@/engine/componentDefinitions";

interface ComponentTrayProps {
  availableComponents: ComponentType[];
  onAddComponent: (type: ComponentType) => void;
  placedTypes: ComponentType[];
}

const ComponentTray = ({ availableComponents, onAddComponent, placedTypes }: ComponentTrayProps) => {
  // Count how many of each type are needed vs placed
  const typeCounts = availableComponents.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const placedCounts = placedTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueTypes = Object.entries(typeCounts);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Components
      </h3>
      <div className="space-y-1">
        {uniqueTypes.map(([type, count]) => {
          const def = componentDefinitions[type];
          if (!def) return null;
          const placed = placedCounts[type] || 0;
          const remaining = count - placed;

          return (
            <button
              key={type}
              onClick={() => remaining > 0 && onAddComponent(type as ComponentType)}
              disabled={remaining <= 0}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                remaining > 0
                  ? "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80 cursor-pointer"
                  : "border-border/30 bg-card/30 opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="text-lg">{def.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{def.label}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {remaining}/{count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ComponentTray;
