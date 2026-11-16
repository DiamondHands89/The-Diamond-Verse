// Diamondverse — open world (World tab): a third-person 3D realm per world.
// Battle stages are shrines along a path; roaming foes start field encounters; chests, NPCs and portals are interactable.
const Realm = (() => {
  // ---------- per-world look ----------
  const THEME = {
    1:{ ground:'#2c4636', path:'#7d9a6e', fog:'#16232c', propA:['gem','#8fe3b0'], propB:['cone','#2f6b4a'], stone:'#8a9b8f' },
    2:{ ground:'#2a201d', path:'#6a4a3c', fog:'#26140f', propA:['hex','#3b3330'], propB:['gem','#ff8a5b'], stone:'#5d4d46' },
    3:{ ground:'#14324a', path:'#3b7c96', fog:'#09203a', propA:['cone','#ff7aa8'], propB:['gem','#4fc3f7'], stone:'#6f8fa3' },
    4:{ ground:'#3a3f5c', path:'#8a8fb8', fog:'#262a48', propA:['box','#8b8fb0'], propB:['gem','#c3a6ff'], stone:'#9da2c4' },
    5:{ ground:'#1b1630', path:'#43376e', fog:'#0f0b1d', propA:['cone','#2d2554'], propB:['gem','#9b8cff'], stone:'#4c4470' },
    6:{ ground:'#1d202c', path:'#414860', fog:'#0d0f17', propA:['gem','#22232e'], propB:['gem','#e8f4ff'], stone:'#5a6078' }
  };
  const SPAWN = [0, 34], NPC_POS = [5, 31], BACK_POS = [-9, 42], NEXT_POS = [0, -50], RADIUS = 55;
  const SHRINES = [[-12, 22], [11, 9], [-11, -6], [12, -21], [0, -38]];
  const PATH = [SPAWN, ...SHRINES, NEXT_POS];

  let ok = null, canvas, wrap, labelsBox, statics = [], colliders = [], ents = [], enemies = [];
  const R = { w:1, px:0, pz:0, ry:Math.PI, yaw:0, moving:0, t:0, grace:2, log:[], keys:new Set(), jx:0, jy:0, near:null, foe:null, lastSave:0 };

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  function segDist(px, pz, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
    return dist(px, pz, a[0] + dx * t, a[1] + dz * t);
  }
  const nearPath = (x, z) => Math.min(...PATH.slice(1).map((b, i) => segDist(x, z, PATH[i], b)));

  function say(msg, kind) {
    R.log.push([kind || 'sys', msg]); if (R.log.length > 40) R.log.shift();
    updateHud();
  }
  const unlockedWorld = () => clamp(S.worldsCleared + 1, 1, DV.WORLDS.length);

  // ---------- world build ----------
  function build(w) {
    R.w = w; const T = THEME[w], W = DV.WORLDS[w - 1], rand = seeded(w * 7919);
    statics = []; colliders = []; ents = [];
    statics.push({ mesh:'ground', sx:70, sy:1, sz:70, color:T.ground });
    // path
    PATH.slice(1).forEach((b, i) => {
      const a = PATH[i], len = dist(a[0], a[1], b[0], b[1]);
      statics.push({ mesh:'box', x:(a[0] + b[0]) / 2, y:.005, z:(a[1] + b[1]) / 2, ry:Math.atan2(b[0] - a[0], b[1] - a[1]), sx:3.4, sy:.02, sz:len + 3.4, color:T.path });
    });
    // scattered props
    for (let i = 0, tries = 0; i < 130 && tries < 2000; tries++) {
      const r = Math.sqrt(rand()) * 53, t = rand() * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r;
      if (nearPath(x, z) < 4.5 || dist(x, z, SPAWN[0], SPAWN[1]) < 7 || dist(x, z, BACK_POS[0], BACK_POS[1]) < 4) continue;
      i++;
      const [mesh, color] = rand() < .55 ? T.propA : T.propB, s = .6 + rand() * 1.6, tall = mesh === 'cone' || mesh === 'gem' ? 1.6 + rand() * 1.4 : .6 + rand() * .7;
      statics.push({ mesh, x, z, ry:rand() * 6, sx:s, sy:s * tall, sz:s, color, e: mesh === 'gem' && color !== '#22232e' ? .15 : 0 });
      if (s > .9) colliders.push([x, z, s * .45]);
    }
    // boundary ring
    for (let i = 0; i < 44; i++) {
      const t = i / 44 * Math.PI * 2, r = 59 + rand() * 4, s = 3 + rand() * 3;
      statics.push({ mesh:'gem', x:Math.cos(t) * r, z:Math.sin(t) * r, ry:rand() * 6, sx:s, sy:s * (2 + rand() * 2), sz:s, color:T.stone });
    }
    // shrines (battle stages)
    SHRINES.forEach(([x, z], s) => {
      const boss = s === SHRINES.length - 1;
      ents.push({ kind:'shrine', s, x, z, r:boss ? 2.4 : 1.7, label:boss ? `♛ ${W.god.split(',')[0]}` : DV.STAGE_NAMES[s] });
      colliders.push([x, z, boss ? 2.2 : 1.5]);
    });
    // chests
    const chestRand = seeded(w * 31337);
    for (let i = 0; i < 4; i++) {
      let x, z, n = 0;
      do { const r = 12 + chestRand() * 38, t = chestRand() * Math.PI * 2; x = Math.cos(t) * r; z = Math.sin(t) * r; n++; }
      while ((nearPath(x, z) < 5 || colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 1.5)) && n < 200);
      ents.push({ kind:'chest', key:`${w}-${i}`, x, z, r:1 }); colliders.push([x, z, .8]);
    }
    // NPC (first named speaker in the world's intro)
    const sp = (W.intro.find(l => l[0] !== 'narr' && l[0] !== 'lumeria') || ['lumeria'])[0];
    ents.push({ kind:'npc', who:sp, x:NPC_POS[0], z:NPC_POS[1], r:1.2, label:DV.SPEAKERS[sp] }); colliders.push([NPC_POS[0], NPC_POS[1], .6]);
    // portals
    ents.push({ kind:'portal', dir:1, x:NEXT_POS[0], z:NEXT_POS[1], r:2.2, label: w < DV.WORLDS.length ? `Portal to ${DV.WORLDS[w].name}` : 'Beyond the Fracture' });
    if (w > 1) ents.push({ kind:'portal', dir:-1, x:BACK_POS[0], z:BACK_POS[1], r:2.2, label:`Portal to ${DV.WORLDS[w - 2].name}` });
    // roaming foes: spread along the path, levelled to the nearest stage
    const er = seeded(w * 104729); enemies = [];
    for (let i = 0; i < 7; i++) {
      const f = .12 + i / 7 * .8, seg = Math.min(SHRINES.length - 1, Math.floor(f * (PATH.length - 2))), a = PATH[seg], b = PATH[seg + 1], u = er();
      const side = er() < .5 ? -1 : 1, off = 5 + er() * 5, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      const hx = a[0] + dx * u + (-dz / l) * off * side, hz = a[1] + dz * u + (dx / l) * off * side;
      const stage = Math.min(3, seg), lvl = Math.max(1, stageLevel(w, stage) - (er() < .5 ? 1 : 0));
      enemies.push({ id:`${w}-e${i}`, foe:W.foes[Math.min(3, Math.floor(er() * (stage + 2)))], lvl, hx, hz, x:hx, z:hz, tx:hx, tz:hz, ry:0, dead:0, seen:false });
    }
  }

  function placePlayer(at) {
    const p = at || SPAWN; R.px = p[0]; R.pz = p[1]; R.ry = Math.PI; R.yaw = 0; R.grace = 2;
  }
  function savePos() { S.realm = { w:R.w, x:+R.px.toFixed(2), z:+R.pz.toFixed(2) }; save(); }
  function travel(w, at) {
    build(w); placePlayer(at); savePos(); render();
    const W = DV.WORLDS[w - 1];
    say(`You arrive in ${W.name}, ${W.sub}.`, 'sys');
    if (!S.seen['w' + w]) { S.seen['w' + w] = 1; save(); playDialogue(W.intro); }
  }

  // ---------- models ----------
  function rotOff(x, z, ry, dx, dz) { const c = Math.cos(ry), s = Math.sin(ry); return [x + dx * c + dz * s, z - dx * s + dz * c]; }
  function shadow(x, z, s) { Gfx.draw({ mesh:'disc', x, y:.02, z, sx:s, sy:.01, sz:s, color:'#000000', a:.35 }); }
  function humanoid(x, z, ry, c, moving, t) {
    shadow(x, z, 1.1);
    const bob = Math.abs(Math.sin(t * 10)) * .07 * moving, sw = Math.sin(t * 10) * .22 * moving, P = (dx, dz) => rotOff(x, z, ry, dx, dz);
    [[-.15, sw], [.15, -sw]].forEach(([dx, dz]) => { const [lx, lz] = P(dx, dz); Gfx.draw({ mesh:'box', x:lx, y:0, z:lz, ry, sx:.22, sy:.72, sz:.24, color:c.legs }); });
    Gfx.draw({ mesh:'box', x, y:.7 + bob, z, ry, sx:.66, sy:.75, sz:.38, color:c.outfit });
    const [ex, ez] = P(0, .2); Gfx.draw({ mesh:'gem', x:ex, y:.92 + bob, z:ez, ry, sx:.18, sy:.24, sz:.18, color:c.accent, e:.7 });
    Gfx.draw({ mesh:'box', x, y:1.45 + bob, z, ry, sx:.46, sy:.46, sz:.46, color:c.skin });
    Gfx.draw({ mesh:'box', x, y:1.86 + bob, z, ry, sx:.52, sy:.18, sz:.52, color:c.hair });
    if (c.long) { const [hx, hz] = P(0, -.22); Gfx.draw({ mesh:'box', x:hx, y:1.15 + bob, z:hz, ry, sx:.5, sy:.7, sz:.12, color:c.hair }); }
    if (c.weapon) { const [wx, wz] = P(.45, .05); Gfx.draw({ mesh:'box', x:wx, y:.45 + bob, z:wz, ry, sx:.09, sy:c.weapon, sz:.09, color:c.accent, e:.35 }); }
  }
  function heroColors() {
    const L = DV.LOOK, cls = DV.CLASSES[S.cls];
    return { skin:L.skin[S.look.skin], hair:L.hair[S.look.hair], outfit:L.outfit[S.look.outfit], legs:'#1c2033', accent:cls.color,
      long:S.look.hairStyle === 1, weapon:cls.main === 'mag' ? 1.6 : 1.1 };
  }
  function drawEnemy(e, hue, t) {
    shadow(e.x, e.z, 1.3);
    const bob = Math.sin(t * 3 + e.hx) * .12;
    Gfx.draw({ mesh:'gem8', x:e.x, y:.25 + bob, z:e.z, ry:t * .8 + e.hx, sx:1.2, sy:1.7, sz:1.2, color:'#2a1530' });
    Gfx.draw({ mesh:'gem', x:e.x, y:.75 + bob, z:e.z, ry:-t * 1.4, sx:.6, sy:.8, sz:.6, color:'#ff4d7a', e:.9 });
    const P = (dx) => rotOff(e.x, e.z, e.ry, dx, .52);
    [-.2, .2].forEach(dx => { const [a, b] = P(dx); Gfx.draw({ mesh:'box', x:a, y:1.25 + bob, z:b, ry:e.ry, sx:.12, sy:.14, sz:.08, color:'#ff4d7a', e:1 }); });
  }
  function drawEnt(n, T, W, t) {
    if (n.kind === 'shrine') {
      const boss = n.s === SHRINES.length - 1, k = boss ? 1.45 : 1, done = !!S.cleared[stageKey(R.w, n.s)], open = stageOpen(R.w, n.s);
      Gfx.draw({ mesh:'hex', x:n.x, z:n.z, sx:2.8 * k, sy:.45, sz:2.8 * k, color:T.stone });
      Gfx.draw({ mesh:'hex', x:n.x, y:.45, z:n.z, sx:2 * k, sy:.25, sz:2 * k, color:T.stone });
      const col = done ? W.hue : open ? '#ffffff' : '#3a3d4a', glow = done ? .55 : open ? .35 + Math.sin(t * 3) * .2 : 0;
      Gfx.draw({ mesh:'gem8', x:n.x, y:1.2 + (open && !done ? Math.sin(t * 2) * .15 : 0), z:n.z, ry:t * .5, sx:1.3 * k, sy:3 * k, sz:1.3 * k, color:col, e:glow });
      if (boss) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; Gfx.draw({ mesh:'cone', x:n.x + Math.cos(a) * 2.6, y:.4, z:n.z + Math.sin(a) * 2.6, sx:.5, sy:1.8, sz:.5, color: S.worldsCleared >= R.w ? W.hue : '#ff4d7a', e:.4 }); }
    } else if (n.kind === 'chest') {
      const opened = !!S.chests[n.key];
      shadow(n.x, n.z, 1.2);
      Gfx.draw({ mesh:'box', x:n.x, z:n.z, ry:.4, sx:1, sy:.55, sz:.7, color:'#6b4a2a' });
      Gfx.draw({ mesh:'box', x:n.x, y:.55, z:n.z, ry:.4, sx:1.04, sy:.22, sz:.74, color: opened ? '#3d2c1b' : '#ffc145', e: opened ? 0 : .25, rx: opened ? -.9 : 0 });
    } else if (n.kind === 'npc') {
      const c = SPEAKER_COLOR[n.who] || '#7ef2ff';
      n.ry = Math.atan2(R.px - n.x, R.pz - n.z);
      humanoid(n.x, n.z, n.ry, { skin:'#e8b896', hair:'#2a2233', outfit:c, legs:'#22263a', accent:'#ffffff' }, 0, t);
    } else if (n.kind === 'portal') {
      const live = n.dir < 0 || (S.worldsCleared >= R.w && R.w < DV.WORLDS.length), tw = n.dir < 0 ? DV.WORLDS[R.w - 2] : DV.WORLDS[R.w] || W;
      [-1.7, 1.7].forEach(dx => Gfx.draw({ mesh:'hex', x:n.x + dx, z:n.z, sx:.7, sy:3.6, sz:.7, color:T.stone }));
      Gfx.draw({ mesh:'box', x:n.x, y:3.5, z:n.z, sx:4.4, sy:.55, sz:.8, color:T.stone });
      Gfx.draw({ mesh:'box', x:n.x, y:.05, z:n.z, sx:2.7, sy:3.4, sz:.12, color: live ? tw.hue : '#30323d', e: live ? .7 + Math.sin(t * 2) * .2 : 0, a: live ? .7 : .5 });
    }
  }

  // ---------- frame loop ----------
  let last = 0;
  const active = () => ok && canvas && canvas.isConnected && !$('#app').hidden && !document.hidden && tab === 'world';
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (!active()) return;
    R.t += dt; R.grace = Math.max(0, R.grace - dt);
    // input → movement relative to the camera
    let ix = R.jx, iy = R.jy;
    if (R.keys.has('a') || R.keys.has('arrowleft')) ix -= 1; if (R.keys.has('d') || R.keys.has('arrowright')) ix += 1;
    if (R.keys.has('w') || R.keys.has('arrowup')) iy -= 1; if (R.keys.has('s') || R.keys.has('arrowdown')) iy += 1;
    const il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; }
    R.moving = Math.min(1, il);
    if (R.moving > .05) {
      const fx = -Math.sin(R.yaw), fz = -Math.cos(R.yaw), rx = Math.cos(R.yaw), rz = -Math.sin(R.yaw);
      const mx = rx * ix + fx * -iy, mz = rz * ix + fz * -iy, sp = 7.5 * dt;
      R.px += mx * sp; R.pz += mz * sp; R.ry = Math.atan2(mx, mz);
      colliders.forEach(([cx, cz, cr]) => { const d = dist(R.px, R.pz, cx, cz), m = cr + .45; if (d < m && d > 0) { R.px = cx + (R.px - cx) / d * m; R.pz = cz + (R.pz - cz) / d * m; } });
      const r = Math.hypot(R.px, R.pz); if (r > RADIUS) { R.px *= RADIUS / r; R.pz *= RADIUS / r; }
      if (R.t - R.lastSave > 3) { R.lastSave = R.t; savePos(); }
    }
    // foes
    const W = DV.WORLDS[R.w - 1], T = THEME[R.w];
    let foe = null, foeD = 4.5;
    for (const e of enemies) {
      if (e.dead) { if (Date.now() > e.dead) { e.dead = 0; e.x = e.hx; e.z = e.hz; } else continue; }
      const dp = dist(e.x, e.z, R.px, R.pz), dh = dist(e.x, e.z, e.hx, e.hz);
      let sp = 1.6;
      if (dp < 7 && dh < 13 && R.grace <= 0) { e.tx = R.px; e.tz = R.pz; sp = 3.4; }
      else if (dist(e.x, e.z, e.tx, e.tz) < .5 || dh > 13) { const a = Math.random() * 6.28, r = Math.random() * 5; e.tx = e.hx + Math.cos(a) * r; e.tz = e.hz + Math.sin(a) * r; }
      const dx = e.tx - e.x, dz = e.tz - e.z, l = Math.hypot(dx, dz);
      if (l > .1) { e.x += dx / l * sp * dt; e.z += dz / l * sp * dt; e.ry = Math.atan2(dx, dz); }
      if (dp < 9 && !e.seen) { e.seen = true; say(`You encounter a ${e.foe}! (Lv ${e.lvl})`, 'foe'); }
      if (dp > 16) e.seen = false;
      if (dp < foeD) { foe = e; foeD = dp; }
      if (dp < 1.3 && R.grace <= 0) { engage(e, false); return; }
    }
    // nearest interactable
    let near = null, nd = Infinity;
    ents.forEach(n => { const d = dist(n.x, n.z, R.px, R.pz) - n.r; if (d < 2.2 && d < nd) { near = n; nd = d; } });
    if (near !== R.near || foe !== R.foe) { R.near = near; R.foe = foe; updateButtons(); }
    // draw
    const D = 11, H = 7.5, eye = [R.px + Math.sin(R.yaw) * D, H, R.pz + Math.cos(R.yaw) * D];
    Gfx.frame(eye, [R.px, 1.3, R.pz], T.fog, [30, 78]);
    statics.forEach(Gfx.draw);
    ents.forEach(n => drawEnt(n, T, W, R.t));
    enemies.forEach(e => { if (!e.dead) drawEnemy(e, W.hue, R.t); });
    humanoid(R.px, R.pz, R.ry, heroColors(), R.moving, R.t);
    drawLabels();
  }
  const labelEls = new Map();
  function drawLabels() {
    const seen = new Set();
    ents.forEach((n, i) => {
      if (!n.label) return;
      const d = dist(n.x, n.z, R.px, R.pz); if (d > 30) return;
      const p = Gfx.project(n.x, n.kind === 'shrine' ? (n.s === 4 ? 6.4 : 4.6) : n.kind === 'portal' ? 4.4 : 2.5, n.z); if (!p) return;
      let el = labelEls.get(i);
      if (!el) { el = document.createElement('div'); el.className = 'rw-label'; labelsBox.appendChild(el); labelEls.set(i, el); }
      let text = n.label;
      if (n.kind === 'shrine') text += S.cleared[stageKey(R.w, n.s)] ? ' ✓' : stageOpen(R.w, n.s) ? ` · Lv ${stageLevel(R.w, n.s)}` : ' · Sealed';
      if (el.textContent !== text) el.textContent = text;
      el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
      el.style.opacity = d > 22 ? (30 - d) / 8 : 1;
      el.hidden = false; seen.add(i);
    });
    labelEls.forEach((el, i) => { if (!seen.has(i)) el.hidden = true; });
  }

  // ---------- actions ----------
  function engage(e, first) {
    savePos();
    R.keys.clear(); R.jx = R.jy = 0;
    startEncounter(R.w, e.foe, e.lvl, first, e.id);
    renderBattle();
  }
  function attack() {
    if (R.foe) return engage(R.foe, true);
    say('No foe in reach. Walk up to a corrupted foe, then Attack to strike first.', 'sys');
  }
  function interact() {
    const n = R.near, W = DV.WORLDS[R.w - 1];
    if (!n) return say('Nothing to interact with here. Walk up to a shrine, chest, portal or person.', 'sys');
    if (n.kind === 'shrine') {
      if (stageOpen(R.w, n.s)) { savePos(); stageSheet(R.w, n.s); }
      else say(`This shrine is sealed. Cleanse ${DV.STAGE_NAMES[n.s - 1]} first.`, 'sys');
    } else if (n.kind === 'chest') {
      if (S.chests[n.key]) return say('This chest is empty.', 'sys');
      const gold = Math.round((40 + Math.random() * 40) * R.w), shards = 3 + Math.floor(Math.random() * 4);
      S.chests[n.key] = 1; S.gold += gold; S.lifetimeGold += gold; S.shards += shards;
      const pot = Math.random() < .5 ? 'hp' : 'mp'; S.potions[pot]++;
      save(); render();
      say(`You found a treasure! +${gold} gold, +${shards} shards, +1 ${pot === 'hp' ? 'Facet Tonic' : 'Mana Shard'}.`, 'you');
    } else if (n.kind === 'npc') {
      playDialogue(W.intro);
    } else if (n.kind === 'portal') {
      if (n.dir < 0) return travel(R.w - 1, [NEXT_POS[0], NEXT_POS[1] + 5]);
      if (R.w >= DV.WORLDS.length) return say(S.worldsCleared >= R.w ? 'Beyond the Fracture, new worlds are still forming. Season Two awaits.' : `The way is sealed until ${W.god.split(',')[0]} is purified.`, 'sys');
      if (S.worldsCleared < R.w) return say(`The portal is dark. Purify ${W.god.split(',')[0]} to open it.`, 'sys');
      travel(R.w + 1, [BACK_POS[0] + 3, BACK_POS[1] - 4]);
    }
  }
  function afterBattle(field, outcome) {
    R.grace = 4;
    if (field) {
      const e = enemies.find(x => x.id === field.id);
      if (e && outcome === 'win') { e.dead = Date.now() + 60000; say(`${field.foe} is cleansed. More Rot will gather here in a minute.`, 'you'); }
      else if (e) { e.x = e.hx; e.z = e.hz; e.tx = e.hx; e.tz = e.hz; say(outcome === 'flee' ? 'You slip away.' : 'You stagger back, battered but alive.', 'sys'); }
    } else if (outcome === 'win') say('The shrine glows clean.', 'you');
  }

  // ---------- HUD ----------
  function updateButtons() {
    const a = $('#rwAttack'), i = $('#rwInteract'); if (!a) return;
    a.querySelector('small').textContent = R.foe ? `${R.foe.foe} · Lv ${R.foe.lvl}` : 'No foe in reach';
    a.classList.toggle('ready', !!R.foe);
    const n = R.near;
    i.querySelector('small').textContent = !n ? 'Nothing nearby'
      : n.kind === 'shrine' ? (stageOpen(R.w, n.s) ? `Enter ${n.s === 4 ? 'boss shrine' : DV.STAGE_NAMES[n.s]}` : 'Sealed shrine')
      : n.kind === 'chest' ? (S.chests[n.key] ? 'Empty chest' : 'Open chest')
      : n.kind === 'npc' ? `Talk to ${n.label}` : n.label;
    i.classList.toggle('ready', !!n);
  }
  function updateHud() {
    const el = $('#rwLog'); if (!el) return;
    el.innerHTML = R.log.slice(-5).map(([k, m]) => `<div class="${k === 'foe' ? 'foe-l' : k}">– ${esc(m)}</div>`).join('') || '<div class="sys">– Explore. Shrines hold the stages; corrupted foes roam nearby.</div>';
  }

  // ---------- mount / input ----------
  function ensure() {
    if (ok !== null) return ok;
    wrap = document.createElement('div'); wrap.className = 'rw-canvas-wrap';
    canvas = document.createElement('canvas'); canvas.className = 'rw-canvas'; canvas.setAttribute('aria-label', 'Open world view');
    labelsBox = document.createElement('div'); labelsBox.className = 'rw-labels';
    wrap.append(canvas, labelsBox);
    ok = Gfx.init(canvas);
    if (!ok) return false;
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { id:e.pointerId, x:e.clientX }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (drag && drag.id === e.pointerId) { R.yaw -= (e.clientX - drag.x) * .009; drag.x = e.clientX; } });
    const end = e => { if (drag && drag.id === e.pointerId) drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    window.addEventListener('keydown', e => {
      if (!active() || /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { R.keys.add(k); e.preventDefault(); }
      else if (k === ' ' || k === 'f') { e.preventDefault(); attack(); }
      else if (k === 'e' || k === 'enter') { e.preventDefault(); interact(); }
      else if (k === 'q') R.yaw += .3; else if (k === 'r') R.yaw -= .3;
    });
    window.addEventListener('keyup', e => R.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => R.keys.clear());
    const st = S.realm && S.realm.w <= unlockedWorld() ? S.realm : null;
    build(st ? st.w : unlockedWorld()); placePlayer(st ? [st.x, st.z] : null);
    say(`${DV.WORLDS[R.w - 1].name}. Walk the path to the shrines to face each stage.`, 'sys');
    requestAnimationFrame(loop);
    return true;
  }
  function mount() {
    const box = $('#rwScene');
    if (!ensure()) { box.innerHTML = '<div class="rw-nogl">This device could not start the 3D view (WebGL is turned off or unsupported). The Story tab still has every stage.</div>'; return; }
    box.appendChild(wrap);
    // joystick
    const joy = $('#rwJoy'), knob = joy.querySelector('i'); let jid = null;
    const upd = e => { const r = joy.getBoundingClientRect(), R0 = r.width / 2 - 8; let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; } R.jx = dx / R0; R.jy = dy / R0; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    joy.onpointerdown = e => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); upd(e); };
    joy.onpointermove = e => { if (e.pointerId === jid) upd(e); };
    joy.onpointerup = joy.onpointercancel = e => { if (e.pointerId !== jid) return; jid = null; R.jx = R.jy = 0; knob.style.transform = ''; };
    $('#rwAttack').onclick = attack; $('#rwInteract').onclick = interact;
    $('#rwTravel').onclick = travelSheet;
    R.near = R.foe = undefined; updateHud();
  }
  function travelSheet() {
    const max = unlockedWorld();
    openSheet(`<div class="eyebrow">Travel</div><h2>Worlds of the Verse</h2>
      <div class="small muted">Open worlds can be reached instantly. Purify a world's god to open the next.</div>
      ${DV.WORLDS.map(W => `<button class="opt ${W.id === R.w ? 'on' : ''} ${W.id > max ? 'sealed' : ''}" data-go="${W.id}" ${W.id > max ? 'disabled' : ''} style="border-left:4px solid ${W.hue}">
        <b>${W.id}. ${W.name}</b><span class="small muted">${W.id > max ? 'Sealed' : S.worldsCleared >= W.id ? 'Purified · ' + W.sub : W.sub}</span></button>`).join('')}`, el => {
      el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closeSheet(); if (+b.dataset.go !== R.w) travel(+b.dataset.go); });
    });
  }
  return { mount, afterBattle, get world() { ensure(); return R.w; }, say, get _state() { return { R, enemies, ents }; } };
})();

// ---------- World screen (mirrors the wireframe) ----------
SCREENS.world = st => {
  Realm.world; // make sure the realm exists so the header shows the right world
  const W = DV.WORLDS[Realm.world - 1], o = DV.LOOK.origin.find(x => x.id === S.origin), at = a => S.attrs[a] + (o.bonus[a] || 0);
  const inv = DV.SLOTS.filter(sl => S.equip[sl]).map(sl => { const it = S.equip[sl];
    return `<li style="color:${DV.RARITY[it.rarity].color}">${esc(it.name)}${it.plus ? ' +' + it.plus : ''} <span class="muted">· ${DV.SLOT_NAME[sl]}</span></li>`; });
  inv.push(`<li>Facet Tonic ×${S.potions.hp}</li>`, `<li>Mana Shard ×${S.potions.mp}</li>`, `<li>Upgrade shards ×${S.shards}</li>`);
  if (S.inv.length) inv.push(`<li class="muted">${S.inv.length} unequipped item${S.inv.length > 1 ? 's' : ''} in Gear</li>`);
  $('#screen').innerHTML = `<div class="rw">
    <header class="rw-head" style="--wh:${W.hue}"><div class="grow"><div class="eyebrow num">World ${W.id} · ${S.worldsCleared >= W.id ? 'Purified' : 'Corrupted'}</div>
      <h2>${W.name}</h2><div class="small muted">${W.sub}</div></div><button class="btn sm" id="rwTravel">Travel</button></header>
    <section class="rw-char rw-panel">
      <div class="rw-name"><b>${esc(S.name)}</b> <span class="muted num">(Lv ${S.level})</span></div>
      <div class="rw-bars">
        <div><div class="rw-stat"><span>HP</span><b class="num">${st.hp}/${st.hp}</b></div>${bar('hp', 1, 1, 5)}</div>
        <div><div class="rw-stat"><span>MP</span><b class="num">${st.mp}/${st.mp}</b></div>${bar('mp', 1, 1, 5)}</div>
      </div>
      <div class="rw-stats">
        <div><span><i class="lg">Strength</i><i class="sm">STR</i></span><b class="num">${at('str')}</b><small class="num">ATK ${st.atk}</small></div>
        <div><span><i class="lg">Agility</i><i class="sm">AGI</i></span><b class="num">${at('agi')}</b><small class="num">SPD ${st.spd}</small></div>
        <div><span><i class="lg">Intelligence</i><i class="sm">INT</i></span><b class="num">${at('int')}</b><small class="num">MAG ${st.mag}</small></div>
        <div><span>XP</span><b class="num">${S.xp}/${xpNeed(S.level)}</b></div>
        <div><span>Level</span><b class="num">${S.level}</b>${S.attrPts ? `<small style="color:var(--gold)">${S.attrPts} pts to spend</small>` : ''}</div>
      </div>
    </section>
    <section class="rw-scene rw-panel" id="rwScene"></section>
    <section class="rw-log rw-panel"><h3>Action log</h3><div class="log" id="rwLog" aria-live="polite"></div></section>
    <section class="rw-inv rw-panel"><h3>Inventory</h3><ul>${inv.join('')}</ul></section>
    <section class="rw-ctrl rw-panel"><h3>Controls</h3>
      <div class="rw-ctrl-row">
        <div class="rw-joy" id="rwJoy" role="application" aria-label="Move: drag to walk"><i></i><span>Move</span></div>
        <button class="act rw-btn" id="rwAttack"><b>Attack</b><small>No foe in reach</small></button>
        <button class="act rw-btn" id="rwInteract"><b>Interact</b><small>Nothing nearby</small></button>
      </div>
      <div class="small muted">Drag the scene to turn the camera. Keyboard: WASD or arrows to move, Space to attack, E to interact.</div>
    </section>
  </div>`;
  Realm.mount();
};
