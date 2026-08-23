"use client";

import { useState } from "react";
import { Award, Check, ChevronLeft, ChevronRight, Coins, Compass, Crown, Gift, Home, Lock, RotateCcw, Sparkles, Star } from "lucide-react";
import { ACHIEVEMENTS } from "@/domain/achievements";
import { COSMETICS, getCosmeticStatus, requirementLabel } from "@/domain/cosmetics";
import { addDays, dateFromKey, toLocalDateKey } from "@/domain/dates";
import { getHomeLevelProgress } from "@/domain/home-progression";
import { getLevelProgress } from "@/domain/progression";
import { getDailySummary, getTomorrowPreview, getWeekStart, getWeeklySummary, formatEstimatedTime } from "@/domain/reflections";
import { getSkillLevelProgress, SKILL_PERKS } from "@/domain/skills";
import type { QuestCategory } from "@/domain/types";
import { ProgressBar, SectionHeading } from "@/components/ui";
import { useHomeQuest } from "@/state/homequest-context";

const categoryNames: Record<QuestCategory, string> = { cleaning: "Cleaning", cooking: "Cooking", organization: "Organization", homekeeping: "Homekeeping" };
const categoryIcons: Record<QuestCategory, string> = { cleaning: "✦", cooking: "♨", organization: "◇", homekeeping: "⌂" };

export function ProfileView() {
  const { state, reset, updatePreferences, purchaseCosmetic, equipCosmetic } = useHomeQuest();
  const [tab, setTab] = useState<"progress" | "journal" | "collection">("progress");
  const today = toLocalDateKey(new Date()); const [selectedDay, setSelectedDay] = useState(today); const [selectedWeek, setSelectedWeek] = useState(getWeekStart(today));
  const player = getLevelProgress(state.progression.totalXp); const home = getHomeLevelProgress(state.homeProgression);
  const daily = getDailySummary(state, selectedDay); const weekly = getWeeklySummary(state, selectedWeek); const tomorrow = getTomorrowPreview(state, today);
  const equippedTitle = COSMETICS.find((item) => item.id === state.cosmetics.equippedTitleId)?.title ?? "Keeper of the Hearth";
  return <div className="view-stack">
    <section className="profile-hero panel">
      <div className="profile-avatar">T<span><Sparkles size={15} /></span></div>
      <div className="profile-main"><p className="eyebrow">{equippedTitle}</p><h1>{state.player.name}</h1><p>Player Level {player.level} · Home Level {home.level} · {state.progression.completedQuestCount} quests</p><div className="profile-progress"><ProgressBar value={player.percent} label="Player experience progress" /><span>{player.xpIntoLevel} / {player.xpNeeded} XP to Player Level {player.level + 1}</span></div></div>
      <div className="total-xp"><Coins size={20} /><strong>{state.player.coins}</strong><span>Coins</span></div>
    </section>

    <div className="progress-tabs" role="tablist" aria-label="Progress sections"><button role="tab" aria-selected={tab === "progress"} className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}><Crown size={17} /> Progress</button><button role="tab" aria-selected={tab === "collection"} className={tab === "collection" ? "active" : ""} onClick={() => setTab("collection")}><Gift size={17} /> Collection</button><button role="tab" aria-selected={tab === "journal"} className={tab === "journal" ? "active" : ""} onClick={() => setTab("journal")}><Compass size={17} /> Journal</button></div>

    {tab === "progress" && <>
      <section className="home-progression-card panel"><div className={`home-tier-medallion tier-${home.tier}`}><Home size={27} /><span>{home.tier}</span></div><div><p className="eyebrow">Permanent home progression</p><h2>Home Level {home.level} · {home.tierName}</h2><p>Your current home condition can fluctuate. This level—and everything it unlocked—never goes backward.</p><div className="home-progress-row"><ProgressBar value={home.percent} label="Home Level progress" /><span>{home.xpIntoLevel} / {home.xpNeeded} Home XP</span></div></div></section>
      <section><SectionHeading eyebrow="Four ways your home grows" title="Household skills" /><div className="rpg-skill-grid">{(Object.entries(state.skills) as [QuestCategory, typeof state.skills.cleaning][]).map(([skill, value]) => { const progress = getSkillLevelProgress(value); const nextPerk = SKILL_PERKS.find((perk) => perk.skill === skill && perk.level > progress.level); return <article className={`rpg-skill-card category-${skill}`} key={skill}><div className="skill-level-orb">{categoryIcons[skill]}<small>Lv</small><strong>{progress.level}</strong></div><div className="rpg-skill-copy"><h3>{categoryNames[skill]}</h3><p>{value.completedQuestCount} quests mastered</p><ProgressBar value={progress.percent} label={`${categoryNames[skill]} Level ${progress.level} progress`} /><span>{progress.xpIntoLevel} / {progress.xpNeeded} skill XP</span>{nextPerk ? <div className="next-perk"><Lock size={12} /><span>Lv. {nextPerk.level} · {nextPerk.title}</span></div> : <div className="next-perk unlocked"><Star size={12} /><span>Early path mastered</span></div>}</div></article>; })}</div></section>
      <section><SectionHeading eyebrow={`${state.achievements.filter((item) => item.unlockedAt).length} of ${ACHIEVEMENTS.length} discovered`} title="Achievements" /><div className="achievement-grid">{ACHIEVEMENTS.map((definition) => { const unlocked = state.achievements.some((item) => item.id === definition.id && item.unlockedAt); return <article className={`achievement-card panel ${unlocked ? "unlocked" : "locked"}`} key={definition.id}><div className="achievement-seal">{unlocked ? <Award size={22} /> : <Lock size={18} />}</div><div><span>{unlocked ? "Achievement unlocked" : definition.hidden ? "Hidden achievement" : "Still ahead"}</span><h3>{unlocked || !definition.hidden ? definition.title : "???"}</h3><p>{unlocked || !definition.hidden ? definition.description : "A quiet secret is waiting somewhere in your journey."}</p><small>{definition.reward.coins ? `Reward · ${definition.reward.coins} coins` : "A special reward awaits"}</small></div>{unlocked && <Check className="reward-check" size={17} />}</article>; })}</div></section>
    </>}

    {tab === "collection" && <>
      <section className="collection-intro panel"><div><p className="eyebrow">Rewards collection</p><h2>Make the sanctuary yours.</h2><p>Coins only unlock visual rewards. Nothing here makes you better at chores.</p></div><div className="collection-balance"><Coins size={18} /><strong>{state.player.coins}</strong><span>available</span></div></section>
      <section><SectionHeading eyebrow="Whole-home palettes" title="Themes" /><div className="theme-grid">{COSMETICS.filter((item) => item.type === "theme").map((item) => <CollectionCard item={item} state={state} onBuy={purchaseCosmetic} onEquip={equipCosmetic} key={item.id} />)}</div></section>
      <section><SectionHeading eyebrow="Visible in your room" title="Decorations" /><div className="collection-grid">{COSMETICS.filter((item) => item.type !== "theme").map((item) => <CollectionCard item={item} state={state} onBuy={purchaseCosmetic} onEquip={equipCosmetic} key={item.id} />)}</div></section>
    </>}

    {tab === "journal" && <>
      <section className="reflection-card panel"><div className="reflection-heading"><div><p className="eyebrow">Adventure journal</p><h2>{selectedDay === today ? "Today’s Adventure" : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(dateFromKey(selectedDay))}</h2></div><div className="period-nav"><button aria-label="Previous day" onClick={() => setSelectedDay((day) => addDays(day, -1))}><ChevronLeft size={16} /></button><button aria-label="Next day" disabled={selectedDay === today} onClick={() => setSelectedDay((day) => addDays(day, 1))}><ChevronRight size={16} /></button></div></div>{daily.tone === "quiet" ? <div className="quiet-reflection"><Sparkles size={20} /><div><h3>Quiet Day</h3><p>Nothing logged. Your permanent progress is still here.</p></div></div> : <><div className="reflection-metrics"><div><strong>{daily.completedCount}</strong><span>quests</span></div><div><strong>+{daily.xpEarned}</strong><span>XP</span></div><div><strong>{daily.rescueCount}</strong><span>rescues</span></div></div>{daily.biggestWin && <div className="biggest-win"><span>Biggest Win</span><strong>{daily.biggestWin.title}</strong></div>}</>}</section>
      <section className="reflection-card weekly-card panel"><div className="reflection-heading"><div><p className="eyebrow">Campfire recap</p><h2>Week in Review</h2></div><div className="period-nav"><button aria-label="Previous week" onClick={() => setSelectedWeek((week) => addDays(week, -7))}><ChevronLeft size={16} /></button><button aria-label="Next week" disabled={selectedWeek === getWeekStart(today)} onClick={() => setSelectedWeek((week) => addDays(week, 7))}><ChevronRight size={16} /></button></div></div><p className="weekly-narrative">{weekly.narrative}</p><div className="reflection-metrics"><div><strong>{weekly.completedCount}</strong><span>quests</span></div><div><strong>{weekly.activeDays}</strong><span>active days</span></div><div><strong>+{weekly.xpEarned}</strong><span>XP</span></div></div></section>
      <section className="tomorrow-card panel"><div><p className="eyebrow">Tomorrow</p><h2>{tomorrow.quests.length ? `${tomorrow.quests.length} quests scheduled` : "A gentle open day"}</h2><p>{tomorrow.quests.length ? `Estimated core time: ${formatEstimatedTime(tomorrow.estimatedMinutes)}` : "Nothing added just to fill a list."}</p></div><Compass size={24} /></section>
    </>}

    <section className="settings panel"><div><div><h3>Gentler motion</h3><p>Reduce decorative movement and celebration effects.</p></div><button className={`toggle ${state.preferences.reducedMotion ? "on" : ""}`} role="switch" aria-checked={state.preferences.reducedMotion} onClick={() => updatePreferences({ reducedMotion: !state.preferences.reducedMotion })}><span /></button></div>{process.env.NODE_ENV !== "production" && <button className="reset-button" onClick={() => { if (window.confirm("Reset HomeQuest to its starting state?")) reset(); }}><RotateCcw size={15} /> Reset local save <small>Development only</small></button>}</section>
  </div>;
}

function CollectionCard({ item, state, onBuy, onEquip }: { item: (typeof COSMETICS)[number]; state: ReturnType<typeof useHomeQuest>["state"]; onBuy: (id: string) => void; onEquip: (id: string) => void }) {
  const status = getCosmeticStatus(state, item); const canEquip = status === "owned";
  return <article className={`collection-card panel ${status}`}><div className={`cosmetic-preview preview-${item.preview}`}><span>{item.type === "theme" ? <Sparkles /> : item.type === "title" ? <Crown /> : <Home />}</span></div><div className="collection-copy"><span>{status === "locked" ? requirementLabel(item) : status}</span><h3>{item.title}</h3><p>{item.description}</p></div>{status === "available" && <button onClick={() => onBuy(item.id)}>{item.cost > 0 ? <><Coins size={14} /> {item.cost}</> : "Claim"}</button>}{canEquip && <button onClick={() => onEquip(item.id)}>Equip</button>}{status === "equipped" && <div className="equipped-mark"><Check size={14} /> Equipped</div>}</article>;
}
