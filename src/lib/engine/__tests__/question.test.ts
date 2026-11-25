import { describe, expect, it } from "vitest";
import { buildFactPairs } from "../facts";
import { generateQuestion, selectNextFact, expectedInputAnswer } from "../question";
import { mulberry32 } from "../rng";
import { FactMastery } from "../../types";

describe("buildFactPairs", () => {
  it("generates a×b for every selected table and multiplier", () => {
    const pairs = buildFactPairs({ tables: [3, 7], multiplierMax: 10 });
    expect(pairs).toHaveLength(20);
    expect(pairs).toContainEqual({ a: 3, b: 1 });
    expect(pairs).toContainEqual({ a: 7, b: 10 });
  });
});

describe("generateQuestion", () => {
  it("computes the correct product for recall questions", () => {
    const q = generateQuestion("recall", { a: 6, b: 7 }, mulberry32(1));
    expect(q.answer).toBe(42);
    expect(q.factId).toBe("6x7");
  });

  it("builds 4 unique choices including the correct answer for pickit", () => {
    const q = generateQuestion("pickit", { a: 6, b: 7 }, mulberry32(42));
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices)).toHaveLength(4);
    expect(q.choices).toContain(42);
  });

  it("never includes the answer twice among pickit choices across many seeds", () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = generateQuestion("pickit", { a: 8, b: 9 }, mulberry32(seed));
      const occurrences = q.choices!.filter((c) => c === q.answer).length;
      expect(occurrences).toBe(1);
    }
  });

  it("produces a missing-number question whose hidden slot resolves correctly", () => {
    const q = generateQuestion("fillgap", { a: 9, b: 4 }, mulberry32(3));
    expect(["a", "b", "product"]).toContain(q.missing);
    const expected = expectedInputAnswer(q);
    if (q.missing === "a") expect(expected).toBe(9);
    if (q.missing === "b") expect(expected).toBe(4);
    if (q.missing === "product") expect(expected).toBe(36);
  });
});

describe("selectNextFact", () => {
  const pairs = [
    { a: 6, b: 7 },
    { a: 6, b: 8 },
    { a: 6, b: 9 },
  ];

  it("heavily favors facts flagged as needing practice", () => {
    const mastery: Record<string, FactMastery> = {
      "6x7": {
        factId: "6x7",
        attempts: 5,
        correct: 1,
        independentCorrect: 0,
        independentCorrectStreak: 0,
        sessionsSeenCorrectIn: [],
        lastOutcomeCorrect: false,
        mastery: "learning",
        needsPractice: true,
        updatedAt: new Date().toISOString(),
      },
      "6x8": {
        factId: "6x8",
        attempts: 10,
        correct: 10,
        independentCorrect: 5,
        independentCorrectStreak: 5,
        sessionsSeenCorrectIn: ["s1", "s2"],
        lastOutcomeCorrect: true,
        mastery: "mastered",
        needsPractice: false,
        updatedAt: new Date().toISOString(),
      },
    };

    const counts: Record<string, number> = { "6x7": 0, "6x8": 0, "6x9": 0 };
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const pick = selectNextFact(pairs, mastery, [], rng);
      counts[`${pick.a}x${pick.b}`]++;
    }

    expect(counts["6x7"]).toBeGreaterThan(counts["6x8"]);
  });

  it("strongly avoids repeating a fact seen in the last few questions", () => {
    const rng = mulberry32(11);
    const recent = ["6x7", "6x8"];
    const counts: Record<string, number> = { "6x7": 0, "6x8": 0, "6x9": 0 };
    for (let i = 0; i < 500; i++) {
      const pick = selectNextFact(pairs, {}, recent, rng);
      counts[`${pick.a}x${pick.b}`]++;
    }
    expect(counts["6x9"]).toBeGreaterThan(counts["6x7"] + counts["6x8"]);
  });
});
