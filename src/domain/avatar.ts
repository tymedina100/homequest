import type { AvatarConfig, AvatarAccessory, HairStyle, OutfitStyle, PlayerId } from "./types";
import { RACHEL_PLAYER_ID } from "./players";

export const AVATAR_OPTIONS = {
  skinTone: ["porcelain", "peach", "golden", "warm", "brown", "deep"],
  faceShape: ["round", "oval", "angular", "soft"],
  eyeStyle: ["calm", "bright", "almond"],
  freckles: ["none", "soft"],
  hairStyle: ["textured-crop", "side-part", "messy-short", "medium-waves", "curls", "long-curls", "ponytail", "bun", "long-waves", "undercut"],
  hairColor: ["espresso", "chestnut", "copper", "golden", "midnight", "rose"],
  outfit: ["tee", "crewneck", "hoodie", "oversized-sweater", "jacket", "flannel", "overalls", "apron", "button-up", "lounge"],
  outfitColor: ["moss", "amber", "berry", "ocean", "plum", "cream"],
  accessory: ["none", "round-glasses", "rectangle-glasses", "earrings", "headband", "cap", "beanie", "necklace", "hair-clip"],
  expression: ["content", "bright", "focused", "sleepy", "excited", "determined"],
} as const satisfies { [Key in keyof AvatarConfig]: readonly AvatarConfig[Key][] };

export const CHARACTER_COLORS = {
  skinTone: { porcelain: "#f6d8c6", peach: "#edb995", golden: "#d99a62", warm: "#b9704b", brown: "#855039", deep: "#543326" },
  hairColor: { espresso: "#2a1b18", chestnut: "#633726", copper: "#a95732", golden: "#c9913b", midnight: "#29283e", rose: "#8b435c" },
  outfitColor: { moss: "#657155", amber: "#b97836", berry: "#99536a", ocean: "#486f83", plum: "#715671", cream: "#d8c7a8" },
} as const;

export function resolveCharacterColors(config: AvatarConfig) {
  return {
    skin: CHARACTER_COLORS.skinTone[config.skinTone],
    hair: CHARACTER_COLORS.hairColor[config.hairColor],
    clothes: CHARACTER_COLORS.outfitColor[config.outfitColor],
    clothesShadow: `color-mix(in srgb, ${CHARACTER_COLORS.outfitColor[config.outfitColor]} 72%, #251d1a)`,
  };
}

export const TYLER_AVATAR: AvatarConfig = {
  skinTone: "peach", faceShape: "angular", eyeStyle: "calm", freckles: "none", hairStyle: "messy-short", hairColor: "chestnut", outfit: "hoodie",
  outfitColor: "moss", accessory: "round-glasses", expression: "content",
};

export const RACHEL_AVATAR: AvatarConfig = {
  skinTone: "golden", faceShape: "soft", eyeStyle: "bright", freckles: "soft", hairStyle: "long-curls", hairColor: "espresso", outfit: "overalls",
  outfitColor: "ocean", accessory: "headband", expression: "bright",
};

/** Stable mappings keep schema-v7 saves and older backups recognizable. */
export const LEGACY_AVATAR_MAPPINGS = {
  hairStyle: { short: "side-part", waves: "medium-waves", mohawk: "undercut" },
  outfit: { sweater: "crewneck" },
  accessory: { glasses: "round-glasses" },
} as const;

export function defaultAvatarFor(playerId: PlayerId): AvatarConfig {
  return { ...(playerId === RACHEL_PLAYER_ID ? RACHEL_AVATAR : TYLER_AVATAR) };
}

export function normalizeAvatar(value: Partial<AvatarConfig> | undefined, playerId: PlayerId): AvatarConfig {
  const fallback = defaultAvatarFor(playerId);
  return Object.fromEntries((Object.keys(AVATAR_OPTIONS) as Array<keyof AvatarConfig>).map((key) => {
    const raw = value?.[key] as string | undefined;
    const candidate = key === "hairStyle" ? LEGACY_AVATAR_MAPPINGS.hairStyle[raw as keyof typeof LEGACY_AVATAR_MAPPINGS.hairStyle] ?? raw
      : key === "outfit" ? LEGACY_AVATAR_MAPPINGS.outfit[raw as keyof typeof LEGACY_AVATAR_MAPPINGS.outfit] ?? raw
      : key === "accessory" ? LEGACY_AVATAR_MAPPINGS.accessory[raw as keyof typeof LEGACY_AVATAR_MAPPINGS.accessory] ?? raw
      : raw;
    return [key, AVATAR_OPTIONS[key].includes(candidate as never) ? candidate : fallback[key]];
  })) as unknown as AvatarConfig;
}

export function randomizeAvatar(current: AvatarConfig, random: () => number = Math.random): AvatarConfig {
  const pick = <Key extends keyof AvatarConfig>(key: Key): AvatarConfig[Key] => {
    const options = AVATAR_OPTIONS[key];
    return options[Math.min(options.length - 1, Math.floor(Math.max(0, random()) * options.length))] as AvatarConfig[Key];
  };
  const next = Object.fromEntries((Object.keys(AVATAR_OPTIONS) as Array<keyof AvatarConfig>).map((key) => [key, pick(key)])) as unknown as AvatarConfig;
  const headwear = next.accessory === "cap" || next.accessory === "beanie";
  if (headwear && (["bun", "ponytail"] as HairStyle[]).includes(next.hairStyle)) next.hairStyle = "messy-short";
  if ((next.outfit as OutfitStyle) === current.outfit && next.outfitColor === current.outfitColor) next.outfitColor = next.outfitColor === "moss" ? "amber" : "moss";
  return next;
}

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AvatarConfig>;
  return (Object.keys(AVATAR_OPTIONS) as Array<keyof AvatarConfig>).every((key) => AVATAR_OPTIONS[key].includes(candidate[key] as never));
}

export function isHeadwear(accessory: AvatarAccessory): boolean {
  return accessory === "cap" || accessory === "beanie";
}
