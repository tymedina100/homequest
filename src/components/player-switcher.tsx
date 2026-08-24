"use client";

import { Check, Users } from "lucide-react";
import { SceneAvatar } from "./scene-avatar";
import { useHomeQuest } from "@/state/homequest-context";

export function PlayerSwitcher({ compact = false }: { compact?: boolean }) {
  const { state, activePlayer, switchPlayer } = useHomeQuest();
  return <div className={`player-switcher ${compact ? "compact" : ""}`} aria-label="Active player">
    {!compact && <span className="player-switcher-label"><Users size={14} /> Playing as</span>}
    <div>{state.household.playerIds.map((playerId) => { const player = state.players[playerId]; if (!player) return null; const active = player.id === activePlayer.id; return <button type="button" aria-pressed={active} className={active ? "active" : ""} onClick={() => switchPlayer(player.id)} key={player.id}><SceneAvatar config={player.avatar} name={player.name} size={compact ? 36 : 44} active={active} /><span>{player.name}</span>{active && <Check size={13} />}</button>; })}</div>
  </div>;
}
