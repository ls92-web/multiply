"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { AccentColor } from "@/lib/types";
import { accent } from "@/lib/accent";

interface ProgressBarProps {
  ratio: number;
  accentColor?: AccentColor;
  height?: number;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({
  ratio,
  accentColor = "purple",
  height = 16,
  className,
  trackClassName,
}: ProgressBarProps) {
  const a = accent(accentColor);
  const clamped = Math.max(0, Math.min(1, ratio));

  return (
    <div
      className={clsx("w-full rounded-full bg-ink/8 overflow-hidden", trackClassName)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={clsx("h-full rounded-full", a.bg, className)}
        initial={{ width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
