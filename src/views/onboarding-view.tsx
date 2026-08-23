"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Home, Plus, Sparkles } from "lucide-react";
import { AvatarCreator } from "@/components/avatar-creator";
import { createOnboardingPlayer, priorityLabels, suggestedStarterTemplateIds, type HomePriority, type OnboardingDraft } from "@/domain/onboarding";
import { seedQuestTemplates } from "@/data/seed";
import { useHomeQuest } from "@/state/homequest-context";

const priorities = Object.keys(priorityLabels) as HomePriority[];

export function OnboardingView() {
  const { completeOnboarding } = useHomeQuest();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>({ householdName: "Our Home", players: [createOnboardingPlayer("", 1)], priorities: [], starterTemplateIds: suggestedStarterTemplateIds([]) });
  const [error, setError] = useState("");
  const player = draft.players[0];
  const next = () => {
    if (step === 1 && !draft.householdName.trim()) return setError("Choose a name for your household.");
    if (step === 2 && draft.players.some((item) => !item.name.trim())) return setError("Give each adventurer a display name.");
    if (step === 3) setDraft((current) => ({ ...current, starterTemplateIds: suggestedStarterTemplateIds(current.priorities) }));
    setError(""); setStep((current) => Math.min(5, current + 1));
  };
  const finish = () => { try { completeOnboarding(draft); } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not begin HomeQuest yet."); } };
  return <main className="onboarding-shell"><section className="onboarding-card panel">
    <div className="onboarding-progress" aria-label={`Onboarding step ${step + 1} of 6`}><span>{step + 1} / 6</span><div><i style={{ width: `${((step + 1) / 6) * 100}%` }} /></div></div>
    {step === 0 && <div className="onboarding-intro"><div className="onboarding-mark"><Home /><Sparkles /></div><p className="eyebrow">A new adventure</p><h1>Welcome to HomeQuest</h1><p>Turn everyday care into small quests, shared progress, and a home you build together.</p></div>}
    {step === 1 && <label className="onboarding-field"><span>What should we call this household?</span><input aria-label="Household name" value={draft.householdName} onChange={(event) => setDraft({ ...draft, householdName: event.target.value })} maxLength={60} autoFocus /></label>}
    {step === 2 && <div className="onboarding-players"><p className="eyebrow">Your party</p><h1>Who lives here?</h1>{draft.players.map((item, index) => <label className="onboarding-field" key={item.id}><span>Adventurer {index + 1}</span><input aria-label={`Adventurer ${index + 1} name`} value={item.name} onChange={(event) => setDraft({ ...draft, players: draft.players.map((candidate) => candidate.id === item.id ? { ...candidate, name: event.target.value } : candidate) })} placeholder="Display name" /></label>)}{draft.players.length < 2 && <button type="button" className="soft-button" onClick={() => setDraft({ ...draft, players: [...draft.players, createOnboardingPlayer("", draft.players.length + 1)] })}><Plus size={16} /> Add another adventurer</button>}<p className="form-note">One player works beautifully too.</p></div>}
    {step === 3 && <div><p className="eyebrow">A little direction</p><h1>What would help most?</h1><p className="form-note">Choose up to four. We’ll suggest a calm starter list.</p><div className="priority-grid">{priorities.map((priority) => <button type="button" key={priority} className={draft.priorities.includes(priority) ? "selected" : ""} aria-pressed={draft.priorities.includes(priority)} onClick={() => setDraft((current) => ({ ...current, priorities: current.priorities.includes(priority) ? current.priorities.filter((item) => item !== priority) : current.priorities.length < 4 ? [...current.priorities, priority] : current.priorities }))}>{priorityLabels[priority]}</button>)}</div></div>}
    {step === 4 && player && <div><p className="eyebrow">Make it yours</p><h1>Shape your first adventurer</h1><AvatarCreator player={{ name: player.name || "Adventurer", avatar: player.avatar }} onChange={(changes) => setDraft((current) => ({ ...current, players: current.players.map((item) => item.id === player.id ? { ...item, avatar: { ...item.avatar, ...changes } } : item) }))} /></div>}
    {step === 5 && <div><p className="eyebrow">Starter quests</p><h1>A gentle beginning</h1><p className="form-note">Keep the ones that fit. You can edit these anytime.</p><div className="starter-list">{seedQuestTemplates.filter((template) => draft.starterTemplateIds.includes(template.id)).map((template) => <label key={template.id}><input type="checkbox" checked={draft.starterTemplateIds.includes(template.id)} onChange={() => setDraft((current) => ({ ...current, starterTemplateIds: current.starterTemplateIds.filter((id) => id !== template.id) }))} /> <span><strong>{template.title}</strong><small>{template.estimatedMinutes} min</small></span></label>)}</div><div className="onboarding-summary"><Check size={18} /> {draft.players.length} adventurer{draft.players.length === 1 ? "" : "s"} · {draft.starterTemplateIds.length} starter quests</div></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="onboarding-actions">{step > 0 && <button type="button" className="soft-button" onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft size={16} /> Back</button>}{step < 5 ? <button type="button" className="primary-button" onClick={next}>Continue <ArrowRight size={16} /></button> : <button type="button" className="primary-button" onClick={finish}>Enter HomeQuest <Sparkles size={16} /></button>}</div>
  </section></main>;
}
