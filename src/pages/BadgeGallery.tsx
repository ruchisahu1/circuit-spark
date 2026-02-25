import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const BadgeGallery = () => {
  const navigate = useNavigate();
  const badges = useGameStore((s) => s.badges);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">🏆 Badge Gallery</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border p-4 text-center transition-all ${
                badge.earned
                  ? "border-primary/40 bg-primary/5 neon-border"
                  : "border-border bg-card/50 opacity-40"
              }`}
            >
              <span className="text-4xl">{badge.icon}</span>
              <h3 className="mt-2 text-sm font-bold text-foreground">{badge.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
              {!badge.earned && (
                <p className="mt-2 text-xs text-muted-foreground/70 italic">{badge.condition}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgeGallery;
