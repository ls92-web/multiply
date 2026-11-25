import { describe, expect, it } from "vitest";
import { emptyMastery, recordAttempt } from "../mastery";

describe("recordAttempt", () => {
  it("starts a fact as new", () => {
    expect(emptyMastery("6x7").mastery).toBe("new");
  });

  it("does not reach mastered from a single session no matter the streak", () => {
    let m = undefined;
    for (let i = 0; i < 5; i++) {
      m = recordAttempt(m, {
        canonicalFactId: "6x7",
        sessionId: "session-1",
        correct: true,
        independent: true,
        isRetryAfterReveal: false,
      });
    }
    expect(m!.independentCorrectStreak).toBe(5);
    expect(m!.mastery).not.toBe("mastered");
  });

  it("reaches mastered only after independent correct streak across 2+ sessions", () => {
    let m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.mastery).toBe("developing");

    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "session-2",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.mastery).toBe("mastered");
  });

  it("does not count multiple-choice correct answers toward the independent streak", () => {
    const m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: true,
      independent: false,
      isRetryAfterReveal: false,
    });
    expect(m.independentCorrectStreak).toBe(0);
    expect(m.correct).toBe(1);
  });

  it("does not count an immediate retry after reveal toward the independent streak", () => {
    const m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: true,
      independent: true,
      isRetryAfterReveal: true,
    });
    expect(m.independentCorrectStreak).toBe(0);
  });

  it("flags a fact as needing practice after a wrong answer and resets the streak", () => {
    let m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "session-1",
      correct: false,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.needsPractice).toBe(true);
    expect(m.independentCorrectStreak).toBe(0);
  });

  it("regresses a mastered fact to developing (not all the way to new) on a wrong answer", () => {
    let m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "s1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "s1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "s2",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.mastery).toBe("mastered");

    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "s3",
      correct: false,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.mastery).toBe("developing");
  });

  it("never deletes previously earned independent-correct history on a miss", () => {
    let m = recordAttempt(undefined, {
      canonicalFactId: "6x7",
      sessionId: "s1",
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
    });
    const correctBefore = m.independentCorrect;
    m = recordAttempt(m, {
      canonicalFactId: "6x7",
      sessionId: "s1",
      correct: false,
      independent: true,
      isRetryAfterReveal: false,
    });
    expect(m.independentCorrect).toBe(correctBefore);
  });
});
