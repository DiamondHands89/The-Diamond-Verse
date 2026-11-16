// Diamondverse balance simulator — plays the whole story for every class combination using the game's own engine.
// Usage: node tools/sim.js [profile] [out.json] [runs]     profile = story (default) | explorer; runs per combo (default 3)
//   story:    follows the main path. Story companions only, no hidden stories, 3 open-world fights and 4 chests per realm.
//   explorer: also finds every hidden companion and hidden story, and fights 6 open-world foes per realm.
// A loss is followed by 3 open-world "training" fights at that realm, then a retry (max 25 tries per stage).
// HP carries between fights. The player rests in town before a shrine fight when anyone is under 70% HP,
// and before an open-world fight when the hero is under 40%.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FILES = ['data.js', 'realms/arc1.js', 'realms/arc2.js', 'realms/arc3.js', 'realms/arc4.js', 'realms/arc5.js', 'engine.js', 'payments.js', 'party.js', 'combat.js'];
const profile = process.argv[2] || 'story', outFile = process.argv[3], RUNS = +process.argv[4] || 3;
const SRC = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');

function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function run(primary, secondary, seed) {
  const store = {};
  const ctx = { console, JSON, Date, Intl, crypto:{ randomUUID:() => 'sim-' + seed }, location:{ hash:'' },
    localStorage:{ getItem:k => store[k] || null, setItem:(k, v) => { store[k] = v; } } };
  ctx.Math = Object.create(Math); ctx.Math.random = mulberry(seed);
  vm.createContext(ctx);
  vm.runInContext(SRC + `
  ;S = newState();
  const P = ${JSON.stringify({ primary, secondary, profile })};
  createHero('Sim', S.look, DV.CLASSES[P.primary].main === 'atk' ? 'athlete' : 'student', P.primary);
  S.job = 'hunter';
  const rows = [];
  function prep() {
    const main = mainStat() === 'atk' ? 'str' : 'int';
    while (S.attrPts > 0) { S.attrPts--; S.attrs[S.attrPts % 3 === 0 ? 'vit' : main]++; }
    if (secondaryUnlocked() && !S.cls2) { S.cls2 = P.secondary; unlockSkills(); }
    if (S.job === 'hunter' && jobMastered('hunter')) S.job = 'blacksmith';
    if (S.job === 'blacksmith' && jobMastered('blacksmith') && jobAvailable('farmer')) S.job = 'farmer';
    ['doctor','merchant','botanist'].forEach(j => unlockJob(j));
    if (jobAvailable('doctor') && jobMastered('farmer')) S.job = 'doctor';
    let guard = 0; for (const id of Object.keys(S.skills).sort((a, b) => S.skills[a] - S.skills[b])) while (upgradeSkill(id) && ++guard < 200);
    const rankOf = id => DV.SKILLS[id].hidden ? 4 * DV.WORLDS.findIndex(W => W.lore && W.lore.skill === id) : DV.SKILLS[id].lvl;
    S.loadout = skillPool().sort((a, b) => rankOf(b) - rankOf(a)).slice(0, DV.LOADOUT_MAX);
    [...S.inv].forEach(it => { const c = S.equip[it.slot]; if (!c || itemPower(it) > itemPower(c)) equipItem(it.id); else salvage(it.id); });
    if (S.gold > 200) DV.SLOTS.forEach(sl => { const it = S.equip[sl]; let g = 0; while (it && g++ < 30 && it.plus < 12 && S.gold > upgradeCost(it).gold * 2 && S.shards >= upgradeCost(it).shards) tryUpgrade(it); });
    while (S.potions.hp < 5 && S.gold > shopItems()[0].price * 3) buy('hp');
    while (S.potions.mp < 3 && S.gold > shopItems()[1].price * 3) buy('mp');
    if (S.shards < 20 && S.gold > shopItems()[2].price * 4) buy('shards');
    const healer = S.cls === 'priest' || S.cls2 === 'priest';
    const roster = Object.keys(S.comps).sort((a, b) => (DV.COMPANIONS[b].cls === 'priest' && !healer) - (DV.COMPANIONS[a].cls === 'priest' && !healer) || DV.COMPANIONS[b].from - DV.COMPANIONS[a].from);
    setParty(roster.slice(0, DV.PARTY_MAX));
  }
  function fight() { let n = 0, lo = 1, ko = 0; while (!B.over && n++ < 400) { autoTurn(); lo = Math.min(lo, B.p.hp / B.p.st.hp); } B.lo = lo; B.ko = B.party.filter(u => u.hp <= 0).length; return B; }
  function field(w) { prep(); if (vitOf('hero') < .4) healParty(1); const W = DV.WORLDS[w - 1]; startEncounter(w, W.foes[Math.floor(Math.random() * 4)], stageLevel(w, 1 + Math.floor(Math.random() * 3)), Math.random() < .5, null); return fight(); }
  for (let w = 1; w <= DV.WORLDS.length; w++) {
    const W = DV.WORLDS[w - 1];
    for (let i = 0; i < 4; i++) { S.chests[w + '-' + i] = 1; S.gold += Math.round((40 + Math.random() * 40) * w); S.shards += 4; S.potions[Math.random() < .5 ? 'hp' : 'mp']++; }
    if (P.profile === 'explorer') { if (W.hidden) recruit(W.hidden); if (W.lore) readLore(w); }
    const fieldN = P.profile === 'explorer' ? 6 : 3;
    for (let i = 0; i < fieldN; i++) field(w);
    for (let s = 0; s < 5; s++) {
      let tries = 0, farm = 0, rests = 0, b;
      do {
        tries++; prep(); if (['hero', ...S.party].some(k => vitOf(k) < .7)) { healParty(1); rests++; } startBattle(w, s); b = fight();
        if (b.over !== 'win') for (let f = 0; f < 3; f++) { field(w); farm++; }
      } while (b.over !== 'win' && tries < 25);
      rows.push({ w, s, tries, farm, win: b.over === 'win', hp: +(b.p.hp / b.p.st.hp).toFixed(2), lo: +b.lo.toFixed(2), ko: b.ko, taken: Math.round(b.stats.dmgTaken / b.p.st.hp * 100) / 100, rounds: b.round, rests, lvl: S.level, stageLvl: stageLevel(w, s), party: S.party.length });
      if (b.over !== 'win') { rows.push({ stuck:true, w, s }); w = 999; break; }
    }
    checkQuest(w);
  }
  this.OUT = { rows, level:S.level, comps:Object.keys(S.comps).length };
  `, ctx);
  return ctx.OUT;
}

const combos = [];
['assassin','guardian','warrior','mage','priest'].forEach(p => ['assassin','guardian','warrior','mage','priest'].forEach(s => { if (p !== s) combos.push([p, s]); }));
const results = {};
const t0 = Date.now();
combos.forEach(([p, s], i) => {
  const runs = Array.from({ length: RUNS }, (_, k) => run(p, s, 1000 + i * 97 + k * 7919));
  results[`${p}+${s}`] = runs;
  const stuck = runs.map(r => r.rows.find(x => x.stuck)).filter(Boolean);
  const losses = runs.map(r => r.rows.filter(x => !x.stuck).reduce((a, x) => a + x.tries - 1, 0));
  console.log(`${(p + '+' + s).padEnd(18)} lv ${runs.map(r => r.level).join('/')}  losses ${losses.join('/')}  ${stuck.length ? `STUCK ${stuck.map(x => x.w + '-' + (x.s + 1)).join(', ')}` : 'finished'}`);
});
console.log(`${profile}: ${combos.length} combos in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (outFile) fs.writeFileSync(outFile, JSON.stringify(results));
