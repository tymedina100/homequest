export type QuestCategory = "cleaning" | "cooking" | "organization" | "homekeeping";
export type QuestStatus = "available" | "completed" | "archived";
export type EffortLevel = "low" | "medium" | "high";
export type Urgency = "gentle" | "soon" | "today";
export type HomeStatKey = "cleanliness" | "organization" | "supplies" | "kitchen";
export type StorageLocation = "fridge" | "freezer" | "pantry";
export type QuestKind = "normal" | "rescue" | "comeback";
export type EscalationPolicy = "non-escalating" | "gentle" | "rescue-eligible";
export type LocalDateKey = `${number}-${number}-${number}`;
export type Daypart = "morning" | "afternoon" | "evening" | "anytime";
export type DailyEnergy = "drained" | "low" | "good" | "locked-in";
export type RewardMode = "automatic" | "manual";
export type SkillKey = QuestCategory;
export type CosmeticType = "theme" | "decoration" | "title" | "accent";
export type DecorationSlot = "plant" | "light" | "floor" | "wall" | "shelf";
export type ZoneId = "kitchen";
export type QuestZoneId = ZoneId | "household";
export type ZoneType = "kitchen";
export type KitchenConditionKey = "dishes" | "counters" | "floor" | "trash" | "food";
export type KitchenCondition = Record<KitchenConditionKey, number>;
export type ZoneDecorationSlot = "counter" | "wall" | "shelf" | "plant" | "lighting" | "floor";
export type PlayerId = string;
export type SkinTone = "porcelain" | "peach" | "golden" | "warm" | "brown" | "deep";
export type HairStyle = "short" | "waves" | "curls" | "bun" | "mohawk";
export type HairColor = "espresso" | "chestnut" | "copper" | "golden" | "midnight" | "rose";
export type OutfitStyle = "tee" | "sweater" | "overalls" | "apron" | "hoodie";
export type OutfitColor = "moss" | "amber" | "berry" | "ocean" | "plum" | "cream";
export type AvatarAccessory = "none" | "glasses" | "earrings" | "headband" | "cap";
export type AvatarExpression = "content" | "bright" | "focused" | "sleepy";

export interface QuestRecurrence {
  cadence: "daily" | "weekly" | "weekdays" | "interval" | "manual" | "as-needed";
  /** Sunday is 0, matching Date#getDay. */
  daysOfWeek?: number[];
  interval?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  status: QuestStatus;
  xpReward: number;
  estimatedMinutes: number;
  effort: EffortLevel;
  urgency: Urgency;
  recurrence?: QuestRecurrence;
  /** Stable identity shared by all occurrences of a recurring task. */
  templateId?: string;
  occurrenceDate?: LocalDateKey;
  kind?: QuestKind;
  escalation?: EscalationPolicy;
  missedCount?: number;
  rescueOf?: string;
  lifecycleNote?: string;
  statEffects: Partial<Record<HomeStatKey, number>>;
  /** Structured room ownership. Household is the safe default for legacy/custom work. */
  zoneId: QuestZoneId;
  /** Room-local condition changes, applied only by the completion transaction. */
  zoneEffects?: Partial<KitchenCondition>;
  createdAt: string;
  lastCompletedAt?: string;
  dueAt?: string;
  dependsOn?: string[];
  recommendation?: { ignoredDays?: number; momentum?: number };
  comebackEligible?: boolean;
  /** The stable player ID responsible for this completed occurrence. */
  completedByPlayerId?: PlayerId;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  estimatedMinutes: number;
  effort: EffortLevel;
  recurrence: QuestRecurrence;
  urgency: Urgency;
  escalation: EscalationPolicy;
  statEffects: Partial<Record<HomeStatKey, number>>;
  zoneId: QuestZoneId;
  zoneEffects?: Partial<KitchenCondition>;
  preferredDaypart?: Daypart;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  rewardMode: RewardMode;
  manualXpReward?: number;
  recommendation?: { momentum?: number };
  source?: "starter" | "user";
}

export interface DailyContext {
  date: LocalDateKey;
  energy: DailyEnergy;
  availableMinutes: number;
}

export type HomeStats = Record<HomeStatKey, number>;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  specificLocation?: string;
  purchaseDate?: string;
  openedDate?: string;
  expiresAt?: string;
  useSoon?: boolean;
  lowStockThreshold?: number;
  notes?: string;
  ingredientTags: string[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepMinutes: number;
  ingredients: string[];
  tags: string[];
  favorite?: boolean;
}

export interface MealSuggestion {
  recipe: Recipe;
  available: string[];
  missing: string[];
  kind: "easiest" | "use-it-up" | "comfort";
  reason: string;
  score: number;
}

export interface CategoryStats {
  xp: number;
  completed: number;
}

export interface HomeProgression {
  totalXp: number;
}

export interface SkillProgress {
  totalXp: number;
  completedQuestCount: number;
  unlockedPerkIds: string[];
}

export type SkillProgression = Record<SkillKey, SkillProgress>;

export interface Progression {
  totalXp: number;
  completedQuestCount: number;
  categoryStats: Record<QuestCategory, CategoryStats>;
}

export interface AchievementState {
  id: string;
  unlockedAt?: string;
}

export interface HouseholdCosmeticCollection {
  ownedIds: string[];
  equippedThemeId: string;
  equippedDecorationIds: Partial<Record<DecorationSlot, string>>;
  equippedAccentId?: string;
}

export interface ZoneCosmeticCollection {
  equippedDecorationIds: Partial<Record<ZoneDecorationSlot, string>>;
}

export interface ZoneState {
  id: ZoneId;
  displayName: string;
  type: ZoneType;
  totalXp: number;
  condition: KitchenCondition;
  cosmetics: ZoneCosmeticCollection;
  metadata: { initializedFromSchema: number };
}

export interface PlayerCosmeticCollection {
  ownedIds: string[];
  equippedTitleId?: string;
}

/** @deprecated Schema v4 only. Retained for lossless local-save migration. */
export interface CosmeticCollection extends HouseholdCosmeticCollection {
  equippedTitleId?: string;
}

export interface DailyChestState {
  date: LocalDateKey;
  qualifyingQuestIds: string[];
  status: "locked" | "ready" | "claimed";
  claimedAt?: string;
}

export interface UserPreferences {
  reducedMotion: boolean;
}

export interface DailyHistoryEntry {
  date: LocalDateKey;
  completedQuestIds: string[];
  missedQuestIds: string[];
}

export interface QuestHistoryEntry {
  questId: string;
  templateId?: string;
  date: LocalDateKey;
  event: "completed" | "missed" | "rescue-created" | "comeback-created";
  playerId?: PlayerId;
}

export interface DailyLifecycleState {
  lastLifecycleDate?: LocalDateKey;
  lastOpenedDate?: LocalDateKey;
  lastMeaningfulActivityDate?: LocalDateKey;
  dailyHistory: DailyHistoryEntry[];
  questHistory: QuestHistoryEntry[];
}

export interface AvatarConfig {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  outfit: OutfitStyle;
  outfitColor: OutfitColor;
  accessory: AvatarAccessory;
  expression: AvatarExpression;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  createdAt: string;
  coins: number;
  progression: Progression;
  skills: SkillProgression;
  achievements: AchievementState[];
  cosmetics: PlayerCosmeticCollection;
  avatar: AvatarConfig;
  dailyContext: DailyContext;
  dailyChest: DailyChestState;
}

export interface HouseholdState {
  id: string;
  name: string;
  playerIds: PlayerId[];
  quests: Quest[];
  questTemplates: QuestTemplate[];
  homeStats: HomeStats;
  inventory: InventoryItem[];
  homeProgression: HomeProgression;
  zones: Record<ZoneId, ZoneState>;
  cosmetics: HouseholdCosmeticCollection;
  lifecycle: DailyLifecycleState;
}

export interface AppState {
  schemaVersion: 6;
  household: HouseholdState;
  players: Record<PlayerId, PlayerState>;
  session: {
    activePlayerId: PlayerId;
    preferences: UserPreferences;
  };
}
