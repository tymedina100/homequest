import { Check, Clock3, Sparkles } from "lucide-react";
import type { Quest } from "@/domain/types";

const categoryLabels = { cleaning: "Cleaning", cooking: "Cooking", organization: "Organizing", homekeeping: "Homekeeping" };
const effortLabels = { low: "Low effort", medium: "Medium effort", high: "High effort" };

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function QuestCard({ quest, onComplete, compact = false }: { quest: Quest; onComplete: () => void; compact?: boolean }) {
  const done = quest.status === "completed";
  const badge = quest.kind === "rescue" ? "Rescue" : quest.kind === "comeback" ? "Welcome back" : quest.recurrence && quest.recurrence.cadence !== "manual" && quest.recurrence.cadence !== "as-needed" ? "Recurring" : quest.urgency === "today" && !done ? "Today" : null;
  return (
    <article className={`quest-card category-${quest.category} kind-${quest.kind ?? "normal"} ${done ? "is-complete" : ""} ${compact ? "compact" : ""}`}>
      <button className="quest-check" onClick={onComplete} disabled={done} aria-label={done ? `${quest.title} completed` : `Complete ${quest.title}`}>
        {done ? <Check size={19} strokeWidth={3} /> : <span />}
      </button>
      <div className="quest-copy">
        <div className="quest-topline"><span>{done ? "Completed today" : categoryLabels[quest.category]}</span>{badge && <em>{badge}</em>}</div>
        <h3>{quest.title}</h3>
        {!compact && <p>{quest.description}</p>}
        {!compact && quest.lifecycleNote && <p className="quest-note">{quest.lifecycleNote}</p>}
        <div className="quest-meta">
          <span><Clock3 size={14} /> {quest.estimatedMinutes} min</span>
          <span>{effortLabels[quest.effort]}</span>
          <strong><Sparkles size={14} /> +{quest.xpReward} XP</strong>
        </div>
      </div>
    </article>
  );
}
