import { toLocalDateKey } from "./dates";
import { isDueOnDate } from "./recurrence";
import { recommendQuestXp } from "./rewards";
import type { AppState, EscalationPolicy, LocalDateKey, Quest, QuestCategory, QuestTemplate } from "./types";

export type QuestTemplateDraft = Omit<QuestTemplate, "active" | "createdAt" | "updatedAt">;

export const defaultStatEffects: Record<QuestCategory, QuestTemplate["statEffects"]> = {
  cleaning: { cleanliness: 6, kitchen: 3 },
  cooking: { kitchen: 5, supplies: -2 },
  organization: { organization: 7 },
  homekeeping: { cleanliness: 5, organization: 3 },
};

export const questPresets: Array<Pick<QuestTemplate, "title" | "description" | "category" | "estimatedMinutes" | "effort" | "recurrence" | "urgency" | "escalation" | "statEffects" | "zoneId" | "zoneEffects">> = [
  { title: "Run dishwasher", description: "Load the dishes and start a cycle.", category: "cleaning", estimatedMinutes: 5, effort: "low", recurrence: { cadence: "daily" }, urgency: "soon", escalation: "rescue-eligible", statEffects: { kitchen: 8, cleanliness: 4 }, zoneId: "kitchen", zoneEffects: { dishes: 20, counters: 4 } },
  { title: "Kitchen reset", description: "Clear the counters and restore a usable kitchen.", category: "cleaning", estimatedMinutes: 15, effort: "medium", recurrence: { cadence: "daily" }, urgency: "soon", escalation: "rescue-eligible", statEffects: { kitchen: 9, cleanliness: 8 }, zoneId: "kitchen", zoneEffects: { dishes: 10, counters: 16, trash: 8 } },
  { title: "Take out trash", description: "Take the bag out and add a fresh liner.", category: "homekeeping", estimatedMinutes: 6, effort: "low", recurrence: { cadence: "weekdays", daysOfWeek: [2, 5] }, urgency: "today", escalation: "rescue-eligible", statEffects: { cleanliness: 6, organization: 3 }, zoneId: "kitchen", zoneEffects: { trash: 22 } },
  { title: "Put away laundry", description: "Put away one basket.", category: "organization", estimatedMinutes: 15, effort: "medium", recurrence: { cadence: "weekly", daysOfWeek: [6] }, urgency: "soon", escalation: "rescue-eligible", statEffects: { organization: 8 }, zoneId: "household" },
  { title: "Start laundry", description: "Start one practical load.", category: "organization", estimatedMinutes: 8, effort: "low", recurrence: { cadence: "weekly", daysOfWeek: [3] }, urgency: "soon", escalation: "gentle", statEffects: { organization: 4 }, zoneId: "household" },
  { title: "Clean bathroom", description: "A focused refresh of the bathroom.", category: "cleaning", estimatedMinutes: 30, effort: "high", recurrence: { cadence: "weekly", daysOfWeek: [0] }, urgency: "soon", escalation: "rescue-eligible", statEffects: { cleanliness: 10 }, zoneId: "household" },
  { title: "Bathroom reset", description: "A gentle reset of the sink, toilet, shower, and floor.", category: "cleaning", estimatedMinutes: 15, effort: "medium", recurrence: { cadence: "weekly", daysOfWeek: [0] }, urgency: "soon", escalation: "rescue-eligible", statEffects: { cleanliness: 8, organization: 2 }, zoneId: "bathroom", zoneEffects: { sink: 14, toilet: 16, shower: 12, floor: 10 } },
  { title: "Restock bathroom supplies", description: "Check the essentials and replace one thing that is low.", category: "homekeeping", estimatedMinutes: 6, effort: "low", recurrence: { cadence: "weekly", daysOfWeek: [3] }, urgency: "soon", escalation: "gentle", statEffects: { supplies: 7, organization: 2 }, zoneId: "bathroom", zoneEffects: { supplies: 22 } },
  { title: "Vacuum", description: "Clear the floor in the space that needs it most.", category: "cleaning", estimatedMinutes: 20, effort: "medium", recurrence: { cadence: "weekly", daysOfWeek: [6] }, urgency: "gentle", escalation: "gentle", statEffects: { cleanliness: 8 }, zoneId: "household" },
  { title: "Change sheets", description: "Fresh bedding for the week ahead.", category: "homekeeping", estimatedMinutes: 15, effort: "medium", recurrence: { cadence: "weekly", daysOfWeek: [0] }, urgency: "gentle", escalation: "non-escalating", statEffects: { cleanliness: 4, organization: 3 }, zoneId: "household" },
  { title: "Grocery planning", description: "Make a short, useful grocery plan.", category: "organization", estimatedMinutes: 10, effort: "low", recurrence: { cadence: "weekly", daysOfWeek: [0] }, urgency: "soon", escalation: "non-escalating", statEffects: { supplies: 5, organization: 3 }, zoneId: "household" },
  { title: "Meal prep", description: "Prep one thing that makes later meals easier.", category: "cooking", estimatedMinutes: 45, effort: "high", recurrence: { cadence: "weekly", daysOfWeek: [0] }, urgency: "gentle", escalation: "non-escalating", statEffects: { kitchen: 7, supplies: 4 }, zoneId: "kitchen", zoneEffects: { food: 18, counters: -2, dishes: -2 } },
];

export function templateXpReward(template: Pick<QuestTemplate, "rewardMode" | "manualXpReward" | "estimatedMinutes" | "effort" | "urgency" | "recurrence">): number {
  return template.rewardMode === "manual" && template.manualXpReward !== undefined ? template.manualXpReward : recommendQuestXp(template);
}

export function createQuestOccurrence(template: QuestTemplate, date: LocalDateKey, missedCount = 0): Quest {
  return {
    id: `${template.id}:${date}`,
    templateId: template.id,
    title: template.title,
    description: template.description ?? "A small step toward a steadier home.",
    category: template.category,
    status: "available",
    kind: "normal",
    xpReward: templateXpReward(template),
    estimatedMinutes: template.estimatedMinutes,
    effort: template.effort,
    urgency: template.urgency,
    recurrence: template.recurrence,
    escalation: template.escalation,
    statEffects: template.statEffects,
    zoneId: template.zoneId,
    zoneEffects: template.zoneEffects,
    createdAt: template.createdAt,
    occurrenceDate: date,
    missedCount,
    recommendation: template.recommendation,
  };
}

export function createQuestTemplate(draft: QuestTemplateDraft, now: Date): QuestTemplate {
  const timestamp = now.toISOString();
  return { ...draft, source: "user", active: true, createdAt: timestamp, updatedAt: timestamp };
}

function canAppearToday(template: QuestTemplate, today: LocalDateKey): boolean {
  return template.recurrence.cadence === "manual" || template.recurrence.cadence === "as-needed" || isDueOnDate(template, today);
}

export function syncTemplateOccurrence(state: AppState, template: QuestTemplate, now: Date): AppState {
  const today = toLocalDateKey(now);
  const shouldAppear = template.active && canAppearToday(template, today);
  const current = state.household.quests.find((quest) => quest.templateId === template.id && quest.occurrenceDate === today && quest.kind !== "rescue" && quest.status !== "archived");
  let quests = state.household.quests.map((quest) => {
    if (quest.templateId !== template.id || quest.kind === "rescue" || quest.status !== "available") return quest;
    if (!template.active || (quest.occurrenceDate === today && !shouldAppear)) return { ...quest, status: "archived" as const };
    if (quest.occurrenceDate === today) return { ...createQuestOccurrence(template, today, quest.missedCount ?? 0), id: quest.id };
    return quest;
  });
  if (shouldAppear && !current) quests = [...quests, createQuestOccurrence(template, today)];
  return { ...state, household: { ...state.household, quests } };
}

export function hasTemplateHistory(state: AppState, templateId: string): boolean {
  return state.household.lifecycle.questHistory.some((entry) => entry.templateId === templateId) || state.household.quests.some((quest) => quest.templateId === templateId && quest.status !== "available");
}

export function withTemplateEscalation(template: QuestTemplate, escalation: EscalationPolicy): QuestTemplate {
  return { ...template, escalation };
}
