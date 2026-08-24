# Milestone 0.11 — Character System 2.0

## Art direction

HomeQuest characters use a cozy storybook RPG language: warm two-tone color, dark hand-drawn-style outlines, modestly oversized heads, readable shoulders and clothing volume, short limbs, articulated hands, and chunky shoes. Faces stay expressive without anime-scale eyes. Small asymmetries, messy hair edges, layered collars, pockets, straps, fabric seams, cheek shading, and headwear integration keep the result personal rather than corporate or doll-like.

Variety comes from neutral visual primitives rather than a gender switch. Four face silhouettes, ten hair silhouettes, ten structurally distinct outfits, nine accessories, six skin tones, and multiple eyes, freckles, expressions, and colors naturally support masc-leaning, neutral, femme-leaning, and mixed outcomes.

## Renderer boundary

`AvatarConfig` remains persisted identity. `StudioAvatar` interprets it as a detailed full-body portrait for Studio/Profile. `SceneAvatar` separately interprets it as a chunky, low-detail room inhabitant. A future Pixel renderer can consume the same stable semantic IDs without changing saves.

The two SVGs intentionally do not share anatomy paths. Studio artwork retains facial highlights, garment construction, hair texture, hands, and secondary shading. Scene artwork redraws the same semantic choices with larger color blocks, fewer interior marks, heavier outlines, and an authored room scale. This keeps the mini character readable without shrinking the portrait renderer.

## Compatibility

The persisted schema remains v7. Normalization fills new face fields and maps old IDs deterministically:

- `short` → `side-part`
- `waves` → `medium-waves`
- `mohawk` → `undercut`
- `sweater` → `crewneck`
- `glasses` → `round-glasses`

Existing colors, skin tones, hoodie, tee, overalls, apron, earrings, headband, cap, and base expressions retain their semantic identity. Unknown values fall back independently to the closest player default.

## Ownership and runtime state

Tyler and Rachel keep separate saved character configurations. Temporary states—focused, working, celebrate, level-up, sleepy, and welcome—are ephemeral UI moments and never overwrite the selected base expression. Shared level-ups and Rescue milestones can involve both household characters; ordinary work emphasizes only the acting player.
