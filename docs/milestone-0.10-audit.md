# Milestone 0.10 daily-use audit

## Prioritized changes

1. **Make Quick Complete unmistakable.** Existing cards call the canonical completion transaction, but ordinary completion is represented by a small unlabeled circle and the primary recommendation says “Begin small win” even though it completes immediately. Use a visible, keyboard-accessible Quick Complete action on common quest cards and explicit completion copy on recommendations and Zone boards.
2. **Put the next useful action earlier on mobile.** At 390×844, the Home scene and four global meters push “What should I do?” well below the first viewport. Keep the scene as the emotional centerpiece, but place the recommendation before it in the mobile reading order.
3. **Complete consolidated Zone reward feedback.** Bathroom XP and Bathroom level/tier unlocks are present in the canonical transaction but omitted from the toast. Present Kitchen and Bathroom rewards consistently without adding another modal.
4. **Prove recommendation quality with real situations.** Cover low-energy urgency, locked-in Rescue work, critical Bathroom condition, Comeback priority, and the dominant explanation reason. Tune only where the scenario result is unintuitive; keep scoring deterministic and opaque to the user.
5. **Make re-entry feel bounded.** Rescue and Comeback quests may legitimately coexist. Favor the welcoming Comeback in the recommendation when it fits, and keep Home’s short list from becoming a wall of special quests; retain every quest in the full Quest Log.
6. **Stop abstract Bathroom Supplies decay.** Cleanliness dimensions can decline daily, but inventory-like supplies should change through inventory/restocking work rather than an automatic daily leak. Keep other condition weights, effects, and decay unchanged.
7. **Extract only proven Zone commonality.** Share the identical Zone XP calculation and tier/progress resolver while retaining room-specific condition shapes, weights, seed logic, lifecycle effects, Rescue copy, scenes, inventory/meal integrations, and cosmetic catalogs.

## Balance decisions retained

- Player, skill, Home, Kitchen, and Bathroom XP curves provide fast early movement without making major levels routine.
- Normal coin income and current cosmetic prices support occasional purchases; the Daily Chest is a bounded once-daily accelerator.
- Automatic reward bounds, minimum quest duration, distinct-template Daily Chest qualification, and completion idempotence already discourage trivial farming without restricting legitimate small chores.
- Kitchen and Bathroom Harmony weights are legible, and normal quest effects do not create wild one-action swings.
- The three-missed-cycle Rescue threshold and current targeted recovery are notable without being punitive.

## Architecture classification

- **Extract now:** Zone XP reward formula, Zone level/tier progress selection, and shared reward-summary presentation.
- **Wait for a third Zone:** configurable condition panels, lifecycle decay schemas, Rescue generation configuration, full Zone view shells, and renderer contracts.
- **Keep room-specific:** condition semantics/weights, state seeding, visuals, resource integrations, quest impact copy, and room cosmetic art.
