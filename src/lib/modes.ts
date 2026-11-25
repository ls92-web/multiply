import { Brain, Sparkles, PuzzleIcon, Timer, Flame, Repeat } from "lucide-react";
import { GameMode, ModeInfo } from "./types";
import type { ComponentType } from "react";

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  recall: {
    id: "recall",
    name: "Recall",
    tagline: "Type the answer yourself",
    accent: "purple",
  },
  pickit: {
    id: "pickit",
    name: "Pick It",
    tagline: "Choose the right answer",
    accent: "blue",
  },
  fillgap: {
    id: "fillgap",
    name: "Fill the Gap",
    tagline: "Find the missing number",
    accent: "orange",
  },
  beatclock: {
    id: "beatclock",
    name: "Beat the Clock",
    tagline: "Score big in 60 seconds",
    accent: "pink",
  },
  streak: {
    id: "streak",
    name: "Perfect Streak",
    tagline: "How far can you go?",
    accent: "mint",
  },
  tryagain: {
    id: "tryagain",
    name: "Try Again",
    tagline: "Master your tricky facts",
    accent: "yellow",
  },
};

export const MODE_ICONS: Record<GameMode, ComponentType<{ className?: string; size?: number }>> = {
  recall: Brain,
  pickit: PuzzleIcon,
  fillgap: Sparkles,
  beatclock: Timer,
  streak: Flame,
  tryagain: Repeat,
};
