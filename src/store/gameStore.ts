import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  StudentProfile,
  LevelProgress,
  Badge,
  Wire,
  PlacedComponent,
  JoystickDirection,
} from "@/types/game";
import { allBadges } from "@/data/badges";
import { levels } from "@/data/levels";
import { getComponentDef } from "@/engine/componentDefinitions";

interface GameState {
  // Profile
  profile: StudentProfile | null;
  setupComplete: boolean;
  setProfile: (profile: StudentProfile) => void;

  // Progress
  levelProgress: LevelProgress[];
  getLevelProgress: (levelId: number) => LevelProgress | undefined;
  completeLevel: (levelId: number, stars: number, time: number, hintsUsed: number) => void;
  isLevelUnlocked: (levelId: number) => boolean;

  // Badges
  badges: Badge[];
  checkBadges: () => void;

  // Current game session (not persisted)
  currentLevelId: number | null;
  placedComponents: PlacedComponent[];
  wires: Wire[];
  selectedPin: string | null;
  hintsUsedThisLevel: number;
  attemptsThisLevel: number;
  startTime: number | null;
  pressedButtonIds: string[];
  joystickDirection: JoystickDirection;

  // Game session actions
  startLevel: (levelId: number, initialPlacedComponents?: PlacedComponent[]) => void;
  placeComponent: (component: PlacedComponent) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: string) => void;
  selectPin: (pinId: string | null) => void;
  useHint: () => void;
  incrementAttempts: () => void;
  toggleButtonPressed: (buttonId: string) => void;
  setJoystickDirection: (direction: JoystickDirection) => void;
  resetLevel: (initialPlacedComponents?: PlacedComponent[]) => void;
  resetInteractionState: () => void;
  clearSession: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      profile: null,
      setupComplete: false,
      setProfile: (profile) => set({ profile, setupComplete: true }),

      levelProgress: [],
      getLevelProgress: (levelId) =>
        get().levelProgress.find((p) => p.levelId === levelId),
      completeLevel: (levelId, stars, time, hintsUsed) => {
        const { levelProgress, profile } = get();
        const existing = levelProgress.find((p) => p.levelId === levelId);
        const newStars = existing ? Math.max(existing.stars, stars) : stars;
        const newBestTime = existing?.bestTime
          ? Math.min(existing.bestTime, time)
          : time;

        const updated = existing
          ? levelProgress.map((p) =>
              p.levelId === levelId
                ? { ...p, completed: true, stars: newStars, bestTime: newBestTime, hintsUsed: Math.min(p.hintsUsed, hintsUsed), attempts: p.attempts + 1 }
                : p
            )
          : [...levelProgress, { levelId, completed: true, stars, bestTime: time, hintsUsed, attempts: 1 }];

        const levelDef = levels.find((l) => l.id === levelId);
        const baseReward = levelDef?.xpReward ?? 30;
        const xpGain = existing ? 0 : baseReward;

        const today = new Date().toISOString().split("T")[0];
        let newStreak = profile?.streak ?? 0;
        if (profile?.lastPlayed) {
          const lastDate = new Date(profile.lastPlayed);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          if (profile.lastPlayed === today) {
            // same day, keep streak
          } else if (profile.lastPlayed === yesterdayStr) {
            newStreak = newStreak + 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        const maxLevel = levels.length;
        const newProfile = profile
          ? {
              ...profile,
              totalXP: profile.totalXP + xpGain,
              currentLevel: Math.min(Math.max(profile.currentLevel, levelId + 1), maxLevel),
              streak: newStreak,
              lastPlayed: today,
            }
          : null;

        set({ levelProgress: updated, profile: newProfile });
        get().checkBadges();
      },
      isLevelUnlocked: (levelId) => {
        if (levelId === 1) return true;
        return get().levelProgress.some((p) => p.levelId === levelId - 1 && p.completed);
      },

      badges: allBadges.map((b) => ({ ...b })),
      checkBadges: () => {
        const { levelProgress, profile, badges } = get();
        const updated = badges.map((badge) => {
          if (badge.earned) return badge;
          switch (badge.id) {
            case "first-circuit":
              return { ...badge, earned: levelProgress.some((p) => p.completed) };
            case "speed-builder":
              return { ...badge, earned: levelProgress.filter((p) => p.stars >= 3).length >= 5 };
            case "hint-free-hero":
              return { ...badge, earned: levelProgress.filter((p) => p.completed && p.hintsUsed === 0).length >= 3 };
            case "i2c-wizard":
              return { ...badge, earned: levelProgress.some((p) => p.levelId === 11 && p.completed) };
            case "full-stack":
              return { ...badge, earned: levelProgress.some((p) => p.levelId === 13 && p.completed) };
            case "xp-500":
              return { ...badge, earned: (profile?.totalXP || 0) >= 500 };
            case "perfectionist":
              return { ...badge, earned: [1, 2, 3, 4].every((id) => levelProgress.some((p) => p.levelId === id && p.stars >= 3)) };
            case "resistor-master":
              return { ...badge, earned: [2, 3, 4, 9, 12, 13].every((id) => levelProgress.some((p) => p.levelId === id && p.completed)) };
            case "ground-champion":
              return { ...badge, earned: levelProgress.filter((p) => p.completed && p.stars >= 3).length >= 6 };
            case "led-lover":
              return { ...badge, earned: [1, 2, 3, 4, 9, 10, 12, 13].filter((id) => levelProgress.some((p) => p.levelId === id && p.completed)).length >= 8 };
            case "sandbox-creator":
              return { ...badge, earned: levelProgress.some((p) => p.levelId === 14 && p.completed) };
            case "streak-3":
              return { ...badge, earned: (profile?.streak ?? 0) >= 3 };
            default:
              return badge;
          }
        });
        set({ badges: updated });
      },

      // Session state
      currentLevelId: null,
      placedComponents: [],
      wires: [],
      selectedPin: null,
      hintsUsedThisLevel: 0,
      attemptsThisLevel: 0,
      startTime: null,
      pressedButtonIds: [],
      joystickDirection: "center",

      startLevel: (levelId, initialPlacedComponents = []) =>
        set({
          currentLevelId: levelId,
          placedComponents: initialPlacedComponents,
          wires: [],
          selectedPin: null,
          hintsUsedThisLevel: 0,
          attemptsThisLevel: 0,
          startTime: Date.now(),
          pressedButtonIds: [],
          joystickDirection: "center",
        }),
      placeComponent: (component) =>
        set((s) => ({ placedComponents: [...s.placedComponents, component] })),
      moveComponent: (id, x, y) =>
        set((s) => ({
          placedComponents: s.placedComponents.map((c) => {
            if (c.id !== id) return c;
            const def = getComponentDef(c.type);
            const pins = def.pins.map((p) => ({
              id: `${c.id}.${p.id}`,
              x: x + p.offsetX,
              y: y + p.offsetY,
              label: p.label,
            }));
            return { ...c, x, y, pins };
          }),
        })),
      removeComponent: (id) =>
        set((s) => ({
          placedComponents: s.placedComponents.filter((c) => c.id !== id),
          wires: s.wires.filter((w) => !w.fromPin.startsWith(id) && !w.toPin.startsWith(id)),
        })),
      addWire: (wire) => set((s) => ({ wires: [...s.wires, wire], selectedPin: null })),
      removeWire: (id) => set((s) => ({ wires: s.wires.filter((w) => w.id !== id) })),
      selectPin: (pinId) => set({ selectedPin: pinId }),
      useHint: () => set((s) => ({ hintsUsedThisLevel: s.hintsUsedThisLevel + 1 })),
      incrementAttempts: () => set((s) => ({ attemptsThisLevel: s.attemptsThisLevel + 1 })),
      toggleButtonPressed: (buttonId) =>
        set((s) => ({
          pressedButtonIds: s.pressedButtonIds.includes(buttonId)
            ? s.pressedButtonIds.filter((id) => id !== buttonId)
            : [...s.pressedButtonIds, buttonId],
        })),
      setJoystickDirection: (direction) => set({ joystickDirection: direction }),
      resetLevel: (initialPlacedComponents = []) =>
        set({
          placedComponents: initialPlacedComponents,
          wires: [],
          selectedPin: null,
          hintsUsedThisLevel: 0,
          attemptsThisLevel: 0,
          startTime: Date.now(),
          pressedButtonIds: [],
          joystickDirection: "center",
        }),
      resetInteractionState: () => set({ pressedButtonIds: [], joystickDirection: "center" }),
      clearSession: () =>
        set({
          currentLevelId: null,
          placedComponents: [],
          wires: [],
          selectedPin: null,
          hintsUsedThisLevel: 0,
          attemptsThisLevel: 0,
          startTime: null,
          pressedButtonIds: [],
          joystickDirection: "center",
        }),
    }),
    {
      name: "circuit-builder-storage",
      partialize: (state) => ({
        profile: state.profile,
        setupComplete: state.setupComplete,
        levelProgress: state.levelProgress,
        badges: state.badges,
      }),
    }
  )
);
