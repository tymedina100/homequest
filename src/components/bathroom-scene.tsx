import { Bath, Flower2, LampWallUp, Sparkles } from "lucide-react";
import { CharacterAvatar } from "./character-avatar";
import type { BathroomCondition, PlayerState, ZoneCosmeticCollection } from "@/domain/types";
import { calculateBathroomHarmony } from "@/domain/zones";

export function BathroomScene({ condition, tier, tierName, cosmetics, players, activePlayerId }: { condition: BathroomCondition; tier: number; tierName: string; cosmetics: ZoneCosmeticCollection; players: PlayerState[]; activePlayerId: string }) {
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
    <div className="bathroom-clutter" /><div className="bathroom-characters">{players.map((player) => <div className={player.id === activePlayerId ? "active" : ""} key={player.id}><CharacterAvatar config={player.avatar} name={player.name} size={64} /></div>)}</div>
    <div className="bathroom-scene-label"><Sparkles size={14} /> {tierName} <span>·</span> Bathroom Tier {tier}</div><Bath className="bathroom-bath-icon" size={34} />
  </div>;
}
