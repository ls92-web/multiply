"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Star, RotateCcw, Home } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { AccentColor } from "@/lib/types";

interface ResultsScreenProps {
  accentColor: AccentColor;
  totalAnswered: number;
  correctCount: number;
  pointsEarned: number;
  bestStreakInSession: number;
  isNewStreakRecord: boolean;
  isNewBeatClockRecord: boolean;
  leveledUpTo: number | null;
  onPlayAgain: () => void;
}

export function ResultsScreen({
  accentColor,
  totalAnswered,
  correctCount,
  pointsEarned,
  bestStreakInSession,
  isNewStreakRecord,
  isNewBeatClockRecord,
  leveledUpTo,
  onPlayAgain,
}: ResultsScreenProps) {
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const celebrate = isNewStreakRecord || isNewBeatClockRecord || leveledUpTo !== null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      {celebrate && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Panel className="flex flex-col items-center text-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="h-16 w-16 rounded-full bg-mint flex items-center justify-center"
          >
            <Trophy className="text-white" size={30} />
          </motion.div>

          {leveledUpTo && (
            <p className="font-display font-extrabold text-xl text-purple-deep">
              Level Up! You reached Level {leveledUpTo}
            </p>
          )}
          {(isNewStreakRecord || isNewBeatClockRecord) && (
            <p className="font-display font-extrabold text-mint-deep flex items-center gap-1.5">
              <Star size={18} /> New personal record!
            </p>
          )}

          <h2 className="font-display text-2xl font-bold">Great practice!</h2>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Stat label="Questions" value={totalAnswered} />
            <Stat label="Correct" value={correctCount} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
            <Stat label="Best streak" value={bestStreakInSession} />
          </div>

          <p className="font-display text-3xl font-extrabold text-purple-deep">
            +{pointsEarned} points
          </p>

          <div className="flex gap-3 w-full mt-2">
            <Button
              accentColor={accentColor}
              variant="soft"
              fullWidth
              icon={<RotateCcw size={18} />}
              onClick={onPlayAgain}
            >
              Again
            </Button>
            <Link href="/home" className="w-full">
              <Button accentColor={accentColor} fullWidth icon={<Home size={18} />}>
                Home
              </Button>
            </Link>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-cream rounded-2xl py-3">
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-bold text-ink-soft uppercase tracking-wide">{label}</p>
    </div>
  );
}
