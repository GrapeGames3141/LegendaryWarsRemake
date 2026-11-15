# Gemfall Legions

An original, free 3-lane fantasy battle strategy game for Android. Dig gold, raise an army, and command it across three lanes against goblins, skeletons, wyrms, drakes and the Hollow King.

**Free forever: no ads, no in-app purchases, no energy, no timers, no premium currency.** Everything is earned by playing.

## 📲 Download & install on Android

1. Open the **[latest release](../../releases/latest)** on your phone and tap the `GemfallLegions-v1.0.N.apk` file.
   (Every build is also attached as an artifact on the **[Actions](../../actions/workflows/build-apk.yml)** tab.)
2. When Android asks, allow your browser / file manager to **install unknown apps**.
3. Tap **Install**, then open **Gemfall Legions**.

Requires Android 8.0+. All builds share one signing key, so a newer APK installs over an older one and keeps your save.

## 🎮 How to play

| Action | How |
| --- | --- |
| Earn gold | Summon **Diggers** (first card). They walk to the crystal mine and haul gold home. You also get a trickle of gold over time and from kills. |
| Collect gems | Tap the glowing gems that pop up on the field for bonus gold and valor. |
| Choose spawn lane | Tap a lane (or the castle gate) — the glowing arrow shows where new troops appear. |
| Summon troops | Tap a unit card. Each card has its own cooldown. |
| Move troops | Tap one of your soldiers to select **all units of that type**, then tap another lane. |
| Commands | **Advance / Hold / Retreat** apply to the selected type, or to everyone if nothing is selected. Retreated units heal at the castle. |
| Formation | When on, ranged units and healers stay behind your front-line melee. |
| Specials | Killing enemies fills **Valor ✨**. Tap the purple button above a card to unleash that unit type's special. Units are invulnerable during it. |
| Spells | Unlock in the Armory. Arrow Storm asks you to tap a lane; Frost Nova and Thunder Wrath fire instantly. |
| Speed / pause | Top-right buttons. The Android back button pauses. |

### Content
- **9 units**, each with **5 tiers** (new look, stats and stronger special) and up to 20 levels: Digger, Squire, Ranger, Bulwark, Mender, Pyromancer, Boar Rider, Frost Witch and the Clockwork Titan.
- **6 regions, 36 levels**: Meadowmarch, Frostveil, Ember Dunes, Gloomfen, Cinderpeak and the Hollow Throne. Mix of defend, siege (destroy the fortress) and boss battles.
- **6 bosses** with unique abilities (summons, ground stomps, burrowing, fire breath).
- **3 difficulties**: Normal → Heroic → Mythic (New Game+ with tougher foes and bigger rewards).
- **Endless Siege** mode with escalating waves that march through every region.
- **Armory**: castle walls, mine shafts, rich veins, war chest, drill sergeant, battle hymns, archer tower and a 3-spell spellbook.
- All art is drawn procedurally in code, and all sound/music is synthesized, so the APK is tiny (~70 KB).

## 🛠️ Project layout

```
app/src/main/assets/www/   The game (HTML5 canvas + vanilla JS, works offline)
  js/data.js               Units, enemies, regions, levels, upgrades
  js/art.js                Procedural art: characters, monsters, castles, backgrounds
  js/battle.js             Battle simulation, AI, waves, rendering
  js/ui.js                 Menus, barracks, armory, HUD
  js/audio.js              Synthesized SFX and music
app/src/main/java/...      Tiny Android WebView wrapper (fullscreen, back button, pause)
.github/workflows/          CI that builds the APK and publishes a release on every push to main
docs/Development_Plan.md   The original planning document
```

Play in a desktop browser by opening `app/src/main/assets/www/index.html` (keys: 1–9 summon, ↑/↓ lane, A/H/R commands, Esc pause).

Build locally: `./gradlew assembleRelease` (JDK 17 + Android SDK). The APK lands in `app/build/outputs/apk/release/`.

> The signing keystore in `keystore/` is intentionally public. It exists only so every CI build can update the previous install; it protects nothing secret.
