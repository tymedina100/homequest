import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { inferQuestZone, withZoneMetadata } from "./zone-mapping";

describe("structured quest zone mapping", () => {
  it("maps stable Kitchen templates and cooking while leaving general work alone", () => {
    expect(inferQuestZone({ id: "dishwasher", category: "cleaning" })).toBe("kitchen");
    expect(inferQuestZone({ id: "custom-soup", category: "cooking" })).toBe("kitchen");
    expect(inferQuestZone({ id: "vacuum", category: "cleaning" })).toBe("household");
  });

  it("preserves explicit author choices instead of inspecting titles", () => {
    const mapped = withZoneMetadata({ ...createSeedState().household.questTemplates[0], id: "not-about-dishes", title: "Run dishwasher", zoneId: "household" as const });
    expect(mapped.zoneId).toBe("household");
    expect(mapped.zoneEffects).toBeUndefined();
  });
});
