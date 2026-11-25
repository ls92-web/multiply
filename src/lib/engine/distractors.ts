import { RngFn, defaultRng, shuffle } from "./rng";

/**
 * Generates 3 plausible-but-wrong answers for a × b = answer, based on
 * common multiplication mistakes: off-by-one-multiple errors, adjacent
 * table errors, and simple miscounts. Always returns distinct positive
 * values that differ from the correct answer.
 */
export function generateDistractors(
  a: number,
  b: number,
  answer: number,
  rng: RngFn = defaultRng,
): number[] {
  const candidates = new Set<number>();

  const add = (value: number) => {
    if (value > 0 && value !== answer) candidates.add(value);
  };

  add(a * (b + 1));
  add(a * (b - 1));
  add((a + 1) * b);
  add((a - 1) * b);
  add(answer + a);
  add(answer - a);
  add(answer + b);
  add(answer - b);
  add(answer + 10);
  add(answer - 10);
  add(answer + 1);
  add(answer - 1);

  let pool = shuffle(Array.from(candidates), rng);

  // Pad with small random offsets if we somehow don't have enough unique
  // candidates (e.g. very small facts like 1×1).
  let guard = 0;
  while (pool.length < 3 && guard < 50) {
    const offset = Math.floor(rng() * 9) + 1;
    const sign = rng() > 0.5 ? 1 : -1;
    add(answer + sign * offset);
    pool = shuffle(Array.from(candidates), rng);
    guard++;
  }

  return pool.slice(0, 3);
}

/** Builds a shuffled 4-option choice list with the correct answer inserted at a random position. */
export function buildChoices(
  answer: number,
  distractors: number[],
  rng: RngFn = defaultRng,
): number[] {
  return shuffle([answer, ...distractors], rng);
}
