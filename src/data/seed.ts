import type { AppState, Quest, QuestTemplate, Recipe } from "@/domain/types";
import { toLocalDateKey } from "@/domain/dates";
import { createDefaultCollection } from "@/domain/cosmetics";

const createdAt = "2026-08-22T08:00:00.000Z";

export const seedQuests: Quest[] = [
  { id: "dishwasher", templateId: "dishwasher", title: "Run the dishwasher", description: "Load the last few dishes and start a cycle.", category: "cleaning", status: "available", xpReward: 30, estimatedMinutes: 5, effort: "low", urgency: "soon", recurrence: { cadence: "daily" }, escalation: "rescue-eligible", statEffects: { kitchen: 10, cleanliness: 5 }, createdAt, recommendation: { momentum: 8 }, comebackEligible: true },
  { id: "dinner", templateId: "dinner", title: "Make a simple dinner", description: "Turn tonight’s ingredients into something cozy.", category: "cooking", status: "available", xpReward: 55, estimatedMinutes: 25, effort: "medium", urgency: "today", recurrence: { cadence: "manual" }, escalation: "non-escalating", statEffects: { kitchen: 7, supplies: -3 }, createdAt, recommendation: { momentum: 4 } },
  { id: "counters", templateId: "counters", title: "Wipe kitchen counters", description: "Clear crumbs and give the counters a quick wipe.", category: "cleaning", status: "available", xpReward: 20, estimatedMinutes: 7, effort: "low", urgency: "gentle", recurrence: { cadence: "as-needed" }, escalation: "gentle", statEffects: { cleanliness: 9, kitchen: 5 }, createdAt, recommendation: { momentum: 6 }, comebackEligible: true },
  { id: "trash", templateId: "trash", title: "Take out the trash", description: "Tie the bag, take it out, and add a fresh liner.", category: "homekeeping", status: "available", xpReward: 25, estimatedMinutes: 6, effort: "low", urgency: "today", recurrence: { cadence: "weekdays", daysOfWeek: [2, 5] }, escalation: "rescue-eligible", statEffects: { cleanliness: 7, organization: 3 }, createdAt, recommendation: { momentum: 7 }, comebackEligible: true },
  { id: "laundry", templateId: "laundry", title: "Put away one laundry basket", description: "Just one basket—future you gets the clear chair.", category: "organization", status: "available", xpReward: 40, estimatedMinutes: 15, effort: "medium", urgency: "soon", recurrence: { cadence: "weekly", daysOfWeek: [6] }, escalation: "rescue-eligible", statEffects: { organization: 12, cleanliness: 3 }, createdAt, recommendation: { momentum: 3 }, comebackEligible: true },
];

/** Milestone 0.3 keeps the existing starter chores as real reusable templates. */
export const seedQuestTemplates: QuestTemplate[] = seedQuests.map((quest) => ({
  id: quest.templateId ?? quest.id,
  title: quest.title,
  description: quest.description,
  category: quest.category,
  estimatedMinutes: quest.estimatedMinutes,
  effort: quest.effort,
  recurrence: quest.recurrence ?? { cadence: "manual" },
  urgency: quest.urgency,
  escalation: quest.escalation ?? "non-escalating",
  statEffects: quest.statEffects,
  active: true,
  createdAt: quest.createdAt,
  updatedAt: quest.createdAt,
  rewardMode: "manual",
  manualXpReward: quest.xpReward,
  recommendation: quest.recommendation,
  source: "starter",
}));

export const recipes: Recipe[] = [
  { id: "quesadilla", name: "Golden veggie quesadillas", description: "Crisp tortillas, melted cheese, and quick peppers.", prepMinutes: 12, ingredients: ["tortillas", "cheddar", "bell pepper"], tags: ["easy", "vegetarian"] },
  { id: "pasta", name: "Tomato herb pasta", description: "A bright pantry pasta with spinach and parmesan.", prepMinutes: 22, ingredients: ["pasta", "tomato sauce", "spinach", "parmesan"], tags: ["use-it-up", "weeknight"] },
  { id: "rice-bowl", name: "Cozy egg rice bowl", description: "Warm rice, a jammy egg, greens, and savory sauce.", prepMinutes: 18, ingredients: ["rice", "eggs", "spinach", "soy sauce"], tags: ["comfort", "flexible"], favorite: true },
];

export function createSeedState(now = new Date()): AppState {
  const today = toLocalDateKey(now);
  return {
    schemaVersion: 4,
    player: { name: "Tyler", coins: 84 },
    quests: seedQuests.map((quest) => ({ ...quest, occurrenceDate: today })),
    questTemplates: seedQuestTemplates.map((template) => ({ ...template })),
    homeStats: { cleanliness: 62, organization: 48, supplies: 76, kitchen: 55 },
    inventory: [
      { id: "spinach", name: "Baby spinach", category: "produce", quantity: 0.5, unit: "bag", storageLocation: "fridge", expiresAt: "2026-08-24", useSoon: true, ingredientTags: ["spinach", "greens"] },
      { id: "eggs", name: "Eggs", category: "dairy", quantity: 8, unit: "eggs", storageLocation: "fridge", lowStockThreshold: 4, ingredientTags: ["egg", "eggs"] },
      { id: "cheddar", name: "Sharp cheddar", category: "dairy", quantity: 1, unit: "block", storageLocation: "fridge", ingredientTags: ["cheddar", "cheese"] },
      { id: "pepper", name: "Bell pepper", category: "produce", quantity: 2, unit: "peppers", storageLocation: "fridge", useSoon: true, ingredientTags: ["bell pepper", "pepper"] },
      { id: "peas", name: "Green peas", category: "frozen", quantity: 1, unit: "bag", storageLocation: "freezer", ingredientTags: ["peas", "vegetable"] },
      { id: "berries", name: "Mixed berries", category: "frozen", quantity: 1, unit: "bag", storageLocation: "freezer", ingredientTags: ["berries", "fruit"] },
      { id: "pasta", name: "Rigatoni pasta", category: "grains", quantity: 1, unit: "box", storageLocation: "pantry", lowStockThreshold: 1, ingredientTags: ["pasta", "rigatoni"] },
      { id: "sauce", name: "Tomato sauce", category: "canned", quantity: 2, unit: "jars", storageLocation: "pantry", ingredientTags: ["tomato sauce", "tomato"] },
      { id: "rice", name: "Jasmine rice", category: "grains", quantity: 2, unit: "lb", storageLocation: "pantry", ingredientTags: ["rice"] },
      { id: "tortilla", name: "Flour tortillas", category: "bread", quantity: 6, unit: "tortillas", storageLocation: "pantry", ingredientTags: ["tortillas"] },
      { id: "soy", name: "Soy sauce", category: "condiment", quantity: 1, unit: "bottle", storageLocation: "pantry", ingredientTags: ["soy sauce"] },
    ],
    progression: {
      totalXp: 275,
      completedQuestCount: 9,
      categoryStats: {
        cooking: { xp: 80, completed: 2 },
        cleaning: { xp: 100, completed: 3 },
        organization: { xp: 55, completed: 2 },
        homekeeping: { xp: 40, completed: 2 },
      },
    },
    homeProgression: { totalXp: 275 },
    skills: {
      cleaning: { totalXp: 100, completedQuestCount: 3, unlockedPerkIds: ["cleaning-quick-hands"] },
      cooking: { totalXp: 80, completedQuestCount: 2, unlockedPerkIds: ["cooking-pantry-sense"] },
      organization: { totalXp: 55, completedQuestCount: 2, unlockedPerkIds: [] },
      homekeeping: { totalXp: 40, completedQuestCount: 2, unlockedPerkIds: [] },
    },
    achievements: [{ id: "first-step", unlockedAt: createdAt }],
    cosmetics: { ...createDefaultCollection(), ownedIds: ["night-hearth", "title-little-things"], equippedTitleId: "title-little-things" },
    dailyChest: { date: today, qualifyingQuestIds: [], status: "locked" },
    preferences: { energy: "medium", availableMinutes: 20, reducedMotion: false },
    dailyContext: { date: today, energy: "good", availableMinutes: 15 },
    lifecycle: { lastLifecycleDate: today, lastOpenedDate: today, lastMeaningfulActivityDate: today, dailyHistory: [], questHistory: [] },
  };
}
