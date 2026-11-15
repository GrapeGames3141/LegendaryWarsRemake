# Legendary Wars – Development Plan for a Modern Remake

**Original game:** Legendary Wars (Liv Games, 2011 iOS / 2014 Android, later GameClub re-release)  
**Document purpose:** Comprehensive plan to research, design, and recreate the game as a fully free experience with **zero paywalls and no in-app purchases**.

---

## Monetization Philosophy (Critical Requirement)

**The remake will have:**
- No in-app purchases of any kind
- No energy systems, lives, or timers that gate progress
- No premium currency that can be bought with real money
- No ads (rewarded or otherwise)
- No paywalls of any form

**All content is unlocked through gameplay.**  
Gems and Moonstones are earned only by playing levels, completing challenges, and progressing through difficulties. Every unit, tier, upgrade, spell, and mode is obtainable by any player without spending money.

The goal is a complete, fair experience that respects the player’s time and money.

---

## 1. Research & Reference Gathering Phase (2–6 weeks)

Pull everything possible from public sources. The Fandom wiki (legendarywars.fandom.com) is the richest single resource.

### Core Sources
- Fandom wiki: Main article, Category:Units, individual unit pages, Campaign levels, Difficulty, Strategy, Achievements
- Wikipedia: Development history, Cocos2d engine notes, Version 2.0 changes, reception
- Reviews & databases: MobyGames, Metacritic, AppSpy, TouchArcade, GameFAQs, Hardcore Droid, NamuWiki
- Videos: Official trailers, 2.0 trailer, longplays (TouchGameplay and others), GameClub early-access footage
- Images: Unit portraits, tier evolutions, UI screens, environment art, parallax backgrounds

### Data to Capture
- Complete unit matrix (costs, cooldowns, stats per tier, specials, unlock conditions)
- Enemy roster and behaviors
- Full campaign level list with objectives and unique mechanics
- Difficulty modifiers per region
- Side mode rules
- Narrative structure and tone

---

## 2. Core Gameplay & Mechanics (Detailed)

### 2.1 Battlefield Structure
- Fixed 3-lane layout (top, middle, bottom)
- Player castle on the left, enemy forces (or enemy castle) on the right
- Units automatically path and fight when they meet an enemy in the same lane
- Players can freely move units between lanes at any time
- Global or type-specific commands: Advance, Hold Position, Retreat, Formations
- Lane selector arrow determines spawn lane for new units

### 2.2 Resource Loop
1. Summon **Miners** (free or very low cost)
2. Miners travel to the mine, collect Gems, and return
3. Player can tap floating Gems for instant collection or let Miners deposit automatically
4. Spend Gems to summon combat units
5. Each unit type has its own cooldown after summoning
6. Killing enemies generates **Essence**
7. Spend Essence to activate a unit’s special ability (specials grant temporary invincibility during animation)

### 2.3 Unit System
Player units (heroes) include:
- **Passive**: Miner (and later Catapult in some versions)
- **Melee**: Knight, Dwarf, Golem, Tree Sprite, Centaur, early Phoenix
- **Mid / Long Range**: Elf, Unicorn, Wizard, Healer, Faun, Rogue, later Phoenix

Each unit has up to **5 Tiers**. Higher tiers change:
- Visual appearance and armor
- Base stats (HP, Attack, Speed, Range, Critical, Defense)
- Attack behavior and effects
- Special ability (stronger or completely different)

Units are unlocked by progressing through the campaign. Tiers are unlocked and upgraded using Gems and Moonstones earned in gameplay.

### 2.4 Special Abilities
- Every unit has a unique special that evolves with tier
- Specials cost Essence
- Examples of effects: powerful charges, area damage, burns, freezes, heals, summons, temporary buffs, resurrection-style effects (Phoenix)
- Specials are a major source of skill expression and power spikes

### 2.5 Progression & Meta
- **Gems**: Primary currency – earned from miners and level completion. Used for stat upgrades and most purchases.
- **Moonstones**: Rare currency – earned from first-time level clears, milestones, and higher difficulties. Used for tier unlocks, key permanent upgrades (extra miners, tower elves, spell improvements, etc.).
- Armory / Upgrade screen between levels
- Castle health and defensive upgrades
- Optional spellbook (Arrow Rain, Firestorm, Ice Storm, etc.) with cooldowns
- Hero selection screen before each level (choose which unlocked units to bring)

### 2.6 Campaign Structure
- 5–6 major regions: Sun Kingdom → Frostburn → Desert Oasis → Mystic Swamp → Magma Mountain → Netherworld
- 50–70+ levels with significant variety:
  - Classic castle defense
  - Castle siege (destroy the enemy castle)
  - Ambush / free-build scenarios
  - Side-scrolling hero runs (single character with unique controls)
  - Boss fights
  - Unique objective levels
- Higher difficulties (Hard → Legendary → Monster) act as New Game+ with heavy enemy stat multipliers and additional rewards (more Moonstones)

### 2.7 Side Modes
- Endless / Survival waves
- Arena-style modes (limited summons)
- Legendary Challenges
- Other unlockable modes that provide extra Moonstones and long-term goals

### 2.8 Controls & Feel Goals
- Clear unit selection
- Reliable lane switching
- Formation tools that feel good
- Optional 2x speed
- Pause-friendly design
- Modern touch targets and optional controller support
- Smooth, responsive controls that reduce the micro-management friction of the original

---

## 3. High-Level Scope & Design Goals

**Target experience**: The hybrid “command a real army across three lanes” feeling that made the original special, delivered with modern usability and zero monetization friction.

### Must-Have Pillars
- Deep, skillful 3-lane real-time combat with meaningful unit control
- Satisfying resource and upgrade loop that is entirely free
- Full unit roster with meaningful tier progression
- Large, varied campaign + higher difficulties
- Side content that extends playtime without gating

### Explicit Non-Goals
- Any form of real-money transaction inside the game
- Energy / stamina systems
- Timed waits for resources or units
- Advertisements

---

## 4. Recommended Tech Stack

- **Engine**: Unity (C#) or Godot 4
- **Art**: Aseprite / Photoshop + Spine or engine 2D animation tools
- **Audio**: Engine native or FMOD
- **Save system**: Local + optional cloud (PlayFab / Firebase / Unity Services)
- **Platforms**: iOS, Android, and ideally PC/Steam

Prototype the core loop (lanes + miners + 2–3 units + basic waves + commands) before expanding content.

---

## 5. Implementation Roadmap

### Phase A – Foundation (4–8 weeks)
- Project setup, input, camera, parallax
- 3-lane battlefield, unit pathing, basic combat
- Miner + Gem system
- Core UI (unit bar, lane selector, commands, essence, castle HP)

### Phase B – Combat & Units (6–12 weeks)
- Full unit data framework and tier system
- Special ability system
- Enemy AI and wave director
- All major player units and key enemies
- Formation and command polish

### Phase C – Progression & Meta (4–8 weeks)
- Armory / upgrade screen
- Save system
- Hero selection
- Difficulty system
- Side mode frameworks
- All progression is free – no real-money shops

### Phase D – Content
- Campaign levels region by region
- Narrative and dialogue
- Achievements / challenges
- Full art and audio pass

### Phase E – Polish & Platforms
- Balance pass (using original stats as baseline)
- Accessibility features
- Performance optimization
- Store presence (listed as free or one-time premium with zero additional purchases)

---

## 6. Art, Audio & Content

- Recreate the colorful, charming cartoon aesthetic
- Strong parallax environments per region
- Clear tier visual progression for every unit
- Satisfying special-effect VFX
- Orchestral-inspired soundtrack and responsive SFX
- Data-driven level and wave design for easy iteration

---

## 7. Team, Timeline & Risks

**Suggested team**: 1–2 programmers, 1–2 artists, 1 designer, part-time audio, producer.

**Rough timeline** (small full-time team):
- Playable core loop: 2–3 months
- Vertical slice (one full region + meta): 6–9 months
- Feature-complete + polish: 12–24 months

**Key Risks**
- Scope of the original campaign → Prioritize core combat + early regions first
- Balance complexity → Spreadsheet-driven tuning + regular playtests
- Control feel → Heavy iteration on selection and commands

---

## 8. Immediate Next Steps

1. Organize Fandom wiki data into a master unit & level spreadsheet
2. Collect and catalog key gameplay videos for reference
3. Build a minimal prototype of the 3-lane combat + miner loop
4. Finalize engine choice
5. Write a living Game Design Document that expands this plan

---

## Quick Reference – Original Game Summary

| Aspect              | Details                                                                 |
|---------------------|-------------------------------------------------------------------------|
| Genre               | Hybrid RTS + Lane Defense + RPG                                         |
| Core Loop           | Miners → Gems → Summon & command units → Specials (Essence) → Upgrades |
| Key Units           | Miner, Knight, Elf, Dwarf, Unicorn, Golem, Wizard, Phoenix + others    |
| Tiers               | Up to 5 per unit                                                        |
| Campaign            | 50–70+ levels across 5–6 regions                                        |
| Difficulties        | Normal → Hard → Legendary → Monster (New Game+)                         |
| Original Engine     | Cocos2d                                                                 |
| **Remake Goal**     | Fully free, no IAPs, no ads, no paywalls                                |

---

*This document prioritizes a complete, fair, and faithful recreation of Legendary Wars’ excellent gameplay systems while permanently removing every form of paywall and in-app purchase.*

**Last updated**: November 2026  
