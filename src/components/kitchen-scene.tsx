import { ChefHat, Coffee, CookingPot, Flower2, LampCeiling, Refrigerator, Sparkles, Utensils } from "lucide-react";
import { SceneAvatar } from "./scene-avatar";
import type { KitchenCondition, PlayerState, ZoneCosmeticCollection } from "@/domain/types";
import { calculateKitchenHarmony } from "@/domain/zones";
import { characterStateForPlayer, type CharacterMoment } from "@/domain/character-state";

export function KitchenScene({ condition, tier, tierName, cosmetics, players, activePlayerId, characterMoment, focused = false }: { condition: KitchenCondition; tier: number; tierName: string; cosmetics: ZoneCosmeticCollection; players: PlayerState[]; activePlayerId: string; characterMoment?: CharacterMoment | null; focused?: boolean }) {
  const harmony = calculateKitchenHarmony(condition);
  const equipped = new Set(Object.values(cosmetics.equippedDecorationIds));
  const pendant = tier >= 3 || equipped.has("warm-pendant-light");
  const plants = tier >= 2 || equipped.has("kitchen-herb-garden") || equipped.has("window-plant");
  const coffee = tier >= 4 || equipped.has("coffee-station");
  const pans = tier >= 4 || equipped.has("hanging-pans");
  const magnets = equipped.has("fridge-magnet-set");
  const board = tier >= 5 || equipped.has("recipe-board");
  const runner = tier >= 3 || equipped.has("cozy-kitchen-runner");
  return (
    <div className={`kitchen-scene kitchen-tier-${tier} ${condition.dishes < 45 ? "low-dishes" : ""} ${condition.counters < 45 ? "low-counters" : ""} ${condition.trash < 45 ? "low-trash" : ""} ${condition.food < 45 ? "low-food" : ""}`} role="img" aria-label={`${tierName}. Kitchen Harmony ${harmony} percent. Tyler and Rachel share this room.`}>
      <div className="kitchen-window"><span /><i /><b /></div>
      {pendant && <div className="kitchen-pendant"><LampCeiling size={56} strokeWidth={1.35} /></div>}
      <div className="kitchen-cabinets"><i /><i /><i /><i /></div>
      <div className="kitchen-backsplash" />
      <div className="kitchen-fridge"><Refrigerator size={88} strokeWidth={1.15} />{magnets && <span className="fridge-magnets">✦ ● ♥</span>}<i className="food-cue" /></div>
      <div className="kitchen-counter"><span className="sink">⌣</span><span className="faucet">∩</span><div className="dish-clutter"><i /><i /><i /></div><div className="counter-clutter"><i /><i /></div></div>
      <div className="kitchen-stove"><CookingPot size={38} strokeWidth={1.35} /><i /><i /></div>
      {pans && <div className="hanging-pans"><Utensils size={29} /><CookingPot size={24} /></div>}
      {coffee && <div className="coffee-station"><Coffee size={26} /><span /><small>morning nook</small></div>}
      {plants && <div className="kitchen-plants"><Flower2 size={42} strokeWidth={1.3} /><span /></div>}
      {board && <div className="recipe-board"><ChefHat size={18} /><span>Tonight’s idea</span><b>something cozy</b></div>}
      <div className="trash-cue"><span /><i /></div>
      {runner && <div className={`kitchen-runner ${equipped.has("cozy-kitchen-runner") ? "equipped" : ""}`} />}
      <div className="kitchen-characters" aria-label="Household members in the Kitchen">{players.map((player) => { const active = player.id === activePlayerId; const state = characterStateForPlayer(characterMoment ?? null, player.id, player.dailyContext.energy, active && focused); return <div className={active ? "active" : ""} key={player.id}><SceneAvatar config={player.avatar} name={player.name} size={92} state={state} active={active} /><span>{player.name}</span></div>; })}</div>
      {characterMoment?.cue && ["sink", "stove"].includes(characterMoment.cue) && <div className={`zone-action-cue kitchen-cue cue-${characterMoment.cue}`} aria-hidden="true">✦</div>}
      <div className="kitchen-floor" />
      <div className="kitchen-light" style={{ opacity: 0.26 + harmony / 210 }} />
      <div className="kitchen-scene-label"><Sparkles size={14} /> {tierName} <span>·</span> Kitchen Tier {tier}</div>
    </div>
  );
}
