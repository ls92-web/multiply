"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { AccentColor } from "@/lib/types";
import { accent } from "@/lib/accent";

interface ChoiceGridProps {
  choices: number[];
  answer: number;
  selected: number | null;
  feedback: "none" | "correct" | "incorrect";
  onSelect: (value: number) => void;
  accentColor: AccentColor;
}

export function ChoiceGrid({
  choices,
  answer,
  selected,
  feedback,
  onSelect,
  accentColor,
}: ChoiceGridProps) {
  const a = accent(accentColor);

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
      {choices.map((choice) => {
        const isSelected = selected === choice;
        const revealCorrect = feedback !== "none" && choice === answer;
        const revealWrong = feedback === "incorrect" && isSelected && choice !== answer;

        return (
          <motion.button
            key={choice}
            type="button"
            disabled={feedback !== "none"}
            whileTap={feedback === "none" ? { scale: 0.93 } : undefined}
            onClick={() => onSelect(choice)}
            className={clsx(
              "h-20 rounded-2xl font-display text-3xl font-extrabold flex items-center justify-center shadow-pop-sm",
              revealCorrect && "bg-success text-white",
              revealWrong && "bg-error text-white",
              !revealCorrect && !revealWrong && isSelected && clsx(a.bg, "text-white"),
              !revealCorrect && !revealWrong && !isSelected && "bg-white text-ink",
            )}
          >
            {choice}
          </motion.button>
        );
      })}
    </div>
  );
}
