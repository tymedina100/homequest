import { Armchair, BookOpen, Flower2, LampDesk, Map, Sparkles, Trophy } from "lucide-react";
import type { HouseholdCosmeticCollection, HomeStats, PlayerState } from "@/domain/types";
import { SceneAvatar } from "./scene-avatar";
import { characterStateForPlayer, type CharacterMoment } from "@/domain/character-state";

export function HomeScene({ stats, tier, tierName, cosmetics, players, activePlayerId, characterMoment, focused = false }: { stats: HomeStats; tier: number; tierName: string; cosmetics: HouseholdCosmeticCollection; players: PlayerState[]; activePlayerId: string; characterMoment?: CharacterMoment | null; focused?: boolean }) {
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
      <div className="scene-characters" aria-label="Household characters">{players.map((player) => { const active = player.id === activePlayerId; const state = characterStateForPlayer(characterMoment ?? null, player.id, player.dailyContext.energy, active && focused); return <div className={active ? "active" : ""} key={player.id}><SceneAvatar config={player.avatar} name={player.name} size={88} state={state} active={active} /><span>{player.name}</span></div>; })}</div>
      {characterMoment && <div className={`scene-action-cue cue-${characterMoment.cue}`} aria-hidden="true">✦</div>}
      <div className="scene-clutter"><i /><i /><i /></div>
      <div className="scene-floor" />
      <div className="scene-glow" style={{ opacity: 0.25 + glow / 180 }} />
      {tier >= 5 && <div className="sanctuary-sparkles"><Sparkles /><Sparkles /></div>}
      <div className="scene-label"><Sparkles size={15} /> {tierName} <span>·</span> Home Tier {tier}</div>
    </div>
  );
}
