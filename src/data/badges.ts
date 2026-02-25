import { Badge } from "@/types/game";

export const allBadges: Badge[] = [
  { id: "first-circuit", name: "First Spark", description: "Complete your first level", icon: "⚡", condition: "Complete Level 1", earned: false },
  { id: "resistor-master", name: "Resistor Master", description: "Complete all levels that use resistors", icon: "🔧", condition: "Complete Levels 2, 3, 4, 7, 10, 11", earned: false },
  { id: "ground-champion", name: "Ground Champion", description: "Complete 6 levels without wrong connections", icon: "🏆", condition: "Complete 6 levels with 0 wrong wires", earned: false },
  { id: "speed-builder", name: "Speed Builder", description: "Get 3 stars on 5 levels", icon: "⏱️", condition: "Earn 3 stars on 5 different levels", earned: false },
  { id: "hint-free-hero", name: "Hint-Free Hero", description: "Complete 3 levels without using any hints", icon: "🧠", condition: "Complete 3 levels with 0 hints", earned: false },
  { id: "led-lover", name: "LED Lover", description: "Light up LEDs in 8 different levels", icon: "💡", condition: "Complete 8 levels with LEDs", earned: false },
  { id: "i2c-wizard", name: "I2C Wizard", description: "Successfully connect an I2C device", icon: "🧙", condition: "Complete Level 9", earned: false },
  { id: "full-stack", name: "Full Circuit", description: "Complete the full game circuit", icon: "🎮", condition: "Complete Level 11", earned: false },
  { id: "sandbox-creator", name: "Creative Genius", description: "Build something in sandbox mode", icon: "🎨", condition: "Use sandbox mode", earned: false },
  { id: "streak-3", name: "On Fire!", description: "Play 3 days in a row", icon: "🔥", condition: "3-day streak", earned: false },
  { id: "xp-500", name: "XP Collector", description: "Earn 500 total XP", icon: "✨", condition: "Reach 500 XP", earned: false },
  { id: "perfectionist", name: "Perfectionist", description: "Get 3 stars on all beginner levels", icon: "⭐", condition: "3 stars on Levels 1-4", earned: false },
];
