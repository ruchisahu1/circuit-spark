import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const setupComplete = useGameStore((s) => s.setupComplete);
  const profile = useGameStore((s) => s.profile);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_25%,rgba(34,197,94,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex h-full w-full max-w-7xl items-center px-4 py-4 md:px-8 md:py-6"
      >
        <div className="mx-auto w-full max-w-3xl text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-primary">
            <span>Interactive Learning</span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span>Electronics</span>
          </div>

          <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">
            Electronics Engineer
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-6xl">
            Build Real Circuits. Learn by Playing.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Master the basics of electronics with guided challenges using real
            components like LEDs, resistors, switches, and batteries.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {setupComplete ? (
              <Button
                onClick={() => navigate("/home")}
                className="glow-green px-8"
                size="lg"
              >
                Continue as {profile?.name ?? "Learner"}
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/setup")}
                className="glow-green px-8"
                size="lg"
              >
                Start Building
              </Button>
            )}
          </div>

          <div className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Zap className="h-4 w-4 text-primary" />
            LEDs · Resistors · Batteries · Switches
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
