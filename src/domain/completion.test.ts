import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { completeQuestTransaction } from "./completion";

describe("atomic completion transaction", () => {
  it("applies progression, history, level and perk unlocks as one result", () => {
    const state = createSeedState(); state.achievements = []; state.homeProgression.totalXp = 290; state.skills.cleaning = { totalXp: 76, completedQuestCount: 1, unlockedPerkIds: [] };
    state.questTemplates = state.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, source: "user" } : template);
    const result = completeQuestTransaction(state, "dishwasher", "2026-08-23T10:00:00.000Z");
    expect(result.applied).toBe(true); expect(result.summary).toMatchObject({ skill: "cleaning", skillLevel: 2, homeLevel: 3 });
    expect(result.summary?.perkIds).toContain("cleaning-quick-hands"); expect(result.summary?.achievementIds).toContain("first-step");
    expect(result.state.lifecycle.questHistory.some((entry) => entry.questId === "dishwasher" && entry.event === "completed")).toBe(true);
    expect(completeQuestTransaction(result.state, "dishwasher", "2026-08-23T10:01:00.000Z").applied).toBe(false);
  });
  it("retains Rescue and Comeback semantics", () => {
    const state = createSeedState(); const rescue = { ...state.quests[0], id: "rescue-test", kind: "rescue" as const, rescueOf: "dishwasher" };
    state.quests = [...state.quests, rescue];
    const result = completeQuestTransaction(state, rescue.id, "2026-08-23T10:00:00.000Z");
    expect(result.state.quests.find((quest) => quest.id === rescue.id)?.status).toBe("completed"); expect(result.summary?.coins).toBeGreaterThan(Math.round(rescue.xpReward / 10));
  });
});
