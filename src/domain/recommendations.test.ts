import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { recommendQuest, scoreQuest, selectHomeQuestPreview } from "./recommendations";

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

  it("chooses legitimate urgency in a realistic low-energy, 15-minute situation", () => {
    const state = createSeedState();
    const byId = (id: string) => state.household.quests.find((quest) => quest.id === id)!;
    const bathroomDeepClean = { ...byId("bathroom-reset"), title: "Bathroom deep clean", estimatedMinutes: 40, effort: "high" as const, urgency: "gentle" as const };
    const result = recommendQuest([byId("dishwasher"), bathroomDeepClean, byId("counters"), byId("trash")], { energy: "low", availableMinutes: 15 }, state.household.homeStats, { kitchenCondition: state.household.zones.kitchen.condition, bathroomCondition: state.household.zones.bathroom.condition });
    expect(result?.quest.id).toBe("trash");
    expect(result?.reason).toMatch(/attention today/i);
  });

  it("favors a substantial Kitchen Rescue when capacity and room pressure support it", () => {
    const state = createSeedState(); const dishwasher = state.household.quests.find((quest) => quest.id === "dishwasher")!;
    const rescue = { ...dishwasher, id: "kitchen-rescue", title: "Kitchen Rescue", kind: "rescue" as const, urgency: "today" as const, effort: "medium" as const, estimatedMinutes: 20, xpReward: 50, missedCount: 3, zoneEffects: { dishes: 24, counters: 18 } };
    const result = recommendQuest([rescue, state.household.quests.find((quest) => quest.id === "trash")!], { energy: "locked-in", availableMinutes: 60 }, state.household.homeStats, { kitchenCondition: { dishes: 18, counters: 26, floor: 60, trash: 65, food: 52 } });
    expect(result?.quest.id).toBe("kitchen-rescue");
    expect(result?.reason).toMatch(/focused Rescue.*Dishes.*Kitchen Harmony/i);
  });

  it("lets a critical Bathroom need outrank a less important easy task", () => {
    const state = createSeedState();
    const bathroom = state.household.quests.find((quest) => quest.id === "bathroom-reset")!;
    const easy = { ...state.household.quests.find((quest) => quest.id === "counters")!, urgency: "gentle" as const, recommendation: { momentum: 0 } };
    const result = recommendQuest([easy, bathroom], { energy: "low", availableMinutes: 15 }, state.household.homeStats, { kitchenCondition: { dishes: 75, counters: 75, floor: 75, trash: 75, food: 75 }, bathroomCondition: { sink: 55, toilet: 12, shower: 60, floor: 62, supplies: 70 } });
    expect(result?.quest.id).toBe("bathroom-reset");
    expect(result?.reason).toMatch(/toilet.*Bathroom Harmony/i);
  });

  it("gives a Comeback strong but scored priority and keeps Home's re-entry list bounded", () => {
    const state = createSeedState(); const source = state.household.quests.find((quest) => quest.id === "laundry")!;
    const comeback = { ...source, id: "comeback:test", title: "Reset one space", kind: "comeback" as const, effort: "low" as const, estimatedMinutes: 15, urgency: "soon" as const, xpReward: 40, recommendation: { momentum: 12 } };
    const rescue = { ...state.household.quests[0], id: "rescue:test", kind: "rescue" as const, title: "Kitchen Rescue", missedCount: 3 };
    const quests = [rescue, comeback, state.household.quests.find((quest) => quest.id === "counters")!, state.household.quests.find((quest) => quest.id === "trash")!];
    const result = recommendQuest(quests, { energy: "low", availableMinutes: 15 }, state.household.homeStats);
    expect(result?.quest.id).toBe("comeback:test");
    expect(result?.reason).toMatch(/gentle comeback.*15 minutes.*low energy/i);
    expect(selectHomeQuestPreview(quests, result?.quest.id).filter((quest) => quest.kind === "comeback" || quest.kind === "rescue")).toHaveLength(1);
  });
});
