// Diamondverse — Hero, Class, Skills, Gear and Bazaar screens.
const statTiles = st => `<div class="statgrid">${Object.keys(DV.STAT_LABEL).map(k =>
  `<div class="stat"><small>${DV.STAT_LABEL[k]}</small><b class="num">${st[k]}</b></div>`).join('')}</div>`;

SCREENS.hero = st => {
  const o = DV.LOOK.origin.find(x => x.id === S.origin);
  const attrs = Object.entries(DV.ATTRS).map(([id, a]) => {
    const bonus = (o.bonus[id] || 0);
    return `<div class="row"><div class="grow"><b>${a.name}</b> <span class="num">${S.attrs[id] + bonus}</span>${bonus ? ` <span class="muted small">(+${bonus} origin)</span>` : ''}
      <div class="small muted">${a.note} per point</div></div>
      <button class="btn sm" data-attr="${id}" ${S.attrPts ? '' : 'disabled'} aria-label="Add a point to ${a.name}">+1</button></div>`;
  }).join('');
  const bless = DV.WORLDS.slice(0, S.worldsCleared);
  $('#screen').innerHTML = `
    <section class="row" style="align-items:flex-end">
      <div class="avatar-wrap">${avatarSVG(S.look, S.cls, 120)}</div>
      <div class="grow stack" style="gap:6px">
        <div class="eyebrow">${esc(o.name)} · Facetborn</div>
        <h2>${esc(S.name)}</h2>
        <div class="small"><b style="color:${DV.CLASSES[S.cls].color}">${esc(dualTitle())}</b>${S.job ? ' · ' + DV.JOBS[S.job].name : ''}</div>
        <div class="small num">Level ${S.level} · ${S.xp} / ${xpNeed(S.level)} XP</div>${bar('xp', S.xp, xpNeed(S.level))}
        <div class="small">Power <b class="num">${heroPower().toLocaleString()}</b></div>
      </div></section>
    <button class="btn sm" id="redesign" style="align-self:flex-start">Redesign look</button>
    <section class="stack"><h3>Combat stats</h3>${statTiles(st)}</section>
    <section class="card stack"><div class="row"><h3 class="grow">Attributes</h3><span class="chip num" style="color:var(--gold)">${S.attrPts} points</span></div>
      <div class="small muted">You earn 3 points, 1 skill point and 5 Diamonds every level.</div>${attrs}</section>
    <section class="stack"><h3>Divine blessings</h3>${bless.length ? bless.map(W =>
      `<div class="card small" style="border-color:${W.hue}55"><b>${esc(W.bless[2])}</b> · ${blessText(W)}<div class="muted">From ${esc(W.god.pure)}, Realm ${W.id}</div></div>`).join('')
      : '<div class="small muted">Save a realm to receive its god\'s blessing.</div>'}</section>
    <button class="btn sm" id="reset" style="align-self:flex-start;color:var(--rot)">Start a new game</button>`;
  $('#screen').querySelectorAll('[data-attr]').forEach(b => b.onclick = () => { if (!S.attrPts) return; S.attrPts--; S.attrs[b.dataset.attr]++; save(); render(); });
  $('#redesign').onclick = () => openCreator(true);
  $('#reset').onclick = () => openSheet(`<h2>Erase this save?</h2><div class="small muted">Your hero, gear and story progress on this device will be deleted. This cannot be undone.</div>
    <div class="row"><button class="btn" id="no">Keep playing</button><button class="btn" id="yes" style="background:var(--rot);color:#200">Erase and restart</button></div>`, el => {
    el.querySelector('#no').onclick = closeSheet;
    el.querySelector('#yes').onclick = () => { closeSheet(); S = newState(); save(); boot(); };
  });
};

SCREENS.class = () => {
  const P = DV.CLASSES[S.cls], unlocked = secondaryUnlocked();
  const others = DV.CLASS_ORDER.filter(id => id !== S.cls);
  const secBlock = !unlocked ? `
      <div class="small">Sealed. Requires <b class="num">Lv ${DV.SECONDARY.level}</b> ${S.level >= DV.SECONDARY.level ? '✓' : `(you are ${S.level})`}
        and purifying <b>Prismara</b> ${S.worldsCleared >= 1 ? '✓' : ''}.</div>
      <div class="small muted">Your secondary class adds its 4 skills and 25% of its stat growth, and gives you a combined title.</div>
      <div class="grid2">${others.map(id => `<div class="opt sealed"><b>${DV.CLASSES[id].name}</b><span class="small muted">→ ${DV.DUAL_TITLES[[S.cls, id].sort().join('+')]}</span></div>`).join('')}</div>`
    : `<div class="small muted">${S.cls2 ? 'Change for 500 gold. Skill ranks you bought are kept if you switch back.' : 'Choose freely the first time.'}</div>
      <div class="grid2">${others.map(id => `<button class="opt ${S.cls2 === id ? 'on' : ''}" data-sec="${id}" style="border-left:4px solid ${DV.CLASSES[id].color}">
        <b>${DV.CLASSES[id].name}</b><span class="small">→ ${DV.DUAL_TITLES[[S.cls, id].sort().join('+')]}</span><span class="small muted">${DV.CLASSES[id].role}</span></button>`).join('')}</div>`;
  const jobCard = id => {
    const j = DV.JOBS[id], on = S.job === id, avail = jobAvailable(id), jp = jobProgress(id), max = DV.JOB_XP.length + 1;
    const lvLine = `<div class="row small"><span class="pips" aria-label="Job level ${jp.lv} of ${max}">${Array.from({ length:max }, (_, n) =>
        `<i class="${n < jp.lv ? 'on' : ''}"></i>`).join('')}</span>
      <span class="muted num">${jobMastered(id) ? 'Mastered' : `Job Lv ${jp.lv}${(S.jobXp[id] || 0) ? ` · ${jp.xp}/${jp.need} XP` : ''}`}</span></div>`;
    let action;
    if (on) action = '<span class="chip pure">Active</span>';
    else if (avail) action = `<button class="btn sm" data-job="${id}">${S.job ? `Switch · ${DV.JOB_SWAP_GOLD} g` : 'Take job'}</button>`;
    else if (j.tier === 2) { const ready = reqStatus(id).every(q => q.met);
      action = `<button class="btn sm ${ready ? 'gold' : ''}" data-unlock="${id}" ${ready ? '' : 'disabled'}>Unlock · ${j.cost} ◆</button>`; }
    else action = `<button class="btn sm gold" data-store="${j.sku}">${storeProducts().find(p => p.sku === j.sku).priceLabel}</button>`;
    const reqs = j.tier === 2 && !avail ? `<div class="stack" style="gap:2px">${reqStatus(id).map(q =>
      `<span class="small" style="color:${q.met ? 'var(--ok)' : 'var(--muted)'}">${q.met ? '✓' : '○'} ${q.text}</span>`).join('')}</div>` : '';
    return `<div class="opt ${j.tier === 3 ? 'lux' : ''} ${on ? 'on' : ''} ${!avail && j.tier === 2 ? 'sealed' : ''} stack" style="gap:6px">
      <div class="row"><b class="grow" style="${j.tier === 3 ? 'color:var(--gold)' : ''}">${j.name}</b>${action}</div>
      <span class="small">${j.perk}</span>
      ${j.mastery ? `<span class="small muted">Mastery bonus (job Lv ${max}, permanent): ${j.mastery.text}</span>` : ''}
      ${reqs}${avail || j.tier === 1 ? lvLine : ''}</div>`;
  };
  const tierBlock = t => {
    const T = DV.JOB_TIERS[t - 1], ids = Object.keys(DV.JOBS).filter(id => DV.JOBS[id].tier === t);
    return `<section class="stack"><div class="row"><div class="eyebrow grow" style="${t === 3 ? 'color:var(--gold)' : ''}">${T.name}</div>
        ${t === 3 ? '<button class="btn sm" id="restore">Restore purchases</button>' : ''}</div>
      <div class="small muted">${T.note}${t === 3 ? storeNote() : ''}</div>${ids.map(jobCard).join('')}</section>`;
  };
  $('#screen').innerHTML = `
    <section class="stack"><div class="eyebrow">Combat class</div><h2 style="color:${P.color}">${esc(dualTitle())}</h2></section>
    <section class="card stack" style="border-left:4px solid ${P.color}"><div class="row"><b class="grow">Primary · ${P.name}</b><span class="chip">Chosen at rebirth</span></div>
      <div class="small">${P.desc}</div><div class="small muted">${P.role} · Weapon: ${P.weapon}</div></section>
    <section class="card stack"><div class="row"><b class="grow">Secondary class</b>${unlocked ? '<span class="chip pure">Unlocked</span>' : '<span class="chip lock">Locked</span>'}</div>${secBlock}</section>
    <section class="stack"><div class="eyebrow">Job class</div><h2>${S.job ? DV.JOBS[S.job].name : 'No job yet'}</h2>
      <div class="small muted">One job is active at a time. The active job earns job XP every win; at job Lv ${DV.JOB_XP.length + 1} it is Mastered and its mastery bonus stays with you forever.
        Switching jobs costs ${DV.JOB_SWAP_GOLD} gold.</div></section>
    ${tierBlock(1)}${tierBlock(2)}${tierBlock(3)}`;
  $('#screen').querySelectorAll('[data-sec]').forEach(b => b.onclick = () => {
    const id = b.dataset.sec; if (S.cls2 === id) return;
    if (S.cls2) { if (S.gold < 500) return toast('Changing secondary class costs 500 gold.'); S.gold -= 500; }
    S.cls2 = id; S.loadout = S.loadout.filter(k => skillPool().includes(k));
    const fresh = unlockSkills(); save(); render();
    toast(`You are now a ${dualTitle()}. ${fresh.length} new skills learned.`);
  });
  $('#screen').querySelectorAll('[data-job]').forEach(b => b.onclick = () => {
    const err = setJob(b.dataset.job); if (err) return toast(err);
    render(); toast(`Job set: ${DV.JOBS[S.job].name}.`);
  });
  $('#screen').querySelectorAll('[data-unlock]').forEach(b => b.onclick = () => {
    const err = unlockJob(b.dataset.unlock); if (err) return toast(err);
    render(); toast(`${DV.JOBS[b.dataset.unlock].name} unlocked. Take the job to activate it.`);
  });
  bindStoreButtons($('#screen'));
};

// ---------- Diamond Store (real-money) ----------
function storeNote() {
  return Store.mode() === 'live' ? '' : Store.mode() === 'sandbox' ? ' Test mode: purchases are free and marked as tests.' : ' The store opens soon.';
}
function bindStoreButtons(root) {
  root.querySelectorAll('[data-store]').forEach(b => b.onclick = () => storeSheet(b.dataset.store));
  const rs = root.querySelector('#restore');
  if (rs) rs.onclick = async () => { rs.disabled = true; const res = await Store.restore(); toast(res.message); render(); };
}
function storeSheet(sku) {
  const p = storeProducts().find(x => x.sku === sku), j = DV.JOBS[p.grants], owned = ownsSku(sku);
  const mode = Store.mode();
  openSheet(`<div class="eyebrow" style="color:var(--gold)">Diamond Store · Luxury job</div>
    <h2 style="color:var(--gold)">${p.name}</h2>
    <div class="small">${j.perk}</div>
    ${j.mastery ? `<div class="small muted">Mastery bonus (permanent): ${j.mastery.text}</div>` : ''}
    <div class="card stack small">
      <div class="row"><span class="grow muted">Price</span><b class="num">${p.priceLabel} ${PAYMENTS.currency}</b></div>
      <div class="row"><span class="grow muted">Type</span><span>One-time purchase, yours to keep</span></div>
      ${mode === 'sandbox' ? '<div style="color:var(--gold)">Test mode. You will not be charged.</div>' : ''}
      ${mode === 'disabled' ? '<div class="muted">Purchases are not available yet. The Diamond Store opens in a future update.</div>' : ''}
    </div>
    <button class="btn gold" id="buyNow" style="padding:12px" ${owned || !Store.canBuy() ? 'disabled' : ''}>
      ${owned ? 'Owned' : mode === 'sandbox' ? `Test purchase · ${p.priceLabel}` : mode === 'live' ? `Buy · ${p.priceLabel}` : 'Coming soon'}</button>`, el => {
    const bn = el.querySelector('#buyNow');
    bn.onclick = async () => {
      bn.disabled = true; bn.textContent = 'Processing…';
      const res = await Store.purchase(sku);
      toast(res.message);
      if (res.ok) { closeSheet(); render(); } else { bn.disabled = false; bn.textContent = `Buy · ${p.priceLabel}`; }
    };
  });
}

SCREENS.skills = () => {
  const mpNow = k => Math.round((k.mp || 0) * (1 + S.level / 40) * Math.max(.5, 1 - M(mods(), 'mpCostCut')));
  const card = id => {
    const k = DV.SKILLS[id], r = S.skills[id], inL = S.loadout.includes(id);
    if (!r) {
      if (!k.hidden) return `<div class="card small sealed"><b>${k.name}</b> · <span class="muted">Unlocks at Lv ${k.lvl}</span><div class="muted">${k.desc}</div></div>`;
      const W = DV.WORLDS.find(x => x.lore && x.lore.skill === id), reached = W.id <= S.worldsCleared + 1;
      return `<div class="card small sealed"><b>${reached ? k.name : '???'}</b> · <span class="muted">Hidden story in ${reached ? esc(W.name) : 'Realm ' + W.id}</span><div class="muted">${reached ? k.desc : 'Find the hidden story to learn this skill.'}</div></div>`;
    }
    const pct = n => k.pow ? Math.round(k.pow * (1 + .15 * (n - 1)) * 100) + '%' : '';
    return `<div class="card stack" style="gap:6px"><div class="row"><b class="grow">${k.name}</b>
        <span class="pips" aria-label="Rank ${r} of 5">${[1,2,3,4,5].map(n => `<i class="${n <= r ? 'on' : ''}"></i>`).join('')}</span></div>
      <div class="small">${k.desc}</div>
      <div class="small muted num">${mpNow(k)} MP · ${k.cd ? k.cd + '-turn cooldown' : 'no cooldown'}${k.pow ? ` · Power ${pct(r)}${r < 5 ? ` → ${pct(r + 1)}` : ' (max)'}` : ` · Rank ${r}`}</div>
      <div class="row"><button class="btn sm" data-up="${id}" ${r < 5 && S.skillPts >= r ? '' : 'disabled'}>${r < 5 ? `Upgrade · ${r} SP` : 'Max rank'}</button>
        <button class="btn sm ${inL ? 'primary' : ''}" data-ld="${id}">${inL ? 'In loadout' : 'Add to loadout'}</button></div></div>`;
  };
  const group = cls => `<section class="stack"><h3 style="color:${DV.CLASSES[cls].color}">${DV.CLASSES[cls].name} skills</h3>${Object.keys(DV.SKILLS).filter(id => DV.SKILLS[id].cls === cls).map(card).join('')}</section>`;
  const hidden = Object.keys(DV.SKILLS).filter(id => DV.SKILLS[id].hidden);
  $('#screen').innerHTML = `
    <section class="row"><div class="grow"><div class="eyebrow">Skills</div><h2>Battle loadout</h2></div>
      <div class="stack" style="gap:4px;align-items:flex-end"><span class="chip num" style="color:var(--gold)">${S.skillPts} skill points</span><span class="chip num">${S.loadout.length} / ${DV.LOADOUT_MAX} equipped</span></div></section>
    <div class="small muted">Each rank adds 15% power. Raising a skill to rank N+1 costs N skill points. Only loadout skills appear in battle. MP costs grow with your level.</div>
    ${group(S.cls)}${S.cls2 ? group(S.cls2) : ''}
    <section class="stack"><h3 style="color:var(--gold)">Hidden skills · ${hidden.filter(id => S.skills[id]).length}/${hidden.length} learned</h3>
      <div class="small muted">Any class can learn these by finding a realm's hidden story. Look for glowing lore stones near landmarks in the World tab.</div>
      ${hidden.map(card).join('')}</section>`;
  $('#screen').querySelectorAll('[data-up]').forEach(b => b.onclick = () => { if (upgradeSkill(b.dataset.up)) { render(); toast(`${DV.SKILLS[b.dataset.up].name} ranked up.`); } });
  $('#screen').querySelectorAll('[data-ld]').forEach(b => b.onclick = () => { if (!toggleLoadout(b.dataset.ld)) toast(`Loadout is full (${DV.LOADOUT_MAX}). Remove one first.`); else render(); });
};

// ---------- Party ----------
SCREENS.party = () => {
  const ids = Object.keys(DV.COMPANIONS), joined = ids.filter(compJoined);
  const slot = i => { const id = S.party[i];
    return id ? `<button class="pslot" data-pick="${id}">${compBadge(id, 40)}<b>${esc(DV.COMPANIONS[id].name)}</b><span class="small muted">${DV.CLASSES[DV.COMPANIONS[id].cls].name}</span></button>`
      : `<div class="pslot empty"><span class="small muted">Empty slot</span></div>`; };
  const card = id => {
    const C = DV.COMPANIONS[id], W = DV.WORLDS[C.from - 1], j = compJoined(id), inP = S.party.includes(id), cls = DV.CLASSES[C.cls];
    if (!j) {
      const reached = C.from <= S.worldsCleared + 1;
      const hint = C.join === 'story' ? `Joins when ${reached ? esc(W.name) : 'Realm ' + C.from} is saved.` : reached ? `Rumored to be hiding in ${esc(W.name)}. Explore its landmarks.` : `Hidden somewhere in Realm ${C.from}.`;
      return `<div class="card row sealed">${C.join === 'hidden' && !reached ? '<div class="pq">?</div>' : compBadge(id, 40)}<div class="grow"><b>${C.join === 'hidden' && !reached ? '???' : esc(C.name)}</b>
        <div class="small muted">${hint}</div></div></div>`;
    }
    const st = compStats(id), bond = bondLevel(id), wins = S.comps[id].wins, next = DV.BOND_WINS[bond];
    return `<div class="card stack" style="border-left:4px solid ${cls.color}">
      <div class="row">${compBadge(id, 44)}<div class="grow"><b>${esc(C.name)}</b><div class="small muted">${esc(C.species)} · ${cls.name}</div></div>
        <button class="btn sm ${inP ? 'primary' : ''}" data-pick="${id}">${inP ? 'In party' : 'Add to party'}</button></div>
      <div class="small">${esc(C.bio)}</div>
      <div class="small num muted">HP ${st.hp} · ATK ${st.atk} · MAG ${st.mag} · DEF ${st.def} · SPD ${st.spd}</div>
      <div class="small"><span class="muted">Signature:</span> <b>${esc(C.sig.name)}</b>. ${esc(C.sig.desc)}</div>
      <div class="small"><span class="muted">Bond ${bond}/3</span> ${next ? `· <span class="num">${wins}/${next}</span> wins together to the next chapter` : '· Story complete'}</div>
      ${C.story.map((t, i) => i < bond ? `<details class="small"><summary>Chapter ${i + 1}</summary><p>${esc(t)}</p></details>` : '').join('')}
    </div>`;
  };
  $('#screen').innerHTML = `
    <section><div class="eyebrow">Party</div><h2>Your companions</h2>
      <div class="small muted">Bring up to ${DV.PARTY_MAX} companions. They match your level, use their class skills and a signature move, and share 60% of your gear's stats. Fights get tougher as your party grows, but there are more of you to share the blows. Bond grows with every win together and opens their story.</div></section>
    <section class="pslots"><div class="pslot hero">${avatarSVG(S.look, S.cls, 40)}<b>${esc(S.name)}</b><span class="small muted">${esc(dualTitle())}</span></div>${slot(0)}${slot(1)}</section>
    <section class="stack"><h3>Recruited · ${joined.length}/${ids.length}</h3>${joined.length ? joined.map(card).join('') : '<div class="small muted">Your first companion joins when you save Prismara.</div>'}</section>
    <section class="stack"><h3>Not yet found</h3>${ids.filter(id => !compJoined(id)).map(card).join('') || '<div class="small muted">You found everyone.</div>'}</section>
    <section class="stack"><h3>Online · coming soon</h3>
      ${Online.modes().map(m => `<div class="card row"><div class="grow"><b>${m.name}</b><div class="small muted">${m.desc}</div></div><span class="chip lock">${m.status}</span></div>`).join('')}
    </section>`;
  $('#screen').querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    const id = b.dataset.pick;
    if (!toggleParty(id)) return toast(`The party is full (${DV.PARTY_MAX}). Remove someone first.`);
    render(); toast(S.party.includes(id) ? `${DV.COMPANIONS[id].name} joins the party.` : `${DV.COMPANIONS[id].name} waits at camp.`);
  });
};

const itemRow = (it, attrs) => { const r = DV.RARITY[it.rarity], s = itemStats(it);
  return `<button class="item" ${attrs} style="--rc:${r.color}"><i class="rar"></i><div class="grow"><b>${esc(it.name)}${it.plus ? ' +' + it.plus : ''}</b>
    <span class="small muted">${r.name} · Tier ${it.tier} · ${Object.entries(s).map(([k, v]) => `${DV.STAT_LABEL[k]} +${v}`).join(' · ')}</span></div>
    <span class="small num muted">${itemPower(it)}</span></button>`; };

SCREENS.gear = () => {
  const inv = [...S.inv].sort((a, b) => itemPower(b) - itemPower(a));
  $('#screen').innerHTML = `
    <section class="row"><div class="grow"><div class="eyebrow">Equipment</div><h2>Gear & forge</h2></div>${gemNum('s', S.shards)}</section>
    <div class="small muted">Upgrades add 10% of an item's base stats per level, up to +15. Up to +5 never fails; after that the success rate is shown before you commit. A failed attempt uses materials but never lowers the item.</div>
    <section class="stack"><h3>Equipped</h3>${DV.SLOTS.map(sl => S.equip[sl] ? itemRow(S.equip[sl], `data-eq="${sl}"`)
      : `<div class="item muted">${DV.SLOT_NAME[sl]} · empty</div>`).join('')}</section>
    <section class="stack"><div class="row"><h3 class="grow">Inventory · ${inv.length}</h3>
      ${inv.some(i => i.rarity === 0 && !i.plus) ? '<button class="btn sm" id="salvC">Salvage all Common</button>' : ''}</div>
      ${inv.length ? inv.map(it => itemRow(it, `data-inv="${it.id}"`)).join('') : '<div class="small muted">Win battles or open a Gear Cache in the Bazaar to find gear.</div>'}</section>`;
  $('#screen').querySelectorAll('[data-eq]').forEach(b => b.onclick = () => itemSheet(S.equip[b.dataset.eq], true));
  $('#screen').querySelectorAll('[data-inv]').forEach(b => b.onclick = () => itemSheet(S.inv.find(x => x.id === +b.dataset.inv), false));
  const sc = $('#salvC'); if (sc) sc.onclick = () => { let n = 0; S.inv.filter(i => i.rarity === 0 && !i.plus).forEach(i => n += salvage(i.id)); render(); toast(`Salvaged for ${n} shards.`); };
};
function itemSheet(it, equipped) {
  const r = DV.RARITY[it.rarity], s = itemStats(it), cur = S.equip[it.slot], cs = cur && !equipped ? itemStats(cur) : null;
  const lines = Object.entries(s).map(([k, v]) => { const d = cs ? v - (cs[k] || 0) : 0;
    return `<div class="row small"><span class="grow muted">${DV.STAT_LABEL[k]}</span><b class="num">+${v}</b>${cs ? ` <span class="num" style="color:${d >= 0 ? 'var(--ok)' : 'var(--hp)'}">${d >= 0 ? '+' : ''}${d}</span>` : ''}</div>`; }).join('');
  const c = upgradeCost(it), rate = upgradeRate(it), max = it.plus >= DV.UPGRADE.max;
  openSheet(`<div class="eyebrow" style="color:${r.color}">${r.name} ${DV.SLOT_NAME[it.slot]} · Tier ${it.tier}</div>
    <h2 style="color:${r.color}">${esc(it.name)}${it.plus ? ' +' + it.plus : ''}</h2>
    <div class="stack" style="gap:4px">${lines}</div>${cs ? `<div class="small muted">Compared with your ${esc(cur.name)}${cur.plus ? ' +' + cur.plus : ''}.</div>` : ''}
    <div class="card stack small"><b>Forge to +${it.plus + 1}</b>${max ? '<span class="muted">Fully upgraded.</span>' :
      `<span class="num">Cost: ${c.gold.toLocaleString()} gold · ${c.shards} shards · Success ${Math.round(rate * 100)}%</span>
       <span class="muted num">You have ${S.gold.toLocaleString()} gold and ${S.shards} shards.</span>
       <button class="btn gold" id="up" ${S.gold >= c.gold && S.shards >= c.shards ? '' : 'disabled'}>Upgrade</button>`}</div>
    <div class="row">${equipped ? '' : `<button class="btn primary grow" id="eq">Equip</button><button class="btn" id="sv">Salvage · +${r.shards + it.plus * 2} shards</button>`}</div>`, el => {
    const up = el.querySelector('#up'); if (up) up.onclick = () => { const res = tryUpgrade(it); toast(res.msg); render(); itemSheet(it, equipped); };
    const eq = el.querySelector('#eq'); if (eq) eq.onclick = () => { equipItem(it.id); closeSheet(); render(); toast(`Equipped ${it.name}.`); };
    const sv = el.querySelector('#sv'); if (sv) sv.onclick = () => { const n = salvage(it.id); closeSheet(); render(); toast(`+${n} shards.`); };
  });
}

SCREENS.shop = () => {
  $('#screen').innerHTML = `
    <section><div class="eyebrow">Diamond Bazaar</div><h2>Supplies</h2></section>
    <div class="row small"><span class="chip num">Facet Tonics ${S.potions.hp}</span><span class="chip num">Mana Shards ${S.potions.mp}</span>${gemNum('s', S.shards)}</div>
    ${shopItems().map(it => `<div class="card row"><div class="grow"><b>${it.name}</b><div class="small muted">${it.text}</div></div>
      <button class="btn sm gold" data-buy="${it.id}" ${S.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()} g</button></div>`).join('')}
    <section class="stack"><div class="row"><div class="eyebrow grow" style="color:var(--gold)">Diamond Store · Luxury jobs</div><button class="btn sm" id="restore">Restore purchases</button></div>
      <div class="small muted">Premium jobs, bought once with real money.${storeNote()}</div>
      ${storeProducts().map(p => `<div class="card lux row"><div class="grow"><b style="color:var(--gold)">${p.name}</b>
        <div class="small muted">${p.description}</div></div>
        ${ownsSku(p.sku) ? '<span class="chip pure">Owned</span>' : `<button class="btn sm gold" data-store="${p.sku}">${p.priceLabel}</button>`}</div>`).join('')}</section>
    <section class="card stack small"><h3>How you earn Diamonds</h3>
      <div>15 per first clear of a stage · 60 per purified god · 5 per level gained. Diamonds unlock Tier 2 jobs in the Class tab (150–200).</div>
      <div class="muted">Prices scale with the highest world you have reached. Gear Cache odds are shown on the item.</div></section>`;
  $('#screen').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const r = buy(b.dataset.buy); toast(r.msg); render(); });
  bindStoreButtons($('#screen'));
};
