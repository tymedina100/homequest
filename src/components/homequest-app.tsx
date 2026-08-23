"use client";

import { Backpack, ClipboardList, Home, Menu, Soup, Sparkles, UserRound, X } from "lucide-react";
import { useState } from "react";
import { CompletionToast } from "@/components/completion-toast";
import { PlayerSwitcher } from "@/components/player-switcher";
import { HomeQuestProvider, useHomeQuest } from "@/state/homequest-context";
import { HomeView } from "@/views/home-view";
import { InventoryView } from "@/views/inventory-view";
import { MealsView } from "@/views/meals-view";
import { ProfileView } from "@/views/profile-view";
import { QuestsView } from "@/views/quests-view";
import { OnboardingView } from "@/views/onboarding-view";
import { KitchenView } from "@/views/kitchen-view";

type ViewId = "home" | "kitchen" | "quests" | "inventory" | "meals" | "profile";
const navItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "quests" as const, label: "Quests", icon: ClipboardList },
  { id: "inventory" as const, label: "Inventory", icon: Backpack },
  { id: "meals" as const, label: "Meals", icon: Soup },
  { id: "profile" as const, label: "Progress", icon: UserRound },
];

function AppContent() {
  const [view, setView] = useState<ViewId>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const { hydrated, needsOnboarding, state } = useHomeQuest();
  if (hydrated && needsOnboarding) return <OnboardingView />;
  const go = (next: ViewId) => { setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="app-shell" data-theme={state.household.cosmetics.equippedThemeId} data-accent={state.household.cosmetics.equippedAccentId ?? "default"} data-reduced-motion={state.session.preferences.reducedMotion}>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand"><div><Home size={21} /><Sparkles size={12} /></div><span>Home<span>Quest</span></span></div>
        <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        <PlayerSwitcher />
        <nav aria-label="Primary navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id || (item.id === "home" && view === "kitchen") ? "active" : ""} onClick={() => go(item.id)}><Icon size={20} /><span>{item.label}</span>{item.id === "quests" && <i />}</button>; })}</nav>
        <div className="sidebar-quote"><Sparkles size={16} /><p>Progress lives in the little things.</p><span>One quest at a time</span></div>
      </aside>
      {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
      <header className="mobile-topbar"><button onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button><div className="brand"><div><Home size={18} /></div><span>Home<span>Quest</span></span></div><PlayerSwitcher compact /><div className={`save-dot ${hydrated ? "ready" : ""}`} title={hydrated ? "Progress saved locally" : "Loading save"} /></header>
      <main className={!hydrated ? "is-loading" : ""}>
        {!hydrated && <div className="loading-state" role="status"><Sparkles size={26} /><p>Warming up your home…</p></div>}
        {hydrated && view === "home" && <HomeView goToQuests={() => go("quests")} goToKitchen={() => go("kitchen")} />}
        {hydrated && view === "kitchen" && <KitchenView goHome={() => go("home")} goInventory={() => go("inventory")} goMeals={() => go("meals")} />}
        {hydrated && view === "quests" && <QuestsView />}
        {hydrated && view === "inventory" && <InventoryView />}
        {hydrated && view === "meals" && <MealsView />}
        {hydrated && view === "profile" && <ProfileView />}
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id || (item.id === "home" && view === "kitchen") ? "active" : ""} onClick={() => go(item.id)}><Icon size={20} /><span>{item.label}</span></button>; })}</nav>
      <CompletionToast />
    </div>
  );
}

export function HomeQuestApp() {
  return <HomeQuestProvider><AppContent /></HomeQuestProvider>;
}
