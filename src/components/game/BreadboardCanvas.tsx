import { MouseEvent, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { HintPinPair, JoystickDirection } from "@/types/game";
import { componentDefinitions } from "@/engine/componentDefinitions";

interface BreadboardCanvasProps {
  onPinClick: (pinId: string) => void;
  onPushButtonToggle: (buttonId: string) => void;
  wrongWires: string[];
  dangerousWires: string[];
  successWires: boolean;
  ledOnIds: string[];
  burstLedIds: string[];
  pressedButtonIds: string[];
  interactionLocked: boolean;
  allowComponentRemoval: boolean;
  hintPinPair: HintPinPair | null;
  joystickDirection: JoystickDirection;
  onJoystickDirectionChange: (direction: JoystickDirection) => void;
  lcdOnIds: string[];
  lcdText: string;
  pwmBrightness: number;
  motorOnIds: string[];
}

const BreadboardCanvas = ({
  onPinClick,
  onPushButtonToggle,
  wrongWires,
  dangerousWires,
  successWires,
  ledOnIds,
  burstLedIds,
  pressedButtonIds,
  interactionLocked,
  allowComponentRemoval,
  hintPinPair,
  joystickDirection,
  onJoystickDirectionChange,
  lcdOnIds,
  lcdText,
  pwmBrightness,
  motorOnIds,
}: BreadboardCanvasProps) => {
  const placedComponents = useGameStore((s) => s.placedComponents);
  const wires = useGameStore((s) => s.wires);
  const selectedPin = useGameStore((s) => s.selectedPin);
  const removeWire = useGameStore((s) => s.removeWire);
  const removeComponent = useGameStore((s) => s.removeComponent);
  const moveComponent = useGameStore((s) => s.moveComponent);
  const [activeHintPinPair, setActiveHintPinPair] = useState<HintPinPair | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragState = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const recentlyDraggedAtRef = useRef<Record<string, number>>({});

  const getSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse());
  };

  const handleDragStart = (
    event: MouseEvent<SVGElement>,
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (successWires || interactionLocked) return;
    event.preventDefault();
    event.stopPropagation();
    const point = getSvgPoint(event.clientX, event.clientY);
    if (!point) return;
    dragState.current = {
      id,
      offsetX: point.x - x,
      offsetY: point.y - y,
      width,
      height,
      startX: point.x,
      startY: point.y,
      moved: false,
    };
  };

  const handleDragMove = (event: MouseEvent<SVGSVGElement>) => {
    const active = dragState.current;
    if (!active) return;
    const point = getSvgPoint(event.clientX, event.clientY);
    if (!point) return;
    if (!active.moved) {
      const movedDistance =
        Math.abs(point.x - active.startX) + Math.abs(point.y - active.startY);
      if (movedDistance > 3) {
        active.moved = true;
      }
    }
    const minX = 0;
    const minY = 0;
    const maxX = 600 - active.width;
    const maxY = 500 - active.height;
    const newX = Math.min(maxX, Math.max(minX, point.x - active.offsetX));
    const newY = Math.min(maxY, Math.max(minY, point.y - active.offsetY));
    moveComponent(active.id, newX, newY);
  };

  const handleDragEnd = () => {
    const active = dragState.current;
    if (active?.moved) {
      recentlyDraggedAtRef.current[active.id] = Date.now();
    }
    dragState.current = null;
  };

  const handlePushButtonClick = (componentId: string) => {
    if (successWires || interactionLocked) return;
    const recentlyDraggedAt = recentlyDraggedAtRef.current[componentId] ?? 0;
    if (Date.now() - recentlyDraggedAt < 220) return;
    onPushButtonToggle(componentId);
  };

  const handleJoystickClick = (direction: JoystickDirection) => {
    if (successWires || interactionLocked) return;
    onJoystickDirectionChange(direction);
  };

  useEffect(() => {
    if (!hintPinPair) return;
    setActiveHintPinPair(hintPinPair);
    const timer = setTimeout(() => setActiveHintPinPair(null), 1400);
    return () => clearTimeout(timer);
  }, [hintPinPair?.flashId, hintPinPair?.fromPin, hintPinPair?.toPin]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 600 500"
      preserveAspectRatio="none"
      className="rounded-xl border border-border bg-card/50"
      style={{ minHeight: 400 }}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Grid dots */}
      {Array.from({ length: 30 }).map((_, x) =>
        Array.from({ length: 25 }).map((_, y) => (
          <circle
            key={`dot-${x}-${y}`}
            cx={x * 20 + 10}
            cy={y * 20 + 10}
            r={1}
            fill="hsl(230, 15%, 25%)"
          />
        ))
      )}

      {/* Wires */}
      {wires.map((wire) => {
        const fromComp = placedComponents.find((c) =>
          c.pins.some((p) => p.id === wire.fromPin)
        );
        const toComp = placedComponents.find((c) =>
          c.pins.some((p) => p.id === wire.toPin)
        );
        const fromPin = fromComp?.pins.find((p) => p.id === wire.fromPin);
        const toPin = toComp?.pins.find((p) => p.id === wire.toPin);
        if (!fromPin || !toPin) return null;

        const isWrong = wrongWires.includes(wire.id);
        const isDangerous = dangerousWires.includes(wire.id);

        return (
          <g key={wire.id}>
            <line
              x1={fromPin.x}
              y1={fromPin.y}
              x2={toPin.x}
              y2={toPin.y}
              stroke={
                isDangerous
                  ? "hsl(12, 95%, 55%)"
                  : isWrong
                  ? "hsl(0, 80%, 55%)"
                  : successWires
                  ? "hsl(160, 100%, 45%)"
                  : wire.color
              }
              strokeWidth={2}
              strokeLinecap="round"
              className={
                successWires || interactionLocked
                  ? "cursor-default"
                  : "cursor-pointer hover:opacity-100 transition-opacity"
              }
              onClick={
                successWires || interactionLocked ? undefined : () => removeWire(wire.id)
              }
              opacity={isDangerous || isWrong || successWires ? 1 : 0.55}
              style={
                isDangerous
                  ? { filter: "drop-shadow(0 0 9px hsl(12, 95%, 55%))" }
                  : isWrong
                  ? { filter: "drop-shadow(0 0 6px hsl(0, 80%, 55%))" }
                  : successWires
                  ? { filter: "drop-shadow(0 0 6px hsl(160, 100%, 45%))" }
                  : undefined
              }
            />
            {(isWrong || isDangerous) && (
              <text
                x={(fromPin.x + toPin.x) / 2}
                y={(fromPin.y + toPin.y) / 2 - 8}
                textAnchor="middle"
                fill={isDangerous ? "hsl(12, 95%, 55%)" : "hsl(0, 80%, 55%)"}
                fontSize={14}
                className="animate-spark pointer-events-none"
              >
                {isDangerous ? "💥" : "⚡"}
              </text>
            )}
          </g>
        );
      })}

      {/* Components */}
      {placedComponents.map((comp) => {
        const def = componentDefinitions[comp.type];
        if (!def) return null;
        const isLed = comp.type.startsWith("led-");
        const isPushButton = comp.type === "push-button";
        const isJoystick = comp.type === "joystick";
        const isLcd = comp.type === "lcd-i2c";
        const isMotor = comp.type === "motor";
        const isButtonPressed = isPushButton && pressedButtonIds.includes(comp.id);
        const isLedOn = isLed && ledOnIds.includes(comp.id);
        const isLedBurst = isLed && burstLedIds.includes(comp.id);
        const isLcdOn = isLcd && lcdOnIds.includes(comp.id);
        const isMotorOn = isMotor && motorOnIds.includes(comp.id);
        const ledBrightness = pwmBrightness / 255;
        const componentBottomY = comp.y + def.height;
        const lowestPinY = comp.pins.reduce((maxY, pin) => Math.max(maxY, pin.y), componentBottomY);
        const componentLabelY = lowestPinY + 32;

        return (
          <g key={comp.id}>
            {/* Component body */}
            {isLed ? (
              <g
                className={successWires || interactionLocked ? "" : "cursor-move"}
                onMouseDown={(e) =>
                  handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                }
              >
                {/* Drag hitbox */}
                <rect
                  x={comp.x}
                  y={comp.y}
                  width={def.width}
                  height={def.height}
                  rx={6}
                  fill="transparent"
                  stroke="transparent"
                />

                {/* LED legs */}
                <line
                  x1={comp.x + 15}
                  y1={comp.y}
                  x2={comp.x + 15}
                  y2={comp.y + 24}
                  stroke={isLedBurst ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 70%)"}
                  strokeWidth={2}
                />
                <line
                  x1={comp.x + 35}
                  y1={comp.y}
                  x2={comp.x + 35}
                  y2={comp.y + 24}
                  stroke={isLedBurst ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 70%)"}
                  strokeWidth={2}
                />

                {/* LED glow halo */}
                {isLedOn && !isLedBurst && ledBrightness > 0 && (
                  <ellipse
                    cx={comp.x + def.width / 2}
                    cy={comp.y + 36}
                    rx={14 + 6 * ledBrightness}
                    ry={18 + 6 * ledBrightness}
                    fill={def.color}
                    opacity={0.08 + 0.14 * ledBrightness}
                    className={ledBrightness > 0.6 ? "animate-pulse" : ""}
                  />
                )}

                {/* LED dome body */}
                <path
                  d={`
                    M ${comp.x + 12} ${comp.y + 56}
                    L ${comp.x + 12} ${comp.y + 36}
                    A 13 13 0 0 1 ${comp.x + 38} ${comp.y + 36}
                    L ${comp.x + 38} ${comp.y + 56}
                    Z
                  `}
                  fill={isLedBurst ? "hsl(0, 0%, 28%)" : def.color}
                  fillOpacity={isLedBurst ? 0.45 : isLedOn ? 0.35 + 0.5 * ledBrightness : 0.35}
                  stroke={isLedBurst ? "hsl(12, 95%, 55%)" : def.color}
                  strokeWidth={1.6}
                  style={
                    isLedBurst
                      ? { filter: "drop-shadow(0 0 8px hsl(12, 95%, 55%))" }
                      : isLedOn && ledBrightness > 0
                      ? { filter: `drop-shadow(0 0 ${Math.round(ledBrightness * 8)}px ${def.color})` }
                      : undefined
                  }
                />

                {/* Highlight reflection */}
                {!isLedBurst && (
                  <ellipse
                    cx={comp.x + 21}
                    cy={comp.y + 34}
                    rx={4}
                    ry={7}
                    fill="white"
                    opacity={isLedOn ? 0.2 + 0.25 * ledBrightness : 0.2}
                  />
                )}

                {/* Broken LED cracks + missing shard */}
                {isLedBurst && (
                  <g className="pointer-events-none">
                    <path
                      d={`M ${comp.x + 17} ${comp.y + 31} L ${comp.x + 24} ${comp.y + 40} L ${comp.x + 20} ${comp.y + 49}`}
                      stroke="hsl(0, 0%, 85%)"
                      strokeWidth={1.2}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M ${comp.x + 30} ${comp.y + 30} L ${comp.x + 26} ${comp.y + 39} L ${comp.x + 33} ${comp.y + 46}`}
                      stroke="hsl(0, 0%, 85%)"
                      strokeWidth={1.2}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`
                        M ${comp.x + 34} ${comp.y + 29}
                        L ${comp.x + 45} ${comp.y + 22}
                        L ${comp.x + 41} ${comp.y + 35}
                        Z
                      `}
                      fill="hsl(0, 0%, 30%)"
                      stroke="hsl(12, 95%, 55%)"
                      strokeWidth={1}
                      opacity={0.95}
                      className="animate-pulse"
                    />
                  </g>
                )}
              </g>
            ) : isJoystick ? (() => {
              const cx = comp.x + 40;
              const cy = comp.y + 50;
              const knobY = joystickDirection === "up" ? cy - 22 : joystickDirection === "down" ? cy + 22 : cy;
              const isUp = joystickDirection === "up";
              const isDown = joystickDirection === "down";
              const isCenter = joystickDirection === "center";
              return (
              <g
                className={successWires || interactionLocked ? "" : "cursor-pointer"}
                onMouseDown={(e) =>
                  handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                }
              >
                {/* Outer shell */}
                <rect
                  x={comp.x}
                  y={comp.y}
                  width={80}
                  height={100}
                  rx={12}
                  fill="hsl(225, 22%, 28%)"
                  stroke="hsl(225, 18%, 42%)"
                  strokeWidth={1.8}
                />
                {/* Inner well */}
                <rect
                  x={comp.x + 4}
                  y={comp.y + 4}
                  width={72}
                  height={92}
                  rx={9}
                  fill="hsl(225, 18%, 18%)"
                  stroke="hsl(225, 14%, 28%)"
                  strokeWidth={0.8}
                />

                {/* Circular gimbal ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={34}
                  fill="none"
                  stroke="hsl(225, 12%, 32%)"
                  strokeWidth={1.2}
                  strokeDasharray="3 4"
                />

                {/* Up arrow */}
                <path
                  d={`M ${cx - 7} ${comp.y + 18} L ${cx} ${comp.y + 11} L ${cx + 7} ${comp.y + 18}`}
                  fill="none"
                  stroke={isUp ? "hsl(200, 100%, 65%)" : "hsl(225, 12%, 40%)"}
                  strokeWidth={isUp ? 2 : 1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={isUp ? { filter: "drop-shadow(0 0 4px hsl(200, 100%, 55%))" } : undefined}
                  className="pointer-events-none"
                />
                {/* Down arrow */}
                <path
                  d={`M ${cx - 7} ${comp.y + 82} L ${cx} ${comp.y + 89} L ${cx + 7} ${comp.y + 82}`}
                  fill="none"
                  stroke={isDown ? "hsl(200, 100%, 65%)" : "hsl(225, 12%, 40%)"}
                  strokeWidth={isDown ? 2 : 1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={isDown ? { filter: "drop-shadow(0 0 4px hsl(200, 100%, 55%))" } : undefined}
                  className="pointer-events-none"
                />

                {/* Track groove */}
                <rect
                  x={cx - 3}
                  y={comp.y + 20}
                  width={6}
                  height={60}
                  rx={3}
                  fill="hsl(225, 14%, 14%)"
                  stroke="hsl(225, 10%, 24%)"
                  strokeWidth={0.6}
                />

                {/* Track position dots */}
                <circle cx={cx} cy={cy - 22} r={1.5} fill={isUp ? "hsl(200, 100%, 65%)" : "hsl(225, 10%, 35%)"} />
                <circle cx={cx} cy={cy} r={1.5} fill={isCenter ? "hsl(0, 0%, 50%)" : "hsl(225, 10%, 35%)"} />
                <circle cx={cx} cy={cy + 22} r={1.5} fill={isDown ? "hsl(200, 100%, 65%)" : "hsl(225, 10%, 35%)"} />

                {/* Side labels */}
                <text x={comp.x + 67} y={cy - 18} textAnchor="middle" fill={isUp ? "hsl(200, 100%, 75%)" : "hsl(225, 10%, 44%)"} fontSize={6} fontWeight={isUp ? "bold" : "normal"} fontFamily="Space Mono, monospace" className="pointer-events-none">
                  UP
                </text>
                <text x={comp.x + 67} y={cy + 4} textAnchor="middle" fill={isCenter ? "hsl(0, 0%, 55%)" : "hsl(225, 10%, 44%)"} fontSize={5} fontFamily="Space Mono, monospace" className="pointer-events-none">
                  MID
                </text>
                <text x={comp.x + 67} y={cy + 26} textAnchor="middle" fill={isDown ? "hsl(200, 100%, 75%)" : "hsl(225, 10%, 44%)"} fontSize={6} fontWeight={isDown ? "bold" : "normal"} fontFamily="Space Mono, monospace" className="pointer-events-none">
                  DN
                </text>

                {/* Active glow behind knob */}
                {!isCenter && (
                  <circle
                    cx={cx}
                    cy={knobY}
                    r={16}
                    fill="hsl(200, 100%, 55%)"
                    opacity={0.12}
                    className="pointer-events-none"
                  />
                )}

                {/* Stick shaft */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={knobY}
                  stroke="hsl(0, 0%, 45%)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={knobY}
                  stroke="hsl(0, 0%, 55%)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />

                {/* Knob shadow ring */}
                <circle
                  cx={cx}
                  cy={knobY + 1}
                  r={11}
                  fill="hsl(225, 15%, 8%)"
                  opacity={0.5}
                  className="pointer-events-none"
                />
                {/* Knob base */}
                <circle
                  cx={cx}
                  cy={knobY}
                  r={10}
                  fill={isCenter ? "hsl(225, 10%, 35%)" : "hsl(200, 75%, 45%)"}
                  stroke={isCenter ? "hsl(225, 10%, 45%)" : "hsl(200, 85%, 58%)"}
                  strokeWidth={1.5}
                  style={
                    !isCenter
                      ? { filter: "drop-shadow(0 0 8px hsl(200, 100%, 50%))" }
                      : undefined
                  }
                />
                {/* Knob inner ring */}
                <circle
                  cx={cx}
                  cy={knobY}
                  r={6}
                  fill="none"
                  stroke={isCenter ? "hsl(225, 8%, 42%)" : "hsl(200, 90%, 62%)"}
                  strokeWidth={0.8}
                  opacity={0.6}
                  className="pointer-events-none"
                />
                {/* Knob specular highlight */}
                <ellipse
                  cx={cx - 3}
                  cy={knobY - 3}
                  rx={4}
                  ry={3}
                  fill="white"
                  opacity={isCenter ? 0.15 : 0.3}
                  className="pointer-events-none"
                />

                {/* Click zones */}
                <rect
                  x={comp.x + 4}
                  y={comp.y + 4}
                  width={72}
                  height={30}
                  fill="transparent"
                  className={successWires || interactionLocked ? "cursor-default" : "cursor-pointer"}
                  onClick={() => handleJoystickClick(isUp ? "center" : "up")}
                />
                <rect
                  x={comp.x + 4}
                  y={comp.y + 34}
                  width={72}
                  height={32}
                  fill="transparent"
                  className={successWires || interactionLocked ? "cursor-default" : "cursor-pointer"}
                  onClick={() => handleJoystickClick("center")}
                />
                <rect
                  x={comp.x + 4}
                  y={comp.y + 66}
                  width={72}
                  height={30}
                  fill="transparent"
                  className={successWires || interactionLocked ? "cursor-default" : "cursor-pointer"}
                  onClick={() => handleJoystickClick(isDown ? "center" : "down")}
                />
              </g>
              );
            })() : isPushButton ? (() => {
              const bx = comp.x;
              const by = comp.y;
              const knobCx = isButtonPressed ? bx + 43 : bx + 17;
              return (
              <g
                className={successWires || interactionLocked ? "" : "cursor-pointer"}
                onMouseDown={(e) =>
                  handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                }
                onClick={() => handlePushButtonClick(comp.id)}
              >
                {/* Outer housing */}
                <rect
                  x={bx}
                  y={by}
                  width={60}
                  height={60}
                  rx={10}
                  fill="hsl(225, 18%, 18%)"
                  stroke={isButtonPressed ? "hsl(160, 80%, 35%)" : "hsl(225, 12%, 30%)"}
                  strokeWidth={1.5}
                  style={
                    isButtonPressed
                      ? { filter: "drop-shadow(0 0 8px hsl(160, 100%, 40%))" }
                      : undefined
                  }
                />
                {/* Inner panel */}
                <rect
                  x={bx + 3}
                  y={by + 3}
                  width={54}
                  height={54}
                  rx={8}
                  fill="hsl(225, 15%, 13%)"
                  stroke="hsl(225, 10%, 19%)"
                  strokeWidth={0.6}
                />

                {/* Power label */}
                <text
                  x={bx + 30}
                  y={by + 14}
                  textAnchor="middle"
                  fill={isButtonPressed ? "hsl(160, 100%, 60%)" : "hsl(225, 8%, 38%)"}
                  fontSize={7}
                  fontWeight="bold"
                  fontFamily="Space Mono, monospace"
                  letterSpacing={1.5}
                  className="pointer-events-none"
                >
                  POWER
                </text>

                {/* Status LED */}
                <circle
                  cx={bx + 48}
                  cy={by + 12}
                  r={3}
                  fill={isButtonPressed ? "hsl(160, 100%, 55%)" : "hsl(0, 70%, 35%)"}
                  stroke={isButtonPressed ? "hsl(160, 80%, 70%)" : "hsl(0, 30%, 25%)"}
                  strokeWidth={0.6}
                  style={
                    isButtonPressed
                      ? { filter: "drop-shadow(0 0 6px hsl(160, 100%, 50%))" }
                      : undefined
                  }
                  className={isButtonPressed ? "animate-pulse" : ""}
                />
                {/* LED ring */}
                <circle
                  cx={bx + 48}
                  cy={by + 12}
                  r={5}
                  fill="none"
                  stroke={isButtonPressed ? "hsl(160, 60%, 40%)" : "hsl(225, 8%, 22%)"}
                  strokeWidth={0.5}
                />

                {/* Toggle track shadow */}
                <rect
                  x={bx + 7}
                  y={by + 24}
                  width={46}
                  height={22}
                  rx={11}
                  fill="hsl(225, 15%, 7%)"
                />
                {/* Toggle track */}
                <rect
                  x={bx + 7}
                  y={by + 23}
                  width={46}
                  height={22}
                  rx={11}
                  fill={isButtonPressed ? "hsl(160, 60%, 22%)" : "hsl(225, 12%, 16%)"}
                  stroke={isButtonPressed ? "hsl(160, 70%, 35%)" : "hsl(225, 10%, 26%)"}
                  strokeWidth={1}
                />

                {/* Track inner highlight */}
                <rect
                  x={bx + 9}
                  y={by + 25}
                  width={42}
                  height={8}
                  rx={4}
                  fill={isButtonPressed ? "hsl(160, 50%, 28%)" : "hsl(225, 10%, 19%)"}
                  opacity={0.5}
                  className="pointer-events-none"
                />

                {/* OFF label */}
                <text
                  x={bx + 18}
                  y={by + 38}
                  textAnchor="middle"
                  fill={isButtonPressed ? "hsl(225, 8%, 25%)" : "hsl(0, 55%, 55%)"}
                  fontSize={6.5}
                  fontWeight="bold"
                  fontFamily="Space Mono, monospace"
                  className="pointer-events-none"
                >
                  OFF
                </text>
                {/* ON label */}
                <text
                  x={bx + 43}
                  y={by + 38}
                  textAnchor="middle"
                  fill={isButtonPressed ? "hsl(160, 100%, 65%)" : "hsl(225, 8%, 25%)"}
                  fontSize={6.5}
                  fontWeight="bold"
                  fontFamily="Space Mono, monospace"
                  className="pointer-events-none"
                >
                  ON
                </text>

                {/* Knob shadow */}
                <circle
                  cx={knobCx}
                  cy={by + 35}
                  r={9}
                  fill="hsl(225, 15%, 6%)"
                  opacity={0.5}
                  className="pointer-events-none"
                />
                {/* Knob body */}
                <circle
                  cx={knobCx}
                  cy={by + 34}
                  r={9}
                  fill={isButtonPressed ? "hsl(160, 85%, 48%)" : "hsl(225, 8%, 42%)"}
                  stroke={isButtonPressed ? "hsl(160, 90%, 60%)" : "hsl(225, 8%, 52%)"}
                  strokeWidth={1.5}
                  style={
                    isButtonPressed
                      ? { filter: "drop-shadow(0 0 7px hsl(160, 100%, 45%))" }
                      : undefined
                  }
                />
                {/* Knob inner ring */}
                <circle
                  cx={knobCx}
                  cy={by + 34}
                  r={5.5}
                  fill="none"
                  stroke={isButtonPressed ? "hsl(160, 70%, 58%)" : "hsl(225, 6%, 48%)"}
                  strokeWidth={0.7}
                  opacity={0.5}
                  className="pointer-events-none"
                />
                {/* Knob specular */}
                <ellipse
                  cx={knobCx - 2.5}
                  cy={by + 31}
                  rx={4}
                  ry={2.5}
                  fill="white"
                  opacity={isButtonPressed ? 0.35 : 0.15}
                  className="pointer-events-none"
                />

                {/* Bottom status bar */}
                <rect
                  x={bx + 12}
                  y={by + 50}
                  width={36}
                  height={3}
                  rx={1.5}
                  fill={isButtonPressed ? "hsl(160, 100%, 50%)" : "hsl(225, 8%, 20%)"}
                  opacity={isButtonPressed ? 0.7 : 0.4}
                  style={
                    isButtonPressed
                      ? { filter: "drop-shadow(0 0 3px hsl(160, 100%, 50%))" }
                      : undefined
                  }
                />
              </g>
              );
            })() : isLcd ? (
              <g
                className={successWires || interactionLocked ? "" : "cursor-move"}
                onMouseDown={(e) =>
                  handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                }
              >
                {/* PCB board */}
                <rect
                  x={comp.x}
                  y={comp.y}
                  width={120}
                  height={60}
                  rx={4}
                  fill="hsl(180, 30%, 18%)"
                  stroke={isLcdOn ? "hsl(180, 60%, 40%)" : "hsl(180, 20%, 28%)"}
                  strokeWidth={1.5}
                />
                {/* Screen bezel */}
                <rect
                  x={comp.x + 6}
                  y={comp.y + 5}
                  width={108}
                  height={36}
                  rx={3}
                  fill="hsl(220, 15%, 10%)"
                  stroke="hsl(220, 10%, 20%)"
                  strokeWidth={0.8}
                />
                {/* Screen display area */}
                <rect
                  x={comp.x + 9}
                  y={comp.y + 8}
                  width={102}
                  height={30}
                  rx={2}
                  fill={isLcdOn ? "hsl(90, 60%, 35%)" : "hsl(180, 15%, 14%)"}
                  fillOpacity={isLcdOn ? 0.85 : 1}
                  style={
                    isLcdOn
                      ? { filter: "drop-shadow(0 0 6px hsl(90, 70%, 40%))" }
                      : undefined
                  }
                />
                {/* Scan line effect when on */}
                {isLcdOn && (
                  <>
                    <line x1={comp.x + 9} y1={comp.y + 18} x2={comp.x + 111} y2={comp.y + 18} stroke="hsl(90, 40%, 30%)" strokeWidth={0.5} opacity={0.3} className="pointer-events-none" />
                    <line x1={comp.x + 9} y1={comp.y + 28} x2={comp.x + 111} y2={comp.y + 28} stroke="hsl(90, 40%, 30%)" strokeWidth={0.5} opacity={0.3} className="pointer-events-none" />
                  </>
                )}
                {/* LCD text */}
                {isLcdOn ? (
                  <text
                    x={comp.x + 60}
                    y={comp.y + 27}
                    textAnchor="middle"
                    fill="hsl(90, 100%, 20%)"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="Space Mono, monospace"
                    className="pointer-events-none"
                  >
                    {lcdText}
                  </text>
                ) : (
                  <text
                    x={comp.x + 60}
                    y={comp.y + 27}
                    textAnchor="middle"
                    fill="hsl(180, 10%, 25%)"
                    fontSize={9}
                    fontFamily="Space Mono, monospace"
                    className="pointer-events-none"
                  >
                    LCD 16x2
                  </text>
                )}
                {/* I2C label */}
                <text
                  x={comp.x + 60}
                  y={comp.y + 52}
                  textAnchor="middle"
                  fill={isLcdOn ? "hsl(180, 50%, 55%)" : "hsl(180, 15%, 35%)"}
                  fontSize={7}
                  fontFamily="Space Mono, monospace"
                  className="pointer-events-none"
                >
                  I2C
                </text>
                {/* Power indicator dot */}
                <circle
                  cx={comp.x + 112}
                  cy={comp.y + 50}
                  r={2.5}
                  fill={isLcdOn ? "hsl(160, 100%, 50%)" : "hsl(0, 0%, 20%)"}
                  style={
                    isLcdOn
                      ? { filter: "drop-shadow(0 0 3px hsl(160, 100%, 50%))" }
                      : undefined
                  }
                />
              </g>
            ) : isMotor ? (() => {
              const mx = comp.x;
              const my = comp.y;
              const mcx = mx + 30;
              const mcy = my + 34;
              return (
              <g
                className={successWires || interactionLocked ? "" : "cursor-move"}
                onMouseDown={(e) =>
                  handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                }
              >
                {/* Motor housing */}
                <rect
                  x={mx}
                  y={my + 8}
                  width={60}
                  height={48}
                  rx={10}
                  fill="hsl(225, 18%, 20%)"
                  stroke={isMotorOn ? "hsl(30, 90%, 55%)" : "hsl(225, 12%, 32%)"}
                  strokeWidth={1.8}
                  style={
                    isMotorOn
                      ? { filter: "drop-shadow(0 0 8px hsl(30, 90%, 50%))" }
                      : undefined
                  }
                />
                {/* Inner body */}
                <rect
                  x={mx + 4}
                  y={my + 12}
                  width={52}
                  height={40}
                  rx={7}
                  fill="hsl(30, 50%, 28%)"
                  stroke="hsl(30, 30%, 38%)"
                  strokeWidth={0.8}
                />
                {/* "M" label */}
                <text
                  x={mcx}
                  y={my + 52}
                  textAnchor="middle"
                  fill={isMotorOn ? "hsl(30, 100%, 65%)" : "hsl(30, 20%, 50%)"}
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="Space Mono, monospace"
                  className="pointer-events-none"
                >
                  MOTOR
                </text>
                {/* Rotor circle background */}
                <circle
                  cx={mcx}
                  cy={mcy}
                  r={14}
                  fill="hsl(225, 15%, 14%)"
                  stroke={isMotorOn ? "hsl(30, 80%, 50%)" : "hsl(225, 10%, 28%)"}
                  strokeWidth={1.2}
                />
                {/* Spinning rotor blades */}
                <g>
                  <line
                    x1={mcx - 10}
                    y1={mcy}
                    x2={mcx + 10}
                    y2={mcy}
                    stroke={isMotorOn ? "hsl(30, 100%, 60%)" : "hsl(0, 0%, 45%)"}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  <line
                    x1={mcx}
                    y1={mcy - 10}
                    x2={mcx}
                    y2={mcy + 10}
                    stroke={isMotorOn ? "hsl(30, 100%, 60%)" : "hsl(0, 0%, 45%)"}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  {isMotorOn && (
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${mcx} ${mcy}`}
                      to={`360 ${mcx} ${mcy}`}
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  )}
                </g>
                {/* Center axle dot */}
                <circle
                  cx={mcx}
                  cy={mcy}
                  r={3}
                  fill={isMotorOn ? "hsl(30, 100%, 70%)" : "hsl(0, 0%, 50%)"}
                  style={
                    isMotorOn
                      ? { filter: "drop-shadow(0 0 4px hsl(30, 100%, 60%))" }
                      : undefined
                  }
                />
                {/* Power indicator */}
                <circle
                  cx={mx + 52}
                  cy={my + 14}
                  r={2.5}
                  fill={isMotorOn ? "hsl(30, 100%, 55%)" : "hsl(0, 0%, 20%)"}
                  style={
                    isMotorOn
                      ? { filter: "drop-shadow(0 0 3px hsl(30, 100%, 55%))" }
                      : undefined
                  }
                  className={isMotorOn ? "animate-pulse" : ""}
                />
              </g>
              );
            })() : (
              <>
                <rect
                  x={comp.x}
                  y={comp.y}
                  width={def.width}
                  height={def.height}
                  rx={6}
                  fill={def.color}
                  fillOpacity={comp.type === "arduino-nano" ? 0.4 : 0.3}
                  stroke={def.color}
                  strokeWidth={2}
                  strokeOpacity={comp.type === "arduino-nano" ? 1 : 0.8}
                  className={successWires || interactionLocked ? "cursor-default" : "cursor-move"}
                  onMouseDown={(e) =>
                    handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                  }
                />
                <text
                  x={comp.x + def.width / 2}
                  y={comp.y + def.height / 2 - 8}
                  textAnchor="middle"
                  fill="hsl(210, 40%, 90%)"
                  fontSize={20}
                  className={successWires || interactionLocked ? "" : "cursor-move"}
                  onMouseDown={(e) =>
                    handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
                  }
                >
                  {def.emoji}
                </text>
              </>
            )}
            <text
              x={comp.x + def.width / 2}
              y={componentLabelY}
              textAnchor="middle"
              fill="hsl(210, 40%, 80%)"
              fontSize={9}
              fontFamily="Space Mono, monospace"
              className={successWires || interactionLocked ? "" : "cursor-move"}
              onMouseDown={(e) =>
                handleDragStart(e, comp.id, comp.x, comp.y, def.width, def.height)
              }
            >
              {def.label}
            </text>

            {/* Remove button */}
            {!successWires && !interactionLocked && allowComponentRemoval && (
              <g
                onClick={() => removeComponent(comp.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={comp.x + def.width - 4}
                  cy={comp.y + 4}
                  r={7}
                  fill="hsl(0, 80%, 45%)"
                  fillOpacity={0.6}
                  className="hover:fill-opacity-100"
                />
                <text
                  x={comp.x + def.width - 4}
                  y={comp.y + 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  ×
                </text>
              </g>
            )}

            {/* Pins */}
            {comp.pins.map((pin) => {
              const isSelected = selectedPin === pin.id;
              const isConnected = wires.some(
                (w) => w.fromPin === pin.id || w.toPin === pin.id
              );
              const isHinted =
                activeHintPinPair &&
                (activeHintPinPair.fromPin === pin.id ||
                  activeHintPinPair.toPin === pin.id);
              const pinAtBottom = pin.y >= comp.y + def.height - 5;
              const labelY = pinAtBottom ? pin.y + 16 : pin.y - 10;

              return (
                <g
                  key={pin.id}
                  onClick={interactionLocked ? undefined : () => onPinClick(pin.id)}
                  className={interactionLocked ? "cursor-default" : "cursor-pointer"}
                >
                  <circle
                    cx={pin.x}
                    cy={pin.y}
                    r={isSelected ? 7 : 5}
                    fill={
                      isSelected
                        ? "hsl(160, 70%, 40%)"
                        : isHinted
                        ? "hsl(300, 60%, 50%)"
                        : isConnected
                        ? "hsl(50, 50%, 45%)"
                        : "hsl(210, 15%, 35%)"
                    }
                    stroke={
                      isSelected
                        ? "hsl(160, 70%, 50%)"
                        : isHinted
                        ? "hsl(300, 65%, 58%)"
                        : "hsl(210, 15%, 42%)"
                    }
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    style={
                      isSelected
                        ? { filter: "drop-shadow(0 0 5px hsl(160, 70%, 40%))" }
                        : isHinted
                        ? { filter: "drop-shadow(0 0 6px hsl(300, 60%, 50%))" }
                        : undefined
                    }
                  />
                  <text
                    x={pin.x}
                    y={labelY}
                    textAnchor="middle"
                    fill="hsl(210, 30%, 75%)"
                    fontSize={8}
                    fontFamily="Space Mono, monospace"
                  >
                    {pin.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* "Click a pin" helper */}
      {selectedPin && (
        <text
          x={300}
          y={490}
          textAnchor="middle"
          fill="hsl(160, 100%, 45%)"
          fontSize={12}
          fontFamily="Outfit, sans-serif"
        >
          Now click another pin to connect a wire!
        </text>
      )}
    </svg>
  );
};

export default BreadboardCanvas;
