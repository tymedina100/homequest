"use client";

import { useMemo, useState } from "react";
import { Check, Dices, Palette, RotateCcw, Save, Sparkles } from "lucide-react";
import { AVATAR_OPTIONS, CHARACTER_COLORS, randomizeAvatar } from "@/domain/avatar";
import type { AvatarConfig, PlayerState } from "@/domain/types";
import { StudioAvatar } from "./studio-avatar";
import { SceneAvatar } from "./scene-avatar";
import { useHomeQuest } from "@/state/homequest-context";

type StudioCategory = "body" | "hair" | "face" | "outfit" | "accessory";
const categories: Array<{ id: StudioCategory; label: string }> = [
  { id: "body", label: "Body" }, { id: "hair", label: "Hair" }, { id: "face", label: "Face" }, { id: "outfit", label: "Outfit" }, { id: "accessory", label: "Accessory" },
];
const categoryFields: Record<StudioCategory, Array<keyof AvatarConfig>> = {
  body: ["skinTone", "faceShape"], hair: ["hairStyle", "hairColor"], face: ["eyeStyle", "freckles", "expression"], outfit: ["outfit", "outfitColor"], accessory: ["accessory"],
};
const labels: Record<keyof AvatarConfig, string> = { skinTone: "Skin tone", faceShape: "Face shape", eyeStyle: "Eyes", freckles: "Freckles", hairStyle: "Hair style", hairColor: "Hair color", outfit: "Outfit", outfitColor: "Outfit color", accessory: "Accessory", expression: "Personality" };
const pretty = (value: string) => value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
const colorFields = new Set<keyof AvatarConfig>(["skinTone", "hairColor", "outfitColor"]);
const visualFields = new Set<keyof AvatarConfig>(["hairStyle", "outfit", "accessory", "faceShape", "eyeStyle", "expression"]);
const lookbook: Array<{ name: string; config: AvatarConfig }> = [
  { name: "Trail Keeper", config: { skinTone: "peach", faceShape: "angular", eyeStyle: "calm", freckles: "none", hairStyle: "messy-short", hairColor: "chestnut", outfit: "hoodie", outfitColor: "moss", accessory: "round-glasses", expression: "content" } },
  { name: "Hearth Cook", config: { skinTone: "deep", faceShape: "round", eyeStyle: "bright", freckles: "soft", hairStyle: "textured-crop", hairColor: "espresso", outfit: "apron", outfitColor: "amber", accessory: "earrings", expression: "bright" } },
  { name: "Soft Scholar", config: { skinTone: "porcelain", faceShape: "soft", eyeStyle: "almond", freckles: "soft", hairStyle: "long-waves", hairColor: "rose", outfit: "oversized-sweater", outfitColor: "plum", accessory: "rectangle-glasses", expression: "content" } },
  { name: "Garden Maker", config: { skinTone: "golden", faceShape: "oval", eyeStyle: "bright", freckles: "none", hairStyle: "long-curls", hairColor: "espresso", outfit: "overalls", outfitColor: "ocean", accessory: "headband", expression: "excited" } },
  { name: "Night Owl", config: { skinTone: "brown", faceShape: "angular", eyeStyle: "calm", freckles: "none", hairStyle: "undercut", hairColor: "midnight", outfit: "jacket", outfitColor: "berry", accessory: "beanie", expression: "determined" } },
  { name: "Sunny Organizer", config: { skinTone: "warm", faceShape: "round", eyeStyle: "almond", freckles: "soft", hairStyle: "ponytail", hairColor: "copper", outfit: "button-up", outfitColor: "cream", accessory: "hair-clip", expression: "bright" } },
];

function optionColor(key: keyof AvatarConfig, value: string): string | undefined {
  if (key === "skinTone") return CHARACTER_COLORS.skinTone[value as keyof typeof CHARACTER_COLORS.skinTone];
  if (key === "hairColor") return CHARACTER_COLORS.hairColor[value as keyof typeof CHARACTER_COLORS.hairColor];
  if (key === "outfitColor") return CHARACTER_COLORS.outfitColor[value as keyof typeof CHARACTER_COLORS.outfitColor];
  return undefined;
}

export function AvatarCreator({ player, onChange }: { player?: Pick<PlayerState, "name" | "avatar">; onChange?: (changes: Partial<AvatarConfig>) => void }) {
  const { activePlayer, updateAvatar } = useHomeQuest();
  const subject = player ?? activePlayer;
  const [category, setCategory] = useState<StudioCategory>("hair");
  const [draft, setDraft] = useState<AvatarConfig>(subject.avatar);
  const [saved, setSaved] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(subject.avatar), [draft, subject.avatar]);

  const choose = <Key extends keyof AvatarConfig>(key: Key, value: AvatarConfig[Key]) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
    onChange?.({ [key]: value });
  };
  const randomize = () => { const next = randomizeAvatar(draft); setDraft(next); setSaved(false); onChange?.(next); };
  const applyLook = (next: AvatarConfig) => { setDraft(next); setSaved(false); onChange?.(next); };
  const revert = () => { setDraft(subject.avatar); setSaved(false); onChange?.(subject.avatar); };
  const save = () => { updateAvatar(draft); setSaved(true); };

  return <section className="avatar-studio panel" data-testid="character-studio">
    <div className="avatar-studio-preview">
      <div className="studio-heading"><p className="eyebrow"><Palette size={14} /> Character Studio</p><span>{dirty ? "Unsaved look" : "Saved look"}</span></div>
      <div className="avatar-stage"><StudioAvatar config={draft} name={subject.name} size={285} /></div>
      <div className="studio-identity"><h2>{subject.name}</h2><p>Little adventurer, big household energy.</p></div>
      <div className="studio-actions">
        <button type="button" className="soft-button" onClick={randomize}><Dices size={16} /> Randomize</button>
        <button type="button" className="soft-button" onClick={revert} disabled={!dirty}><RotateCcw size={16} /> Revert</button>
        {!onChange && <button type="button" className="primary-button" onClick={save} disabled={!dirty}><Save size={16} /> {saved ? "Saved" : "Save character"}</button>}
      </div>
    </div>
    <div className="avatar-workbench">
      <div className="studio-category-tabs" role="tablist" aria-label="Character customization categories">{categories.map((item) => <button type="button" role="tab" aria-selected={category === item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)} key={item.id}>{item.label}</button>)}</div>
      <div className="avatar-options">{categoryFields[category].map((key) => <fieldset key={key}><legend>{labels[key]}</legend><div className={visualFields.has(key) ? "visual-option-grid" : colorFields.has(key) ? "swatch-grid" : "text-option-grid"}>{AVATAR_OPTIONS[key].map((option) => {
        const selected = draft[key] === option; const color = optionColor(key, option as string); const previewConfig = { ...draft, [key]: option } as AvatarConfig;
        return <button type="button" className={`${selected ? "selected" : ""} ${color ? "color-choice" : ""}`} aria-pressed={selected} aria-label={`${labels[key]}: ${pretty(option as string)}`} onClick={() => choose(key, option)} key={option as string}>
          {color && <i className="character-swatch" style={{ background: color }} />}
          {visualFields.has(key) && <span className="option-portrait"><SceneAvatar config={previewConfig} name={pretty(option as string)} size={64} /></span>}
          <span>{pretty(option as string)}</span>{selected && <Check className="option-check" size={13} />}
        </button>;
      })}</div></fieldset>)}</div>
      <div className="studio-note"><Sparkles size={15} /><span>Every choice is visual—not a gender label. Mix silhouettes, colors, hair, and details until the character feels like you.</span></div>
      <details className="character-lookbook"><summary>Adventurer lookbook · 6 ideas</summary><div>{lookbook.map((look) => <button type="button" key={look.name} onClick={() => applyLook(look.config)} aria-label={`Try ${look.name}`}><SceneAvatar config={look.config} name={look.name} size={92} /><span>{look.name}</span></button>)}</div></details>
    </div>
  </section>;
}
