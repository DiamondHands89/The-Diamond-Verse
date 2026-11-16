# Diamondverse

A mobile, turn-based RPG. You are the Facetborn: reborn into the Diamondverse and chosen by the goddess Lumeria to purify the corrupted gods, world by world.

## Play
No build step. Open `index.html` in a browser, or drag the folder into Netlify Drop / enable GitHub Pages.
Progress saves in the browser (localStorage).

## Systems
- **Open world (World tab)**: third-person 3D realm for each world. Walk the path to stage shrines, fight roaming foes,
  open chests, talk to NPCs, and take portals between purified worlds. Controls: on-screen joystick, Attack, Interact;
  drag the scene to turn the camera; keyboard WASD/arrows, Space, E.
- **Hero design**: name, skin, hair, eyes, outfit, past-life origin (starting attributes)
- **Leveling**: 3 attribute points, 1 skill point, 5 Diamonds per level
- **Combat classes**: Assassin, Guardian, Warrior, Mage, Priest; secondary class unlocks at Lv 10 after purifying Prismara (10 dual-class titles)
- **Job classes**: one active job, job levels 1–5, permanent mastery bonuses at Lv 5
  - Tier 1 (always open): Blacksmith, Tailor, Hunter, Fisher, Farmer, Chef
  - Tier 2 (unlock via requirements + Diamonds): Doctor, Botanist, Merchant
  - Luxury (real-money, Diamond Store): Royal Gemcutter, Celestial Gourmand, Starforger, Diamond Baron
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
| `gfx.js` | Tiny dependency-free WebGL renderer (low-poly meshes, light, fog) |
| `realm.js` | Open world: layout per world, hero/foe movement, interactions, World tab UI |
| `payments.js` | Diamond Store: product catalog, entitlements, payment-provider adapter hook |

To add a world, append an entry to `DV.WORLDS` in `data.js`.

## Payments (not yet connected)
Luxury jobs are sold through the Diamond Store in `payments.js`. Set `PAYMENTS.mode`:
- `disabled` (default): prices shown, buying turned off
- `sandbox`: free test purchases — open the game with `#sandbox` at the end of the URL
- `live`: real purchases through `PAYMENTS.provider`

To connect a processor, write an adapter with `purchase`, `verify` and `restore` (interface documented at the top of `payments.js`).
Verify receipts on a server: entitlements in the browser save can be edited by players.
Web builds can use Stripe; App Store / Google Play builds must use Apple In-App Purchase / Google Play Billing for digital items.
