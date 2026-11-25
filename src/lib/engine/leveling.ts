/**
 * Level 2 requires 100 points; each subsequent level requires 50 more
 * points than the previous jump (100, 150, 200, 250, ...), so the curve
 * is gentle early on and gradually steeper.
 */
export function pointsToReachLevel(level: number): number {
  if (level <= 1) return 0;
  const steps = level - 1;
  // Sum of the arithmetic sequence 100, 150, 200, ... for `steps` terms.
  return (steps * (200 + (steps - 1) * 50)) / 2;
}

export function levelForPoints(points: number): number {
  let level = 1;
  while (points >= pointsToReachLevel(level + 1)) {
    level++;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  pointsIntoLevel: number;
  pointsForNextLevel: number;
  progressRatio: number;
}

export function levelProgress(points: number): LevelProgress {
  const level = levelForPoints(points);
  const floor = pointsToReachLevel(level);
  const ceiling = pointsToReachLevel(level + 1);
  const span = ceiling - floor;
  const pointsIntoLevel = points - floor;
  return {
    level,
    pointsIntoLevel,
    pointsForNextLevel: span,
    progressRatio: span === 0 ? 1 : Math.min(1, pointsIntoLevel / span),
  };
}
