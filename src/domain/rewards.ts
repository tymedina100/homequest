import type { EffortLevel, QuestRecurrence, Urgency } from "./types";

const effortBonus: Record<EffortLevel, number> = { low: 0, medium: 9, high: 18 };
const urgencyBonus: Record<Urgency, number> = { gentle: 0, soon: 4, today: 8 };

export function recommendQuestXp(input: { estimatedMinutes: number; effort: EffortLevel; urgency: Urgency; recurrence: QuestRecurrence }): number {
  const minutes = Math.max(1, Math.min(90, input.estimatedMinutes));
  const timeReward = Math.ceil(minutes / 5) * 4;
  const recurrenceBonus = input.recurrence.cadence === "daily" ? 4 : input.recurrence.cadence === "weekdays" || input.recurrence.cadence === "weekly" ? 2 : 0;
  return Math.max(10, Math.min(90, 8 + timeReward + effortBonus[input.effort] + urgencyBonus[input.urgency] + recurrenceBonus));
}
