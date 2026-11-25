"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { AccentColor, Question } from "@/lib/types";
import { accent } from "@/lib/accent";

interface QuestionCardProps {
  question: Question;
  typed: string;
  feedback: "none" | "correct" | "incorrect";
  accentColor: AccentColor;
}

function slotLabel(question: Question, slot: "a" | "b" | "product", typed: string, feedback: string) {
  const isBlank = question.missing === slot;
  if (!isBlank) {
    return slot === "a" ? question.a : slot === "b" ? question.b : question.answer;
  }
  if (feedback === "incorrect") {
    return slot === "a" ? question.a : slot === "b" ? question.b : question.answer;
  }
  return typed.length > 0 ? typed : "?";
}

export function QuestionCard({ question, typed, feedback, accentColor }: QuestionCardProps) {
  const a = accent(accentColor);

  return (
    <motion.div
      key={question.factId + question.missing}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={
        feedback === "incorrect"
          ? { opacity: 1, scale: 1, x: [0, -10, 10, -6, 6, 0] }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: feedback === "incorrect" ? 0.4 : 0.25 }}
      className={clsx(
        "rounded-[1.75rem] bg-white shadow-pop px-8 py-10 flex items-center justify-center gap-3 font-display text-5xl sm:text-6xl font-extrabold select-none",
        feedback === "correct" && "ring-4 ring-success",
        feedback === "incorrect" && "ring-4 ring-error",
      )}
    >
      <Slot value={slotLabel(question, "a", typed, feedback)} active={question.missing === "a"} accent={a.text} feedback={feedback} />
      <span className="text-ink-soft">&times;</span>
      <Slot value={slotLabel(question, "b", typed, feedback)} active={question.missing === "b"} accent={a.text} feedback={feedback} />
      <span className="text-ink-soft">=</span>
      <Slot
        value={slotLabel(question, "product", typed, feedback)}
        active={question.missing === "product"}
        accent={a.text}
        feedback={feedback}
      />
    </motion.div>
  );
}

function Slot({
  value,
  active,
  accent: accentClass,
  feedback,
}: {
  value: string | number;
  active: boolean;
  accent: string;
  feedback: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center min-w-[1.4ch]",
        active && clsx(accentClass, "underline decoration-4 underline-offset-8"),
      )}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={String(value) + feedback}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
