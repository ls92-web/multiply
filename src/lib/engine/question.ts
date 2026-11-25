import { GameMode, Question, FactMastery } from "../types";
import { canonicalFactId, factId } from "./facts";
import { RngFn, defaultRng, pickRandom } from "./rng";
import { buildChoices, generateDistractors } from "./distractors";

export interface FactPair {
  a: number;
  b: number;
}

const RECENT_WINDOW = 4;

/**
 * Picks the next fact to practice. Weak / unmastered facts and facts never
 * seen are weighted higher than mastered facts, and anything asked in the
 * last few questions is strongly deprioritized so practice doesn't feel
 * like predictable, repetitive drilling.
 */
export function selectNextFact(
  pairs: FactPair[],
  masteryByCanonicalId: Record<string, FactMastery | undefined>,
  recentCanonicalIds: string[],
  rng: RngFn = defaultRng,
): FactPair {
  if (pairs.length === 0) {
    throw new Error("No fact pairs available to select from");
  }

  const recentSet = new Set(recentCanonicalIds.slice(-RECENT_WINDOW));

  const weighted = pairs.map((pair) => {
    const cid = canonicalFactId(pair.a, pair.b);
    const mastery = masteryByCanonicalId[cid];
    let weight = 1;

    if (!mastery || mastery.mastery === "new") weight *= 2.2;
    if (mastery?.needsPractice) weight *= 3;
    if (mastery?.mastery === "developing") weight *= 1.4;
    if (mastery?.mastery === "mastered") weight *= 0.4;
    if (recentSet.has(cid)) weight *= 0.05;

    return { pair, weight };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.pair;
  }
  return weighted[weighted.length - 1].pair;
}

export function generateQuestion(
  mode: GameMode,
  pair: FactPair,
  rng: RngFn = defaultRng,
): Question {
  const { a, b } = pair;
  const answer = a * b;
  const id = factId(a, b);

  if (mode === "fillgap") {
    const missing = pickRandom<"a" | "b" | "product">(["a", "b", "product"], rng);
    return { factId: id, a, b, answer, mode, missing };
  }

  if (mode === "pickit") {
    const distractors = generateDistractors(a, b, answer, rng);
    const choices = buildChoices(answer, distractors, rng);
    return { factId: id, a, b, answer, mode, choices, missing: "product" };
  }

  return { factId: id, a, b, answer, mode, missing: "product" };
}

/** The value the child must type for a fill-the-gap or recall question. */
export function expectedInputAnswer(q: Question): number {
  if (q.missing === "a") return q.a;
  if (q.missing === "b") return q.b;
  return q.answer;
}

/** Whether this mode requires the child to type an answer (vs. select one). */
export function isIndependentMode(mode: GameMode): boolean {
  return mode !== "pickit";
}
