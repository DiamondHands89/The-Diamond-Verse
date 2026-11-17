// Diamondverse — app shell, dialogue, hero creation and the Story map.
const SCREENS = {};
let tab = 'world';
const TABS = [['world','World'],['story','Story'],['party','Party'],['hero','Hero'],['class','Class'],['skills','Skills'],['gear','Gear'],['shop','Bazaar']];

function render() {
  if (!S.created) return;
  const st = calcStats();
  $('#app').classList.toggle('wide', tab === 'world');
  $('#topbar').innerHTML = `
    <div style="width:38px;flex:none">${avatarSVG(S.look, S.cls, 38)}</div>
    <div class="who"><b>${esc(S.name)}</b><small class="num">Lv ${S.level} ${esc(dualTitle())}${S.job ? ' · ' + DV.JOBS[S.job].name : ''}</small></div>
    <button class="btn sm acct-btn" id="acctBtn" aria-label="Account and cloud saves">☁</button>
    <button class="btn sm daily-btn" id="dailyBtn" aria-label="Daily rewards and challenges">Daily${dailyPending() ? ' •' : ''}</button>
    <div class="stack" style="gap:2px;align-items:flex-end">${gemNum('g', S.gold)}${gemNum('d', S.dia)}</div>`;
  $('#dailyBtn').onclick = () => dailySheet(false);
  $('#acctBtn').onclick = () => Account.sheet(); if (typeof Account !== 'undefined') Account.refresh();
  $('#tabs').innerHTML = TABS.map(([id, n]) => {
    const dot = (id === 'hero' && S.attrPts) || (id === 'skills' && S.skillPts) ? ' •' : '';
    return `<button class="${tab === id ? 'on' : ''}" data-tab="${id}" aria-label="${n}"><i></i>${n}${dot}</button>`;
  }).join('');
  $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); window.scrollTo(0, 0); });
  SCREENS[tab](st);
}

// ---------- Dialogue ----------
function playDialogue(lines, done) {
  let i = 0;
  const show = () => {
    const [who, text] = lines[i], c = speakerColor(who), name = who in DV.SPEAKERS ? DV.SPEAKERS[who] : who;
    const initial = who === 'narr' ? '◇' : (name || '?')[0];
    $('#layer').innerHTML = `<div class="layer dlg" id="dlg" style="--sc:${c}">
      <div class="row" style="justify-content:flex-end;padding:12px 16px"><button class="btn sm" id="skip">Skip scene</button></div>
      <div class="scene"><div class="speaker-gem ${who}"><span>${esc(initial)}</span></div></div>
      <div class="dbox" style="--sc:${c}">
        ${name ? `<div class="nm">${esc(name)}</div>` : ''}
        <p class="${who === 'narr' ? 'narr' : ''}">${esc(text.replace(/\(([^)]*)\)/g, '$1'))}</p>
        <div class="hint num">${i + 1} / ${lines.length} · tap to continue</div>
      </div></div>`;
    $('#dlg').onclick = e => { if (e.target.id === 'skip') return; next(); };
    $('#skip').onclick = () => { $('#layer').innerHTML = ''; done && done(); };
  };
  const next = () => { i++; if (i >= lines.length) { $('#layer').innerHTML = ''; done && done(); } else show(); };
  show();
}

// ---------- Hero creation / redesign ----------
function openCreator(edit) {
  const c = { name:S.name || '', look:normLook(S.look), origin:S.origin, cls:S.cls || 'assassin' };
  const grp = (key, list) => `<div class="row" style="flex-wrap:wrap">${list.map((n, i) => `<button class="btn sm ${c.look[key] === i ? 'primary' : ''}" data-g="${key}" data-i="${i}">${n}</button>`).join('')}</div>`;
  const sw = (key, list) => `<div class="swatches">${list.map((col, i) =>
    `<button class="sw ${c.look[key] === i ? 'on' : ''}" data-k="${key}" data-i="${i}" style="background:${col}" aria-label="${key} ${i + 1}"></button>`).join('')}</div>`;
  const classCards = DV.CLASS_ORDER.map(id => { const k = DV.CLASSES[id];
    return `<button class="opt ${c.cls === id ? 'on' : ''}" data-cls="${id}" style="border-left:4px solid ${k.color}">
      <b>${k.name} <span class="muted small">· ${k.role}</span></b><span class="small muted">${k.desc}</span>
      <div class="small num" style="margin-top:4px">HP ${k.base.hp} · ATK ${k.base.atk} · MAG ${k.base.mag} · DEF ${k.base.def} · SPD ${k.base.spd}</div></button>`; }).join('');
  $('#layer').innerHTML = `<div class="layer"><div class="inner">
    <div class="eyebrow">${edit ? 'Redesign your vessel' : 'Rebirth · Choose your vessel'}</div>
    <h2>${edit ? 'Change your look' : 'Who walks into the Diamondverse?'}</h2>
    <div class="avatar-wrap" id="cprev">${avatarSVG(c.look, c.cls, 150)}</div>
    <label class="stack small"><span class="eyebrow">Name</span><input type="text" id="cname" maxlength="18" value="${esc(c.name)}" placeholder="Facetborn"></label>
    <div class="stack"><span class="eyebrow">Sex</span>${grp('sex', DV.LOOK.sex)}</div>
    <div class="stack"><span class="eyebrow">Race · cosmetic, no stat changes</span><div class="grid2">${DV.LOOK.race.map((rc, i) =>
      `<button class="opt ${c.look.race === i ? 'on' : ''}" data-race="${i}"><b>${rc.name}</b><span class="small muted">${rc.text}</span></button>`).join('')}</div></div>
    <div class="stack"><span class="eyebrow">Skin tone</span>${sw('skin', DV.LOOK.skin)}</div>
    <div class="stack"><span class="eyebrow">Physique</span>${grp('physique', DV.LOOK.physique)}</div>
    <div class="stack"><span class="eyebrow">Height</span>${grp('height', DV.LOOK.height)}</div>
    <div class="stack"><span class="eyebrow">Hair style</span>${grp('hairStyle', DV.LOOK.hairStyle)}</div>
    <div class="stack"><span class="eyebrow">Hair colour</span>${sw('hair', DV.LOOK.hair)}</div>
    <div class="stack"><span class="eyebrow">Eyes</span>${sw('eyes', DV.LOOK.eyes)}</div>
    <div class="stack"><span class="eyebrow">Outfit</span>${sw('outfit', DV.LOOK.outfit)}</div>
    ${edit ? '' : `
    <div class="stack"><span class="eyebrow">Your past life · grants starting attributes</span><div class="grid2">${DV.LOOK.origin.map(o =>
      `<button class="opt ${c.origin === o.id ? 'on' : ''}" data-or="${o.id}"><b>${o.name}</b><span class="small muted">${o.text}</span></button>`).join('')}</div></div>
    <div class="stack"><span class="eyebrow">Combat class · a second class unlocks later</span>${classCards}</div>`}
    <button class="btn primary" id="cgo" style="padding:13px">${edit ? 'Save look' : 'Begin in Prismara'}</button>
    ${edit ? '<button class="btn" id="cx">Cancel</button>' : ''}
  </div></div>`;
  const L = $('#layer');
  const refresh = () => $('#cprev').innerHTML = avatarSVG(c.look, c.cls, 150);
  L.querySelectorAll('.sw').forEach(b => b.onclick = () => {
    c.look[b.dataset.k] = +b.dataset.i;
    L.querySelectorAll(`.sw[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b)); refresh(); });
  L.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
    c.look[b.dataset.g] = +b.dataset.i; L.querySelectorAll(`[data-g="${b.dataset.g}"]`).forEach(x => x.classList.toggle('primary', x === b)); refresh(); });
  L.querySelectorAll('[data-race]').forEach(b => b.onclick = () => { c.look.race = +b.dataset.race; L.querySelectorAll('[data-race]').forEach(x => x.classList.toggle('on', x === b)); refresh(); });
  L.querySelectorAll('[data-or]').forEach(b => b.onclick = () => { c.origin = b.dataset.or; L.querySelectorAll('[data-or]').forEach(x => x.classList.toggle('on', x === b)); });
  L.querySelectorAll('[data-cls]').forEach(b => b.onclick = () => { c.cls = b.dataset.cls; L.querySelectorAll('[data-cls]').forEach(x => x.classList.toggle('on', x === b)); refresh(); });
  $('#cname').oninput = e => c.name = e.target.value.trim();
  if (edit) $('#cx').onclick = () => L.innerHTML = '';
  $('#cgo').onclick = () => {
    if (edit) { S.name = c.name || S.name; S.look = c.look; save(); L.innerHTML = ''; render(); toast('Vessel reshaped.'); return; }
    createHero(c.name, c.look, c.origin, c.cls);
    L.innerHTML = ''; tab = 'world'; render();
    toast(`${DV.CLASSES[c.cls].name} reborn. Pick a job in the Class tab.`);
  };
}

// ---------- Story map ----------
function nextObjective() {
  for (const W of DV.WORLDS) for (let s = 0; s < DV.STAGES_PER_WORLD; s++)
    if (stageOpen(W.id, s) && !S.cleared[stageKey(W.id, s)]) return { W, s };
  return null;
}
let openArc = null;
function realmCard(W) {
  const open = W.id <= S.worldsCleared + 1, safe = S.worldsCleared >= W.id, st = realmStatus(W.id);
  const chip = safe ? `<span class="chip pure">${st} · ${esc(W.bless[2])}</span>` : open ? `<span class="chip rot">${st}</span>` : '<span class="chip lock">Sealed</span>';
  if (!open) return `<section class="card world sealed row" style="--wh:${W.hue}"><div class="grow"><div class="eyebrow num">Realm ${W.id} · Lv ${stageLevel(W.id, 0)}–${stageLevel(W.id, 4)}</div><b>${esc(W.name)}</b></div>${chip}</section>`;
  let nodes = '';
  for (let s = 0; s < DV.STAGES_PER_WORLD; s++) {
    const done = !!S.cleared[stageKey(W.id, s)], o = stageOpen(W.id, s), boss = s === DV.STAGES_PER_WORLD - 1;
    if (s) nodes += `<div class="link ${done ? 'done' : ''}"></div>`;
    nodes += `<button class="node ${boss ? 'boss' : ''} ${done ? 'done' : o ? 'open' : ''}" data-w="${W.id}" data-s="${s}" ${o ? '' : 'disabled'}
      aria-label="${esc(W.name)} stage ${s + 1}"><span>${boss ? '♛' : s + 1}</span></button>`;
  }
  const q = questState(W.id), comp = W.recruit || W.hidden;
  return `<section class="card world stack" style="--wh:${W.hue}">
    <div class="row"><div class="grow"><div class="eyebrow num">Realm ${W.id} · Lv ${stageLevel(W.id, 0)}–${stageLevel(W.id, 4)}</div><h2>${esc(W.name)}</h2>
      <div class="small muted">${esc(W.sub)}</div></div>${chip}</div>
    <div class="small">${safe ? `Saved: <b>${esc(W.god.pure)}</b>. Blessing: ${blessText(W)}.` : W.god.corrupted ? `Corrupted god: <b style="color:var(--rot)">${esc(W.boss)}</b>` : `${esc(W.god.pure)} is besieged by <b style="color:var(--rot)">${esc(W.boss)}</b>`}</div>
    <div class="small muted"><b>${esc(W.people[0])}</b>: ${esc(W.people[1])} ${esc(W.custom)}</div>
    <div class="small">Side quest: <b>${esc(W.quest.title)}</b> ${q.done ? '<span class="chip pure">Done</span>' : `<span class="muted num">${q.prog}/${q.need}</span>`}
      ${W.lore ? ` · Hidden story: ${S.lore[W.id] ? `<b>${esc(W.lore.title)}</b> ✓` : '<span class="muted">undiscovered</span>'}` : ''}
      ${comp ? ` · Companion: ${compJoined(comp) ? `<b>${esc(DV.COMPANIONS[comp].name)}</b> ✓` : W.hidden ? '<span class="muted">someone is hiding here</span>' : '<span class="muted">joins when the realm is saved</span>'}` : ''}</div>
    <div class="nodes">${nodes}</div>
  </section>`;
}
SCREENS.story = () => {
  const obj = nextObjective(), cur = DV.arcOf(Math.min(DV.WORLDS.length, S.worldsCleared + 1));
  if (openArc === null) openArc = cur;
  const arcs = DV.ARCS.map((A, i) => {
    const n = i + 1, from = A.from, to = Math.min(DV.WORLDS.length, from + 9), saved = Math.max(0, Math.min(10, S.worldsCleared - from + 1));
    const reach = S.worldsCleared + 1 >= from;
    return `<section class="stack">
      <button class="arc-head ${openArc === n ? 'on' : ''}" data-arc="${n}" ${reach ? '' : 'disabled'} aria-expanded="${openArc === n}">
        <span class="eyebrow num">Arc ${n} · Realms ${from}–${to}</span><b>${esc(A.name)}</b><span class="small muted num">${reach ? `${saved}/10 saved` : 'Sealed'}</span></button>
      ${openArc === n && reach ? DV.WORLDS.slice(from - 1, to).map(realmCard).join('') : ''}</section>`;
  }).join('');
  $('#screen').innerHTML = `
    <div class="stack"><div class="eyebrow">The Diamondverse · ${DV.WORLDS.length} realms</div>
      <h2 class="title-prism">The Shattered Lattice</h2>
      <div class="card small" style="border-color:#2f4f7a">
        <div class="eyebrow" style="color:var(--facet)">Lumeria's guidance</div>
        ${obj ? `Next: <b>${esc(obj.W.name)} · ${stageName(obj.W.id, obj.s)}</b> (Lv ${stageLevel(obj.W.id, obj.s)}). Your level: <b class="num">${S.level}</b>.`
              : 'Every realm is saved. Replay any shrine for gear, or hunt for hidden companions and stories you missed.'}
        ${secondaryUnlocked() && !S.cls2 ? '<div style="margin-top:6px;color:var(--gold)">Your secondary class slot is open. Visit the Class tab.</div>' : ''}
      </div>
      <details class="card small"><summary><b>How realm travel works</b></summary>
        <p>Every realm is a standing wave in the Lattice, and its god is the note it rings at. A Rift Gate is an aperture tuned to that note: tune two gates to two gods and you can cross between realms. That is the Quorin's science.</p>
        <p>It is also faith. A god's light is the bridge itself, and no machine opens a door no god holds. A corrupted god rings out of tune, so gates beyond it fail. Saving a realm, by purifying its god or breaking the siege on a free one, steadies the note and opens the next gate.</p></details>
    </div>
    ${arcs}
    <button class="btn sm" id="replayPro" style="align-self:flex-start">Replay prologue</button>`;
  $('#screen').querySelectorAll('.node:not([disabled])').forEach(b => b.onclick = () => stageSheet(+b.dataset.w, +b.dataset.s));
  $('#screen').querySelectorAll('[data-arc]').forEach(b => b.onclick = () => { openArc = openArc === +b.dataset.arc ? 0 : +b.dataset.arc; render(); });
  $('#replayPro').onclick = () => playDialogue(DV.PROLOGUE);
};

function stageSheet(w, s) {
  const W = DV.WORLDS[w - 1], boss = s === DV.STAGES_PER_WORLD - 1, key = stageKey(w, s), clears = S.cleared[key] || 0, arc = DV.arcOf(w);
  const foes = boss ? W.boss : W.foes.slice(0, Math.min(4, s + 2)).join(', ');
  const traits = Object.keys(TRAITS).filter(t => arc >= TRAITS[t].arc).map(t => TRAITS[t].name);
  openSheet(`
    <div class="eyebrow num">${esc(W.name)} · Shrine ${s + 1} · Lv ${stageLevel(w, s)}</div>
    <h2>${stageName(w, s)}</h2>
    <div class="small"><span class="muted">${boss ? 'Boss' : 'Foes'}:</span> ${esc(foes)}</div>
    ${traits.length ? `<div class="small"><span class="muted">Foes here may be:</span> ${traits.join(', ')}</div>` : ''}
    ${boss ? `<div class="small" style="color:var(--gold)">Every third turn the boss charges Corrupted Wrath. Shield, heal or stun before it lands. Below 50% HP it enrages${arc >= 3 ? ' and summons help' : ''}.${arc >= 4 ? ' Wrath hits the whole party.' : ''}</div>` : ''}
    <div class="small"><span class="muted">Party:</span> You${S.party.map(id => ', ' + esc(DV.COMPANIONS[id].name)).join('')}. Change it in the Party tab.</div>
    <div class="small"><span class="muted">First clear:</span> ${boss ? '60' : '15'} Diamonds${boss ? ` and the blessing <b>${esc(W.bless[2])}</b> (${blessText(W)})` : ''}.
      ${clears ? `<span class="muted">Cleared ${clears}×. Replays give XP, gold and drops.</span>` : ''}</div>
    <button class="btn primary" id="fight" style="padding:12px">Enter battle</button>`, el => {
    el.querySelector('#fight').onclick = () => {
      closeSheet();
      const go = () => { if (boss && !clears) playDialogue(W.bossTalk, () => startBattleUI(w, s)); else startBattleUI(w, s); };
      if (!S.seen['w' + w]) { S.seen['w' + w] = 1; save(); playDialogue(W.intro, go); } else go();
    };
  });
}

// ---------- Daily rewards & challenges ----------
function dailyPending() {
  if (!S.created) return false;
  const d = ensureDaily();
  return !loginStatus().claimed || d.tasks.some(t => !t.claimed && t.prog >= t.n);
}
function dailySheet(onBoot) {
  const ls = loginStatus(), d = ensureDaily(), r = dailyReward();
  const days = LOGIN_REWARDS.map((R, i) => { const v = loginRewardValue(i), past = i < ls.day || (ls.claimed && i === ls.day), today = i === ls.day;
    return `<div class="lday ${past ? 'got' : ''} ${today && !ls.claimed ? 'today' : ''}"><span class="eyebrow">Day ${i + 1}</span><b class="num">${v.gold ? v.gold.toLocaleString() + ' g' : v.dia ? v.dia + ' ◆' : v.shards ? v.shards + ' shards' : v.pots + '+' + v.pots + ' potions'}</b>${v.cache ? '<small>+ gear cache</small>' : ''}</div>`; }).join('');
  openSheet(`<div class="eyebrow">Daily</div><h2>Login rewards</h2>
    <div class="small muted">Log in each day to climb the 7-day ladder. Missing a day starts it over at day 1. Streak: <b class="num">${ls.claimed ? ls.streak : ls.streak - 1}</b> day${ls.streak === 2 ? '' : 's'}.</div>
    <div class="ldays">${days}</div>
    <button class="btn gold" id="claimLogin" ${ls.claimed ? 'disabled' : ''}>${ls.claimed ? 'Claimed today. Come back tomorrow.' : `Claim day ${ls.day + 1}`}</button>
    <h2 style="margin-top:8px">Today's challenges</h2>
    <div class="small muted">Each pays ${r.gold.toLocaleString()} gold, ${r.dia} Diamonds and ${r.shards} shards. Finish all three for 25 bonus Diamonds. New challenges every day.</div>
    ${d.tasks.map((t, i) => `<div class="card row"><div class="grow"><b>${t.text.replace('{n}', t.n)}</b>${bar('xp', t.prog, t.n, 6)}<span class="small muted num">${t.prog} / ${t.n}</span></div>
      ${t.claimed ? '<span class="chip pure">Claimed</span>' : `<button class="btn sm gold" data-dclaim="${i}" ${t.prog >= t.n ? '' : 'disabled'}>Claim</button>`}</div>`).join('')}
    ${d.bonus ? '<div class="small" style="color:var(--gold)">All three done today. Bonus claimed.</div>' : ''}`, el => {
    el.querySelector('#claimLogin').onclick = () => { const g = claimLogin(); if (g) toast(`Day ${g.day} reward claimed${g.item ? `: ${g.item.name}` : ''}.`); render(); dailySheet(false); };
    el.querySelectorAll('[data-dclaim]').forEach(b => b.onclick = () => { const g = claimDaily(+b.dataset.dclaim); if (g) toast(g.bonus ? 'Challenge done! All three complete: +25 Diamonds.' : 'Challenge reward claimed.'); render(); dailySheet(false); });
  });
}
