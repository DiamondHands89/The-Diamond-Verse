// Diamondverse — companions & party, side quests, landmarks, hidden stories, daily challenges, login rewards.
// No DOM code. Depends on engine.js.

// ---------- Companions ----------
const compJoined = id => !!S.comps[id];
function bondLevel(id) { const w = (S.comps[id] || {}).wins || 0; return DV.BOND_WINS.filter(n => w >= n).length; }
function recruit(id) {
  if (compJoined(id)) return false;
  S.comps[id] = { wins:0, at: Date.now() };
  if (S.party.length < DV.PARTY_MAX) S.party.push(id);
  save(); return true;
}
// Story companions join when their realm is saved. Called after a boss win and on load (old saves catch up).
function syncRecruits() {
  const got = [];
  DV.WORLDS.slice(0, S.worldsCleared).forEach(W => { if (W.recruit && recruit(W.recruit)) got.push(W.recruit); });
  return got;
}
function setParty(ids) { S.party = ids.filter(compJoined).slice(0, DV.PARTY_MAX); save(); }
function toggleParty(id) {
  if (S.party.includes(id)) S.party = S.party.filter(x => x !== id);
  else if (S.party.length < DV.PARTY_MAX && compJoined(id)) S.party.push(id);
  else return false;
  save(); return true;
}
// Hero gear contribution, shared at 60% with companions (their main stat receives the hero's main-stat gear).
function gearStats() {
  const o = {}, m = mods();
  DV.SLOTS.forEach(s => { const it = S.equip[s]; if (!it) return;
    const g = (s === 'helm' || s === 'armor') ? 1 + M(m, 'armorGear') : 1, is = itemStats(it);
    for (const k in is) o[k] = (o[k] || 0) + is[k] * g; });
  return o;
}
function compStats(id) {
  const C = DV.COMPANIONS[id], c = DV.CLASSES[C.cls], L = S.level - 1, st = {};
  for (const k in c.base) st[k] = c.base[k] + c.grow[k] * L;
  const g = gearStats(), heroMain = mainStat(), share = .6;
  for (const k in g) { const key = k === heroMain ? c.main : k; st[key] = (st[key] || 0) + g[k] * share; }
  const bond = bondLevel(id), bmul = 1 + [0, .05, .05, .15][bond];
  const m = mods(), all = 1 + M(m, 'all') * .5;   // companions feel half of blessings/job "all" bonuses
  for (const k in st) st[k] = st[k] * (C.mul[k] || 1) * bmul * all;
  st.crit = clamp(st.crit, 0, 60);
  for (const k in st) st[k] = k === 'crit' ? Math.round(st[k] * 10) / 10 : Math.round(st[k]);
  return st;
}
// Companion skill list: class skills up to the hero's level (best 3 plus signature).
function compSkills(id) {
  const C = DV.COMPANIONS[id];
  const cls = Object.keys(DV.SKILLS).filter(k => DV.SKILLS[k].cls === C.cls && DV.SKILLS[k].lvl <= S.level);
  return ['sig', ...cls.slice(-4)];
}
const compRank = id => Math.min(5, 1 + bondLevel(id) + Math.floor(S.level / 60));
function addBondWins() {
  const ups = [];
  S.party.forEach(id => { const before = bondLevel(id); S.comps[id].wins++; const after = bondLevel(id); if (after > before) ups.push({ id, lv:after }); });
  return ups;
}

// ---------- Landmarks, quests, hidden stories ----------
const markKey = (w, i) => `${w}-${i}`;
function visitMark(w, i) {
  const k = markKey(w, i); if (S.marks[k]) return false;
  S.marks[k] = 1; track('mark'); save(); return true;
}
function questState(w) {
  const Q = DV.WORLDS[w - 1].quest, [type, n] = Q.goal;
  let prog, need;
  if (type === 'foes') { prog = S.qprog[w] || 0; need = n; }
  else if (type === 'mark') { prog = S.marks[markKey(w, n)] ? 1 : 0; need = 1; }
  else { prog = [0, 1, 2, 3].filter(i => S.chests[`${w}-${i}`]).length; need = 4; }
  return { Q, type, prog: Math.min(prog, need), need, done: !!S.qdone[w] };
}
function questGoalText(w) {
  const { Q, type } = questState(w), W = DV.WORLDS[w - 1];
  return type === 'foes' ? `Defeat ${Q.goal[1]} roaming foes in ${W.name}` : type === 'mark' ? `Visit ${W.marks[Q.goal[1]]}` : `Open all 4 chests in ${W.name}`;
}
// Returns the finished quest (and grants its reward) when its goal has just been met.
function checkQuest(w) {
  const q = questState(w);
  if (q.done || q.prog < q.need) return null;
  const r = q.Q.reward; S.qdone[w] = 1;
  S.gold += r.gold || 0; S.lifetimeGold += r.gold || 0; S.dia += r.dia || 0; S.shards += r.shards || 0;
  save(); return q.Q;
}
function readLore(w) {
  const L = DV.WORLDS[w - 1].lore; if (!L || S.lore[w]) return null;
  S.lore[w] = 1;
  if (!S.skills[L.skill]) { S.skills[L.skill] = 1; if (S.loadout.length < DV.LOADOUT_MAX) S.loadout.push(L.skill); }
  save(); return L;
}

// ---------- Daily challenges & login rewards ----------
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const DAILY_POOL = [
  { id:'foe', text:'Defeat {n} foes', n:15 },
  { id:'field', text:'Win {n} open-world fights', n:5 },
  { id:'stage', text:'Win {n} shrine battles', n:3 },
  { id:'skill', text:'Use {n} skills in battle', n:25 },
  { id:'upgrade', text:'Attempt {n} gear upgrades', n:2 },
  { id:'potion', text:'Use {n} potions', n:2 },
  { id:'bond', text:'Win {n} battles with a full party', n:5 },
  { id:'win', text:'Win {n} battles', n:8 }
];
function hashStr32(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function ensureDaily() {
  const day = dayKey();
  if (S.daily && S.daily.day === day) return S.daily;
  let h = hashStr32(day + S.playerId); const pool = [...DAILY_POOL], tasks = [];
  while (tasks.length < 3) { const i = h % pool.length; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; tasks.push({ ...pool.splice(i, 1)[0], prog:0, claimed:false }); }
  S.daily = { day, tasks, bonus:false };
  return S.daily;
}
function dailyReward() { const t = topTier(); return { gold: 120 * t, dia: 10, shards: 3 + Math.ceil(t / 5) }; }
function track(ev, n = 1) {
  if (!S || !S.created) return;
  const d = ensureDaily();
  d.tasks.forEach(t => { if (t.id === ev && !t.claimed) t.prog = Math.min(t.n, t.prog + n); });
}
function claimDaily(i) {
  const d = ensureDaily(), t = d.tasks[i];
  if (!t || t.claimed || t.prog < t.n) return null;
  t.claimed = true; const r = dailyReward();
  S.gold += r.gold; S.lifetimeGold += r.gold; S.dia += r.dia; S.shards += r.shards;
  let bonus = false;
  if (!d.bonus && d.tasks.every(x => x.claimed)) { d.bonus = true; S.dia += 25; bonus = true; }
  save(); return { ...r, bonus };
}
// 7-day login cycle. Missing a day restarts the cycle at day 1.
const LOGIN_REWARDS = [
  { text:'Gold', gold:250 }, { text:'Upgrade shards', shards:12 }, { text:'Diamonds', dia:20 }, { text:'Potions', pots:3 },
  { text:'Gold', gold:700 }, { text:'Diamonds', dia:40 }, { text:'Diamonds + gear cache', dia:80, cache:true }
];
function loginStatus() {
  const today = dayKey(), y = new Date(); y.setDate(y.getDate() - 1);
  const claimed = S.login.last === today;
  const streak = claimed ? S.login.streak : (S.login.last === dayKey(y) ? S.login.streak + 1 : 1);
  return { claimed, streak, day: (streak - 1) % 7 };
}
function loginRewardValue(i) {
  const R = LOGIN_REWARDS[i], t = topTier();
  return { ...R, gold: R.gold ? R.gold * t : 0 };
}
function claimLogin() {
  const st = loginStatus(); if (st.claimed) return null;
  const R = loginRewardValue(st.day);
  S.gold += R.gold || 0; S.lifetimeGold += R.gold || 0; S.dia += R.dia || 0; S.shards += R.shards || 0;
  if (R.pots) { S.potions.hp += R.pots; S.potions.mp += R.pots; }
  let item = null;
  if (R.cache) { item = makeItem(pick(DV.SLOTS), topTier(), rollRarity([0, 50, 35, 13, 2], 0)); S.inv.push(item); }
  S.login = { last: dayKey(), streak: st.streak };
  save(); return { ...R, item, day: st.day + 1 };
}
