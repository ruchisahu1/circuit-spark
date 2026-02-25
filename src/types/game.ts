export type ComponentType =
  | "arduino-nano"
  | "led-red"
  | "led-green"
  | "led-yellow"
  | "led-blue"
  | "resistor-220"
  | "resistor-1k"
  | "resistor-10k"
  | "push-button"
  | "joystick"
  | "lcd-i2c"
  | "capacitor"
  | "buzzer"
  | "motor";

export interface Pin {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface PlacedComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  pins: Pin[];
}

export type JoystickDirection = "up" | "down" | "center";

export interface Wire {
  id: string;
  fromPin: string;
  toPin: string;
  color: string;
}

export interface Connection {
  from: string;
  to: string;
}

export interface ValidationRules {
  pinAliases?: Record<string, string[][]>;
}

export interface ConnectionTask {
  id: string;
  fromPin: string;
  toPin: string;
  instruction: string;
  completed: boolean;
}

export interface HintPinPair {
  fromPin: string;
  toPin: string;
  flashId?: number;
}

export interface GuidancePhase {
  id: string;
  label: string;
  description: string;
}

export interface LevelGuidance {
  learningObjectives: string[];
  phases: GuidancePhase[];
  commonMistakes: string[];
}

export interface LevelDefinition {
  id: number;
  title: string;
  description: string;
  teachingText: string;
  components: ComponentType[];
  correctConnections: Connection[];
  validationRules?: ValidationRules;
  dangerousConnections?: Connection[];
  successAnimation: string;
  lcdOutput?: string;
  xpReward: number;
  hints: string[];
  guidance?: LevelGuidance;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeTarget: number; // seconds for 3-star
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number;
  bestTime: number | null;
  hintsUsed: number;
  attempts: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  earned: boolean;
}

export interface StudentProfile {
  name: string;
  className: string;
  avatar: string;
  totalXP: number;
  currentLevel: number;
  streak: number;
  lastPlayed: string | null;
}

export type ValidationResult = "success" | "partial" | "wrong" | "danger";

export interface ValidationConnectionState {
  index: number;
  from: string;
  to: string;
  completed: boolean;
}

export interface ValidationFeedback {
  result: ValidationResult;
  correctCount: number;
  totalRequired: number;
  wrongWires: string[];
  dangerousWires: string[];
  dangerousLedIds: string[];
  isHardFailed: boolean;
  connectionStates: ValidationConnectionState[];
  message: string;
}

export const WIRE_COLORS = [
  "hsl(0, 60%, 52%)",
  "hsl(210, 70%, 55%)",
  "hsl(140, 50%, 45%)",
  "hsl(50, 70%, 55%)",
  "hsl(25, 70%, 55%)",
  "hsl(270, 55%, 58%)",
];

export const AVATARS = [
  { id: "robot-1", emoji: "🤖", label: "Robot" },
  { id: "scientist-1", emoji: "🧑‍🔬", label: "Scientist" },
  { id: "astronaut-1", emoji: "👩‍🚀", label: "Astronaut" },
  { id: "wizard-1", emoji: "🧙", label: "Wizard" },
  { id: "ninja-1", emoji: "🥷", label: "Ninja" },
  { id: "alien-1", emoji: "👽", label: "Alien" },
];
