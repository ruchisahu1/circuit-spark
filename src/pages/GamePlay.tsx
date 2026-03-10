import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { levels } from "@/data/levels";
import {
  ComponentType,
  HintPinPair,
  JoystickDirection,
  PlacedComponent,
  ValidationConnectionState,
  ValidationFeedback,
  WIRE_COLORS,
} from "@/types/game";
import { analyzeCircuit, validateCircuit } from "@/engine/circuitValidator";
import { createPlacedComponent, getAutoPlacePosition } from "@/engine/componentDefinitions";
import { getSimulatedPoweredLedIds, getSimulatedActiveLcdIds, getSimulatedActiveMotorIds } from "@/engine/circuitSimulator";
import { analyzeLearningCoach, LearningCoachFeedback } from "@/engine/learningCoach";
import BreadboardCanvas from "@/components/game/BreadboardCanvas";
import ComponentTray from "@/components/game/ComponentTray";
import ChallengePanel from "@/components/game/ChallengePanel";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type Endpoint = { componentId: string; pinId: string };
const BUTTON_LEVEL_IDS = new Set([3, 7]);
const JOYSTICK_LEVEL_IDS = new Set([13]);
const PWM_LEVEL_IDS = new Set([9]);
const MOTOR_BUTTON_LEVEL_IDS = new Set([7]);

function parseEndpoint(endpoint: string): Endpoint {
  const [componentId, pinId] = endpoint.split(".");
  return { componentId, pinId };
}

function getPoweredLedIds(connectionStates: ValidationConnectionState[]): string[] {
  const requiredPinsByLed = new Map<string, Set<string>>();
  const completedPinsByLed = new Map<string, Set<string>>();

  const collectPin = (endpointString: string, completed: boolean) => {
    const endpoint = parseEndpoint(endpointString);
    if (!endpoint.componentId.startsWith("led-")) return;
    if (!requiredPinsByLed.has(endpoint.componentId)) {
      requiredPinsByLed.set(endpoint.componentId, new Set());
    }
    requiredPinsByLed.get(endpoint.componentId)?.add(endpoint.pinId);
    if (completed) {
      if (!completedPinsByLed.has(endpoint.componentId)) {
        completedPinsByLed.set(endpoint.componentId, new Set());
      }
      completedPinsByLed.get(endpoint.componentId)?.add(endpoint.pinId);
    }
  };

  for (const connection of connectionStates) {
    collectPin(connection.from, connection.completed);
    collectPin(connection.to, connection.completed);
  }

  const poweredLedIds: string[] = [];
  for (const [ledId, requiredPins] of requiredPinsByLed.entries()) {
    const completedPins = completedPinsByLed.get(ledId) ?? new Set<string>();
    const isPowered = Array.from(requiredPins).every((pin) => completedPins.has(pin));
    if (isPowered) poweredLedIds.push(ledId);
  }
  return poweredLedIds;
}

function buildInitialPlacedComponents(levelComponents: ComponentType[]): PlacedComponent[] {
  const initial: PlacedComponent[] = [];
  for (const type of levelComponents) {
    const pos = getAutoPlacePosition(type, initial);
    const component = createPlacedComponent(type, pos.x, pos.y, initial);
    initial.push(component);
  }
  return initial;
}

function isWiringComplete(connectionStates: ValidationConnectionState[]): boolean {
  return connectionStates.length > 0 && connectionStates.every((connection) => connection.completed);
}

function getJoystickBulbIds(placedComponents: PlacedComponent[]): { upId: string; downId: string } | null {
  const ledComponents = placedComponents
    .filter((component) => component.type.startsWith("led-"))
    .sort((a, b) => (a.y - b.y) || (a.x - b.x));
  if (ledComponents.length < 2) return null;
  return { upId: ledComponents[0].id, downId: ledComponents[1].id };
}

function getActiveLedIds(params: {
  levelId: number;
  connectionStates: ValidationConnectionState[];
  placedComponents: PlacedComponent[];
  pressedButtonIds: string[];
  joystickDirection: JoystickDirection;
}): string[] {
  const {
    levelId,
    connectionStates,
    placedComponents,
    pressedButtonIds,
    joystickDirection,
  } = params;

  const basePoweredLedIds = getPoweredLedIds(connectionStates);
  const isComplete = isWiringComplete(connectionStates);

  if (JOYSTICK_LEVEL_IDS.has(levelId)) {
    if (!isComplete) return [];
    if (pressedButtonIds.length === 0) return [];
    const joystickBulbIds = getJoystickBulbIds(placedComponents);
    if (!joystickBulbIds) return [];
    if (joystickDirection === "up") return [joystickBulbIds.upId];
    if (joystickDirection === "down") return [joystickBulbIds.downId];
    return [];
  }

  if (BUTTON_LEVEL_IDS.has(levelId)) {
    if (!isComplete) return [];
    return pressedButtonIds.length > 0 ? basePoweredLedIds : [];
  }

  return basePoweredLedIds;
}

const GamePlay = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const level = levels.find((l) => l.id === Number(levelId));
  const isSandboxLevel = level?.id === 14;

  const {
    startLevel,
    placedComponents,
    wires,
    selectedPin,
    selectPin,
    addWire,
    placeComponent,
    hintsUsedThisLevel,
    useHint,
    incrementAttempts,
    resetLevel,
    clearSession,
    completeLevel,
    startTime,
    pressedButtonIds,
    joystickDirection,
    toggleButtonPressed,
    setJoystickDirection,
  } = useGameStore();

  const [feedback, setFeedback] = useState<ValidationFeedback | null>(null);
  const [wrongWires, setWrongWires] = useState<string[]>([]);
  const [dangerousWires, setDangerousWires] = useState<string[]>([]);
  const [successWires, setSuccessWires] = useState(false);
  const [glowingLedIds, setGlowingLedIds] = useState<string[]>([]);
  const [activeLcdIds, setActiveLcdIds] = useState<string[]>([]);
  const [burstLedIds, setBurstLedIds] = useState<string[]>([]);
  const [spinningMotorIds, setSpinningMotorIds] = useState<string[]>([]);
  const [isHardFailed, setIsHardFailed] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState<LearningCoachFeedback | null>(null);
  const [hintPinPair, setHintPinPair] = useState<HintPinPair | null>(null);
  const [pwmBrightness, setPwmBrightness] = useState(255);

  const showPwmSlider =
    (level && PWM_LEVEL_IDS.has(level.id)) ||
    (isSandboxLevel && glowingLedIds.length > 0);

  useEffect(() => {
    if (level) {
      const initialPlacedComponents = isSandboxLevel
        ? []
        : buildInitialPlacedComponents(level.components);
      startLevel(level.id, initialPlacedComponents);
      setFeedback(null);
      setWrongWires([]);
      setDangerousWires([]);
      setSuccessWires(false);
      setGlowingLedIds([]);
      setActiveLcdIds([]);
      setBurstLedIds([]);
      setSpinningMotorIds([]);
      setIsHardFailed(false);
      setHintsRevealed([]);
      setShowSuccess(false);
      setCoachFeedback(analyzeLearningCoach(level, [], []));
      setHintPinPair(null);
      setPwmBrightness(255);
    }
    return () => clearSession();
  }, [levelId, level, isSandboxLevel, startLevel, clearSession]);

  // Timer
  useEffect(() => {
    if (!startTime || showSuccess) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, showSuccess]);

  useEffect(() => {
    if (!level) return;
    setCoachFeedback(analyzeLearningCoach(level, wires, placedComponents));
  }, [level, wires, placedComponents]);

  const hasJoystick = isSandboxLevel && placedComponents.some((c) => c.type === "joystick");

  useEffect(() => {
    if (!level) return;
    if (!JOYSTICK_LEVEL_IDS.has(level.id) && !hasJoystick) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSuccess || isHardFailed) return;
      if (event.repeat) return;
      if (event.code === "ArrowUp" || event.code === "KeyW") {
        setJoystickDirection(joystickDirection === "up" ? "center" : "up");
      } else if (event.code === "ArrowDown" || event.code === "KeyS") {
        setJoystickDirection(joystickDirection === "down" ? "center" : "down");
      } else if (event.code === "Escape" || event.code === "Space") {
        setJoystickDirection("center");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [level, showSuccess, isHardFailed, setJoystickDirection, joystickDirection, hasJoystick]);

  useEffect(() => {
    if (!level || showSuccess || isHardFailed) return;

    const liveAnalysis = analyzeCircuit(
      wires,
      level.correctConnections,
      placedComponents,
      level.dangerousConnections ?? [],
      level.validationRules
    );

    if (isSandboxLevel) {
      setGlowingLedIds(
        getSimulatedPoweredLedIds(wires, placedComponents, pressedButtonIds, joystickDirection)
      );
      setActiveLcdIds(
        getSimulatedActiveLcdIds(wires, placedComponents, pressedButtonIds, joystickDirection)
      );
      setSpinningMotorIds(
        getSimulatedActiveMotorIds(wires, placedComponents, pressedButtonIds, joystickDirection)
      );
    } else {
      setGlowingLedIds(
        getActiveLedIds({
          levelId: level.id,
          connectionStates: liveAnalysis.connectionStates,
          placedComponents,
          pressedButtonIds,
          joystickDirection,
        })
      );
      const allConnected = liveAnalysis.connectionStates.length > 0 &&
        liveAnalysis.connectionStates.every((c) => c.completed);
      setActiveLcdIds(
        allConnected
          ? placedComponents.filter((c) => c.type === "lcd-i2c").map((c) => c.id)
          : []
      );
      if (MOTOR_BUTTON_LEVEL_IDS.has(level.id)) {
        setSpinningMotorIds(
          allConnected && pressedButtonIds.length > 0
            ? placedComponents.filter((c) => c.type === "motor").map((c) => c.id)
            : []
        );
      } else {
        setSpinningMotorIds(
          allConnected
            ? placedComponents.filter((c) => c.type === "motor").map((c) => c.id)
            : []
        );
      }
    }

    if (liveAnalysis.result !== "danger") return;

    const dangerFeedback = validateCircuit(
      wires,
      level.correctConnections,
      placedComponents,
      level.dangerousConnections ?? [],
      level.validationRules
    );
    setFeedback(dangerFeedback);
    setWrongWires(dangerFeedback.wrongWires);
    setDangerousWires(dangerFeedback.dangerousWires);
    setSuccessWires(false);
    setBurstLedIds(dangerFeedback.dangerousLedIds);
    setIsHardFailed(dangerFeedback.isHardFailed);
    selectPin(null);
  }, [
    level,
    wires,
    placedComponents,
    showSuccess,
    isHardFailed,
    isSandboxLevel,
    selectPin,
    pressedButtonIds,
    joystickDirection,
  ]);

  const wireColorIndex = wires.length % WIRE_COLORS.length;

  const handlePinClick = useCallback(
    (pinId: string) => {
      if (showSuccess || isHardFailed) return;
      if (!selectedPin) {
        selectPin(pinId);
      } else if (selectedPin === pinId) {
        selectPin(null);
      } else {
        const fromComponent = selectedPin.split(".")[0];
        const toComponent = pinId.split(".")[0];
        if (fromComponent === toComponent) {
          selectPin(null);
          return;
        }

        const duplicate = wires.some(
          (w) =>
            (w.fromPin === selectedPin && w.toPin === pinId) ||
            (w.fromPin === pinId && w.toPin === selectedPin)
        );
        if (duplicate) {
          selectPin(null);
          return;
        }

        addWire({
          id: `wire-${Date.now()}`,
          fromPin: selectedPin,
          toPin: pinId,
          color: WIRE_COLORS[wireColorIndex],
        });
        setFeedback(null);
        setWrongWires([]);
        setDangerousWires([]);
        setBurstLedIds([]);
      }
    },
    [selectedPin, wireColorIndex, showSuccess, isHardFailed, wires]
  );

  const handleAddComponent = (type: ComponentType) => {
    if (showSuccess || isHardFailed) return;
    const pos = getAutoPlacePosition(type, placedComponents);
    const comp = createPlacedComponent(type, pos.x, pos.y, placedComponents);
    placeComponent(comp);
  };

  const handlePushButtonToggle = useCallback(
    (buttonId: string) => {
      if (!level || showSuccess || isHardFailed) return;
      if (!isSandboxLevel && !BUTTON_LEVEL_IDS.has(level.id) && !JOYSTICK_LEVEL_IDS.has(level.id)) return;
      toggleButtonPressed(buttonId);
    },
    [level, showSuccess, isHardFailed, isSandboxLevel, toggleButtonPressed]
  );

  const handleCheckCircuit = () => {
    if (!level || isHardFailed) return;
    incrementAttempts();
    const result = validateCircuit(
      wires,
      level.correctConnections,
      placedComponents,
      level.dangerousConnections ?? [],
      level.validationRules
    );
    setFeedback(result);
    setWrongWires(result.wrongWires);
    setDangerousWires(result.dangerousWires);

    if (result.result === "danger") {
      setSuccessWires(false);
      setGlowingLedIds([]);
      setBurstLedIds(result.dangerousLedIds);
      setIsHardFailed(result.isHardFailed);
      selectPin(null);
      return;
    }

    setIsHardFailed(false);
    setBurstLedIds([]);
    setGlowingLedIds(
      getActiveLedIds({
        levelId: level.id,
        connectionStates: result.connectionStates,
        placedComponents,
        pressedButtonIds,
        joystickDirection,
      })
    );

    if (result.result === "success") {
      setSuccessWires(true);
      setActiveLcdIds(
        placedComponents.filter((c) => c.type === "lcd-i2c").map((c) => c.id)
      );
      setSpinningMotorIds(
        placedComponents.filter((c) => c.type === "motor").map((c) => c.id)
      );
      const time = elapsedTime;
      let stars = 1;
      if (hintsUsedThisLevel === 0 && time <= level.timeTarget) stars = 3;
      else if (hintsUsedThisLevel <= 1 && time <= level.timeTarget * 1.5) stars = 2;

      setEarnedStars(stars);
      completeLevel(level.id, stars, time, hintsUsedThisLevel);
      setShowSuccess(true);
    } else {
      setSuccessWires(false);
    }
  };

  const handleHint = () => {
    if (!coachFeedback || isHardFailed) return;
    const nextTask = coachFeedback.tasks.find((task) => !task.completed);
    if (!nextTask) return;

    setHintsRevealed((prev) =>
      prev.includes(nextTask.instruction) ? prev : [...prev, nextTask.instruction]
    );
    setHintPinPair({
      fromPin: nextTask.fromPin,
      toPin: nextTask.toPin,
      flashId: Date.now(),
    });
    useHint();
  };

  const handleReset = () => {
    if (!level) return;
    const initialPlacedComponents = isSandboxLevel
      ? []
      : buildInitialPlacedComponents(level.components);
    resetLevel(initialPlacedComponents);
    setFeedback(null);
    setWrongWires([]);
    setDangerousWires([]);
    setSuccessWires(false);
    setGlowingLedIds([]);
    setActiveLcdIds([]);
    setBurstLedIds([]);
    setSpinningMotorIds([]);
    setIsHardFailed(false);
    setHintsRevealed([]);
    setShowSuccess(false);
    setHintPinPair(null);
    setPwmBrightness(255);
  };

  if (!level) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Level not found</p>
          <Button onClick={() => navigate("/home")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left - Component Tray (sandbox only) */}
      {isSandboxLevel && (
        <div className="w-48 shrink-0 border-r border-border bg-card/30 p-3 overflow-y-auto">
          <ComponentTray
            availableComponents={level.components}
            onAddComponent={handleAddComponent}
            placedTypes={placedComponents.map((c) => c.type)}
          />
        </div>
      )}

      {/* Center - Breadboard */}
      <div className="flex-1 p-4 overflow-hidden">
        <BreadboardCanvas
          onPinClick={handlePinClick}
          onPushButtonToggle={handlePushButtonToggle}
          wrongWires={wrongWires}
          dangerousWires={dangerousWires}
          successWires={successWires}
          ledOnIds={glowingLedIds}
          burstLedIds={burstLedIds}
          pressedButtonIds={pressedButtonIds}
          interactionLocked={showSuccess || isHardFailed}
          allowComponentRemoval={isSandboxLevel}
          hintPinPair={hintPinPair}
          joystickDirection={joystickDirection}
          onJoystickDirectionChange={setJoystickDirection}
          lcdOnIds={activeLcdIds}
          lcdText={level.lcdOutput ?? (isSandboxLevel ? "Hello!" : "")}
          pwmBrightness={pwmBrightness}
          motorOnIds={spinningMotorIds}
        />
      </div>

      {/* Right - Challenge Panel */}
      <div className="w-72 shrink-0 border-l border-border bg-card/30 p-4 overflow-y-auto">
        <ChallengePanel
          level={level}
          hintsRevealed={hintsRevealed}
          coachFeedback={coachFeedback}
          remainingHintTargets={coachFeedback?.tasks.filter((task) => !task.completed).length ?? 0}
          onCheckCircuit={handleCheckCircuit}
          onHint={handleHint}
          onReset={handleReset}
          onBack={() => navigate("/home")}
          feedback={feedback}
          isHardFailed={isHardFailed}
          elapsedTime={elapsedTime}
          showPwmSlider={showPwmSlider}
          pwmBrightness={pwmBrightness}
          onPwmBrightnessChange={setPwmBrightness}
        />
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="rounded-2xl border border-primary/40 bg-card p-8 text-center neon-border max-w-sm"
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-primary text-glow-green">
              Level Complete!
            </h2>
            <p className="mt-2 text-muted-foreground">{level.title}</p>
            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3].map((s) => (
                  <motion.span
                    key={s}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: s * 0.2 }}
                    className={`text-3xl ${s <= earnedStars ? "" : "opacity-20"}`}
                  >
                    ⭐
                  </motion.span>
                ))}
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/home")}>
                Home
              </Button>
              {level.id < 14 && (
                <Button
                  onClick={() => {
                    navigate(`/play/${level.id + 1}`);
                  }}
                  className="glow-green"
                >
                  Next Level →
                </Button>
              )}
              <Button
                  variant="outline"
                  onClick={() => window.location.href = "https://missionx.junkbot.co/user/gamified"}
              >
                Quit
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default GamePlay;
