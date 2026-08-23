import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { completeQuest } from "./quests";
import { initializeDailyLifecycle } from "./lifecycle";
import type { Quest } from "./types";

const localDate = (year: number, month: number, day: number) => new Date(year, month - 1, day, 10);
const isoAt = (year: number, month: number, day: number) => new Date(year, month - 1, day, 10).toISOString();

describe("daily quest lifecycle", () => {
  it("is idempotent when initialized repeatedly on the same day", () => {
    const state = createSeedState(localDate(2026, 8, 22));
    expect(initializeDailyLifecycle(state, localDate(2026, 8, 22))).toBe(state);
  });

  it("creates the next daily occurrence only after the current one is completed", () => {
    const initial = createSeedState(localDate(2026, 12, 31));
    const completed = completeQuest(initial, "dishwasher", isoAt(2026, 12, 31));
    const next = initializeDailyLifecycle(completed, localDate(2027, 1, 1));

    expect(next.quests.filter((quest) => quest.templateId === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(next.quests.find((quest) => quest.id === "dishwasher:2027-01-01")).toMatchObject({ status: "available", occurrenceDate: "2027-01-01" });
    expect(next.lifecycle.dailyHistory.find((entry) => entry.date === "2026-12-31")?.completedQuestIds).toContain("dishwasher");
  });

  it("ages missed daily cycles across several skipped days without producing a backlog", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    initial.questTemplates = initial.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, escalation: "gentle" } : template);
    const next = initializeDailyLifecycle(initial, localDate(2026, 8, 4));
    const dishwasher = next.quests.find((quest) => quest.id === "dishwasher:2026-08-04");

    expect(dishwasher).toMatchObject({ status: "available", missedCount: 3 });
    expect(next.quests.filter((quest) => quest.templateId === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(next.progression.totalXp).toBe(initial.progression.totalXp);
  });

  it("supports selected-weekday and weekly recurrence", () => {
    const weekdayState = createSeedState(localDate(2026, 8, 3)); // Monday
    const tuesday = initializeDailyLifecycle(weekdayState, localDate(2026, 8, 4));
    expect(tuesday.quests.find((quest) => quest.id === "trash:2026-08-04")?.status).toBe("available");

    const weeklyInitial = createSeedState(localDate(2026, 8, 1)); // Saturday
    const weeklyCompleted = completeQuest(weeklyInitial, "laundry", isoAt(2026, 8, 1));
    const weeklyNext = initializeDailyLifecycle(weeklyCompleted, localDate(2026, 8, 8));
    expect(weeklyNext.quests.find((quest) => quest.id === "laundry:2026-08-08")?.status).toBe("available");
  });

  it("supports every-N-days recurrence", () => {
    const state = createSeedState(localDate(2026, 8, 1));
    const intervalQuest: Quest = { ...state.quests[0], id: "plant-water", templateId: "plant-water", title: "Water the plants", recurrence: { cadence: "interval", interval: 2 }, escalation: "non-escalating", occurrenceDate: "2026-08-01", createdAt: isoAt(2026, 8, 1) };
    state.quests = [...state.quests, intervalQuest];
    state.questTemplates = [...state.questTemplates, { ...state.questTemplates[0], id: "plant-water", title: "Water the plants", recurrence: { cadence: "interval", interval: 2 }, escalation: "non-escalating", createdAt: isoAt(2026, 8, 1), updatedAt: isoAt(2026, 8, 1) }];
    const next = initializeDailyLifecycle(state, localDate(2026, 8, 3));
    expect(next.quests.find((quest) => quest.id === "plant-water:2026-08-03")?.status).toBe("available");
  });

  it("creates one rescue for a rescue-eligible stale task and never rescues a non-escalating task", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    const rescued = initializeDailyLifecycle(initial, localDate(2026, 8, 4));
    expect(rescued.quests.filter((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(rescued.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")?.title).toBe("Kitchen Rescue");

    const refreshed = initializeDailyLifecycle(rescued, localDate(2026, 8, 4));
    expect(refreshed.quests.filter((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher" && quest.status === "available")).toHaveLength(1);

    const gentle = createSeedState(localDate(2026, 8, 1));
    gentle.questTemplates = gentle.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, escalation: "non-escalating" } : template);
    const notRescued = initializeDailyLifecycle(gentle, localDate(2026, 8, 4));
    expect(notRescued.quests.some((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")).toBe(false);
  });

  it("awards rescue rewards and clamps its larger home-state recovery", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    initial.homeStats.kitchen = 95;
    const withRescue = initializeDailyLifecycle(initial, localDate(2026, 8, 4));
    const rescue = withRescue.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher");
    expect(rescue).toBeDefined();
    const completed = completeQuest(withRescue, rescue!.id, isoAt(2026, 8, 4));
    expect(completed.progression.totalXp).toBe(withRescue.progression.totalXp + rescue!.xpReward);
    expect(completed.homeStats.kitchen).toBe(100);
    expect(completed.quests.find((quest) => quest.id === rescue!.id)?.status).toBe("completed");
  });

  it("offers one welcoming comeback after three inactive days, not after one", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    const tomorrow = initializeDailyLifecycle(initial, localDate(2026, 8, 2));
    expect(tomorrow.quests.some((quest) => quest.kind === "comeback" && quest.status === "available")).toBe(false);

    const returning = initializeDailyLifecycle(createSeedState(localDate(2026, 8, 1)), localDate(2026, 8, 4));
    const comeback = returning.quests.find((quest) => quest.kind === "comeback" && quest.status === "available");
    expect(comeback).toMatchObject({ title: "Reset one space", xpReward: 40 });
    expect(initializeDailyLifecycle(returning, localDate(2026, 8, 4)).quests.filter((quest) => quest.kind === "comeback" && quest.status === "available")).toHaveLength(1);

    const completed = completeQuest(returning, comeback!.id, isoAt(2026, 8, 4));
    expect(completed.progression.totalXp).toBe(returning.progression.totalXp + 40);
    expect(completed.player.coins).toBeGreaterThan(returning.player.coins);
  });
});
