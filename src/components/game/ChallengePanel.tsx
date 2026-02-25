import { LevelDefinition, ValidationFeedback } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Lightbulb, RotateCcw, CheckCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LearningCoachFeedback } from "@/engine/learningCoach";

interface ChallengePanelProps {
  level: LevelDefinition;
  hintsRevealed: string[];
  coachFeedback: LearningCoachFeedback | null;
  remainingHintTargets: number;
  onCheckCircuit: () => void;
  onHint: () => void;
  onReset: () => void;
  onBack: () => void;
  feedback: ValidationFeedback | null;
  isHardFailed: boolean;
  elapsedTime: number;
  showPwmSlider: boolean;
  pwmBrightness: number;
  onPwmBrightnessChange: (value: number) => void;
}

const ChallengePanel = ({
  level,
  hintsRevealed,
  coachFeedback,
  remainingHintTargets,
  onCheckCircuit,
  onHint,
  onReset,
  onBack,
  feedback,
  isHardFailed,
  elapsedTime,
  showPwmSlider,
  pwmBrightness,
  onPwmBrightnessChange,
}: ChallengePanelProps) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs font-mono text-muted-foreground">Level {level.id}</p>
          <h2 className="text-lg font-bold text-foreground">{level.title}</h2>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border bg-secondary/50 p-3">
        <p className="text-sm text-foreground">{level.description}</p>
      </div>

      {/* Teaching text */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 {level.teachingText}
        </p>
      </div>

      {/* Task list */}
      {coachFeedback && (
        <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary">Task List</p>
          <p className="text-xs text-muted-foreground">{coachFeedback.primaryMessage}</p>
          <p className="text-[11px] text-muted-foreground">{coachFeedback.progressText}</p>
          {coachFeedback.tasks.length > 0 && (
            <div className="space-y-1">
              {coachFeedback.tasks.map((task, index) => (
                <div key={task.id} className="rounded border border-border/40 px-2 py-1">
                  <p className="text-[11px] text-muted-foreground">
                    {task.completed ? "✅" : "⬜"} Task {index + 1}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">{task.instruction}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timer & Stars target */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-mono ${elapsedTime > level.timeTarget * 1.5 ? "text-destructive" : elapsedTime > level.timeTarget ? "text-neon-yellow" : "text-muted-foreground"}`}>
          ⏱ {formatTime(elapsedTime)}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          ⭐⭐⭐ &lt; {formatTime(level.timeTarget)}
        </span>
      </div>

      {/* PWM Brightness slider */}
      {showPwmSlider && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-400">PWM Brightness</p>
            <span className="font-mono text-xs text-blue-300">
              {pwmBrightness}
              <span className="text-blue-500/60">/255</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            value={pwmBrightness}
            onChange={(e) => onPwmBrightnessChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
            style={{
              background: `linear-gradient(to right, hsl(210, 80%, 50%) ${(pwmBrightness / 255) * 100}%, hsl(220, 15%, 20%) ${(pwmBrightness / 255) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>OFF</span>
            <span>DIM</span>
            <span>FULL</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            analogWrite(pin, {pwmBrightness}) — {Math.round((pwmBrightness / 255) * 100)}% duty cycle
          </p>
        </div>
      )}

      {/* Direct hints (always available) */}
      {hintsRevealed.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-neon-yellow">
            Direct wire hints
          </p>
          {hintsRevealed.map((hint, i) => (
            <div key={i} className="rounded border border-neon-yellow/20 bg-neon-yellow/5 px-3 py-1.5 text-xs text-foreground">
              💡 {hint}
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-lg border p-3 text-sm font-medium ${
              feedback.result === "success"
                ? "border-primary/40 bg-primary/10 text-primary"
                : feedback.result === "danger"
                ? "border-destructive bg-destructive/20 text-destructive"
                : feedback.result === "wrong"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow"
            }`}
          >
            {feedback.message}
            {feedback.result !== "success" && (
              <p className="mt-1 text-xs opacity-70">
                {feedback.correctCount}/{feedback.totalRequired} connections correct
              </p>
            )}
            {feedback.result === "danger" && (
              <p className="mt-2 text-xs font-semibold opacity-90">
                Attempt locked for safety. Press Reset to retry.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={onCheckCircuit}
          disabled={isHardFailed}
          className="w-full glow-green font-bold"
          size="lg"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {isHardFailed ? "Attempt Failed" : "Check Circuit"}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onHint}
            disabled={remainingHintTargets <= 0 || isHardFailed}
            className="flex-1 text-xs"
            size="sm"
          >
            <Lightbulb className="mr-1 h-3 w-3" />
            Direct Hint ({remainingHintTargets} left)
          </Button>
          <Button variant="outline" onClick={onReset} className="flex-1 text-xs" size="sm">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengePanel;
