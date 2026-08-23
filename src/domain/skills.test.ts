import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { calculateSkillXp, categoryToSkill, getSkillLevelProgress, perksForLevel, skillXpForLevel } from "./skills";

describe("skill progression", () => {
  it("maps categories and respects level boundaries", () => {
    expect(categoryToSkill("organization")).toBe("organization");
    expect(skillXpForLevel(2)).toBe(80);
    expect(getSkillLevelProgress(79).level).toBe(1);
    expect(getSkillLevelProgress(80).level).toBe(2);
  });
  it("awards bounded proportional XP and unlocks perks deterministically", () => {
    const state = createSeedState(); const tiny = { ...state.quests[0], xpReward: 10, estimatedMinutes: 1 };
    expect(calculateSkillXp(state, tiny, "2026-08-23T10:00:00.000Z")).toBeLessThan(calculateSkillXp(state, state.quests[1], "2026-08-23T10:00:00.000Z"));
    expect(perksForLevel("cleaning", 2)).toEqual(["cleaning-quick-hands"]);
    expect(new Set(perksForLevel("cleaning", 6)).size).toBe(3);
  });
});
