# Diamondverse

A mobile, turn-based RPG. You are the Facetborn: reborn into the Diamondverse and chosen by the goddess Lumeria to purify the corrupted gods, world by world.

## Play
No build step. Open `index.html` in a browser, or drag the folder into Netlify Drop / enable GitHub Pages.
Progress saves in the browser (localStorage).

## Systems
- **Hero design**: name, skin, hair, eyes, outfit, past-life origin (starting attributes)
- **Leveling**: 3 attribute points, 1 skill point, 5 Diamonds per level
- **Combat classes**: Assassin, Guardian, Warrior, Mage, Priest; secondary class unlocks at Lv 10 after purifying Prismara (10 dual-class titles)
- **Job classes**: 4 free jobs + 4 hidden luxury jobs bought with Diamonds
- **Skills**: 4 per class, ranks 1–5, 5-slot loadout
- **Equipment**: 4 slots, 5 rarities, upgrades to +15, salvage into shards
- **Story**: 6 worlds, 6 corrupted gods, blessings on purification, Season One ending

## Files
| File | Purpose |
|---|---|
| `index.html` | Layout and styles |
| `data.js` | All content and balance numbers (classes, skills, jobs, gear, worlds, dialogue) |
| `engine.js` | Rules: stats, leveling, upgrades, combat, rewards |
| `art.js` | Procedural portraits/enemies, shared UI helpers |
| `views.js` | Story map, dialogue, hero creation |
| `screens.js` | Hero, Class, Skills, Gear, Bazaar tabs |
| `battle.js` | Battle screen and boot |

To add a world, append an entry to `DV.WORLDS` in `data.js`.
