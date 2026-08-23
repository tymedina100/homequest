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
  createdAt: string;
  lastCompletedAt?: string;
  dueAt?: string;
  dependsOn?: string[];
  recommendation?: { ignoredDays?: number; momentum?: number };
  comebackEligible?: boolean;
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

export interface CosmeticCollection {
  ownedIds: string[];
  equippedThemeId: string;
  equippedDecorationIds: Partial<Record<DecorationSlot, string>>;
  equippedTitleId?: string;
  equippedAccentId?: string;
}

export interface DailyChestState {
  date: LocalDateKey;
  qualifyingQuestIds: string[];
  status: "locked" | "ready" | "claimed";
  claimedAt?: string;
}

export interface UserPreferences {
  energy: EffortLevel;
  availableMinutes: number;
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
}

export interface DailyLifecycleState {
  lastLifecycleDate?: LocalDateKey;
  lastOpenedDate?: LocalDateKey;
  lastMeaningfulActivityDate?: LocalDateKey;
  dailyHistory: DailyHistoryEntry[];
  questHistory: QuestHistoryEntry[];
}

export interface AppState {
  schemaVersion: 4;
  player: { name: string; coins: number };
  quests: Quest[];
  questTemplates: QuestTemplate[];
  homeStats: HomeStats;
  inventory: InventoryItem[];
  progression: Progression;
  homeProgression: HomeProgression;
  skills: SkillProgression;
  achievements: AchievementState[];
  cosmetics: CosmeticCollection;
  dailyChest: DailyChestState;
  preferences: UserPreferences;
  dailyContext: DailyContext;
  lifecycle: DailyLifecycleState;
}
