import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { ACHIEVEMENTS, evaluateAchievements, meetsAchievement } from "./achievements";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "./players";

describe("achievement engine", () => {
  it("unlocks the correct achievement, leaves incorrect and hidden criteria locked", () => {
    const state = createSeedState(); state.players[TYLER_PLAYER_ID].achievements = []; state.players[TYLER_PLAYER_ID].progression.categoryStats.cooking.completed = 10;
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "kitchen-apprentice")!, TYLER_PLAYER_ID)).toBe(true);
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "rescue-ranger")!, TYLER_PLAYER_ID)).toBe(false);
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "hearth-remembers")!, TYLER_PLAYER_ID)).toBe(false);
    expect(meetsAchievement(state, ACHIEVEMENTS.find((item) => item.id === "kitchen-apprentice")!, RACHEL_PLAYER_ID)).toBe(false);
  });
  it("grants each reward once and remains idempotent", () => {
    const state = createSeedState(); state.players[TYLER_PLAYER_ID].achievements = []; state.players[TYLER_PLAYER_ID].progression.categoryStats.cooking.completed = 10;
    const first = evaluateAchievements(state, TYLER_PLAYER_ID, "2026-08-23T10:00:00.000Z"); const second = evaluateAchievements(first.state, TYLER_PLAYER_ID, "2026-08-23T10:01:00.000Z");
    expect(first.unlockedIds).toContain("kitchen-apprentice"); expect(first.state.players[TYLER_PLAYER_ID].coins).toBe(state.players[TYLER_PLAYER_ID].coins + 40);
    expect(second.unlockedIds).toEqual([]); expect(second.state.players[TYLER_PLAYER_ID].coins).toBe(first.state.players[TYLER_PLAYER_ID].coins);
  });
});
