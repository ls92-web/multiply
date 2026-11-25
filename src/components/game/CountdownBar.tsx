"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface CountdownBarProps {
  secondsRemaining: number;
  totalSeconds: number;
}

export function CountdownBar({ secondsRemaining, totalSeconds }: CountdownBarProps) {
  const ratio = Math.max(0, secondsRemaining / totalSeconds);
  const urgent = secondsRemaining <= 10;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">Time</span>
        <span
          className={clsx(
            "font-display font-extrabold text-xl",
            urgent ? "text-error" : "text-ink",
          )}
        >
          {secondsRemaining}s
        </span>
      </div>
      <div className="h-4 w-full rounded-full bg-ink/8 overflow-hidden">
        <motion.div
          className={clsx("h-full rounded-full", urgent ? "bg-error" : "bg-pink")}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </div>
    </div>
  );
}
