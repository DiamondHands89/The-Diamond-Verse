# Diamondverse

A mobile RPG. You are the Facetborn: reborn into the Diamondverse and chosen by the goddess Lumeria to heal a Lattice of 50 realms
whose gods are falling to the Umbral Rot, one realm at a time.

## Play
No build step. Open `index.html` in a browser, deploy the folder to Netlify Drop, or enable GitHub Pages.
Progress saves in the browser (localStorage).

To play with accounts and cloud saves, run the server (Node 22.5 or newer, no npm packages needed):
```
node server/server.js          # http://localhost:8787
PORT=9000 DB=/data/diamondverse.sqlite node server/server.js
```
It serves the game and the account API from one origin. Put it behind HTTPS (a reverse proxy such as Caddy or nginx) before
real players sign in.

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
- **Open world (World tab)**: third-person 3D realm per world, built from 23 biomes. Each realm is about 580 m across (10× the
  original area) with rolling hills, lakes, ~2,000 trees, rocks and crystals, a winding road of 5 battle shrines, 4 modeled landmarks,
  12 chests, lore stones, ~50 roaming foes in four tiers, two hidden Dread lairs, a local minimap and a full map.
- **World screen**: the scene fills the screen and the HUD sits on top: character (HP, MP, XP, party), realm and region,
  Menu / Bag / Map / Realms buttons, minimap, a collapsible action log (last 100 entries), a joystick, and Attack, Interact,
  Tonic and Mana buttons. Bag shows Strength, Agility, Intelligence, XP, level, inventory and the side quest. On a phone held
  upright the view turns sideways so it is always wide (switch off in Menu → Display); a phone held sideways, a tablet or a
  computer shows it as is. Computers: WASD/arrows move, drag or Q/R turn, mouse wheel or +/− zoom, Space attack, E interact,
  M map, B bag, L log, Esc menu. Menu also offers full screen (and landscape lock where the browser allows it).
- **Foe tiers**: roaming foes have fixed levels set by their realm and tier, never by the hero's level.

  | Tier | Where | Level | HP / ATK | XP | Escorts | Respawn |
  |---|---|---|---|---|---|---|
  | Rotspawn | along the roads | nearest shrine | ×1 | ×1 | 0–1 | 1 min |
  | ★ Veteran | landmarks, open country | realm boss +2 | ×1.4 / ×1.12 | ×2.5 | 0–1 | 3 min |
  | ★★ Champion | deep wilds | realm boss +5 | ×2 / ×1.25 | ×5 | 2 | 6 min |
  | ★★★ Dread | hidden lairs near the edge | realm boss +9 | ×3 / ×1.4, every arc trait | ×12 | none | 15 min |

  Higher tiers also drop gear more often and at better rarity, and the first defeat of each Champion or Dread pays Diamonds.
  Each tier looks different: Veterans wear bronze plate and horns, Champions grow crystal armour with orbiting shards, and
  Dread foes are twice the size with a gold crown, halo and aura (a Dread serpent becomes a three-headed hydra).
- **Regions and fast travel**: 11 waystones per realm (town, waystation, each shrine, each landmark, the gate). Walk near one to
  attune it; attuned waystones are listed under Map · Fast travel. The HUD shows the region you are in.
- **Characters**: anime-style heroes with sex, 5 races (Human, Elf, Beastkin, Dragonkin, Dwarf; cosmetic), 11 skin tones,
  12 hair styles, 12 hair colours, 4 physiques and 3 heights. Townsfolk, companions and foes are modeled in 3D with ink outlines;
  foes take one of 10 body types (crawler, knight, elemental, serpent, flyer, wraith, beast, brute, horror, golem) from their names.
- **Towns**: every realm has a walled town (named after its first landmark) and a waystation halfway along the shrine road.
  Standing inside a town barrier heals the party 1% of max HP per second, and foes cannot cross it. Townsfolk include the realm's
  quest-giver, a Town Warden (bounty request), an Elder (errand request), a merchant, an innkeeper (full rest for gold) and locals to talk to.
- **Carried HP and MP**: HP and MP carry over after every battle. MP does not recharge outside battle: Mana Shards, a night at
  an inn and level-ups restore it. Town barriers heal HP only. Facet Tonics and Mana Shards can be used outside battle,
  fallen companions get up at 10%, and a defeat wakes you in the town at 25% HP.
- **Accounts and cloud saves**: sign in from the ☁ button. Progress saves on the device first and uploads a few seconds later.
  Cloud saves are versioned; if two devices both changed the save, you choose which one to keep.
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
| `art.js`, `gfx.js` | Helpers, and the dependency-free WebGL renderer (toon shading, ink outlines, terrain, baked scenery) |
| `chars.js`, `foes.js` | Anime character portraits and 3D models; enemy body types and portraits |
| `account.js` | Sign-in UI and cloud-save sync |
| `server/server.js` | Account server: scrypt-hashed passwords, bearer sessions, versioned cloud saves (SQLite), rate-limited sign-in |
| `views.js`, `screens.js`, `battle.js`, `realm.js` | Screens: story, dialogue, party, hero, class, skills, gear, bazaar, battle, open world |
| `tools/sim.js` | Balance simulator: plays all 20 class pairs through the whole story |
| `tools/export-report.js` | Turns simulator output into `docs/balance/*.json` for the balance report |

## Balance testing
```
node tools/sim.js story story.json 3
node tools/sim.js explorer explorer.json 3
node tools/export-report.js story.json explorer.json docs/balance
```
The simulator carries HP and MP between fights (no MP recharge), heals in town before a shrine fight when anyone is
under 70% HP, and pays for the inn when the hero's MP is under 35% before a shrine fight (25% before a field fight).
Tuning knobs live in `combat.js` (`makeEnemy`, party scaling in `beginBattle`) and `DV.ARCS[].bossAtk` in `data.js`.

## Payments (not yet connected)
Luxury jobs are sold through the Diamond Store in `payments.js`. Set `PAYMENTS.mode`:
- `disabled` (default): prices shown, buying turned off
- `sandbox`: free test purchases — open the game with `#sandbox` at the end of the URL
- `live`: real purchases through `PAYMENTS.provider`

Verify receipts on a server: entitlements in the browser save can be edited by players.
Web builds can use Stripe; App Store / Google Play builds must use Apple In-App Purchase / Google Play Billing for digital items.

## Cloud save API
All bodies are JSON. Signed-in requests send `Authorization: Bearer <token>`.

| Method | Path | Does |
|---|---|---|
| `GET` | `/api/health` | Server check |
| `POST` | `/api/register` | `{username, password}` → `{token, user}`. Username 3–20 letters/numbers/_, password ≥ 8 |
| `POST` | `/api/login` | `{username, password}` → `{token, user}`. 10 attempts per IP per minute |
| `POST` | `/api/logout` | Ends the session |
| `GET` | `/api/me` | Account and a summary of its cloud save |
| `GET` | `/api/save` | `{data, version, updated}` |
| `PUT` | `/api/save` | `{data, version}` → `{version}`. `409` if the cloud copy is newer than `version`; `{force:true}` overwrites |
