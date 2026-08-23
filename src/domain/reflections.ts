import { addDays, dateKeyFromIso, dayOfWeek, daysBetween } from "./dates";
import { isDueOnDate } from "./recurrence";
import type { AppState, HomeStatKey, LocalDateKey, PlayerId, Quest, QuestCategory } from "./types";

const categoryOrder: QuestCategory[] = ["cleaning", "cooking", "organization", "homekeeping"];
const statOrder: HomeStatKey[] = ["kitchen", "cleanliness", "organization", "supplies"];

export interface DailySummary {
  date: LocalDateKey;
  completed: Quest[];
  completedCount: number;
  xpEarned: number;
  categoryActivity: Partial<Record<QuestCategory, number>>;
  homeImprovements: Partial<Record<HomeStatKey, number>>;
  rescueCount: number;
  comebackCount: number;
  contributions: Record<PlayerId, number>;
  biggestWin?: Quest;
  momentum?: Quest[];
  tone: "quiet" | "light" | "active";
}

export interface WeeklySummary {
  weekStart: LocalDateKey;
  weekEnd: LocalDateKey;
  completedCount: number;
  xpEarned: number;
  activeDays: number;
  categoryActivity: Partial<Record<QuestCategory, number>>;
  strongestCategory?: QuestCategory;
  mostReliableQuest?: { title: string; count: number };
  rescueCount: number;
  comebackCount: number;
  contributions: Record<PlayerId, number>;
  bestDay?: DailySummary;
  homeImprovements: Partial<Record<HomeStatKey, number>>;
  neglectedArea?: string;
  narrative: string;
}

export interface TomorrowPreview {
  date: LocalDateKey;
  quests: Array<Pick<Quest, "id" | "title" | "category" | "estimatedMinutes" | "urgency" | "zoneId">>;
  estimatedMinutes: number;
  focusArea?: string;
  notableRisk?: string;
}

function completedOn(state: AppState, date: LocalDateKey): Quest[] {
  return state.household.quests.filter((quest) => quest.status === "completed" && quest.lastCompletedAt && dateKeyFromIso(quest.lastCompletedAt) === date);
}

function contributions(state: AppState, quests: Quest[]): Record<PlayerId, number> {
  const result = Object.fromEntries(state.household.playerIds.map((id) => [id, 0])) as Record<PlayerId, number>;
  for (const quest of quests) if (quest.completedByPlayerId) result[quest.completedByPlayerId] = (result[quest.completedByPlayerId] ?? 0) + 1;
  return result;
}

function categoryActivity(quests: Quest[]): Partial<Record<QuestCategory, number>> {
  return quests.reduce<Partial<Record<QuestCategory, number>>>((activity, quest) => ({ ...activity, [quest.category]: (activity[quest.category] ?? 0) + 1 }), {});
}

function homeImprovements(quests: Quest[]): Partial<Record<HomeStatKey, number>> {
  const totals: Partial<Record<HomeStatKey, number>> = {};
  for (const quest of quests) for (const key of statOrder) if ((quest.statEffects[key] ?? 0) > 0) totals[key] = (totals[key] ?? 0) + (quest.statEffects[key] ?? 0);
  return totals;
}

function effortScore(quest: Quest): number {
  return quest.effort === "high" ? 12 : quest.effort === "medium" ? 6 : 0;
}

export function selectBiggestWin(quests: Quest[]): Quest | undefined {
  return [...quests].sort((left, right) => {
    const score = (quest: Quest) => (quest.kind === "rescue" ? 100 : quest.kind === "comeback" ? 70 : 0) + quest.xpReward + effortScore(quest) + Object.values(quest.statEffects).reduce((total, value) => total + Math.max(0, value ?? 0), 0);
    return score(right) - score(left) || right.xpReward - left.xpReward || left.id.localeCompare(right.id);
  })[0];
}

function related(left: Quest, right: Quest): boolean {
  if (left.category === right.category) return true;
  if (left.title.toLowerCase().includes("laundry") && right.title.toLowerCase().includes("laundry")) return true;
  return statOrder.some((stat) => (left.statEffects[stat] ?? 0) > 0 && (right.statEffects[stat] ?? 0) > 0);
}

/** Finds a close, related run of completions without claiming unrelated chores are a chain. */
export function detectMomentumChain(quests: Quest[]): Quest[] | undefined {
  const ordered = [...quests].filter((quest) => quest.lastCompletedAt).sort((left, right) => left.lastCompletedAt!.localeCompare(right.lastCompletedAt!));
  let best: Quest[] = [];
  let current: Quest[] = [];
  for (const quest of ordered) {
    const previous = current.at(-1);
    const closeEnough = previous?.lastCompletedAt && quest.lastCompletedAt && Math.abs(new Date(quest.lastCompletedAt).getTime() - new Date(previous.lastCompletedAt).getTime()) <= 90 * 60_000;
    if (previous && closeEnough && related(previous, quest)) current = [...current, quest];
    else current = [quest];
    if (current.length > best.length) best = current;
  }
  return best.length >= 2 ? best : undefined;
}

export function getDailySummary(state: AppState, date: LocalDateKey): DailySummary {
  const completed = completedOn(state, date);
  const completedCount = completed.length;
  return {
    date,
    completed,
    completedCount,
    xpEarned: completed.reduce((total, quest) => total + quest.xpReward, 0),
    categoryActivity: categoryActivity(completed),
    homeImprovements: homeImprovements(completed),
    rescueCount: completed.filter((quest) => quest.kind === "rescue").length,
    comebackCount: completed.filter((quest) => quest.kind === "comeback").length,
    contributions: contributions(state, completed),
    biggestWin: completedCount ? selectBiggestWin(completed) : undefined,
    momentum: detectMomentumChain(completed),
    tone: completedCount === 0 ? "quiet" : completedCount === 1 ? "light" : "active",
  };
}

/** Weeks run Sunday through Saturday, matching the household-friendly calendar convention. */
export function getWeekStart(date: LocalDateKey): LocalDateKey {
  return addDays(date, -dayOfWeek(date));
}

function dateRange(from: LocalDateKey, through: LocalDateKey): LocalDateKey[] {
  return Array.from({ length: daysBetween(from, through) + 1 }, (_, index) => addDays(from, index));
}

function strongestCategory(activity: Partial<Record<QuestCategory, number>>): QuestCategory | undefined {
  return categoryOrder.filter((category) => activity[category]).sort((left, right) => (activity[right] ?? 0) - (activity[left] ?? 0) || categoryOrder.indexOf(left) - categoryOrder.indexOf(right))[0];
}

function findNeglectedArea(state: AppState, end: LocalDateKey): string | undefined {
  const lowStat = statOrder.filter((stat) => state.household.homeStats[stat] < 42).sort((left, right) => state.household.homeStats[left] - state.household.homeStats[right])[0];
  if (lowStat) return `${lowStat === "kitchen" ? "Kitchen" : lowStat[0].toUpperCase() + lowStat.slice(1)} could use a little attention.`;
  const candidates = state.household.questTemplates.filter((template) => template.active && template.escalation === "rescue-eligible").map((template) => {
    const last = state.household.quests.filter((quest) => quest.templateId === template.id && quest.lastCompletedAt).sort((left, right) => (right.lastCompletedAt ?? "").localeCompare(left.lastCompletedAt ?? ""))[0];
    const lastDate = last?.lastCompletedAt ? dateKeyFromIso(last.lastCompletedAt) : dateKeyFromIso(template.createdAt);
    return { template, unattended: daysBetween(lastDate, end) };
  }).filter((item) => item.unattended >= 6).sort((left, right) => right.unattended - left.unattended || left.template.title.localeCompare(right.template.title));
  return candidates[0] ? `${candidates[0].template.title} hasn't been completed in ${candidates[0].unattended} days.` : undefined;
}

function weeklyNarrative(summary: Omit<WeeklySummary, "narrative">): string {
  if (summary.completedCount === 0) return "Your first week is underway. Complete a few quests and HomeQuest will start building your adventure log.";
  const lines = [`You completed ${summary.completedCount} quest${summary.completedCount === 1 ? "" : "s"} across ${summary.activeDays} active day${summary.activeDays === 1 ? "" : "s"}.`];
  if (summary.rescueCount) lines.push(`You cleared ${summary.rescueCount} Rescue Quest${summary.rescueCount === 1 ? "" : "s"}, restoring a space that needed it.`);
  else if (summary.comebackCount) lines.push("You used a Comeback Quest to restart with one manageable reset.");
  else if (summary.strongestCategory) lines.push(`${summary.strongestCategory[0].toUpperCase() + summary.strongestCategory.slice(1)} was your strongest area this week.`);
  return lines.join(" ");
}

export function getWeeklySummary(state: AppState, dateInWeek: LocalDateKey): WeeklySummary {
  const weekStart = getWeekStart(dateInWeek);
  const weekEnd = addDays(weekStart, 6);
  const daily = dateRange(weekStart, weekEnd).map((date) => getDailySummary(state, date));
  const completed = daily.flatMap((summary) => summary.completed);
  const activity = categoryActivity(completed);
  const recurring = completed.filter((quest) => quest.recurrence && quest.recurrence.cadence !== "manual" && quest.recurrence.cadence !== "as-needed");
  const recurringCounts = recurring.reduce<Record<string, { title: string; count: number }>>((counts, quest) => ({ ...counts, [quest.templateId ?? quest.id]: { title: quest.title, count: (counts[quest.templateId ?? quest.id]?.count ?? 0) + 1 } }), {});
  const mostReliableQuest = Object.values(recurringCounts).sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))[0];
  const base = {
    weekStart, weekEnd, completedCount: completed.length, xpEarned: completed.reduce((total, quest) => total + quest.xpReward, 0), activeDays: daily.filter((summary) => summary.completedCount > 0).length,
    categoryActivity: activity, strongestCategory: strongestCategory(activity), mostReliableQuest, rescueCount: completed.filter((quest) => quest.kind === "rescue").length,
    comebackCount: completed.filter((quest) => quest.kind === "comeback").length, contributions: contributions(state, completed), bestDay: [...daily].sort((left, right) => right.xpEarned - left.xpEarned || right.completedCount - left.completedCount || left.date.localeCompare(right.date))[0]?.completedCount ? [...daily].sort((left, right) => right.xpEarned - left.xpEarned || right.completedCount - left.completedCount || left.date.localeCompare(right.date))[0] : undefined,
    homeImprovements: homeImprovements(completed), neglectedArea: findNeglectedArea(state, weekEnd),
  };
  return { ...base, narrative: weeklyNarrative(base) };
}

export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `~${hours} hr${hours === 1 ? "" : "s"}${remainder ? ` ${remainder} min` : ""}`;
}

export function getTomorrowPreview(state: AppState, today: LocalDateKey): TomorrowPreview {
  const date = addDays(today, 1);
  const urgencyRank = { today: 0, soon: 1, gentle: 2 } as const;
  const statForCategory = (category: Quest["category"]): keyof AppState["household"]["homeStats"] =>
    category === "cooking" ? "kitchen" : category === "organization" ? "organization" : "cleanliness";
  const quests = state.household.questTemplates
    .filter((template) => template.active && isDueOnDate(template, date))
    .map((template) => ({
      id: `${template.id}:${date}`,
      title: template.title,
      category: template.category,
      zoneId: template.zoneId,
      estimatedMinutes: template.estimatedMinutes,
      urgency: template.urgency,
    }))
    .sort((left, right) =>
      urgencyRank[left.urgency] - urgencyRank[right.urgency] ||
      left.estimatedMinutes - right.estimatedMinutes ||
      left.title.localeCompare(right.title),
    )
    .slice(0, 5);
  const focusQuest = [...quests].sort(
    (left, right) =>
      state.household.homeStats[statForCategory(left.category)] - state.household.homeStats[statForCategory(right.category)] ||
      right.estimatedMinutes - left.estimatedMinutes,
  )[0];
  const activeRescue = state.household.quests.find((quest) => quest.kind === "rescue" && quest.status === "available");
  return { date, quests, estimatedMinutes: quests.reduce((total, quest) => total + quest.estimatedMinutes, 0), focusArea: focusQuest ? (focusQuest.zoneId === "kitchen" ? "Kitchen" : focusQuest.category === "organization" ? "Organization" : "Cleanliness") : undefined, notableRisk: activeRescue ? `${activeRescue.title} is already waiting on your board.` : undefined };
}
