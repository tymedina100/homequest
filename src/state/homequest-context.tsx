"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createSeedState } from "@/data/seed";
import { completeQuestTransaction, type CompletionSummary } from "@/domain/completion";
import { initializeDailyLifecycle } from "@/domain/lifecycle";
import { claimDailyChest as claimDailyChestDomain, initializeAllDailyChests } from "@/domain/daily-chest";
import { equipCosmetic as equipCosmeticDomain, purchaseCosmetic as purchaseCosmeticDomain } from "@/domain/cosmetics";
import { toLocalDateKey } from "@/domain/dates";
import { getActivePlayer, updatePlayer } from "@/domain/players";
import { createQuestTemplate as createQuestTemplateDomain, hasTemplateHistory, syncTemplateOccurrence } from "@/domain/templates";
import type { QuestTemplateDraft } from "@/domain/templates";
import type { AppState, AvatarConfig, DailyContext, InventoryItem, PlayerId, PlayerState, UserPreferences } from "@/domain/types";
import { LocalStoragePersistence } from "@/persistence/store";

export type RewardEvent =
  | { kind: "quest"; id: number; summary: CompletionSummary }
  | { kind: "chest"; id: number; title: string; message: string }
  | { kind: "collection"; id: number; title: string; message: string };

interface HomeQuestContextValue {
  state: AppState;
  activePlayer: PlayerState;
  hydrated: boolean;
  completion: RewardEvent | null;
  completeQuest: (questId: string) => void;
  switchPlayer: (playerId: PlayerId) => void;
  updateAvatar: (changes: Partial<AvatarConfig>) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateDailyContext: (context: Pick<DailyContext, "energy" | "availableMinutes">) => void;
  createQuestTemplate: (draft: QuestTemplateDraft) => void;
  updateQuestTemplate: (templateId: string, changes: Partial<QuestTemplateDraft>) => void;
  archiveQuestTemplate: (templateId: string) => void;
  restoreQuestTemplate: (templateId: string) => void;
  deleteQuestTemplate: (templateId: string) => void;
  purchaseCosmetic: (itemId: string) => void;
  equipCosmetic: (itemId: string) => void;
  claimDailyChest: () => void;
  reset: () => void;
  dismissCompletion: () => void;
}

const HomeQuestContext = createContext<HomeQuestContextValue | null>(null);

export function HomeQuestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [completion, setCompletion] = useState<RewardEvent | null>(null);

  const persistence = useMemo(
    () => (typeof window === "undefined" ? null : new LocalStoragePersistence(window.localStorage)),
    [],
  );

  useEffect(() => {
    let active = true;
    persistence?.load().then((saved) => {
      if (!active) return;
      const now = new Date();
      const lifecycle = initializeDailyLifecycle(saved ?? createSeedState(now), now);
      setState(initializeAllDailyChests(lifecycle, toLocalDateKey(now)));
      setHydrated(true);
    });
    return () => { active = false; };
  }, [persistence]);

  useEffect(() => {
    if (hydrated) void persistence?.save(state);
  }, [state, hydrated, persistence]);

  const completeQuest = useCallback((questId: string) => {
    setState((current) => {
      const playerId = current.session.activePlayerId;
      const quest = current.household.quests.find((item) => item.id === questId);
      if (!quest || quest.status === "completed") return current;
      const result = completeQuestTransaction(current, questId, playerId, new Date().toISOString());
      if (result.applied && result.summary) setCompletion({ kind: "quest", summary: result.summary, id: Date.now() });
      return result.state;
    });
  }, []);

  const addInventoryItem = useCallback((item: InventoryItem) => {
    setState((current) => ({ ...current, household: { ...current.household, inventory: [item, ...current.household.inventory] } }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    setState((current) => ({ ...current, session: { ...current.session, preferences: { ...current.session.preferences, ...preferences } } }));
  }, []);

  const updateDailyContext = useCallback((context: Pick<DailyContext, "energy" | "availableMinutes">) => {
    setState((current) => updatePlayer(current, current.session.activePlayerId, (player) => ({ ...player, dailyContext: { ...context, date: toLocalDateKey(new Date()) } })));
  }, []);

  const switchPlayer = useCallback((playerId: PlayerId) => {
    setState((current) => current.players[playerId] ? { ...current, session: { ...current.session, activePlayerId: playerId } } : current);
    setCompletion(null);
  }, []);

  const updateAvatar = useCallback((changes: Partial<AvatarConfig>) => {
    setState((current) => updatePlayer(current, current.session.activePlayerId, (player) => ({ ...player, avatar: { ...player.avatar, ...changes } })));
  }, []);

  const createQuestTemplate = useCallback((draft: QuestTemplateDraft) => {
    const now = new Date();
    setState((current) => {
      const template = createQuestTemplateDomain(draft, now);
      return syncTemplateOccurrence({ ...current, household: { ...current.household, questTemplates: [...current.household.questTemplates, template] } }, template, now);
    });
  }, []);

  const updateQuestTemplate = useCallback((templateId: string, changes: Partial<QuestTemplateDraft>) => {
    const now = new Date();
    setState((current) => {
      const existing = current.household.questTemplates.find((template) => template.id === templateId);
      if (!existing) return current;
      const template = { ...existing, ...changes, updatedAt: now.toISOString() };
      return syncTemplateOccurrence({ ...current, household: { ...current.household, questTemplates: current.household.questTemplates.map((item) => item.id === templateId ? template : item) } }, template, now);
    });
  }, []);

  const setTemplateActive = useCallback((templateId: string, active: boolean) => {
    const now = new Date();
    setState((current) => {
      const existing = current.household.questTemplates.find((template) => template.id === templateId);
      if (!existing) return current;
      const template = { ...existing, active, updatedAt: now.toISOString() };
      return syncTemplateOccurrence({ ...current, household: { ...current.household, questTemplates: current.household.questTemplates.map((item) => item.id === templateId ? template : item) } }, template, now);
    });
  }, []);

  const archiveQuestTemplate = useCallback((templateId: string) => setTemplateActive(templateId, false), [setTemplateActive]);
  const restoreQuestTemplate = useCallback((templateId: string) => setTemplateActive(templateId, true), [setTemplateActive]);

  const deleteQuestTemplate = useCallback((templateId: string) => {
    setState((current) => {
      const preserveHistory = hasTemplateHistory(current, templateId);
      return {
        ...current,
        household: {
          ...current.household,
          questTemplates: current.household.questTemplates.filter((template) => template.id !== templateId),
          quests: current.household.quests.map((quest) => quest.templateId === templateId && quest.status === "available" ? { ...quest, status: "archived" as const } : quest).filter((quest) => preserveHistory || quest.templateId !== templateId),
        },
      };
    });
  }, []);

  const purchaseCosmetic = useCallback((itemId: string) => {
    setState((current) => {
      const result = purchaseCosmeticDomain(current, itemId, current.session.activePlayerId);
      setCompletion({ kind: "collection", id: Date.now(), title: result.ok ? "Added to collection" : "Not available yet", message: result.ok ? "It’s yours. Equip it whenever it feels right." : result.reason === "coins" ? "A few more coins will do it." : result.reason === "locked" ? "Keep caring for your home to reveal this reward." : "This reward is already in your collection." });
      return result.state;
    });
  }, []);

  const equipCosmetic = useCallback((itemId: string) => {
    setState((current) => {
      const next = equipCosmeticDomain(current, itemId, current.session.activePlayerId);
      if (next !== current) setCompletion({ kind: "collection", id: Date.now(), title: "Equipped", message: "Your home has a new little piece of you." });
      return next;
    });
  }, []);

  const claimDailyChest = useCallback(() => {
    setState((current) => {
      const result = claimDailyChestDomain(current, current.session.activePlayerId, new Date().toISOString());
      if (result.claimed) setCompletion({ kind: "chest", id: Date.now(), title: "Daily Chest opened", message: "+20 coins · +20 XP · +12 Home XP" });
      return result.state;
    });
  }, []);

  const reset = useCallback(() => {
    void persistence?.clear();
    setState(createSeedState(new Date()));
    setCompletion(null);
  }, [persistence]);

  const dismissCompletion = useCallback(() => setCompletion(null), []);

  const activePlayer = getActivePlayer(state);
  const value = useMemo(() => ({ state, activePlayer, hydrated, completion, completeQuest, switchPlayer, updateAvatar, addInventoryItem, updatePreferences, updateDailyContext, createQuestTemplate, updateQuestTemplate, archiveQuestTemplate, restoreQuestTemplate, deleteQuestTemplate, purchaseCosmetic, equipCosmetic, claimDailyChest, reset, dismissCompletion }), [state, activePlayer, hydrated, completion, completeQuest, switchPlayer, updateAvatar, addInventoryItem, updatePreferences, updateDailyContext, createQuestTemplate, updateQuestTemplate, archiveQuestTemplate, restoreQuestTemplate, deleteQuestTemplate, purchaseCosmetic, equipCosmetic, claimDailyChest, reset, dismissCompletion]);

  return <HomeQuestContext.Provider value={value}>{children}</HomeQuestContext.Provider>;
}

export function useHomeQuest() {
  const context = useContext(HomeQuestContext);
  if (!context) throw new Error("useHomeQuest must be used inside HomeQuestProvider");
  return context;
}
