import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { schemaV4Fixture } from "@/persistence/fixtures";
import { BACKUP_APPLICATION_ID, BACKUP_FORMAT_VERSION, backupFilename, createBackup, parseBackup, serializeBackup } from "./backup";

describe("versioned HomeQuest backups", () => {
  it("serializes a complete non-mutating backup envelope", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10)); const before = JSON.stringify(state);
    const backup = createBackup(state, new Date(2026, 7, 23, 10));
    expect(backup).toMatchObject({ application: BACKUP_APPLICATION_ID, formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: 5, payload: { household: { name: "Tyler & Rachel's Home" } } });
    expect(JSON.stringify(state)).toBe(before);
    expect(backupFilename(new Date(2026, 7, 23, 10))).toBe("homequest-backup-2026-08-23.json");
  });

  it("validates before providing an equivalent restore state", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10)); const result = parseBackup(serializeBackup(state, new Date(2026, 7, 23, 10)), new Date(2026, 7, 24, 10));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.preview).toMatchObject({ householdName: "Tyler & Rachel's Home", playerNames: ["Tyler", "Rachel"], templateCount: 5 });
  });

  it("rejects malformed, future, and invalid-player backups without a state result", () => {
    expect(parseBackup("not json")).toMatchObject({ ok: false, error: "This file is not valid JSON." });
    const state = createSeedState(); const future = createBackup(state); const invalid = createBackup(state);
    expect(parseBackup({ ...future, formatVersion: 2 })).toMatchObject({ ok: false });
    invalid.payload.players["player-tyler"].coins = -1;
    expect(parseBackup(invalid)).toMatchObject({ ok: false });
  });

  it("uses the canonical migration pipeline for a supported v4 payload", () => {
    const result = parseBackup({ application: BACKUP_APPLICATION_ID, formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: 4, createdAt: "2026-08-23T10:00:00.000Z", payload: schemaV4Fixture() }, new Date(2026, 7, 23, 10));
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.state.household.playerIds).toContain("player-rachel");
  });
});
