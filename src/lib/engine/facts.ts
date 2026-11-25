export const DEFAULT_MULTIPLIER_MAX = 10;
export const EXTENDED_MULTIPLIER_MAX = 12;
export const MIN_TABLE = 1;
export const MAX_TABLE = 12;

export function factId(a: number, b: number): string {
  return `${a}x${b}`;
}

export function parseFactId(id: string): { a: number; b: number } {
  const [a, b] = id.split("x").map(Number);
  return { a, b };
}

/** Canonical id treating a fact and its commutative pair as the same underlying fact. */
export function canonicalFactId(a: number, b: number): string {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return factId(lo, hi);
}

export interface FactPool {
  tables: number[];
  multiplierMax: number;
}

/**
 * Builds the list of {a, b} pairs for the selected tables. `a` is always the
 * selected table; `b` ranges 1..multiplierMax. Both orientations (a×b and
 * b×a) are included so a child practices a fact "from both directions".
 */
export function buildFactPairs(pool: FactPool): Array<{ a: number; b: number }> {
  const { tables, multiplierMax } = pool;
  const pairs: Array<{ a: number; b: number }> = [];
  for (const table of tables) {
    for (let b = 1; b <= multiplierMax; b++) {
      pairs.push({ a: table, b });
    }
  }
  return pairs;
}

export function allTables(max: number = MAX_TABLE): number[] {
  return Array.from({ length: max - MIN_TABLE + 1 }, (_, i) => i + MIN_TABLE);
}
