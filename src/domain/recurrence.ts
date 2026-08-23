import { dateKeyFromIso, dayOfWeek, daysBetween } from "./dates";
import type { LocalDateKey, QuestRecurrence } from "./types";

export interface RecurrenceSource { recurrence: QuestRecurrence; createdAt: string }

export function isRecurring(recurrence: QuestRecurrence): boolean {
  return recurrence.cadence !== "manual" && recurrence.cadence !== "as-needed";
}

export function isDueOnDate(source: RecurrenceSource, date: LocalDateKey): boolean {
  const { recurrence } = source;
  if (!isRecurring(recurrence)) return false;
  if (recurrence.cadence === "daily") return true;
  if (recurrence.cadence === "weekly" || recurrence.cadence === "weekdays") {
    return (recurrence.daysOfWeek ?? [dayOfWeek(dateKeyFromIso(source.createdAt))]).includes(dayOfWeek(date));
  }
  if (recurrence.cadence === "interval") return daysBetween(dateKeyFromIso(source.createdAt), date) % Math.max(1, recurrence.interval ?? 1) === 0;
  return false;
}

export function recurrenceLabel(recurrence: QuestRecurrence): string {
  if (recurrence.cadence === "daily") return "Every day";
  if (recurrence.cadence === "manual") return "One-time";
  if (recurrence.cadence === "as-needed") return "As needed";
  if (recurrence.cadence === "interval") return `Every ${Math.max(1, recurrence.interval ?? 1)} days`;
  const days = recurrence.daysOfWeek ?? [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (recurrence.cadence === "weekly" && days.length <= 1) return "Once per week";
  return days.map((day) => names[day]).filter(Boolean).join(" · ") || "Once per week";
}
