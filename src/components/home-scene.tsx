import { Armchair, BookOpen, Flower2, LampDesk, Map, Sparkles, Trophy } from "lucide-react";
import type { HouseholdCosmeticCollection, HomeStats, PlayerState } from "@/domain/types";
import { CharacterAvatar } from "./character-avatar";

export function HomeScene({ stats, tier, tierName, cosmetics, players, activePlayerId }: { stats: HomeStats; tier: number; tierName: string; cosmetics: HouseholdCosmeticCollection; players: PlayerState[]; activePlayerId: string }) {
  const glow = Math.round((stats.cleanliness + stats.organization + stats.kitchen) / 3);
  const equipped = new Set(Object.values(cosmetics.equippedDecorationIds));
  const showLamp = tier >= 2 || equipped.has("warm-floor-lamp");
  const showPlant = tier >= 3 || equipped.has("monstera-plant") || equipped.has("herb-garden");
  const showRug = tier >= 2 || equipped.has("cozy-rug");
  const showMap = equipped.has("adventure-map");
  const showShelf = tier >= 4 || equipped.has("trophy-shelf");
  return (
    <div className={`home-scene tier-${tier} ${stats.cleanliness < 45 ? "state-cluttered" : ""}`} aria-label={`${tierName}, a warm living room. Current home harmony is ${glow} percent.`} role="img">
      <div className="scene-sky"><span /><span /><span /></div>
      <div className="scene-window"><i /><b /></div>
      <div className="scene-wall-art">{showMap ? <Map size={27} /> : <Flower2 size={24} />}</div>
      {showLamp && <div className="scene-lamp"><LampDesk size={62} strokeWidth={1.5} /></div>}
      <div className="scene-sofa"><Armchair size={108} strokeWidth={1.25} /><span className="sofa-pillow" /></div>
      {tier >= 2 && <div className="scene-table"><BookOpen size={25} /><i /></div>}
      {showPlant && <div className={`scene-plant ${equipped.has("herb-garden") ? "is-herbs" : ""}`}><Flower2 size={54} strokeWidth={1.35} /></div>}
      {showRug && <div className={`scene-rug ${equipped.has("cozy-rug") ? "is-equipped" : ""}`} />}
      {showShelf && <div className="scene-trophy-shelf"><Trophy size={17} /><span /><span /></div>}
      <div className="scene-characters" aria-label="Household characters">{players.map((player) => <div className={player.id === activePlayerId ? "active" : ""} key={player.id}><CharacterAvatar config={player.avatar} name={player.name} size={72} /><span>{player.name}</span></div>)}</div>
      <div className="scene-clutter"><i /><i /><i /></div>
      <div className="scene-floor" />
      <div className="scene-glow" style={{ opacity: 0.25 + glow / 180 }} />
      {tier >= 5 && <div className="sanctuary-sparkles"><Sparkles /><Sparkles /></div>}
      <div className="scene-label"><Sparkles size={15} /> {tierName} <span>·</span> Home Tier {tier}</div>
    </div>
  );
}
