import type { AvatarConfig, PlayerId } from "./types";
import { RACHEL_PLAYER_ID } from "./players";

export const AVATAR_OPTIONS = {
  skinTone: ["porcelain", "peach", "golden", "warm", "brown", "deep"],
  hairStyle: ["short", "waves", "curls", "bun", "mohawk"],
  hairColor: ["espresso", "chestnut", "copper", "golden", "midnight", "rose"],
  outfit: ["tee", "sweater", "overalls", "apron", "hoodie"],
  outfitColor: ["moss", "amber", "berry", "ocean", "plum", "cream"],
  accessory: ["none", "glasses", "earrings", "headband", "cap"],
  expression: ["content", "bright", "focused", "sleepy"],
} as const satisfies { [Key in keyof AvatarConfig]: readonly AvatarConfig[Key][] };

export const TYLER_AVATAR: AvatarConfig = {
  skinTone: "peach", hairStyle: "short", hairColor: "chestnut", outfit: "hoodie",
  outfitColor: "moss", accessory: "glasses", expression: "content",
};

export const RACHEL_AVATAR: AvatarConfig = {
  skinTone: "golden", hairStyle: "waves", hairColor: "espresso", outfit: "sweater",
  outfitColor: "berry", accessory: "earrings", expression: "bright",
};

export function defaultAvatarFor(playerId: PlayerId): AvatarConfig {
  return { ...(playerId === RACHEL_PLAYER_ID ? RACHEL_AVATAR : TYLER_AVATAR) };
}

export function normalizeAvatar(value: Partial<AvatarConfig> | undefined, playerId: PlayerId): AvatarConfig {
  const fallback = defaultAvatarFor(playerId);
  return Object.fromEntries((Object.keys(AVATAR_OPTIONS) as Array<keyof AvatarConfig>).map((key) => {
    const candidate = value?.[key];
    return [key, AVATAR_OPTIONS[key].includes(candidate as never) ? candidate : fallback[key]];
  })) as unknown as AvatarConfig;
}
