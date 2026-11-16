// Diamondverse — open world (World tab): a third-person 3D realm per world, built from the realm's biome.
// Shrines (battle stages) line a winding path; landmarks, chests, lore stones, a quest-giver and hidden companions
// are spread across the map; roaming foes start field encounters; portals link realms.
const Realm = (() => {
  // ---------- biomes ----------
  // ground, path, fog, propA/propB: [mesh, color], stone, hazard: pool colour (impassable) or null
  const BIOMES = {
    meadow:   { ground:'#2c4636', path:'#7d9a6e', fog:'#16232c', propA:['cone','#2f6b4a'], propB:['gem','#8fe3b0'], stone:'#8a9b8f', hazard:null },
    volcanic: { ground:'#2a201d', path:'#6a4a3c', fog:'#26140f', propA:['hex','#3b3330'], propB:['gem','#ff8a5b'], stone:'#5d4d46', hazard:'#ff5a1f' },
    ocean:    { ground:'#14324a', path:'#3b7c96', fog:'#09203a', propA:['cone','#ff7aa8'], propB:['gem','#4fc3f7'], stone:'#6f8fa3', hazard:'#0a4f8a' },
    sky:      { ground:'#3a3f5c', path:'#8a8fb8', fog:'#262a48', propA:['box','#8b8fb0'], propB:['gem','#c3a6ff'], stone:'#9da2c4', hazard:'#151729' },
    nightmare:{ ground:'#1b1630', path:'#43376e', fog:'#0f0b1d', propA:['cone','#2d2554'], propB:['gem','#9b8cff'], stone:'#4c4470', hazard:'#06040d' },
    obsidian: { ground:'#1d202c', path:'#414860', fog:'#0d0f17', propA:['gem','#22232e'], propB:['gem','#e8f4ff'], stone:'#5a6078', hazard:'#05060a' },
    crystal:  { ground:'#1f2747', path:'#5d6fa8', fog:'#111733', propA:['gem8','#6fd3ff'], propB:['gem','#b07cff'], stone:'#7d86b8', hazard:null },
    jungle:   { ground:'#1f3a22', path:'#5f7a3c', fog:'#0e1d10', propA:['cone','#2b5a2a'], propB:['cyl','#3d6b35'], stone:'#6b7a55', hazard:'#2f5e3a' },
    desert:   { ground:'#6b5636', path:'#a88a5a', fog:'#3a2c18', propA:['hex','#8a6d45'], propB:['gem','#ffd166'], stone:'#b39468', hazard:null },
    tundra:   { ground:'#8fa3b5', path:'#c8d6e3', fog:'#5a6b7d', propA:['cone','#e8f4ff'], propB:['gem','#bfe6ff'], stone:'#a8b8c8', hazard:'#4a7ca8' },
    clockwork:{ ground:'#3a3226', path:'#6e5b3d', fog:'#1e1910', propA:['cyl','#8a6d3b'], propB:['hex','#d9a441'], stone:'#7a6a4c', hazard:null },
    swamp:    { ground:'#2a3a26', path:'#566b40', fog:'#152014', propA:['cyl','#3a4a2c'], propB:['cone','#9fd36b'], stone:'#5a6a48', hazard:'#1f3324' },
    wasteland:{ ground:'#4a4640', path:'#7a756c', fog:'#24221f', propA:['box','#6a655c'], propB:['cone','#e8e2d6'], stone:'#8a857c', hazard:null },
    storm:    { ground:'#2e3550', path:'#5f6a92', fog:'#171c30', propA:['hex','#4a5272'], propB:['gem','#7fb3ff'], stone:'#6a7398', hazard:null },
    void:     { ground:'#120f1c', path:'#3a2f55', fog:'#07050c', propA:['gem','#1e1830'], propB:['gem8','#ff4d7a'], stone:'#3d3458', hazard:'#000000' },
    night:    { ground:'#141a2c', path:'#3a4466', fog:'#080b16', propA:['cyl','#2a3150'], propB:['gem','#ffc145'], stone:'#4a5372', hazard:null },
    forest:   { ground:'#223a24', path:'#5d6e3c', fog:'#101c12', propA:['cone','#1f4a28'], propB:['cyl','#4a3a28'], stone:'#6a7458', hazard:null },
    blossom:  { ground:'#3a4a36', path:'#c9a0a8', fog:'#2a2030', propA:['cone','#ff9ec7'], propB:['cyl','#5a3a3a'], stone:'#b8a0a8', hazard:'#4a8fa8' },
    crater:   { ground:'#3a3030', path:'#6e5a50', fog:'#1c1414', propA:['gem8','#6e5a50'], propB:['gem','#ffe08a'], stone:'#8a7468', hazard:'#ffb347' },
    bazaar:   { ground:'#4a3a2a', path:'#9a7a52', fog:'#241a10', propA:['box','#ff7a59'], propB:['box','#4fc3f7'], stone:'#a88a62', hazard:null },
    celestial:{ ground:'#5a5a78', path:'#e8e2d6', fog:'#3a3a58', propA:['cyl','#fff3c4'], propB:['gem','#ffd166'], stone:'#d8d4e8', hazard:'#9fe7ff' },
    library:  { ground:'#3a2e24', path:'#8a7458', fog:'#1c140e', propA:['box','#6b4a2a'], propB:['box','#e8e2d6'], stone:'#9a8468', hazard:null },
    fungal:   { ground:'#22182e', path:'#4e3a64', fog:'#100a18', propA:['cyl','#c08bff'], propB:['cone','#7ef2ff'], stone:'#5e4a74', hazard:'#3a1f4a' }
  };
  const RADIUS = 92, SPAWN = [0, 80], NPC_POS = [6, 76], BACK_POS = [-14, 84];
  const MARK_TYPES = ['tower','arch','ring','tree','statue','dome','obelisk','pool'];

  let ok = null, canvas, wrap, labelsBox, mini;
  let statics = [], colliders = [], ents = [], enemies = [], pools = [], PATH = [], shrinePos = [], nextPos = [0, -82], towns = [];
  const TOWN_C = [0, 68];
  const inTown = (x, z, pad = 0) => towns.some(t => dist(x, z, t.x, t.z) < t.r + pad);
  const townAt = (x, z) => towns.find(t => dist(x, z, t.x, t.z) < t.r);
  const R = { w:1, px:0, pz:0, ry:Math.PI, yaw:0, moving:0, t:0, grace:2, log:[], keys:new Set(), jx:0, jy:0, near:null, foe:null, lastSave:0, lastNet:0 };

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  function segDist(px, pz, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
    return dist(px, pz, a[0] + dx * t, a[1] + dz * t);
  }
  const nearPath = (x, z) => Math.min(...PATH.slice(1).map((b, i) => segDist(x, z, PATH[i], b)));
  const LOG_MAX = 100;
  function say(msg, kind) {
    R.log.push([kind || 'sys', msg]); if (R.log.length > LOG_MAX) R.log.shift();
    updateHud();
  }
  const unlockedWorld = () => clamp(S.worldsCleared + 1, 1, DV.WORLDS.length);
  const bossShort = W => W.boss.split(',')[0];

  // ---------- realm build ----------
  function build(w) {
    R.w = w; const W = DV.WORLDS[w - 1], T = BIOMES[W.biome] || BIOMES.meadow, rand = seeded(w * 7919);
    statics = []; colliders = []; ents = []; pools = [];
    // winding path: spawn → 5 shrines → next-realm portal
    const zs = [56, 26, -4, -34, -62]; let side = rand() < .5 ? -1 : 1;
    shrinePos = zs.map(z => { side = -side; return [side * (12 + rand() * 26), z]; });
    nextPos = [shrinePos[4][0] * .35, -82];
    PATH = [SPAWN, ...shrinePos, nextPos];
    // civilization: the realm's town (around the entrance) and a waystation halfway along the shrine road
    const TI = townInfo(w);
    const a1 = shrinePos[1], a2 = shrinePos[2], mx = (a1[0] + a2[0]) / 2, mz = (a1[1] + a2[1]) / 2, dx0 = a2[0] - a1[0], dz0 = a2[1] - a1[1], l0 = Math.hypot(dx0, dz0);
    let px = -dz0 / l0, pz = dx0 / l0; if (Math.hypot(mx + px * 14, mz + pz * 14) > Math.hypot(mx - px * 14, mz - pz * 14)) { px = -px; pz = -pz; }
    towns = [{ kind:'town', name:TI.town, x:TOWN_C[0], z:TOWN_C[1], r:15 }, { kind:'outpost', name:TI.outpost, x:mx + px * 14, z:mz + pz * 14, r:10 }];
    statics.push({ mesh:'disc', sx:2 * (RADIUS + 12), sy:.01, sz:2 * (RADIUS + 12), y:-.01, color:T.ground });
    PATH.slice(1).forEach((b, i) => {
      const a = PATH[i], len = dist(a[0], a[1], b[0], b[1]);
      statics.push({ mesh:'box', x:(a[0] + b[0]) / 2, y:.005, z:(a[1] + b[1]) / 2, ry:Math.atan2(b[0] - a[0], b[1] - a[1]), sx:3.6, sy:.02, sz:len + 3.6, color:T.path });
    });
    // landmarks: mark 0 near the start, the rest spread out
    const marks = [];
    W.marks.forEach((name, i) => {
      let x, z, n = 0;
      do {
        if (i === 0) { x = TOWN_C[0] - Math.sign(shrinePos[0][0]) * 6; z = TOWN_C[1] - 1; break; }   // the town's monument
        const r = 28 + rand() * 52, a = rand() * Math.PI * 2; x = Math.cos(a) * r; z = Math.sin(a) * r;
        n++;
      } while (n < 300 && (nearPath(x, z) < 10 || marks.some(m => dist(x, z, m.x, m.z) < 24) || shrinePos.some(s => dist(x, z, s[0], s[1]) < 20) || inTown(x, z, 12)));
      const type = MARK_TYPES[(hashStr(name) + i) % MARK_TYPES.length];
      const m = { kind:'mark', i, name, type, x, z, r:3.2, label:name };
      marks.push(m); ents.push(m); colliders.push([x, z, type === 'pool' ? 3.6 : 2.6]);
    });
    // hazard pools (lava, deep water, void…)
    if (T.hazard) for (let i = 0, tries = 0; i < 7 && tries < 400; tries++) {
      const r = 20 + rand() * 66, a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 4 + rand() * 5;
      if (nearPath(x, z) < s + 5 || marks.some(m => dist(x, z, m.x, m.z) < s + 8) || inTown(x, z, s + 5)) continue;
      i++; pools.push([x, z, s]); colliders.push([x, z, s * .5]);
      statics.push({ mesh:'disc', x, y:.02, z, sx:s, sy:.02, sz:s, color:T.hazard, e:.55 });
    }
    // props
    for (let i = 0, tries = 0; i < 260 && tries < 4000; tries++) {
      const r = Math.sqrt(rand()) * 88, t = rand() * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r;
      if (nearPath(x, z) < 4.8 || inTown(x, z, 2) || marks.some(m => dist(x, z, m.x, m.z) < 6) || pools.some(p => dist(x, z, p[0], p[1]) < p[2] * .6 + 1)) continue;
      i++;
      const [mesh, c0] = rand() < .55 ? T.propA : T.propB, color = rand() < .12 ? W.hue : c0, s = .6 + rand() * 1.7;
      const tall = ['cone','gem','gem8','cyl'].includes(mesh) ? 1.5 + rand() * 1.6 : .6 + rand() * .8;
      statics.push({ mesh, x, z, ry:rand() * 6, sx:s, sy:s * tall, sz:s, color, e: mesh.startsWith('gem') ? .15 : 0 });
      if (s > .9) colliders.push([x, z, s * .45]);
    }
    for (let i = 0; i < 64; i++) {
      const t = i / 64 * Math.PI * 2, r = RADIUS + 4 + rand() * 6, s = 4 + rand() * 4;
      statics.push({ mesh:'gem', x:Math.cos(t) * r, z:Math.sin(t) * r, ry:rand() * 6, sx:s, sy:s * (2 + rand() * 2), sz:s, color:T.stone });
    }
    // shrines
    shrinePos.forEach(([x, z], s) => {
      const boss = s === 4;
      ents.push({ kind:'shrine', s, x, z, r:boss ? 2.4 : 1.7, label:boss ? `♛ ${bossShort(W)}` : DV.STAGE_NAMES[s] });
      colliders.push([x, z, boss ? 2.2 : 1.5]);
    });
    // chests
    for (let i = 0; i < 4; i++) {
      let x, z, n = 0;
      do { const r = 15 + rand() * 70, t = rand() * Math.PI * 2; x = Math.cos(t) * r; z = Math.sin(t) * r; n++; }
      while ((nearPath(x, z) < 6 || inTown(x, z, 4) || colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 2) || pools.some(p => dist(x, z, p[0], p[1]) < p[2])) && n < 300);
      ents.push({ kind:'chest', key:`${w}-${i}`, x, z, r:1 }); colliders.push([x, z, .8]);
    }
    buildTowns(W, T, TI, rand, marks[0]);
    // lore stone beside its landmark
    if (W.lore) { const m = marks[W.lore.mark]; ents.push({ kind:'lore', x:m.x + 4.2, z:m.z + 1.5, r:1.2, label:'Lore stone' }); }
    // hidden companion beside their landmark
    if (W.hidden) { const C = DV.COMPANIONS[W.hidden], m = marks[C.mark]; ents.push({ kind:'hidden', id:W.hidden, x:m.x - 4, z:m.z - 2.5, r:1.3, label:C.name }); }
    // portals
    ents.push({ kind:'portal', dir:1, x:nextPos[0], z:nextPos[1], r:2.4, label: w < DV.WORLDS.length ? `Gate to ${DV.WORLDS[w].name}` : 'Beyond the Lattice' });
    if (w > 1) ents.push({ kind:'portal', dir:-1, x:BACK_POS[0], z:BACK_POS[1], r:2.4, label:`Gate to ${DV.WORLDS[w - 2].name}` });
    // roaming foes: along the path and near landmarks, levelled to the nearest shrine
    const er = seeded(w * 104729); enemies = [];
    const nearestStage = (x, z) => { let b = 0, d = Infinity; shrinePos.forEach((p, s) => { const q = dist(x, z, p[0], p[1]); if (q < d) { d = q; b = s; } }); return Math.min(3, b); };
    const homes = [];
    for (let i = 0; i < 10; i++) {
      const seg = Math.min(4, Math.floor(i / 2)), a = PATH[seg], b = PATH[seg + 1], u = er(), off = (6 + er() * 7) * (er() < .5 ? -1 : 1);
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      homes.push([a[0] + dx * u + (-dz / l) * off, a[1] + dz * u + (dx / l) * off]);
    }
    marks.slice(1).forEach(m => homes.push([m.x + 8 * (er() - .5), m.z + 8]));
    homes.forEach(([hx, hz], i) => {
      towns.forEach(t => { const d = dist(hx, hz, t.x, t.z); if (d < t.r + 6) { hx = t.x + (hx - t.x) / (d || 1) * (t.r + 6); hz = t.z + (hz - t.z) / (d || 1) * (t.r + 6); } });
      const stage = nearestStage(hx, hz), lvl = Math.max(1, stageLevel(w, stage) - (er() < .5 ? 1 : 0));
      enemies.push({ id:`${w}-e${i}`, foe:W.foes[Math.min(3, Math.floor(er() * (stage + 2)))], lvl, hx, hz, x:hx, z:hz, tx:hx, tz:hz, ry:0, dead:0, seen:false });
    });
    Online.presence.join(w);
  }

  // Houses, barrier posts and townsfolk for both settlements.
  function buildTowns(W, T, TI, rand, monument) {
    const roof = W.hue, wall = T.stone, F = TI.folk;
    towns.forEach(t => {
      statics.push({ mesh:'disc', x:t.x, y:.015, z:t.z, sx:t.r * 2, sy:.01, sz:t.r * 2, color:W.hue, e:.3, a:.12 });
      const posts = Math.round(2 * Math.PI * t.r / 4.5);
      for (let i = 0; i < posts; i++) {
        const a = i / posts * Math.PI * 2, x = t.x + Math.cos(a) * t.r, z = t.z + Math.sin(a) * t.r;
        if (nearPath(x, z) < 2.4) continue;   // leave the road open as a gate
        statics.push({ mesh:'hex', x, z, sx:.5, sy:1.5, sz:.5, color:wall });
        statics.push({ mesh:'gem', x, y:1.5, z, sx:.42, sy:.6, sz:.42, color:W.hue, e:.85 });
      }
      const houses = t.kind === 'town' ? 9 : 4, spots = [];
      for (let i = 0, tries = 0; i < houses && tries < 200; tries++) {
        const a = rand() * Math.PI * 2, rr = t.r * (.55 + rand() * .25), x = t.x + Math.cos(a) * rr, z = t.z + Math.sin(a) * rr;
        if (nearPath(x, z) < 5 || spots.some(p => dist(x, z, p[0], p[1]) < 5.2) || (monument && t.kind === 'town' && dist(x, z, monument.x, monument.z) < 7)) continue;
        i++; spots.push([x, z]);
        const ry = Math.atan2(t.x - x, t.z - z), w = 2.8 + rand() * 1.2, h = 2 + rand() * 1.2;
        statics.push({ mesh:'box', x, z, ry, sx:w, sy:h, sz:w * .9, color:wall });
        statics.push({ mesh: W.biome === 'crystal' || W.biome === 'celestial' ? 'gem' : 'cone', x, y:h, z, ry, sx:w * 1.35, sy:1.8, sz:w * 1.25, color:roof, e:.08 });
        const [fx, fz] = rotOff(x, z, ry, 0, w * .46);
        statics.push({ mesh:'box', x:fx, z:fz, ry, sx:.8, sy:1.3, sz:.1, color:'#2a1c12' });
        statics.push({ mesh:'box', x:fx + .9 * Math.cos(ry), y:1.2, z:fz - .9 * Math.sin(ry), ry, sx:.5, sy:.5, sz:.1, color:'#ffd27a', e:.9 });
        colliders.push([x, z, w * .62]);
      }
      if (t.kind === 'outpost') {
        statics.push({ mesh:'cyl', x:t.x, z:t.z, sx:1.6, sy:.35, sz:1.6, color:wall });
        statics.push({ mesh:'gem', x:t.x, y:.35, z:t.z, sx:1, sy:1.4, sz:1, color:'#ff9a3d', e:1 });
        colliders.push([t.x, t.z, 1]);
        ents.push({ kind:'sign', x:t.x, z:t.z, r:0, label:t.name });
      }
      // townsfolk, spread on an inner ring away from the road and the houses
      const roles = t.kind === 'town'
        ? [['quest', W.quest.giver], ['warden', F.warden], ['elder', F.elder], ['merchant', F.merchant], ['innkeeper', F.innkeeper], ['citizen', F.citizen]]
        : [['keeper', F.keeper], ['trader', F.trader]];
      let ang = rand() * Math.PI * 2;
      roles.forEach(([role, name]) => {
        let x, z, n = 0;
        do { ang += .9 + rand() * .5; const rr = t.r * (t.kind === 'town' ? .32 : .4) + rand() * 2; x = t.x + Math.cos(ang) * rr; z = t.z + Math.sin(ang) * rr; n++; }
        while (n < 60 && (nearPath(x, z) < 2.2 || colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 1.2) || ents.some(e => (e.kind === 'villager' || e.kind === 'npc') && dist(x, z, e.x, e.z) < 3)));
        const label = name in DV.SPEAKERS ? DV.SPEAKERS[name] : name;
        ents.push(role === 'quest' ? { kind:'npc', who:name, x, z, r:1.4, label } : { kind:'villager', role, name, x, z, r:1.3, label });
        colliders.push([x, z, .6]);
      });
    });
  }
  const ROLE = { warden:'Town Warden', elder:'Elder', merchant:'Merchant', innkeeper:'Innkeeper', citizen:'Townsperson', keeper:'Waystation Keeper', trader:'Road Trader' };
  const ROLE_COLOR = { warden:'#ff7a59', elder:'#c3a6ff', merchant:'#ffc145', innkeeper:'#8fe3b0', citizen:'#9aa3b5', keeper:'#5fb3ff', trader:'#ffd166' };
  function reqFor(n) { const T = townInfo(R.w); return n.role === 'warden' ? T.bounty : n.role === 'elder' ? T.errand : null; }

  function placePlayer(at) { const p = at || SPAWN; R.px = p[0]; R.pz = p[1]; R.ry = Math.PI; R.yaw = 0; R.grace = 2; }
  function savePos() { S.realm = { w:R.w, x:+R.px.toFixed(2), z:+R.pz.toFixed(2) }; save(); }
  function travel(w, at) {
    build(w); placePlayer(at); savePos(); render();
    const W = DV.WORLDS[w - 1];
    say(`Through the gate: ${W.name}, ${W.sub}.`, 'sys');
    if (!S.seen['w' + w]) { S.seen['w' + w] = 1; save(); playDialogue(W.intro); }
  }

  // ---------- models ----------
  function rotOff(x, z, ry, dx, dz) { const c = Math.cos(ry), s = Math.sin(ry); return [x + dx * c + dz * s, z - dx * s + dz * c]; }
  function shadow(x, z, s) { Gfx.draw({ mesh:'disc', x, y:.03, z, sx:s, sy:.01, sz:s, color:'#000000', a:.35 }); }
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
    return { skin:L.skin[S.look.skin], hair:L.hair[S.look.hair], outfit:L.outfit[S.look.outfit], legs:'#1c2033', accent:cls.color, long:S.look.hairStyle === 1, weapon:cls.main === 'mag' ? 1.6 : 1.1 };
  }
  const npcColors = col => ({ skin:'#e8b896', hair:'#2a2233', outfit:col, legs:'#22263a', accent:'#ffffff' });
  function drawEnemy(e, t) {
    shadow(e.x, e.z, 1.3);
    const bob = Math.sin(t * 3 + e.hx) * .12;
    Gfx.draw({ mesh:'gem8', x:e.x, y:.25 + bob, z:e.z, ry:t * .8 + e.hx, sx:1.2, sy:1.7, sz:1.2, color:'#2a1530' });
    Gfx.draw({ mesh:'gem', x:e.x, y:.75 + bob, z:e.z, ry:-t * 1.4, sx:.6, sy:.8, sz:.6, color:'#ff4d7a', e:.9 });
    [-.2, .2].forEach(dx => { const [a, b] = rotOff(e.x, e.z, e.ry, dx, .52); Gfx.draw({ mesh:'box', x:a, y:1.25 + bob, z:b, ry:e.ry, sx:.12, sy:.14, sz:.08, color:'#ff4d7a', e:1 }); });
  }
  function drawMark(n, T, W, t) {
    const x = n.x, z = n.z, st = T.stone, hue = W.hue, seen = !!S.marks[markKey(R.w, n.i)];
    switch (n.type) {
      case 'tower': Gfx.draw({ mesh:'hex', x, z, sx:3.6, sy:9, sz:3.6, color:st }); Gfx.draw({ mesh:'cone', x, y:9, z, sx:4.4, sy:3.5, sz:4.4, color:hue, e:.25 }); break;
      case 'arch': [-2.4, 2.4].forEach(d => Gfx.draw({ mesh:'box', x:x + d, z, sx:1.2, sy:6, sz:1.2, color:st })); Gfx.draw({ mesh:'box', x, y:6, z, sx:6.2, sy:1.1, sz:1.4, color:st }); Gfx.draw({ mesh:'gem', x, y:7.1, z, sx:1, sy:1.4, sz:1, color:hue, e:.6 }); break;
      case 'ring': for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; Gfx.draw({ mesh:'box', x:x + Math.cos(a) * 3.2, z:z + Math.sin(a) * 3.2, ry:a, sx:.9, sy:3.4, sz:.5, color:st }); } Gfx.draw({ mesh:'disc', x, y:.04, z, sx:3, sy:.02, sz:3, color:hue, e:.4, a:.7 }); break;
      case 'tree': Gfx.draw({ mesh:'cyl', x, z, sx:1.6, sy:6, sz:1.6, color:'#5a4030' }); [0, 1, 2].forEach(i => Gfx.draw({ mesh:'gem8', x:x + (i - 1) * 1.8, y:5 + (i % 2) * 1.5, z:z + (i - 1) * .8, sx:4, sy:4.5, sz:4, color:hue, e:.12 })); break;
      case 'statue': Gfx.draw({ mesh:'box', x, z, sx:3, sy:1.6, sz:3, color:st }); Gfx.draw({ mesh:'gem8', x, y:1.6, z, ry:.4, sx:1.6, sy:5.4, sz:1.6, color:st }); Gfx.draw({ mesh:'gem', x, y:6.6, z, sx:.8, sy:1.1, sz:.8, color:hue, e:.6 }); break;
      case 'dome': Gfx.draw({ mesh:'hex', x, z, sx:6, sy:2.4, sz:6, color:st }); Gfx.draw({ mesh:'gem8', x, y:1.4, z, sx:6.4, sy:4, sz:6.4, color:hue, e:.18 }); break;
      case 'obelisk': Gfx.draw({ mesh:'box', x, z, sx:1.6, sy:11, sz:1.6, color:st }); Gfx.draw({ mesh:'gem', x, y:11, z, ry:t, sx:1.2, sy:1.6, sz:1.2, color:hue, e:.7 + Math.sin(t * 2) * .2 }); break;
      case 'pool': Gfx.draw({ mesh:'disc', x, y:.03, z, sx:6.4, sy:.02, sz:6.4, color:hue, e:.6, a:.85 }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; Gfx.draw({ mesh:'gem', x:x + Math.cos(a) * 3.8, z:z + Math.sin(a) * 3.8, sx:.8, sy:1.6, sz:.8, color:st }); } break;
    }
    if (!seen) Gfx.draw({ mesh:'gem', x, y:13 + Math.sin(t * 2) * .3, z, ry:t * 1.5, sx:.7, sy:1, sz:.7, color:'#ffc145', e:.9 });
  }
  function drawEnt(n, T, W, t) {
    if (n.kind === 'mark') return drawMark(n, T, W, t);
    if (n.kind === 'shrine') {
      const boss = n.s === 4, k = boss ? 1.45 : 1, done = !!S.cleared[stageKey(R.w, n.s)], open = stageOpen(R.w, n.s);
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
      n.ry = Math.atan2(R.px - n.x, R.pz - n.z);
      humanoid(n.x, n.z, n.ry, npcColors(speakerColor(n.who)), 0, t);
      if (!S.qdone[R.w]) Gfx.draw({ mesh:'gem', x:n.x, y:2.6 + Math.sin(t * 3) * .12, z:n.z, ry:t * 2, sx:.35, sy:.5, sz:.35, color:'#ffc145', e:1 });
    } else if (n.kind === 'villager') {
      n.ry = dist(n.x, n.z, R.px, R.pz) < 12 ? Math.atan2(R.px - n.x, R.pz - n.z) : (n.ry || 0);
      humanoid(n.x, n.z, n.ry, npcColors(ROLE_COLOR[n.role]), 0, t);
      const q = reqFor(n), st = q && tqState(q.key).st;
      if (st === 'new' || st === 'return') Gfx.draw({ mesh:'gem', x:n.x, y:2.6 + Math.sin(t * 3) * .12, z:n.z, ry:t * 2, sx:.35, sy:.5, sz:.35, color: st === 'return' ? '#6fe3a1' : '#ffc145', e:1 });
    } else if (n.kind === 'sign') {
      return;
    } else if (n.kind === 'lore') {
      Gfx.draw({ mesh:'hex', x:n.x, z:n.z, sx:1.2, sy:.9, sz:1.2, color:T.stone });
      Gfx.draw({ mesh:'gem', x:n.x, y:.9 + Math.sin(t * 2) * .1, z:n.z, ry:t, sx:.6, sy:.9, sz:.6, color: S.lore[R.w] ? '#5a6078' : '#ffe08a', e: S.lore[R.w] ? 0 : .9 });
    } else if (n.kind === 'hidden') {
      if (compJoined(n.id)) return;
      n.ry = Math.atan2(R.px - n.x, R.pz - n.z);
      humanoid(n.x, n.z, n.ry, npcColors(DV.CLASSES[DV.COMPANIONS[n.id].cls].color), 0, t);
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
    const real = Math.min(1, (now - last) / 1000 || 0), dt = Math.min(.05, real); last = now;   // movement uses a capped step; healing uses real time
    if (!active()) return;
    R.t += dt; R.grace = Math.max(0, R.grace - dt);
    let ix = R.jx, iy = R.jy;
    if (R.keys.has('a') || R.keys.has('arrowleft')) ix -= 1; if (R.keys.has('d') || R.keys.has('arrowright')) ix += 1;
    if (R.keys.has('w') || R.keys.has('arrowup')) iy -= 1; if (R.keys.has('s') || R.keys.has('arrowdown')) iy += 1;
    const il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; }
    R.moving = Math.min(1, il);
    if (R.moving > .05) {
      const fx = -Math.sin(R.yaw), fz = -Math.cos(R.yaw), rx = Math.cos(R.yaw), rz = -Math.sin(R.yaw);
      const mx = rx * ix + fx * -iy, mz = rz * ix + fz * -iy, sp = 9 * dt;
      R.px += mx * sp; R.pz += mz * sp; R.ry = Math.atan2(mx, mz);
      colliders.forEach(([cx, cz, cr]) => { const d = dist(R.px, R.pz, cx, cz), m = cr + .45; if (d < m && d > 0) { R.px = cx + (R.px - cx) / d * m; R.pz = cz + (R.pz - cz) / d * m; } });
      const r = Math.hypot(R.px, R.pz); if (r > RADIUS) { R.px *= RADIUS / r; R.pz *= RADIUS / r; }
      if (R.t - R.lastSave > 3) { R.lastSave = R.t; savePos(); }
    }
    // town barriers: heal 1% of max HP per second while inside
    const town = townAt(R.px, R.pz);
    if (town !== R.town) {
      if (town) say(`You enter ${town.name}. Inside the barrier your wounds mend: 1% of max HP each second.`, 'you');
      else if (R.town) say(`You leave ${R.town.name}.`, 'sys');
      R.town = town; updateVitals();
    }
    if (town && healParty(.01 * real)) { R.healT = (R.healT || 0) + dt; if (R.healT > .25) { R.healT = 0; updateVitals(); } if (R.t - R.lastSave > 3) { R.lastSave = R.t; save(); } }
    if (R.t - R.lastNet > 2) { R.lastNet = R.t; Online.presence.update({ x:R.px, z:R.pz, ry:R.ry }); }
    // landmark discovery
    ents.forEach(n => {
      if (n.kind !== 'mark' || S.marks[markKey(R.w, n.i)] || dist(n.x, n.z, R.px, R.pz) > 7) return;
      visitMark(R.w, n.i); say(`Discovered: ${n.name}.`, 'you'); toast(`Landmark discovered: ${n.name}`);
      const q = checkQuest(R.w); if (q) questDone(q);
    });
    ents.forEach(n => { if (n.kind !== 'mark' || dist(n.x, n.z, R.px, R.pz) > 7) return;
      const e = tqReachMark(R.w, n.i); if (e) { say(`You deliver ${e.item} at ${n.name}. Return to ${e.giver} in ${townInfo(R.w).town}.`, 'you'); toast('Errand delivered. Return to town.'); } });
    // foes
    const W = DV.WORLDS[R.w - 1], T = BIOMES[W.biome] || BIOMES.meadow;
    let foe = null, foeD = 4.5;
    for (const e of enemies) {
      if (e.dead) { if (Date.now() > e.dead) { e.dead = 0; e.x = e.hx; e.z = e.hz; } else continue; }
      const dp = dist(e.x, e.z, R.px, R.pz), dh = dist(e.x, e.z, e.hx, e.hz);
      let sp = 1.6;
      if (dp < 7 && dh < 13 && R.grace <= 0 && !R.town) { e.tx = R.px; e.tz = R.pz; sp = 3.4; }
      else if (dist(e.x, e.z, e.tx, e.tz) < .5 || dh > 13) { const a = Math.random() * 6.28, r = Math.random() * 5; e.tx = e.hx + Math.cos(a) * r; e.tz = e.hz + Math.sin(a) * r; }
      const dx = e.tx - e.x, dz = e.tz - e.z, l = Math.hypot(dx, dz);
      if (l > .1) { e.x += dx / l * sp * dt; e.z += dz / l * sp * dt; e.ry = Math.atan2(dx, dz); }
      towns.forEach(t => { const d = dist(e.x, e.z, t.x, t.z); if (d < t.r + 1) { e.x = t.x + (e.x - t.x) / (d || 1) * (t.r + 1); e.z = t.z + (e.z - t.z) / (d || 1) * (t.r + 1); e.tx = e.hx; e.tz = e.hz; } });   // foes cannot cross a barrier
      if (dp < 9 && !e.seen) { e.seen = true; say(`You encounter a ${e.foe}! (Lv ${e.lvl})`, 'foe'); }
      if (dp > 16) e.seen = false;
      if (dp < foeD) { foe = e; foeD = dp; }
      if (dp < 1.3 && R.grace <= 0) { engage(e, false); return; }
    }
    let near = null, nd = Infinity;
    ents.forEach(n => { if (n.kind === 'mark' || n.kind === 'sign' || (n.kind === 'hidden' && compJoined(n.id))) return; const d = dist(n.x, n.z, R.px, R.pz) - n.r; if (d < 2.4 && d < nd) { near = n; nd = d; } });
    if (near !== R.near || foe !== R.foe) { R.near = near; R.foe = foe; updateButtons(); }
    // draw
    const D = 11, H = 7.5, eye = [R.px + Math.sin(R.yaw) * D, H, R.pz + Math.cos(R.yaw) * D];
    Gfx.frame(eye, [R.px, 1.3, R.pz], T.fog, [34, 90]);
    statics.forEach(Gfx.draw);
    ents.forEach(n => drawEnt(n, T, W, R.t));
    enemies.forEach(e => { if (!e.dead) drawEnemy(e, R.t); });
    Online.peers.forEach(p => humanoid(p.x, p.z, p.ry, npcColors(DV.CLASSES[p.cls] ? DV.CLASSES[p.cls].color : '#7ef2ff'), 0, R.t));
    humanoid(R.px, R.pz, R.ry, heroColors(), R.moving, R.t);
    drawLabels();
    if (Math.floor(R.t * 6) !== Math.floor((R.t - dt) * 6)) drawMap(mini, false);
  }
  const labelEls = new Map();
  function labelFor(n) {
    if (n.kind === 'shrine') return n.label + (S.cleared[stageKey(R.w, n.s)] ? ' ✓' : stageOpen(R.w, n.s) ? ` · Lv ${stageLevel(R.w, n.s)}` : ' · Sealed');
    if (n.kind === 'mark') return n.label + (S.marks[markKey(R.w, n.i)] ? ' ✓' : '');
    if (n.kind === 'hidden') return compJoined(n.id) ? null : dist(n.x, n.z, R.px, R.pz) < 10 ? n.label : '???';
    if (n.kind === 'lore') return S.lore[R.w] ? null : dist(n.x, n.z, R.px, R.pz) < 14 ? n.label : null;
    if (n.kind === 'npc') return dist(n.x, n.z, R.px, R.pz) > 8 ? null : n.label + (S.qdone[R.w] ? '' : ' · Quest');
    if (n.kind === 'villager') { if (dist(n.x, n.z, R.px, R.pz) > 6) return null; const q = reqFor(n), st = q && tqState(q.key).st;
      return `${n.label} · ${ROLE[n.role]}${st === 'new' ? ' · Request' : st === 'return' ? ' · Turn in' : ''}`; }
    if (n.kind === 'sign') return n.label;
    return n.label;
  }
  function drawLabels() {
    const seen = new Set();
    ents.forEach((n, i) => {
      const text = labelFor(n); if (!text) return;
      const d = dist(n.x, n.z, R.px, R.pz); if (d > 40) return;
      const h = n.kind === 'shrine' ? (n.s === 4 ? 6.4 : 4.6) : n.kind === 'mark' ? 9 : n.kind === 'portal' ? 4.4 : n.kind === 'sign' ? 3.4 : 2.6;
      const p = Gfx.project(n.x, h, n.z); if (!p || p.y < 26) return;
      let el = labelEls.get(i);
      if (!el) { el = document.createElement('div'); el.className = 'rw-label'; labelsBox.appendChild(el); labelEls.set(i, el); }
      if (el.textContent !== text) el.textContent = text;
      el.classList.toggle('mark', n.kind === 'mark');
      el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
      el.style.opacity = d > 30 ? (40 - d) / 10 : 1;
      el.hidden = false; seen.add(i);
    });
    labelEls.forEach((el, i) => { if (!seen.has(i)) el.hidden = true; });
  }

  // ---------- map (minimap + full map share one renderer) ----------
  function drawMap(cv, full) {
    if (!cv || !cv.isConnected) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), size = cv.clientWidth;
    if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
    const g = cv.getContext('2d'), W = DV.WORLDS[R.w - 1], T = BIOMES[W.biome] || BIOMES.meadow, k = size / (2 * (RADIUS + 6));
    const P = (x, z) => [size / 2 + x * k, size / 2 + z * k];
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
    g.fillStyle = T.ground; g.beginPath(); g.arc(size / 2, size / 2, RADIUS * k, 0, Math.PI * 2); g.fill();
    g.strokeStyle = T.stone; g.lineWidth = 1.5; g.stroke();
    towns.forEach(t => { const [a, b] = P(t.x, t.z); g.beginPath(); g.arc(a, b, t.r * k, 0, Math.PI * 2); g.fillStyle = W.hue + '40'; g.fill(); g.strokeStyle = W.hue; g.lineWidth = 1.5; g.stroke(); });
    pools.forEach(([x, z, s]) => { const [a, b] = P(x, z); g.fillStyle = T.hazard; g.beginPath(); g.arc(a, b, s / 2 * k, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = T.path; g.lineWidth = Math.max(2, 3.4 * k); g.beginPath(); PATH.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke();
    const diamond = (x, z, r, fill, stroke) => { const [a, b] = P(x, z); g.beginPath(); g.moveTo(a, b - r); g.lineTo(a + r, b); g.lineTo(a, b + r); g.lineTo(a - r, b); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } };
    g.font = `600 ${full ? 12 : 8}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round';
    const text = (t, a, b) => { g.strokeStyle = '#0a0c19'; g.lineWidth = 3.5; g.strokeText(t, a, b); g.fillStyle = '#e9ecff'; g.fillText(t, a, b); };
    ents.forEach(n => {
      const [a, b] = P(n.x, n.z);
      if (n.kind === 'mark') { const v = S.marks[markKey(R.w, n.i)]; diamond(n.x, n.z, full ? 7 : 4, v ? W.hue : '#0a0c19', '#ffc145'); if (full) text(n.name, a, b - 11); }
      else if (n.kind === 'shrine') { const done = S.cleared[stageKey(R.w, n.s)], o = stageOpen(R.w, n.s); diamond(n.x, n.z, full ? 8 : 4.5, done ? W.hue : o ? '#ffffff' : '#3a3d4a', '#0a0c19'); if (full) { g.fillStyle = '#0a0c19'; g.fillText(n.s === 4 ? '♛' : n.s + 1, a, b + 4); text(stageName(R.w, n.s), a, b + 21); } }
      else if (n.kind === 'chest') { g.fillStyle = S.chests[n.key] ? '#5a4a3a' : '#ffc145'; g.fillRect(a - (full ? 4 : 2), b - (full ? 3 : 2), full ? 8 : 4, full ? 6 : 4); }
      else if (n.kind === 'npc') { g.fillStyle = '#7ef2ff'; g.beginPath(); g.arc(a, b, full ? 5 : 3, 0, Math.PI * 2); g.fill(); }
      else if (n.kind === 'portal') { g.strokeStyle = '#b07cff'; g.lineWidth = 2; g.strokeRect(a - (full ? 6 : 3), b - (full ? 6 : 3), full ? 12 : 6, full ? 12 : 6); if (full) text(n.label, a, b + 21); }
      else if (n.kind === 'villager') { g.fillStyle = ROLE_COLOR[n.role]; g.beginPath(); g.arc(a, b, full ? 3.5 : 2, 0, Math.PI * 2); g.fill(); }
      else if (n.kind === 'sign' && full) text(n.label, a, b - 12);
      else if (n.kind === 'lore' && S.lore[R.w]) { g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(a, b, full ? 3 : 2, 0, Math.PI * 2); g.fill(); }
    });
    if (full) enemies.forEach(e => { if (e.dead) return; const [a, b] = P(e.x, e.z); g.fillStyle = '#ff4d7a'; g.beginPath(); g.arc(a, b, 2.5, 0, Math.PI * 2); g.fill(); });
    const [px, pz] = P(R.px, R.pz), s = full ? 9 : 6;
    g.save(); g.translate(px, pz); g.rotate(-R.ry + Math.PI);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#0a0c19'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .7, s * .7); g.lineTo(0, s * .3); g.lineTo(-s * .7, s * .7); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  function mapSheet() {
    const W = DV.WORLDS[R.w - 1], found = W.marks.filter((_, i) => S.marks[markKey(R.w, i)]).length, opened = [0, 1, 2, 3].filter(i => S.chests[`${R.w}-${i}`]).length;
    openSheet(`<div class="eyebrow num">Realm ${W.id} · Map</div><h2>${esc(W.name)}</h2>
      <canvas class="rw-bigmap" id="bigMap" aria-label="Map of ${esc(W.name)}"></canvas>
      <div class="small muted map-key"><span><i class="k-mark"></i>Landmark (outline: unexplored)</span><span><i class="k-shrine"></i>Shrine</span><span><i class="k-chest"></i>Chest</span><span><i class="k-town"></i>Town (heals)</span><span><i class="k-npc"></i>Person</span><span><i class="k-gate"></i>Gate</span><span><i class="k-foe"></i>Foe</span></div>
      <div class="small">Landmarks found <b class="num">${found}/4</b> · Chests opened <b class="num">${opened}/4</b>${W.lore ? ` · Hidden story ${S.lore[R.w] ? '<b>found</b>' : '<span class="muted">not found</span>'}` : ''}${W.hidden ? ` · Someone is hiding here: ${compJoined(W.hidden) ? '<b>found</b>' : '<span class="muted">not found</span>'}` : ''}</div>`,
      () => requestAnimationFrame(() => drawMap($('#bigMap'), true)));
  }

  // ---------- actions ----------
  function engage(e, first) {
    savePos(); R.keys.clear(); R.jx = R.jy = 0;
    startEncounter(R.w, e.foe, e.lvl, first, e.id);
    openBattle();
  }
  function attack() {
    if (R.foe) return engage(R.foe, true);
    say('No foe in reach. Walk up to a corrupted foe, then Attack to strike first.', 'sys');
  }
  function questDone(q) { say(`Side quest complete: ${q.title}. +${q.reward.gold} gold, +${q.reward.dia} Diamonds.`, 'you'); toast(`Side quest complete: ${q.title}`); render(); }
  function interact() {
    const n = R.near, W = DV.WORLDS[R.w - 1];
    if (!n) return say('Nothing to interact with here. Walk up to a shrine, chest, gate, stone or person.', 'sys');
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
      const q = checkQuest(R.w); if (q) questDone(q);
    } else if (n.kind === 'npc') {
      questTalk(W);
    } else if (n.kind === 'villager') {
      villagerSheet(n, W);
    } else if (n.kind === 'lore') {
      if (S.lore[R.w]) return say(`You have read ${W.lore.title}.`, 'sys');
      const L = readLore(R.w), k = DV.SKILLS[L.skill];
      playDialogue([['narr', `${L.title}.`], ['narr', L.text], ['narr', `You learned the hidden skill ${k.name}: ${k.desc}`]], () => { render(); toast(`Hidden skill learned: ${k.name}`); });
      say(`Hidden story found: ${L.title}. Learned ${k.name}.`, 'you');
    } else if (n.kind === 'hidden') {
      const C = DV.COMPANIONS[n.id];
      playDialogue([[C.name, C.bio], [C.name, 'You came all this way to find me? Then I suppose I owe you my company. Let\'s go.']], () => {
        recruit(n.id); render(); toast(`${C.name} joined you! Manage your party in the Party tab.`);
      });
      say(`You found ${C.name}.`, 'you');
    } else if (n.kind === 'portal') {
      if (n.dir < 0) return travel(R.w - 1, [0, -74]);
      if (R.w >= DV.WORLDS.length) return say(S.worldsCleared >= R.w ? 'Beyond the Lattice, new realms are still forming.' : `The gate is dark until ${bossShort(W)} is defeated.`, 'sys');
      if (S.worldsCleared < R.w) return say(`The gate is out of tune. Defeat ${bossShort(W)} to steady this realm's note.`, 'sys');
      travel(R.w + 1, [BACK_POS[0] + 4, BACK_POS[1] - 5]);
    }
  }
  function questTalk(W) {
    const q = questState(W.id), giver = W.quest.giver;
    if (q.done) return playDialogue([[giver, W.quest.done]]);
    openSheet(`<div class="eyebrow">Side quest · ${esc(W.name)}</div><h2>${esc(W.quest.title)}</h2>
      <div class="small"><b>${esc(giver in DV.SPEAKERS ? DV.SPEAKERS[giver] : giver)}:</b> “${esc(W.quest.text)}”</div>
      <div class="card small"><b>Goal:</b> ${esc(questGoalText(W.id))} <span class="num muted">(${q.prog}/${q.need})</span>
        <div class="muted">Reward: ${W.quest.reward.gold.toLocaleString()} gold · ${W.quest.reward.dia} Diamonds · ${W.quest.reward.shards} shards</div></div>
      <button class="btn" id="hearIntro">Hear their story again</button>`, el => { el.querySelector('#hearIntro').onclick = () => { closeSheet(); playDialogue(W.intro); }; });
  }
  function afterBattle(field, outcome, w) {
    R.grace = 4;
    if (outcome === 'lose') {   // wake in the town of the realm where you fell
      if (w && w !== R.w) build(w);
      placePlayer([TOWN_C[0], TOWN_C[1] + 6]); savePos();
      say(`You wake in ${townInfo(R.w).town} with 25% HP. Rest inside the barrier to recover.`, 'sys');
      if (field) { const e = enemies.find(x => x.id === field.id); if (e) { e.x = e.hx; e.z = e.hz; } }
      return;
    }
    if (field) {
      const e = enemies.find(x => x.id === field.id);
      if (e && outcome === 'win') {
        e.dead = Date.now() + 60000; say(`${field.foe} is cleansed. More Rot will gather here in a minute.`, 'you');
      } else if (e) { e.x = e.hx; e.z = e.hz; e.tx = e.hx; e.tz = e.hz; say(outcome === 'flee' ? 'You slip away.' : 'You stagger back, battered but alive.', 'sys'); }
    } else if (outcome === 'win') say('The shrine glows clean.', 'you');
  }

  // ---------- townsfolk ----------
  function villagerSheet(n, W) {
    const T = townInfo(R.w), role = ROLE[n.role];
    if (n.role === 'citizen' || n.role === 'keeper') return playDialogue(villagerTalk(R.w, n.role).map(t => [n.name, t]));
    if (n.role === 'merchant' || n.role === 'trader') {
      const items = shopItems().filter(it => n.role === 'merchant' || it.id !== 'chest');
      return openSheet(`<div class="eyebrow">${esc(role)} · ${esc(n.name)}</div><h2>${n.role === 'merchant' ? 'Town market' : 'Road goods'}</h2>
        <div class="small muted">“${esc(n.role === 'merchant' ? `Best prices in ${T.town}. Everything else is just further away.` : villagerTalk(R.w, 'trader')[0])}”</div>
        ${items.map(it => `<div class="card row"><div class="grow"><b>${it.name}</b><div class="small muted">${it.text}</div></div><button class="btn sm gold" data-tbuy="${it.id}" ${S.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()} g</button></div>`).join('')}
        <div class="small muted num">You have ${S.gold.toLocaleString()} gold · ${S.potions.hp} Facet Tonics · ${S.potions.mp} Mana Shards</div>`, el => {
        el.querySelectorAll('[data-tbuy]').forEach(b => b.onclick = () => { toast(buy(b.dataset.tbuy).msg); render(); villagerSheet(n, W); });
      });
    }
    if (n.role === 'innkeeper') {
      const hurt = partyHurt();
      return openSheet(`<div class="eyebrow">${esc(role)} · ${esc(n.name)}</div><h2>The inn</h2>
        <div class="small">“A bed, a hot meal and you're good as new. Or stand around inside the barrier for free; it mends you slower, but it mends you.”</div>
        <div class="small muted num">Party HP: ${['hero', ...S.party].map(k => `${k === 'hero' ? 'You' : DV.COMPANIONS[k].name} ${Math.round(vitOf(k) * 100)}%`).join(' · ')}</div>
        <button class="btn gold" id="innRest" ${hurt && S.gold >= innPrice() ? '' : 'disabled'}>${hurt ? `Rest until fully healed · ${innPrice().toLocaleString()} gold` : 'Everyone is already rested'}</button>`, el => {
        el.querySelector('#innRest').onclick = () => { const err = restAtInn(); if (err) return toast(err); closeSheet(); updateVitals(); render(); toast('You wake fully rested.'); say(`You rest at the inn in ${T.town}. Everyone is at full HP.`, 'you'); };
      });
    }
    const q = reqFor(n), st = tqState(q.key);
    const status = st.st === 'new' ? '' : st.st === 'active' ? (q.type === 'bounty' ? `<div class="card small">Progress: <b class="num">${st.prog}/${q.n}</b> ${esc(q.foe)}s defeated in the wilds of ${esc(W.name)}.</div>` : `<div class="card small">Take ${esc(q.item)} to <b>${esc(W.marks[q.mark])}</b>.</div>`)
      : st.st === 'return' ? '<div class="card small" style="color:var(--ok)">Done. Hand it in for your reward.</div>' : '<div class="card small muted">Completed. Thank you again.</div>';
    openSheet(`<div class="eyebrow">${esc(role)} · ${esc(T.town)}</div><h2>${q.type === 'bounty' ? `Bounty: ${esc(q.foe)}s` : 'An errand'}</h2>
      <div class="small"><b>${esc(n.name)}:</b> “${esc(q.text)}”</div>${status}
      <div class="small muted">Reward: ${q.reward.gold.toLocaleString()} gold · ${q.reward.dia} Diamonds · ${q.reward.shards} shards</div>
      ${st.st === 'new' ? '<button class="btn primary" id="tqGo">Accept</button>' : st.st === 'return' ? '<button class="btn gold" id="tqGo">Hand in</button>' : ''}`, el => {
      const b = el.querySelector('#tqGo'); if (!b) return;
      b.onclick = () => {
        if (st.st === 'new') { acceptTQ(q.key); say(`Accepted: ${q.type === 'bounty' ? `defeat ${q.n} ${q.foe}s` : `deliver ${q.item} to ${W.marks[q.mark]}`}.`, 'sys'); toast('Request accepted.'); }
        else { const done = turnInTQ(q.key, R.w); if (done) { say(`${n.name} pays you ${done.reward.gold} gold, ${done.reward.dia} Diamonds and ${done.reward.shards} shards.`, 'you'); toast('Request complete!'); } }
        closeSheet(); render();
      };
    });
  }
  function updateVitals() {
    const st = calcStats(), f = vitOf('hero'), t = $('#rwHpText'), b = $('#rwHpBar');
    if (t) t.textContent = `${Math.round(st.hp * f)}/${st.hp}`;
    if (b) b.style.width = Math.round(f * 100) + '%';
    const pp = $('#rwPartyHp'); if (pp) pp.textContent = S.party.map(k => `${DV.COMPANIONS[k].name} ${Math.round(vitOf(k) * 100)}%`).join(' · ');
    const c = $('#rwTown'); if (c) { c.hidden = !R.town; c.textContent = R.town ? `In ${R.town.name}: healing 1%/s` : ''; }
    const tb = $('#rwTonic'); if (tb) { tb.disabled = !S.potions.hp || f >= 1; tb.textContent = `Drink Tonic (${S.potions.hp})`; }
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
      : n.kind === 'npc' || n.kind === 'villager' ? `Talk to ${n.label}` : n.kind === 'lore' ? (S.lore[R.w] ? 'Read again' : 'Read the lore stone')
      : n.kind === 'hidden' ? 'Talk to the stranger' : n.kind === 'mark' ? n.name : n.label;
    i.classList.toggle('ready', !!n);
  }
  function updateHud() {
    const el = $('#rwLog'); if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    el.innerHTML = R.log.map(([k, m]) => `<div class="${k === 'foe' ? 'foe-l' : k}">– ${esc(m)}</div>`).join('') || '<div class="sys">– Explore. Shrines hold the stages; corrupted foes roam nearby.</div>';
    if (atBottom) el.scrollTop = el.scrollHeight;
    const c = $('#rwLogCount'); if (c) c.textContent = `${R.log.length}/${LOG_MAX}`;
  }

  // ---------- mount / input ----------
  function ensure() {
    if (ok !== null) return ok;
    wrap = document.createElement('div'); wrap.className = 'rw-canvas-wrap';
    canvas = document.createElement('canvas'); canvas.className = 'rw-canvas'; canvas.setAttribute('aria-label', 'Open world view');
    labelsBox = document.createElement('div'); labelsBox.className = 'rw-labels';
    mini = document.createElement('canvas'); mini.className = 'rw-mini'; mini.setAttribute('aria-label', 'Minimap. Tap to open the full map.');
    const mapBtn = document.createElement('button'); mapBtn.className = 'btn sm rw-mapbtn'; mapBtn.textContent = 'Map';
    wrap.append(canvas, labelsBox, mini, mapBtn);
    ok = Gfx.init(canvas);
    if (!ok) return false;
    mini.onclick = mapBtn.onclick = mapSheet;
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
      else if (k === 'm') mapSheet();
      else if (k === 'q') R.yaw += .3; else if (k === 'r') R.yaw -= .3;
    });
    window.addEventListener('keyup', e => R.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => R.keys.clear());
    const st = S.realm && S.realm.w <= unlockedWorld() ? S.realm : null;
    build(st ? st.w : unlockedWorld()); placePlayer(st ? [st.x, st.z] : null);
    say(`${DV.WORLDS[R.w - 1].name}. Follow the path to the shrines. Gold markers above landmarks show places you have not explored.`, 'sys');
    requestAnimationFrame(loop);
    return true;
  }
  function mount() {
    const box = $('#rwScene');
    if (!ensure()) { box.innerHTML = '<div class="rw-nogl">This device could not start the 3D view (WebGL is turned off or unsupported). The Story tab still has every stage.</div>'; return; }
    box.appendChild(wrap);
    const joy = $('#rwJoy'), knob = joy.querySelector('i'); let jid = null;
    const upd = e => { const r = joy.getBoundingClientRect(), R0 = r.width / 2 - 8; let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; } R.jx = dx / R0; R.jy = dy / R0; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    joy.onpointerdown = e => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); upd(e); };
    joy.onpointermove = e => { if (e.pointerId === jid) upd(e); };
    joy.onpointerup = joy.onpointercancel = e => { if (e.pointerId !== jid) return; jid = null; R.jx = R.jy = 0; knob.style.transform = ''; };
    $('#rwAttack').onclick = attack; $('#rwInteract').onclick = interact;
    $('#rwTravel').onclick = travelSheet; $('#rwMap').onclick = mapSheet;
    $('#rwTonic').onclick = () => { const err = drinkTonic(); if (err) return toast(err); updateVitals(); say('You drink a Facet Tonic.', 'you'); };
    R.town = townAt(R.px, R.pz); updateVitals();
    R.near = R.foe = undefined; updateHud(); requestAnimationFrame(() => drawMap(mini, false));
    const el = $('#rwLog'); el.scrollTop = el.scrollHeight;
  }
  function travelSheet() {
    const max = unlockedWorld();
    openSheet(`<div class="eyebrow">Rift Gates</div><h2>Travel between realms</h2>
      <div class="small muted">The Quorin gate network reaches every realm whose god rings in tune. Save a realm to open the gate beyond it.</div>
      ${DV.ARCS.map((A, ai) => `<h3>Arc ${ai + 1} · ${esc(A.name)}</h3>` + DV.WORLDS.slice(A.from - 1, A.from + 9).map(W => `<button class="opt ${W.id === R.w ? 'on' : ''} ${W.id > max ? 'sealed' : ''}" data-go="${W.id}" ${W.id > max ? 'disabled' : ''} style="border-left:4px solid ${W.hue}">
        <b class="num">${W.id}. ${W.id > max ? '???' : esc(W.name)}</b><span class="small muted">${W.id > max ? 'Gate out of tune' : realmStatus(W.id) + ' · ' + esc(W.sub)}</span></button>`).join('')).join('')}`, el => {
      el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closeSheet(); if (+b.dataset.go !== R.w) travel(+b.dataset.go); });
    });
  }
  return { mount, afterBattle, updateVitals, get world() { ensure(); return R.w; }, say, get _state() { return { R, enemies, ents, towns, build }; } };
})();

// ---------- World screen (mirrors the wireframe) ----------
SCREENS.world = st => {
  Realm.world;
  const W = DV.WORLDS[Realm.world - 1], o = DV.LOOK.origin.find(x => x.id === S.origin), at = a => S.attrs[a] + (o.bonus[a] || 0);
  const inv = DV.SLOTS.filter(sl => S.equip[sl]).map(sl => { const it = S.equip[sl];
    return `<li style="color:${DV.RARITY[it.rarity].color}">${esc(it.name)}${it.plus ? ' +' + it.plus : ''} <span class="muted">· ${DV.SLOT_NAME[sl]}</span></li>`; });
  inv.push(`<li>Facet Tonic ×${S.potions.hp}</li>`, `<li>Mana Shard ×${S.potions.mp}</li>`, `<li>Upgrade shards ×${S.shards}</li>`);
  if (S.inv.length) inv.push(`<li class="muted">${S.inv.length} unequipped item${S.inv.length > 1 ? 's' : ''} in Gear</li>`);
  const q = questState(W.id);
  $('#screen').innerHTML = `<div class="rw">
    <header class="rw-head" style="--wh:${W.hue}"><div class="grow"><div class="eyebrow num">Realm ${W.id} · ${realmStatus(W.id)}</div>
      <h2>${esc(W.name)}</h2><div class="small muted">${esc(W.sub)} · ${esc(W.people[0])}</div></div>
      <button class="btn sm" id="rwMap">Map</button><button class="btn sm" id="rwTravel">Travel</button></header>
    <section class="rw-char rw-panel">
      <div class="rw-name"><b>${esc(S.name)}</b> <span class="muted num">(Lv ${S.level})</span></div>
      <div class="rw-bars">
        <div><div class="rw-stat"><span>HP</span><b class="num" id="rwHpText">${Math.round(st.hp * vitOf('hero'))}/${st.hp}</b></div><div class="bar hp" style="height:5px"><i id="rwHpBar" style="width:${Math.round(vitOf('hero') * 100)}%"></i></div></div>
        <div><div class="rw-stat"><span>MP</span><b class="num">${st.mp}/${st.mp}</b></div>${bar('mp', 1, 1, 5)}</div>
      </div>
      <div class="rw-stats">
        <div><span><i class="lg">Strength</i><i class="sm">STR</i></span><b class="num">${at('str')}</b><small class="num">ATK ${st.atk}</small></div>
        <div><span><i class="lg">Agility</i><i class="sm">AGI</i></span><b class="num">${at('agi')}</b><small class="num">SPD ${st.spd}</small></div>
        <div><span><i class="lg">Intelligence</i><i class="sm">INT</i></span><b class="num">${at('int')}</b><small class="num">MAG ${st.mag}</small></div>
        <div><span>XP</span><b class="num">${fmtK(S.xp)}/${fmtK(xpNeed(S.level))}</b></div>
        <div><span>Level</span><b class="num">${S.level}</b>${S.attrPts ? `<small style="color:var(--gold)">${S.attrPts} pts to spend</small>` : ''}</div>
      </div>
      <div class="small rw-party">Party HP: <span id="rwPartyHp" class="num"></span>${S.party.length ? '' : '<span class="muted">no companions yet</span>'}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip pure" id="rwTown" hidden></span><button class="btn sm" id="rwTonic">Drink Tonic</button></div>
      <div class="small rw-quest">Quest: <b>${esc(W.quest.title)}</b> ${q.done ? '<span class="chip pure">Done</span>' : `<span class="muted num">${esc(questGoalText(W.id))} (${q.prog}/${q.need})</span>`}</div>
    </section>
    <section class="rw-scene rw-panel" id="rwScene"></section>
    <section class="rw-log rw-panel"><div class="row"><h3 class="grow">Action log</h3><span class="small muted num" id="rwLogCount"></span></div><div class="log" id="rwLog" aria-live="polite" tabindex="0"></div></section>
    <section class="rw-inv rw-panel"><h3>Inventory</h3><ul>${inv.join('')}</ul></section>
    <section class="rw-ctrl rw-panel"><h3>Controls</h3>
      <div class="rw-ctrl-row">
        <div class="rw-joy" id="rwJoy" role="application" aria-label="Move: drag to walk"><i></i><span>Move</span></div>
        <button class="act rw-btn" id="rwAttack"><b>Attack</b><small>No foe in reach</small></button>
        <button class="act rw-btn" id="rwInteract"><b>Interact</b><small>Nothing nearby</small></button>
      </div>
      <div class="small muted">Drag the scene to turn the camera. Keyboard: WASD or arrows to move, Space to attack, E to interact, M for the map.</div>
    </section>
  </div>`;
  Realm.mount();
};
