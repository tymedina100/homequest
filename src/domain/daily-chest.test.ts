import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { claimDailyChest, initializeDailyChest, recordDailyChestQuest } from "./daily-chest";
import { TYLER_PLAYER_ID } from "./players";

describe("non-punitive Daily Chest", () => {
  it("requires two distinct meaningful quests", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const one = recordDailyChestQuest(state, TYLER_PLAYER_ID, state.household.quests[0], "2026-08-23").state; expect(one.players[TYLER_PLAYER_ID].dailyChest.status).toBe("locked");
    const two = recordDailyChestQuest(one, TYLER_PLAYER_ID, state.household.quests[1], "2026-08-23").state; expect(two.players[TYLER_PLAYER_ID].dailyChest.status).toBe("ready");
  });
  it("claims once, survives refresh state, and resets without penalty next day", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10)); state.players[TYLER_PLAYER_ID].dailyChest = { date: "2026-08-23", qualifyingQuestIds: ["dishwasher", "dinner"], status: "ready" };
    const first = claimDailyChest(state, TYLER_PLAYER_ID, "2026-08-23T18:00:00.000Z"); const again = claimDailyChest(first.state, TYLER_PLAYER_ID, "2026-08-23T19:00:00.000Z");
    expect(first.claimed).toBe(true); expect(again.claimed).toBe(false); expect(again.state.players[TYLER_PLAYER_ID].coins).toBe(first.state.players[TYLER_PLAYER_ID].coins);
    expect(initializeDailyChest(first.state, TYLER_PLAYER_ID, "2026-08-24").players[TYLER_PLAYER_ID].dailyChest).toEqual({ date: "2026-08-24", qualifyingQuestIds: [], status: "locked" });
  });
});
