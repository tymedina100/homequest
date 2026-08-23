import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { applyKitchenEffects, calculateKitchenHarmony, getZoneLevelProgress, normalizeKitchenCondition, seedKitchenCondition, zoneXpAtLevel } from "./zones";

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
});
