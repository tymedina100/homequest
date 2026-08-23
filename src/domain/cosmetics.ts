import { ACHIEVEMENTS } from "./achievements";
import { getHomeLevelProgress } from "./home-progression";
import { updatePlayer } from "./players";
import { getSkillLevelProgress } from "./skills";
import { getBathroomLevelProgress, getZoneLevelProgress } from "./zones";
import type { AppState, CosmeticCollection, CosmeticType, DecorationSlot, HouseholdCosmeticCollection, PlayerId, SkillKey, ZoneDecorationSlot, ZoneId } from "./types";

export interface CosmeticRequirement { kind: "none" | "home-level" | "zone-level" | "skill-level" | "achievement"; level?: number; skill?: SkillKey; achievementId?: string; zoneId?: ZoneId }
export interface CosmeticDefinition { id: string; title: string; description: string; type: CosmeticType; cost: number; slot?: DecorationSlot; zoneId?: ZoneId; zoneSlot?: ZoneDecorationSlot; requirement: CosmeticRequirement; preview: string }

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
  { id: "kitchen-herb-garden", title: "Herb Garden", description: "A bright row of household-grown herbs by the window.", type: "decoration", zoneId: "kitchen", zoneSlot: "plant", cost: 30, requirement: { kind: "zone-level", zoneId: "kitchen", level: 3 }, preview: "kitchen-herbs" },
  { id: "coffee-station", title: "Coffee Station", description: "A shared morning corner with mugs ready for both adventurers.", type: "decoration", zoneId: "kitchen", zoneSlot: "counter", cost: 28, requirement: { kind: "none" }, preview: "coffee" },
  { id: "warm-pendant-light", title: "Warm Pendant Light", description: "A golden pool of light over the Kitchen table.", type: "decoration", zoneId: "kitchen", zoneSlot: "lighting", cost: 45, requirement: { kind: "zone-level", zoneId: "kitchen", level: 5 }, preview: "pendant" },
  { id: "fridge-magnet-set", title: "Fridge Magnet Set", description: "Tiny souvenirs and notes that make the fridge feel lived in.", type: "decoration", zoneId: "kitchen", zoneSlot: "wall", cost: 12, requirement: { kind: "none" }, preview: "magnets" },
  { id: "hanging-pans", title: "Hanging Pans", description: "Well-loved cookware displayed within easy reach.", type: "decoration", zoneId: "kitchen", zoneSlot: "shelf", cost: 35, requirement: { kind: "skill-level", skill: "cooking", level: 3 }, preview: "pans" },
  { id: "window-plant", title: "Window Plant", description: "A leafy companion for the sunniest Kitchen ledge.", type: "decoration", zoneId: "kitchen", zoneSlot: "plant", cost: 22, requirement: { kind: "skill-level", skill: "cleaning", level: 2 }, preview: "window-plant" },
  { id: "cozy-kitchen-runner", title: "Cozy Runner", description: "A soft woven path between sink and stove.", type: "decoration", zoneId: "kitchen", zoneSlot: "floor", cost: 32, requirement: { kind: "zone-level", zoneId: "kitchen", level: 3 }, preview: "runner" },
  { id: "recipe-board", title: "Recipe Board", description: "A chalkboard for reliable favorites and small experiments.", type: "decoration", zoneId: "kitchen", zoneSlot: "wall", cost: 50, requirement: { kind: "zone-level", zoneId: "kitchen", level: 8 }, preview: "recipe-board" },
  { id: "bathroom-candle", title: "Soft Candle", description: "A small warm glow for unhurried evenings.", type: "decoration", zoneId: "bathroom", zoneSlot: "counter", cost: 18, requirement: { kind: "none" }, preview: "bathroom-candle" },
  { id: "bathroom-plant", title: "Shower Plant", description: "A hardy green companion for the humid corner.", type: "decoration", zoneId: "bathroom", zoneSlot: "plant", cost: 26, requirement: { kind: "zone-level", zoneId: "bathroom", level: 3 }, preview: "bathroom-plant" },
  { id: "bathroom-sconce", title: "Warm Sconce", description: "Soft light that makes the mirror feel kinder.", type: "decoration", zoneId: "bathroom", zoneSlot: "lighting", cost: 34, requirement: { kind: "skill-level", skill: "cleaning", level: 3 }, preview: "bathroom-sconce" },
  { id: "bathroom-art", title: "Tiny Gallery", description: "A small print that gives the wall some personality.", type: "decoration", zoneId: "bathroom", zoneSlot: "wall", cost: 16, requirement: { kind: "none" }, preview: "bathroom-art" },
  { id: "bathroom-towel-ladder", title: "Towel Ladder", description: "A simple place for fresh towels to wait.", type: "decoration", zoneId: "bathroom", zoneSlot: "shelf", cost: 30, requirement: { kind: "zone-level", zoneId: "bathroom", level: 5 }, preview: "bathroom-towels" },
  { id: "bathroom-mat", title: "Cloud Bath Mat", description: "A soft landing after a shower.", type: "decoration", zoneId: "bathroom", zoneSlot: "floor", cost: 24, requirement: { kind: "none" }, preview: "bathroom-mat" },
  { id: "bathroom-amber-jars", title: "Amber Jars", description: "Useful everyday things, gathered with care.", type: "decoration", zoneId: "bathroom", zoneSlot: "counter", cost: 38, requirement: { kind: "zone-level", zoneId: "bathroom", level: 8 }, preview: "bathroom-jars" },
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
  if (req.kind === "zone-level" && req.zoneId) return (req.zoneId === "bathroom" ? getBathroomLevelProgress(state.household.zones.bathroom.totalXp) : getZoneLevelProgress(state.household.zones.kitchen.totalXp)).level >= (req.level ?? 1);
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
    : item.type === "decoration" && item.zoneId && item.zoneSlot ? state.household.zones[item.zoneId].cosmetics.equippedDecorationIds[item.zoneSlot] === item.id
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
  if (item.type === "decoration" && item.zoneId && item.zoneSlot) {
    const zone = state.household.zones[item.zoneId];
    return { ...state, household: { ...state.household, zones: { ...state.household.zones, [item.zoneId]: { ...zone, cosmetics: { ...zone.cosmetics, equippedDecorationIds: { ...zone.cosmetics.equippedDecorationIds, [item.zoneSlot]: itemId } } } } } };
  }
  if (item.type === "decoration" && item.slot) return { ...state, household: { ...state.household, cosmetics: { ...cosmetics, equippedDecorationIds: { ...cosmetics.equippedDecorationIds, [item.slot]: itemId } } } };
  return { ...state, household: { ...state.household, cosmetics: { ...cosmetics, equippedAccentId: itemId } } };
}

export function requirementLabel(item: CosmeticDefinition): string {
  const req = item.requirement;
  if (req.kind === "home-level") return `Home Level ${req.level}`;
  if (req.kind === "zone-level") return `${req.zoneId === "bathroom" ? "Bathroom" : "Kitchen"} Level ${req.level}`;
  if (req.kind === "skill-level") return `${req.skill ? req.skill[0].toUpperCase() + req.skill.slice(1) : "Skill"} Level ${req.level}`;
  if (req.kind === "achievement") return ACHIEVEMENTS.find((achievement) => achievement.id === req.achievementId)?.hidden ? "Hidden achievement" : ACHIEVEMENTS.find((achievement) => achievement.id === req.achievementId)?.title ?? "Achievement";
  return item.cost ? `${item.cost} coins` : "Available";
}
