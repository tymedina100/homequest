"use client";

import { useState } from "react";
import { Award, Check, ChevronLeft, ChevronRight, Coins, Compass, Crown, Gift, Home, Lock, Palette, RotateCcw, Sparkles, Star } from "lucide-react";
import { ACHIEVEMENTS } from "@/domain/achievements";
import { COSMETICS, getCosmeticStatus, requirementLabel } from "@/domain/cosmetics";
import { addDays, dateFromKey, toLocalDateKey } from "@/domain/dates";
import { getHomeLevelProgress } from "@/domain/home-progression";
import { getLevelProgress } from "@/domain/progression";
import { getDailySummary, getTomorrowPreview, getWeekStart, getWeeklySummary, formatEstimatedTime } from "@/domain/reflections";
import { getSkillLevelProgress, SKILL_PERKS } from "@/domain/skills";
import type { AppState, PlayerId, QuestCategory } from "@/domain/types";
import { AvatarCreator } from "@/components/avatar-creator";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressBar, SectionHeading } from "@/components/ui";
import { useHomeQuest } from "@/state/homequest-context";

const categoryNames: Record<QuestCategory, string> = { cleaning: "Cleaning", cooking: "Cooking", organization: "Organization", homekeeping: "Homekeeping" };
const categoryIcons: Record<QuestCategory, string> = { cleaning: "✦", cooking: "♨", organization: "◇", homekeeping: "⌂" };

export function ProfileView() {
  const { state, activePlayer, reset, updatePreferences, purchaseCosmetic, equipCosmetic } = useHomeQuest();
  const [tab, setTab] = useState<"progress" | "character" | "journal" | "collection">("progress");
  const today = toLocalDateKey(new Date()); const [selectedDay, setSelectedDay] = useState(today); const [selectedWeek, setSelectedWeek] = useState(getWeekStart(today));
  const playerProgress = getLevelProgress(activePlayer.progression.totalXp); const home = getHomeLevelProgress(state.household.homeProgression);
  const daily = getDailySummary(state, selectedDay); const weekly = getWeeklySummary(state, selectedWeek); const tomorrow = getTomorrowPreview(state, today);
  const equippedTitle = COSMETICS.find((item) => item.id === activePlayer.cosmetics.equippedTitleId)?.title ?? "Keeper of the Hearth";
  const contributionLine = (values: Record<PlayerId, number>) => state.household.playerIds.map((id) => `${state.players[id].name} ${values[id] ?? 0}`).join(" · ");
  return <div className="view-stack">
    <section className="profile-hero panel">
      <div className="profile-avatar character"><CharacterAvatar config={activePlayer.avatar} name={activePlayer.name} size={108} /><span><Sparkles size={15} /></span></div>
      <div className="profile-main"><p className="eyebrow">{equippedTitle}</p><h1>{activePlayer.name}</h1><p>Player Level {playerProgress.level} · Home Level {home.level} · {activePlayer.progression.completedQuestCount} personal contributions</p><div className="profile-progress"><ProgressBar value={playerProgress.percent} label="Player experience progress" /><span>{playerProgress.xpIntoLevel} / {playerProgress.xpNeeded} XP to Player Level {playerProgress.level + 1}</span></div></div>
      <div className="total-xp"><Coins size={20} /><strong>{activePlayer.coins}</strong><span>Coins</span></div>
    </section>

    <div className="progress-tabs" role="tablist" aria-label="Profile sections"><button role="tab" aria-selected={tab === "progress"} className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}><Crown size={17} /> Progress</button><button role="tab" aria-selected={tab === "character"} className={tab === "character" ? "active" : ""} onClick={() => setTab("character")}><Palette size={17} /> Character</button><button role="tab" aria-selected={tab === "collection"} className={tab === "collection" ? "active" : ""} onClick={() => setTab("collection")}><Gift size={17} /> Collection</button><button role="tab" aria-selected={tab === "journal"} className={tab === "journal" ? "active" : ""} onClick={() => setTab("journal")}><Compass size={17} /> Journal</button></div>

    {tab === "progress" && <>
      <section className="home-progression-card panel"><div className={`home-tier-medallion tier-${home.tier}`}><Home size={27} /><span>{home.tier}</span></div><div><p className="eyebrow">Shared household progression</p><h2>Home Level {home.level} · {home.tierName}</h2><p>Both players care for this home together. Its permanent level never goes backward.</p><div className="home-progress-row"><ProgressBar value={home.percent} label="Home Level progress" /><span>{home.xpIntoLevel} / {home.xpNeeded} Home XP</span></div></div></section>
      <section><SectionHeading eyebrow={`${activePlayer.name}'s four skill paths`} title="Personal skills" /><div className="rpg-skill-grid">{(Object.entries(activePlayer.skills) as [QuestCategory, typeof activePlayer.skills.cleaning][]).map(([skill, value]) => { const progress = getSkillLevelProgress(value); const nextPerk = SKILL_PERKS.find((perk) => perk.skill === skill && perk.level > progress.level); return <article className={`rpg-skill-card category-${skill}`} key={skill}><div className="skill-level-orb">{categoryIcons[skill]}<small>Lv</small><strong>{progress.level}</strong></div><div className="rpg-skill-copy"><h3>{categoryNames[skill]}</h3><p>{value.completedQuestCount} quests mastered</p><ProgressBar value={progress.percent} label={`${categoryNames[skill]} Level ${progress.level} progress`} /><span>{progress.xpIntoLevel} / {progress.xpNeeded} skill XP</span>{nextPerk ? <div className="next-perk"><Lock size={12} /><span>Lv. {nextPerk.level} · {nextPerk.title}</span></div> : <div className="next-perk unlocked"><Star size={12} /><span>Early path mastered</span></div>}</div></article>; })}</div></section>
      <section><SectionHeading eyebrow={`${activePlayer.achievements.filter((item) => item.unlockedAt).length} of ${ACHIEVEMENTS.length} discovered by ${activePlayer.name}`} title="Personal achievements" /><div className="achievement-grid">{ACHIEVEMENTS.map((definition) => { const unlocked = activePlayer.achievements.some((item) => item.id === definition.id && item.unlockedAt); return <article className={`achievement-card panel ${unlocked ? "unlocked" : "locked"}`} key={definition.id}><div className="achievement-seal">{unlocked ? <Award size={22} /> : <Lock size={18} />}</div><div><span>{unlocked ? "Achievement unlocked" : definition.hidden ? "Hidden achievement" : "Still ahead"}</span><h3>{unlocked || !definition.hidden ? definition.title : "???"}</h3><p>{unlocked || !definition.hidden ? definition.description : "A quiet secret is waiting somewhere in your journey."}</p><small>{definition.reward.coins ? `Reward · ${definition.reward.coins} coins` : "A special reward awaits"}</small></div>{unlocked && <Check className="reward-check" size={17} />}</article>; })}</div></section>
    </>}

    {tab === "character" && <AvatarCreator />}

    {tab === "collection" && <>
      <section className="collection-intro panel"><div><p className="eyebrow">Shared home · personal titles</p><h2>Make the sanctuary yours, together.</h2><p>Themes and decorations belong to the household. Titles stay with {activePlayer.name}.</p></div><div className="collection-balance"><Coins size={18} /><strong>{activePlayer.coins}</strong><span>{activePlayer.name}&apos;s coins</span></div></section>
      <section><SectionHeading eyebrow="Shared whole-home palettes" title="Themes" /><div className="theme-grid">{COSMETICS.filter((item) => item.type === "theme").map((item) => <CollectionCard item={item} state={state} playerId={activePlayer.id} onBuy={purchaseCosmetic} onEquip={equipCosmetic} key={item.id} />)}</div></section>
      <section><SectionHeading eyebrow="Shared room rewards and personal titles" title="Collection" /><div className="collection-grid">{COSMETICS.filter((item) => item.type !== "theme").map((item) => <CollectionCard item={item} state={state} playerId={activePlayer.id} onBuy={purchaseCosmetic} onEquip={equipCosmetic} key={item.id} />)}</div></section>
    </>}

    {tab === "journal" && <>
      <section className="reflection-card panel"><div className="reflection-heading"><div><p className="eyebrow">Household adventure journal</p><h2>{selectedDay === today ? "Today’s Adventure" : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(dateFromKey(selectedDay))}</h2></div><div className="period-nav"><button aria-label="Previous day" onClick={() => setSelectedDay((day) => addDays(day, -1))}><ChevronLeft size={16} /></button><button aria-label="Next day" disabled={selectedDay === today} onClick={() => setSelectedDay((day) => addDays(day, 1))}><ChevronRight size={16} /></button></div></div>{daily.tone === "quiet" ? <div className="quiet-reflection"><Sparkles size={20} /><div><h3>Quiet Day</h3><p>Nothing logged. Everyone&apos;s permanent progress is still here.</p></div></div> : <><div className="reflection-metrics"><div><strong>{daily.completedCount}</strong><span>household quests</span></div><div><strong>+{daily.xpEarned}</strong><span>shared activity XP</span></div><div><strong>{daily.rescueCount}</strong><span>rescues</span></div></div><p className="contribution-line">Contributions · {contributionLine(daily.contributions)}</p>{daily.biggestWin && <div className="biggest-win"><span>Biggest Win</span><strong>{daily.biggestWin.title}</strong></div>}</>}</section>
      <section className="reflection-card weekly-card panel"><div className="reflection-heading"><div><p className="eyebrow">Cooperative campfire recap</p><h2>Week in Review</h2></div><div className="period-nav"><button aria-label="Previous week" onClick={() => setSelectedWeek((week) => addDays(week, -7))}><ChevronLeft size={16} /></button><button aria-label="Next week" disabled={selectedWeek === getWeekStart(today)} onClick={() => setSelectedWeek((week) => addDays(week, 7))}><ChevronRight size={16} /></button></div></div><p className="weekly-narrative">{weekly.narrative}</p><div className="reflection-metrics"><div><strong>{weekly.completedCount}</strong><span>household quests</span></div><div><strong>{weekly.activeDays}</strong><span>active days</span></div><div><strong>+{weekly.xpEarned}</strong><span>activity XP</span></div></div><p className="contribution-line">Contributions · {contributionLine(weekly.contributions)} · no leaderboard</p></section>
      <section className="tomorrow-card panel"><div><p className="eyebrow">Tomorrow</p><h2>{tomorrow.quests.length ? `${tomorrow.quests.length} quests scheduled` : "A gentle open day"}</h2><p>{tomorrow.quests.length ? `Estimated core time: ${formatEstimatedTime(tomorrow.estimatedMinutes)}` : "Nothing added just to fill a list."}</p></div><Compass size={24} /></section>
    </>}

    <section className="settings panel"><div><div><h3>Gentler motion</h3><p>Reduce decorative movement and celebration effects for everyone on this device.</p></div><button className={`toggle ${state.session.preferences.reducedMotion ? "on" : ""}`} role="switch" aria-checked={state.session.preferences.reducedMotion} onClick={() => updatePreferences({ reducedMotion: !state.session.preferences.reducedMotion })}><span /></button></div>{process.env.NODE_ENV !== "production" && <button className="reset-button" onClick={() => { if (window.confirm("Reset HomeQuest to its starting state?")) reset(); }}><RotateCcw size={15} /> Reset local save <small>Development only</small></button>}</section>
  </div>;
}

function CollectionCard({ item, state, playerId, onBuy, onEquip }: { item: (typeof COSMETICS)[number]; state: AppState; playerId: PlayerId; onBuy: (id: string) => void; onEquip: (id: string) => void }) {
  const status = getCosmeticStatus(state, item, playerId); const canEquip = status === "owned";
  return <article className={`collection-card panel ${status}`}><div className={`cosmetic-preview preview-${item.preview}`}><span>{item.type === "theme" ? <Sparkles /> : item.type === "title" ? <Crown /> : <Home />}</span></div><div className="collection-copy"><span>{status === "locked" ? requirementLabel(item) : status}</span><h3>{item.title}</h3><p>{item.description}</p></div>{status === "available" && <button onClick={() => onBuy(item.id)}>{item.cost > 0 ? <><Coins size={14} /> {item.cost}</> : "Claim"}</button>}{canEquip && <button onClick={() => onEquip(item.id)}>Equip</button>}{status === "equipped" && <div className="equipped-mark"><Check size={14} /> Equipped</div>}</article>;
}
