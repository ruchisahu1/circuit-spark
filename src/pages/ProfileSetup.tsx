import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { AVATARS } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const setupComplete = useGameStore((s) => s.setupComplete);
  const setProfile = useGameStore((s) => s.setProfile);

  useEffect(() => {
    if (setupComplete) navigate("/home", { replace: true });
  }, [setupComplete, navigate]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    setProfile({
      name: name.trim(),
      className: className.trim(),
      avatar: selectedAvatar,
      totalXP: 0,
      currentLevel: 1,
      streak: 0,
      lastPlayed: null,
    });
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-glow-green text-primary font-outfit">
            ⚡ Circuit Builder
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome, young engineer! Let's set up your profile.
          </p>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card p-6 neon-border">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What's your name?
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="bg-secondary border-border"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your class (optional)
            </label>
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. 5B"
              className="bg-secondary border-border"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Choose your avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                    selectedAvatar === avatar.id
                      ? "border-primary glow-green bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <span className="text-3xl">{avatar.emoji}</span>
                  <span className="text-xs text-muted-foreground">
                    {avatar.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full glow-green text-lg font-bold"
            size="lg"
          >
            Start Building! 🔌
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
