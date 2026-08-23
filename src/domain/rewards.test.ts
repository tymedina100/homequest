import { describe, expect, it } from "vitest";
import { recommendQuestXp } from "./rewards";

describe("quest XP recommendations", () => {
  it("increases sensibly with time and effort while staying bounded", () => {
    const small = recommendQuestXp({ estimatedMinutes: 2, effort: "low", urgency: "gentle", recurrence: { cadence: "manual" } });
    const medium = recommendQuestXp({ estimatedMinutes: 15, effort: "medium", urgency: "soon", recurrence: { cadence: "weekly", daysOfWeek: [0] } });
    const large = recommendQuestXp({ estimatedMinutes: 45, effort: "high", urgency: "today", recurrence: { cadence: "manual" } });
    expect(small).toBeLessThan(medium);
    expect(medium).toBeLessThan(large);
    expect(large).toBeLessThanOrEqual(90);
  });
});
