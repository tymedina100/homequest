import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { isAvatarConfig, normalizeAvatar, randomizeAvatar, TYLER_AVATAR } from "./avatar";
import { parseBackup, serializeBackup } from "./backup";

describe("Character System 2.0 configuration", () => {
  it("deterministically maps supported legacy IDs without resetting identity", () => {
    const migrated = normalizeAvatar({ ...TYLER_AVATAR, hairStyle: "short", outfit: "sweater", accessory: "glasses" } as never, "player-tyler");
    expect(migrated).toMatchObject({ hairStyle: "side-part", outfit: "crewneck", accessory: "round-glasses", skinTone: TYLER_AVATAR.skinTone, outfitColor: TYLER_AVATAR.outfitColor });
  });

  it("falls back safely for invalid legacy values and fills new face fields", () => {
    const migrated = normalizeAvatar({ hairStyle: "not-real", faceShape: "triangle", outfit: "cape" } as never, "player-tyler");
    expect(migrated).toEqual(TYLER_AVATAR);
    expect(isAvatarConfig(migrated)).toBe(true);
  });

  it("randomizes only a valid preview and leaves the source untouched", () => {
    const source = { ...TYLER_AVATAR };
    let value = 0.07;
    const randomized = randomizeAvatar(source, () => { value = (value + 0.173) % 1; return value; });
    expect(isAvatarConfig(randomized)).toBe(true);
    expect(source).toEqual(TYLER_AVATAR);
    expect(randomized).not.toEqual(source);
  });

  it("preserves independent character configurations through backup restore", () => {
    const state = createSeedState(new Date(2026, 7, 23, 10));
    state.players["player-tyler"].avatar = { ...state.players["player-tyler"].avatar, hairStyle: "undercut", outfit: "flannel", accessory: "rectangle-glasses" };
    state.players["player-rachel"].avatar = { ...state.players["player-rachel"].avatar, hairStyle: "ponytail", outfit: "apron", accessory: "hair-clip" };
    const restored = parseBackup(serializeBackup(state, new Date(2026, 7, 23, 11)), new Date(2026, 7, 23, 12));
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.state.players["player-tyler"].avatar).toEqual(state.players["player-tyler"].avatar);
    expect(restored.state.players["player-rachel"].avatar).toEqual(state.players["player-rachel"].avatar);
  });
});
