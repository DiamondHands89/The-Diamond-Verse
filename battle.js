// Diamondverse — battle screen (party), results, and boot.
function startBattleUI(w, s) { startBattle(w, s); openBattle(); }
function openBattle() { renderBattle(); if (S.settings.auto) runAuto(); }

function foeChips(e) {
  const c = e.traits.map(t => `<span class="chip" style="color:#ffb3c4">${TRAITS[t].name}</span>`);
  if (e.stun) c.push('<span class="chip">Stunned</span>');
  if (e.dots.length) c.push(`<span class="chip" style="color:#c08bff">DoT ×${e.dots.length}</span>`);
  if (e.debuff) c.push('<span class="chip">DEF down</span>');
  if (e.charging) c.push('<span class="chip" style="color:var(--gold)">Charging</span>');
  if (e.enraged) c.push('<span class="chip rot">Enraged</span>');
  return c.join(' ');
}
function unitChips(u) {
  const c = [];
  if (u.shield) c.push(`<span class="chip" style="color:var(--facet)">Shield ${u.shield}</span>`);
  if (u.taunt) c.push('<span class="chip" style="color:var(--gold)">Taunting</span>');
  if (u.dots.length) c.push('<span class="chip" style="color:#c08bff">Poisoned</span>');
  u.buffs.forEach(b => c.push(`<span class="chip" style="color:var(--ok)">${DV.STAT_LABEL[b.stat]} +${Math.round(b.amt * 100)}%</span>`));
  return c.join(' ');
}
function unitRow(u, i) {
  const cls = DV.CLASSES[u.cls], down = u.hp <= 0;
  const face = u.isHero ? avatarSVG(S.look, S.cls, 44) : compBadge(u.key, 40);
  return `<div class="unit ${down ? 'down' : ''}" id="u${i}">
    <div style="flex:none">${face}</div>
    <div class="grow stack" style="gap:3px">
      <div class="row small"><b class="grow">${esc(u.isHero ? S.name : u.name)}</b><span class="muted" style="color:${cls.color}">${cls.name}</span><span class="num">${down ? 'Down' : `${u.hp} / ${u.st.hp}`}</span></div>
      ${bar('hp', u.hp, u.st.hp, u.isHero ? 8 : 6)}${bar('mp', u.mp, u.st.mp, 4)}
      ${unitChips(u) ? `<div>${unitChips(u)}</div>` : ''}
    </div></div>`;
}
let autoTimer = null;
function stopAuto() { clearTimeout(autoTimer); autoTimer = null; }
function renderBattle() {
  const W = DV.WORLDS[B.w - 1], p = B.p;
  const foes = B.enemies.map((e, i) => `<button class="foe ${e.boss ? 'boss' : ''} ${e.tier > 1 ? 'ft' + e.tier : ''} ${i === B.target && e.hp > 0 ? 'tgt' : ''} ${e.hp <= 0 ? 'dead' : ''}" data-t="${i}" id="e${i}" ${e.hp <= 0 ? 'disabled' : ''} aria-label="Target ${esc(e.name)}">
      ${enemySVG(e.base || e.name, W.hue, e.boss, e.boss ? 84 : e.tier >= 3 ? 70 : 52, e.tier)}
      <span class="nm">${esc(e.name)}</span><span class="small muted num">${e.tier > 1 ? `<span class="tier t${e.tier}">${DV.FOE_TIERS[e.tier - 1].stars}</span> ` : ''}Lv ${e.lvl}</span>
      ${bar('hp', e.hp, e.max, 6)}<span class="small num">${e.hp} / ${e.max}</span><div>${foeChips(e)}</div></button>`).join('');
  const log = B.log.map(([t, m]) => `<div class="${t === 'foe' ? 'foe-l' : t}">${esc(m)}</div>`).join('');
  const skillBtn = id => {
    const k = getSkill(p, id), cost = skillCost(p, k), cd = p.cds[id] || 0, blocked = skillBlocked(p, id);
    const col = id === 'basic' ? 'var(--line)' : k.hidden ? 'var(--gold)' : DV.CLASSES[k.cls].color;
    return `<button class="act cls-main" style="--cc:${col}" data-sk="${id}" ${B.over || blocked || autoTimer ? 'disabled' : ''}>
      <b>${k.name}</b><small class="num">${cd > 0 ? `Ready in ${cd}` : cost ? `${cost} MP` : 'Free'}${S.skills[id] ? ' · R' + S.skills[id] : ''}</small></button>`;
  };
  const potLeft = B.potMax - B.potUsed;
  const title = B.field ? (B.field.tier > 1 ? `${DV.FOE_TIERS[B.field.tier - 1].name} encounter` : 'Wild encounter') : stageName(B.w, B.s);
  const actions = B.over ? resultHTML() : `<div class="actions">
      ${skillBtn('basic')}${S.loadout.filter(id => DV.SKILLS[id]).map(skillBtn).join('')}
      <button class="act" data-pot="hp" ${S.potions.hp && potLeft && !autoTimer ? '' : 'disabled'}><b>Facet Tonic</b><small class="num">${S.potions.hp} owned · ${potLeft} uses</small></button>
      <button class="act" data-pot="mp" ${S.potions.mp && potLeft && !autoTimer ? '' : 'disabled'}><b>Mana Shard</b><small class="num">${S.potions.mp} owned</small></button>
    </div>`;
  $('#layer').innerHTML = `<div class="layer" style="background:radial-gradient(ellipse at 50% 0,${W.hue}22,var(--void) 60%)"><div class="inner">
    <div class="row"><div class="grow"><div class="eyebrow num">${esc(W.name)} · ${title} · Round ${B.round}</div></div>
      ${B.over ? '' : `<button class="btn sm ${autoTimer ? 'primary' : ''}" id="auto" aria-pressed="${!!autoTimer}">${autoTimer ? 'Auto: on' : 'Auto'}</button><button class="btn sm" id="flee">Retreat</button>`}</div>
    <div class="foes">${foes}</div>
    <div class="log blog" id="blog" aria-live="polite">${log}</div>
    <div class="party">${B.party.map(unitRow).join('')}</div>
    ${actions}
  </div></div>`;
  const L = $('#layer'), bl = $('#blog'); bl.scrollTop = bl.scrollHeight;
  L.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B.target = +b.dataset.t; renderBattle(); });
  L.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { const err = useSkill(b.dataset.sk); if (err) toast(err); renderBattle(); });
  L.querySelectorAll('[data-pot]').forEach(b => b.onclick = () => { const err = usePotion(b.dataset.pot); if (err) toast(err); renderBattle(); });
  const au = $('#auto'); if (au) au.onclick = () => { if (autoTimer) { stopAuto(); S.settings.auto = false; } else { S.settings.auto = true; runAuto(); } save(); renderBattle(); };
  const fl = $('#flee'); if (fl) fl.onclick = () => { stopAuto(); saveVitals('flee'); const f = B.field, w = B.w; B = null; L.innerHTML = ''; battleClosed(f, 'flee', w); render(); toast('You retreat with your wounds. No rewards this time.'); };
  bindResult();
  playFx();
}
function runAuto() {
  stopAuto();
  const step = () => { if (!B || B.over) { stopAuto(); if (B) renderBattle(); return; } autoTurn(); renderBattle(); autoTimer = setTimeout(step, 700); };
  autoTimer = setTimeout(step, 250);
}
function playFx() {
  B.fx.forEach((f, i) => setTimeout(() => {
    const el = document.getElementById(f.to); if (!el) return;
    const s = document.createElement('span');
    s.className = 'float' + (f.crit ? ' crit' : '') + (f.heal ? ' heal' : '') + (f.dot ? ' dot' : '');
    s.textContent = f.miss ? 'Dodge' : (f.heal ? '+' : '−') + f.v + (f.crit ? '!' : '');
    el.appendChild(s); setTimeout(() => s.remove(), 950);
    if (!f.heal && !f.miss && !f.dot) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }, i * 110));
  B.fx = [];
}
function resultHTML() {
  if (B.over === 'lose') return `<div class="card stack" style="border-color:var(--rot)"><h2 style="color:var(--rot)">Defeated</h2>
    <div class="small">Your companions carry you back to ${esc(townInfo(B.w).town)}. You wake with 25% HP. Rest inside the town barrier to recover, then try a different party, spend your points, upgrade gear, or train against roaming foes.</div>
    <button class="btn primary" id="leave">Wake in town</button></div>`;
  const r = B.reward, W = DV.WORLDS[B.w - 1];
  return `<div class="card stack" style="border-color:var(--facet)"><h2 class="title-prism">Victory</h2>
    <div class="row small" style="flex-wrap:wrap"><span class="chip num">+${r.xp} XP</span><span class="chip num" style="color:var(--gold)">+${r.gold} gold</span>${r.dia ? `<span class="chip num">+${r.dia} Diamonds</span>` : ''}</div>
    ${r.ups.length ? `<div class="small" style="color:var(--gold)">Level up! You are now Lv ${S.level}. +${r.ups.length * 3} attribute points, +${r.ups.length} skill point${r.ups.length > 1 ? 's' : ''}.</div>` : ''}
    ${r.fresh.length ? `<div class="small">New skill: <b>${r.fresh.map(id => DV.SKILLS[id].name).join(', ')}</b></div>` : ''}
    ${r.found.length ? `<div class="small">${DV.JOBS[S.job].name} find: <b>${r.found.join(', ')}</b></div>` : ''}
    ${r.jobUp ? `<div class="small" style="color:var(--gold)">${r.jobUp.mastered ? `${DV.JOBS[r.jobUp.job].name} Mastered! Permanent bonus: ${DV.JOBS[r.jobUp.job].mastery.text}.` : `${DV.JOBS[r.jobUp.job].name} reached job Lv ${r.jobUp.lv}.`}</div>` : ''}
    ${r.bondUps.map(b => `<div class="small" style="color:var(--ok)">Bond with ${DV.COMPANIONS[b.id].name} deepened to ${b.lv}. A new chapter of their story is open in the Party tab.</div>`).join('')}
    ${r.quest ? `<div class="small" style="color:var(--gold)">Side quest complete: <b>${esc(r.quest.title)}</b>.</div>` : ''}
    ${r.bounty ? `<div class="small" style="color:var(--gold)">Bounty done. Return to ${esc(r.bounty.giver)} in ${esc(townInfo(B.w).town)} for your reward.</div>` : ''}
    ${r.tier > 1 ? `<div class="small"><span class="tier t${r.tier}">${DV.FOE_TIERS[r.tier - 1].stars} ${DV.FOE_TIERS[r.tier - 1].name}</span> foe: ${DV.FOE_TIERS[r.tier - 1].xp}× XP${r.firstSlay ? ' · first defeat bonus Diamonds' : ''}.</div>` : ''}
    <div class="small muted num">Carried out of battle: ${B.party.map(u => `${u.isHero ? 'You' : esc(u.name)} ${Math.round(vitOf(u.key) * 100)}% HP, ${Math.round(mpOf(u.key) * 100)}% MP`).join(' · ')}</div>
    ${r.drops.map(d => `<div class="small">Found: <b style="color:${DV.RARITY[d.rarity].color}">${DV.RARITY[d.rarity].name} ${esc(d.name)}</b></div>`).join('')}
    ${r.worldDone ? `<div class="small" style="color:var(--ok)">${esc(W.god.pure)} is ${W.god.corrupted ? 'free of the Rot' : 'safe'}. Blessing: ${esc(W.bless[2])} (${blessText(W)}).</div>` : ''}
    <button class="btn primary" id="cont">Continue</button></div>`;
}
function bindResult() {
  const c = $('#cont'), rt = $('#retry'), lv = $('#leave');
  const close = () => { $('#layer').innerHTML = ''; render(); };
  if (rt) rt.onclick = () => { B.again(); if (S.settings.auto) runAuto(); renderBattle(); };
  if (lv) lv.onclick = () => { const f = B.field, w = B.w; B = null; battleClosed(f, 'lose', w); close(); };
  if (c) c.onclick = () => {
    const r = B.reward, W = DV.WORLDS[B.w - 1], f = B.field, w = B.w; B = null; battleClosed(f, 'win', w);
    if (r.worldDone) playDialogue(W.after, () => {
      render();
      r.recruited.forEach(id => toast(`${DV.COMPANIONS[id].name} joined your party!`));
      if (!r.recruited.length) toast(`Blessing gained: ${W.bless[2]}.`);
    });
    else close();
  };
}

// Lets the open world react when a battle ends (remove a beaten foe, give a grace period after a loss).
function battleClosed(field, outcome, w) { stopAuto(); if (typeof Realm !== 'undefined') Realm.afterBattle(field, outcome, w); }

// ---------- Boot ----------
function boot(saved) {
  S = migrate(saved || load() || newState());
  applyEntitlements();
  if (!S.created) {
    $('#topbar').innerHTML = ''; $('#tabs').innerHTML = ''; $('#screen').innerHTML = '';
    playDialogue(DV.PROLOGUE, () => openCreator(false));
    return;
  }
  syncRecruits(); ensureDaily(); save();
  render();
  if (!loginStatus().claimed) dailySheet(true);
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(d => boot(d && d.S)) : boot(window.claude?.hot?.data?.S);
