

# 🔌 Circuit Builder — Educational Breadboard Game

## Overview
A browser-based game where young students (ages 8-12) learn electronics by connecting components on a virtual breadboard. Dark, techy "lab" aesthetic with glowing components and friendly language. All 12 levels from beginner to advanced, plus a sandbox mode. No backend — everything runs in the browser with localStorage.

---

## 🎮 Core Gameplay Screen

### Virtual Workbench Layout
- **Left sidebar**: Component Tray — shows available components for the current level (Arduino, LEDs, resistors, buttons) as draggable icons
- **Center**: Breadboard Canvas — an SVG-based grid where components snap into place; students click one pin then click another to draw a colored wire between them
- **Right panel**: Challenge Panel — shows the current task description, a hint button, timer, star rating target, and score/XP

### Interaction Model (Simple & Functional)
- Click a component in the tray → it appears on the breadboard at a valid position
- Click one pin → click another pin → a wire connects them with a color
- Click a wire to delete it
- "Check Circuit" button validates the connections
- Clear visual feedback: green glow for correct, red spark animation for wrong

---

## 🧠 Game Engine

### Circuit Validator
- Builds a connection graph from placed wires and components
- Checks against the level's correct connections (order-independent)
- Returns SUCCESS (all correct), PARTIAL (some right), or WRONG (incorrect/dangerous connection)

### Visual Feedback
- **Correct circuit**: LED glows/blinks, LCD simulator shows text, celebration animation
- **Wrong connection**: Spark/zap animation on the bad wire, friendly error message ("Oops! That pin isn't right — try another one!")
- **Partial**: Highlights which connections are done vs. still needed

### Hint System
- Students can request hints (costs one star)
- Each hint reveals one correct wire connection with a guiding arrow
- Tracks where the student is stuck

---

## 📊 Progression & Gamification

### XP & Leveling
- Earn XP for completing each level
- XP bar shown at the top of the screen
- Level-up animations and encouragement

### Star Rating (per level)
- ⭐⭐⭐ = Correct + Fast + No hints used
- ⭐⭐ = Correct + Hints or slow
- ⭐ = Correct but needed multiple attempts

### Badges
- Unlock badges like "Resistor Master", "Ground Champion", "Speed Builder", "Hint-Free Hero"
- Badge gallery accessible from the profile screen

### Progress Tracking (localStorage)
- Completed levels, star ratings, badges, total XP, streak counter
- Student profile with name and class (entered on first launch)

---

## 📚 All 12 Levels

### Beginner (Levels 1–4)
1. **Power an LED** — Connect LED directly to power and ground
2. **Add a Resistor** — Learn why resistors protect LEDs
3. **Push Button** — Wire a button to control an LED
4. **Two LEDs** — Parallel circuit with two LEDs

### Intermediate (Levels 5–8)
5. **Joystick Axes** — Connect a joystick module, read X/Y
6. **Button Debounce** — Wire a button with proper debounce circuit
7. **PWM Dimming** — Connect LED to PWM pin for brightness control
8. **Serial Communication** — Wire TX/RX for serial output

### Advanced (Levels 9–12)
9. **I2C LCD Wiring** — Connect an LCD display via I2C
10. **Multi-LED Sequence** — Wire multiple LEDs for sequential patterns
11. **Full Game Circuit** — Combine joystick + buttons + LEDs
12. **Design Your Own** — Sandbox mode with all components unlocked

---

## 🗺️ Additional Screens

### Home / Level Select
- Dark themed hub showing all 12 levels as a progression path
- Locked/unlocked state with star ratings displayed
- Player XP bar and current badge count

### Student Profile Setup
- Simple first-launch screen: enter name and class
- Avatar selection (fun robot/scientist characters)

### Badge Gallery
- Grid of all available badges, earned ones glow, unearned ones are dimmed
- Tap to see how to earn each badge

### Sandbox Mode
- Unlocked after completing all levels (or Level 12 itself)
- All components available, no validation — free experimentation

---

## 🎨 Visual Design

### Dark Lab Aesthetic
- Dark background resembling a workbench/lab table
- Components have a subtle glow effect
- Wires are brightly colored against the dark background
- Neon-style accents for UI elements (buttons, XP bar, score)
- Kid-friendly fonts and rounded UI elements despite the dark theme
- Animated particles/sparks for feedback

### Component Visuals
- Simple, recognizable SVG icons for each component (LED, resistor, Arduino, etc.)
- Color-coded: red LED, resistor bands visible, Arduino board shape
- Wires in multiple colors (red, blue, green, yellow) auto-assigned

