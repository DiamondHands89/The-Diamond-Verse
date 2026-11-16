// Diamondverse — app shell, dialogue, hero creation and the Story map.
const SCREENS = {};
let tab = 'world';
const TABS = [['world','World'],['story','Story'],['hero','Hero'],['class','Class'],['skills','Skills'],['gear','Gear'],['shop','Bazaar']];

function render() {
  if (!S.created) return;
  const st = calcStats();
  $('#app').classList.toggle('wide', tab === 'world');
  $('#topbar').innerHTML = `
    <div style="width:38px;flex:none">${avatarSVG(S.look, S.cls, 38)}</div>
    <div class="who"><b>${esc(S.name)}</b><small class="num">Lv ${S.level} ${esc(dualTitle())}${S.job ? ' · ' + DV.JOBS[S.job].name : ''}</small></div>
    ${gemNum('g', S.gold)} ${gemNum('d', S.dia)}`;
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
    const [who, text] = lines[i], c = SPEAKER_COLOR[who] || '#7ef2ff', name = DV.SPEAKERS[who];
    const initial = who === 'narr' ? '◇' : (name || '?')[0];
    $('#layer').innerHTML = `<div class="layer dlg" id="dlg" style="--sc:${c}">
      <div class="row" style="justify-content:flex-end;padding:12px 16px"><button class="btn sm" id="skip">Skip scene</button></div>
      <div class="scene"><div class="speaker-gem ${who}"><span>${esc(initial)}</span></div></div>
      <div class="dbox" style="--sc:${c}">
        ${name ? `<div class="nm">${esc(name)}</div>` : ''}
        <p class="${who === 'narr' ? 'narr' : ''}">${esc(text)}</p>
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
  const c = { name:S.name || '', look:{ ...S.look }, origin:S.origin, cls:S.cls || 'assassin' };
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
    <div class="stack"><span class="eyebrow">Skin</span>${sw('skin', DV.LOOK.skin)}</div>
    <div class="stack"><span class="eyebrow">Hair colour</span>${sw('hair', DV.LOOK.hair)}</div>
    <div class="stack"><span class="eyebrow">Hair style</span><div class="row" style="flex-wrap:wrap">${DV.LOOK.hairStyle.map((n, i) =>
      `<button class="btn sm ${c.look.hairStyle === i ? 'primary' : ''}" data-hs="${i}">${n}</button>`).join('')}</div></div>
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
  L.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => {
    c.look.hairStyle = +b.dataset.hs; L.querySelectorAll('[data-hs]').forEach(x => x.classList.toggle('primary', x === b)); refresh(); });
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
SCREENS.story = () => {
  const obj = nextObjective();
  const worlds = DV.WORLDS.map(W => {
    const open = W.id <= S.worldsCleared + 1, pure = S.worldsCleared >= W.id;
    const status = pure ? `<span class="chip pure">Purified · ${W.blessing.name}</span>` : open ? '<span class="chip rot">Corrupted</span>' : '<span class="chip lock">Sealed</span>';
    let nodes = '';
    for (let s = 0; s < DV.STAGES_PER_WORLD; s++) {
      const done = !!S.cleared[stageKey(W.id, s)], o = open && stageOpen(W.id, s), boss = s === DV.STAGES_PER_WORLD - 1;
      if (s) nodes += `<div class="link ${done ? 'done' : ''}"></div>`;
      nodes += `<button class="node ${boss ? 'boss' : ''} ${done ? 'done' : o ? 'open' : ''}" data-w="${W.id}" data-s="${s}" ${o ? '' : 'disabled'}
        aria-label="${W.name} stage ${s + 1}"><span>${boss ? '♛' : s + 1}</span></button>`;
    }
    return `<section class="card world stack ${open ? '' : 'sealed'}" style="--wh:${W.hue}">
      <div class="row"><div class="grow"><div class="eyebrow num">World ${W.id} · Lv ${stageLevel(W.id, 0)}–${stageLevel(W.id, 4)}</div><h2>${W.name}</h2>
        <div class="small muted">${W.sub}</div></div></div>
      <div class="small">${pure ? `Purified: <b>${W.godPure}</b>. Blessing: ${W.blessing.text}.` : open ? `Corrupted god: <b style="color:var(--rot)">${W.god}</b>` : `Purify ${DV.WORLDS[W.id - 2].name} to open the portal.`}</div>
      <div>${status}</div>
      ${open ? `<div class="nodes">${nodes}</div>` : ''}
    </section>`;
  }).join('');
  $('#screen').innerHTML = `
    <div class="stack"><div class="eyebrow">Season One · The Shattered Heart</div>
      <h2 class="title-prism">The Diamondverse</h2>
      <div class="card small" style="border-color:#2f4f7a">
        <div class="eyebrow" style="color:var(--facet)">Lumeria's guidance</div>
        ${obj ? `Next: <b>${obj.W.name} · ${DV.STAGE_NAMES[obj.s]}</b> (Lv ${stageLevel(obj.W.id, obj.s)}). Your power: <b class="num">${heroPower().toLocaleString()}</b>.`
              : 'Every corrupted god is purified. Replay any stage to farm gear and Diamonds while new worlds form beyond the Fracture.'}
        ${secondaryUnlocked() && !S.cls2 ? '<div style="margin-top:6px;color:var(--gold)">Your secondary class slot is open. Visit the Class tab.</div>' : ''}
      </div></div>
    ${worlds}
    <button class="btn sm" id="replayPro" style="align-self:flex-start">Replay prologue</button>`;
  $('#screen').querySelectorAll('.node:not([disabled])').forEach(b => b.onclick = () => stageSheet(+b.dataset.w, +b.dataset.s));
  $('#replayPro').onclick = () => playDialogue(DV.PROLOGUE);
};

function stageSheet(w, s) {
  const W = DV.WORLDS[w - 1], boss = s === DV.STAGES_PER_WORLD - 1, key = stageKey(w, s), clears = S.cleared[key] || 0;
  const foes = boss ? W.god : W.foes.slice(0, Math.min(4, s + 2)).join(', ');
  openSheet(`
    <div class="eyebrow num">${W.name} · Stage ${s + 1} · Lv ${stageLevel(w, s)}</div>
    <h2>${boss ? 'Avatar of the God' : DV.STAGE_NAMES[s]}</h2>
    <div class="small"><span class="muted">${boss ? 'Boss' : 'Foes'}:</span> ${esc(foes)}</div>
    ${boss ? '<div class="small" style="color:var(--gold)">Every third turn the god charges Corrupted Wrath. Shield, heal or stun before it lands. Below 50% HP it enrages.</div>' : ''}
    <div class="small"><span class="muted">First clear:</span> ${boss ? '60' : '15'} Diamonds${boss ? ` and the blessing <b>${W.blessing.name}</b> (${W.blessing.text})` : ''}.
      ${clears ? `<span class="muted">Cleared ${clears}×. Replays give XP, gold and drops.</span>` : ''}</div>
    <div class="small"><span class="muted">Gear drop chance:</span> ${boss ? '100% (Rare or better)' : Math.round((0.35 + (mods().drop || 0)) * 100) + '%'} · <span class="muted">Your power:</span> <b class="num">${heroPower().toLocaleString()}</b></div>
    <button class="btn primary" id="fight" style="padding:12px">Enter battle</button>`, el => {
    el.querySelector('#fight').onclick = () => {
      closeSheet();
      const go = () => { if (boss && !clears) playDialogue(W.boss, () => startBattleUI(w, s)); else startBattleUI(w, s); };
      if (!S.seen['w' + w]) { S.seen['w' + w] = 1; save(); playDialogue(W.intro, go); } else go();
    };
  });
}
