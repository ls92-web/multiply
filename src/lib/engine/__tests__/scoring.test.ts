import { describe, expect, it } from "vitest";
import { POINTS, scoreAnswer } from "../scoring";

describe("scoreAnswer", () => {
  it("awards independent-correct points with no streak bonus below 5", () => {
    const result = scoreAnswer({
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
      streakAfterThisAnswer: 3,
    });
    expect(result).toEqual({
      basePoints: POINTS.independentCorrect,
      streakBonus: 0,
      totalPoints: POINTS.independentCorrect,
    });
  });

  it("awards fewer points for multiple-choice correct answers", () => {
    const result = scoreAnswer({
      correct: true,
      independent: false,
      isRetryAfterReveal: false,
      streakAfterThisAnswer: 1,
    });
    expect(result.basePoints).toBe(POINTS.multipleChoiceCorrect);
  });

  it("adds a bonus at a streak of 5", () => {
    const result = scoreAnswer({
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
      streakAfterThisAnswer: 5,
    });
    expect(result.streakBonus).toBe(POINTS.streakBonusFive);
    expect(result.totalPoints).toBe(POINTS.independentCorrect + POINTS.streakBonusFive);
  });

  it("adds the larger bonus at a streak of 10, not both bonuses", () => {
    const result = scoreAnswer({
      correct: true,
      independent: true,
      isRetryAfterReveal: false,
      streakAfterThisAnswer: 10,
    });
    expect(result.streakBonus).toBe(POINTS.streakBonusTen);
  });

  it("awards zero points for incorrect answers", () => {
    const result = scoreAnswer({
      correct: false,
      independent: true,
      isRetryAfterReveal: false,
      streakAfterThisAnswer: 0,
    });
    expect(result.totalPoints).toBe(0);
  });

  it("awards zero points for a retry immediately after the answer was revealed", () => {
    const result = scoreAnswer({
      correct: true,
      independent: true,
      isRetryAfterReveal: true,
      streakAfterThisAnswer: 1,
    });
    expect(result.totalPoints).toBe(0);
  });
});
