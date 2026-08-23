import { weakestBathroomConditions, weakestKitchenConditions } from "./zones";
import type { BathroomCondition, DailyContext, DailyEnergy, EffortLevel, HomeStats, KitchenCondition, Quest, QuestZoneId, Urgency, ZoneConditionKey } from "./types";

const urgencyScore: Record<Urgency, number> = { gentle: 4, soon: 14, today: 26 };
const effortValue: Record<EffortLevel, number> = { low: 1, medium: 2, high: 3 };
const dailyEnergyValue: Record<DailyEnergy, number> = { drained: 0, low: 1, good: 2, "locked-in": 3 };
type RecommendationContext = Pick<DailyContext, "energy" | "availableMinutes">;
export interface RecommendationOptions { zoneId?: QuestZoneId; kitchenCondition?: KitchenCondition; bathroomCondition?: BathroomCondition }

export interface QuestRecommendation {
  quest: Quest;
  score: number;
  reason: string;
}

function capacityFor(energy: RecommendationContext["energy"]): number {
  return dailyEnergyValue[energy];
}

export function scoreQuest(quest: Quest, context: RecommendationContext, homeStats?: HomeStats, zoneCondition?: Record<string, number>): number {
  if (quest.status !== "available") return Number.NEGATIVE_INFINITY;
  if (quest.dependsOn?.length) return Number.NEGATIVE_INFINITY;
  const fitsTime = quest.estimatedMinutes <= context.availableMinutes;
  const fitsEnergy = effortValue[quest.effort] <= capacityFor(context.energy);
  const affectedStats = Object.keys(quest.statEffects) as (keyof HomeStats)[];
  const lowestAffectedStat = affectedStats.length ? Math.min(...affectedStats.map((stat) => homeStats?.[stat] ?? 100)) : 100;
  const specialWeight = quest.kind === "comeback" ? 28 : quest.kind === "rescue" ? 16 : 0;
  const affectedZone = Object.keys(quest.zoneEffects ?? {}) as ZoneConditionKey[];
  const weakestAffectedZone = affectedZone.length ? Math.min(...affectedZone.map((key) => zoneCondition?.[key] ?? 100)) : 100;
  return (
    urgencyScore[quest.urgency] +
    (fitsTime ? 20 : -20) +
    (fitsEnergy ? 14 : -18) +
    (quest.missedCount ?? 0) * 3 +
    (quest.recommendation?.momentum ?? 0) +
    specialWeight +
    (lowestAffectedStat < 25 ? 14 : lowestAffectedStat < 45 ? 7 : 0) +
    (weakestAffectedZone < 25 ? 24 : weakestAffectedZone < 45 ? 12 : 0) +
    (context.availableMinutes >= 45 && quest.estimatedMinutes >= 25 ? 8 : 0) +
    (capacityFor(context.energy) === 0 && quest.estimatedMinutes <= 5 ? 8 : 0) +
    Math.min(quest.xpReward / 5, 10)
  );
}

function contextPhrase(context: RecommendationContext): string {
  const energy = context.energy === "locked-in" ? "locked-in energy" : `${context.energy} energy`;
  return `You have ${context.availableMinutes >= 60 ? "60+" : context.availableMinutes} minutes and ${energy}`;
}

const kitchenConditionCopy: Record<keyof KitchenCondition, { label: string; verb: "is" | "are" }> = {
  dishes: { label: "dishes", verb: "are" }, counters: { label: "counters", verb: "are" }, floor: { label: "the floor", verb: "is" }, trash: { label: "trash", verb: "is" }, food: { label: "food", verb: "is" },
};
const bathroomConditionCopy: Record<keyof BathroomCondition, { label: string; verb: "is" | "are" }> = {
  sink: { label: "the sink", verb: "is" }, toilet: { label: "the toilet", verb: "is" }, shower: { label: "the shower", verb: "is" }, floor: { label: "the floor", verb: "is" }, supplies: { label: "supplies", verb: "are" },
};

function explain(quest: Quest, context: RecommendationContext, zoneCondition?: Record<string, number>): string {
  const reasons: string[] = [];
  const weakZone = quest.zoneId === "kitchen" && zoneCondition ? weakestKitchenConditions(zoneCondition as KitchenCondition, 1)[0]
    : quest.zoneId === "bathroom" && zoneCondition ? weakestBathroomConditions(zoneCondition as BathroomCondition, 1)[0]
      : undefined;
  const targetsWeakZone = Boolean(weakZone && (quest.zoneEffects?.[weakZone] ?? 0) > 0);
  if (quest.kind === "comeback") reasons.push("A gentle comeback is the best way back in");
  if (quest.kind === "rescue") reasons.push("This focused Rescue clears a backlog without turning it into a list");
  if (targetsWeakZone && weakZone && reasons.length < 2) {
    const room = quest.zoneId === "bathroom" ? "Bathroom" : "Kitchen";
    const copy = quest.zoneId === "bathroom" ? bathroomConditionCopy[weakZone as keyof BathroomCondition] : kitchenConditionCopy[weakZone as keyof KitchenCondition];
    reasons.push(`${copy.label[0].toUpperCase() + copy.label.slice(1)} ${copy.verb} holding ${room} Harmony back`);
  }
  if (quest.urgency === "today" && reasons.length < 2) reasons.push("This needs attention today");
  if (reasons.length < 2) {
    const fit = quest.estimatedMinutes <= context.availableMinutes ? "it fits" : "it is the strongest available option";
    reasons.push(`${contextPhrase(context)}, and ${quest.estimatedMinutes <= 10 ? "this is a quick win" : fit}`);
  }
  if (reasons.length < 2 && (quest.missedCount ?? 0) >= 2) reasons.push("It has been waiting a little while");
  if (reasons.length < 2 && quest.category === "cooking") reasons.push("It turns what you have into a real meal");
  if (!reasons.length) reasons.push("It is a manageable win right now");
  return `${reasons.slice(0, 2).join(". ")}.`;
}

export function recommendQuest(quests: Quest[], context: RecommendationContext, homeStats?: HomeStats, options: RecommendationOptions = {}): QuestRecommendation | null {
  const ranked = quests
    .filter((quest) => !options.zoneId || quest.zoneId === options.zoneId)
    .map((quest) => ({ quest, zoneCondition: quest.zoneId === "bathroom" ? options.bathroomCondition : quest.zoneId === "kitchen" ? options.kitchenCondition : undefined }))
    .map(({ quest, zoneCondition }) => ({ quest, zoneCondition, score: scoreQuest(quest, context, homeStats, zoneCondition) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || a.quest.estimatedMinutes - b.quest.estimatedMinutes);
  if (!ranked[0]) return null;
  return { quest: ranked[0].quest, score: ranked[0].score, reason: explain(ranked[0].quest, context, ranked[0].zoneCondition) };
}

/** Keeps Home's short list useful during re-entry without deleting or hiding work from the full Quest Log. */
export function selectHomeQuestPreview(quests: Quest[], recommendedQuestId?: string, limit = 4): Quest[] {
  const available = quests.filter((quest) => quest.status === "available");
  const lead = available.find((quest) => quest.id === recommendedQuestId);
  const special = lead?.kind === "comeback" || lead?.kind === "rescue"
    ? lead
    : available.find((quest) => quest.kind === "comeback") ?? available.find((quest) => quest.kind === "rescue");
  const ordered = [lead, special, ...available.filter((quest) => !quest.kind || quest.kind === "normal")].filter((quest): quest is Quest => Boolean(quest));
  return ordered.filter((quest, index) => ordered.findIndex((candidate) => candidate.id === quest.id) === index).slice(0, Math.max(0, limit));
}
