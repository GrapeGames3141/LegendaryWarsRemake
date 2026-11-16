# Ridiculous Wars
### *Totally Serious Business*

A free 3-lane real-time strategy / castle-defense comedy game for Android.

The once-glorious kingdom of **Glorpia** has grown soft from centuries of peace, tax exemptions and competitive baking contests. When the **Nether-Bureaucracy** declares war over a disputed parking ticket and one (1) stolen royal sandwich, the kingdom's last hope is a ragtag crew of misfit heroes who mostly signed up for the free dental plan. You are the newly appointed **Supreme Lane Commander**. Nobody else applied.

**Free forever: no ads, no in-app purchases, no energy, no timers, no premium currency.** Everything is earned by playing.

## 📲 Download & install on Android

1. Open the **[latest release](../../releases/latest)** on your phone and tap the `RidiculousWars-v1.0.N.apk` file.
   (Every build is also attached as an artifact on the **[Actions](../../actions/workflows/build-apk.yml)** tab.)
2. If Android asks, allow your browser or file manager to **install unknown apps**.
3. Tap **Install** and open **Ridiculous Wars**.

Requires Android 8.0+. Every build is signed with the same key, so a newer APK installs over an older one and keeps your save.

## 🎮 How to play

| Action | How |
| --- | --- |
| Earn gems 💎 | Hire **Interns** (first card). They dig gems at the mine and haul them back. You also get a trickle of gems over time and from defeated enemies. |
| Bonus gems | Tap the floating gems that pop up on the battlefield. |
| Spawn lane | Tap a lane (or the castle gate). The glowing arrow shows where new hires appear. |
| Summon | Tap a unit card. Each card has its own cooldown. |
| Move troops | Tap one of your units to select **every unit of that type**, then tap another lane. |
| Commands | **Advance / Hold / Retreat** apply to the selected type, or to everyone if nothing is selected. Retreated units heal at the castle. Sometimes your troops refuse orders. Then they do it anyway. |
| Formation | When on, ranged units and medics stay behind the front line. |
| Specials | Defeating enemies builds **Synergy ✨**. Tap the purple button above a card to trigger that unit type's special. Units can't be hurt while it plays. |
| Office magic | Unlock in Procurement. *Reply-All Arrow Storm* asks you to tap a lane; *Thermostat War* and *Lightning Round* fire instantly. |
| Boss meetings | Bosses run PowerPoint presentations (everyone falls asleep) and hand you **forms**. Tick every box before the timer runs out, or the castle pays for it. |

### The team
| Role | Unit | Special |
| --- | --- | --- |
| Gatherer | **Intern** | Digs gems. Puts it on the company card. |
| Melee | **Sir Reginald the Overconfident** | *Full-Title Charge*: yells his whole title while trampling the lane |
| Ranged | **Todd the Reluctant Ranger** | *Apology Volley*: five arrows, five apologies |
| Heavy | **Brenda the Boulder** (barista) | *Tip Jar Slam*: launches everything nearby |
| Support | **Nurse Stabby** | *Aggressive Encouragement*: big heal plus a frenzy |
| Tank | **The Golem of HR** (a binder) | *Passive-Aggressive Memo*: stuns the whole lane; normal hits can stun too |
| Mage | **Professor Wizzle** | *Wait, Which Spell Was It?*: meteor, freeze, heal, lightning, free gems, or turns enemies into chickens |
| Fast | **Kevin the Unicorn** | *Let's Circle Back*: tramples forward, then gallops back |
| Flying | **Phoenix of Questionable Origin** (a chicken) | *Dramatic Rebirth*; also comes back to life once per battle |
| Swarm | **The Intern Swarm** | Each summon brings 3–7 tiny interns. *Mass Grievance*: everyone files a complaint |

Every unit has **5 costume tiers**. For example, Reginald goes from a dented bucket helmet to polished armor, parade plumes, gilded plate and finally full **disco-ball** armor.

### The world
- **6 regions, 36 levels**: The Gilded Suburbs, Frostburn Corporate Retreat, Desert Oasis All-Hands, Mystic Swamp of Unresolved Issues, Magma Mountain Headquarters and The Nether-Cubicle. Each has defend, siege (demolish the branch office) and boss levels, plus a mission briefing.
- **6 bosses**: Karenthia, Queen of the HOA · Chilldred, Chief Morale Officer · the Wyrm of Endless Meetings · the Bog Witch of Backlogs · the Dragon of Excessive Paperwork · **Lord Magma, Director of Infernal Operations** (tiny tie, flaming briefcase).
- **Difficulties**: Regular Shift → Performance Improvement Plan → Mandatory Overtime (New Game+).
- **Endless Overtime** mode, **16 achievements**, sarcastic victory and defeat screens, and background gags (a snack vendor, a coward hiding in a bush, a sleeping guard, fans and a goose).
- **Serious Mode** in Settings turns off the jokes, then mocks you for it.
- All art is drawn in code and all audio is synthesized, so the APK is under 100 KB.

## 🛠️ Project layout

```
app/src/main/assets/www/   The game (HTML5 canvas + vanilla JS, works offline)
  js/data.js               Units, enemies, bosses, regions, writing, achievements
  js/art.js                Procedural art: characters, costumes, monsters, castles, gags
  js/battle.js             Battle simulation, AI, waves, boss events, rendering
  js/ui.js                 Menus, Personnel, Procurement, HUD, forms, results
  js/audio.js              Synthesized sound effects and music
app/src/main/java/...      Small Android WebView wrapper (fullscreen, back button, pause)
.github/workflows/         CI: builds the APK and publishes a release on every push to main
docs/Development_Plan.md   The original planning document
```

To play in a desktop browser, open `app/src/main/assets/www/index.html`. Keys: 1–9 summon, ↑/↓ lane, A/H/R commands, Esc pause.

To build locally: `./gradlew assembleRelease` (needs JDK 17 and the Android SDK). The APK ends up in `app/build/outputs/apk/release/`.

> The signing keystore in `keystore/` is intentionally public. It only exists so every CI build can update the previous install; it protects nothing secret.
