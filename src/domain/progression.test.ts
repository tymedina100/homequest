import { describe, expect, it } from "vitest";
import { getLevelProgress, xpForLevel } from "./progression";

describe("progression", () => {
  it("calculates cumulative level thresholds", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(120);
    expect(xpForLevel(3)).toBe(280);
  });

  it("reports progress within the current level", () => {
    expect(getLevelProgress(275)).toMatchObject({ level: 2, xpIntoLevel: 155, xpNeeded: 160, percent: 97 });
    expect(getLevelProgress(280)).toMatchObject({ level: 3, xpIntoLevel: 0, xpNeeded: 200, percent: 0 });
  });
});
