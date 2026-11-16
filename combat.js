// Diamondverse — party combat. Hero (player-controlled or Auto) + up to 2 companions (AI) vs corrupted foes.
// Damage uses level-relative mitigation, so fights stay meaningful from Lv 1 to Lv 200:
//   damage = raw × K / (K + DEF × (1 − pierce)),  K = 20 + 5 × attacker level
// Enemies get stronger with level and with realm (+1.5% HP and +2.5% ATK per realm), and gain traits by arc:
//   Arc II Armored (+50% DEF) · Arc III Venomous (poison on hit) · Arc IV Swift (25% double attack) · Arc V Regenerating (4%/turn)
// Bosses: attack twice a round against a full party, resist stuns, charge Corrupted Wrath every 3rd turn (every 2nd once enraged from Arc III), enrage under 50% HP,
//   summon two adds from Arc III, and Wrath hits the whole party from Arc IV.

const TRAITS = {
  armored:{ name:'Armored', arc:2 }, venom:{ name:'Venomous', arc:3 }, swift:{ name:'Swift', arc:4 }, regen:{ name:'Regenerating', arc:5 }
};
function makeEnemy(name, lvl, kind, w) {
  const arc = DV.arcOf(w), g = 1 + .015 * (w - 1), ga = 1 + .025 * (w - 1);
  const m = kind === 'boss' ? { hp:3.3, atk:1.3, def:1.15, spd:1.1 } : kind === 'weak' ? { hp:.75, atk:1.05, def:1, spd:1 } : kind === 'add' ? { hp:.55, atk:.9, def:.9, spd:1 } : { hp:1, atk:1.25, def:1, spd:1 };
  const e = { name, lvl, kind, boss: kind === 'boss', hp:0, max:0,
    atk: Math.round((8 + 5 * lvl) * (1 + 1.5 * lvl / (lvl + 40)) * ga * m.atk), def: Math.round((3 + 1.3 * lvl) * m.def), spd: Math.round((8 + .55 * lvl) * m.spd),
    dots:[], stun:0, debuff:null, turn:0, enraged:false, charging:false, summoned:false, traits:[] };
  const hp = Math.round((40 + 75 * lvl * (.6 + .4 * Math.min(1, lvl / 40))) * g * m.hp);   // softer HP below Lv 40
  for (const t in TRAITS) {
    if (arc < TRAITS[t].arc) continue;
    if (e.boss || Math.random() < .2 + .08 * (arc - TRAITS[t].arc)) e.traits.push(t);
  }
  if (e.traits.includes('armored')) e.def = Math.round(e.def * (e.boss ? 1.25 : 1.5));
  if (e.boss) e.atk = Math.round(e.atk * (DV.ARCS[arc - 1].bossAtk || 1));
  e.hp = e.max = hp;
  return e;
}

// ---------- party units ----------
function heroUnit() {
  const st = calcStats(), m = mods();
  return { key:'hero', name:S.name, cls:S.cls, isHero:true, lvl:S.level, st, hp:st.hp, mp:st.mp, shield:0, buffs:[], cds:{}, dots:[], taunt:0,
    regen:M(m, 'regen'), mpCost:Math.max(.5, 1 - M(m, 'mpCostCut')), skills:S.loadout.slice() };
}
function compUnit(id) {
  const st = compStats(id), C = DV.COMPANIONS[id];
  return { key:id, name:C.name, cls:C.cls, isHero:false, lvl:S.level, st, hp:st.hp, mp:st.mp, shield:0, buffs:[], cds:{}, dots:[], taunt:0,
    regen:0, mpCost:1, skills:compSkills(id) };
}
const unitMain = u => DV.CLASSES[u.cls].main;
function getSkill(u, id) {
  if (id === 'basic') return { name:'Attack', kind:'hit', pow:1, stat:'main', mp:0, cd:0 };
  if (id === 'sig') return DV.COMPANIONS[u.key].sig;
  return DV.SKILLS[id];
}
const skillRank = (u, id) => u.isHero ? (S.skills[id] || 1) : compRank(u.key);
const skillCost = (u, k) => Math.round((k.mp || 0) * (1 + u.lvl / 40) * u.mpCost);
function buffed(u, stat) { let v = u.st[stat]; u.buffs.forEach(b => { if (b.stat === stat) v *= 1 + b.amt; }); return v; }
const alive = u => u.hp > 0;
const addShield = (u, v) => { u.shield = Math.min(Math.round(u.st.hp * .4), u.shield + Math.round(v)); };   // shields cap at 40% max HP
const aliveParty = () => B.party.filter(alive);
function aliveEnemies() { return B.enemies.filter(e => e.hp > 0); }
function fixTarget() { if (!B.enemies[B.target] || B.enemies[B.target].hp <= 0) B.target = B.enemies.findIndex(e => e.hp > 0); }
const mitigate = (raw, def, lvl, pierce) => { const K = 20 + 5 * lvl; return Math.max(1, Math.round(raw * K / (K + def * (1 - (pierce || 0))) * rnd(.92, 1.08))); };
const say = (t, msg) => { B.log.push([t, msg]); if (B.log.length > 80) B.log.shift(); };

// ---------- setup ----------
function startBattle(w, s) {
  const W = DV.WORLDS[w - 1], lvl = stageLevel(w, s), boss = s === DV.STAGES_PER_WORLD - 1;
  let enemies;
  if (boss) enemies = [makeEnemy(W.boss, lvl, 'boss', w)];
  else {
    const n = s < 2 ? 2 : 3;
    enemies = Array.from({ length:n }, (_, i) => makeEnemy(W.foes[Math.min(3, Math.floor(rnd(0, s + 1.6)))], Math.max(1, lvl - (i === 0 ? 0 : 1)), n === 3 ? 'weak' : 'normal', w));
    // Deeper shrines and later arcs field fiercer foes: +6% HP/ATK per shrine, +10% ATK per arc after the first.
    const f = 1 + .06 * s, fa = f * (1 + .1 * (DV.arcOf(w) - 1));
    enemies.forEach(e => { e.hp = e.max = Math.round(e.max * f); e.atk = Math.round(e.atk * fa); });
  }
  beginBattle(w, s, enemies, boss, boss ? `${W.boss} descends.` : `${enemies.length} corrupted foes block the way.`);
  B.again = () => startBattle(w, s);
  return B;
}
function startEncounter(w, foe, lvl, first, id) {
  const W = DV.WORLDS[w - 1], enemies = [makeEnemy(foe, lvl, 'normal', w)];
  if (Math.random() < .45) enemies.push(makeEnemy(pick(W.foes), Math.max(1, lvl - 1), 'weak', w));
  if (first) enemies.forEach(e => e.hp = Math.round(e.hp * .85));
  beginBattle(w, null, enemies, false, first ? `You strike first! ${foe} reels.` : `${foe} ambushes you!`);
  B.field = { id, foe, lvl };
  B.again = () => startEncounter(w, foe, lvl, false, id);
  return B;
}
function beginBattle(w, s, enemies, boss, opener) {
  const m = mods(), party = [heroUnit(), ...S.party.filter(compJoined).map(compUnit)];
  const scale = party.length === 1 && boss ? .42 : 1 + .75 * (party.length - 1);   // a solo hero faces a gentler boss
  enemies.forEach(e => { e.hp = e.max = Math.round(e.max * scale); });
  if (m.feast) party[0].buffs.push({ stat:'atk', amt:m.feast, turns:3 }, { stat:'mag', amt:m.feast, turns:3 });
  B = { w, s, boss, enemies, party, p:party[0], target:0, round:1, over:null, potUsed:0, potMax:2 + M(m, 'potUses'), potPow:1 + M(m, 'potionPow'),
    log:[[ 'sys', opener ]], fx:[], stats:{ turns:0, dmgTaken:0 } };
  const tr = [...new Set(enemies.flatMap(e => e.traits))];
  if (tr.length) say('warn', `Traits: ${tr.map(t => TRAITS[t].name).join(', ')}.`);
}

// ---------- actions ----------
function hitEnemy(u, e, raw, k) {
  const def = e.def * (e.debuff ? 1 - e.debuff.amt : 1);
  const crit = Math.random() * 100 < buffed(u, 'crit') + (k.critBonus || 0);
  let d = mitigate(raw * (crit ? 1.7 : 1), def, u.lvl, k.pierce);
  if (k.execute && e.hp / e.max < .3) d *= 2;
  e.hp = Math.max(0, e.hp - d);
  B.fx.push({ to:'e' + B.enemies.indexOf(e), v:d, crit });
  return d;
}
function heal(u, target, amt) {
  if (!alive(target)) return 0;
  const h = Math.min(target.st.hp - target.hp, Math.round(amt)); target.hp += h;
  if (h > 0) B.fx.push({ to:'u' + B.party.indexOf(target), v:h, heal:true });
  return h;
}
// Can unit u use skill id right now? Returns an error message or null.
function skillBlocked(u, id) {
  const k = getSkill(u, id);
  if (u.cds[id] > 0) return 'On cooldown.';
  if (u.mp < skillCost(u, k)) return 'Not enough MP.';
  if (k.kind === 'revive' && !B.party.some(x => !alive(x))) return 'No one to revive.';
  return null;
}
// Perform skill `id` by unit u against B.target. Returns { haste } when the unit acts again.
function act(u, id) {
  const k = getSkill(u, id), err = skillBlocked(u, id);
  if (err) return { err };
  const mult = 1 + .15 * (skillRank(u, id) - 1), cost = skillCost(u, k);
  u.mp -= cost; if (k.cd) u.cds[id] = k.cd + 1;
  if (id !== 'basic') track('skill');
  fixTarget();
  const stat = k.stat === 'main' ? unitMain(u) : k.stat;
  const raw = (k.pow || 0) * mult * buffed(u, stat) + (k.defScale ? k.defScale * mult * buffed(u, 'def') : 0);
  const who = u.isHero ? 'you' : 'ally', name = u.isHero ? '' : u.name + ': ';
  let total = 0;
  if (k.kind === 'hit' || k.kind === 'multi') {
    const e = B.enemies[B.target] || aliveEnemies()[0];
    for (let h = 0; h < (k.hits || 1); h++) if (e.hp > 0) total += hitEnemy(u, e, raw, k);
    riders(k, [e], raw);
    say(who, `${name}${k.name} hits ${e.name} for ${total}.`);
  } else if (k.kind === 'aoe') {
    const hits = aliveEnemies(); hits.forEach(e => total += hitEnemy(u, e, raw, k)); riders(k, hits, raw);
    say(who, `${name}${k.name} hits ${hits.length} foe${hits.length > 1 ? 's' : ''} for ${total}.`);
  } else if (k.kind === 'heal') {
    const t = aliveParty().sort((a, b) => a.hp / a.st.hp - b.hp / b.st.hp)[0];
    say(who, `${name}${k.name} restores ${heal(u, t, raw)} HP to ${t.isHero ? 'you' : t.name}.`);
  } else if (k.kind === 'healAll') {
    let h = 0; aliveParty().forEach(t => h += heal(u, t, raw * .5)); say(who, `${name}${k.name} restores ${h} HP across the party.`);
  } else if (k.kind === 'shield') {
    addShield(u, raw * .5); say(who, `${name}${k.name}: shield up (${u.shield}).`);
  } else if (k.kind === 'shieldAll') {
    aliveParty().forEach(t => addShield(t, raw * .35)); say(who, `${name}${k.name} shields the party.`);
  } else if (k.kind === 'revive') {
    const t = B.party.find(x => !alive(x));
    if (t) { t.hp = Math.round(t.st.hp * k.revive); t.dots = []; say(who, `${name}${k.name} brings ${t.name} back!`); }
  } else if (k.kind === 'haste') {
    say(who, `${name}${k.name}. Time slows.`);
  }
  if (k.buff) {
    const targets = k.buff.party ? aliveParty() : [u];
    targets.forEach(t => t.buffs.push({ stat:k.buff.stat, amt:k.buff.amt * mult, turns:k.buff.turns + 1 }));
    say(who, `${name}${k.name}: +${Math.round(k.buff.amt * mult * 100)}% ${DV.STAT_LABEL[k.buff.stat]}${k.buff.party ? ' to the party' : ''}.`);
  }
  if (k.healPct) heal(u, u, u.st.hp * k.healPct * mult);
  if (k.lifesteal && total) heal(u, u, total * k.lifesteal);
  if (k.revive && k.kind === 'healAll') B.party.forEach(t => { if (!alive(t)) { t.hp = Math.round(t.st.hp * k.revive); say(who, `${t.name} rises!`); } });
  if (k.cleanse) B.party.forEach(t => t.dots = []);
  if (k.mpGift) aliveParty().forEach(t => t.mp = Math.min(t.st.mp, t.mp + Math.round(t.st.mp * k.mpGift)));
  if (k.taunt) { u.taunt = k.taunt + 1; say(who, `${name}${u.isHero ? 'You draw' : 'draws'} every foe's attention.`); }
  return { haste: !!k.haste };
}
function riders(k, targets, raw) {
  targets.forEach(e => {
    if (e.hp <= 0) return;
    if (k.dot) e.dots.push({ dmg:Math.round(raw * k.dot.pct), turns:k.dot.turns });
    // Bosses resist stuns (40% of the normal chance) and are immune for 2 turns after one.
    if (k.stun && !(e.boss && e.stunImmune > 0) && Math.random() < k.stun * (e.boss ? .4 : 1)) { e.stun = 1; if (e.boss) e.stunImmune = 3; say('sys', `${e.name} is stunned.`); }
    if (k.debuff) e.debuff = { ...k.debuff, turns:k.debuff.turns + 1 };
  });
}

// Simple tactical AI used by companions, the Auto button and the balance simulator.
function chooseAction(u) {
  const usable = ['basic', ...u.skills].filter(id => !skillBlocked(u, id));
  const K = id => getSkill(u, id), party = aliveParty();
  const low = party.some(t => t.hp / t.st.hp < .4), avg = party.reduce((a, t) => a + t.hp / t.st.hp, 0) / party.length;
  const bossCharging = B.enemies.some(e => e.charging && e.hp > 0);
  const find = pred => usable.filter(id => pred(K(id)));
  const best = list => list.sort((a, b) => (K(b).pow || 0) * (K(b).hits || 1) - (K(a).pow || 0) * (K(a).hits || 1))[0];
  let r = find(k => k.kind === 'revive'); if (r.length) return r[0];
  if (avg < .55 || low) { r = find(k => k.kind === 'healAll'); if (r.length) return r[0]; r = find(k => k.kind === 'heal'); if (r.length) return r[0]; }
  if (bossCharging) { r = find(k => k.kind === 'shieldAll' || (k.kind === 'shield') || k.stun >= 1); if (r.length) return r[0]; }
  r = find(k => k.kind === 'haste'); if (r.length) return r[0];
  r = find(k => k.kind === 'buff' && !(k.buff && u.buffs.some(b => b.stat === k.buff.stat)));
  if (r.length && Math.random() < .6) return r[0];
  const foes = aliveEnemies().length;
  if (foes >= 2) { r = find(k => k.kind === 'aoe'); if (r.length) return best(r); }
  r = find(k => k.kind === 'hit' || k.kind === 'multi' || (k.kind === 'aoe' && foes === 1));
  return r.length ? best(r) : 'basic';
}
function pickTarget() {   // focus the weakest living foe
  const live = aliveEnemies(); if (!live.length) return;
  B.target = B.enemies.indexOf(live.sort((a, b) => a.hp - b.hp)[0]);
}

// ---------- turn flow ----------
// Hero acts with skill `id`; then companions act; then foes. Returns an error string or null.
function useSkill(id) {
  if (B.over) return null;
  const res = act(B.p, id);
  if (res.err) return res.err;
  B.stats.turns++;
  if (checkEnd()) return null;
  if (res.haste) { say('sys', 'You act again!'); return null; }
  return afterHeroTurn();
}
function usePotion(type) {
  if (B.potUsed >= B.potMax) return `Only ${B.potMax} potions per battle.`;
  if (!S.potions[type]) return 'None left. Buy more in the Bazaar.';
  const p = B.p;
  S.potions[type]--; B.potUsed++; track('potion');
  if (type === 'hp') { const h = heal(p, p, p.st.hp * .35 * B.potPow); say('you', `Facet Tonic restores ${h} HP.`); }
  else { const m = Math.round(p.st.mp * .45 * B.potPow); p.mp = Math.min(p.st.mp, p.mp + m); say('you', `Mana Shard restores ${m} MP.`); }
  B.stats.turns++;
  return afterHeroTurn();
}
function autoTurn() {   // Auto: the AI plays the hero's turn
  if (B.over) return;
  const p = B.p;
  if (p.hp / p.st.hp < .3 && S.potions.hp && B.potUsed < B.potMax) return usePotion('hp');
  if (p.mp < p.st.mp * .15 && S.potions.mp && B.potUsed < B.potMax && Math.random() < .5) return usePotion('mp');
  pickTarget();
  return useSkill(chooseAction(p));
}
function afterHeroTurn() {
  for (const u of B.party.slice(1)) {
    if (!alive(u) || B.over) continue;
    let guard = 0, res;
    do { pickTarget(); res = act(u, chooseAction(u)); } while (res.haste && ++guard < 2 && !checkEnd());
    if (checkEnd()) return null;
  }
  const avgSpd = aliveEnemies().reduce((t, e) => t + e.spd, 0) / aliveEnemies().length;
  if (Math.random() * 100 < clamp((B.p.st.spd - avgSpd) / avgSpd * 30, 0, 20)) { say('sys', 'Swift! You act again.'); tickCds(); return null; }
  enemyPhase(); return null;
}
function pickVictim() {
  const live = aliveParty(), w = live.map(u => u.taunt > 0 ? 6 : u.cls === 'guardian' ? 2 : 1);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < live.length; i++) { r -= w[i]; if (r <= 0) return live[i]; }
  return live[0];
}
function strike(e, t, mult, label) {
  const dodge = clamp((buffed(t, 'spd') - e.spd) / e.spd * 30, 0, 15);
  if (label === 'strikes' && Math.random() * 100 < dodge) { say(t.isHero ? 'you' : 'ally', `${t.isHero ? 'You dodge' : t.name + ' dodges'} ${e.name}.`); B.fx.push({ to:'u' + B.party.indexOf(t), miss:true }); return; }
  let d = mitigate(e.atk * mult, buffed(t, 'def'), e.lvl);
  if (t.shield) { const a = Math.min(t.shield, d); t.shield -= a; d -= a; }
  t.hp = Math.max(0, t.hp - d); if (t.isHero) B.stats.dmgTaken += d;
  B.fx.push({ to:'u' + B.party.indexOf(t), v:d });
  if (e.traits.includes('venom') && d > 0) t.dots.push({ dmg:Math.round(d * .15), turns:3 });
  say('foe', `${e.name} ${label === 'strikes' ? 'strikes' : 'uses ' + label + ' on'} ${t.isHero ? 'you' : t.name} for ${d}.${t.hp <= 0 ? (t.isHero ? '' : ` ${t.name} falls!`) : ''}`);
}
function enemyPhase() {
  const arc = DV.arcOf(B.w);
  for (const e of aliveEnemies()) {
    if (!aliveParty().length || !alive(B.p)) break;
    if (e.stunImmune) e.stunImmune--;
    if (e.stun) { e.stun = 0; say('foe', `${e.name} is stunned and loses its turn.`); continue; }
    e.turn++;
    let mult = Math.random() < .2 ? 1.5 : 1, label = mult > 1 ? 'Heavy strike' : 'strikes';
    if (e.boss) {
      if (!e.enraged && e.hp / e.max < .5) {
        e.enraged = true; e.atk = Math.round(e.atk * 1.25); say('foe', `${e.name} is enraged. The Rot surges.`);
        if (arc >= 3 && !e.summoned) {
          e.summoned = true; const W = DV.WORLDS[B.w - 1];
          for (let i = 0; i < 2; i++) { const a = makeEnemy(pick(W.foes), Math.max(1, e.lvl - 2), 'add', B.w); a.hp = a.max = Math.round(a.max * (1 + .75 * (B.party.length - 1))); B.enemies.push(a); }
          say('warn', `${e.name} summons two ${W.foes[0]}s!`);
        }
      }
      const every = e.enraged && arc >= 3 ? 2 : 3;
      if (e.charging) {
        e.charging = false;
        if (arc >= 4) { aliveParty().forEach(t => strike(e, t, 1.6, 'Corrupted Wrath')); continue; }
        mult = 2.2; label = 'Corrupted Wrath';
      } else if (e.turn % every === every - 1) { e.charging = true; say('warn', `${e.name} gathers corrupted power. Shield, heal or stun now.`); continue; }
    }
    strike(e, pickVictim(), mult, label);
    // A boss facing a full party gets a second, normal attack each round.
    if (e.boss && B.party.length > 2 && aliveParty().length && alive(B.p)) strike(e, pickVictim(), 1, 'strikes');
    if (e.traits.includes('swift') && Math.random() < .25 && aliveParty().length && alive(B.p)) { say('foe', `${e.name} moves again!`); strike(e, pickVictim(), 1, 'strikes'); }
  }
  // end of round
  B.enemies.forEach((e, i) => {
    if (e.hp <= 0) return;
    e.dots = e.dots.filter(d => { e.hp = Math.max(0, e.hp - d.dmg); B.fx.push({ to:'e' + i, v:d.dmg, dot:true }); return --d.turns > 0; });
    if (e.traits.includes('regen') && e.hp > 0) e.hp = Math.min(e.max, e.hp + Math.round(e.max * (e.boss ? .01 : .04)));
    if (e.debuff && --e.debuff.turns <= 0) e.debuff = null;
  });
  B.party.forEach((u, i) => {
    if (!alive(u)) return;
    u.dots = u.dots.filter(d => { u.hp = Math.max(u.isHero ? 1 : 0, u.hp - d.dmg); B.fx.push({ to:'u' + i, v:d.dmg, dot:true }); return --d.turns > 0; });
    if (u.regen) heal(u, u, u.st.hp * u.regen);
    u.mp = Math.min(u.st.mp, u.mp + Math.round(u.st.mp * .06));
    u.buffs = u.buffs.filter(b => --b.turns > 0);
    if (u.taunt) u.taunt--;
  });
  tickCds(); B.round++;
  checkEnd();
}
function tickCds() { B.party.forEach(u => { for (const id in u.cds) if (u.cds[id] > 0) u.cds[id]--; }); }
function checkEnd() {
  if (B.over) return true;
  if (!aliveEnemies().length) { B.over = 'win'; B.reward = grantRewards(); return true; }
  if (B.p.hp <= 0) { B.over = 'lose'; return true; }
  fixTarget(); return false;
}

// ---------- rewards ----------
function grantRewards() {
  const m = mods(), field = !!B.field, key = field ? null : stageKey(B.w, B.s), first = !field && !S.cleared[key];
  let xp = 0, gold = 0;
  B.enemies.forEach(e => { const k = { boss:4, weak:.7, add:.5 }[e.kind] || 1; xp += (12 + 10 * e.lvl) * k; gold += (10 + 4 * e.lvl) * k; });
  xp = Math.round(xp * (1 + M(m, 'xp'))); gold = Math.round(gold * (1 + M(m, 'gold')));
  let dia = (first ? (B.boss ? 60 : 15) : 0) + M(m, 'dia');
  S.gold += gold; S.lifetimeGold += gold; S.dia += dia;
  if (!field) S.cleared[key] = (S.cleared[key] || 0) + 1;
  let worldDone = false, recruited = [];
  if (B.boss && first && S.worldsCleared < B.w) { S.worldsCleared = B.w; worldDone = true; recruited = syncRecruits(); }
  const drops = [];
  const chance = (B.boss ? 1 : field ? .25 : .35) + M(m, 'drop');
  if (Math.random() < chance) drops.push(makeItem(pick(DV.SLOTS), B.w, rollRarity(B.boss ? [0, 50, 35, 13, 2] : [60, 28, 9, 2.6, .4], M(m, 'rarityUp'))));
  drops.forEach(d => S.inv.push(d));
  const found = [];
  if (Math.random() < M(m, 'harvest')) { S.potions.hp++; found.push('Facet Tonic'); }
  if (Math.random() < M(m, 'catch')) { S.potions.mp++; found.push('Mana Shard'); }
  const avgLvl = B.enemies.reduce((t, e) => t + e.lvl, 0) / B.enemies.length;
  const jxp = S.job ? Math.round((8 + avgLvl * 2) * (B.boss ? 3 : 1)) : 0;
  const jobUp = gainJobXp(jxp);
  const bondUps = addBondWins();
  let quest = null;
  if (field) { S.qprog[B.w] = (S.qprog[B.w] || 0) + 1; quest = checkQuest(B.w); }
  track('win'); track('foe', B.enemies.length); track(field ? 'field' : 'stage');
  if (S.party.length >= DV.PARTY_MAX) track('bond');
  const lv = gainXp(xp);
  save();
  return { xp, gold, dia, drops, found, jxp, jobUp, bondUps, quest, recruited, first, worldDone, ...lv };
}
