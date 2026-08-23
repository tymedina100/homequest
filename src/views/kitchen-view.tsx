"use client";

import { ArrowLeft, Backpack, ChevronRight, Clock3, Coins, Compass, CookingPot, PackageOpen, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import { KitchenScene } from "@/components/kitchen-scene";
import { ProgressBar, SectionHeading } from "@/components/ui";
import { COSMETICS, getCosmeticStatus, requirementLabel } from "@/domain/cosmetics";
import { recipes } from "@/data/seed";
import { suggestMeals } from "@/domain/meals";
import { recommendQuest } from "@/domain/recommendations";
import type { KitchenConditionKey } from "@/domain/types";
import { calculateKitchenHarmony, calculateKitchenQuestXp, conditionLabel, getZoneLevelProgress } from "@/domain/zones";
import { useHomeQuest } from "@/state/homequest-context";

const conditionCopy: Record<KitchenConditionKey, { label: string; icon: string }> = {
  dishes: { label: "Dishes", icon: "◒" }, counters: { label: "Counters", icon: "◇" }, floor: { label: "Floor", icon: "▱" }, trash: { label: "Trash", icon: "♲" }, food: { label: "Food", icon: "♧" },
};

function impactLabel(key: KitchenConditionKey, amount: number): string { return `${conditionCopy[key].label} ${amount > 0 ? "+" : ""}${amount}`; }

export function KitchenView({ goHome, goInventory, goMeals }: { goHome: () => void; goInventory: () => void; goMeals: () => void }) {
  const { state, activePlayer, completeQuest, purchaseCosmetic, equipCosmetic } = useHomeQuest();
  const kitchen = state.household.zones.kitchen;
  const progress = getZoneLevelProgress(kitchen.totalXp);
  const harmony = calculateKitchenHarmony(kitchen.condition);
  const quests = state.household.quests.filter((quest) => quest.zoneId === "kitchen" && quest.status === "available");
  const recommendation = recommendQuest(quests, activePlayer.dailyContext, state.household.homeStats, { zoneId: "kitchen", kitchenCondition: kitchen.condition });
  const counts = { fridge: 0, freezer: 0, pantry: 0 };
  for (const item of state.household.inventory) counts[item.storageLocation] += 1;
  const useSoon = state.household.inventory.filter((item) => item.useSoon);
  const lowStock = state.household.inventory.filter((item) => item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold);
  const meal = suggestMeals(recipes, state.household.inventory)[0];
  const kitchenCosmetics = COSMETICS.filter((item) => item.zoneId === "kitchen");

  return <div className="view-stack kitchen-view">
    <header className="zone-header">
      <button className="zone-back" onClick={goHome}><ArrowLeft size={17} /> Our Home</button>
      <div><p className="eyebrow">Home Zone</p><h1>Kitchen</h1><p>A shared room Tyler and Rachel can steady, grow, and make their own.</p></div>
      <div className="zone-level-seal"><span>Level {progress.level}</span><strong>{progress.tierName}</strong><small>{progress.xpIntoLevel} / {progress.xpNeeded} Kitchen XP</small></div>
    </header>

    <section className="kitchen-hero panel">
      <div className="kitchen-hero-heading"><div><p className="eyebrow">Shared household room</p><h2>{progress.tierName}</h2></div><div className="harmony-orb"><span>{harmony}%</span><small>Kitchen Harmony</small></div></div>
      <KitchenScene condition={kitchen.condition} tier={progress.tier} tierName={progress.tierName} cosmetics={kitchen.cosmetics} players={state.household.playerIds.map((id) => state.players[id]).filter(Boolean)} activePlayerId={activePlayer.id} />
      <div className="zone-xp-line"><span>Permanent Kitchen progress</span><ProgressBar value={progress.percent} label={`Kitchen Level ${progress.level} progress`} /><strong>{kitchen.totalXp} total XP</strong></div>
    </section>

    <div className="kitchen-play-grid">
      <section className="kitchen-status panel" aria-label="Kitchen condition">
        <div className="status-heading"><div><p className="eyebrow">How the room feels now</p><h2>Kitchen Harmony · {harmony}%</h2></div><Sparkles size={20} /></div>
        <div className="condition-list">{(Object.keys(conditionCopy) as KitchenConditionKey[]).map((key) => <div className="condition-row" key={key}><span className="condition-icon">{conditionCopy[key].icon}</span><strong>{conditionCopy[key].label}</strong><span>{conditionLabel(kitchen.condition[key])}</span><i aria-hidden="true" style={{ "--condition": `${kitchen.condition[key]}%` } as React.CSSProperties} /><small>{kitchen.condition[key]}</small></div>)}</div>
        <p className="gentle-note">Condition can ebb with daily life. Kitchen Level and earned decor never go backward.</p>
      </section>

      <aside className="kitchen-move panel">
        <div className="recommendation-icon"><Compass size={22} /></div><p className="eyebrow">Best Kitchen Move</p>
        {recommendation ? <><h2>{recommendation.quest.title}</h2><div className="recommendation-meta">{recommendation.quest.estimatedMinutes} min <span>·</span> {recommendation.quest.effort} effort</div><blockquote>“{recommendation.reason.charAt(0).toUpperCase() + recommendation.reason.slice(1)}”</blockquote><div className="zone-reward-chips">{Object.entries(recommendation.quest.zoneEffects ?? {}).filter(([, value]) => value).map(([key, value]) => <span key={key}>{impactLabel(key as KitchenConditionKey, value ?? 0)}</span>)}<span>Kitchen +{calculateKitchenQuestXp(recommendation.quest)} XP</span></div><button className="primary-button" onClick={() => completeQuest(recommendation.quest.id)}><Sparkles size={16} /> Complete this move</button></> : <><h2>The Kitchen can rest</h2><blockquote>“There’s no Kitchen quest asking for you right now.”</blockquote></>}
      </aside>
    </div>

    <section><SectionHeading eyebrow={`${quests.length} room quest${quests.length === 1 ? "" : "s"}`} title="Kitchen quest board" /><div className="kitchen-quest-list">{quests.map((quest) => <article className={`kitchen-quest panel kind-${quest.kind ?? "normal"}`} key={quest.id}><button className="quest-check" onClick={() => completeQuest(quest.id)} aria-label={`Complete ${quest.title}`}><span /></button><div><div className="quest-topline"><span>{quest.kind === "rescue" ? "Kitchen Rescue" : "Kitchen quest"}</span>{quest.kind === "rescue" && <em>Rescue</em>}</div><h3>{quest.title}</h3><p>{quest.description}</p><div className="quest-meta"><span><Clock3 size={14} /> {quest.estimatedMinutes} min</span><span>{quest.effort} effort</span></div><div className="zone-impact">{Object.entries(quest.zoneEffects ?? {}).filter(([, value]) => value).map(([key, value]) => <span key={key}>{impactLabel(key as KitchenConditionKey, value ?? 0)}</span>)}<strong><Sparkles size={13} /> Kitchen +{calculateKitchenQuestXp(quest)} XP</strong></div></div></article>)}{!quests.length && <div className="empty-state panel"><Sparkles size={24} /><h3>The room quest board is clear</h3><p>Enjoy the space you cared for.</p></div>}</div></section>

    <div className="kitchen-resource-grid">
      <section className="food-watch panel"><div className="resource-icon"><Backpack size={20} /></div><p className="eyebrow">Food Watch</p><h2>{useSoon.length ? `${useSoon.length} item${useSoon.length === 1 ? "" : "s"} to use soon` : "Nothing urgent in the pantry"}</h2><div className="storage-counts"><span>Fridge <strong>{counts.fridge}</strong></span><span>Freezer <strong>{counts.freezer}</strong></span><span>Pantry <strong>{counts.pantry}</strong></span></div>{useSoon.slice(0, 3).map((item) => <div className="food-watch-item" key={item.id}><PackageOpen size={14} /><span>{item.name}</span><em>Use soon</em></div>)}{lowStock.length > 0 && <p className="low-stock-note">{lowStock.length} low-stock item{lowStock.length === 1 ? "" : "s"}</p>}<button className="text-button" onClick={goInventory}>Open Inventory <ChevronRight size={15} /></button></section>
      <section className="cook-preview panel"><div className="resource-icon"><CookingPot size={20} /></div><p className="eyebrow">Cook Something</p>{meal && <><h2>{meal.recipe.name}</h2><p>{meal.recipe.description}</p><div className="meal-meta"><span><Clock3 size={14} /> {meal.recipe.prepMinutes} min</span><span><ShoppingBasket size={14} /> {meal.available.length} / {meal.recipe.ingredients.length} ingredients</span></div></>}<button className="text-button" onClick={goMeals}>See meal ideas <ChevronRight size={15} /></button></section>
    </div>

    <section className="kitchen-decor-section"><SectionHeading eyebrow="Shared room collection" title="Kitchen details" /><p className="decor-ownership-note"><Coins size={14} /> {activePlayer.name} pays with personal coins; unlocked Kitchen decor belongs to the whole household.</p><div className="kitchen-decor-grid">{kitchenCosmetics.map((item) => { const status = getCosmeticStatus(state, item, activePlayer.id); return <article className={`kitchen-decor-card panel ${status}`} key={item.id}><div className={`kitchen-decor-preview preview-${item.preview}`}><Utensils size={22} /></div><div><span>{status === "locked" ? requirementLabel(item) : status}</span><h3>{item.title}</h3><p>{item.description}</p></div>{status === "available" && <button aria-label={`Buy ${item.title}`} onClick={() => purchaseCosmetic(item.id)}>{item.cost ? <><Coins size={13} /> {item.cost}</> : "Claim"}</button>}{status === "owned" && <button aria-label={`Equip ${item.title}`} onClick={() => equipCosmetic(item.id)}>Equip</button>}{status === "equipped" && <strong className="equipped-mark">Equipped</strong>}</article>; })}</div></section>
  </div>;
}
