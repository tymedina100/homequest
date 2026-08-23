"use client";

import { Palette, Sparkles } from "lucide-react";
import { AVATAR_OPTIONS } from "@/domain/avatar";
import type { AvatarConfig } from "@/domain/types";
import type { PlayerState } from "@/domain/types";
import { CharacterAvatar } from "./character-avatar";
import { useHomeQuest } from "@/state/homequest-context";

const labels: Record<keyof AvatarConfig, string> = { skinTone: "Skin tone", hairStyle: "Hair style", hairColor: "Hair color", outfit: "Outfit", outfitColor: "Outfit color", accessory: "Accessory", expression: "Expression" };
const pretty = (value: string) => value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());

export function AvatarCreator({ player, onChange }: { player?: Pick<PlayerState, "name" | "avatar">; onChange?: (changes: Partial<AvatarConfig>) => void }) {
  const { activePlayer, updateAvatar } = useHomeQuest();
  const subject = player ?? activePlayer;
  const apply = onChange ?? updateAvatar;
  return <section className="avatar-studio panel">
    <div className="avatar-studio-preview"><p className="eyebrow"><Palette size={14} /> Character studio</p><div className="avatar-stage"><CharacterAvatar config={subject.avatar} name={subject.name} size={180} /></div><h2>{subject.name}</h2><p>Your character is personal to this player and saves automatically.</p></div>
    <div className="avatar-options">{(Object.keys(AVATAR_OPTIONS) as Array<keyof AvatarConfig>).map((key) => <fieldset key={key}><legend>{labels[key]}</legend><div>{AVATAR_OPTIONS[key].map((option) => { const selected = subject.avatar[key] === option; return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => apply({ [key]: option })} key={option}>{selected && <Sparkles size={12} />}{pretty(option)}</button>; })}</div></fieldset>)}</div>
  </section>;
}
