import { createSeedState, seedQuestTemplates } from "@/data/seed";
import { defaultAvatarFor, normalizeAvatar } from "./avatar";
import { toLocalDateKey } from "./dates";
import { createQuestOccurrence } from "./templates";
import { createBathroomZone, createKitchenZone } from "./zones";
import type { AppState, AvatarConfig, PlayerState, Progression, QuestTemplate, SkillProgression } from "./types";

export type HomePriority = "kitchen" | "laundry" | "cleaning" | "cooking" | "food-waste" | "organization" | "supplies" | "upkeep";

export interface OnboardingPlayer {
  id: string;
  name: string;
  avatar: AvatarConfig;
}

export interface OnboardingDraft {
  householdName: string;
  players: OnboardingPlayer[];
  priorities: HomePriority[];
  starterTemplateIds: string[];
}

const zeroProgression = (): Progression => ({ totalXp: 0, completedQuestCount: 0, categoryStats: { cleaning: { xp: 0, completed: 0 }, cooking: { xp: 0, completed: 0 }, organization: { xp: 0, completed: 0 }, homekeeping: { xp: 0, completed: 0 } } });
const zeroSkills = (): SkillProgression => ({ cleaning: { totalXp: 0, completedQuestCount: 0, unlockedPerkIds: [] }, cooking: { totalXp: 0, completedQuestCount: 0, unlockedPerkIds: [] }, organization: { totalXp: 0, completedQuestCount: 0, unlockedPerkIds: [] }, homekeeping: { totalXp: 0, completedQuestCount: 0, unlockedPerkIds: [] } });

export const priorityLabels: Record<HomePriority, string> = { kitchen: "Dishes & kitchen", laundry: "Laundry", cleaning: "Cleaning", cooking: "Cooking", "food-waste": "Food waste", organization: "Organization", supplies: "Household supplies", upkeep: "General upkeep" };

function slug(value: string, fallback: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || fallback;
}

export function createOnboardingPlayer(name = "Adventurer", index = 1): OnboardingPlayer {
  const safeName = name.trim() || "Adventurer";
  const id = `player-${slug(safeName, "adventurer")}-${index}`;
  return { id, name: safeName, avatar: defaultAvatarFor(id) };
}

export function suggestedStarterTemplateIds(priorities: HomePriority[]): string[] {
  const wanted = new Set(priorities);
  const ids = seedQuestTemplates.filter((template) =>
    (wanted.has("kitchen") && ["dishwasher", "counters"].includes(template.id)) ||
    (wanted.has("laundry") && template.id === "laundry") ||
    (wanted.has("cleaning") && template.category === "cleaning") ||
    (wanted.has("cooking") && template.category === "cooking") ||
    (wanted.has("organization") && template.category === "organization") ||
    (wanted.has("upkeep") && template.category === "homekeeping") ||
    (wanted.has("supplies") && template.id === "trash") ||
    (wanted.has("food-waste") && template.id === "dinner"),
  ).map((template) => template.id);
  return ids.length ? [...new Set(ids)].slice(0, 6) : ["dishwasher", "counters", "laundry"];
}

function createPlayer(input: OnboardingPlayer, today: ReturnType<typeof toLocalDateKey>, createdAt: string): PlayerState {
  return { id: input.id, name: input.name.trim() || "Adventurer", createdAt, coins: 0, progression: zeroProgression(), skills: zeroSkills(), achievements: [], cosmetics: { ownedIds: [] }, avatar: normalizeAvatar(input.avatar, input.id), dailyContext: { date: today, energy: "good", availableMinutes: 15 }, dailyChest: { date: today, qualifyingQuestIds: [], status: "locked" } };
}

/** Creates a complete household only after the final onboarding action. */
export function createOnboardedState(draft: OnboardingDraft, now = new Date()): AppState {
  const today = toLocalDateKey(now);
  const uniquePlayers = draft.players.filter((player, index, all) => player.name.trim() && all.findIndex((item) => item.id === player.id) === index).slice(0, 4);
  if (!uniquePlayers.length) throw new Error("Add at least one adventurer before beginning.");
  const base = createSeedState(now);
  const selectedIds = new Set(draft.starterTemplateIds);
  const templates: QuestTemplate[] = seedQuestTemplates.filter((template) => selectedIds.has(template.id)).map((template) => ({ ...template, createdAt: now.toISOString(), updatedAt: now.toISOString(), source: "starter" }));
  const players = Object.fromEntries(uniquePlayers.map((player) => [player.id, createPlayer(player, today, now.toISOString())])) as AppState["players"];
  const name = draft.householdName.trim() || "Our Home";
  return {
    schemaVersion: 7,
    household: { ...base.household, id: `household-${slug(name, "home")}`, name, playerIds: uniquePlayers.map((player) => player.id), quests: templates.filter((template) => template.recurrence.cadence === "manual" || template.recurrence.cadence === "as-needed" || template.recurrence.cadence === "daily").map((template) => createQuestOccurrence(template, today)), questTemplates: templates, inventory: [], homeProgression: { totalXp: 0 }, homeStats: { cleanliness: 50, organization: 50, supplies: 50, kitchen: 50 }, zones: { kitchen: createKitchenZone({ cleanliness: 50, organization: 50, supplies: 50, kitchen: 50 }), bathroom: createBathroomZone({ cleanliness: 50, organization: 50, supplies: 50, kitchen: 50 }) }, lifecycle: { lastLifecycleDate: today, lastOpenedDate: today, lastMeaningfulActivityDate: today, dailyHistory: [], questHistory: [] } },
    players,
    session: { activePlayerId: uniquePlayers[0].id, preferences: { reducedMotion: false } },
  };
}
