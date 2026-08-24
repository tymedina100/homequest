import { Bath, Flower2, LampWallUp, Sparkles } from "lucide-react";
import { SceneAvatar } from "./scene-avatar";
import type { BathroomCondition, PlayerState, ZoneCosmeticCollection } from "@/domain/types";
import { calculateBathroomHarmony } from "@/domain/zones";
import { characterStateForPlayer, type CharacterMoment } from "@/domain/character-state";

export function BathroomScene({ condition, tier, tierName, cosmetics, players, activePlayerId, characterMoment, focused = false }: { condition: BathroomCondition; tier: number; tierName: string; cosmetics: ZoneCosmeticCollection; players: PlayerState[]; activePlayerId: string; characterMoment?: CharacterMoment | null; focused?: boolean }) {
  const harmony = calculateBathroomHarmony(condition);
  const equipped = new Set(Object.values(cosmetics.equippedDecorationIds));
  const plant = tier >= 3 || equipped.has("bathroom-plant");
  const sconce = tier >= 3 || equipped.has("bathroom-sconce");
  const mat = tier >= 2 || equipped.has("bathroom-mat");
  const towels = tier >= 4 || equipped.has("bathroom-towel-ladder");
  const art = equipped.has("bathroom-art");
  const counter = equipped.has("bathroom-candle") || equipped.has("bathroom-amber-jars");
  return <div className={`bathroom-scene bathroom-tier-${tier} ${condition.sink < 45 ? "low-sink" : ""} ${condition.toilet < 45 ? "low-toilet" : ""} ${condition.supplies < 45 ? "low-supplies" : ""}`} role="img" aria-label={`${tierName}. Bathroom Harmony ${harmony} percent. Shared by the household.`}>
    <div className="bathroom-tile-wall" /><div className="bathroom-mirror" /><div className="bathroom-vanity"><i /><b /></div><div className="bathroom-toilet"><i /><b /></div><div className="bathroom-shower"><span /><i /></div>
    {sconce && <div className="bathroom-sconce"><LampWallUp size={34} /></div>}{plant && <div className="bathroom-plant"><Flower2 size={43} /><i /></div>}{art && <div className="bathroom-art">✦</div>}{counter && <div className="bathroom-counter-detail">{equipped.has("bathroom-candle") ? "◦" : "◆"}</div>}{towels && <div className="bathroom-towels">≈<i /><i /></div>}{mat && <div className="bathroom-mat" />}
    <div className="bathroom-clutter" /><div className="bathroom-characters" aria-label="Household members in the Bathroom">{players.map((player) => { const active = player.id === activePlayerId; const state = characterStateForPlayer(characterMoment ?? null, player.id, player.dailyContext.energy, active && focused); return <div className={active ? "active" : ""} key={player.id}><SceneAvatar config={player.avatar} name={player.name} size={82} state={state} active={active} /></div>; })}</div>
    {characterMoment?.cue && ["sink", "toilet", "supplies"].includes(characterMoment.cue) && <div className={`zone-action-cue bathroom-cue cue-${characterMoment.cue}`} aria-hidden="true">✦</div>}
    <div className="bathroom-scene-label"><Sparkles size={14} /> {tierName} <span>·</span> Bathroom Tier {tier}</div><Bath className="bathroom-bath-icon" size={34} />
  </div>;
}
