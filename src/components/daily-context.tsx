"use client";

import { useState } from "react";
import { Battery, ChevronDown, Clock3 } from "lucide-react";
import type { DailyContext, DailyEnergy } from "@/domain/types";

const energyLabels: Record<DailyEnergy, string> = { drained: "Drained", low: "Low", good: "Good", "locked-in": "Locked In" };
const times = [5, 15, 30, 60];

export function DailyContextControls({ context, onChange, compact = false }: { context: DailyContext; onChange: (next: Pick<DailyContext, "energy" | "availableMinutes">) => void; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const update = (next: Partial<Pick<DailyContext, "energy" | "availableMinutes">>) => onChange({ energy: next.energy ?? context.energy, availableMinutes: next.availableMinutes ?? context.availableMinutes });
  return (
    <section className={`daily-context ${compact ? "is-compact" : "panel"}`}>
      <div className="context-summary"><div><p className="eyebrow">Today</p><strong>{energyLabels[context.energy]} energy <span>·</span> {context.availableMinutes >= 60 ? "60+" : context.availableMinutes} min</strong></div>{compact && <button className="text-button" onClick={() => setOpen((value) => !value)}>Adjust <ChevronDown size={15} /></button>}</div>
      {open && <div className="context-options">
        <div><span><Battery size={15} /> Energy</span><div className="context-chips">{(Object.keys(energyLabels) as DailyEnergy[]).map((energy) => <button key={energy} className={context.energy === energy ? "active" : ""} onClick={() => update({ energy })}>{energyLabels[energy]}</button>)}</div></div>
        <div><span><Clock3 size={15} /> Time</span><div className="context-chips">{times.map((minutes) => <button key={minutes} className={context.availableMinutes === minutes ? "active" : ""} onClick={() => update({ availableMinutes: minutes })}>{minutes >= 60 ? "60+ min" : `${minutes} min`}</button>)}</div></div>
      </div>}
    </section>
  );
}
