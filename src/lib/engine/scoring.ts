/**
 * Centralized point values. Tweak here, nowhere else.
 */
export const POINTS = {
  independentCorrect: 10,
  multipleChoiceCorrect: 5,
  fillGapCorrect: 10,
  streakBonusFive: 15,
  streakBonusTen: 30,
  sessionCompleteBonus: 20,
} as const;

export interface ScoreInput {
  correct: boolean;
  independent: boolean;
  isRetryAfterReveal: boolean;
  streakAfterThisAnswer: number;
}

export interface ScoreResult {
  basePoints: number;
  streakBonus: number;
  totalPoints: number;
}

/**
 * Computes points for a single answered question. Retrying immediately
 * after the correct answer was revealed earns zero points — it prevents
 * farming the same question for easy XP while still letting the child
 * practice it again.
 */
export function scoreAnswer(input: ScoreInput): ScoreResult {
  if (!input.correct || input.isRetryAfterReveal) {
    return { basePoints: 0, streakBonus: 0, totalPoints: 0 };
  }

  const basePoints = input.independent
    ? POINTS.independentCorrect
    : POINTS.multipleChoiceCorrect;

  let streakBonus = 0;
  if (input.streakAfterThisAnswer > 0 && input.streakAfterThisAnswer % 10 === 0) {
    streakBonus = POINTS.streakBonusTen;
  } else if (input.streakAfterThisAnswer > 0 && input.streakAfterThisAnswer % 5 === 0) {
    streakBonus = POINTS.streakBonusFive;
  }

  return { basePoints, streakBonus, totalPoints: basePoints + streakBonus };
}

export function sessionCompletionBonus(): number {
  return POINTS.sessionCompleteBonus;
}
