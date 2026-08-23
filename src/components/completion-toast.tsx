"use client";

import { Bath, Check, CookingPot, Home, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect } from "react";
import { useHomeQuest } from "@/state/homequest-context";

export function CompletionToast() {
  const { completion, dismissCompletion, state } = useHomeQuest();
  useEffect(() => {
    if (!completion) return;
    const timer = window.setTimeout(dismissCompletion, 4200);
    return () => window.clearTimeout(timer);
  }, [completion, dismissCompletion]);
  if (!completion) return null;
  if (completion.kind !== "quest") return (
    <div className={`completion-toast reward-toast ${completion.kind === "chest" ? "chest-toast" : ""}`} role="status" aria-live="polite" key={completion.id}>
      <div className="completion-burst">{completion.kind === "chest" ? <Trophy size={23} /> : <Check size={23} />}</div>
      <div><span>{completion.kind === "chest" ? "A gentle daily reward" : "Collection updated"}</span><strong>{completion.title}</strong><p>{completion.message}</p></div>
      <button onClick={dismissCompletion} aria-label="Dismiss reward message">×</button>
    </div>
  );
  const { summary } = completion;
  const hasLevelUp = Boolean(summary.playerLevel || summary.skillLevel || summary.homeLevel || summary.kitchenLevel || summary.bathroomLevel);
  const zoneReward = summary.kitchenXp > 0
    ? { name: "Kitchen", xp: summary.kitchenXp, effects: summary.kitchenEffects, icon: <CookingPot size={14} /> }
    : summary.bathroomXp > 0 ? { name: "Bathroom", xp: summary.bathroomXp, effects: summary.bathroomEffects, icon: <Bath size={14} /> } : null;
  return (
    <div className={`completion-toast reward-toast ${hasLevelUp ? "has-level-up" : ""}`} role="status" aria-live="polite" key={completion.id}>
      <div className="completion-burst"><Check size={25} /></div>
      <div className="reward-heading"><span>{summary.playerName} completed a quest</span><strong>{summary.questTitle}</strong></div>
      <div className="completion-xp"><Sparkles size={17} /> +{summary.playerXp} XP <small>· +{summary.skillXp} {summary.skill} · +{summary.coins} coins</small></div>
      <div className="zone-reward-line"><Home size={14} /><span>Our Home +{summary.homeXp} XP</span>{zoneReward && <><span className="reward-divider">·</span>{zoneReward.icon}<span>{zoneReward.name} +{zoneReward.xp} XP</span>{zoneReward.effects && <small>{Object.entries(zoneReward.effects).filter(([, value]) => (value ?? 0) > 0).map(([key, value]) => `${key} +${value}`).join(" · ")}</small>}</>}</div>
      {hasLevelUp && <div className="level-up-line"><Star size={15} /><strong>{summary.kitchenLevel ? `Kitchen Level ${summary.kitchenLevel}` : summary.bathroomLevel ? `Bathroom Level ${summary.bathroomLevel}` : summary.homeLevel ? `Home Level ${summary.homeLevel}` : summary.skillLevel ? `${summary.skill[0].toUpperCase() + summary.skill.slice(1)} Level ${summary.skillLevel}` : `Level ${summary.playerLevel}`}</strong>{(summary.kitchenTier || summary.bathroomTier || summary.homeTier) && <span>{summary.kitchenTier ?? summary.bathroomTier ?? summary.homeTier} unlocked</span>}</div>}
      {(summary.achievementIds.length > 0 || summary.cosmeticIds.length > 0 || summary.perkIds.length > 0 || summary.chestUnlocked) && <div className="unlock-line"><Home size={14} /><span>{summary.chestUnlocked ? "Daily Chest ready" : summary.achievementIds.length ? `${summary.achievementIds.length} achievement unlocked` : summary.cosmeticIds.length ? "New cosmetic unlocked" : "New skill perk unlocked"}</span></div>}
      <button onClick={dismissCompletion} aria-label="Dismiss completion message">×</button>
      {!state.session.preferences.reducedMotion && <i className="spark spark-one" />}
      {!state.session.preferences.reducedMotion && <i className="spark spark-two" />}
    </div>
  );
}
