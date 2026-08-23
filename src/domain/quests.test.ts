import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { applyHomeStatEffects, completeQuest } from "./quests";
import { TYLER_PLAYER_ID } from "./players";

describe("quest completion", () => {
  it("awards XP, coins, category progress, and home stat effects exactly once", () => {
    const initial = createSeedState();
    const next = completeQuest(initial, "dishwasher", TYLER_PLAYER_ID, "2026-08-22T10:00:00.000Z");
    expect(next.players[TYLER_PLAYER_ID].progression.totalXp).toBe(initial.players[TYLER_PLAYER_ID].progression.totalXp + 30);
    expect(next.players[TYLER_PLAYER_ID].coins).toBe(initial.players[TYLER_PLAYER_ID].coins + 13); // quest reward + Player Level bonus
    expect(next.household.homeProgression.totalXp).toBeGreaterThan(initial.household.homeProgression.totalXp);
    expect(next.players[TYLER_PLAYER_ID].skills.cleaning.totalXp).toBeGreaterThan(initial.players[TYLER_PLAYER_ID].skills.cleaning.totalXp);
    expect(next.household.homeStats.kitchen).toBe(65);
    expect(next.household.homeStats.cleanliness).toBe(67);
    expect(next.household.quests.find((quest) => quest.id === "dishwasher")).toMatchObject({ status: "completed", completedByPlayerId: TYLER_PLAYER_ID, lastCompletedAt: "2026-08-22T10:00:00.000Z" });
    expect(completeQuest(next, "dishwasher", TYLER_PLAYER_ID)).toBe(next);
  });

  it("clamps home stats to a safe zero-to-one-hundred range", () => {
    expect(applyHomeStatEffects({ cleanliness: 98, organization: 2, supplies: 50, kitchen: 50 }, { cleanliness: 10, organization: -10 })).toEqual({ cleanliness: 100, organization: 0, supplies: 50, kitchen: 50 });
  });
});
