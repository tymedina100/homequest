import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { initializeDailyLifecycle } from "./lifecycle";
import { createQuestTemplate, hasTemplateHistory, syncTemplateOccurrence } from "./templates";
import type { QuestTemplateDraft } from "./templates";
import type { LocalDateKey } from "./types";
import { TYLER_PLAYER_ID } from "./players";

const localDate = (year: number, month: number, day: number) => new Date(year, month - 1, day, 10);
const draft = (): QuestTemplateDraft => ({ id: "custom-litter", title: "Refresh litter box", category: "homekeeping", estimatedMinutes: 10, effort: "low", recurrence: { cadence: "weekdays", daysOfWeek: [1, 3, 5] }, urgency: "soon", escalation: "rescue-eligible", statEffects: { cleanliness: 5 }, rewardMode: "automatic" });

describe("quest templates", () => {
  it("creates a user-authored template and one current occurrence", () => {
    const now = localDate(2026, 8, 3); // Monday
    const template = createQuestTemplate(draft(), now);
    const initial = createSeedState(now);
    const state = syncTemplateOccurrence({ ...initial, household: { ...initial.household, questTemplates: [...initial.household.questTemplates, template] } }, template, now);
    expect(template.active).toBe(true);
    expect(state.household.quests.filter((quest) => quest.templateId === template.id && quest.status === "available")).toHaveLength(1);
    expect(state.household.quests.find((quest) => quest.templateId === template.id)?.xpReward).toBeGreaterThanOrEqual(10);
  });

  it("updates recurrence without duplicating a current occurrence", () => {
    const monday = localDate(2026, 8, 3);
    const template = createQuestTemplate(draft(), monday);
    const initial = createSeedState(monday);
    const withTemplate = syncTemplateOccurrence({ ...initial, household: { ...initial.household, questTemplates: [...initial.household.questTemplates, template] } }, template, monday);
    const edited = { ...template, recurrence: { cadence: "weekly" as const, daysOfWeek: [5] }, updatedAt: localDate(2026, 8, 3).toISOString() };
    const editedState = syncTemplateOccurrence({ ...withTemplate, household: { ...withTemplate.household, questTemplates: withTemplate.household.questTemplates.map((item) => item.id === edited.id ? edited : item) } }, edited, monday);
    expect(editedState.household.quests.filter((quest) => quest.templateId === edited.id && quest.status === "available")).toHaveLength(0);
    const friday = initializeDailyLifecycle(editedState, localDate(2026, 8, 7));
    expect(friday.household.quests.filter((quest) => quest.templateId === edited.id && quest.status === "available")).toHaveLength(1);
  });

  it("archives a template without losing its completed historical record", () => {
    const monday = localDate(2026, 8, 3);
    const template = createQuestTemplate(draft(), monday);
    const initial = createSeedState(monday);
    const created = syncTemplateOccurrence({ ...initial, household: { ...initial.household, questTemplates: [...initial.household.questTemplates, template] } }, template, monday);
    const completed = { ...created, household: { ...created.household, quests: created.household.quests.map((quest) => quest.templateId === template.id ? { ...quest, status: "completed" as const, completedByPlayerId: TYLER_PLAYER_ID } : quest), lifecycle: { ...created.household.lifecycle, questHistory: [...created.household.lifecycle.questHistory, { questId: `${template.id}:2026-08-03`, templateId: template.id, date: "2026-08-03" as LocalDateKey, event: "completed" as const, playerId: TYLER_PLAYER_ID }] } } };
    const archived = { ...template, active: false };
    const paused = syncTemplateOccurrence({ ...completed, household: { ...completed.household, questTemplates: completed.household.questTemplates.map((item) => item.id === template.id ? archived : item) } }, archived, localDate(2026, 8, 3));
    expect(hasTemplateHistory(paused, template.id)).toBe(true);
    const future = initializeDailyLifecycle(paused, localDate(2026, 8, 5));
    expect(future.household.quests.some((quest) => quest.templateId === template.id && quest.status === "available")).toBe(false);
    expect(future.household.lifecycle.questHistory.some((entry) => entry.templateId === template.id && entry.event === "completed")).toBe(true);
  });
});
