// Diamondverse — battle screen and boot.
function startBattleUI(w, s) { startBattle(w, s); renderBattle(); }

function foeChips(e) {
  const c = [];
  if (e.stun) c.push('<span class="chip">Stunned</span>');
  if (e.dots.length) c.push(`<span class="chip" style="color:#c08bff">DoT ×${e.dots.length}</span>`);
  if (e.debuff) c.push('<span class="chip">DEF down</span>');
  if (e.charging) c.push('<span class="chip" style="color:var(--gold)">Charging</span>');
  if (e.enraged) c.push('<span class="chip rot">Enraged</span>');
  return c.join(' ');
}
function renderBattle() {
  const W = DV.WORLDS[B.w - 1], p = B.p, cc = DV.CLASSES[S.cls].color;
  const foes = B.enemies.map((e, i) => `<button class="foe ${e.boss ? 'boss' : ''} ${i === B.target && e.hp > 0 ? 'tgt' : ''} ${e.hp <= 0 ? 'dead' : ''}" data-t="${i}" id="e${i}" ${e.hp <= 0 ? 'disabled' : ''} aria-label="Target ${esc(e.name)}">
      ${enemySVG(e.name, W.hue, e.boss, e.boss ? 92 : 58)}
      <span class="nm">${esc(e.name)}</span><span class="small muted num">Lv ${e.lvl}</span>
      ${bar('hp', e.hp, e.max, 6)}<span class="small num">${e.hp} / ${e.max}</span><div>${foeChips(e)}</div></button>`).join('');
  const log = B.log.slice(-4).map(([t, m]) => `<div class="${t === 'foe' ? 'foe-l' : t}">${esc(m)}</div>`).join('');
  const skillBtn = id => {
    const k = id === 'basic' ? { name:'Attack', mp:0 } : DV.SKILLS[id], cost = Math.round(k.mp * p.mpCost), cd = p.cds[id] || 0;
    const dis = B.over || cd > 0 || p.mp < cost;
    return `<button class="act ${id === 'basic' ? '' : 'cls-main'}" style="--cc:${id === 'basic' ? 'var(--line)' : DV.CLASSES[k.cls].color}" data-sk="${id}" ${dis ? 'disabled' : ''}>
      <b>${k.name}</b><small class="num">${cd > 0 ? `Ready in ${cd}` : cost ? `${cost} MP` : 'Free'}${S.skills[id] ? ' · R' + S.skills[id] : ''}</small></button>`;
  };
  const potLeft = B.potMax - B.potUsed;
  const actions = B.over ? resultHTML() : `<div class="actions">
      ${skillBtn('basic')}${S.loadout.map(skillBtn).join('')}
      <button class="act" data-pot="hp" ${S.potions.hp && potLeft ? '' : 'disabled'}><b>Facet Tonic</b><small class="num">${S.potions.hp} owned · ${potLeft} uses</small></button>
      <button class="act" data-pot="mp" ${S.potions.mp && potLeft ? '' : 'disabled'}><b>Mana Shard</b><small class="num">${S.potions.mp} owned</small></button>
    </div>`;
  $('#layer').innerHTML = `<div class="layer" style="background:radial-gradient(ellipse at 50% 0,${W.hue}22,var(--void) 60%)"><div class="inner">
    <div class="row"><div class="grow"><div class="eyebrow num">${W.name} · ${B.field ? 'Wild encounter' : B.boss ? 'God avatar' : DV.STAGE_NAMES[B.s]} · Round ${B.round}</div></div>
      ${B.over ? '' : '<button class="btn sm" id="flee">Retreat</button>'}</div>
    <div class="foes">${foes}</div>
    <div class="log" aria-live="polite">${log}</div>
    <div class="hero-panel" id="pp" style="position:relative">
      <div style="flex:none">${avatarSVG(S.look, S.cls, 58)}</div>
      <div class="grow stack" style="gap:5px">
        <div class="row small"><b class="grow">${esc(S.name)}</b><span class="num">${p.hp} / ${p.st.hp} HP</span></div>${bar('hp', p.hp, p.st.hp)}
        <div class="row small"><span class="grow muted">Mana</span><span class="num">${p.mp} / ${p.st.mp} MP</span></div>${bar('mp', p.mp, p.st.mp, 6)}
        <div>${p.shield ? `<span class="chip" style="color:var(--facet)">Shield ${p.shield}</span> ` : ''}${p.buffs.map(b => `<span class="chip" style="color:var(--ok)">${DV.STAT_LABEL[b.stat]} +${Math.round(b.amt * 100)}% · ${b.turns}t</span>`).join(' ')}</div>
      </div></div>
    ${actions}
  </div></div>`;
  const L = $('#layer');
  L.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B.target = +b.dataset.t; renderBattle(); });
  L.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { const err = useSkill(b.dataset.sk); if (err) toast(err); renderBattle(); });
  L.querySelectorAll('[data-pot]').forEach(b => b.onclick = () => { const err = usePotion(b.dataset.pot); if (err) toast(err); renderBattle(); });
  const fl = $('#flee'); if (fl) fl.onclick = () => { const f = B.field; B = null; L.innerHTML = ''; battleClosed(f, 'flee'); render(); toast('You retreat. No rewards this time.'); };
  bindResult();
  playFx();
}
function playFx() {
  B.fx.forEach((f, i) => setTimeout(() => {
    const el = document.getElementById(f.to === 'p' ? 'pp' : f.to); if (!el) return;
    const s = document.createElement('span');
    s.className = 'float' + (f.crit ? ' crit' : '') + (f.heal ? ' heal' : '') + (f.dot ? ' dot' : '');
    s.textContent = f.miss ? 'Dodge' : (f.heal ? '+' : '−') + f.v + (f.crit ? '!' : '');
    el.appendChild(s); setTimeout(() => s.remove(), 950);
    if (!f.heal && !f.miss && !f.dot) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }, i * 130));
  B.fx = [];
}
function resultHTML() {
  if (B.over === 'lose') return `<div class="card stack" style="border-color:var(--rot)"><h2 style="color:var(--rot)">Defeated</h2>
    <div class="small">The Rot pushes you back. Spend attribute and skill points, upgrade gear, or replay earlier stages to grow stronger.</div>
    <div class="row"><button class="btn primary grow" id="retry">Try again</button><button class="btn" id="leave">Return to map</button></div></div>`;
  const r = B.reward;
  return `<div class="card stack" style="border-color:var(--facet)"><h2 class="title-prism">Victory</h2>
    <div class="row small" style="flex-wrap:wrap"><span class="chip num">+${r.xp} XP</span><span class="chip num" style="color:var(--gold)">+${r.gold} gold</span>${r.dia ? `<span class="chip num">+${r.dia} Diamonds</span>` : ''}</div>
    ${r.ups.length ? `<div class="small" style="color:var(--gold)">Level up! You are now Lv ${S.level}. +${r.ups.length * 3} attribute points, +${r.ups.length} skill point${r.ups.length > 1 ? 's' : ''}.</div>` : ''}
    ${r.fresh.length ? `<div class="small">New skill: <b>${r.fresh.map(id => DV.SKILLS[id].name).join(', ')}</b></div>` : ''}
    ${r.found.length ? `<div class="small">${DV.JOBS[S.job].name} find: <b>${r.found.join(', ')}</b></div>` : ''}
    ${r.jxp ? `<div class="small muted num">+${r.jxp} ${DV.JOBS[S.job].name} job XP</div>` : ''}
    ${r.jobUp ? `<div class="small" style="color:var(--gold)">${r.jobUp.mastered ? `${DV.JOBS[r.jobUp.job].name} Mastered! Permanent bonus: ${DV.JOBS[r.jobUp.job].mastery.text}.` : `${DV.JOBS[r.jobUp.job].name} reached job Lv ${r.jobUp.lv}.`}</div>` : ''}
    ${r.drops.map(d => `<div class="small">Found: <b style="color:${DV.RARITY[d.rarity].color}">${DV.RARITY[d.rarity].name} ${esc(d.name)}</b></div>`).join('')}
    ${r.worldDone ? `<div class="small" style="color:var(--ok)">${DV.WORLDS[B.w - 1].godPure} is free of the Rot.</div>` : ''}
    <button class="btn primary" id="cont">Continue</button></div>`;
}
function bindResult() {
  const c = $('#cont'), rt = $('#retry'), lv = $('#leave');
  const close = () => { $('#layer').innerHTML = ''; render(); };
  if (rt) rt.onclick = () => { B.again(); renderBattle(); };
  if (lv) lv.onclick = () => { const f = B.field; B = null; battleClosed(f, 'lose'); close(); };
  if (c) c.onclick = () => {
    const r = B.reward, W = DV.WORLDS[B.w - 1], f = B.field; B = null; battleClosed(f, 'win');
    if (r.worldDone) playDialogue(W.after, () => { render(); toast(`Blessing gained: ${W.blessing.name} (${W.blessing.text}).`); });
    else close();
  };
}

// Lets the open world react when a battle ends (remove a beaten foe, give a grace period after a loss).
function battleClosed(field, outcome) { if (typeof Realm !== 'undefined') Realm.afterBattle(field, outcome); }

// ---------- Boot ----------
function boot(saved) {
  S = migrate(saved || load() || newState());
  applyEntitlements();
  if (!S.created) {
    $('#topbar').innerHTML = ''; $('#tabs').innerHTML = ''; $('#screen').innerHTML = '';
    playDialogue(DV.PROLOGUE, () => openCreator(false));
  } else render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(d => boot(d && d.S)) : boot(window.claude?.hot?.data?.S);
