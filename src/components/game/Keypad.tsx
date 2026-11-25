"use client";

import { motion } from "framer-motion";
import { Delete, CornerDownLeft } from "lucide-react";
import clsx from "clsx";
import { AccentColor } from "@/lib/types";
import { accent } from "@/lib/accent";

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  accentColor?: AccentColor;
  submitDisabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Keypad({
  onDigit,
  onBackspace,
  onSubmit,
  accentColor = "purple",
  submitDisabled,
}: KeypadProps) {
  const a = accent(accentColor);

  const keyClass =
    "h-14 sm:h-16 rounded-2xl bg-white shadow-pop-sm font-display text-2xl font-bold text-ink flex items-center justify-center select-none";

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
      {KEYS.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.92 }}
          className={keyClass}
          onClick={() => onDigit(key)}
          aria-label={`Digit ${key}`}
        >
          {key}
        </motion.button>
      ))}

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        className={clsx(keyClass, "text-ink-soft")}
        onClick={onBackspace}
        aria-label="Backspace"
      >
        <Delete size={26} />
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        className={keyClass}
        onClick={() => onDigit("0")}
        aria-label="Digit 0"
      >
        0
      </motion.button>

      <motion.button
        type="button"
        whileTap={submitDisabled ? undefined : { scale: 0.92 }}
        disabled={submitDisabled}
        className={clsx(
          keyClass,
          a.bg,
          "text-white disabled:opacity-40 disabled:pointer-events-none",
        )}
        onClick={onSubmit}
        aria-label="Submit answer"
      >
        <CornerDownLeft size={26} />
      </motion.button>
    </div>
  );
}
