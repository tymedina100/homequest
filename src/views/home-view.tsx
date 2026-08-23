"use client";

import { ChefHat, ChevronRight, Coins, Compass, Gift, Home, Leaf, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { getLevelProgress } from "@/domain/progression";
import { recommendQuest } from "@/domain/recommendations";
import type { HomeStatKey } from "@/domain/types";
import { useHomeQuest } from "@/state/homequest-context";
import { HomeScene } from "@/components/home-scene";
import { ProgressBar, QuestCard, SectionHeading } from "@/components/ui";
import { DailyContextControls } from "@/components/daily-context";
import { getHomeLevelProgress } from "@/domain/home-progression";
import { DAILY_CHEST_QUESTS } from "@/domain/game-balance";
import { CharacterAvatar } from "@/components/character-avatar";
import { calculateKitchenHarmony, getZoneLevelProgress } from "@/domain/zones";

const statLabels: Record<HomeStatKey, { label: string; icon: string }> = {
  cleanliness: { label: "Clean", icon: "✦" },
  organization: { label: "Order", icon: "◇" },
  supplies: { label: "Stock", icon: "♧" },
  kitchen: { label: "Kitchen", icon: "⌂" },
};

export function HomeView({ goToQuests, goToKitchen }: { goToQuests: () => void; goToKitchen: () => void }) {
  const { state, activePlayer, completeQuest, updateDailyContext, claimDailyChest } = useHomeQuest();
  const household = state.household;
  const progress = getLevelProgress(activePlayer.progression.totalXp);
  const homeProgress = getHomeLevelProgress(household.homeProgression);
  const recommendation = recommendQuest(household.quests, activePlayer.dailyContext, household.homeStats);
  const available = household.quests.filter((quest) => quest.status === "available");
  const kitchenProgress = getZoneLevelProgress(household.zones.kitchen.totalXp);
  const kitchenHarmony = calculateKitchenHarmony(household.zones.kitchen.condition);

  return (
    <div className="view-stack home-view">
      <header className="player-header">
        <div className="avatar"><CharacterAvatar config={activePlayer.avatar} name={activePlayer.name} size={72} /><i /></div>
        <div className="player-copy"><p>Welcome home,</p><h1>{activePlayer.name}</h1></div>
        <div className="level-panel">
          <div><span>Level {progress.level}</span><small>{progress.xpIntoLevel} / {progress.xpNeeded} XP</small></div>
          <ProgressBar value={progress.percent} label="Experience toward the next level" />
        </div>
        <div className="coins"><Coins size={18} /><strong>{activePlayer.coins}</strong></div>
      </header>

      <DailyContextControls context={activePlayer.dailyContext} onChange={updateDailyContext} compact />

      <section className={`daily-chest panel ${activePlayer.dailyChest.status}`} aria-label={`${activePlayer.name}'s Daily Chest`}>
        <div className="chest-icon">{activePlayer.dailyChest.status === "ready" ? <Gift size={22} /> : activePlayer.dailyChest.status === "claimed" ? <Sparkles size={21} /> : <Lock size={18} />}</div>
        <div><p className="eyebrow">{activePlayer.name}&apos;s Daily Chest</p><strong>{activePlayer.dailyChest.status === "ready" ? "A small reward is ready" : activePlayer.dailyChest.status === "claimed" ? "Claimed today" : `${activePlayer.dailyChest.qualifyingQuestIds.length} / ${DAILY_CHEST_QUESTS} meaningful quests`}</strong><span>No streak. Just a little thank-you for showing up.</span></div>
        {activePlayer.dailyChest.status === "ready" ? <button className="small-gold-button" onClick={claimDailyChest}>Open chest</button> : <div className="chest-pips" aria-label={`${activePlayer.dailyChest.qualifyingQuestIds.length} of ${DAILY_CHEST_QUESTS} quests complete`}>{Array.from({ length: DAILY_CHEST_QUESTS }, (_, index) => <i className={index < activePlayer.dailyChest.qualifyingQuestIds.length ? "filled" : ""} key={index} />)}</div>}
      </section>

      <div className="home-grid">
        <section className="home-hero panel">
          <div className="hero-heading"><div><p className="eyebrow">Your sanctuary</p><h2>Home is finding its rhythm.</h2><div className="home-level-line"><Home size={14} /> Home Lv. {homeProgress.level} <span>·</span> {homeProgress.tierName}</div></div><div className="harmony"><Leaf size={16} /> Steady</div></div>
          <HomeScene stats={household.homeStats} tier={homeProgress.tier} tierName={homeProgress.tierName} cosmetics={household.cosmetics} players={household.playerIds.map((id) => state.players[id]).filter(Boolean)} activePlayerId={activePlayer.id} />
          <div className="home-xp-line"><span>Home progress</span><div className="progress-track" role="progressbar" aria-label="Permanent Home Level progress" aria-valuenow={homeProgress.percent}><i style={{ width: `${homeProgress.percent}%` }} /></div><strong>{homeProgress.xpIntoLevel} / {homeProgress.xpNeeded}</strong></div>
          <div className="home-stats">
            {(Object.entries(household.homeStats) as [HomeStatKey, number][]).map(([key, value]) => (
              <div className="home-stat" key={key}>
                <span className="stat-icon">{statLabels[key].icon}</span>
                <div><p>{statLabels[key].label}</p><ProgressBar value={value} label={`${statLabels[key].label} ${value}%`} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="recommendation panel">
          <div className="recommendation-icon"><Compass size={22} /></div>
          <p className="eyebrow">What should I do?</p>
          {recommendation ? (
            <>
              <h2>{recommendation.quest.title}</h2>
              <div className="recommendation-meta">{recommendation.quest.estimatedMinutes} min <span>·</span> {recommendation.quest.effort} effort <span>·</span> +{recommendation.quest.xpReward} XP</div>
              <blockquote>“{recommendation.reason.charAt(0).toUpperCase() + recommendation.reason.slice(1)}”</blockquote>
              <button className="primary-button" onClick={() => completeQuest(recommendation.quest.id)}><Sparkles size={17} /> Begin small win</button>
            </>
          ) : (
            <><h2>All clear for now</h2><blockquote>“You’ve done enough. Enjoy the room you cared for.”</blockquote></>
          )}
          <div className="recommendation-footer"><ShieldCheck size={15} /> Chosen for your time and energy</div>
        </aside>
      </div>

      <section className="home-zones"><SectionHeading eyebrow="The house is becoming your game board" title="Our Home" /><button className="zone-entry-card panel" onClick={goToKitchen}><div className="zone-entry-art"><ChefHat size={28} /><i /></div><div><span className="eyebrow">First active zone</span><h3>Enter the Kitchen</h3><p>{kitchenProgress.tierName} · Level {kitchenProgress.level}</p></div><div className="zone-entry-condition"><strong>{kitchenHarmony}%</strong><span>Harmony</span></div><ChevronRight size={20} /></button></section>

      <section>
        <SectionHeading eyebrow="A short, kind list" title="Today’s quests" action={<button className="text-button" onClick={goToQuests}>See quest log <ChevronRight size={16} /></button>} />
        <div className="quest-list">
          {available.slice(0, 4).map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={() => completeQuest(quest.id)} compact />)}
          {available.length === 0 && <div className="empty-state"><Sparkles size={25} /><h3>The quest board is clear</h3><p>That’s a win. Your home can rest with you.</p></div>}
        </div>
      </section>
    </div>
  );
}
