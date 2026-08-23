import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { completeQuest } from "./quests";
import { initializeDailyLifecycle } from "./lifecycle";
import { TYLER_PLAYER_ID } from "./players";
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
    const completed = completeQuest(initial, "dishwasher", TYLER_PLAYER_ID, isoAt(2026, 12, 31));
    const next = initializeDailyLifecycle(completed, localDate(2027, 1, 1));
    expect(next.household.quests.filter((quest) => quest.templateId === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(next.household.quests.find((quest) => quest.id === "dishwasher:2027-01-01")).toMatchObject({ status: "available", occurrenceDate: "2027-01-01" });
    expect(next.household.lifecycle.dailyHistory.find((entry) => entry.date === "2026-12-31")?.completedQuestIds).toContain("dishwasher");
  });

  it("ages missed daily cycles across several skipped days without producing a backlog", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    initial.household.questTemplates = initial.household.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, escalation: "gentle" } : template);
    const next = initializeDailyLifecycle(initial, localDate(2026, 8, 4));
    expect(next.household.quests.find((quest) => quest.id === "dishwasher:2026-08-04")).toMatchObject({ status: "available", missedCount: 3 });
    expect(next.household.quests.filter((quest) => quest.templateId === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(next.players[TYLER_PLAYER_ID].progression.totalXp).toBe(initial.players[TYLER_PLAYER_ID].progression.totalXp);
  });

  it("supports selected-weekday and weekly recurrence", () => {
    const weekdayState = createSeedState(localDate(2026, 8, 3));
    expect(initializeDailyLifecycle(weekdayState, localDate(2026, 8, 4)).household.quests.find((quest) => quest.id === "trash:2026-08-04")?.status).toBe("available");
    const weeklyInitial = createSeedState(localDate(2026, 8, 1));
    const weeklyCompleted = completeQuest(weeklyInitial, "laundry", TYLER_PLAYER_ID, isoAt(2026, 8, 1));
    expect(initializeDailyLifecycle(weeklyCompleted, localDate(2026, 8, 8)).household.quests.find((quest) => quest.id === "laundry:2026-08-08")?.status).toBe("available");
  });

  it("supports every-N-days recurrence", () => {
    const state = createSeedState(localDate(2026, 8, 1));
    const intervalQuest: Quest = { ...state.household.quests[0], id: "plant-water", templateId: "plant-water", title: "Water the plants", recurrence: { cadence: "interval", interval: 2 }, escalation: "non-escalating", occurrenceDate: "2026-08-01", createdAt: isoAt(2026, 8, 1) };
    state.household.quests = [...state.household.quests, intervalQuest];
    state.household.questTemplates = [...state.household.questTemplates, { ...state.household.questTemplates[0], id: "plant-water", title: "Water the plants", recurrence: { cadence: "interval", interval: 2 }, escalation: "non-escalating", createdAt: isoAt(2026, 8, 1), updatedAt: isoAt(2026, 8, 1) }];
    expect(initializeDailyLifecycle(state, localDate(2026, 8, 3)).household.quests.find((quest) => quest.id === "plant-water:2026-08-03")?.status).toBe("available");
  });

  it("creates one rescue for a rescue-eligible stale task and never rescues a non-escalating task", () => {
    const rescued = initializeDailyLifecycle(createSeedState(localDate(2026, 8, 1)), localDate(2026, 8, 4));
    expect(rescued.household.quests.filter((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher" && quest.status === "available")).toHaveLength(1);
    expect(rescued.household.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")?.title).toBe("Kitchen Rescue");
    expect(rescued.household.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")?.description).toMatch(/need attention/i);
    expect(Object.keys(rescued.household.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")?.zoneEffects ?? {})).toHaveLength(2);
    expect(initializeDailyLifecycle(rescued, localDate(2026, 8, 4)).household.quests.filter((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher" && quest.status === "available")).toHaveLength(1);
    const gentle = createSeedState(localDate(2026, 8, 1));
    gentle.household.questTemplates = gentle.household.questTemplates.map((template) => template.id === "dishwasher" ? { ...template, escalation: "non-escalating" } : template);
    expect(initializeDailyLifecycle(gentle, localDate(2026, 8, 4)).household.quests.some((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")).toBe(false);
  });

  it("awards rescue rewards and clamps its larger home-state recovery", () => {
    const initial = createSeedState(localDate(2026, 8, 1)); initial.household.homeStats.kitchen = 95;
    const withRescue = initializeDailyLifecycle(initial, localDate(2026, 8, 4));
    const rescue = withRescue.household.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "dishwasher")!;
    const completed = completeQuest(withRescue, rescue.id, TYLER_PLAYER_ID, isoAt(2026, 8, 4));
    expect(completed.players[TYLER_PLAYER_ID].progression.totalXp).toBe(withRescue.players[TYLER_PLAYER_ID].progression.totalXp + rescue.xpReward);
    expect(completed.household.homeStats.kitchen).toBe(100);
    expect(completed.household.quests.find((quest) => quest.id === rescue.id)?.status).toBe("completed");
    expect(completed.household.zones.kitchen.totalXp).toBeGreaterThan(withRescue.household.zones.kitchen.totalXp);
    expect(completeQuest(completed, rescue.id, TYLER_PLAYER_ID, isoAt(2026, 8, 4)).household.zones.kitchen).toEqual(completed.household.zones.kitchen);
  });

  it("gently ages current Kitchen condition without subtracting permanent XP", () => {
    const initial = createSeedState(localDate(2026, 8, 1)); const beforeXp = initial.household.zones.kitchen.totalXp;
    const aged = initializeDailyLifecycle(initial, localDate(2026, 8, 2));
    expect(aged.household.zones.kitchen.condition.dishes).toBe(initial.household.zones.kitchen.condition.dishes - 2);
    expect(aged.household.zones.kitchen.totalXp).toBe(beforeXp);
  });
  it("gently ages Bathroom condition and creates a Bathroom Rescue for a stale room task", () => {
    const initial = createSeedState(localDate(2026, 8, 1)); const beforeXp = initial.household.zones.bathroom.totalXp;
    const aged = initializeDailyLifecycle(initial, localDate(2026, 8, 2));
    expect(aged.household.zones.bathroom.condition.toilet).toBe(initial.household.zones.bathroom.condition.toilet - 2);
    expect(aged.household.zones.bathroom.totalXp).toBe(beforeXp);
    const rescued = initializeDailyLifecycle(createSeedState(localDate(2026, 8, 1)), localDate(2026, 8, 22));
    expect(rescued.household.quests.find((quest) => quest.kind === "rescue" && quest.rescueOf === "bathroom-reset")?.title).toBe("Bathroom Rescue");
  });

  it("offers one welcoming comeback after three inactive days, not after one", () => {
    const initial = createSeedState(localDate(2026, 8, 1));
    expect(initializeDailyLifecycle(initial, localDate(2026, 8, 2)).household.quests.some((quest) => quest.kind === "comeback" && quest.status === "available")).toBe(false);
    const returning = initializeDailyLifecycle(createSeedState(localDate(2026, 8, 1)), localDate(2026, 8, 4));
    const comeback = returning.household.quests.find((quest) => quest.kind === "comeback" && quest.status === "available")!;
    expect(comeback).toMatchObject({ title: "Reset one space", xpReward: 40 });
    expect(initializeDailyLifecycle(returning, localDate(2026, 8, 4)).household.quests.filter((quest) => quest.kind === "comeback" && quest.status === "available")).toHaveLength(1);
    const completed = completeQuest(returning, comeback.id, TYLER_PLAYER_ID, isoAt(2026, 8, 4));
    expect(completed.players[TYLER_PLAYER_ID].progression.totalXp).toBe(returning.players[TYLER_PLAYER_ID].progression.totalXp + 40);
    expect(completed.players[TYLER_PLAYER_ID].coins).toBeGreaterThan(returning.players[TYLER_PLAYER_ID].coins);
  });
});
