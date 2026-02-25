import { LevelGuidance } from "@/types/game";

export const levelGuidanceById: Record<number, LevelGuidance> = {
  1: {
    learningObjectives: ["Light up one LED", "Learn plus and minus sides"],
    phases: [
      {
        id: "identify-pins",
        label: "Step 1: Find the LED legs",
        description: "Find LED anode (+, long leg) and cathode (-, short leg).",
      },
      {
        id: "power-path",
        label: "Step 2: Connect power",
        description: "Connect Arduino 5V to LED anode (+).",
      },
      {
        id: "return-path",
        label: "Step 3: Connect ground",
        description: "Connect LED cathode (-) to Arduino GND.",
      },
    ],
    commonMistakes: ["LED legs swapped (+ and -)", "Forgot to connect GND"],
  },
  2: {
    learningObjectives: ["Use a resistor with an LED", "Build one safe LED path"],
    phases: [
      {
        id: "choose-control-pin",
        label: "Step 1: Start from pin 13",
        description: "Connect Arduino pin 13 to one leg of the resistor.",
      },
      {
        id: "insert-resistor",
        label: "Step 2: Go to LED +",
        description: "Connect the resistor's other leg to LED anode (+).",
      },
      {
        id: "finish-ground",
        label: "Step 3: Finish to GND",
        description: "Connect LED cathode (-) to Arduino GND.",
      },
    ],
    commonMistakes: ["LED connected without resistor", "Resistor and LED not in one line"],
  },
  3: {
    learningObjectives: ["Use a button to control the LED", "Follow one full wire path"],
    phases: [
      {
        id: "button-input",
        label: "Step 1: Power the button",
        description: "Connect Arduino 5V to one side of the button.",
      },
      {
        id: "button-output",
        label: "Step 2: Button to resistor",
        description: "Connect the other button side to the resistor.",
      },
      {
        id: "led-return",
        label: "Step 3: LED to ground",
        description: "Complete resistor -> LED -> GND.",
      },
    ],
    commonMistakes: ["Button not connected to 5V", "LED path not connected to GND"],
  },
  4: {
    learningObjectives: ["Build two LED lines", "Give each LED its own resistor"],
    phases: [
      {
        id: "branch-a",
        label: "Step 1: Build red LED line",
        description: "Connect pin 13 -> resistor -> red LED -> GND.",
      },
      {
        id: "branch-b",
        label: "Step 2: Build green LED line",
        description: "Connect pin 12 -> resistor -> green LED -> GND.",
      },
      {
        id: "verify-parallel",
        label: "Step 3: Check both lines",
        description: "Make sure each LED has its own resistor.",
      },
    ],
    commonMistakes: ["Both LEDs using one resistor", "Wrong pin used for one LED line"],
  },
  5: {
    learningObjectives: ["Give the joystick power", "Connect X and Y wires to Arduino"],
    phases: [
      {
        id: "module-power",
        label: "Step 1: Power the joystick",
        description: "Connect joystick VCC to Arduino 5V, and joystick GND to Arduino GND.",
      },
      {
        id: "x-axis",
        label: "Step 2: Connect X wire",
        description: "Connect joystick VRx to Arduino A0.",
      },
      {
        id: "y-axis",
        label: "Step 3: Connect Y wire",
        description: "Connect joystick VRy to Arduino A1.",
      },
    ],
    commonMistakes: ["Connecting VRx and VRy to the wrong pins", "Forgetting one of the two power wires (5V or GND)"],
  },
  6: {
    learningObjectives: ["Connect a motor", "Understand positive and negative terminals"],
    phases: [
      {
        id: "power-motor",
        label: "Step 1: Connect motor power",
        description: "Connect Arduino 5V to the motor's + terminal.",
      },
      {
        id: "ground-motor",
        label: "Step 2: Connect motor ground",
        description: "Connect the motor's − terminal to Arduino GND.",
      },
    ],
    commonMistakes: ["Motor terminals swapped", "Forgot to connect GND"],
  },
  7: {
    learningObjectives: ["Use a button to control a motor", "Build a switched motor circuit"],
    phases: [
      {
        id: "button-power",
        label: "Step 1: Power the button",
        description: "Connect Arduino 5V to one side of the button.",
      },
      {
        id: "button-to-motor",
        label: "Step 2: Button to motor",
        description: "Connect the other side of the button to the motor's + terminal.",
      },
      {
        id: "motor-ground",
        label: "Step 3: Ground the motor",
        description: "Connect the motor's − terminal to Arduino GND.",
      },
    ],
    commonMistakes: ["Motor connected directly without button", "Forgot to connect motor − to GND"],
  },
  8: {
    learningObjectives: ["Make button input stable", "Add helper parts the right way"],
    phases: [
      {
        id: "button-signal",
        label: "Step 1: Button to input pin",
        description: "Connect 5V -> button -> Arduino pin 2.",
      },
      {
        id: "pull-down",
        label: "Step 2: Add 10k resistor",
        description: "Connect Arduino pin 2 to GND through the 10k resistor.",
      },
      {
        id: "filter-cap",
        label: "Step 3: Add capacitor",
        description: "Connect capacitor between pin 2 and GND.",
      },
    ],
    commonMistakes: ["Pin 2 not connected to GND through 10k", "Capacitor connected to the wrong pin"],
  },
  9: {
    learningObjectives: ["Use a PWM pin", "Dim LED safely with resistor"],
    phases: [
      {
        id: "pwm-source",
        label: "Step 1: Start from pin 9",
        description: "Use Arduino pin 9 (PWM pin).",
      },
      {
        id: "series-resistor",
        label: "Step 2: Add resistor then LED",
        description: "Connect pin 9 -> resistor -> LED anode (+).",
      },
      {
        id: "ground-return",
        label: "Step 3: Connect LED to GND",
        description: "Connect LED cathode (-) to GND.",
      },
    ],
    commonMistakes: ["Using the wrong Arduino pin", "Skipping the resistor"],
  },
  10: {
    learningObjectives: ["Use the TX pin", "Show output with an LED"],
    phases: [
      {
        id: "data-pin",
        label: "Step 1: Start from TX",
        description: "Use Arduino TX as the source pin.",
      },
      {
        id: "indicator",
        label: "Step 2: Connect TX to LED +",
        description: "Connect TX to LED anode (+).",
      },
      {
        id: "return",
        label: "Step 3: Connect LED to GND",
        description: "Connect LED cathode (-) to GND.",
      },
    ],
    commonMistakes: ["Using RX by mistake", "LED missing the GND wire"],
  },
  11: {
    learningObjectives: ["Power the LCD", "Connect SDA and SCL to correct pins"],
    phases: [
      {
        id: "i2c-power",
        label: "Step 1: Power the LCD",
        description: "Connect LCD VCC to 5V and LCD GND to GND.",
      },
      {
        id: "data-line",
        label: "Step 2: Connect SDA",
        description: "Connect LCD SDA to Arduino A4.",
      },
      {
        id: "clock-line",
        label: "Step 3: Connect SCL",
        description: "Connect LCD SCL to Arduino A5.",
      },
    ],
    commonMistakes: ["SDA and SCL swapped", "Forgot VCC or GND on LCD"],
  },
  12: {
    learningObjectives: ["Build 4 LED lines", "Use one resistor for each LED"],
    phases: [
      {
        id: "first-two",
        label: "Step 1: Wire red and green LEDs",
        description: "Build two full lines: pin -> resistor -> LED -> GND.",
      },
      {
        id: "next-two",
        label: "Step 2: Wire yellow and blue LEDs",
        description: "Repeat the same pattern for the other two LEDs.",
      },
      {
        id: "pattern-check",
        label: "Step 3: Final check",
        description: "Each LED must have its own resistor and its own pin.",
      },
    ],
    commonMistakes: ["One resistor shared by many LEDs", "LED connected to wrong pin number"],
  },
  13: {
    learningObjectives: ["Build a full game circuit", "Finish one block at a time"],
    phases: [
      {
        id: "joystick-block",
        label: "Step 1: Wire joystick",
        description: "Connect VCC -> 5V, GND -> GND, VRx -> A0, VRy -> A1.",
      },
      {
        id: "button-block",
        label: "Step 2: Wire button",
        description: "Connect 5V -> button -> pin 2, then add 10k from pin 2 to GND.",
      },
      {
        id: "led-block",
        label: "Step 3: Wire both LEDs",
        description: "Connect pin 9 -> resistor -> red LED -> GND and pin 10 -> resistor -> green LED -> GND.",
      },
    ],
    commonMistakes: ["Trying to wire everything at once", "One LED line missing a resistor"],
  },
  14: {
    learningObjectives: ["Build your own idea", "Test in small steps"],
    phases: [
      {
        id: "plan",
        label: "Step 1: Pick one mini goal",
        description: "Example: light one LED or read one button.",
      },
      {
        id: "wire",
        label: "Step 2: Add a few wires",
        description: "Connect a small part, then test it.",
      },
      {
        id: "iterate",
        label: "Step 3: Improve",
        description: "If it fails, change one wire at a time and test again.",
      },
    ],
    commonMistakes: ["Too many wires added at once", "Not testing after each small change"],
  },
};
