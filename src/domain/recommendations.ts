import type { DailyContext, DailyEnergy, EffortLevel, HomeStats, Quest, Urgency, UserPreferences } from "./types";

const urgencyScore: Record<Urgency, number> = { gentle: 4, soon: 14, today: 26 };
const effortValue: Record<EffortLevel, number> = { low: 1, medium: 2, high: 3 };
const dailyEnergyValue: Record<DailyEnergy, number> = { drained: 0, low: 1, good: 2, "locked-in": 3 };
type RecommendationContext = Pick<DailyContext, "energy" | "availableMinutes"> | Pick<UserPreferences, "energy" | "availableMinutes">;

export interface QuestRecommendation {
  quest: Quest;
  score: number;
  reason: string;
}

function capacityFor(energy: RecommendationContext["energy"]): number {
  return energy in dailyEnergyValue ? dailyEnergyValue[energy as DailyEnergy] : effortValue[energy as EffortLevel];
}

export function scoreQuest(quest: Quest, context: RecommendationContext, homeStats?: HomeStats): number {
  if (quest.status !== "available") return Number.NEGATIVE_INFINITY;
  if (quest.dependsOn?.length) return Number.NEGATIVE_INFINITY;
  const fitsTime = quest.estimatedMinutes <= context.availableMinutes;
  const fitsEnergy = effortValue[quest.effort] <= capacityFor(context.energy);
  const affectedStats = Object.keys(quest.statEffects) as (keyof HomeStats)[];
  const lowestAffectedStat = affectedStats.length ? Math.min(...affectedStats.map((stat) => homeStats?.[stat] ?? 100)) : 100;
  const specialWeight = quest.kind === "comeback" ? 18 : quest.kind === "rescue" ? 14 : 0;
  return (
    urgencyScore[quest.urgency] +
    (fitsTime ? 20 : -20) +
    (fitsEnergy ? 14 : -18) +
    (quest.missedCount ?? 0) * 3 +
    (quest.recommendation?.momentum ?? 0) +
    specialWeight +
    (lowestAffectedStat < 45 ? 7 : 0) +
    (context.availableMinutes >= 45 && quest.estimatedMinutes >= 25 ? 8 : 0) +
    (capacityFor(context.energy) === 0 && quest.estimatedMinutes <= 5 ? 8 : 0) +
    Math.min(quest.xpReward / 5, 10)
  );
}

function contextPhrase(context: RecommendationContext): string {
  const energy = context.energy === "locked-in" ? "locked-in energy" : `${context.energy} energy`;
  return `you’ve got ${context.availableMinutes >= 60 ? "60+" : context.availableMinutes} minutes and ${energy}`;
}

function explain(quest: Quest, context: RecommendationContext): string {
  const reasons: string[] = [];
  reasons.push(contextPhrase(context));
  if (quest.estimatedMinutes <= 10) reasons.push("it’s quick");
  if (quest.urgency === "today") reasons.push("it needs attention today");
  if (quest.kind === "comeback") reasons.push("it’s a welcoming way back in");
  if (quest.kind === "rescue") reasons.push("it will clear a backlog with one focused reset");
  if ((quest.missedCount ?? 0) >= 2) reasons.push("it’s been waiting a little while");
  if (quest.category === "cooking") reasons.push("it turns what you have into a real meal");
  if (quest.category === "cleaning" && quest.statEffects.kitchen) reasons.push("it will make the kitchen easier to use");
  if (quest.estimatedMinutes <= context.availableMinutes && reasons.length < 2) reasons.push("it fits the time you have");
  if (reasons.length < 2) reasons.push("it’s a manageable win right now");
  return `${reasons.slice(0, 2).join(", and ")}.`;
}

export function recommendQuest(quests: Quest[], context: RecommendationContext, homeStats?: HomeStats): QuestRecommendation | null {
  const ranked = quests
    .map((quest) => ({ quest, score: scoreQuest(quest, context, homeStats) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || a.quest.estimatedMinutes - b.quest.estimatedMinutes);
  if (!ranked[0]) return null;
  return { ...ranked[0], reason: explain(ranked[0].quest, context) };
}
