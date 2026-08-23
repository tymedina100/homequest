import { ACHIEVEMENTS } from "./achievements";
import { getHomeLevelProgress } from "./home-progression";
import { updatePlayer } from "./players";
import { getSkillLevelProgress } from "./skills";
import type { AppState, CosmeticCollection, CosmeticType, DecorationSlot, HouseholdCosmeticCollection, PlayerId, SkillKey } from "./types";

export interface CosmeticRequirement { kind: "none" | "home-level" | "skill-level" | "achievement"; level?: number; skill?: SkillKey; achievementId?: string }
export interface CosmeticDefinition { id: string; title: string; description: string; type: CosmeticType; cost: number; slot?: DecorationSlot; requirement: CosmeticRequirement; preview: string }

export const COSMETICS: CosmeticDefinition[] = [
  { id: "night-hearth", title: "Night Hearth", description: "The original amber-lit evening palette.", type: "theme", cost: 0, requirement: { kind: "none" }, preview: "hearth" },
  { id: "morning-grove", title: "Morning Grove", description: "Soft cream, sage, and early sunlight.", type: "theme", cost: 60, requirement: { kind: "none" }, preview: "morning" },
  { id: "forest-cottage", title: "Forest Cottage", description: "Deep moss surfaces and woodland warmth.", type: "theme", cost: 70, requirement: { kind: "home-level", level: 3 }, preview: "forest" },
  { id: "midnight-mage", title: "Midnight Mage", description: "Indigo shadows with a quiet violet spark.", type: "theme", cost: 0, requirement: { kind: "achievement", achievementId: "hearth-remembers" }, preview: "mage" },
  { id: "monstera-plant", title: "Monstera Plant", description: "A generous green friend for the plant corner.", type: "decoration", slot: "plant", cost: 35, requirement: { kind: "none" }, preview: "plant" },
  { id: "warm-floor-lamp", title: "Warm Floor Lamp", description: "A taller pool of light beside the reading chair.", type: "decoration", slot: "light", cost: 30, requirement: { kind: "skill-level", skill: "cleaning", level: 2 }, preview: "lamp" },
  { id: "cozy-rug", title: "Woven Hearth Rug", description: "A soft patterned rug for the center of the room.", type: "decoration", slot: "floor", cost: 45, requirement: { kind: "none" }, preview: "rug" },
  { id: "adventure-map", title: "Adventure Map", description: "A wall map for journeys both large and domestic.", type: "decoration", slot: "wall", cost: 0, requirement: { kind: "achievement", achievementId: "leveling-up" }, preview: "map" },
  { id: "trophy-shelf", title: "Trophy Shelf", description: "A place for the little victories that became a life.", type: "decoration", slot: "shelf", cost: 0, requirement: { kind: "achievement", achievementId: "hero-kitchen" }, preview: "shelf" },
  { id: "herb-garden", title: "Kitchen Herb Garden", description: "Fresh green sprigs for a practiced cook.", type: "decoration", slot: "plant", cost: 0, requirement: { kind: "skill-level", skill: "cooking", level: 4 }, preview: "herbs" },
  { id: "title-little-things", title: "Keeper of Little Things", description: "A profile title earned by completing your own quest.", type: "title", cost: 0, requirement: { kind: "achievement", achievementId: "first-step" }, preview: "title" },
  { id: "moss-accent", title: "Moss Accent", description: "A subdued green accent for interface details.", type: "accent", cost: 25, requirement: { kind: "home-level", level: 2 }, preview: "accent" },
];

export function createDefaultHouseholdCollection(): HouseholdCosmeticCollection {
  return { ownedIds: ["night-hearth"], equippedThemeId: "night-hearth", equippedDecorationIds: {} };
}

/** Schema v4 migration helper. */
export function createDefaultCollection(): CosmeticCollection { return createDefaultHouseholdCollection(); }

export function isPersonalCosmetic(item: CosmeticDefinition): boolean { return item.type === "title"; }

export function requirementMet(state: AppState, item: CosmeticDefinition, playerId: PlayerId): boolean {
  const player = state.players[playerId];
  if (!player) return false;
  const req = item.requirement;
  if (req.kind === "none") return true;
  if (req.kind === "home-level") return getHomeLevelProgress(state.household.homeProgression).level >= (req.level ?? 1);
  if (req.kind === "skill-level" && req.skill) return getSkillLevelProgress(player.skills[req.skill]).level >= (req.level ?? 1);
  if (req.kind === "achievement") return player.achievements.some((achievement) => achievement.id === req.achievementId && achievement.unlockedAt);
  return false;
}

function collectionIds(state: AppState, item: CosmeticDefinition, playerId: PlayerId): string[] {
  return isPersonalCosmetic(item) ? state.players[playerId]?.cosmetics.ownedIds ?? [] : state.household.cosmetics.ownedIds;
}

export type CosmeticStatus = "locked" | "available" | "owned" | "equipped";
export function getCosmeticStatus(state: AppState, item: CosmeticDefinition, playerId: PlayerId): CosmeticStatus {
  const player = state.players[playerId];
  const equipped = item.type === "theme" ? state.household.cosmetics.equippedThemeId === item.id
    : item.type === "decoration" && item.slot ? state.household.cosmetics.equippedDecorationIds[item.slot] === item.id
      : item.type === "title" ? player?.cosmetics.equippedTitleId === item.id
        : state.household.cosmetics.equippedAccentId === item.id;
  if (equipped) return "equipped";
  if (collectionIds(state, item, playerId).includes(item.id)) return "owned";
  return requirementMet(state, item, playerId) ? "available" : "locked";
}

export function purchaseCosmetic(state: AppState, itemId: string, playerId: PlayerId): { state: AppState; ok: boolean; reason?: "missing" | "locked" | "owned" | "coins" } {
  const item = COSMETICS.find((entry) => entry.id === itemId); const player = state.players[playerId];
  if (!item || !player) return { state, ok: false, reason: "missing" };
  if (collectionIds(state, item, playerId).includes(itemId)) return { state, ok: false, reason: "owned" };
  if (!requirementMet(state, item, playerId)) return { state, ok: false, reason: "locked" };
  if (player.coins < item.cost) return { state, ok: false, reason: "coins" };
  let next = updatePlayer(state, playerId, (current) => ({ ...current, coins: Math.max(0, current.coins - item.cost) }));
  if (isPersonalCosmetic(item)) next = updatePlayer(next, playerId, (current) => ({ ...current, cosmetics: { ...current.cosmetics, ownedIds: [...current.cosmetics.ownedIds, itemId] } }));
  else next = { ...next, household: { ...next.household, cosmetics: { ...next.household.cosmetics, ownedIds: [...next.household.cosmetics.ownedIds, itemId] } } };
  return { ok: true, state: next };
}

export function equipCosmetic(state: AppState, itemId: string, playerId: PlayerId): AppState {
  const item = COSMETICS.find((entry) => entry.id === itemId);
  if (!item || !collectionIds(state, item, playerId).includes(itemId)) return state;
  if (item.type === "title") return updatePlayer(state, playerId, (player) => ({ ...player, cosmetics: { ...player.cosmetics, equippedTitleId: itemId } }));
  const cosmetics = state.household.cosmetics;
  if (item.type === "theme") return { ...state, household: { ...state.household, cosmetics: { ...cosmetics, equippedThemeId: itemId } } };
  if (item.type === "decoration" && item.slot) return { ...state, household: { ...state.household, cosmetics: { ...cosmetics, equippedDecorationIds: { ...cosmetics.equippedDecorationIds, [item.slot]: itemId } } } };
  return { ...state, household: { ...state.household, cosmetics: { ...cosmetics, equippedAccentId: itemId } } };
}

export function requirementLabel(item: CosmeticDefinition): string {
  const req = item.requirement;
  if (req.kind === "home-level") return `Home Level ${req.level}`;
  if (req.kind === "skill-level") return `${req.skill ? req.skill[0].toUpperCase() + req.skill.slice(1) : "Skill"} Level ${req.level}`;
  if (req.kind === "achievement") return ACHIEVEMENTS.find((achievement) => achievement.id === req.achievementId)?.hidden ? "Hidden achievement" : ACHIEVEMENTS.find((achievement) => achievement.id === req.achievementId)?.title ?? "Achievement";
  return item.cost ? `${item.cost} coins` : "Available";
}
