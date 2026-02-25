import { useGameStore } from "@/store/gameStore";
import ProfileSetup from "@/pages/ProfileSetup";
import Home from "@/pages/Home";

const Index = () => {
  const setupComplete = useGameStore((s) => s.setupComplete);
  return setupComplete ? <Home /> : <ProfileSetup />;
};

export default Index;
