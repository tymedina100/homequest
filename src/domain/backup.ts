import { toLocalDateKey } from "./dates";
import { migratePersistedState, validateAppState } from "@/persistence/store";
import type { AppState } from "./types";

export const BACKUP_APPLICATION_ID = "homequest";
export const BACKUP_FORMAT_VERSION = 1;

export interface HomeQuestBackup {
  application: typeof BACKUP_APPLICATION_ID;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  schemaVersion: number;
  createdAt: string;
  payload: AppState;
}

export interface RestorePreview {
  householdName: string;
  playerNames: string[];
  homeXp: number;
  templateCount: number;
  inventoryCount: number;
  createdAt: string;
}

export type BackupParseResult = { ok: true; backup: HomeQuestBackup; state: AppState; preview: RestorePreview } | { ok: false; error: string };

export function createBackup(state: AppState, now = new Date()): HomeQuestBackup {
  return { application: BACKUP_APPLICATION_ID, formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: state.schemaVersion, createdAt: now.toISOString(), payload: structuredClone(state) };
}

export function serializeBackup(state: AppState, now = new Date()): string {
  return JSON.stringify(createBackup(state, now), null, 2);
}

export function backupFilename(now = new Date()): string {
  return `homequest-backup-${toLocalDateKey(now)}.json`;
}

export function createRestorePreview(backup: Pick<HomeQuestBackup, "createdAt" | "payload">): RestorePreview {
  const { payload } = backup;
  return { householdName: payload.household.name, playerNames: payload.household.playerIds.map((id) => payload.players[id]?.name).filter((name): name is string => Boolean(name)), homeXp: payload.household.homeProgression.totalXp, templateCount: payload.household.questTemplates.length, inventoryCount: payload.household.inventory.length, createdAt: backup.createdAt };
}

export function parseBackup(raw: string | unknown, now = new Date()): BackupParseResult {
  let value: unknown;
  try { value = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return { ok: false, error: "This file is not valid JSON." }; }
  if (!value || typeof value !== "object") return { ok: false, error: "This file is not a HomeQuest backup." };
  const envelope = value as Record<string, unknown>;
  if (envelope.application !== BACKUP_APPLICATION_ID) return { ok: false, error: "This file is not a HomeQuest backup." };
  if (envelope.formatVersion !== BACKUP_FORMAT_VERSION) return { ok: false, error: "This backup was created by a newer or unsupported version of HomeQuest." };
  const state = migratePersistedState(envelope.payload, now);
  if (!state || !validateAppState(state)) return { ok: false, error: "This backup does not contain a valid HomeQuest household." };
  const backup: HomeQuestBackup = { application: BACKUP_APPLICATION_ID, formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: state.schemaVersion, createdAt: typeof envelope.createdAt === "string" ? envelope.createdAt : now.toISOString(), payload: state };
  return { ok: true, backup, state, preview: createRestorePreview(backup) };
}
