import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { applyBathroomEffects, applyKitchenEffects, BATHROOM_TIERS, calculateBathroomHarmony, calculateKitchenHarmony, calculateZoneLevelProgress, calculateZoneQuestXp, decayBathroomCondition, getBathroomLevelProgress, getZoneLevelProgress, KITCHEN_TIERS, normalizeBathroomCondition, normalizeKitchenCondition, seedBathroomCondition, seedKitchenCondition, zoneXpAtLevel } from "./zones";

describe("Kitchen zone model", () => {
  it("initializes a bounded shared Kitchen and calculates Harmony deterministically", () => {
    const state = createSeedState();
    expect(state.household.zones.kitchen).toMatchObject({ id: "kitchen", displayName: "Kitchen", type: "kitchen" });
    expect(calculateKitchenHarmony(state.household.zones.kitchen.condition)).toBe(calculateKitchenHarmony(state.household.zones.kitchen.condition));
    expect(normalizeKitchenCondition({ dishes: -20, counters: 140 })).toMatchObject({ dishes: 0, counters: 100 });
  });

  it("seeds the five sub-states from existing Home condition without inventing separate history", () => {
    expect(seedKitchenCondition({ kitchen: 55, cleanliness: 62, organization: 48, supplies: 76 })).toEqual({ dishes: 57, counters: 56, floor: 58, trash: 56, food: 70 });
  });

  it("uses stable level boundaries and never derives permanent level from condition", () => {
    expect(getZoneLevelProgress(0).level).toBe(1);
    expect(getZoneLevelProgress(zoneXpAtLevel(3) - 1).level).toBe(2);
    expect(getZoneLevelProgress(zoneXpAtLevel(3))).toMatchObject({ level: 3, tier: 2, tierName: "Settled Kitchen" });
    const level = getZoneLevelProgress(900).level;
    applyKitchenEffects(normalizeKitchenCondition({ dishes: 80 }), { dishes: -100 });
    expect(getZoneLevelProgress(900).level).toBe(level);
  });
  it("keeps Bathroom conditions bounded and progression independent from harmony", () => {
    expect(seedBathroomCondition({ kitchen: 55, cleanliness: 62, organization: 48, supplies: 76 })).toEqual({ sink: 58, toilet: 59, shower: 58, floor: 58, supplies: 68 });
    expect(normalizeBathroomCondition({ sink: -10, toilet: 120 })).toMatchObject({ sink: 0, toilet: 100 });
    const xpLevel = getBathroomLevelProgress(900).level;
    expect(calculateBathroomHarmony(applyBathroomEffects(normalizeBathroomCondition({ sink: 80 }), { sink: -100 }))).toBeLessThan(100);
    expect(getBathroomLevelProgress(900).level).toBe(xpLevel);
  });
  it("shares progression and quest XP primitives without sharing room-specific tiers", () => {
    const state = createSeedState();
    expect(calculateZoneLevelProgress(zoneXpAtLevel(3), KITCHEN_TIERS)).toMatchObject({ level: 3, tierName: "Settled Kitchen" });
    expect(calculateZoneLevelProgress(zoneXpAtLevel(3), BATHROOM_TIERS)).toMatchObject({ level: 3, tierName: "Steady Sanctuary" });
    expect(calculateZoneQuestXp(state.household.quests.find((quest) => quest.id === "dishwasher")!, "kitchen")).toBe(8);
    expect(calculateZoneQuestXp(state.household.quests.find((quest) => quest.id === "dishwasher")!, "bathroom")).toBe(0);
  });
  it("ages Bathroom cleanliness while leaving inventory-like supplies stable", () => {
    const condition = { sink: 70, toilet: 70, shower: 70, floor: 70, supplies: 70 };
    expect(decayBathroomCondition(condition, 3)).toEqual({ sink: 67, toilet: 64, shower: 68, floor: 68, supplies: 70 });
  });
});
