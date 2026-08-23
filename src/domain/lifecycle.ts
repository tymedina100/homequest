import { addDays, dateKeyFromIso, daysBetween, toLocalDateKey } from "./dates";
import { isDueOnDate, isRecurring } from "./recurrence";
import { createQuestOccurrence } from "./templates";
import type { AppState, DailyHistoryEntry, LocalDateKey, PlayerId, Quest, QuestTemplate } from "./types";

export { isDueOnDate } from "./recurrence";

/** A single missed day is normal; a return after three absent calendar days gets a gentle re-entry. */
export const COMEBACK_INACTIVITY_DAYS = 3;
/** Seed chores use this after three missed due cycles, so ordinary short gaps stay ordinary. */
export const RESCUE_MISSED_CYCLES = 3;
export const RESCUE_XP_BONUS = 20;
export const COMEBACK_XP_REWARD = 40;

function dueDates(from: LocalDateKey, through: LocalDateKey, quest: QuestTemplate): LocalDateKey[] {
  const count = daysBetween(from, through);
  if (count < 0) return [];
  return Array.from({ length: count + 1 }, (_, index) => addDays(from, index)).filter((date) => isDueOnDate(quest, date));
}

function addDailyEntry(entries: DailyHistoryEntry[], date: LocalDateKey, field: "completedQuestIds" | "missedQuestIds", questId: string): DailyHistoryEntry[] {
  const current = entries.find((entry) => entry.date === date);
  if (current?.[field].includes(questId)) return entries;
  if (current) return entries.map((entry) => entry.date === date ? { ...entry, [field]: [...entry[field], questId] } : entry);
  return [...entries, { date, completedQuestIds: field === "completedQuestIds" ? [questId] : [], missedQuestIds: field === "missedQuestIds" ? [questId] : [] }];
}

function rescueTitle(quest: Quest): string {
  if (quest.statEffects.kitchen) return "Kitchen Rescue";
  if (quest.category === "organization") return "Laundry Rescue";
  if (quest.category === "homekeeping") return "Living Space Rescue";
  return "Home Rescue";
}

function createRescueQuest(quest: Quest, date: LocalDateKey): Quest {
  const templateId = quest.templateId ?? quest.id;
  const statEffects = Object.fromEntries(Object.entries(quest.statEffects).map(([key, value]) => [key, (value ?? 0) * 2]));
  return {
    ...quest,
    id: `rescue:${templateId}:${date}`,
    title: rescueTitle(quest),
    description: `The ${quest.title.toLowerCase()} has been waiting a few days. Clear the backlog and restore a little ease.`,
    status: "available",
    kind: "rescue",
    rescueOf: templateId,
    lifecycleNote: "A gentle, higher-impact reset for something that has been waiting.",
    xpReward: quest.xpReward + RESCUE_XP_BONUS,
    estimatedMinutes: Math.max(quest.estimatedMinutes + 8, Math.round(quest.estimatedMinutes * 1.6)),
    effort: quest.effort === "low" ? "medium" : quest.effort,
    urgency: "today",
    statEffects,
    occurrenceDate: date,
  };
}

function createComebackQuest(date: LocalDateKey): Quest {
  return {
    id: `comeback:${date}`,
    templateId: "comeback-reset-one-space",
    title: "Reset one space",
    description: "Welcome back. One reset is enough to get moving again.",
    category: "homekeeping",
    status: "available",
    kind: "comeback",
    lifecycleNote: "Comeback Bonus · A welcoming re-entry quest after time away.",
    xpReward: COMEBACK_XP_REWARD,
    estimatedMinutes: 15,
    effort: "low",
    urgency: "soon",
    recurrence: { cadence: "manual" },
    escalation: "non-escalating",
    statEffects: { cleanliness: 6, organization: 6, kitchen: 4 },
    createdAt: `${date}T12:00:00.000`,
    occurrenceDate: date,
    recommendation: { momentum: 12 },
  };
}

/**
 * Advances daily state using only the supplied local time. It does not call the
 * clock, so replaying an initialization for the same day is deterministic.
 */
export function initializeDailyLifecycle(state: AppState, now: Date): AppState {
  const today = toLocalDateKey(now);
  const lifecycle = state.household.lifecycle;
  const lastDate = lifecycle.lastLifecycleDate;
  const players = Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, { ...player, dailyContext: { ...player.dailyContext, date: today } }])) as AppState["players"];

  if (!lastDate) {
    return { ...state, players, household: { ...state.household, lifecycle: { ...lifecycle, lastLifecycleDate: today, lastOpenedDate: today } } };
  }
  if (lastDate === today) {
    if (lifecycle.lastOpenedDate === today) return state;
    return { ...state, players, household: { ...state.household, lifecycle: { ...lifecycle, lastOpenedDate: today } } };
  }

  let dailyHistory = lifecycle.dailyHistory;
  let questHistory = lifecycle.questHistory;
  const priorQuests = state.household.quests;
  const templates = state.household.questTemplates.filter((template) => template.active);
  const missedCounts = new Map<string, number>();

  for (const template of templates) {
    const templateId = template.id;
    const latest = [...priorQuests].filter((quest) => quest.templateId === templateId && quest.kind === "normal").sort((a, b) => (b.occurrenceDate ?? "").localeCompare(a.occurrenceDate ?? ""))[0];
    const occurrenceDate = latest?.occurrenceDate ?? lastDate;
    const start = latest?.status === "completed" || latest?.lastCompletedAt ? addDays(occurrenceDate, 1) : occurrenceDate;
    const missedDates = dueDates(start, addDays(today, -1), template);
    const missedCount = (latest?.missedCount ?? 0) + missedDates.length;
    missedCounts.set(templateId, missedCount);
    for (const date of missedDates) {
      const missedId = `${templateId}:${date}`;
      dailyHistory = addDailyEntry(dailyHistory, date, "missedQuestIds", missedId);
      if (!questHistory.some((entry) => entry.questId === missedId && entry.event === "missed")) {
        questHistory = [...questHistory, { questId: missedId, templateId, date, event: "missed" }];
      }
    }
  }

  let quests = priorQuests.map((quest) => quest.recurrence && isRecurring(quest.recurrence) && quest.occurrenceDate !== today && quest.status !== "archived" ? { ...quest, status: "archived" as const } : quest);
  for (const template of templates) {
    const templateId = template.id;
    if (!isDueOnDate(template, today)) continue;
    const alreadyHere = quests.some((quest) => (quest.templateId ?? quest.id) === templateId && quest.occurrenceDate === today && quest.status !== "archived");
    const rescueActive = quests.some((quest) => quest.kind === "rescue" && quest.rescueOf === templateId && quest.status === "available");
    if (!alreadyHere && !rescueActive) quests = [...quests, createQuestOccurrence(template, today, missedCounts.get(templateId) ?? 0)];
  }

  for (const template of templates) {
    const templateId = template.id;
    const missedCount = missedCounts.get(templateId) ?? 0;
    const alreadyRescuing = quests.some((quest) => quest.kind === "rescue" && quest.rescueOf === templateId && quest.status === "available");
    if (template.escalation !== "rescue-eligible" || missedCount < RESCUE_MISSED_CYCLES || alreadyRescuing) continue;
    const source = quests.find((quest) => quest.templateId === templateId && quest.occurrenceDate === today) ?? createQuestOccurrence(template, today, missedCount);
    const rescue = createRescueQuest({ ...source, missedCount }, today);
    quests = [...quests.map((quest) => (quest.status === "available" && (quest.templateId ?? quest.id) === templateId ? { ...quest, status: "archived" as const } : quest)), rescue];
    questHistory = [...questHistory, { questId: rescue.id, templateId, date: today, event: "rescue-created" }];
  }

  const inactiveFor = daysBetween(lifecycle.lastOpenedDate ?? lastDate, today);
  const activeComeback = quests.some((quest) => quest.kind === "comeback" && quest.status === "available");
  if (inactiveFor >= COMEBACK_INACTIVITY_DAYS && !activeComeback) {
    const comeback = createComebackQuest(today);
    quests = [...quests, comeback];
    questHistory = [...questHistory, { questId: comeback.id, templateId: comeback.templateId, date: today, event: "comeback-created" }];
  }

  return {
    ...state,
    players,
    household: { ...state.household, quests, lifecycle: { ...lifecycle, lastLifecycleDate: today, lastOpenedDate: today, dailyHistory, questHistory } },
  };
}

export function recordQuestCompletion(state: AppState, quest: Quest, playerId: PlayerId, completedAt: string): AppState {
  const date = dateKeyFromIso(completedAt);
  const lifecycle = state.household.lifecycle;
  const dailyHistory = addDailyEntry(lifecycle.dailyHistory, date, "completedQuestIds", quest.id);
  const questHistory = lifecycle.questHistory.some((entry) => entry.questId === quest.id && entry.event === "completed")
    ? lifecycle.questHistory
    : [...lifecycle.questHistory, { questId: quest.id, templateId: quest.templateId, date, event: "completed" as const, playerId }];
  return { ...state, household: { ...state.household, lifecycle: { ...lifecycle, lastMeaningfulActivityDate: date, dailyHistory, questHistory } } };
}
