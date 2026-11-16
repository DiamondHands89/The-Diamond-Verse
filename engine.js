// Diamondverse — rules engine: state, stats, progression, gear, jobs. Combat lives in combat.js; party/quests/dailies in party.js.
const SAVE_KEY = 'diamondverse.save.v1';
let S = null;   // persistent game state
let B = null;   // active battle

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function newState() {
  return {
    v:4, created:false, name:'', look:{skin:1,hair:0,eyes:0,outfit:0,hairStyle:0}, origin:'student',
    level:1, xp:0, attrPts:0, attrs:{str:0,int:0,vit:0,agi:0,spi:0},
    cls:null, cls2:null, job:null, jobsOwned:[], jobXp:{}, entitlements:{}, playerId:newPlayerId(),
    skillPts:0, skills:{}, loadout:[],
    gold:200, dia:30, lifetimeGold:0, shards:10, potions:{hp:3, mp:2},
    equip:{weapon:null,helm:null,armor:null,charm:null}, inv:[], nextId:1,
    cleared:{}, worldsCleared:0, seen:{}, chests:{}, realm:null,
    comps:{}, party:[], marks:{}, lore:{}, qprog:{}, qdone:{}, daily:null, login:{ last:null, streak:0 }, settings:{ auto:false }, vit:{ hero:1 }, tq:{}
  };
}
function newPlayerId() {
  try { return crypto.randomUUID(); } catch (e) { return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
}
// Old saves (v1) had Alchemist/Scholar and luxury jobs bought with Diamonds. Luxury jobs are now real-money only,
// so v1 luxury purchases are refunded in Diamonds and the job list is reset to the new tiers.
function migrate(st) {
  if ((st.v || 1) < 2) {
    const refund = { gemcutter:300, chef:450, starforger:550, baron:750 };
    (st.jobsOwned || []).forEach(j => { if (refund[j]) st.dia += refund[j]; });
    st.jobsOwned = []; st.jobXp = st.jobXp || {}; st.entitlements = st.entitlements || {};
    if (!['blacksmith','hunter'].includes(st.job)) st.job = null;
    st.playerId = st.playerId || newPlayerId();
    st.v = 2;
  }
  if (st.v < 3) {
    // v3: 50 realms with new layouts. Keep progress; respawn at the realm entrance; add story companions already earned.
    st.realm = null; st.comps = st.comps || {}; st.party = st.party || [];
    st.v = 3;
  }
  if (st.v < 4) { st.vit = st.vit || { hero:1 }; st.tq = st.tq || {}; st.realm = null; st.v = 4; }   // v4: carried HP, towns
  return st;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(Object.assign(newState(), JSON.parse(raw))); } catch (e) {}
  return null;
}

// ---------- Modifiers: blessings + active job + mastered jobs ----------
// Every key is additive (see the key list in data.js); safeTo takes the highest value.
function addMods(m, src) {
  for (const k in src) m[k] = k === 'safeTo' ? Math.max(m[k] || 0, src[k]) : (m[k] || 0) + src[k];
}
function mods() {
  const m = {};
  DV.WORLDS.slice(0, S.worldsCleared).forEach(w => addMods(m, { [w.bless[0]]: w.bless[1] }));
  if (S.job) addMods(m, DV.JOBS[S.job].mods);
  for (const id in DV.JOBS) if (jobMastered(id) && DV.JOBS[id].mastery) addMods(m, DV.JOBS[id].mastery.mods);
  return m;
}
const M = (m, k) => m[k] || 0;
function mainStat(cls) { return DV.CLASSES[cls || S.cls].main; }
function dualTitle() {
  if (!S.cls2) return DV.CLASSES[S.cls].name;
  return DV.DUAL_TITLES[[S.cls, S.cls2].sort().join('+')];
}
function secondaryUnlocked() { return S.level >= DV.SECONDARY.level && S.worldsCleared >= DV.SECONDARY.world; }

// ---------- Items ----------
function makeItem(slot, tier, rarity) {
  const base = DV.SLOT_BASE[slot], r = DV.RARITY[rarity], scale = (1 + (tier - 1) * 0.9) * r.mult, stats = {};
  for (const k in base) {
    const key = k === 'main' ? mainStat() : k;
    stats[key] = Math.max(1, Math.round(base[k] * scale));
  }
  const noun = slot === 'weapon' ? DV.CLASSES[S.cls].weapon : DV.SLOT_NOUN[slot];
  return { id:S.nextId++, slot, tier, rarity, plus:0, name:`${DV.materialFor(tier)} ${noun}`, stats };
}
function itemStats(it) {
  const o = {};
  for (const k in it.stats) o[k] = Math.round(it.stats[k] * (1 + it.plus * DV.UPGRADE.perLevel));
  return o;
}
function itemPower(it) { const s = itemStats(it); return Object.entries(s).reduce((t,[k,v]) => t + v * (k==='hp'||k==='mp' ? .25 : 2), 0) | 0; }
function upgradeCost(it) {
  const m = mods();
  return { gold: Math.round(30 * Math.pow(it.plus + 1, 1.5) * it.tier * Math.max(.4, 1 - M(m, 'upCostCut'))), shards: Math.ceil((it.plus + 1) * 1.6) };
}
function upgradeRate(it) {
  const m = mods();
  if (m.safeTo && it.plus < m.safeTo) return 1;
  let r = DV.UPGRADE.rate[it.plus] ?? 0;
  if (it.plus >= 5 && m.upRate) r += m.upRate;
  return clamp(r, 0, 1);
}
function tryUpgrade(it) {
  if (it.plus >= DV.UPGRADE.max) return { ok:false, msg:'Already at max +15.' };
  const c = upgradeCost(it);
  if (S.gold < c.gold || S.shards < c.shards) return { ok:false, msg:`Need ${c.gold} gold and ${c.shards} shards.` };
  S.gold -= c.gold; S.shards -= c.shards;
  const success = Math.random() < upgradeRate(it);
  if (success) it.plus++;
  track('upgrade'); save();
  return { ok:true, success, msg: success ? `${it.name} is now +${it.plus}.` : `The facet cracked. ${it.name} stays +${it.plus}. Materials were used.` };
}
function salvage(id) {
  const i = S.inv.findIndex(x => x.id === id); if (i < 0) return 0;
  const it = S.inv[i], n = Math.round((DV.RARITY[it.rarity].shards + it.plus * 2) * (1 + M(mods(), 'salvageBonus')));
  S.inv.splice(i, 1); S.shards += n; save(); return n;
}
function equipItem(id) {
  const i = S.inv.findIndex(x => x.id === id); if (i < 0) return;
  const it = S.inv[i], cur = S.equip[it.slot];
  S.inv.splice(i, 1); if (cur) S.inv.push(cur); S.equip[it.slot] = it; save();
}
function rollRarity(weights, up) {
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0), r = 0;
  for (; r < weights.length; r++) { roll -= weights[r]; if (roll <= 0) break; }
  return clamp(r + (up || 0), 0, 4);
}

// ---------- Stats ----------
function calcStats() {
  const c = DV.CLASSES[S.cls], L = S.level - 1, st = {};
  for (const k in c.base) st[k] = c.base[k] + c.grow[k] * L;
  if (S.cls2) { const c2 = DV.CLASSES[S.cls2]; for (const k in c2.grow) st[k] += c2.grow[k] * L * DV.SECONDARY.growthShare; }
  const o = DV.LOOK.origin.find(x => x.id === S.origin);
  for (const a in DV.ATTRS) {
    const pts = S.attrs[a] + ((o && o.bonus[a]) || 0);
    for (const k in DV.ATTRS[a].gives) st[k] += DV.ATTRS[a].gives[k] * pts;
  }
  const m = mods(), all = 1 + M(m, 'all');
  DV.SLOTS.forEach(s => { const it = S.equip[s]; if (it) {
    const is = itemStats(it), g = (s === 'helm' || s === 'armor') ? 1 + M(m, 'armorGear') : 1;
    for (const k in is) st[k] += is[k] * g; } });
  for (const k in st) st[k] = st[k] * (1 + M(m, k)) * all;
  st.crit = clamp(st.crit + M(m, 'critFlat'), 0, 75);
  for (const k in st) st[k] = k === 'crit' ? Math.round(st[k] * 10) / 10 : Math.round(st[k]);
  return st;
}
function heroPower() { const s = calcStats(); return Math.round(s.hp * .3 + s.mp * .15 + (s.atk + s.mag) * 2 + s.def * 2.5 + s.spd * 2 + s.crit * 3); }

// ---------- Leveling & skills ----------
const xpNeed = L => Math.round(25 + 36 * L * (1 + L / 500));
// Every skill the hero can currently slot: class skills (primary + secondary) and hidden skills already learned.
function skillPool() {
  return Object.keys(DV.SKILLS).filter(id => { const k = DV.SKILLS[id]; return k.hidden ? !!S.skills[id] : (k.cls === S.cls || k.cls === S.cls2); });
}
function unlockSkills() {
  const fresh = [];
  skillPool().forEach(id => {
    if (!S.skills[id] && !DV.SKILLS[id].hidden && DV.SKILLS[id].lvl <= S.level) {
      S.skills[id] = 1; fresh.push(id);
      if (S.loadout.length < DV.LOADOUT_MAX) S.loadout.push(id);
    }
  });
  return fresh;
}
function gainXp(n) {
  const ups = [];
  S.xp += n;
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level); S.level++;
    S.attrPts += 3; S.skillPts += 1; S.dia += 5;
    ups.push(S.level);
  }
  if (ups.length) { S.vit = { hero:1 }; Object.keys(S.comps || {}).forEach(k => S.vit[k] = 1); }   // a level-up heals everyone
  const fresh = ups.length ? unlockSkills() : [];
  return { ups, fresh };
}
function upgradeSkill(id) {
  const r = S.skills[id]; if (!r || r >= 5 || S.skillPts < r) return false;
  S.skillPts -= r; S.skills[id] = r + 1; save(); return true;
}
function toggleLoadout(id) {
  const i = S.loadout.indexOf(id);
  if (i >= 0) S.loadout.splice(i, 1);
  else if (S.loadout.length < DV.LOADOUT_MAX) S.loadout.push(id);
  else return false;
  save(); return true;
}

// ---------- Jobs ----------
function jobLevel(id) {
  let xp = S.jobXp[id] || 0, L = 1;
  while (L <= DV.JOB_XP.length && xp >= DV.JOB_XP[L - 1]) { xp -= DV.JOB_XP[L - 1]; L++; }
  return L;
}
function jobProgress(id) {   // { lv, xp, need } — xp toward the next level
  let xp = S.jobXp[id] || 0, L = 1;
  while (L <= DV.JOB_XP.length && xp >= DV.JOB_XP[L - 1]) { xp -= DV.JOB_XP[L - 1]; L++; }
  return { lv:L, xp, need: DV.JOB_XP[L - 1] || 0 };
}
const jobMastered = id => jobLevel(id) > DV.JOB_XP.length;
function reqStatus(id) {
  return (DV.JOBS[id].req || []).map(q => {
    if (q.job) return { text:`Master ${DV.JOBS[q.job].name} (job Lv ${q.lv})`, met: jobLevel(q.job) >= q.lv };
    if (q.anyJob) return { text:`Master ${q.anyJob.map(j => DV.JOBS[j].name).join(' or ')} (job Lv ${q.lv})`, met: q.anyJob.some(j => jobLevel(j) >= q.lv) };
    if (q.level) return { text:`Reach hero Lv ${q.level}`, met: S.level >= q.level };
    if (q.world) return { text:`Purify ${DV.WORLDS[q.world - 1].name}`, met: S.worldsCleared >= q.world };
    if (q.gold) return { text:`Earn ${q.gold.toLocaleString()} lifetime gold`, met: S.lifetimeGold >= q.gold };
    return { text:'?', met:false };
  });
}
// Tier 1 is always open; Tier 2 after unlockJob(); luxury after a store purchase (payments.js).
function jobAvailable(id) { return DV.JOBS[id].tier === 1 || S.jobsOwned.includes(id); }
function unlockJob(id) {
  const j = DV.JOBS[id];
  if (j.tier !== 2 || S.jobsOwned.includes(id)) return null;
  if (!reqStatus(id).every(r => r.met)) return 'Requirements not met yet.';
  if (S.dia < j.cost) return `Needs ${j.cost} Diamonds. You have ${S.dia}.`;
  S.dia -= j.cost; S.jobsOwned.push(id); save(); return null;
}
function setJob(id) {
  if (S.job === id) return null;
  if (!jobAvailable(id)) return DV.JOBS[id].tier === 3 ? 'Buy this job in the Diamond Store first.' : 'Unlock this job first.';
  if (S.job) { if (S.gold < DV.JOB_SWAP_GOLD) return `Changing jobs costs ${DV.JOB_SWAP_GOLD} gold.`; S.gold -= DV.JOB_SWAP_GOLD; }
  S.job = id; save(); return null;
}
function gainJobXp(n) {
  if (!S.job) return null;
  const before = jobLevel(S.job);
  S.jobXp[S.job] = (S.jobXp[S.job] || 0) + n;
  const after = jobLevel(S.job);
  return after > before ? { job:S.job, lv:after, mastered: after > DV.JOB_XP.length } : null;
}

// ---------- World progress ----------
const stageKey = (w, s) => `${w}-${s}`;
function stageOpen(w, s) {
  if (w > S.worldsCleared + 1) return false;
  return s === 0 || !!S.cleared[stageKey(w, s - 1)];
}
// Stage levels climb 4 per realm: realm 1 = Lv 1–5, realm 50 = Lv 197–201.
function stageLevel(w, s) { return 1 + (w - 1) * 4 + s; }
function topTier() { return clamp(S.worldsCleared + 1, 1, DV.WORLDS.length); }
function realmStatus(w) { const W = DV.WORLDS[w - 1]; return S.worldsCleared >= w ? (W.god.corrupted ? 'Purified' : 'Saved') : (W.god.corrupted ? 'Corrupted' : 'Besieged'); }
function stageName(w, s) { const W = DV.WORLDS[w - 1]; return s < 4 ? DV.STAGE_NAMES[s] : W.god.corrupted ? 'Avatar of the God' : 'The Herald\'s Siege'; }

// ---------- Bazaar ----------
function shopItems() {
  const t = topTier(), cut = 1 - Math.min(.5, M(mods(), 'shopCut'));
  return [
    { id:'hp', name:'Facet Tonic', text:'Restores 35% HP in battle.', price:20 * t },
    { id:'mp', name:'Mana Shard', text:'Restores 45% MP in battle.', price:20 * t },
    { id:'shards', name:'Shard Pouch ×10', text:'Upgrade material.', price:110 * t },
    { id:'chest', name:`${DV.materialFor(t)} Gear Cache`, text:'One random tier-' + t + ' item. Odds: 40% Common, 40% Rare, 15% Epic, 4.5% Legendary, 0.5% Mythic.', price:260 * t }
  ].map(it => ({ ...it, price: Math.round(it.price * cut) }));
}
function buy(id) {
  const it = shopItems().find(x => x.id === id);
  if (S.gold < it.price) return { msg:`Need ${it.price - S.gold} more gold.` };
  S.gold -= it.price;
  let got = null;
  if (id === 'hp' || id === 'mp') S.potions[id]++;
  else if (id === 'shards') S.shards += 10;
  else { got = makeItem(pick(DV.SLOTS), topTier(), rollRarity([40, 40, 15, 4.5, .5], M(mods(), 'rarityUp'))); S.inv.push(got); }
  save();
  return { msg: got ? `Got ${DV.RARITY[got.rarity].name} ${got.name}.` : `Bought ${it.name}.`, got };
}

// ---------- Character creation ----------
function createHero(name, look, origin, cls) {
  S.name = name || 'Facetborn'; S.look = look; S.origin = origin; S.cls = cls; S.created = true;
  unlockSkills();
  S.equip.weapon = makeItem('weapon', 1, 0);
  S.equip.armor = makeItem('armor', 1, 0);
  S.realm = null;
  save();
}
