"use client";

import { AlertCircle, Minus, Plus, Search, Snowflake, Soup, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { StorageLocation } from "@/domain/types";
import { useHomeQuest } from "@/state/homequest-context";

const locations: { id: StorageLocation; label: string; icon: React.ReactNode }[] = [
  { id: "fridge", label: "Fridge", icon: <Soup size={17} /> },
  { id: "freezer", label: "Freezer", icon: <Snowflake size={17} /> },
  { id: "pantry", label: "Pantry", icon: <span>◫</span> },
];

export function InventoryView() {
  const { state, addInventoryItem } = useHomeQuest();
  const [location, setLocation] = useState<StorageLocation>("fridge");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const items = useMemo(() => state.household.inventory.filter((item) => item.storageLocation === location && item.name.toLowerCase().includes(query.toLowerCase())), [state.household.inventory, location, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    addInventoryItem({ id: `${Date.now()}`, name, category: "other", quantity, unit: String(data.get("unit") || "item"), storageLocation: location, ingredientTags: [name.toLowerCase()] });
    setAdding(false); setQuantity(1);
  }

  return (
    <div className="view-stack">
      <div className="page-intro inventory-intro"><div><p className="eyebrow">Your provisions</p><h1>Everything in its place.</h1><p>A quick view of what’s home—without turning groceries into homework.</p></div><button className="primary-button" onClick={() => setAdding(true)}><Plus size={18} /> Add item</button></div>
      <div className="inventory-toolbar">
        <div className="inventory-tabs" role="tablist">{locations.map((item) => <button role="tab" aria-selected={location === item.id} className={location === item.id ? "active" : ""} key={item.id} onClick={() => setLocation(item.id)}>{item.icon}{item.label}<span>{state.household.inventory.filter((entry) => entry.storageLocation === item.id).length}</span></button>)}</div>
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an item" /></label>
      </div>
      <div className="inventory-grid">
        {items.map((item) => <article className="inventory-card panel" key={item.id}>
          <div className={`food-icon food-${item.category}`}>{item.name.charAt(0)}</div>
          <div><h3>{item.name}</h3><p>{item.quantity} {item.unit}</p>{item.useSoon && <span className="use-soon"><AlertCircle size={13} /> Use soon</span>}</div>
          <span className="location-dot">{location}</span>
        </article>)}
        {items.length === 0 && <div className="empty-state panel"><Search size={24} /><h3>No items found</h3><p>Try another shelf or add what belongs here.</p></div>}
      </div>
      {adding && <div className="modal-backdrop" role="presentation" onMouseDown={() => setAdding(false)}><form className="add-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><p className="eyebrow">Quick add</p><h2>Add to {location}</h2></div><button type="button" className="icon-button" onClick={() => setAdding(false)} aria-label="Close"><X size={20} /></button></div>
        <label>Item name<input name="name" placeholder="e.g. Greek yogurt" autoFocus required /></label>
        <div className="form-row"><label>Quantity<div className="quantity-stepper"><button type="button" onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}><Minus size={16} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 0.5)}><Plus size={16} /></button></div></label><label>Unit<select name="unit"><option>item</option><option>bag</option><option>box</option><option>lb</option><option>bottle</option></select></label></div>
        <details><summary>Advanced details <span>optional</span></summary><p>Expiration, notes, and shelf details are supported by the data model and will be editable in the next inventory slice.</p></details>
        <button className="primary-button full" type="submit">Save to {location}</button>
      </form></div>}
    </div>
  );
}
