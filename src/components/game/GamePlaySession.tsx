"use client";

import { useEffect, useRef } from "react";
import { useGameSession } from "@/lib/gameplay/useGameSession";
import { ChildProfile, GameMode } from "@/lib/types";
import { MODE_INFO } from "@/lib/modes";
import { QuestionCard } from "./QuestionCard";
import { ChoiceGrid } from "./ChoiceGrid";
import { Keypad } from "./Keypad";
import { CountdownBar } from "./CountdownBar";
import { ResultsScreen } from "./ResultsScreen";
import { Flame, Target } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface GamePlaySessionProps {
  profile: ChildProfile;
  mode: GameMode;
  tables: number[];
  questionCount: number;
  weakFactPool?: Array<{ a: number; b: number }>;
  onPlayAgain: () => void;
}

export function GamePlaySession({
  profile,
  mode,
  tables,
  questionCount,
  weakFactPool,
  onPlayAgain,
}: GamePlaySessionProps) {
  const [state, actions] = useGameSession({ profile, mode, tables, questionCount, weakFactPool });
  const info = MODE_INFO[mode];
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") actions.setDigit(e.key);
      else if (e.key === "Backspace") actions.backspace();
      else if (e.key === "Enter") actions.submitTyped();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, actions]);

  if (state.phase === "finished") {
    return (
      <ResultsScreen
        accentColor={info.accent}
        totalAnswered={state.totalAnswered}
        correctCount={state.correctCount}
        pointsEarned={state.pointsEarned}
        bestStreakInSession={state.bestStreakInSession}
        isNewStreakRecord={state.isNewStreakRecord}
        isNewBeatClockRecord={state.isNewBeatClockRecord}
        leveledUpTo={state.leveledUpTo}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  if (state.phase === "loading" || !state.question) {
    return <div className="flex-1" />;
  }

  const isTyped = mode !== "pickit";

  return (
    <div className="flex-1 flex flex-col items-center px-6 pb-8 gap-6 w-full max-w-md mx-auto">
      {mode === "beatclock" && state.timeRemaining !== null && (
        <CountdownBar secondsRemaining={state.timeRemaining} totalSeconds={60} />
      )}

      <div className="w-full flex items-center justify-between">
        <HudPill icon={<Flame size={16} />} label="Streak" value={state.streak} />
        {!["beatclock", "streak"].includes(mode) && (
          <span className="text-sm font-bold text-ink-soft">
            {Math.min(state.questionIndex + (state.feedback === "none" ? 1 : 0), state.totalQuestions)}
            {" / "}
            {state.totalQuestions}
          </span>
        )}
        <HudPill icon={<Target size={16} />} label="Points" value={state.pointsEarned} />
      </div>

      <AnimatePresence mode="wait">
        <QuestionCard
          question={state.question}
          typed={state.typed}
          feedback={state.feedback}
          accentColor={info.accent}
        />
      </AnimatePresence>

      <AnimatePresence>
        {state.feedback === "incorrect" && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-error font-display font-bold text-center"
          >
            Not quite — you&apos;ll see this one again soon.
          </motion.p>
        )}
        {state.feedback === "correct" && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-success font-display font-bold text-center"
          >
            {state.lastPointsAwarded > 0 ? `Nice! +${state.lastPointsAwarded}` : "Correct!"}
          </motion.p>
        )}
      </AnimatePresence>

      <div ref={inputRef} className="flex-1 flex flex-col items-center justify-end w-full gap-4">
        {isTyped ? (
          <Keypad
            onDigit={actions.setDigit}
            onBackspace={actions.backspace}
            onSubmit={actions.submitTyped}
            accentColor={info.accent}
            submitDisabled={state.typed.length === 0 || state.feedback !== "none"}
          />
        ) : (
          <ChoiceGrid
            choices={state.question.choices ?? []}
            answer={state.question.answer}
            selected={state.selectedChoice}
            feedback={state.feedback}
            onSelect={actions.selectChoice}
            accentColor={info.accent}
          />
        )}
      </div>
    </div>
  );
}

function HudPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-pop-sm">
      <span className="text-ink-soft">{icon}</span>
      <span className="font-display font-bold text-sm">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
