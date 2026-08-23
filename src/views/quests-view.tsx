"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { DailyContextControls } from "@/components/daily-context";
import { QuestCard, SectionHeading } from "@/components/ui";
import { recurrenceLabel } from "@/domain/recurrence";
import { recommendQuestXp } from "@/domain/rewards";
import { defaultStatEffects, questPresets } from "@/domain/templates";
import type { QuestTemplateDraft } from "@/domain/templates";
import type { HomeStatKey, QuestCategory, QuestRecurrence, QuestTemplate } from "@/domain/types";
import { useHomeQuest } from "@/state/homequest-context";

const categories: QuestCategory[] = ["cleaning", "cooking", "organization", "homekeeping"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Tab = "today" | "templates" | "archived";

function newDraft(): QuestTemplateDraft {
  return { id: "", title: "", description: "", category: "cleaning", estimatedMinutes: 10, effort: "low", recurrence: { cadence: "daily" }, urgency: "soon", escalation: "gentle", statEffects: defaultStatEffects.cleaning, rewardMode: "automatic" };
}

function fromPreset(index: number): QuestTemplateDraft {
  const preset = questPresets[index];
  return { ...newDraft(), ...preset, rewardMode: "automatic", statEffects: { ...preset.statEffects }, recurrence: { ...preset.recurrence } };
}

function QuestEditor({ template, onSave, onClose }: { template?: QuestTemplate; onSave: (draft: QuestTemplateDraft) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<QuestTemplateDraft>(template ? { ...template, description: template.description ?? "", recurrence: { ...template.recurrence }, statEffects: { ...template.statEffects } } : newDraft());
  const suggestedXp = recommendQuestXp(draft);
  const update = (next: Partial<QuestTemplateDraft>) => setDraft((current) => ({ ...current, ...next }));
  const updateRecurrence = (recurrence: QuestRecurrence) => update({ recurrence });
  const updateEffect = (key: HomeStatKey, value: number) => update({ statEffects: { ...draft.statEffects, [key]: value || undefined } });
  const selectedDays = draft.recurrence.daysOfWeek ?? (draft.recurrence.cadence === "weekdays" ? [1, 3, 5] : [0]);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={template ? "Edit quest template" : "Add quest"}>
    <form className="add-modal quest-editor" onSubmit={(event) => { event.preventDefault(); if (draft.title.trim()) onSave({ ...draft, id: template?.id ?? `quest-${Date.now()}`, title: draft.title.trim() }); }}>
      <div className="modal-heading"><div><p className="eyebrow">Your home, your rules</p><h2>{template ? "Edit quest" : "Add quest"}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close quest editor"><X size={18} /></button></div>
      {!template && <label>Start from a helpful preset<select defaultValue="" onChange={(event) => event.target.value && setDraft(fromPreset(Number(event.target.value)))}><option value="">Choose one, or make your own</option>{questPresets.map((preset, index) => <option value={index} key={preset.title}>{preset.title}</option>)}</select></label>}
      <label>Quest title<input autoFocus value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder="e.g. Run the dishwasher" required /></label>
      <div className="form-row"><label>Category<select value={draft.category} onChange={(event) => { const category = event.target.value as QuestCategory; update({ category, statEffects: defaultStatEffects[category] }); }}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label>Recurrence<select value={draft.recurrence.cadence} onChange={(event) => { const cadence = event.target.value as QuestRecurrence["cadence"]; updateRecurrence(cadence === "weekdays" ? { cadence, daysOfWeek: [1, 3, 5] } : cadence === "weekly" ? { cadence, daysOfWeek: [0] } : cadence === "interval" ? { cadence, interval: 3 } : { cadence }); }}><option value="daily">Every day</option><option value="weekdays">Selected days</option><option value="weekly">Once per week</option><option value="interval">Every N days</option><option value="manual">One-time</option><option value="as-needed">As needed</option></select></label></div>
      {(draft.recurrence.cadence === "weekdays" || draft.recurrence.cadence === "weekly") && <div className="weekday-picker" aria-label="Selected weekdays">{weekdays.map((day, index) => <button type="button" key={day} className={selectedDays.includes(index) ? "active" : ""} onClick={() => { const daysOfWeek = selectedDays.includes(index) ? selectedDays.filter((dayIndex) => dayIndex !== index) : [...selectedDays, index]; updateRecurrence({ ...draft.recurrence, daysOfWeek: daysOfWeek.length ? daysOfWeek : selectedDays }); }}>{day}</button>)}</div>}
      {draft.recurrence.cadence === "interval" && <label>Repeat every<input type="number" min={1} max={30} value={draft.recurrence.interval ?? 3} onChange={(event) => updateRecurrence({ cadence: "interval", interval: Math.max(1, Number(event.target.value)) })} /></label>}
      <div className="form-row"><label>Time<select value={draft.estimatedMinutes} onChange={(event) => update({ estimatedMinutes: Number(event.target.value) })}>{[5, 10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes >= 60 ? "60+ min" : `${minutes} min`}</option>)}</select></label><label>Effort<select value={draft.effort} onChange={(event) => update({ effort: event.target.value as QuestTemplate["effort"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
      <div className="suggested-reward"><Sparkles size={17} /><div><span>Suggested reward</span><strong>+{draft.rewardMode === "manual" && draft.manualXpReward !== undefined ? draft.manualXpReward : suggestedXp} XP</strong></div></div>
      <details><summary>Advanced options <span>optional</span></summary><div className="editor-advanced"><label>Description<input value={draft.description ?? ""} onChange={(event) => update({ description: event.target.value })} placeholder="A gentle reminder of what done looks like" /></label><div className="form-row"><label>Priority<select value={draft.urgency} onChange={(event) => update({ urgency: event.target.value as QuestTemplate["urgency"] })}><option value="gentle">Gentle</option><option value="soon">Soon</option><option value="today">Today</option></select></label><label>Escalation<select value={draft.escalation} onChange={(event) => update({ escalation: event.target.value as QuestTemplate["escalation"] })}><option value="non-escalating">No rescue</option><option value="gentle">Gentle</option><option value="rescue-eligible">Rescue eligible</option></select></label></div><label>Preferred time<select value={draft.preferredDaypart ?? "anytime"} onChange={(event) => update({ preferredDaypart: event.target.value as QuestTemplate["preferredDaypart"] })}><option value="anytime">Any time</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label><div className="effect-grid">{(["cleanliness", "organization", "supplies", "kitchen"] as HomeStatKey[]).map((key) => <label key={key}>{key}<input type="number" min={-10} max={20} value={draft.statEffects[key] ?? 0} onChange={(event) => updateEffect(key, Number(event.target.value))} /></label>)}</div><label className="manual-reward"><input type="checkbox" checked={draft.rewardMode === "manual"} onChange={(event) => update({ rewardMode: event.target.checked ? "manual" : "automatic", manualXpReward: event.target.checked ? suggestedXp : undefined })} /> Set a manual XP reward</label>{draft.rewardMode === "manual" && <label>Manual XP<input type="number" min={10} max={90} value={draft.manualXpReward ?? suggestedXp} onChange={(event) => update({ manualXpReward: Number(event.target.value) })} /></label>}</div></details>
      <button className="primary-button editor-save" type="submit"><Sparkles size={17} /> Save quest</button>
    </form>
  </div>;
}

export function QuestsView() {
  const { state, completeQuest, updateDailyContext, createQuestTemplate, updateQuestTemplate, archiveQuestTemplate, restoreQuestTemplate, deleteQuestTemplate } = useHomeQuest();
  const [tab, setTab] = useState<Tab>("today");
  const [editing, setEditing] = useState<QuestTemplate | null | undefined>(undefined);
  const active = state.quests.filter((quest) => quest.status === "available");
  const completed = state.quests.filter((quest) => quest.status === "completed" && quest.occurrenceDate === state.dailyContext.date);
  const templates = state.questTemplates.filter((template) => template.active);
  const archived = state.questTemplates.filter((template) => !template.active);
  const historyFor = (id: string) => state.lifecycle.questHistory.some((entry) => entry.templateId === id) || state.quests.some((quest) => quest.templateId === id && quest.status !== "available");
  const save = (draft: QuestTemplateDraft) => { if (editing) updateQuestTemplate(editing.id, draft); else createQuestTemplate(draft); setEditing(undefined); };
  const visibleTemplates = tab === "templates" ? templates : archived;
  return <div className="view-stack">
    <div className="page-intro"><p className="eyebrow">Your quest board</p><h1>Small wins, chosen well.</h1><p>Build a short system that remembers the chores, so you don’t have to.</p></div>
    <DailyContextControls context={state.dailyContext} onChange={updateDailyContext} />
    <div className="quest-tabs" role="tablist" aria-label="Quest board sections"><button className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>Today</button><button className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>Templates <span>{templates.length}</span></button><button className={tab === "archived" ? "active" : ""} onClick={() => setTab("archived")}>Archived <span>{archived.length}</span></button><button className="add-template" onClick={() => setEditing(null)}><Plus size={16} /> Add quest</button></div>
    {tab === "today" ? <><section><SectionHeading eyebrow={`${active.length} available`} title="For today" /><div className="quest-list detailed">{active.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={() => completeQuest(quest.id)} />)}</div></section>{completed.length > 0 && <section><SectionHeading eyebrow="Nice work" title="Completed today" /><div className="quest-list">{completed.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={() => {}} compact />)}</div></section>}{active.length === 0 && <div className="empty-state panel"><Sparkles size={26} /><h3>Today’s board is complete</h3><p>Close the app. Enjoy the space you made.</p></div>}</> : <section><SectionHeading eyebrow={tab === "templates" ? "Your reusable chores" : "Paused, never erased"} title={tab === "templates" ? "Quest templates" : "Archived templates"} /><div className="template-list">{visibleTemplates.map((template) => <article className="template-card panel" key={template.id}><div><p className="eyebrow">{recurrenceLabel(template.recurrence)}</p><h3>{template.title}</h3><p>{template.estimatedMinutes} min · {template.effort} effort · +{template.rewardMode === "manual" ? template.manualXpReward : recommendQuestXp(template)} XP</p></div><div className="template-actions">{template.active ? <><button aria-label={`Edit ${template.title}`} onClick={() => setEditing(template)}><Pencil size={15} /></button><button aria-label={`Archive ${template.title}`} onClick={() => archiveQuestTemplate(template.id)}><Archive size={15} /></button><button aria-label={historyFor(template.id) ? `Archive ${template.title} instead of deleting history` : `Delete ${template.title}`} onClick={() => historyFor(template.id) ? archiveQuestTemplate(template.id) : deleteQuestTemplate(template.id)}><Trash2 size={15} /></button></> : <><button aria-label={`Restore ${template.title}`} onClick={() => restoreQuestTemplate(template.id)}><ArchiveRestore size={15} /></button><button aria-label={`Delete ${template.title}`} onClick={() => deleteQuestTemplate(template.id)}><Trash2 size={15} /></button></>}</div></article>)}{visibleTemplates.length === 0 && <div className="empty-state panel"><Sparkles size={24} /><h3>{tab === "templates" ? "Make your first quest" : "No archived templates"}</h3><p>{tab === "templates" ? "A preset can get the board useful in a few taps." : "Archived quests stay here when you need them again."}</p></div>}</div></section>}
    {state.lifecycle.dailyHistory.length > 0 && <p className="gentle-note"><RotateCcw size={14} /> {state.lifecycle.dailyHistory.at(-1)?.completedQuestIds.length ?? 0} quest{(state.lifecycle.dailyHistory.at(-1)?.completedQuestIds.length ?? 0) === 1 ? "" : "s"} completed on your most recent active day.</p>}
    <p className="gentle-note"><RotateCcw size={14} /> Recurring quests return gently. Missed days never take progress away.</p>
    {editing !== undefined && <QuestEditor template={editing ?? undefined} onSave={save} onClose={() => setEditing(undefined)} />}
  </div>;
}
