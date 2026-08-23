import { dateKeyFromIso, daysBetween } from "./dates";
import { getHomeLevelProgress } from "./home-progression";
import { updatePlayer } from "./players";
import { getSkillLevelProgress } from "./skills";
import type { AppState, PlayerId, QuestCategory } from "./types";

export interface AchievementReward { coins?: number; homeXp?: number; personalCosmeticIds?: string[]; householdCosmeticIds?: string[] }
export interface AchievementDefinition { id: string; title: string; description: string; icon: string; hidden?: boolean; reward: AchievementReward; criteria: AchievementCriterion }
type AchievementCriterion =
  | { type: "user-authored" } | { type: "category-day"; category: QuestCategory; count: number }
  | { type: "category-total"; category: QuestCategory; count: number } | { type: "kind-total"; kind: "rescue" | "comeback"; count: number }
  | { type: "kitchen-rescues"; count: number } | { type: "repeat-template"; count: number }
  | { type: "all-skills-week" } | { type: "home-level"; level: number }
  | { type: "all-skill-level"; level: number } | { type: "completed-total"; count: number }
  | { type: "rescue-and-comeback" } | { type: "evening" };

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first-step", title: "First Steps", description: "Complete your first user-authored quest.", icon: "spark", reward: { coins: 20, homeXp: 10, personalCosmeticIds: ["title-little-things"] }, criteria: { type: "user-authored" } },
  { id: "clean-sweep", title: "Clean Sweep", description: "Complete five Cleaning quests in one local day.", icon: "broom", reward: { coins: 35 }, criteria: { type: "category-day", category: "cleaning", count: 5 } },
  { id: "kitchen-apprentice", title: "Kitchen Apprentice", description: "Complete ten Cooking quests.", icon: "chef", reward: { coins: 40, householdCosmeticIds: ["herb-garden"] }, criteria: { type: "category-total", category: "cooking", count: 10 } },
  { id: "back-saddle", title: "Back in the Saddle", description: "Complete a Comeback Quest.", icon: "sunrise", reward: { coins: 30 }, criteria: { type: "kind-total", kind: "comeback", count: 1 } },
  { id: "rescue-ranger", title: "Rescue Ranger", description: "Complete a Rescue Quest.", icon: "shield", reward: { coins: 25 }, criteria: { type: "kind-total", kind: "rescue", count: 1 } },
  { id: "hero-kitchen", title: "Hero of the Kitchen", description: "Complete five Kitchen Rescue Quests.", icon: "flame", reward: { coins: 60, householdCosmeticIds: ["trophy-shelf"] }, criteria: { type: "kitchen-rescues", count: 5 } },
  { id: "creature-habit", title: "Creature of Habit", description: "Complete the same recurring quest ten times.", icon: "repeat", reward: { coins: 45 }, criteria: { type: "repeat-template", count: 10 } },
  { id: "jack-trades", title: "Jack of All Trades", description: "Complete a quest in all four skills during one week.", icon: "compass", reward: { coins: 50, homeXp: 20 }, criteria: { type: "all-skills-week" } },
  { id: "leveling-up", title: "The Place Is Ours", description: "Reach Home Level 3.", icon: "home", reward: { coins: 45, householdCosmeticIds: ["adventure-map"] }, criteria: { type: "home-level", level: 3 } },
  { id: "well-rounded", title: "Well Rounded", description: "Reach Level 2 in every home skill.", icon: "gem", reward: { coins: 50 }, criteria: { type: "all-skill-level", level: 2 } },
  { id: "steadfast", title: "Steadfast", description: "Complete twenty-five meaningful quests.", icon: "mountain", reward: { coins: 65, homeXp: 30 }, criteria: { type: "completed-total", count: 25 } },
  { id: "hearth-remembers", title: "The Hearth Remembers", description: "A mysterious way of returning and restoring.", icon: "moon", hidden: true, reward: { coins: 50, householdCosmeticIds: ["midnight-mage"] }, criteria: { type: "rescue-and-comeback" } },
  { id: "afterglow", title: "Afterglow", description: "A hidden moment found after the day grows quiet.", icon: "stars", hidden: true, reward: { coins: 25 }, criteria: { type: "evening" } },
];

const completed = (state: AppState, playerId: PlayerId) => state.household.quests.filter((quest) => quest.status === "completed" && quest.lastCompletedAt && quest.completedByPlayerId === playerId);

export function meetsAchievement(state: AppState, definition: AchievementDefinition, playerId: PlayerId): boolean {
  const player = state.players[playerId]; if (!player) return false;
  const quests = completed(state, playerId); const c = definition.criteria;
  if (c.type === "user-authored") return quests.some((quest) => state.household.questTemplates.find((template) => template.id === quest.templateId)?.source === "user");
  if (c.type === "category-total") return player.progression.categoryStats[c.category].completed >= c.count;
  if (c.type === "kind-total") return quests.filter((quest) => quest.kind === c.kind).length >= c.count;
  if (c.type === "kitchen-rescues") return quests.filter((quest) => quest.kind === "rescue" && (quest.statEffects.kitchen ?? 0) > 0).length >= c.count;
  if (c.type === "completed-total") return player.progression.completedQuestCount >= c.count;
  if (c.type === "home-level") return getHomeLevelProgress(state.household.homeProgression).level >= c.level;
  if (c.type === "all-skill-level") return Object.values(player.skills).every((skill) => getSkillLevelProgress(skill).level >= c.level);
  if (c.type === "repeat-template") { const counts = quests.reduce<Record<string, number>>((all, quest) => ({ ...all, [quest.templateId ?? quest.id]: (all[quest.templateId ?? quest.id] ?? 0) + 1 }), {}); return Object.values(counts).some((count) => count >= c.count); }
  if (c.type === "category-day") { const counts = quests.filter((quest) => quest.category === c.category).reduce<Record<string, number>>((all, quest) => { const date = dateKeyFromIso(quest.lastCompletedAt!); return { ...all, [date]: (all[date] ?? 0) + 1 }; }, {}); return Object.values(counts).some((count) => count >= c.count); }
  if (c.type === "all-skills-week") return quests.some((anchor) => { const date = dateKeyFromIso(anchor.lastCompletedAt!); const window = quests.filter((quest) => Math.abs(daysBetween(date, dateKeyFromIso(quest.lastCompletedAt!))) <= 6); return new Set(window.map((quest) => quest.category)).size === 4; });
  if (c.type === "rescue-and-comeback") return quests.some((quest) => quest.kind === "rescue") && quests.some((quest) => quest.kind === "comeback");
  if (c.type === "evening") return quests.some((quest) => new Date(quest.lastCompletedAt!).getHours() >= 20);
  return false;
}

export function evaluateAchievements(state: AppState, playerId: PlayerId, unlockedAt: string): { state: AppState; unlockedIds: string[]; cosmeticIds: string[]; coins: number; homeXp: number } {
  let next = state; const unlockedIds: string[] = []; const cosmeticIds: string[] = []; let coins = 0; let homeXp = 0;
  for (const definition of ACHIEVEMENTS) {
    const player = next.players[playerId];
    if (!player || player.achievements.some((item) => item.id === definition.id && item.unlockedAt) || !meetsAchievement(next, definition, playerId)) continue;
    const personal = definition.reward.personalCosmeticIds ?? []; const household = definition.reward.householdCosmeticIds ?? [];
    unlockedIds.push(definition.id); coins += definition.reward.coins ?? 0; homeXp += definition.reward.homeXp ?? 0; cosmeticIds.push(...personal, ...household);
    next = updatePlayer(next, playerId, (current) => ({
      ...current,
      coins: current.coins + (definition.reward.coins ?? 0),
      achievements: [...current.achievements.filter((item) => item.id !== definition.id), { id: definition.id, unlockedAt }],
      cosmetics: { ...current.cosmetics, ownedIds: [...new Set([...current.cosmetics.ownedIds, ...personal])] },
    }));
    next = { ...next, household: { ...next.household, homeProgression: { totalXp: next.household.homeProgression.totalXp + (definition.reward.homeXp ?? 0) }, cosmetics: { ...next.household.cosmetics, ownedIds: [...new Set([...next.household.cosmetics.ownedIds, ...household])] } } };
  }
  return { state: next, unlockedIds, cosmeticIds, coins, homeXp };
}
