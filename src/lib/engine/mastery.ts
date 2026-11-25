import { FactMastery, MasteryState } from "../types";

export interface RecordAttemptInput {
  canonicalFactId: string;
  sessionId: string;
  correct: boolean;
  independent: boolean;
  isRetryAfterReveal: boolean;
}

const MASTERED_STREAK = 3;
const MASTERED_MIN_SESSIONS = 2;
const DEVELOPING_STREAK = 2;

export function emptyMastery(canonicalFactId: string): FactMastery {
  return {
    factId: canonicalFactId,
    attempts: 0,
    correct: 0,
    independentCorrect: 0,
    independentCorrectStreak: 0,
    sessionsSeenCorrectIn: [],
    lastOutcomeCorrect: null,
    mastery: "new",
    needsPractice: false,
    updatedAt: new Date(0).toISOString(),
  };
}

function nextMasteryState(current: FactMastery): MasteryState {
  const sessionCount = current.sessionsSeenCorrectIn.length;
  if (
    current.independentCorrectStreak >= MASTERED_STREAK &&
    sessionCount >= MASTERED_MIN_SESSIONS
  ) {
    return "mastered";
  }
  if (current.independentCorrectStreak >= DEVELOPING_STREAK) {
    return "developing";
  }
  if (current.attempts > 0) {
    return "learning";
  }
  return "new";
}

/**
 * Updates a fact's mastery record from a single attempt. A correct answer
 * only counts toward mastery when it was typed independently (not a
 * multiple-choice pick) and not an immediate retry after the answer was
 * revealed. Mastery requires repeated independent recall across at least
 * two separate practice sessions, not just one lucky streak.
 */
export function recordAttempt(
  prior: FactMastery | undefined,
  input: RecordAttemptInput,
  now: string = new Date().toISOString(),
): FactMastery {
  const current = prior ? { ...prior } : emptyMastery(input.canonicalFactId);
  current.attempts += 1;
  current.updatedAt = now;

  const countsTowardMastery = input.correct && input.independent && !input.isRetryAfterReveal;

  if (input.correct) {
    current.correct += 1;
  }

  if (countsTowardMastery) {
    current.independentCorrect += 1;
    current.independentCorrectStreak += 1;
    current.needsPractice = false;
    current.lastOutcomeCorrect = true;
    if (!current.sessionsSeenCorrectIn.includes(input.sessionId)) {
      current.sessionsSeenCorrectIn = [...current.sessionsSeenCorrectIn, input.sessionId];
    }
    current.mastery = nextMasteryState(current);
  } else if (input.correct) {
    // Correct via multiple choice or an immediate retry: encouraging, but
    // doesn't move the independent-recall streak forward or mastery state.
    current.lastOutcomeCorrect = true;
    if (current.mastery === "new") current.mastery = "learning";
  } else {
    current.independentCorrectStreak = 0;
    current.needsPractice = true;
    current.lastOutcomeCorrect = false;
    current.mastery =
      current.mastery === "mastered"
        ? "developing"
        : current.mastery === "developing"
          ? "learning"
          : "learning";
  }

  return current;
}

export function isDueForPractice(mastery: FactMastery | undefined): boolean {
  if (!mastery) return true;
  return mastery.needsPractice || mastery.mastery !== "mastered";
}
