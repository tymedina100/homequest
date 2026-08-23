import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { recommendQuest, scoreQuest } from "./recommendations";

describe("quest recommendations", () => {
  it("returns one useful quest and a human-readable explanation", () => {
    const state = createSeedState();
    const result = recommendQuest(state.household.quests, state.players[state.session.activePlayerId].dailyContext);
    expect(result?.quest.id).toBe("trash");
    expect(result?.reason.length).toBeGreaterThan(20);
  });

  it("does not score completed or dependency-blocked quests", () => {
    const seed = createSeedState(); const quest = seed.household.quests[0]; const context = seed.players[seed.session.activePlayerId].dailyContext;
    expect(scoreQuest({ ...quest, status: "completed" }, context)).toBe(Number.NEGATIVE_INFINITY);
    expect(scoreQuest({ ...quest, dependsOn: ["other"] }, context)).toBe(Number.NEGATIVE_INFINITY);
  });

  it("adapts to very low time and energy", () => {
    const state = createSeedState();
    const result = recommendQuest(state.household.quests, { ...state.players[state.session.activePlayerId].dailyContext, energy: "low", availableMinutes: 6 });
    expect(["dishwasher", "trash"]).toContain(result?.quest.id);
  });

  it("uses daily context to favor manageable work, while rescue urgency can outweigh imperfect fit", () => {
    const state = createSeedState();
    const lowContext = { date: state.players[state.session.activePlayerId].dailyContext.date, energy: "low" as const, availableMinutes: 15 };
    expect(["dishwasher", "trash", "counters"]).toContain(recommendQuest(state.household.quests, lowContext, state.household.homeStats)?.quest.id);

    const larger = { ...state.household.quests.find((quest) => quest.id === "laundry")!, kind: "rescue" as const, title: "Laundry Rescue", urgency: "today" as const, xpReward: 60, estimatedMinutes: 25, missedCount: 4 };
    const highContext = { date: state.players[state.session.activePlayerId].dailyContext.date, energy: "locked-in" as const, availableMinutes: 60 };
    expect(recommendQuest([...state.household.quests.filter((quest) => quest.id !== "laundry"), larger], highContext, state.household.homeStats)?.quest.title).toBe("Laundry Rescue");
  });
});
