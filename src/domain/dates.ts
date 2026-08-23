import type { LocalDateKey } from "./types";

export function toLocalDateKey(value: Date): LocalDateKey {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}` as LocalDateKey;
}

export function dateFromKey(date: LocalDateKey): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function dateKeyFromIso(value: string): LocalDateKey {
  return toLocalDateKey(new Date(value));
}

export function addDays(date: LocalDateKey, days: number): LocalDateKey {
  const next = dateFromKey(date);
  next.setDate(next.getDate() + days);
  return toLocalDateKey(next);
}

export function daysBetween(from: LocalDateKey, to: LocalDateKey): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000);
}

export function dayOfWeek(date: LocalDateKey): number {
  return dateFromKey(date).getDay();
}
