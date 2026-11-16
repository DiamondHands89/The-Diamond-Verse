# Diamondverse

A mobile RPG. You are the Facetborn: reborn into the Diamondverse and chosen by the goddess Lumeria to heal a Lattice of 50 realms
whose gods are falling to the Umbral Rot, one realm at a time.

## Play
No build step. Open `index.html` in a browser, deploy the folder to Netlify Drop, or enable GitHub Pages.
Progress saves in the browser (localStorage).

## The story
- **50 realms in 5 arcs**: The Shattered Heart (1–10), The Lattice Wars (11–20), The Hungry Dark (21–30), Realms Unbound (31–40), The Hollow Heart (41–50).
- Every realm has its own people and customs, god, foes, four landmarks, a quest-giver with a side quest, and dialogue.
- 33 gods are corrupted and must be purified; 17 are still free and besieged by Heralds of the Rot.
- **Realm travel**: Rift Gates are both science and faith. Quorin engineers tune gates to a god's resonance; the god's light is the bridge.
  A corrupted god rings out of tune, so the gate beyond it stays closed until the realm is saved (explained in realm 7, Meridian Observatory).
- **Companions**: 16 recruitable party members. 9 join through the story; 7 are hidden and must be found in the open world. Each has a
  signature skill and a 3-chapter bond storyline. The story can be finished without finding the hidden ones.
- **Hidden stories**: 18 lore stones near landmarks each teach a hidden skill any class can use.

## Systems
- **Open world (World tab)**: third-person 3D realm per world, built from 23 biomes, with a winding path of 5 battle shrines, 4 modeled
  landmarks, hazard pools, chests, lore stones, roaming foes, a minimap and full map, and a scrollable action log (last 100 entries).
- **Party**: hero + up to 2 companions in battle. Companions act on their own; an Auto button plays the hero too.
- **Combat**: level-relative damage, enemy traits by arc (Armored, Venomous, Swift, Regenerating), escalating boss mechanics.
- **Classes**: Assassin, Guardian, Warrior, Mage, Priest; secondary class at Lv 10; 8 skills per class plus 18 hidden skills.
- **Jobs**: Tier 1 (Blacksmith, Tailor, Hunter, Fisher, Farmer, Chef), Tier 2 (Doctor, Botanist, Merchant), Luxury (real-money store).
- **Gear**: 4 slots, 5 rarities, 50 tiers, upgrades to +15.
- **Daily**: 7-day login ladder and 3 daily challenges.
- **Online-ready**: `online.js` defines the adapter for shared realms, PvP arena and raid team-ups (offline until a server is connected).

## Files
| File | Purpose |
|---|---|
| `index.html` | Layout and styles |
| `data.js` | Classes, skills, companions, jobs, gear, arcs, prologue |
| `realms/arc1.js` … `arc5.js` | The 50 realms: people, gods, foes, landmarks, dialogue, side quests, hidden stories |
| `engine.js` | State, stats, leveling, skills, jobs, gear, Bazaar |
| `party.js` | Companions, bonds, side quests, landmarks, hidden stories, daily challenges, login rewards |
| `combat.js` | Party battles, enemy scaling and traits, boss mechanics, battle AI, rewards |
| `payments.js` | Diamond Store: product catalog, entitlements, payment-provider adapter |
| `online.js` | Online adapter hooks: presence, PvP, raids |
| `art.js`, `gfx.js` | Portraits, helpers, and the dependency-free WebGL renderer |
| `views.js`, `screens.js`, `battle.js`, `realm.js` | Screens: story, dialogue, party, hero, class, skills, gear, bazaar, battle, open world |
| `tools/sim.js` | Balance simulator: plays all 20 class pairs through the whole story |
| `tools/export-report.js` | Turns simulator output into `docs/balance/*.json` for the balance report |

## Balance testing
```
node tools/sim.js story story.json 3
node tools/sim.js explorer explorer.json 3
node tools/export-report.js story.json explorer.json docs/balance
```
Tuning knobs live in `combat.js` (`makeEnemy`, party scaling in `beginBattle`) and `DV.ARCS[].bossAtk` in `data.js`.

## Payments (not yet connected)
Luxury jobs are sold through the Diamond Store in `payments.js`. Set `PAYMENTS.mode`:
- `disabled` (default): prices shown, buying turned off
- `sandbox`: free test purchases — open the game with `#sandbox` at the end of the URL
- `live`: real purchases through `PAYMENTS.provider`

Verify receipts on a server: entitlements in the browser save can be edited by players.
Web builds can use Stripe; App Store / Google Play builds must use Apple In-App Purchase / Google Play Billing for digital items.
