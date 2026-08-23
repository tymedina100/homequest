"use client";

import { ChefHat, Check, Clock3, ShoppingBasket, Sparkles } from "lucide-react";
import { recipes } from "@/data/seed";
import { suggestMeals } from "@/domain/meals";
import { useHomeQuest } from "@/state/homequest-context";

const kindLabels = { easiest: "Easiest tonight", "use-it-up": "Use it up", comfort: "Comfort pick" };

export function MealsView() {
  const { state } = useHomeQuest();
  const suggestions = suggestMeals(recipes, state.inventory);
  return (
    <div className="view-stack">
      <div className="page-intro"><p className="eyebrow">From your kitchen</p><h1>Dinner, without the spiral.</h1><p>Three useful answers based on what you already have. No endless feed required.</p></div>
      <div className="meal-banner panel"><div className="meal-pot"><ChefHat size={34} /></div><div><span>Kitchen whisper</span><strong>Your spinach and peppers would love to be used soon.</strong></div><Sparkles className="meal-spark" size={24} /></div>
      <div className="meal-grid">
        {suggestions.map((suggestion, index) => (
          <article className={`meal-card meal-${index + 1}`} key={suggestion.kind}>
            <div className="meal-art"><div className="plate"><span>{index === 0 ? "◒" : index === 1 ? "≈" : "◉"}</span></div><i /></div>
            <div className="meal-body"><p className="eyebrow">{kindLabels[suggestion.kind]}</p><h2>{suggestion.recipe.name}</h2><p>{suggestion.recipe.description}</p>
              <div className="meal-meta"><span><Clock3 size={15} /> {suggestion.recipe.prepMinutes} min</span><span><ShoppingBasket size={15} /> {suggestion.score}% at home</span></div>
              <div className="ingredient-summary"><div><Check size={15} /><span>{suggestion.available.join(", ")}</span></div>{suggestion.missing.length > 0 && <div className="missing"><span>+</span><span>Needs {suggestion.missing.join(", ")}</span></div>}</div>
              <blockquote>“{suggestion.reason}”</blockquote>
            </div>
          </article>
        ))}
      </div>
      <p className="gentle-note"><Sparkles size={14} /> Suggestions are calculated locally from your inventory—no AI service or account required.</p>
    </div>
  );
}
