import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { ACHIEVEMENTS, evaluateAchievements, meetsAchievement } from "./achievements";

describe("achievement engine", () => {
  it("unlocks the correct achievement, leaves incorrect and hidden criteria locked", () => {
    const state = createSeedState(); state.achievements = []; state.progression.categoryStats.cooking.completed = 10;
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "kitchen-apprentice")!)).toBe(true);
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "rescue-ranger")!)).toBe(false);
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "hearth-remembers")!)).toBe(false);
  });
  it("grants each reward once and remains idempotent", () => {
    const state = createSeedState(); state.achievements = []; state.progression.categoryStats.cooking.completed = 10;
    const first = evaluateAchievements(state, "2026-08-23T10:00:00.000Z"); const second = evaluateAchievements(first.state, "2026-08-23T10:01:00.000Z");
    expect(first.unlockedIds).toContain("kitchen-apprentice"); expect(first.state.player.coins).toBe(state.player.coins + 40);
    expect(second.unlockedIds).toEqual([]); expect(second.state.player.coins).toBe(first.state.player.coins);
  });
});
