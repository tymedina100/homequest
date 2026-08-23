import { SKILL_XP_MAX, SKILL_XP_MIN } from "./game-balance";
import type { AppState, Quest, QuestCategory, SkillKey, SkillProgress } from "./types";

export interface SkillPerk { id: string; skill: SkillKey; level: number; title: string; description: string }

export const SKILL_PERKS: SkillPerk[] = [
  { id: "cleaning-quick-hands", skill: "cleaning", level: 2, title: "Quick Hands", description: "Short Cleaning quests earn +2 skill XP." },
  { id: "cleaning-momentum", skill: "cleaning", level: 4, title: "Momentum", description: "Related Cleaning follow-ups earn +3 skill XP." },
  { id: "cleaning-rescue", skill: "cleaning", level: 6, title: "Rescue Specialist", description: "Cleaning Rescues earn +3 coins." },
  { id: "cooking-pantry-sense", skill: "cooking", level: 2, title: "Pantry Sense", description: "Cooking while Use Soon food is waiting earns +2 skill XP." },
  { id: "cooking-herbalist", skill: "cooking", level: 4, title: "Kitchen Herbalist", description: "Unlocks the Herb Garden collection reward." },
  { id: "cooking-hearth-chef", skill: "cooking", level: 6, title: "Hearth Chef", description: "Substantial Cooking quests earn +3 skill XP." },
  { id: "organization-clear-path", skill: "organization", level: 2, title: "Clear Path", description: "Focused Organization quests earn +2 skill XP." },
  { id: "organization-flow", skill: "organization", level: 4, title: "Room to Flow", description: "Organization momentum earns +3 skill XP." },
  { id: "organization-curator", skill: "organization", level: 6, title: "Home Curator", description: "Unlocks the Adventure Map at a lower price." },
  { id: "homekeeping-steady", skill: "homekeeping", level: 2, title: "Steady Hands", description: "Meaningful recurring upkeep earns +2 skill XP." },
  { id: "homekeeping-caretaker", skill: "homekeeping", level: 4, title: "Caretaker", description: "Comeback quests earn +3 coins." },
  { id: "homekeeping-guardian", skill: "homekeeping", level: 6, title: "Hearth Guardian", description: "Unlocks the Keeper title." },
];

export function categoryToSkill(category: QuestCategory): SkillKey { return category; }

export function skillXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let current = 1; current < level; current += 1) total += 80 + (current - 1) * 45;
  return total;
}

export function getSkillLevelProgress(input: SkillProgress | number) {
  const totalXp = typeof input === "number" ? input : input.totalXp;
  let level = 1;
  while (totalXp >= skillXpForLevel(level + 1)) level += 1;
  const start = skillXpForLevel(level); const next = skillXpForLevel(level + 1);
  return { level, totalXp, xpIntoLevel: totalXp - start, xpNeeded: next - start, percent: Math.round(((totalXp - start) / (next - start)) * 100) };
}

function hasRecentRelatedCompletion(state: AppState, quest: Quest, at: string): boolean {
  const time = new Date(at).getTime();
  return state.quests.some((item) => item.status === "completed" && item.category === quest.category && item.lastCompletedAt && time - new Date(item.lastCompletedAt).getTime() >= 0 && time - new Date(item.lastCompletedAt).getTime() <= 90 * 60_000);
}

export function calculateSkillXp(state: AppState, quest: Quest, completedAt: string): number {
  const skill = categoryToSkill(quest.category);
  const level = getSkillLevelProgress(state.skills[skill]).level;
  const timeFactor = quest.estimatedMinutes < 5 ? 0.55 : quest.estimatedMinutes < 10 ? 0.82 : 1;
  const effortFactor = quest.effort === "high" ? 1.25 : quest.effort === "medium" ? 1.1 : 1;
  const kindFactor = quest.kind === "rescue" ? 1.15 : quest.kind === "comeback" ? 1.1 : 1;
  let xp = Math.round(quest.xpReward * 0.55 * timeFactor * effortFactor * kindFactor);
  if (skill === "cleaning" && level >= 2 && quest.estimatedMinutes < 10) xp += 2;
  if ((skill === "cleaning" || skill === "organization") && level >= 4 && hasRecentRelatedCompletion(state, quest, completedAt)) xp += 3;
  if (skill === "cooking" && level >= 2 && state.inventory.some((item) => item.useSoon)) xp += 2;
  if (skill === "cooking" && level >= 6 && quest.estimatedMinutes >= 20) xp += 3;
  if (skill === "organization" && level >= 2 && quest.estimatedMinutes >= 15) xp += 2;
  if (skill === "homekeeping" && level >= 2 && quest.recurrence && !["manual", "as-needed"].includes(quest.recurrence.cadence)) xp += 2;
  return Math.max(SKILL_XP_MIN, Math.min(SKILL_XP_MAX, xp));
}

export function perksForLevel(skill: SkillKey, level: number): string[] {
  return SKILL_PERKS.filter((perk) => perk.skill === skill && level >= perk.level).map((perk) => perk.id);
}
