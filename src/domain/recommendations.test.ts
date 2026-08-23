import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { recommendQuest, scoreQuest } from "./recommendations";

describe("quest recommendations", () => {
  it("returns one useful quest and a human-readable explanation", () => {
    const state = createSeedState();
    const result = recommendQuest(state.quests, state.preferences);
    expect(result?.quest.id).toBe("trash");
    expect(result?.reason.length).toBeGreaterThan(20);
  });

  it("does not score completed or dependency-blocked quests", () => {
    const quest = createSeedState().quests[0];
    expect(scoreQuest({ ...quest, status: "completed" }, createSeedState().preferences)).toBe(Number.NEGATIVE_INFINITY);
    expect(scoreQuest({ ...quest, dependsOn: ["other"] }, createSeedState().preferences)).toBe(Number.NEGATIVE_INFINITY);
  });

  it("adapts to very low time and energy", () => {
    const state = createSeedState();
    const result = recommendQuest(state.quests, { ...state.preferences, energy: "low", availableMinutes: 6 });
    expect(["dishwasher", "trash"]).toContain(result?.quest.id);
  });

  it("uses daily context to favor manageable work, while rescue urgency can outweigh imperfect fit", () => {
    const state = createSeedState();
    const lowContext = { date: state.dailyContext.date, energy: "low" as const, availableMinutes: 15 };
    expect(["dishwasher", "trash", "counters"]).toContain(recommendQuest(state.quests, lowContext, state.homeStats)?.quest.id);

    const larger = { ...state.quests.find((quest) => quest.id === "laundry")!, kind: "rescue" as const, title: "Laundry Rescue", urgency: "today" as const, xpReward: 60, estimatedMinutes: 25, missedCount: 4 };
    const highContext = { date: state.dailyContext.date, energy: "locked-in" as const, availableMinutes: 60 };
    expect(recommendQuest([...state.quests.filter((quest) => quest.id !== "laundry"), larger], highContext, state.homeStats)?.quest.title).toBe("Laundry Rescue");
  });
});
