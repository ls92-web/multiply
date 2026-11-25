import { FactMastery } from "@/lib/types";
import { parseFactId } from "@/lib/engine/facts";

/**
 * Facts worth revisiting in "Try Again": anything flagged as needing
 * practice, or not yet mastered. Sorted so the weakest facts (most wrong
 * answers relative to attempts) come first.
 */
export function getWeakFactPairs(
  masteryMap: Record<string, FactMastery>,
): Array<{ a: number; b: number }> {
  const entries = Object.values(masteryMap).filter(
    (m) => m.needsPractice || m.mastery === "learning" || m.mastery === "developing",
  );

  entries.sort((a, b) => {
    const aRate = a.attempts > 0 ? a.correct / a.attempts : 0;
    const bRate = b.attempts > 0 ? b.correct / b.attempts : 0;
    return aRate - bRate;
  });

  return entries.map((m) => parseFactId(m.factId));
}
