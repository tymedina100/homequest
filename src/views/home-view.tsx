"use client";

import { ChevronRight, Coins, Compass, Gift, Home, Leaf, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { getLevelProgress } from "@/domain/progression";
import { recommendQuest } from "@/domain/recommendations";
import type { HomeStatKey } from "@/domain/types";
import { useHomeQuest } from "@/state/homequest-context";
import { HomeScene } from "@/components/home-scene";
import { ProgressBar, QuestCard, SectionHeading } from "@/components/ui";
import { DailyContextControls } from "@/components/daily-context";
import { getHomeLevelProgress } from "@/domain/home-progression";
import { DAILY_CHEST_QUESTS } from "@/domain/game-balance";

const statLabels: Record<HomeStatKey, { label: string; icon: string }> = {
  cleanliness: { label: "Clean", icon: "✦" },
  organization: { label: "Order", icon: "◇" },
  supplies: { label: "Stock", icon: "♧" },
  kitchen: { label: "Kitchen", icon: "⌂" },
};

export function HomeView({ goToQuests }: { goToQuests: () => void }) {
  const { state, completeQuest, updateDailyContext, claimDailyChest } = useHomeQuest();
  const progress = getLevelProgress(state.progression.totalXp);
  const homeProgress = getHomeLevelProgress(state.homeProgression);
  const recommendation = recommendQuest(state.quests, state.dailyContext, state.homeStats);
  const available = state.quests.filter((quest) => quest.status === "available");

  return (
    <div className="view-stack home-view">
      <header className="player-header">
        <div className="avatar"><span>T</span><i /></div>
        <div className="player-copy"><p>Welcome home,</p><h1>{state.player.name}</h1></div>
        <div className="level-panel">
          <div><span>Level {progress.level}</span><small>{progress.xpIntoLevel} / {progress.xpNeeded} XP</small></div>
          <ProgressBar value={progress.percent} label="Experience toward the next level" />
        </div>
        <div className="coins"><Coins size={18} /><strong>{state.player.coins}</strong></div>
      </header>

      <DailyContextControls context={state.dailyContext} onChange={updateDailyContext} compact />

      <section className={`daily-chest panel ${state.dailyChest.status}`} aria-label="Daily Chest">
        <div className="chest-icon">{state.dailyChest.status === "ready" ? <Gift size={22} /> : state.dailyChest.status === "claimed" ? <Sparkles size={21} /> : <Lock size={18} />}</div>
        <div><p className="eyebrow">Daily Chest</p><strong>{state.dailyChest.status === "ready" ? "A small reward is ready" : state.dailyChest.status === "claimed" ? "Claimed today" : `${state.dailyChest.qualifyingQuestIds.length} / ${DAILY_CHEST_QUESTS} meaningful quests`}</strong><span>No streak. Just a little thank-you for showing up.</span></div>
        {state.dailyChest.status === "ready" ? <button className="small-gold-button" onClick={claimDailyChest}>Open chest</button> : <div className="chest-pips" aria-label={`${state.dailyChest.qualifyingQuestIds.length} of ${DAILY_CHEST_QUESTS} quests complete`}>{Array.from({ length: DAILY_CHEST_QUESTS }, (_, index) => <i className={index < state.dailyChest.qualifyingQuestIds.length ? "filled" : ""} key={index} />)}</div>}
      </section>

      <div className="home-grid">
        <section className="home-hero panel">
          <div className="hero-heading"><div><p className="eyebrow">Your sanctuary</p><h2>Home is finding its rhythm.</h2><div className="home-level-line"><Home size={14} /> Home Lv. {homeProgress.level} <span>·</span> {homeProgress.tierName}</div></div><div className="harmony"><Leaf size={16} /> Steady</div></div>
          <HomeScene stats={state.homeStats} tier={homeProgress.tier} tierName={homeProgress.tierName} cosmetics={state.cosmetics} />
          <div className="home-xp-line"><span>Home progress</span><div className="progress-track" role="progressbar" aria-label="Permanent Home Level progress" aria-valuenow={homeProgress.percent}><i style={{ width: `${homeProgress.percent}%` }} /></div><strong>{homeProgress.xpIntoLevel} / {homeProgress.xpNeeded}</strong></div>
          <div className="home-stats">
            {(Object.entries(state.homeStats) as [HomeStatKey, number][]).map(([key, value]) => (
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
