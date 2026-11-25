"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ACCENT_HEX } from "@/lib/accent";
import { AccentColor } from "@/lib/types";

interface ConfettiProps {
  pieces?: number;
  colors?: AccentColor[];
}

const DEFAULT_COLORS: AccentColor[] = ["purple", "blue", "orange", "pink", "mint", "yellow"];

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  isSquare: boolean;
}

function generatePieces(pieces: number, colors: AccentColor[]): Piece[] {
  return Array.from({ length: pieces }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.4 + Math.random() * 0.9,
    rotate: Math.random() * 360,
    color: ACCENT_HEX[colors[i % colors.length]],
    isSquare: Math.random() > 0.5,
  }));
}

/** A short, lightweight confetti burst. Respects reduced-motion by rendering nothing. */
export function Confetti({ pieces = 36, colors = DEFAULT_COLORS }: ConfettiProps) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Generated once per mount, not re-derived on every render, since this
  // component is only ever mounted for the duration of a single burst.
  const [items] = useState<Piece[]>(() => (prefersReduced ? [] : generatePieces(pieces, colors)));

  if (prefersReduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
      {items.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.x}%`,
            width: piece.isSquare ? 10 : 8,
            height: piece.isSquare ? 10 : 8,
            backgroundColor: piece.color,
            borderRadius: piece.isSquare ? 2 : 8,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: piece.rotate }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
