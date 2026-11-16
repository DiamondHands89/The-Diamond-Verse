// Diamondverse — rules engine: state, stats, progression, gear and combat. No DOM code here.
const SAVE_KEY = 'diamondverse.save.v1';
let S = null;   // persistent game state
let B = null;   // active battle

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function newState() {
  return {
    v:1, created:false, name:'', look:{skin:1,hair:0,eyes:0,outfit:0,hairStyle:0}, origin:'student',
    level:1, xp:0, attrPts:0, attrs:{str:0,int:0,vit:0,agi:0,spi:0},
    cls:null, cls2:null, job:null, jobsOwned:['blacksmith','alchemist','hunter','scholar'],
    skillPts:0, skills:{}, loadout:[],
    gold:200, dia:30, lifetimeGold:0, shards:10, potions:{hp:3, mp:2},
    equip:{weapon:null,helm:null,armor:null,charm:null}, inv:[], nextId:1,
    cleared:{}, worldsCleared:0, seen:{}
  };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return Object.assign(newState(), JSON.parse(raw)); } catch (e) {}
  return null;
}

// ---------- Modifiers from job + blessings ----------
function jobMods() { return (S.job && DV.JOBS[S.job].mods) || {}; }
function blessingMods() {
  const m = {};
  DV.WORLDS.slice(0, S.worldsCleared).forEach(w => {
    for (const k in w.blessing.mods) m[k] = (k === 'mpCost') ? (m[k] || 1) * w.blessing.mods[k] : (m[k] || 0) + w.blessing.mods[k];
  });
  return m;
}
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
  return { id:S.nextId++, slot, tier, rarity, plus:0, name:`${DV.MATERIAL[tier - 1]} ${noun}`, stats };
}
function itemStats(it) {
  const o = {};
  for (const k in it.stats) o[k] = Math.round(it.stats[k] * (1 + it.plus * DV.UPGRADE.perLevel));
  return o;
}
function itemPower(it) { const s = itemStats(it); return Object.entries(s).reduce((t,[k,v]) => t + v * (k==='hp'||k==='mp' ? .25 : 2), 0) | 0; }
function upgradeCost(it) {
  const m = jobMods();
  return { gold: Math.round(40 * Math.pow(it.plus + 1, 1.5) * it.tier * (m.upCost || 1)), shards: Math.ceil((it.plus + 1) * 1.6) };
}
function upgradeRate(it) {
  const m = jobMods();
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
  save();
  return { ok:true, success, msg: success ? `${it.name} is now +${it.plus}.` : `The facet cracked. ${it.name} stays +${it.plus}. Materials were used.` };
}
function salvage(id) {
  const i = S.inv.findIndex(x => x.id === id); if (i < 0) return 0;
  const it = S.inv[i], n = DV.RARITY[it.rarity].shards + it.plus * 2;
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
  DV.SLOTS.forEach(s => { const it = S.equip[s]; if (it) { const is = itemStats(it); for (const k in is) st[k] += is[k]; } });
  const bm = blessingMods(), jm = jobMods(), all = (1 + (bm.all || 0)) * (jm.all || 1);
  for (const k in st) st[k] = st[k] * (1 + (bm[k] || 0)) * all;
  st.crit = clamp(st.crit + (bm.critFlat || 0), 0, 75);
  for (const k in st) st[k] = k === 'crit' ? Math.round(st[k] * 10) / 10 : Math.round(st[k]);
  return st;
}
function heroPower() { const s = calcStats(); return Math.round(s.hp * .3 + s.mp * .15 + (s.atk + s.mag) * 2 + s.def * 2.5 + s.spd * 2 + s.crit * 3); }

// ---------- Leveling & skills ----------
const xpNeed = L => Math.floor(24 * Math.pow(L, 1.35)) + 10;
function skillPool() {
  return Object.keys(DV.SKILLS).filter(id => { const k = DV.SKILLS[id]; return k.cls === S.cls || k.cls === S.cls2; });
}
function unlockSkills() {
  const fresh = [];
  skillPool().forEach(id => {
    if (!S.skills[id] && DV.SKILLS[id].lvl <= S.level) {
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
function jobRevealed(id) {
  const j = DV.JOBS[id]; if (!j.luxury) return true;
  const r = j.reveal;
  return (r.level && S.level >= r.level) || (r.world && S.worldsCleared >= r.world) || (r.gold && S.lifetimeGold >= r.gold);
}
function setJob(id) {
  const j = DV.JOBS[id];
  if (j.luxury && !S.jobsOwned.includes(id)) {
    if (!jobRevealed(id)) return 'Still sealed.';
    if (S.dia < j.cost) return `Needs ${j.cost} Diamonds.`;
    S.dia -= j.cost; S.jobsOwned.push(id);
  } else if (!j.luxury && S.job && S.job !== id) {
    if (S.gold < DV.JOB_SWAP_GOLD) return `Changing jobs costs ${DV.JOB_SWAP_GOLD} gold.`;
    S.gold -= DV.JOB_SWAP_GOLD;
  }
  S.job = id; save(); return null;
}

// ---------- World progress ----------
const stageKey = (w, s) => `${w}-${s}`;
function stageOpen(w, s) {
  if (w > S.worldsCleared + 1) return false;
  return s === 0 || !!S.cleared[stageKey(w, s - 1)];
}
function stageLevel(w, s) { return (w - 1) * 8 + [1, 2, 4, 5, 7][s]; }
function topTier() { return clamp(S.worldsCleared + 1, 1, 6); }

// ---------- Combat ----------
function makeEnemy(name, lvl, boss, weak) {
  const m = boss ? { hp:4.5, atk:1.3, def:1.15, spd:1.1 } : weak ? { hp:.72, atk:.75, def:1, spd:1 } : { hp:1, atk:1, def:1, spd:1 };
  const hp = Math.round((36 + lvl * 19 + lvl * lvl * .3) * m.hp);
  return { name, lvl, boss, hp, max:hp, atk:Math.round((4 + lvl * 2.7 + lvl * lvl * .025) * m.atk), def:Math.round((2 + lvl * 1.4) * m.def),
    spd:Math.round((8 + lvl * .9) * m.spd), dots:[], stun:0, debuff:null, turn:0, enraged:false, charging:false };
}
function startBattle(w, s) {
  const W = DV.WORLDS[w - 1], lvl = stageLevel(w, s), boss = s === DV.STAGES_PER_WORLD - 1;
  const st = calcStats(), jm = jobMods(), bm = blessingMods();
  let enemies;
  if (boss) enemies = [makeEnemy(W.god, lvl, true)];
  else {
    const n = s < 2 ? 2 : 3;
    enemies = Array.from({ length:n }, (_, i) => makeEnemy(W.foes[Math.min(3, Math.floor(rnd(0, s + 1.6)))], Math.max(1, lvl - (i === 0 ? 0 : 1)), false, n === 3));
  }
  const buffs = [];
  if (jm.feast) { buffs.push({ stat:'atk', amt:jm.feast, turns:3 }, { stat:'mag', amt:jm.feast, turns:3 }); }
  B = { w, s, boss, enemies, target:0, round:1, over:null, potUsed:0, potMax:2 + (jm.potUses || 0),
    p:{ hp:st.hp, mp:st.mp, st, shield:0, buffs, cds:{}, regen:(bm.regen || 0) + (jm.regen || 0), mpCost:bm.mpCost || 1 },
    log:[[ 'sys', boss ? `${W.god} descends.` : `${enemies.length} corrupted foes block the way.` ]], fx:[] };
  return B;
}
function buffed(stat) {
  let v = B.p.st[stat];
  B.p.buffs.forEach(b => { if (b.stat === stat) v *= 1 + b.amt; });
  return v;
}
const mitigate = (raw, def) => Math.max(1, Math.round(raw * 70 / (70 + def) * rnd(.92, 1.08)));
const say = (t, msg) => B.log.push([t, msg]);
function aliveEnemies() { return B.enemies.filter(e => e.hp > 0); }
function fixTarget() { if (!B.enemies[B.target] || B.enemies[B.target].hp <= 0) B.target = B.enemies.findIndex(e => e.hp > 0); }

function hitEnemy(e, idx, raw, critBonus, k) {
  const def = e.def * (e.debuff ? 1 - e.debuff.amt : 1);
  const crit = Math.random() * 100 < B.p.st.crit + (critBonus || 0);
  let d = mitigate(raw * (crit ? 1.7 : 1), def);
  if (k && k.execute && e.hp / e.max < .3) d *= 2;
  e.hp = Math.max(0, e.hp - d);
  B.fx.push({ to:'e' + idx, v:d, crit });
  return d;
}
function useSkill(id) {
  const k = id === 'basic' ? { name:'Attack', kind:'hit', pow:1, stat:mainStat(), mp:0, cd:0 } : DV.SKILLS[id];
  const rank = S.skills[id] || 1, mult = 1 + .15 * (rank - 1), p = B.p;
  const cost = Math.round(k.mp * p.mpCost);
  if (p.cds[id] > 0) return 'On cooldown.';
  if (p.mp < cost) return 'Not enough MP.';
  p.mp -= cost; if (k.cd) p.cds[id] = k.cd + 1;
  fixTarget();
  const raw = k.pow * mult * buffed(k.stat === 'def' ? 'def' : k.stat) + (k.defScale ? k.defScale * mult * buffed('def') : 0);
  let total = 0;
  if (k.kind === 'hit' || k.kind === 'multi') {
    const e = B.enemies[B.target];
    for (let h = 0; h < (k.hits || 1); h++) if (e.hp > 0) total += hitEnemy(e, B.target, raw, k.critBonus, k);
    applyRiders(k, [e], raw);
    say('you', `${k.name} hits ${e.name} for ${total}.`);
  } else if (k.kind === 'aoe') {
    const hits = aliveEnemies();
    hits.forEach(e => total += hitEnemy(e, B.enemies.indexOf(e), raw, k.critBonus, k));
    applyRiders(k, hits, raw);
    say('you', `${k.name} hits ${hits.length} foes for ${total} total.`);
  } else if (k.kind === 'heal') {
    const h = Math.round(raw); p.hp = Math.min(p.st.hp, p.hp + h); B.fx.push({ to:'p', v:h, heal:true });
    say('you', `${k.name} restores ${h} HP.`);
  } else if (k.kind === 'shield') {
    const sh = Math.round(raw); p.shield += sh; say('you', `${k.name} grants a ${sh}-point shield.`);
  }
  if (k.buff) { p.buffs.push({ ...k.buff, amt:k.buff.amt * mult, turns:k.buff.turns + 1 }); say('you', `${k.name}: +${Math.round(k.buff.amt * mult * 100)}% ${DV.STAT_LABEL[k.buff.stat]}.`); }
  if (k.healPct) { const h = Math.round(p.st.hp * k.healPct * mult); p.hp = Math.min(p.st.hp, p.hp + h); B.fx.push({ to:'p', v:h, heal:true }); }
  if (k.lifesteal && total) { const h = Math.round(total * k.lifesteal); p.hp = Math.min(p.st.hp, p.hp + h); B.fx.push({ to:'p', v:h, heal:true }); }
  return endPlayerTurn();
}
function applyRiders(k, targets, raw) {
  targets.forEach(e => {
    if (e.hp <= 0) return;
    if (k.dot) e.dots.push({ dmg:Math.round(raw * k.dot.pct), turns:k.dot.turns });
    if (k.stun && Math.random() < k.stun) { e.stun = 1; say('you', `${e.name} is stunned.`); }
    if (k.debuff) e.debuff = { ...k.debuff, turns:k.debuff.turns + 1 };
  });
}
function usePotion(type) {
  if (B.potUsed >= B.potMax) return `Only ${B.potMax} potions per battle.`;
  if (!S.potions[type]) return 'None left. Buy more in the Bazaar.';
  const p = B.p, jm = jobMods();
  S.potions[type]--; B.potUsed++;
  if (type === 'hp') { const h = Math.round(p.st.hp * .35 * (jm.potion || 1)); p.hp = Math.min(p.st.hp, p.hp + h); B.fx.push({ to:'p', v:h, heal:true }); say('you', `Facet Tonic restores ${h} HP.`); }
  else { const m = Math.round(p.st.mp * .45 * (jm.potion || 1)); p.mp = Math.min(p.st.mp, p.mp + m); say('you', `Mana Shard restores ${m} MP.`); }
  return endPlayerTurn();
}
function endPlayerTurn() {
  if (checkEnd()) return null;
  const avgSpd = aliveEnemies().reduce((t, e) => t + e.spd, 0) / aliveEnemies().length;
  if (Math.random() * 100 < clamp((B.p.st.spd - avgSpd) * 1.2, 0, 20)) { say('sys', 'Swift! You act again.'); tickCds(); return null; }
  enemyPhase(); return null;
}
function enemyPhase() {
  const p = B.p;
  aliveEnemies().forEach(e => {
    const idx = B.enemies.indexOf(e);
    if (e.stun) { e.stun = 0; say('foe', `${e.name} is stunned and loses its turn.`); return; }
    e.turn++;
    let mult = Math.random() < .2 ? 1.5 : 1, label = mult > 1 ? 'Heavy strike' : 'strikes';
    if (e.boss) {
      if (!e.enraged && e.hp / e.max < .5) { e.enraged = true; e.atk = Math.round(e.atk * 1.25); say('foe', `${e.name} is enraged. The Rot surges.`); }
      if (e.charging) { mult = 2.2; label = 'Corrupted Wrath'; e.charging = false; }
      else if (e.turn % 3 === 2) { e.charging = true; say('warn', `${e.name} gathers corrupted power. Shield up or heal now.`); return; }
    }
    const dodge = clamp((p.st.spd - e.spd) * 1.5, 0, 25);
    if (Math.random() * 100 < dodge) { say('you', `You dodge ${e.name}.`); B.fx.push({ to:'p', miss:true }); return; }
    let d = mitigate(e.atk * mult, buffed('def'));
    if (p.shield) { const a = Math.min(p.shield, d); p.shield -= a; d -= a; }
    p.hp = Math.max(0, p.hp - d); B.fx.push({ to:'p', v:d, from:'e' + idx });
    say('foe', `${e.name} ${label === 'strikes' ? 'strikes' : 'uses ' + label} for ${d}.`);
  });
  // end of round: dots, regen, timers
  B.enemies.forEach((e, i) => {
    if (e.hp <= 0) return;
    e.dots = e.dots.filter(d => { e.hp = Math.max(0, e.hp - d.dmg); B.fx.push({ to:'e' + i, v:d.dmg, dot:true }); return --d.turns > 0; });
    if (e.debuff && --e.debuff.turns <= 0) e.debuff = null;
  });
  if (p.regen && p.hp > 0) p.hp = Math.min(p.st.hp, p.hp + Math.round(p.st.hp * p.regen));
  p.mp = Math.min(p.st.mp, p.mp + Math.round(p.st.mp * .06));
  p.buffs = p.buffs.filter(b => --b.turns > 0);
  tickCds(); B.round++;
  checkEnd();
}
function tickCds() { for (const id in B.p.cds) if (B.p.cds[id] > 0) B.p.cds[id]--; }
function checkEnd() {
  if (!aliveEnemies().length) { B.over = 'win'; B.reward = grantRewards(); return true; }
  if (B.p.hp <= 0) { B.over = 'lose'; return true; }
  fixTarget(); return false;
}
function grantRewards() {
  const jm = jobMods(), key = stageKey(B.w, B.s), first = !S.cleared[key];
  let xp = 0, gold = 0;
  B.enemies.forEach(e => { xp += (14 + e.lvl * 9) * (e.boss ? 4 : 1); gold += (10 + e.lvl * 5) * (e.boss ? 4 : 1); });
  xp = Math.round(xp * (jm.xp || 1)); gold = Math.round(gold * (jm.gold || 1));
  let dia = (first ? (B.boss ? 60 : 15) : 0) + (jm.dia || 0);
  S.gold += gold; S.lifetimeGold += gold; S.dia += dia;
  S.cleared[key] = (S.cleared[key] || 0) + 1;
  let worldDone = false;
  if (B.boss && first && S.worldsCleared < B.w) { S.worldsCleared = B.w; worldDone = true; }
  const drops = [];
  const chance = (B.boss ? 1 : .35) + (jm.drop || 0);
  if (Math.random() < chance) drops.push(makeItem(pick(DV.SLOTS), B.w, rollRarity(B.boss ? [0, 50, 35, 13, 2] : [60, 28, 9, 2.6, .4], jm.rarityUp)));
  drops.forEach(d => S.inv.push(d));
  const lv = gainXp(xp);
  save();
  return { xp, gold, dia, drops, first, worldDone, ...lv };
}

// ---------- Bazaar ----------
function shopItems() {
  const t = topTier();
  return [
    { id:'hp', name:'Facet Tonic', text:'Restores 35% HP in battle.', price:20 * t },
    { id:'mp', name:'Mana Shard', text:'Restores 45% MP in battle.', price:20 * t },
    { id:'shards', name:'Shard Pouch ×10', text:'Upgrade material.', price:110 * t },
    { id:'chest', name:`${DV.MATERIAL[t - 1]} Gear Cache`, text:'One random tier-' + t + ' item. Odds: 40% Common, 40% Rare, 15% Epic, 4.5% Legendary, 0.5% Mythic.', price:260 * t }
  ];
}
function buy(id) {
  const it = shopItems().find(x => x.id === id);
  if (S.gold < it.price) return { msg:`Need ${it.price - S.gold} more gold.` };
  S.gold -= it.price;
  let got = null;
  if (id === 'hp' || id === 'mp') S.potions[id]++;
  else if (id === 'shards') S.shards += 10;
  else { got = makeItem(pick(DV.SLOTS), topTier(), rollRarity([40, 40, 15, 4.5, .5], jobMods().rarityUp)); S.inv.push(got); }
  save();
  return { msg: got ? `Got ${DV.RARITY[got.rarity].name} ${got.name}.` : `Bought ${it.name}.`, got };
}

// ---------- Character creation ----------
function createHero(name, look, origin, cls) {
  S.name = name || 'Facetborn'; S.look = look; S.origin = origin; S.cls = cls; S.created = true;
  unlockSkills();
  S.equip.weapon = makeItem('weapon', 1, 0);
  S.equip.armor = makeItem('armor', 1, 0);
  save();
}
