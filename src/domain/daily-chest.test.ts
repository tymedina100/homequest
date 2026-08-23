import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { claimDailyChest, initializeDailyChest, recordDailyChestQuest } from "./daily-chest";

describe("non-punitive Daily Chest", () => {
  it("requires two distinct meaningful quests", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    const one = recordDailyChestQuest(state, state.quests[0], "2026-08-23").state; expect(one.dailyChest.status).toBe("locked");
    const two = recordDailyChestQuest(one, state.quests[1], "2026-08-23").state; expect(two.dailyChest.status).toBe("ready");
  });
  it("claims once, survives refresh state, and resets without penalty next day", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10)); state.dailyChest = { date: "2026-08-23", qualifyingQuestIds: ["dishwasher", "dinner"], status: "ready" };
    const first = claimDailyChest(state, "2026-08-23T18:00:00.000Z"); const again = claimDailyChest(first.state, "2026-08-23T19:00:00.000Z");
    expect(first.claimed).toBe(true); expect(again.claimed).toBe(false); expect(again.state.player.coins).toBe(first.state.player.coins);
    expect(initializeDailyChest(first.state, "2026-08-24").dailyChest).toEqual({ date: "2026-08-24", qualifyingQuestIds: [], status: "locked" });
  });
});
