import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { completeQuestTransaction } from "./completion";
import { RACHEL_PLAYER_ID, TYLER_PLAYER_ID } from "./players";

describe("atomic completion transaction", () => {
  it("applies progression, history, level and perk unlocks as one result", () => {
    const state = createSeedState(); state.players[TYLER_PLAYER_ID].achievements = []; state.household.homeProgression.totalXp = 290; state.players[TYLER_PLAYER_ID].skills.cleaning = { totalXp: 76, completedQuestCount: 1, unlockedPerkIds: [] };
    state.household.questTemplates = state.household.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, source: "user" } : template);
    const result = completeQuestTransaction(state, "dishwasher", TYLER_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.applied).toBe(true); expect(result.summary).toMatchObject({ skill: "cleaning", skillLevel: 2, homeLevel: 3 });
    expect(result.summary?.perkIds).toContain("cleaning-quick-hands"); expect(result.summary?.achievementIds).toContain("first-step");
    expect(result.state.household.lifecycle.questHistory.some((entry) => entry.questId === "dishwasher" && entry.event === "completed" && entry.playerId === TYLER_PLAYER_ID)).toBe(true);
    expect(completeQuestTransaction(result.state, "dishwasher", TYLER_PLAYER_ID, "2026-08-23T10:01:00.000Z").applied).toBe(false);
  });
  it("retains Rescue and Comeback semantics", () => {
    const state = createSeedState(); const rescue = { ...state.household.quests[0], id: "rescue-test", kind: "rescue" as const, rescueOf: "dishwasher" };
    state.household.quests = [...state.household.quests, rescue];
    const result = completeQuestTransaction(state, rescue.id, RACHEL_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.state.household.quests.find((quest) => quest.id === rescue.id)?.status).toBe("completed"); expect(result.summary?.coins).toBeGreaterThan(Math.round(rescue.xpReward / 10));
    expect(result.state.players[TYLER_PLAYER_ID].progression).toEqual(state.players[TYLER_PLAYER_ID].progression);
  });
  it("applies shared Kitchen condition and XP once while isolating personal rewards", () => {
    const state = createSeedState(); const before = structuredClone(state);
    const result = completeQuestTransaction(state, "dishwasher", RACHEL_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.summary).toMatchObject({ playerName: "Rachel", kitchenXp: 8, kitchenEffects: { dishes: 20 } });
    expect(result.state.household.zones.kitchen.condition.dishes).toBeGreaterThan(before.household.zones.kitchen.condition.dishes);
    expect(result.state.household.zones.kitchen.totalXp).toBe(before.household.zones.kitchen.totalXp + 8);
    expect(result.state.players[RACHEL_PLAYER_ID].progression.totalXp).toBeGreaterThan(before.players[RACHEL_PLAYER_ID].progression.totalXp);
    expect(result.state.players[TYLER_PLAYER_ID].progression).toEqual(before.players[TYLER_PLAYER_ID].progression);
    expect(completeQuestTransaction(result.state, "dishwasher", RACHEL_PLAYER_ID, "2026-08-23T10:01:00.000Z").state.household.zones.kitchen.totalXp).toBe(result.state.household.zones.kitchen.totalXp);
  });
  it("does not award Kitchen XP for household/general quests", () => {
    const state = createSeedState(); const result = completeQuestTransaction(state, "laundry", TYLER_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.summary?.kitchenXp).toBe(0);
    expect(result.state.household.zones.kitchen).toEqual(state.household.zones.kitchen);
  });
  it("applies shared Bathroom condition and XP once while keeping rewards personal", () => {
    const state = createSeedState(); const before = structuredClone(state);
    const result = completeQuestTransaction(state, "bathroom-reset", RACHEL_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.summary).toMatchObject({ playerName: "Rachel", bathroomXp: 15, bathroomEffects: { toilet: 16 } });
    expect(result.state.household.zones.bathroom.condition.toilet).toBeGreaterThan(before.household.zones.bathroom.condition.toilet);
    expect(result.state.household.zones.bathroom.totalXp).toBe(before.household.zones.bathroom.totalXp + 15);
    expect(result.state.players[TYLER_PLAYER_ID].progression).toEqual(before.players[TYLER_PLAYER_ID].progression);
  });
  it("supports Quick Complete through the full canonical transaction", () => {
    const state = createSeedState(); const before = structuredClone(state);
    state.players[TYLER_PLAYER_ID].dailyChest.qualifyingQuestIds = ["dinner"];
    const result = completeQuestTransaction(state, "dishwasher", TYLER_PLAYER_ID, "2026-08-23T10:00:00.000Z");
    expect(result.applied).toBe(true);
    expect(result.state.players[TYLER_PLAYER_ID].progression.totalXp).toBe(before.players[TYLER_PLAYER_ID].progression.totalXp + state.household.quests[0].xpReward);
    expect(result.state.players[RACHEL_PLAYER_ID].progression).toEqual(before.players[RACHEL_PLAYER_ID].progression);
    expect(result.state.household.homeProgression.totalXp).toBeGreaterThan(before.household.homeProgression.totalXp);
    expect(result.state.household.zones.kitchen.totalXp).toBeGreaterThan(before.household.zones.kitchen.totalXp);
    expect(result.state.household.lifecycle.questHistory).toContainEqual(expect.objectContaining({ questId: "dishwasher", event: "completed", playerId: TYLER_PLAYER_ID }));
    expect(result.state.players[TYLER_PLAYER_ID].dailyChest.status).toBe("ready");
    expect(completeQuestTransaction(result.state, "dishwasher", TYLER_PLAYER_ID, "2026-08-23T10:01:00.000Z").applied).toBe(false);
  });
});
