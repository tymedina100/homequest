import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { applyHomeStatEffects, completeQuest } from "./quests";

describe("quest completion", () => {
  it("awards XP, coins, category progress, and home stat effects exactly once", () => {
    const initial = createSeedState();
    const next = completeQuest(initial, "dishwasher", "2026-08-22T10:00:00.000Z");
    expect(next.progression.totalXp).toBe(initial.progression.totalXp + 30);
    expect(next.player.coins).toBe(initial.player.coins + 13); // quest reward + Player Level bonus
    expect(next.homeProgression.totalXp).toBeGreaterThan(initial.homeProgression.totalXp);
    expect(next.skills.cleaning.totalXp).toBeGreaterThan(initial.skills.cleaning.totalXp);
    expect(next.homeStats.kitchen).toBe(65);
    expect(next.homeStats.cleanliness).toBe(67);
    expect(next.quests.find((quest) => quest.id === "dishwasher")).toMatchObject({ status: "completed", lastCompletedAt: "2026-08-22T10:00:00.000Z" });
    expect(completeQuest(next, "dishwasher")).toBe(next);
  });

  it("clamps home stats to a safe zero-to-one-hundred range", () => {
    expect(applyHomeStatEffects({ cleanliness: 98, organization: 2, supplies: 50, kitchen: 50 }, { cleanliness: 10, organization: -10 })).toEqual({ cleanliness: 100, organization: 0, supplies: 50, kitchen: 50 });
  });
});
