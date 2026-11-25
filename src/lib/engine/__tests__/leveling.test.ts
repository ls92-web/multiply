import { describe, expect, it } from "vitest";
import { levelForPoints, levelProgress, pointsToReachLevel } from "../leveling";

describe("leveling", () => {
  it("requires exactly 100 points to reach level 2", () => {
    expect(pointsToReachLevel(2)).toBe(100);
  });

  it("requires increasingly more points for each subsequent level", () => {
    const l2 = pointsToReachLevel(2);
    const l3 = pointsToReachLevel(3);
    const l4 = pointsToReachLevel(4);
    expect(l3 - l2).toBe(150);
    expect(l4 - l3).toBe(200);
    expect(l4).toBeGreaterThan(l3);
  });

  it("levelForPoints is the inverse of pointsToReachLevel at the boundary", () => {
    expect(levelForPoints(0)).toBe(1);
    expect(levelForPoints(99)).toBe(1);
    expect(levelForPoints(100)).toBe(2);
    expect(levelForPoints(249)).toBe(2);
    expect(levelForPoints(250)).toBe(3);
  });

  it("computes a 0..1 progress ratio toward the next level", () => {
    const progress = levelProgress(100);
    expect(progress.level).toBe(2);
    expect(progress.progressRatio).toBe(0);

    const almostThree = levelProgress(249);
    expect(almostThree.level).toBe(2);
    expect(almostThree.progressRatio).toBeCloseTo(149 / 150, 5);
  });
});
