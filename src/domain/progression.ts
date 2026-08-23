import type { Progression, Quest, QuestCategory } from "./types";

export const LEVEL_BASE_XP = 120;
export const LEVEL_STEP_XP = 40;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += LEVEL_BASE_XP + (current - 1) * LEVEL_STEP_XP;
  }
  return total;
}

export function getLevelProgress(totalXp: number) {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level += 1;
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return {
    level,
    xpIntoLevel: totalXp - levelStartXp,
    xpNeeded: nextLevelXp - levelStartXp,
    nextLevelXp,
    percent: Math.round(((totalXp - levelStartXp) / (nextLevelXp - levelStartXp)) * 100),
  };
}

export function awardQuestXp(progression: Progression, quest: Quest): Progression {
  const category: QuestCategory = quest.category;
  return {
    totalXp: progression.totalXp + quest.xpReward,
    completedQuestCount: progression.completedQuestCount + 1,
    categoryStats: {
      ...progression.categoryStats,
      [category]: {
        xp: progression.categoryStats[category].xp + quest.xpReward,
        completed: progression.categoryStats[category].completed + 1,
      },
    },
  };
}
