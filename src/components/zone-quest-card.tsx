import { Check, Clock3, Sparkles } from "lucide-react";
import type { Quest, ZoneConditionKey } from "@/domain/types";

export function ZoneQuestCard({ quest, zoneName, zoneXp, impactLabel, onComplete }: {
  quest: Quest;
  zoneName: "Kitchen" | "Bathroom";
  zoneXp: number;
  impactLabel: (key: ZoneConditionKey, amount: number) => string;
  onComplete: () => void;
}) {
  return (
    <article className={`kitchen-quest panel kind-${quest.kind ?? "normal"}`}>
      <div className="zone-quest-copy">
        <div className="quest-topline"><span>{quest.kind === "rescue" ? `${zoneName} Rescue` : `${zoneName} quest`}</span>{quest.kind === "rescue" && <em>Rescue</em>}</div>
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
        <div className="quest-meta"><span><Clock3 size={14} /> {quest.estimatedMinutes} min</span><span>{quest.effort} effort</span></div>
        <div className="zone-impact">
          {Object.entries(quest.zoneEffects ?? {}).filter(([, value]) => value).map(([key, value]) => <span key={key}>{impactLabel(key as ZoneConditionKey, value ?? 0)}</span>)}
          <strong><Sparkles size={13} /> {zoneName} +{zoneXp} XP</strong>
        </div>
      </div>
      <button className="zone-quick-complete" onClick={onComplete} aria-label={`Quick complete ${quest.title}`}><Check size={15} /> Quick complete</button>
    </article>
  );
}
