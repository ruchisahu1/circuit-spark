import { Navigate, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { levels } from "@/data/levels";
import { AVATARS } from "@/types/game";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock, Star, Trophy, Zap } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const profile = useGameStore((s) => s.profile);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked);
  const badges = useGameStore((s) => s.badges);

  if (!profile) return <Navigate to="/setup" replace />;

  const avatar = AVATARS.find((a) => a.id === profile.avatar);
  const earnedBadges = badges.filter((b) => b.earned).length;
  const totalStars = levelProgress.reduce((sum, p) => sum + p.stars, 0);
  const maxXP = 1500;
  const xpPercent = Math.min((profile.totalXP / maxXP) * 100, 100);

  const difficultyColors: Record<string, string> = {
    beginner: "text-neon-green",
    intermediate: "text-neon-blue",
    advanced: "text-neon-purple",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-secondary text-3xl glow-green">
              {avatar?.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
              {profile.className && (
                <p className="text-sm text-muted-foreground">Class {profile.className}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/badges")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy className="h-5 w-5 text-neon-yellow" />
              <span className="text-sm font-medium">{earnedBadges}</span>
            </button>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-5 w-5 text-neon-yellow" />
              <span className="text-sm font-medium">{totalStars}</span>
            </div>
          </div>
        </motion.div>

        {/* XP Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-primary font-medium">
              <Zap className="h-4 w-4" /> {profile.totalXP} XP
            </span>
            <span className="text-muted-foreground">{maxXP} XP</span>
          </div>
          <Progress value={xpPercent} className="h-3 bg-secondary [&>div]:bg-primary" />
        </motion.div>

        {/* Level Grid */}
        <div className="space-y-6">
          {(["beginner", "intermediate", "advanced"] as const).map((difficulty) => {
            const diffLevels = levels.filter((l) => l.difficulty === difficulty);
            return (
              <div key={difficulty} className="space-y-3">
                <h2 className={`text-lg font-bold uppercase tracking-wider ${difficultyColors[difficulty]}`}>
                  {difficulty}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {diffLevels.map((level, i) => {
                    const unlocked = isLevelUnlocked(level.id);
                    const progress = levelProgress.find((p) => p.levelId === level.id);

                    return (
                      <motion.div
                        key={level.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                      >
                        <button
                          onClick={() => unlocked && navigate(`/play/${level.id}`)}
                          disabled={!unlocked}
                          className={`group relative w-full rounded-xl border p-4 text-left transition-all ${
                            unlocked
                              ? progress?.completed
                                ? "border-primary/30 bg-primary/5 hover:bg-primary/10 neon-border"
                                : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                              : "border-border/50 bg-card/30 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{level.id}
                            </span>
                            {!unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <h3 className="mt-1 text-sm font-semibold text-foreground">
                            {level.title}
                          </h3>
                          {progress?.completed && (
                            <div className="mt-2 flex gap-0.5">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-4 w-4 ${
                                    s <= progress.stars
                                      ? "fill-neon-yellow text-neon-yellow"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
