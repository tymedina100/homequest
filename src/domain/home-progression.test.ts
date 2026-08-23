import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { getHomeLevelProgress, homeXpForLevel } from "./home-progression";

describe("permanent Home progression", () => {
  it("uses deterministic early and gradual level boundaries", () => {
    expect(homeXpForLevel(2)).toBe(120);
    expect(homeXpForLevel(3)).toBe(300);
    expect(getHomeLevelProgress(299).level).toBe(2);
    expect(getHomeLevelProgress(300)).toMatchObject({ level: 3, tier: 2, tierName: "Settled In" });
  });
  it("is independent from fluctuating home state", () => {
    const state = createSeedState(); const before = getHomeLevelProgress(state.household.homeProgression);
    state.household.homeStats = { cleanliness: 1, organization: 2, supplies: 3, kitchen: 4 };
    expect(getHomeLevelProgress(state.household.homeProgression)).toEqual(before);
  });
});
