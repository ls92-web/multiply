/**
 * Small deterministic PRNG (mulberry32) so question generation can be
 * unit-tested with a fixed seed. Falls back to Math.random-backed RNG
 * for normal gameplay.
 */
export type RngFn = () => number;

export function mulberry32(seed: number): RngFn {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRng: RngFn = Math.random;

export function pickRandom<T>(arr: T[], rng: RngFn = defaultRng): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffle<T>(arr: T[], rng: RngFn = defaultRng): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
