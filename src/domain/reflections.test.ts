import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { getDailySummary, getTomorrowPreview, getWeekStart, getWeeklySummary, selectBiggestWin, detectMomentumChain } from "./reflections";
import type { AppState, LocalDateKey, Quest } from "./types";

const localDate = (year: number, month: number, day: number, hour = 10, minute = 0) => new Date(year, month - 1, day, hour, minute);

function completed(quest: Quest, at: Date, changes: Partial<Quest> = {}): Quest {
  return { ...quest, ...changes, status: "completed", lastCompletedAt: at.toISOString() };
}

function stateWithCompleted(quests: Quest[]): AppState {
  const initial = createSeedState(localDate(2026, 8, 23));
  return { ...initial, quests };
}

describe("daily reflections", () => {
  it("derives today’s wins, home gains, rescue, comeback, and a quiet state from completion records", () => {
    const seed = createSeedState(localDate(2026, 8, 23));
    const summary = getDailySummary(stateWithCompleted([
      completed(seed.quests[0], localDate(2026, 8, 23, 9)),
      completed(seed.quests[1], localDate(2026, 8, 23, 10), { kind: "rescue" }),
      completed(seed.quests[2], localDate(2026, 8, 23, 10, 20), { kind: "comeback" }),
    ]), "2026-08-23");

    expect(summary).toMatchObject({ completedCount: 3, xpEarned: 105, rescueCount: 1, comebackCount: 1, tone: "active" });
    expect(summary.homeImprovements).toMatchObject({ kitchen: 22, cleanliness: 14 });
    expect(summary.biggestWin?.kind).toBe("rescue");
    expect(getDailySummary(stateWithCompleted([]), "2026-08-23")).toMatchObject({ completedCount: 0, tone: "quiet" });
  });

  it("selects a meaningful win deterministically and only calls related close completions momentum", () => {
    const seed = createSeedState(localDate(2026, 8, 23));
    const rescue = completed(seed.quests[3], localDate(2026, 8, 23, 11), { id: "a-rescue", kind: "rescue", xpReward: 10 });
    const strong = completed(seed.quests[1], localDate(2026, 8, 23, 11), { id: "strong", xpReward: 90 });
    expect(selectBiggestWin([strong, rescue])?.id).toBe("a-rescue");
    expect(selectBiggestWin([{ ...strong, id: "b" }, { ...strong, id: "a" }])?.id).toBe("a");

    const related = [
      completed(seed.quests[0], localDate(2026, 8, 23, 9)),
      completed(seed.quests[2], localDate(2026, 8, 23, 9, 20)),
    ];
    expect(detectMomentumChain(related)).toHaveLength(2);
    const unrelated = [
      completed(seed.quests[1], localDate(2026, 8, 23, 9)),
      completed(seed.quests[4], localDate(2026, 8, 23, 9, 20), { category: "organization", statEffects: { organization: 5 } }),
    ];
    expect(detectMomentumChain(unrelated)).toBeUndefined();
  });
});

describe("weekly reflection", () => {
  it("uses deterministic Sunday-through-Saturday ranges and offers at most one gentle attention area", () => {
    const seed = createSeedState(localDate(2026, 8, 23));
    const state = { ...stateWithCompleted([
      completed(seed.quests[0], localDate(2026, 8, 23, 9)),
      completed(seed.quests[3], localDate(2026, 8, 25, 9)),
      completed(seed.quests[0], localDate(2026, 8, 26, 9), { id: "dishwasher-again" }),
      completed(seed.quests[4], localDate(2026, 8, 29, 9), { kind: "rescue" }),
    ]), homeStats: { cleanliness: 62, organization: 30, supplies: 76, kitchen: 55 } };
    const summary = getWeeklySummary(state, "2026-08-26");

    expect(getWeekStart("2027-01-01")).toBe("2026-12-27");
    expect(summary).toMatchObject({ weekStart: "2026-08-23", weekEnd: "2026-08-29", completedCount: 4, activeDays: 4, rescueCount: 1 });
    expect(summary.mostReliableQuest).toEqual({ title: "Run the dishwasher", count: 2 });
    expect(summary.narrative).toBe(getWeeklySummary(state, "2026-08-26").narrative);
    expect(summary.neglectedArea?.split(".")).toHaveLength(2);
  });
});

describe("tomorrow preview", () => {
  it("projects active recurring templates without mutating state or treating manual tasks as scheduled", () => {
    const seed = createSeedState(localDate(2026, 8, 23)); // Sunday; tomorrow is Monday.
    const state = { ...seed, questTemplates: seed.questTemplates.map((template) => template.id === "trash" ? { ...template, recurrence: { cadence: "weekdays" as const, daysOfWeek: [1] } } : template) };
    const before = JSON.stringify(state);
    const preview = getTomorrowPreview(state, "2026-08-23" as LocalDateKey);

    expect(preview.date).toBe("2026-08-24");
    expect(preview.quests.map((quest) => quest.id)).toEqual(["trash:2026-08-24", "dishwasher:2026-08-24"]);
    expect(preview.quests.some((quest) => quest.title === "Make a simple dinner")).toBe(false);
    expect(preview.estimatedMinutes).toBe(11);
    expect(JSON.stringify(state)).toBe(before);
  });
});
