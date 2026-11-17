// Diamondverse — open world (World tab): a third-person 3D realm per world, built from the realm's biome.
// Each realm is a large rolling landscape (10× the original area) with a winding road of five battle shrines, a town and
// a waystation, landmarks, lakes, chests, lore stones, hidden companions and roaming foes. Waystones mark regions;
// attune one by walking near it and you can fast-travel back to it from the map.
const Realm = (() => {
  // ---------- biomes ----------
  // ground, path, fog (horizon), propA/propB: [mesh, colour] palette, stone, hazard: lake colour (impassable) or null,
  // amp: hill height, props: what grows or stands there
  const BIOMES = {
    meadow:   { ground:'#3d6b48', path:'#a8b98a', fog:'#9cc4d6', sky:'#4f86c6', propA:['cone','#2f6b4a'], propB:['gem','#8fe3b0'], stone:'#8a9b8f', hazard:'#4a8fc0', amp:6, props:['roundTree','roundTree','pine','rock','crystal'] },
    volcanic: { ground:'#3a2b26', path:'#7a5848', fog:'#5a3020', sky:'#2a1410', propA:['hex','#3b3330'], propB:['gem','#ff8a5b'], stone:'#5d4d46', hazard:'#ff5a1f', amp:9, props:['rock','rock','crystal','pillar'] },
    ocean:    { ground:'#1f4a66', path:'#5a9ab4', fog:'#1a5a80', sky:'#0e3352', propA:['cone','#ff7aa8'], propB:['gem','#4fc3f7'], stone:'#6f8fa3', hazard:'#0a4f8a', amp:5, props:['coral','coral','crystal','rock'] },
    sky:      { ground:'#5a6090', path:'#a8acd8', fog:'#b8c4f0', sky:'#5a6ad8', propA:['box','#8b8fb0'], propB:['gem','#c3a6ff'], stone:'#9da2c4', hazard:'#20244a', amp:4, props:['rock','crystal','roundTree'] },
    nightmare:{ ground:'#2a2244', path:'#5a4a8e', fog:'#2a1f44', sky:'#120a24', propA:['cone','#2d2554'], propB:['gem','#9b8cff'], stone:'#4c4470', hazard:'#06040d', amp:7, props:['pine','crystal','pillar'] },
    obsidian: { ground:'#2a2e3e', path:'#5a6078', fog:'#262a3a', sky:'#0e1020', propA:['gem','#22232e'], propB:['gem','#e8f4ff'], stone:'#5a6078', hazard:'#05060a', amp:8, props:['crystal','crystal','rock'] },
    crystal:  { ground:'#2c3866', path:'#7d8fc8', fog:'#3a4a86', sky:'#18204a', propA:['gem8','#6fd3ff'], propB:['gem','#b07cff'], stone:'#7d86b8', hazard:'#4fc3f7', amp:6, props:['crystal','crystal','rock','pillar'] },
    jungle:   { ground:'#2a5a2e', path:'#7f9a4c', fog:'#4a7a50', sky:'#2a5a40', propA:['cone','#2b5a2a'], propB:['cyl','#3d6b35'], stone:'#6b7a55', hazard:'#2f5e3a', amp:7, props:['roundTree','roundTree','pine','mushroom'] },
    desert:   { ground:'#b08a52', path:'#d8b880', fog:'#e8c890', sky:'#5a9ae0', propA:['hex','#8a6d45'], propB:['gem','#ffd166'], stone:'#b39468', hazard:'#4fa8c8', amp:5, props:['rock','pillar','crystal','cactus'] },
    tundra:   { ground:'#c8d6e3', path:'#e8f0f8', fog:'#c8d8e8', sky:'#7aa0c8', propA:['cone','#e8f4ff'], propB:['gem','#bfe6ff'], stone:'#a8b8c8', hazard:'#4a7ca8', amp:9, props:['snowPine','snowPine','rock','crystal'] },
    clockwork:{ ground:'#4e4232', path:'#8e7a52', fog:'#5a4a30', sky:'#2a2010', propA:['cyl','#8a6d3b'], propB:['hex','#d9a441'], stone:'#7a6a4c', hazard:null, amp:5, props:['pillar','crate','crystal'] },
    swamp:    { ground:'#34482e', path:'#6e8450', fog:'#4a5a3a', sky:'#2a3a24', propA:['cyl','#3a4a2c'], propB:['cone','#9fd36b'], stone:'#5a6a48', hazard:'#1f3324', amp:3, props:['roundTree','mushroom','mushroom'] },
    wasteland:{ ground:'#6a6458', path:'#9a958a', fog:'#7a7468', sky:'#3a3832', propA:['box','#6a655c'], propB:['cone','#e8e2d6'], stone:'#8a857c', hazard:null, amp:7, props:['rock','rock','pillar'] },
    storm:    { ground:'#3e466a', path:'#7f8ab2', fog:'#4a5276', sky:'#1a2040', propA:['hex','#4a5272'], propB:['gem','#7fb3ff'], stone:'#6a7398', hazard:null, amp:10, props:['rock','pillar','crystal'] },
    void:     { ground:'#1e1830', path:'#4a3f6e', fog:'#14101e', sky:'#05030a', propA:['gem','#1e1830'], propB:['gem8','#ff4d7a'], stone:'#3d3458', hazard:'#000000', amp:6, props:['crystal','crystal','pillar'] },
    night:    { ground:'#1e2640', path:'#4a5480', fog:'#141a30', sky:'#06081a', propA:['cyl','#2a3150'], propB:['gem','#ffc145'], stone:'#4a5372', hazard:'#1a2a5a', amp:5, props:['pine','lamp','rock'] },
    forest:   { ground:'#2e5030', path:'#7d8e4c', fog:'#3e6248', sky:'#284a3a', propA:['cone','#1f4a28'], propB:['cyl','#4a3a28'], stone:'#6a7458', hazard:'#2a5a6a', amp:7, props:['pine','pine','roundTree','rock'] },
    blossom:  { ground:'#4e6a48', path:'#e0c0c8', fog:'#e0c8d8', sky:'#9a8ad8', propA:['cone','#ff9ec7'], propB:['cyl','#5a3a3a'], stone:'#b8a0a8', hazard:'#4a8fa8', amp:5, props:['blossomTree','blossomTree','rock'] },
    crater:   { ground:'#4e4040', path:'#8e7a70', fog:'#5a4040', sky:'#1c1010', propA:['gem8','#6e5a50'], propB:['gem','#ffe08a'], stone:'#8a7468', hazard:'#ffb347', amp:9, props:['rock','crystal','crystal'] },
    bazaar:   { ground:'#6a5038', path:'#c0a070', fog:'#c09060', sky:'#4a6ab0', propA:['box','#ff7a59'], propB:['box','#4fc3f7'], stone:'#a88a62', hazard:null, amp:4, props:['crate','lamp','roundTree'] },
    celestial:{ ground:'#7a7aa0', path:'#f0eadc', fog:'#e0d8f0', sky:'#8a9ae8', propA:['cyl','#fff3c4'], propB:['gem','#ffd166'], stone:'#d8d4e8', hazard:'#9fe7ff', amp:5, props:['pillar','roundTree','crystal'] },
    library:  { ground:'#4e3e30', path:'#aa9070', fog:'#4a3a2a', sky:'#2a1c10', propA:['box','#6b4a2a'], propB:['box','#e8e2d6'], stone:'#9a8468', hazard:null, amp:4, props:['pillar','crate','lamp'] },
    fungal:   { ground:'#2e2040', path:'#6a4e84', fog:'#2a1a3a', sky:'#100818', propA:['cyl','#c08bff'], propB:['cone','#7ef2ff'], stone:'#5e4a74', hazard:'#3a1f4a', amp:6, props:['mushroom','mushroom','crystal'] }
  };
  const SCALE = Math.sqrt(10);   // 10× the area of the original realm: every distance × √10
  const RADIUS = Math.round(92 * SCALE), SPAWN = [0, 250], TOWN_C = [0, 238], BACK_POS = [-26, 262];
  const MARK_TYPES = ['tower','arch','ring','tree','statue','dome','obelisk','pool'];
  const CELL = 50, VIEW = 175, IDENT = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1], WHITE = [1, 1, 1], alphaQ = [];   // draw culling: static objects are bucketed in 50-unit cells; draw those within 175 units

  let ok = null, canvas, wrap, labelsBox, mini;
  let statics = [], buckets = new Map(), chunks = [], colliders = [], ents = [], enemies = [], pools = [], PATH = [], shrinePos = [], nextPos = [0, -259], towns = [], flats = [], lairs = [], amp = 6;
  const inTown = (x, z, pad = 0) => towns.some(t => dist(x, z, t.x, t.z) < t.r + pad);
  const townAt = (x, z) => towns.find(t => dist(x, z, t.x, t.z) < t.r);
  const R = { w:1, px:0, pz:0, py:0, ry:Math.PI, yaw:0, moving:0, t:0, grace:2, zoom:1, rot:false, log:[], keys:new Set(), jx:0, jy:0, near:null, foe:null, lastSave:0, lastNet:0, region:'' };

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  function segDist(px, pz, a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
    return dist(px, pz, a[0] + dx * t, a[1] + dz * t);
  }
  const nearPath = (x, z) => { let m = Infinity; for (let i = 1; i < PATH.length; i++) m = Math.min(m, segDist(x, z, PATH[i - 1], PATH[i])); return m; };
  const LOG_MAX = 100;
  function say(msg, kind) { R.log.push([kind || 'sys', msg]); if (R.log.length > LOG_MAX) R.log.shift(); updateHud(); }
  const unlockedWorld = () => clamp(S.worldsCleared + 1, 1, DV.WORLDS.length);
  const bossShort = W => W.boss.split(',')[0];

  // ---------- terrain ----------
  let noiseSeed = 1;
  function hash2(i, j) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + noiseSeed * 1013; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, z) {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  // Ground height: rolling hills, flattened around roads and everything built on them, rising into mountains at the edge.
  function H(x, z) {
    let h = (vnoise(x * .012, z * .012) + vnoise(x * .034, z * .034) * .35) * amp;
    let f = smooth(5, 20, nearPath(x, z));
    for (const [fx, fz, r0, r1] of flats) { const d = dist(x, z, fx, fz); if (d < r1) f = Math.min(f, smooth(r0, r1, d)); }
    h *= f;
    const r = Math.hypot(x, z); if (r > RADIUS - 12) h += (r - RADIUS + 12) * .9 + vnoise(x * .05, z * .05) * 4;
    return h;
  }
  function buildTerrain(T, W) {
    const g = Gfx.hex2rgb(T.ground), p = Gfx.hex2rgb(T.path), st = Gfx.hex2rgb(T.stone), hue = Gfx.hex2rgb(W.hue);
    const col = (x, z, y) => {
      const n = vnoise(x * .08, z * .08) * .08 + vnoise(x * .021, z * .021) * .07;
      let c = g.map(v => clamp(v * (1 + n + y * .015), 0, 1));
      const dp = nearPath(x, z); if (dp < 5) { const t = 1 - smooth(2.6, 5, dp); c = c.map((v, i) => v + (p[i] - v) * t); }
      const tw = towns.find(t => dist(x, z, t.x, t.z) < t.r + 2); if (tw) c = c.map((v, i) => v + (hue[i] - v) * .14);
      const r = Math.hypot(x, z); if (r > RADIUS - 12) { const t = smooth(RADIUS - 12, RADIUS + 10, r); c = c.map((v, i) => v + (st[i] - v) * t); }
      return c;
    };
    chunks = []; const size = 64, ext = RADIUS + 40;
    for (let cz = -ext; cz < ext; cz += size) for (let cx = -ext; cx < ext; cx += size) {
      const mx = cx + size / 2, mz = cz + size / 2; if (Math.hypot(mx, mz) > ext + size) continue;
      chunks.push({ x:mx, z:mz, geo:Gfx.terrain(cx, cz, size, 16, H, col) });
    }
  }

  // ---------- realm build ----------
  function addStatic(o) {
    if (o.y == null) o.y = 0;
    o.y += H(o.x || 0, o.z || 0);
    statics.push(o);
    const k = Math.floor(o.x / CELL) + ',' + Math.floor(o.z / CELL);
    if (!buckets.has(k)) buckets.set(k, { list:[], alpha:[], geo:null }); buckets.get(k)[(o.a ?? 1) < 1 ? 'alpha' : 'list'].push(o);
  }
  // Each 50-unit cell of scenery becomes one baked mesh: a few dozen draw calls instead of thousands.
  function bakeBuckets() { buckets.forEach(b => { b.geo = b.list.length ? Gfx.bake(b.list) : null; b.list = null; }); }
  function freeAll() { buckets.forEach(b => Gfx.free(b.geo)); chunks.forEach(c => Gfx.free(c.geo)); }
  function prop(kind, x, z, s, rand, T, W) {
    const ry = rand() * 6, A = T.propA[1], Bc = T.propB[1];
    switch (kind) {
      case 'roundTree': addStatic({ mesh:'cyl', x, z, sx:.35 * s, sy:2 * s, sz:.35 * s, color:'#6b4a34' }); addStatic({ mesh:'ball', x, z, y:1.4 * s, sx:2.4 * s, sy:2.2 * s, sz:2.4 * s, color: rand() < .15 ? W.hue : shade(A === '#2f6b4a' ? '#3f8a4f' : A, .9 + rand() * .3) }); break;
      case 'blossomTree': addStatic({ mesh:'cyl', x, z, sx:.35 * s, sy:2 * s, sz:.35 * s, color:'#5a3a3a' }); addStatic({ mesh:'ball', x, z, y:1.5 * s, sx:2.6 * s, sy:2 * s, sz:2.6 * s, color:shade('#ffb3d1', .9 + rand() * .2) }); break;
      case 'pine': case 'snowPine': addStatic({ mesh:'cyl', x, z, sx:.3 * s, sy:1 * s, sz:.3 * s, color:'#5a4030' });
        [0, 1, 2].forEach(i => addStatic({ mesh:'cone', x, z, y:(.7 + i * .8) * s, ry, sx:(2.1 - i * .5) * s, sy:1.5 * s, sz:(2.1 - i * .5) * s, color: kind === 'snowPine' ? (i === 2 ? '#ffffff' : '#3a6a5a') : shade(A === '#1f4a28' ? '#2a6a3a' : '#2f6b4a', .85 + i * .1) })); break;
      case 'rock': addStatic({ mesh:'gem8', x, z, y:-.3 * s, ry, sx:1.6 * s, sy:1.2 * s, sz:1.3 * s, color:shade(T.stone, .8 + rand() * .3) }); break;
      case 'crystal': [0, 1, 2].forEach(i => addStatic({ mesh:'gem', x:x + (i - 1) * .5 * s, z:z + (i % 2) * .4 * s, ry:ry + i, rz:(i - 1) * .3, sx:.7 * s, sy:(1.6 + i * .6) * s, sz:.7 * s, color: rand() < .2 ? W.hue : Bc, e:.25 })); break;
      case 'pillar': addStatic({ mesh:'hex', x, z, ry, sx:1.1 * s, sy:(2 + rand() * 3) * s, sz:1.1 * s, color:shade(T.stone, .9 + rand() * .2) }); break;
      case 'mushroom': addStatic({ mesh:'cyl', x, z, sx:.4 * s, sy:1.3 * s, sz:.4 * s, color:'#e8e2d6' }); addStatic({ mesh:'ball', x, z, y:1 * s, sx:2 * s, sy:.9 * s, sz:2 * s, color: rand() < .5 ? A : Bc, e:.2 }); break;
      case 'coral': [0, 1, 2, 3].forEach(i => addStatic({ mesh:'cone', x:x + Math.cos(i * 1.6) * .5 * s, z:z + Math.sin(i * 1.6) * .5 * s, rz:Math.cos(i * 1.6) * .4, rx:Math.sin(i * 1.6) * .4, sx:.4 * s, sy:(1.4 + i * .3) * s, sz:.4 * s, color: i % 2 ? A : Bc, e:.15 })); break;
      case 'cactus': addStatic({ mesh:'cyl', x, z, sx:.6 * s, sy:2.6 * s, sz:.6 * s, color:'#5a8a4a' }); addStatic({ mesh:'cyl', x:x + .5 * s, z, y:1.2 * s, rz:-.9, sx:.35 * s, sy:1 * s, sz:.35 * s, color:'#5a8a4a' }); break;
      case 'crate': addStatic({ mesh:'box', x, z, ry, sx:1.2 * s, sy:1.1 * s, sz:1.2 * s, color: rand() < .5 ? A : '#7a5a3a' }); break;
      case 'lamp': addStatic({ mesh:'cyl', x, z, sx:.18 * s, sy:2.6 * s, sz:.18 * s, color:'#2a2a33' }); addStatic({ mesh:'ball', x, z, y:2.5 * s, sx:.5 * s, sy:.5 * s, sz:.5 * s, color:'#ffd27a', e:1 }); break;
    }
  }
  function build(w) {
    R.w = w; const W = DV.WORLDS[w - 1], T = BIOMES[W.biome] || BIOMES.meadow, rand = seeded(w * 7919);
    freeAll(); statics = []; buckets = new Map(); colliders = []; ents = []; pools = []; flats = []; amp = T.amp; noiseSeed = w * 31 + 7;
    // winding road: entrance → 5 shrines → gate to the next realm
    const zs = [177, 82, -13, -107, -196]; let side = rand() < .5 ? -1 : 1;
    shrinePos = zs.map(z => { side = -side; return [side * (38 + rand() * 82), z]; });
    nextPos = [shrinePos[4][0] * .35, -259];
    PATH = [SPAWN, ...shrinePos, nextPos];
    const TI = townInfo(w);
    const a1 = shrinePos[1], a2 = shrinePos[2], mx = (a1[0] + a2[0]) / 2, mz = (a1[1] + a2[1]) / 2, dx0 = a2[0] - a1[0], dz0 = a2[1] - a1[1], l0 = Math.hypot(dx0, dz0);
    let px = -dz0 / l0, pz = dx0 / l0; if (Math.hypot(mx + px * 16, mz + pz * 16) > Math.hypot(mx - px * 16, mz - pz * 16)) { px = -px; pz = -pz; }
    towns = [{ kind:'town', name:TI.town, x:TOWN_C[0], z:TOWN_C[1], r:16 }, { kind:'outpost', name:TI.outpost, x:mx + px * 16, z:mz + pz * 16, r:11 }];
    towns.forEach(t => flats.push([t.x, t.z, t.r + 2, t.r + 16]));
    shrinePos.forEach(p => flats.push([p[0], p[1], 6, 16]));
    flats.push([nextPos[0], nextPos[1], 5, 14]); if (w > 1) flats.push([BACK_POS[0], BACK_POS[1], 5, 14]);
    // landmarks: the first is the town's monument; the rest spread far apart
    const marks = [];
    W.marks.forEach((name, i) => {
      let x, z, n = 0;
      do {
        if (i === 0) { x = TOWN_C[0] - Math.sign(shrinePos[0][0]) * 6; z = TOWN_C[1] - 1; break; }
        const r = (34 + rand() * 50) * SCALE, a = rand() * Math.PI * 2; x = Math.cos(a) * r; z = Math.sin(a) * r;
        n++;
      } while (n < 400 && (Math.hypot(x, z) > RADIUS - 30 || nearPath(x, z) < 22 || marks.some(m => dist(x, z, m.x, m.z) < 70) || shrinePos.some(s => dist(x, z, s[0], s[1]) < 40) || inTown(x, z, 30)));
      const type = MARK_TYPES[(hashStr(name) + i) % MARK_TYPES.length];
      const m = { kind:'mark', i, name, type, x, z, r:3.2, label:name };
      marks.push(m); ents.push(m); colliders.push([x, z, type === 'pool' ? 3.6 : 2.6]);
      flats.push([x, z, 8, 20]);
    });
    // waystones: one per region (town, waystation, each shrine, each landmark, the gate)
    const way = (id, name, x, z) => { ents.push({ kind:'waystone', id, name, x, z, r:1.2, label:name }); colliders.push([x, z, .7]); flats.push([x, z, 3, 9]); };
    way('town', TI.town, TOWN_C[0] + 7, TOWN_C[1] + 8);
    way('way', TI.outpost, towns[1].x + 5, towns[1].z + 4);
    shrinePos.forEach((p, s) => { const d = Math.sign(p[0]) || 1; way('s' + s, stageName(w, s), p[0] + d * 8, p[1] + 4); });
    marks.slice(1).forEach(m => way('m' + m.i, m.name, m.x + 9, m.z + 5));
    way('gate', w < DV.WORLDS.length ? `Gate to ${DV.WORLDS[w].name}` : 'The Last Gate', nextPos[0] + 9, nextPos[1] + 6);
    // lakes and hazard pools
    if (T.hazard) for (let i = 0, tries = 0; i < 26 && tries < 900; tries++) {
      const r = (22 + rand() * 66) * SCALE, a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 6 + rand() * 14;
      if (Math.hypot(x, z) > RADIUS - 25 || nearPath(x, z) < s + 10 || marks.some(m => dist(x, z, m.x, m.z) < s + 14) || inTown(x, z, s + 10) || ents.some(e => e.kind === 'waystone' && dist(x, z, e.x, e.z) < s + 8)) continue;
      i++; pools.push([x, z, s]); colliders.push([x, z, s * .5]); flats.push([x, z, s / 2 + 1, s / 2 + 7]);
    }
    // Dread lairs: two hidden hollows near the edge of the realm, far from roads and landmarks
    lairs = [];
    for (let tries = 0; lairs.length < 2 && tries < 2000; tries++) {
      const a = lairs.length ? Math.atan2(lairs[0].z, lairs[0].x) + Math.PI * (.6 + rand() * .8) : rand() * Math.PI * 2, r = RADIUS - 42 - rand() * 30;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (nearPath(x, z) < 60 || marks.some(m => dist(x, z, m.x, m.z) < 50) || inTown(x, z, 40) || pools.some(p => dist(x, z, p[0], p[1]) < p[2] + 16) || lairs.some(l => dist(x, z, l.x, l.z) < 120)) continue;
      lairs.push({ x, z, i:lairs.length }); flats.push([x, z, 10, 22]);
    }
    buildTowns(W, T, TI, rand, marks[0]);
    lairs.forEach(L => {
      addStatic({ mesh:'disc', x:L.x, y:.04, z:L.z, sx:15, sy:.02, sz:15, color:'#140a18' });
      addStatic({ mesh:'disc', x:L.x, y:.06, z:L.z, sx:6, sy:.02, sz:6, color:'#ffd166', e:.5, a:.35 });
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, x = L.x + Math.cos(a) * 8.5, z = L.z + Math.sin(a) * 8.5, h = 4 + rand() * 4;
        addStatic({ mesh:'gem8', x, z, y:-.5, ry:rand() * 6, rz:(rand() - .5) * .3, sx:1.6, sy:h, sz:1.6, color:'#1e1226' });
        addStatic({ mesh:'gem', x, z, y:h - .9, sx:.5, sy:.8, sz:.5, color:'#ffd166', e:.9 });
        colliders.push([x, z, .9]);
      }
      for (let i = 0; i < 7; i++) { const a = rand() * 6.28, r = 2 + rand() * 5; addStatic({ mesh:'cyl', x:L.x + Math.cos(a) * r, z:L.z + Math.sin(a) * r, y:.15, rz:Math.PI / 2, ry:rand() * 6, sx:.18, sy:1 + rand(), sz:.18, color:'#e8e2d6' }); }
      ents.push({ kind:'lair', i:L.i, x:L.x, z:L.z, r:0, label:'Dread lair' });
    });
    pools.forEach(([x, z, s]) => addStatic({ mesh:'disc', x, y:.06, z, sx:s, sy:.04, sz:s, color:T.hazard, e:.45 }));
    // vegetation, rocks and crystals
    const kinds = T.props;
    for (let i = 0, tries = 0; i < 1900 && tries < 30000; tries++) {
      const r = Math.sqrt(rand()) * (RADIUS - 8), t = rand() * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r;
      if (nearPath(x, z) < 5.5 || inTown(x, z, 3) || marks.some(m => dist(x, z, m.x, m.z) < 8) || lairs.some(l => dist(x, z, l.x, l.z) < 13) || pools.some(p => dist(x, z, p[0], p[1]) < p[2] * .6 + 1.5)) continue;
      i++;
      const s = .7 + rand() * 1.1;
      prop(kinds[Math.floor(rand() * kinds.length)], x, z, s, rand, T, W);
      if (s > .9) colliders.push([x, z, s * .5]);
    }
    // shrines
    shrinePos.forEach(([x, z], s) => {
      const boss = s === 4;
      ents.push({ kind:'shrine', s, x, z, r:boss ? 2.4 : 1.7, label:boss ? `♛ ${bossShort(W)}` : DV.STAGE_NAMES[s] });
      colliders.push([x, z, boss ? 2.2 : 1.5]);
    });
    // chests: 4 for the realm's side quest (keys 0–3) and 8 bonus caches (4–11)
    for (let i = 0; i < 12; i++) {
      let x, z, n = 0;
      do { const r = (15 + rand() * 70) * SCALE, t = rand() * Math.PI * 2; x = Math.cos(t) * r; z = Math.sin(t) * r; n++; }
      while ((Math.hypot(x, z) > RADIUS - 20 || nearPath(x, z) < 8 || inTown(x, z, 4) || colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 2) || pools.some(p => dist(x, z, p[0], p[1]) < p[2])) && n < 300);
      ents.push({ kind:'chest', key:`${w}-${i}`, bonus:i >= 4, x, z, r:1 }); colliders.push([x, z, .8]); flats.push([x, z, 1.5, 4]);
    }
    if (W.lore) { const m = marks[W.lore.mark]; ents.push({ kind:'lore', x:m.x + 4.2, z:m.z + 1.5, r:1.2, label:'Lore stone' }); }
    if (W.hidden) { const C = DV.COMPANIONS[W.hidden], m = marks[C.mark]; ents.push({ kind:'hidden', id:W.hidden, look:C.look, cls:C.cls, x:m.x - 4, z:m.z - 2.5, r:1.3, label:C.name }); }
    ents.push({ kind:'portal', dir:1, x:nextPos[0], z:nextPos[1], r:2.4, label: w < DV.WORLDS.length ? `Gate to ${DV.WORLDS[w].name}` : 'Beyond the Lattice' });
    if (w > 1) ents.push({ kind:'portal', dir:-1, x:BACK_POS[0], z:BACK_POS[1], r:2.4, label:`Gate to ${DV.WORLDS[w - 2].name}` });
    // boundary peaks
    for (let i = 0; i < 160; i++) { const t = i / 160 * Math.PI * 2, r = RADIUS + 6 + rand() * 18, s = 6 + rand() * 7; addStatic({ mesh:'gem8', x:Math.cos(t) * r, z:Math.sin(t) * r, y:-2, ry:rand() * 6, sx:s, sy:s * (1.5 + rand() * 1.5), sz:s, color:T.stone }); }
    // Roaming foes in four tiers (DV.FOE_TIERS). Levels are fixed per realm: rotspawn match the nearest shrine; veterans,
    // champions and Dread foes sit 2, 5 and 9 levels above the realm's boss, and keep further from the roads.
    const er = seeded(w * 104729); enemies = [];
    const bossLvl = stageLevel(w, 4), spot = (test, tries = 600) => { for (let n = 0; n < tries; n++) { const r = Math.sqrt(er()) * (RADIUS - 40), a = er() * 6.28, x = Math.cos(a) * r, z = Math.sin(a) * r; if (test(x, z)) return [x, z]; } return null; };
    const clear = (x, z, pad) => !inTown(x, z, pad) && !pools.some(p => dist(x, z, p[0], p[1]) < p[2] * .6 + 3) && !colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 1.5);
    const addFoe = (tier, foe, lvl, hx, hz) => enemies.push({ id:`${w}-t${tier}-${enemies.length}`, tier, foe, name: tier > 1 ? `${DV.FOE_TIERS[tier - 1].title} ${foe}` : foe, lvl, hx, hz, x:hx, z:hz, tx:hx, tz:hz, ry:er() * 6, dead:0, seen:false });
    // tier 2: veterans guard each landmark and roam the open country
    marks.slice(1).forEach(m => { for (let k = 0; k < 3; k++) { const a = er() * 6.28, r = 15 + er() * 8, x = m.x + Math.cos(a) * r, z = m.z + Math.sin(a) * r; if (clear(x, z, 10)) addFoe(2, W.foes[2 + (k % 2)], bossLvl + 2, x, z); } });
    for (let k = 0; k < 4; k++) { const p = spot((x, z) => nearPath(x, z) > 35 && nearPath(x, z) < 90 && clear(x, z, 20)); if (p) addFoe(2, W.foes[1 + Math.floor(er() * 3)], bossLvl + 2, ...p); }
    // tier 3: champions deep in the wilds
    for (let k = 0; k < 5; k++) { const p = spot((x, z) => nearPath(x, z) > 70 && Math.hypot(x, z) < RADIUS - 45 && !marks.some(m => dist(x, z, m.x, m.z) < 35) && !lairs.some(l => dist(x, z, l.x, l.z) < 40) && !enemies.some(e => e.tier === 3 && dist(x, z, e.hx, e.hz) < 80) && clear(x, z, 30)); if (p) addFoe(3, W.foes[(k + w) % 4], bossLvl + 5, ...p); }
    // tier 4: a Dread foe in each lair
    lairs.forEach(L => addFoe(4, W.foes[L.i ? 2 : 3], bossLvl + 9, L.x, L.z));
    const nearestStage = (x, z) => { let b = 0, d = Infinity; shrinePos.forEach((p, s) => { const q = dist(x, z, p[0], p[1]); if (q < d) { d = q; b = s; } }); return Math.min(3, b); };
    const homes = [];
    for (let i = 0; i < 30; i++) {
      const seg = Math.min(5, Math.floor(i / 5)), a = PATH[seg], b = PATH[seg + 1], u = .1 + er() * .8, off = (8 + er() * 14) * (er() < .5 ? -1 : 1);
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
      homes.push([a[0] + dx * u + (-dz / l) * off, a[1] + dz * u + (dx / l) * off]);
    }
    marks.slice(1).forEach(m => { for (let k = 0; k < 3; k++) { const a = er() * 6.28; homes.push([m.x + Math.cos(a) * 14, m.z + Math.sin(a) * 14]); } });
    homes.forEach(([hx, hz], i) => {
      towns.forEach(t => { const d = dist(hx, hz, t.x, t.z); if (d < t.r + 8) { hx = t.x + (hx - t.x) / (d || 1) * (t.r + 8); hz = t.z + (hz - t.z) / (d || 1) * (t.r + 8); } });
      const stage = nearestStage(hx, hz), lvl = Math.max(1, stageLevel(w, stage) - (er() < .5 ? 1 : 0));
      addFoe(1, W.foes[Math.min(3, Math.floor(er() * (stage + 2)))], lvl, hx, hz);
    });
    ents.forEach(n => n.y = H(n.x, n.z));
    bakeBuckets(); buildTerrain(T, W);
    attune('town', true);
    Online.presence.join(w);
  }

  // ---------- towns ----------
  function buildTowns(W, T, TI, rand, monument) {
    const roof = W.hue, wall = shade(T.stone, 1.15), F = TI.folk;
    towns.forEach(t => {
      addStatic({ mesh:'disc', x:t.x, y:.02, z:t.z, sx:t.r * 2, sy:.01, sz:t.r * 2, color:W.hue, e:.3, a:.12 });
      const posts = Math.round(2 * Math.PI * t.r / 4.5);
      for (let i = 0; i < posts; i++) {
        const a = i / posts * Math.PI * 2, x = t.x + Math.cos(a) * t.r, z = t.z + Math.sin(a) * t.r;
        if (nearPath(x, z) < 2.6) continue;
        addStatic({ mesh:'hex', x, z, sx:.5, sy:1.6, sz:.5, color:T.stone });
        addStatic({ mesh:'gem', x, y:1.6, z, sx:.42, sy:.6, sz:.42, color:W.hue, e:.85 });
      }
      const houses = t.kind === 'town' ? 10 : 4, spots = [];
      for (let i = 0, tries = 0; i < houses && tries < 300; tries++) {
        const a = rand() * Math.PI * 2, rr = t.r * (.55 + rand() * .27), x = t.x + Math.cos(a) * rr, z = t.z + Math.sin(a) * rr;
        if (nearPath(x, z) < 5 || spots.some(p => dist(x, z, p[0], p[1]) < 5.4) || (monument && t.kind === 'town' && dist(x, z, monument.x, monument.z) < 7)) continue;
        i++; spots.push([x, z]);
        const ry = Math.atan2(t.x - x, t.z - z), w = 2.8 + rand() * 1.2, h = 2.2 + rand() * 1.3;
        addStatic({ mesh:'box', x, z, ry, sx:w, sy:h, sz:w * .9, color:wall });
        addStatic({ mesh:'box', x, z, y:h - .15, ry, sx:w + .2, sy:.25, sz:w * .9 + .2, color:shade(wall, .7) });
        addStatic({ mesh: W.biome === 'crystal' || W.biome === 'celestial' ? 'gem' : 'cone', x, y:h, z, ry, sx:w * 1.4, sy:1.9, sz:w * 1.3, color:roof, e:.06 });
        const f = Gfx.rot([0, 0, w * .46], ry), side = Gfx.rot([.85, 0, w * .46], ry);
        addStatic({ mesh:'box', x:x + f[0], z:z + f[2], ry, sx:.8, sy:1.35, sz:.1, color:'#3a2616' });
        addStatic({ mesh:'box', x:x + side[0], y:1.2, z:z + side[2], ry, sx:.5, sy:.5, sz:.1, color:'#ffd27a', e:.9 });
        colliders.push([x, z, w * .62]);
      }
      if (t.kind === 'outpost') {
        addStatic({ mesh:'cyl', x:t.x, z:t.z, sx:1.6, sy:.35, sz:1.6, color:T.stone });
        addStatic({ mesh:'gem', x:t.x, y:.35, z:t.z, sx:1, sy:1.4, sz:1, color:'#ff9a3d', e:1 });
        colliders.push([t.x, t.z, 1]);
        ents.push({ kind:'sign', x:t.x, z:t.z, r:0, label:t.name });
      }
      const roles = t.kind === 'town'
        ? [['quest', W.quest.giver], ['warden', F.warden], ['elder', F.elder], ['merchant', F.merchant], ['innkeeper', F.innkeeper], ['citizen', F.citizen]]
        : [['keeper', F.keeper], ['trader', F.trader]];
      let ang = rand() * Math.PI * 2;
      roles.forEach(([role, name]) => {
        let x, z, n = 0;
        do { ang += .9 + rand() * .5; const rr = t.r * (t.kind === 'town' ? .32 : .4) + rand() * 2; x = t.x + Math.cos(ang) * rr; z = t.z + Math.sin(ang) * rr; n++; }
        while (n < 60 && (nearPath(x, z) < 2.2 || colliders.some(c => dist(x, z, c[0], c[1]) < c[2] + 1.2) || ents.some(e => (e.kind === 'villager' || e.kind === 'npc') && dist(x, z, e.x, e.z) < 3)));
        const label = name in DV.SPEAKERS ? DV.SPEAKERS[name] : name;
        const comp = Object.values(DV.COMPANIONS).find(C => C.name === name);
        const look = name === 'lumeria' ? { sex:1, race:1, skin:0, hair:4, eyes:5, outfit:5, hairStyle:11, physique:0, height:2 } : comp ? comp.look : villagerLook(hashStr(name + W.id));
        ents.push(role === 'quest' ? { kind:'npc', who:name, x, z, r:1.4, label, look, cls:comp && comp.cls } : { kind:'villager', role, name, x, z, r:1.3, label, look });
        colliders.push([x, z, .6]);
      });
    });
  }
  const ROLE = { warden:'Town Warden', elder:'Elder', merchant:'Merchant', innkeeper:'Innkeeper', citizen:'Townsperson', keeper:'Waystation Keeper', trader:'Road Trader' };
  const ROLE_COLOR = { warden:'#ff7a59', elder:'#c3a6ff', merchant:'#ffc145', innkeeper:'#8fe3b0', citizen:'#9aa3b5', keeper:'#5fb3ff', trader:'#ffd166' };
  // per-tier roaming behaviour: sight range, leash from home, speeds, wander radius
  const FOE_BEHAVIOR = [
    { aggro:8, leash:16, walk:1.6, chase:3.6, wander:6 }, { aggro:9, leash:18, walk:1.5, chase:3.9, wander:7 },
    { aggro:7, leash:14, walk:1.2, chase:3.6, wander:6 }, { aggro:6, leash:9, walk:.8, chase:3.2, wander:3 }];
  const TIER_COLOR = ['#ff4d7a', '#ffb347', '#7ef2ff', '#ffd166'];
  const lairFound = n => !!(n && S.lairs && S.lairs[`${R.w}-${n.i}`]);
  function reqFor(n) { const T = townInfo(R.w); return n.role === 'warden' ? T.bounty : n.role === 'elder' ? T.errand : null; }

  // ---------- regions & fast travel ----------
  const wsKey = id => `${R.w}:${id}`;
  function attune(id, quiet) {
    S.ws = S.ws || {}; if (S.ws[wsKey(id)]) return false;
    S.ws[wsKey(id)] = 1; save();
    if (!quiet) { const n = ents.find(e => e.kind === 'waystone' && e.id === id); say(`Waystone attuned: ${n.name}. You can fast-travel here from the map.`, 'you'); toast(`Region unlocked: ${n.name}`); }
    return true;
  }
  const attuned = n => !!(S.ws && S.ws[wsKey(n.id)]);
  function fastTravel(id) {
    const n = ents.find(e => e.kind === 'waystone' && e.id === id); if (!n || !attuned(n)) return;
    placePlayer([n.x, n.z + 3]); savePos(); closeSheet(); render();
    say(`You step through the waystone to ${n.name}.`, 'sys');
  }
  function regionName() {
    let best = null, bd = 80;
    ents.forEach(n => { if (n.kind !== 'waystone') return; const d = dist(n.x, n.z, R.px, R.pz); if (d < bd) { bd = d; best = n; } });
    return best ? best.name : `Wilds of ${DV.WORLDS[R.w - 1].name}`;
  }

  function placePlayer(at) {
    const p = at === 'gate' ? [nextPos[0], nextPos[1] + 12] : at === 'back' ? [BACK_POS[0] + 6, BACK_POS[1] - 6] : at || SPAWN;
    R.px = p[0]; R.pz = p[1]; R.ry = Math.PI; R.yaw = 0; R.grace = 2;
  }
  function savePos() { S.realm = { w:R.w, x:+R.px.toFixed(2), z:+R.pz.toFixed(2) }; save(); }
  function travel(w, at) {
    build(w); placePlayer(at); savePos(); render();
    const W = DV.WORLDS[w - 1];
    say(`Through the gate: ${W.name}, ${W.sub}.`, 'sys');
    if (!S.seen['w' + w]) { S.seen['w' + w] = 1; save(); playDialogue(W.intro); }
  }

  // ---------- drawing ----------
  function drawMark(n, T, W, t) {
    const x = n.x, z = n.z, y = n.y, st = T.stone, hue = W.hue, seen = !!S.marks[markKey(R.w, n.i)];
    const D = o => Gfx.draw({ ...o, y:(o.y || 0) + y });
    switch (n.type) {
      case 'tower': D({ mesh:'hex', x, z, sx:3.6, sy:9, sz:3.6, color:st }); D({ mesh:'hex', x, z, y:9, sx:4.2, sy:.6, sz:4.2, color:shade(st, .8) }); D({ mesh:'cone', x, y:9.6, z, sx:4.4, sy:3.5, sz:4.4, color:hue, e:.25 }); break;
      case 'arch': [-2.4, 2.4].forEach(d => D({ mesh:'box', x:x + d, z, sx:1.2, sy:6, sz:1.2, color:st })); D({ mesh:'box', x, y:6, z, sx:6.2, sy:1.1, sz:1.4, color:st }); D({ mesh:'gem', x, y:7.1, z, sx:1, sy:1.4, sz:1, color:hue, e:.6 }); break;
      case 'ring': for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; D({ mesh:'box', x:x + Math.cos(a) * 3.2, z:z + Math.sin(a) * 3.2, ry:a, sx:.9, sy:3.4, sz:.5, color:st }); } D({ mesh:'disc', x, y:.04, z, sx:3, sy:.02, sz:3, color:hue, e:.4, a:.7 }); break;
      case 'tree': D({ mesh:'cyl', x, z, sx:1.6, sy:6, sz:1.6, color:'#5a4030' }); [0, 1, 2].forEach(i => D({ mesh:'sphere', x:x + (i - 1) * 1.8, y:4.6 + (i % 2) * 1.5, z:z + (i - 1) * .8, sx:4.4, sy:4, sz:4.4, color:hue, e:.12 })); break;
      case 'statue': D({ mesh:'box', x, z, sx:3, sy:1.6, sz:3, color:st }); D({ mesh:'gem8', x, y:1.6, z, ry:.4, sx:1.6, sy:5.4, sz:1.6, color:st }); D({ mesh:'gem', x, y:6.6, z, sx:.8, sy:1.1, sz:.8, color:hue, e:.6 }); break;
      case 'dome': D({ mesh:'hex', x, z, sx:6, sy:2.4, sz:6, color:st }); D({ mesh:'sphere', x, y:.6, z, sx:6.2, sy:5, sz:6.2, color:hue, e:.18 }); break;
      case 'obelisk': D({ mesh:'box', x, z, sx:1.6, sy:11, sz:1.6, color:st }); D({ mesh:'gem', x, y:11, z, ry:t, sx:1.2, sy:1.6, sz:1.2, color:hue, e:.7 + Math.sin(t * 2) * .2 }); break;
      case 'pool': D({ mesh:'disc', x, y:.03, z, sx:6.4, sy:.02, sz:6.4, color:hue, e:.6, a:.85 }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; D({ mesh:'gem', x:x + Math.cos(a) * 3.8, z:z + Math.sin(a) * 3.8, sx:.8, sy:1.6, sz:.8, color:st }); } break;
    }
    if (!seen) D({ mesh:'gem', x, y:13 + Math.sin(t * 2) * .3, z, ry:t * 1.5, sx:.7, sy:1, sz:.7, color:'#ffc145', e:.9 });
  }
  const marker = (n, c, t) => Gfx.draw({ mesh:'gem', x:n.x, y:n.y + 2.9 + Math.sin(t * 3) * .12, z:n.z, ry:t * 2, sx:.35, sy:.5, sz:.35, color:c, e:1 });
  const faceHero = n => { n.ry = dist(n.x, n.z, R.px, R.pz) < 12 ? Math.atan2(R.px - n.x, R.pz - n.z) : (n.ry || 0); };
  function drawEnt(n, T, W, t) {
    const y = n.y || 0;
    if (n.kind === 'mark') return drawMark(n, T, W, t);
    if (n.kind === 'shrine') {
      const boss = n.s === 4, k = boss ? 1.45 : 1, done = !!S.cleared[stageKey(R.w, n.s)], open = stageOpen(R.w, n.s);
      Gfx.draw({ mesh:'hex', x:n.x, y, z:n.z, sx:2.8 * k, sy:.45, sz:2.8 * k, color:T.stone });
      Gfx.draw({ mesh:'hex', x:n.x, y:y + .45, z:n.z, sx:2 * k, sy:.25, sz:2 * k, color:shade(T.stone, .85) });
      const col = done ? W.hue : open ? '#ffffff' : '#3a3d4a', glow = done ? .55 : open ? .35 + Math.sin(t * 3) * .2 : 0;
      Gfx.draw({ mesh:'gem8', x:n.x, y:y + 1.2 + (open && !done ? Math.sin(t * 2) * .15 : 0), z:n.z, ry:t * .5, sx:1.3 * k, sy:3 * k, sz:1.3 * k, color:col, e:glow, ink:.04 });
      if (boss) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; Gfx.draw({ mesh:'cone', x:n.x + Math.cos(a) * 2.6, y:y + .4, z:n.z + Math.sin(a) * 2.6, sx:.5, sy:1.8, sz:.5, color: S.worldsCleared >= R.w ? W.hue : '#ff4d7a', e:.4 }); }
    } else if (n.kind === 'waystone') {
      const on = attuned(n);
      Gfx.draw({ mesh:'disc', x:n.x, y:y + .03, z:n.z, sx:2.6, sy:.02, sz:2.6, color: on ? W.hue : '#3a3d4a', e: on ? .5 : 0, a:.8 });
      Gfx.draw({ mesh:'hex', x:n.x, y, z:n.z, sx:.8, sy:3.2, sz:.8, color:T.stone, ink:.05 });
      Gfx.draw({ mesh:'gem', x:n.x, y:y + 3.6 + Math.sin(t * 2) * .2, z:n.z, ry:t, sx:.7, sy:1.1, sz:.7, color: on ? W.hue : '#5a5e70', e: on ? .9 : .1 });
    } else if (n.kind === 'chest') {
      const opened = !!S.chests[n.key];
      Gfx.draw({ mesh:'box', x:n.x, y, z:n.z, ry:.4, sx:1, sy:.55, sz:.7, color: n.bonus ? '#4a5a6a' : '#6b4a2a', ink:.05 });
      Gfx.draw({ mesh:'box', x:n.x, y:y + .55, z:n.z, ry:.4, sx:1.04, sy:.22, sz:.74, color: opened ? '#3d2c1b' : n.bonus ? '#bfe6ff' : '#ffc145', e: opened ? 0 : .25, rx: opened ? -.9 : 0 });
    } else if (n.kind === 'npc') {
      faceHero(n); drawCharacter(n.x, y, n.z, n.ry, n.look, { t, cls:n.cls, accent:speakerColor(n.who) });
      if (!S.qdone[R.w]) marker(n, '#ffc145', t);
    } else if (n.kind === 'villager') {
      faceHero(n); drawCharacter(n.x, y, n.z, n.ry, n.look, { t, accent:ROLE_COLOR[n.role], weapon:false });
      const q = reqFor(n), st = q && tqState(q.key).st;
      if (st === 'new' || st === 'return') marker(n, st === 'return' ? '#6fe3a1' : '#ffc145', t);
    } else if (n.kind === 'lore') {
      Gfx.draw({ mesh:'hex', x:n.x, y, z:n.z, sx:1.2, sy:.9, sz:1.2, color:T.stone });
      Gfx.draw({ mesh:'gem', x:n.x, y:y + .9 + Math.sin(t * 2) * .1, z:n.z, ry:t, sx:.6, sy:.9, sz:.6, color: S.lore[R.w] ? '#5a6078' : '#ffe08a', e: S.lore[R.w] ? 0 : .9 });
    } else if (n.kind === 'hidden') {
      if (compJoined(n.id)) return;
      faceHero(n); drawCharacter(n.x, y, n.z, n.ry, n.look, { t, cls:n.cls });
    } else if (n.kind === 'portal') {
      const live = n.dir < 0 || (S.worldsCleared >= R.w && R.w < DV.WORLDS.length), tw = n.dir < 0 ? DV.WORLDS[R.w - 2] : DV.WORLDS[R.w] || W;
      [-1.7, 1.7].forEach(dx => Gfx.draw({ mesh:'hex', x:n.x + dx, y, z:n.z, sx:.7, sy:3.6, sz:.7, color:T.stone, ink:.04 }));
      Gfx.draw({ mesh:'box', x:n.x, y:y + 3.5, z:n.z, sx:4.4, sy:.55, sz:.8, color:T.stone });
      Gfx.draw({ mesh:'box', x:n.x, y:y + .05, z:n.z, sx:2.7, sy:3.4, sz:.12, color: live ? tw.hue : '#30323d', e: live ? .7 + Math.sin(t * 2) * .2 : 0, a: live ? .7 : .5 });
    }
  }

  // ---------- frame loop ----------
  let last = 0;
  const active = () => ok && canvas && canvas.isConnected && !$('#app').hidden && !document.hidden && tab === 'world';
  function loop(now) {
    requestAnimationFrame(loop);
    const real = Math.min(1, (now - last) / 1000 || 0), dt = Math.min(.05, real); last = now;
    if (!active()) return;
    R.t += dt; R.grace = Math.max(0, R.grace - dt);
    let ix = R.jx, iy = R.jy;
    if (R.keys.has('a') || R.keys.has('arrowleft')) ix -= 1; if (R.keys.has('d') || R.keys.has('arrowright')) ix += 1;
    if (R.keys.has('w') || R.keys.has('arrowup')) iy -= 1; if (R.keys.has('s') || R.keys.has('arrowdown')) iy += 1;
    const il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; }
    R.moving = Math.min(1, il);
    if (R.moving > .05) {
      const fx = -Math.sin(R.yaw), fz = -Math.cos(R.yaw), rx = Math.cos(R.yaw), rz = -Math.sin(R.yaw);
      const mx = rx * ix + fx * -iy, mz = rz * ix + fz * -iy, sp = 11 * dt;
      R.px += mx * sp; R.pz += mz * sp; R.ry = Math.atan2(mx, mz);
      for (const [cx, cz, cr] of colliders) { if (Math.abs(R.px - cx) > cr + 1 || Math.abs(R.pz - cz) > cr + 1) continue; const d = dist(R.px, R.pz, cx, cz), m = cr + .45; if (d < m && d > 0) { R.px = cx + (R.px - cx) / d * m; R.pz = cz + (R.pz - cz) / d * m; } }
      const r = Math.hypot(R.px, R.pz); if (r > RADIUS - 6) { R.px *= (RADIUS - 6) / r; R.pz *= (RADIUS - 6) / r; }
      if (R.t - R.lastSave > 3) { R.lastSave = R.t; savePos(); }
    }
    R.py = H(R.px, R.pz);
    // town barriers heal 1% of max HP per second
    const town = townAt(R.px, R.pz);
    if (town !== R.town) {
      if (town) say(`You enter ${town.name}. Inside the barrier your wounds mend: 1% of max HP each second.`, 'you');
      else if (R.town) say(`You leave ${R.town.name}.`, 'sys');
      R.town = town; updateVitals();
    }
    if (town && healParty(.01 * real)) { R.healT = (R.healT || 0) + dt; if (R.healT > .25) { R.healT = 0; updateVitals(); } if (R.t - R.lastSave > 3) { R.lastSave = R.t; save(); } }
    if (R.t - R.lastNet > 2) { R.lastNet = R.t; Online.presence.update({ x:R.px, z:R.pz, ry:R.ry }); }
    // discovery: landmarks, waystones, errands, region name
    ents.forEach(n => {
      if (n.kind === 'waystone' && !attuned(n) && dist(n.x, n.z, R.px, R.pz) < 16) attune(n.id);
      if (n.kind === 'lair' && !lairFound(n) && dist(n.x, n.z, R.px, R.pz) < 30) { S.lairs = S.lairs || {}; S.lairs[`${R.w}-${n.i}`] = 1; save(); say('You find a Dread lair. Something ancient sleeps here.', 'foe'); toast('Dread lair discovered'); }
      if (n.kind !== 'mark' || dist(n.x, n.z, R.px, R.pz) > 9) return;
      if (!S.marks[markKey(R.w, n.i)]) { visitMark(R.w, n.i); say(`Discovered: ${n.name}.`, 'you'); toast(`Landmark discovered: ${n.name}`); const q = checkQuest(R.w); if (q) questDone(q); }
      const e = tqReachMark(R.w, n.i); if (e) { say(`You deliver ${e.item} at ${n.name}. Return to ${e.giver} in ${townInfo(R.w).town}.`, 'you'); toast('Errand delivered. Return to town.'); }
    });
    if (Math.floor(R.t) !== Math.floor(R.t - dt)) { const rn = regionName(); if (rn !== R.region) { R.region = rn; const el = $('#rwRegion'); if (el) el.textContent = rn; } }
    // foes
    const W = DV.WORLDS[R.w - 1], T = BIOMES[W.biome] || BIOMES.meadow;
    let foe = null, foeD = 4.5;
    for (const e of enemies) {
      if (e.dead) { if (Date.now() > e.dead) { e.dead = 0; e.x = e.hx; e.z = e.hz; } else continue; }
      const dp = dist(e.x, e.z, R.px, R.pz); if (dp > 160) continue;   // far-away foes rest
      const dh = dist(e.x, e.z, e.hx, e.hz), B8 = FOE_BEHAVIOR[e.tier - 1];
      let sp = B8.walk;
      if (dp < B8.aggro && dh < B8.leash && R.grace <= 0 && !R.town) { e.tx = R.px; e.tz = R.pz; sp = B8.chase; }
      else if (dist(e.x, e.z, e.tx, e.tz) < .5 || dh > B8.leash) { const a = Math.random() * 6.28, r = Math.random() * B8.wander; e.tx = e.hx + Math.cos(a) * r; e.tz = e.hz + Math.sin(a) * r; }
      const dx = e.tx - e.x, dz = e.tz - e.z, l = Math.hypot(dx, dz);
      if (l > .1) { e.x += dx / l * sp * dt; e.z += dz / l * sp * dt; e.ry = Math.atan2(dx, dz); }
      towns.forEach(t => { const d = dist(e.x, e.z, t.x, t.z); if (d < t.r + 1) { e.x = t.x + (e.x - t.x) / (d || 1) * (t.r + 1); e.z = t.z + (e.z - t.z) / (d || 1) * (t.r + 1); e.tx = e.hx; e.tz = e.hz; } });
      if (dp < (e.tier > 1 ? 22 : 10) && !e.seen) {
        e.seen = true; const TT = DV.FOE_TIERS[e.tier - 1], danger = e.lvl >= S.level + 6 ? ' Far stronger than you.' : '';
        say(e.tier > 1 ? `You spot ${TT.stars} ${e.name} (Lv ${e.lvl}, ${TT.xp}× XP).${danger}` : `You encounter a ${e.foe}! (Lv ${e.lvl})`, 'foe');
      }
      if (dp > (e.tier > 1 ? 34 : 18)) e.seen = false;
      if (dp < foeD) { foe = e; foeD = dp; }
      if (dp < 1.1 + .35 * foeScale(e) && R.grace <= 0) { engage(e, false); return; }
    }
    let near = null, nd = Infinity;
    ents.forEach(n => { if (n.kind === 'mark' || n.kind === 'sign' || n.kind === 'lair' || (n.kind === 'hidden' && compJoined(n.id))) return; const d = dist(n.x, n.z, R.px, R.pz) - n.r; if (d < 2.4 && d < nd) { near = n; nd = d; } });
    if (near !== R.near || foe !== R.foe) { R.near = near; R.foe = foe; updateButtons(); }
    // draw: sky, terrain chunks and static objects near the camera, then entities and characters
    const D = 11 * R.zoom, Hc = 5.8 * R.zoom, eye = [R.px + Math.sin(R.yaw) * D, R.py + Hc, R.pz + Math.cos(R.yaw) * D];
    Gfx.frame(eye, [R.px, R.py + 1.9, R.pz], { top:T.sky || T.fog, horizon:T.fog }, [70, VIEW]);
    const fx = -Math.sin(R.yaw), fz = -Math.cos(R.yaw);
    const behind = (x, z, pad) => { const dx = x - R.px, dz = z - R.pz, d = Math.hypot(dx, dz); return d > pad && (dx * fx + dz * fz) / d < -.45; };
    chunks.forEach(c => { if (dist(c.x, c.z, R.px, R.pz) < VIEW + 50 && !behind(c.x, c.z, 70)) Gfx.draw({ geo:c.geo, M:IDENT, rgb:WHITE }); });
    const bx = Math.floor(R.px / CELL), bz = Math.floor(R.pz / CELL), span = Math.ceil(VIEW / CELL);
    for (let i = -span; i <= span; i++) for (let j = -span; j <= span; j++) {
      const b = buckets.get((bx + i) + ',' + (bz + j)); if (!b) continue;
      if (Math.hypot(i * CELL, j * CELL) > VIEW + CELL || behind((bx + i + .5) * CELL, (bz + j + .5) * CELL, CELL * 1.6)) continue;
      if (b.geo) Gfx.draw({ geo:b.geo, M:IDENT, rgb:WHITE });
      alphaQ.push(...b.alpha);
    }
    ents.forEach(n => { if (dist(n.x, n.z, R.px, R.pz) < VIEW) drawEnt(n, T, W, R.t); });
    alphaQ.forEach(Gfx.draw); alphaQ.length = 0;
    enemies.forEach(e => { if (!e.dead && dist(e.x, e.z, R.px, R.pz) < VIEW) drawFoe(e, R.t, W.hue, H(e.x, e.z)); });
    Online.peers.forEach(p => drawCharacter(p.x, H(p.x, p.z), p.z, p.ry, p.look, { t:R.t, cls:p.cls }));
    drawCharacter(R.px, R.py, R.pz, R.ry, S.look, { cls:S.cls, moving:R.moving, t:R.t });
    drawLabels();
    if (Math.floor(R.t * 6) !== Math.floor((R.t - dt) * 6)) drawMap(mini, false);
  }
  const labelEls = new Map();
  function labelFor(n) {
    const d = dist(n.x, n.z, R.px, R.pz);
    if (n.kind === 'shrine') return n.label + (S.cleared[stageKey(R.w, n.s)] ? ' ✓' : stageOpen(R.w, n.s) ? ` · Lv ${stageLevel(R.w, n.s)}` : ' · Sealed');
    if (n.kind === 'mark') return n.label + (S.marks[markKey(R.w, n.i)] ? ' ✓' : '');
    if (n.kind === 'waystone') return d < 28 ? `${attuned(n) ? '◆' : '◇'} ${n.label}` : null;
    if (n.kind === 'hidden') return compJoined(n.id) ? null : d < 10 ? n.label : '???';
    if (n.kind === 'lore') return S.lore[R.w] ? null : d < 14 ? n.label : null;
    if (n.kind === 'npc') return d > 8 ? null : n.label + (S.qdone[R.w] ? '' : ' · Quest');
    if (n.kind === 'villager') { if (d > 6) return null; const q = reqFor(n), st = q && tqState(q.key).st;
      return `${n.label} · ${ROLE[n.role]}${st === 'new' ? ' · Request' : st === 'return' ? ' · Turn in' : ''}`; }
    if (n.kind === 'chest') return null;
    if (n.kind === 'lair') return d < 45 ? n.label : null;
    return n.label;
  }
  function drawLabels() {
    const seen = new Set();
    ents.forEach((n, i) => {
      const d = dist(n.x, n.z, R.px, R.pz); if (d > 60) return;
      const text = labelFor(n); if (!text) return;
      const h = (n.y || 0) + (n.kind === 'shrine' ? (n.s === 4 ? 6.4 : 4.6) : n.kind === 'mark' ? 9 : n.kind === 'portal' ? 4.4 : n.kind === 'sign' ? 3.4 : n.kind === 'waystone' ? 4.8 : n.kind === 'lair' ? 9 : 2.8);
      const p = Gfx.project(n.x, h, n.z); if (!p || p.y < 26) return;
      let el = labelEls.get(i);
      if (!el) { el = document.createElement('div'); el.className = 'rw-label'; labelsBox.appendChild(el); labelEls.set(i, el); }
      if (el.textContent !== text) el.textContent = text;
      el.classList.toggle('mark', n.kind === 'mark' || n.kind === 'waystone');
      el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
      el.style.opacity = d > 45 ? (60 - d) / 15 : 1;
      el.hidden = false; seen.add(i);
    });
    enemies.forEach((e, i) => {
      if (e.dead) return;
      const d = dist(e.x, e.z, R.px, R.pz); if (d > (e.tier > 1 ? 26 : 12)) return;
      const p = Gfx.project(e.x, H(e.x, e.z) + 2.3 * foeScale(e) + .4, e.z); if (!p || p.y < 26) return;
      const key = 'f' + i, TT = DV.FOE_TIERS[e.tier - 1], text = `${TT.stars ? TT.stars + ' ' : ''}${e.name} · Lv ${e.lvl}`;
      let el = labelEls.get(key);
      if (!el) { el = document.createElement('div'); labelsBox.appendChild(el); labelEls.set(key, el); }
      el.className = `rw-label foe t${e.tier}${e.lvl >= S.level + 6 ? ' danger' : ''}`;
      if (el.textContent !== text) el.textContent = text;
      el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
      el.style.opacity = d > 18 ? Math.max(0, (26 - d) / 8) : 1;
      el.hidden = false; seen.add(key);
    });
    labelEls.forEach((el, i) => { if (!seen.has(i)) el.hidden = true; });
  }

  // ---------- map: the minimap shows the area around you; the full map shows the whole realm ----------
  function drawMap(cv, full) {
    if (!cv || !cv.isConnected) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), size = cv.clientWidth;
    if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
    const g = cv.getContext('2d'), W = DV.WORLDS[R.w - 1], T = BIOMES[W.biome] || BIOMES.meadow;
    const span = full ? RADIUS + 10 : 90, k = size / (2 * span), ox = full ? 0 : R.px, oz = full ? 0 : R.pz;
    const P = (x, z) => [size / 2 + (x - ox) * k, size / 2 + (z - oz) * k];
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
    g.save(); g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); if (!full) g.clip();
    g.fillStyle = T.stone; g.fillRect(0, 0, size, size);
    const [cx0, cz0] = P(0, 0); g.fillStyle = T.ground; g.beginPath(); g.arc(cx0, cz0, RADIUS * k, 0, Math.PI * 2); g.fill();
    pools.forEach(([x, z, s]) => { const [a, b] = P(x, z); g.fillStyle = T.hazard; g.beginPath(); g.arc(a, b, s / 2 * k, 0, Math.PI * 2); g.fill(); });
    towns.forEach(t => { const [a, b] = P(t.x, t.z); g.beginPath(); g.arc(a, b, Math.max(3, t.r * k), 0, Math.PI * 2); g.fillStyle = W.hue + '55'; g.fill(); g.strokeStyle = W.hue; g.lineWidth = 1.5; g.stroke(); });
    g.strokeStyle = T.path; g.lineWidth = Math.max(2, 3.6 * k); g.beginPath(); PATH.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke();
    const diamond = (x, z, r, fill, stroke) => { const [a, b] = P(x, z); g.beginPath(); g.moveTo(a, b - r); g.lineTo(a + r, b); g.lineTo(a, b + r); g.lineTo(a - r, b); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } };
    g.font = `600 ${full ? 12 : 8}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round';
    const text = (t, a, b) => { g.strokeStyle = '#0a0c19'; g.lineWidth = 3.5; g.strokeText(t, a, b); g.fillStyle = '#e9ecff'; g.fillText(t, a, b); };
    ents.forEach(n => {
      const [a, b] = P(n.x, n.z);
      if (n.kind === 'mark') { const v = S.marks[markKey(R.w, n.i)]; diamond(n.x, n.z, full ? 7 : 4, v ? W.hue : '#0a0c19', '#ffc145'); if (full && n.i) text(n.name, a, b - 11); }
      else if (n.kind === 'shrine') { const done = S.cleared[stageKey(R.w, n.s)], o = stageOpen(R.w, n.s); diamond(n.x, n.z, full ? 8 : 4.5, done ? W.hue : o ? '#ffffff' : '#3a3d4a', '#0a0c19'); if (full) { g.fillStyle = '#0a0c19'; g.fillText(n.s === 4 ? '♛' : n.s + 1, a, b + 4); } }
      else if (n.kind === 'waystone') { const on = attuned(n); g.fillStyle = on ? '#7ef2ff' : '#3a3d4a'; g.strokeStyle = '#0a0c19'; g.lineWidth = 1; g.beginPath(); g.arc(a, b, full ? 4.5 : 3, 0, Math.PI * 2); g.fill(); g.stroke(); }
      else if (n.kind === 'chest') { g.fillStyle = S.chests[n.key] ? '#5a4a3a' : n.bonus ? '#bfe6ff' : '#ffc145'; g.fillRect(a - (full ? 3 : 2), b - (full ? 2.5 : 2), full ? 6 : 4, full ? 5 : 4); }
      else if (n.kind === 'portal') { g.strokeStyle = '#b07cff'; g.lineWidth = 2; g.strokeRect(a - (full ? 6 : 3), b - (full ? 6 : 3), full ? 12 : 6, full ? 12 : 6); }
      else if ((n.kind === 'villager' || n.kind === 'npc') && !full) { g.fillStyle = n.kind === 'npc' ? '#7ef2ff' : ROLE_COLOR[n.role]; g.beginPath(); g.arc(a, b, 2, 0, Math.PI * 2); g.fill(); }
      else if (n.kind === 'lore' && S.lore[R.w]) { g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(a, b, full ? 3 : 2, 0, Math.PI * 2); g.fill(); }
    });
    if (full) towns.forEach(t => { const [a, b] = P(t.x, t.z); text(t.name, a, b - Math.max(8, t.r * k) - 4); });
    enemies.forEach(e => {
      if (e.dead || (!full && dist(e.x, e.z, R.px, R.pz) > 90)) return;
      if (e.tier === 4 && !lairFound(ents.find(n => n.kind === 'lair' && dist(n.x, n.z, e.hx, e.hz) < 1))) return;   // hidden until found
      const [a, b] = P(e.x, e.z); g.fillStyle = TIER_COLOR[e.tier - 1]; g.beginPath(); g.arc(a, b, (full ? 2 : 2.2) + (e.tier - 1) * .8, 0, Math.PI * 2); g.fill();
      if (e.tier > 1) { g.strokeStyle = '#0a0c19'; g.lineWidth = 1; g.stroke(); }
    });
    ents.forEach(n => { if (n.kind !== 'lair' || !lairFound(n)) return; const [a, b] = P(n.x, n.z); g.strokeStyle = '#ffd166'; g.lineWidth = 1.5; g.beginPath(); g.arc(a, b, full ? 9 : 6, 0, Math.PI * 2); g.stroke(); });
    const [px, pz] = P(R.px, R.pz), s = full ? 9 : 6;
    g.save(); g.translate(px, pz); g.rotate(-R.ry + Math.PI);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#0a0c19'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .7, s * .7); g.lineTo(0, s * .3); g.lineTo(-s * .7, s * .7); g.closePath(); g.fill(); g.stroke();
    g.restore(); g.restore();
  }
  function mapSheet() {
    const W = DV.WORLDS[R.w - 1], found = W.marks.filter((_, i) => S.marks[markKey(R.w, i)]).length;
    const opened = ents.filter(n => n.kind === 'chest' && S.chests[n.key]).length, stones = ents.filter(n => n.kind === 'waystone');
    openSheet(`<div class="eyebrow num">Realm ${W.id} · Map</div><h2>${esc(W.name)}</h2>
      <canvas class="rw-bigmap" id="bigMap" aria-label="Map of ${esc(W.name)}"></canvas>
      <div class="small muted map-key"><span><i class="k-mark"></i>Landmark (outline: unexplored)</span><span><i class="k-shrine"></i>Shrine</span><span><i class="k-way"></i>Waystone</span><span><i class="k-chest"></i>Chest</span><span><i class="k-town"></i>Town (heals)</span><span><i class="k-gate"></i>Gate</span><span><i class="k-foe"></i>Foe</span></div>
      <div class="small">Landmarks <b class="num">${found}/4</b> · Chests <b class="num">${opened}/12</b> · Regions <b class="num">${stones.filter(attuned).length}/${stones.length}</b>${W.lore ? ` · Hidden story ${S.lore[R.w] ? '<b>found</b>' : '<span class="muted">not found</span>'}` : ''}${W.hidden ? ` · Someone is hiding here: ${compJoined(W.hidden) ? '<b>found</b>' : '<span class="muted">not found</span>'}` : ''}</div>
      <h3>Fast travel</h3>
      <div class="small muted">Walk near a waystone to attune it. Attuned waystones are listed here.</div>
      <div class="ft-list">${stones.map(n => `<button class="opt ${attuned(n) ? '' : 'sealed'}" data-ft="${n.id}" ${attuned(n) ? '' : 'disabled'}><b>${attuned(n) ? esc(n.name) : 'Unexplored region'}</b><span class="small muted">${attuned(n) ? `${Math.round(dist(n.x, n.z, R.px, R.pz))} m away` : 'Find its waystone'}</span></button>`).join('')}</div>`,
      el => { requestAnimationFrame(() => drawMap($('#bigMap'), true)); el.querySelectorAll('[data-ft]').forEach(b => b.onclick = () => fastTravel(b.dataset.ft)); });
  }

  // ---------- actions ----------
  function engage(e, first) {
    savePos(); R.keys.clear(); R.jx = R.jy = 0;
    startEncounter(R.w, e.foe, e.lvl, first, e.id, e.tier);
    openBattle();
  }
  function attack() {
    if (R.foe) return engage(R.foe, true);
    say('No foe in reach. Walk up to a corrupted foe, then Attack to strike first.', 'sys');
  }
  function questDone(q) { say(`Side quest complete: ${q.title}. +${q.reward.gold} gold, +${q.reward.dia} Diamonds.`, 'you'); toast(`Side quest complete: ${q.title}`); render(); }
  function interact() {
    const n = R.near, W = DV.WORLDS[R.w - 1];
    if (!n) return say('Nothing to interact with here. Walk up to a shrine, chest, waystone, gate or person.', 'sys');
    if (n.kind === 'shrine') {
      if (stageOpen(R.w, n.s)) { savePos(); stageSheet(R.w, n.s); }
      else say(`This shrine is sealed. Cleanse ${DV.STAGE_NAMES[n.s - 1]} first.`, 'sys');
    } else if (n.kind === 'waystone') {
      attune(n.id); mapSheet();
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
      if (n.dir < 0) return travel(R.w - 1, 'gate');
      if (R.w >= DV.WORLDS.length) return say(S.worldsCleared >= R.w ? 'Beyond the Lattice, new realms are still forming.' : `The gate is dark until ${bossShort(W)} is defeated.`, 'sys');
      if (S.worldsCleared < R.w) return say(`The gate is out of tune. Defeat ${bossShort(W)} to steady this realm's note.`, 'sys');
      travel(R.w + 1, 'back');
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
    if (outcome === 'lose') {
      if (w && w !== R.w) build(w);
      placePlayer([TOWN_C[0], TOWN_C[1] + 6]); savePos();
      say(`You wake in ${townInfo(R.w).town} with 25% HP. Rest inside the barrier to recover.`, 'sys');
      if (field) { const e = enemies.find(x => x.id === field.id); if (e) { e.x = e.hx; e.z = e.hz; } }
      return;
    }
    if (field) {
      const e = enemies.find(x => x.id === field.id);
      if (e && outcome === 'win') { const sec = DV.FOE_TIERS[e.tier - 1].respawn; e.dead = Date.now() + sec * 1000; say(`${e.name} is cleansed. ${e.tier > 1 ? `Another will claim this ground in about ${Math.round(sec / 60)} minutes.` : 'More Rot will gather here in a minute.'}`, 'you'); }
      else if (e) { e.x = e.hx; e.z = e.hz; e.tx = e.hx; e.tz = e.hz; say(outcome === 'flee' ? 'You slip away.' : 'You stagger back, battered but alive.', 'sys'); }
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
        <div class="small muted num">Party: ${['hero', ...S.party].map(k => `${k === 'hero' ? 'You' : DV.COMPANIONS[k].name} ${Math.round(vitOf(k) * 100)}% HP / ${Math.round(mpOf(k) * 100)}% MP`).join(' · ')}</div>
        <button class="btn gold" id="innRest" ${hurt && S.gold >= innPrice() ? '' : 'disabled'}>${hurt ? `Rest to full HP and MP · ${innPrice().toLocaleString()} gold` : 'Everyone is already rested'}</button>`, el => {
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
    const mf = mpOf('hero'), mt = $('#rwMpText'), mb = $('#rwMpBar');
    if (mt) mt.textContent = `${Math.round(st.mp * mf)}/${st.mp}`; if (mb) mb.style.width = Math.round(mf * 100) + '%';
    const ms = $('#rwMana'); if (ms) { ms.disabled = !S.potions.mp || mf >= 1; ms.querySelector('small').textContent = S.potions.mp; }
    const xb = $('#rwXpBar'); if (xb) xb.style.width = Math.min(100, Math.round(S.xp / xpNeed(S.level) * 100)) + '%';
    const pp = $('#rwPartyHp'); if (pp) pp.textContent = S.party.map(k => `${DV.COMPANIONS[k].name} ${Math.round(vitOf(k) * 100)}%`).join(' · ');
    const c = $('#rwTown'); if (c) { c.hidden = !R.town; c.textContent = R.town ? `In town · healing 1%/s` : ''; }
    const tb = $('#rwTonic'); if (tb) { tb.disabled = !S.potions.hp || f >= 1; tb.querySelector('small').textContent = S.potions.hp; }
  }

  // ---------- HUD ----------
  function updateButtons() {
    const a = $('#rwAttack'), i = $('#rwInteract'); if (!a) return;
    a.querySelector('small').textContent = R.foe ? `${R.foe.name} · Lv ${R.foe.lvl}` : 'No foe in reach';
    a.classList.toggle('ready', !!R.foe);
    const n = R.near;
    i.querySelector('small').textContent = !n ? 'Nothing nearby'
      : n.kind === 'shrine' ? (stageOpen(R.w, n.s) ? `Enter ${n.s === 4 ? 'boss shrine' : DV.STAGE_NAMES[n.s]}` : 'Sealed shrine')
      : n.kind === 'chest' ? (S.chests[n.key] ? 'Empty chest' : 'Open chest')
      : n.kind === 'npc' || n.kind === 'villager' ? `Talk to ${n.label}` : n.kind === 'lore' ? (S.lore[R.w] ? 'Read again' : 'Read the lore stone')
      : n.kind === 'hidden' ? 'Talk to the stranger' : n.kind === 'waystone' ? `Waystone · ${n.name}` : n.kind === 'mark' ? n.name : n.label;
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
  // The World view fills the screen with the HUD drawn over the scene. On a phone held upright it is turned sideways
  // (wide screen) unless the player switches that off in the menu; a phone held sideways or a computer shows it as is.
  // Rotated, the frame's "up" points to the right edge of the screen, so touch movement is turned back to frame axes.
  const toFrame = (dx, dy) => R.rot ? [dy, -dx] : [dx, dy];
  function layoutStage() {
    const st = $('#rwStage'), fr = $('#rwFrame'); if (!st || !fr) return;
    const w = st.clientWidth || window.innerWidth, h = window.innerHeight;
    const phone = matchMedia('(pointer: coarse)').matches || w < 640;
    R.rot = S.settings.wide !== false && h > w * 1.05 && phone;
    st.style.height = h + 'px'; st.classList.toggle('rot', R.rot);
    fr.style.width = (R.rot ? h : w) + 'px'; fr.style.height = (R.rot ? w : h) + 'px';
    fr.style.setProperty('--fw', (R.rot ? h : w) + 'px');
    fr.classList.toggle('compact', (R.rot ? w : h) < 520);
    fr.classList.toggle('touch', phone); fr.classList.toggle('narrow', (R.rot ? h : w) < 1000);
  }
  window.addEventListener('resize', () => { if (tab === 'world') layoutStage(); });
  function ensure() {
    if (ok !== null) return ok;
    wrap = document.createElement('div'); wrap.className = 'rw-canvas-wrap';
    canvas = document.createElement('canvas'); canvas.className = 'rw-canvas'; canvas.setAttribute('aria-label', 'Open world view');
    labelsBox = document.createElement('div'); labelsBox.className = 'rw-labels';
    mini = document.createElement('canvas'); mini.className = 'rw-mini'; mini.setAttribute('aria-label', 'Minimap. Tap to open the full map.');
    wrap.append(canvas, labelsBox, mini);
    ok = Gfx.init(canvas);
    if (!ok) return false;
    mini.onclick = mapSheet;
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { id:e.pointerId, x:e.clientX, y:e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const [dx] = toFrame(e.clientX - drag.x, e.clientY - drag.y);
      R.yaw -= dx * .009; drag.x = e.clientX; drag.y = e.clientY;
    });
    const end = e => { if (drag && drag.id === e.pointerId) drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', e => { e.preventDefault(); R.zoom = clamp(R.zoom * (e.deltaY > 0 ? 1.08 : .93), .6, 1.8); }, { passive:false });
    window.addEventListener('keydown', e => {
      if (!active() || /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { R.keys.add(k); e.preventDefault(); }
      else if (k === ' ' || k === 'f') { e.preventDefault(); attack(); }
      else if (k === 'e' || k === 'enter') { e.preventDefault(); interact(); }
      else if (k === 'm') mapSheet();
      else if (k === 'b' || k === 'i') toggleBag();
      else if (k === 'l') toggleLog();
      else if (k === 'escape') menuSheet();
      else if (k === 'q') R.yaw += .3; else if (k === 'r') R.yaw -= .3;
      else if (k === '-' || k === '_') R.zoom = clamp(R.zoom * 1.1, .6, 1.8); else if (k === '=' || k === '+') R.zoom = clamp(R.zoom / 1.1, .6, 1.8);
    });
    window.addEventListener('keyup', e => R.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => R.keys.clear());
    const st = S.realm && S.realm.w <= unlockedWorld() ? S.realm : null;
    build(st ? st.w : unlockedWorld()); placePlayer(st ? [st.x, st.z] : null);
    say(`${DV.WORLDS[R.w - 1].name}. Follow the path to the shrines. Gold markers above landmarks show places you have not explored. Walk near a waystone to unlock fast travel to its region.`, 'sys');
    requestAnimationFrame(loop);
    return true;
  }
  function toggleBag(force) { const b = $('#rwBag'); if (!b) return; b.hidden = force != null ? !force : !b.hidden; $('#rwBagBtn').classList.toggle('on', !b.hidden); }
  function toggleLog() { const l = $('#rwLogBox'); if (!l) return; l.classList.toggle('min'); try { localStorage.setItem('dv.logmin', l.classList.contains('min') ? '1' : ''); } catch (e) {} }
  function menuSheet() {
    const TABS_ALL = [['story','Story'],['party','Party'],['hero','Hero'],['class','Class'],['skills','Skills'],['gear','Gear'],['shop','Bazaar']];
    const fs = !!document.fullscreenElement;
    openSheet(`<div class="eyebrow">Menu</div><h2>${esc(S.name)} <span class="muted num" style="font-size:15px">Lv ${S.level}</span></h2>
      <div class="menu-grid">${TABS_ALL.map(([id, n]) => `<button class="opt" data-go="${id}"><b>${n}</b></button>`).join('')}
        <button class="opt" id="mDaily"><b>Daily${dailyPending() ? ' •' : ''}</b></button><button class="opt" id="mAcct"><b>☁ Account</b></button></div>
      <h3>Display</h3>
      <label class="row small"><input type="checkbox" id="mWide" ${S.settings.wide !== false ? 'checked' : ''}> Wide screen on phones (turn the World view sideways when the phone is upright)</label>
      ${document.fullscreenEnabled ? `<button class="btn" id="mFull">${fs ? 'Exit full screen' : 'Full screen'}</button>` : ''}
      <div class="small muted">Keyboard: WASD or arrows move · drag or Q/R turn · mouse wheel or +/− zoom · Space attack · E interact · M map · B bag · L log · Esc menu</div>`, el => {
      el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closeSheet(); tab = b.dataset.go; render(); window.scrollTo(0, 0); });
      el.querySelector('#mDaily').onclick = () => dailySheet(false);
      el.querySelector('#mAcct').onclick = () => Account.sheet();
      el.querySelector('#mWide').onchange = e => { S.settings.wide = e.target.checked; save(); };
      const f = el.querySelector('#mFull');
      if (f) f.onclick = async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else { await document.documentElement.requestFullscreen(); try { await screen.orientation.lock('landscape'); } catch (e) {} }
        } catch (e) { toast('Full screen is not available here.'); }
        closeSheet();
      };
    });
  }
  function mount() {
    const box = $('#rwScene');
    layoutStage();
    if (!ensure()) { box.innerHTML = '<div class="rw-nogl">This device could not start the 3D view (WebGL is turned off or unsupported). The Story tab still has every stage.</div>'; return; }
    box.appendChild(wrap);
    const joy = $('#rwJoy'), knob = joy.querySelector('i'); let jid = null, c0 = null;
    const upd = e => {
      const R0 = joy.offsetWidth / 2 - 8; let [dx, dy] = toFrame(e.clientX - c0[0], e.clientY - c0[1]);
      const l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; }
      R.jx = dx / R0; R.jy = dy / R0; knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    joy.onpointerdown = e => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); const r = joy.getBoundingClientRect(); c0 = [r.left + r.width / 2, r.top + r.height / 2]; upd(e); };
    joy.onpointermove = e => { if (e.pointerId === jid) upd(e); };
    joy.onpointerup = joy.onpointercancel = e => { if (e.pointerId !== jid) return; jid = null; R.jx = R.jy = 0; knob.style.transform = ''; };
    $('#rwAttack').onclick = attack; $('#rwInteract').onclick = interact;
    $('#rwTravel').onclick = travelSheet; $('#rwMap').onclick = mapSheet; $('#rwMenu').onclick = menuSheet;
    $('#rwBagBtn').onclick = () => toggleBag(); $('#rwBagX').onclick = () => toggleBag(false);
    $('#rwLogToggle').onclick = toggleLog;
    try { if (localStorage.getItem('dv.logmin')) $('#rwLogBox').classList.add('min'); } catch (e) {}
    $('#rwTonic').onclick = () => { const err = drinkTonic(); if (err) return toast(err); updateVitals(); say('You drink a Facet Tonic.', 'you'); };
    $('#rwMana').onclick = () => { const err = drinkManaShard(); if (err) return toast(err); updateVitals(); say('You crush a Mana Shard. Your MP surges.', 'you'); };
    R.town = townAt(R.px, R.pz); updateVitals(); R.region = regionName(); const rg = $('#rwRegion'); if (rg) rg.textContent = R.region;
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
  function reload() {   // a different save was loaded (cloud sync): rebuild the realm it was in
    if (!ok) return; const st = S.realm && S.realm.w <= unlockedWorld() ? S.realm : null;
    build(st ? st.w : unlockedWorld()); placePlayer(st ? [st.x, st.z] : null); R.log = []; R.town = undefined;
  }
  return { mount, afterBattle, updateVitals, fastTravel, reload, get region() { return R.region || regionName(); }, get world() { ensure(); return R.w; }, say, get _state() { return { R, enemies, ents, towns, build, H, RADIUS, statics, chunks, attune }; } };
})();

// ---------- World screen ----------
// Everything from the wireframe sits on top of the scene: character, HP/MP/XP and stats (Bag), inventory, action log
// and controls. The rest of the app is one tap away in the Menu.
SCREENS.world = st => {
  Realm.world;
  const W = DV.WORLDS[Realm.world - 1], o = DV.LOOK.origin.find(x => x.id === S.origin), at = a => S.attrs[a] + (o.bonus[a] || 0);
  const inv = DV.SLOTS.filter(sl => S.equip[sl]).map(sl => { const it = S.equip[sl];
    return `<li style="color:${DV.RARITY[it.rarity].color}">${esc(it.name)}${it.plus ? ' +' + it.plus : ''} <span class="muted">· ${DV.SLOT_NAME[sl]}</span></li>`; });
  inv.push(`<li>Facet Tonic ×${S.potions.hp}</li>`, `<li>Mana Shard ×${S.potions.mp}</li>`, `<li>Upgrade shards ×${S.shards}</li>`);
  if (S.inv.length) inv.push(`<li class="muted">${S.inv.length} unequipped item${S.inv.length > 1 ? 's' : ''} in Gear</li>`);
  const q = questState(W.id), hp = vitOf('hero'), mp = mpOf('hero');
  $('#screen').innerHTML = `<div class="rw-stage" id="rwStage"><div class="rw-frame" id="rwFrame" style="--wh:${W.hue}">
    <section class="rw-scene" id="rwScene" aria-label="Open world"></section>
    <div class="hud">
      <div class="hud-tl"><div class="hud-char hud-glass">
        <div class="row" style="gap:8px"><div style="width:34px;flex:none">${avatarSVG(S.look, S.cls, 34)}</div>
          <div class="grow"><div class="rw-name"><b>${esc(S.name)}</b> <span class="muted num">Lv ${S.level}</span>${S.attrPts ? ` <span class="pts">+${S.attrPts}</span>` : ''}</div>
            <div class="hud-bar hp"><i id="rwHpBar" style="width:${Math.round(hp * 100)}%"></i><span>HP <b class="num" id="rwHpText">${Math.round(st.hp * hp)}/${st.hp}</b></span></div>
            <div class="hud-bar mp"><i id="rwMpBar" style="width:${Math.round(mp * 100)}%"></i><span>MP <b class="num" id="rwMpText">${Math.round(st.mp * mp)}/${st.mp}</b></span></div>
            <div class="hud-bar xp"><i id="rwXpBar" style="width:${Math.min(100, Math.round(S.xp / xpNeed(S.level) * 100))}%"></i></div></div></div>
        <div class="small rw-party"><span id="rwPartyHp" class="num"></span>${S.party.length ? '' : '<span class="muted">No companions yet</span>'}</div>
        <span class="chip pure" id="rwTown" hidden></span>
      </div>
      <div class="hud-realm"><div class="eyebrow num">Realm ${W.id} · ${realmStatus(W.id)}</div><b>${esc(W.name)}</b><div class="small rw-region" id="rwRegion">${esc(Realm.region)}</div></div></div>
      <div class="hud-top-btns">
        <button class="hud-btn" id="rwMenu" aria-label="Menu">☰<small>Menu</small></button>
        <button class="hud-btn" id="rwBagBtn" aria-label="Character and inventory">◈<small>Bag</small></button>
        <button class="hud-btn" id="rwMap" aria-label="Map and fast travel">◎<small>Map</small></button>
        <button class="hud-btn" id="rwTravel" aria-label="Travel between realms">⟁<small>Realms</small></button>
      </div>
      <div class="hud-log hud-glass" id="rwLogBox">
        <button class="hud-log-head" id="rwLogToggle" aria-label="Show or hide the action log"><span>Action log</span><span class="small muted num" id="rwLogCount"></span></button>
        <div class="log" id="rwLog" aria-live="polite" tabindex="0"></div>
      </div>
      <div class="rw-joy" id="rwJoy" role="application" aria-label="Move: drag to walk"><i></i></div>
      <div class="hud-acts">
        <button class="act rw-btn hud-attack" id="rwAttack"><b>Attack</b><small>No foe in reach</small></button>
        <button class="act rw-btn hud-interact" id="rwInteract"><b>Interact</b><small>Nothing nearby</small></button>
        <button class="hud-pot hp" id="rwTonic" aria-label="Drink a Facet Tonic">✚<small>${S.potions.hp}</small></button>
        <button class="hud-pot mp" id="rwMana" aria-label="Use a Mana Shard">✦<small>${S.potions.mp}</small></button>
      </div>
      <div class="hud-keys small">WASD move · drag to look · wheel zoom · Space attack · E interact · M map · B bag · Esc menu</div>
      <aside class="hud-bag hud-glass" id="rwBag" hidden>
        <div class="row"><h3 class="grow">${esc(S.name)} · Lv ${S.level}</h3><button class="btn sm" id="rwBagX">Close</button></div>
        <div class="rw-stats">
          <div><span>Strength</span><b class="num">${at('str')}</b><small class="num">ATK ${st.atk}</small></div>
          <div><span>Agility</span><b class="num">${at('agi')}</b><small class="num">SPD ${st.spd}</small></div>
          <div><span>Intelligence</span><b class="num">${at('int')}</b><small class="num">MAG ${st.mag}</small></div>
          <div><span>XP</span><b class="num">${fmtK(S.xp)}/${fmtK(xpNeed(S.level))}</b></div>
          <div><span>Level</span><b class="num">${S.level}</b>${S.attrPts ? `<small style="color:var(--gold)">${S.attrPts} pts to spend</small>` : ''}</div>
        </div>
        <h3>Inventory</h3><ul class="rw-inv">${inv.join('')}</ul>
        <div class="small rw-quest">Quest: <b>${esc(W.quest.title)}</b> ${q.done ? '<span class="chip pure">Done</span>' : `<span class="muted num">${esc(questGoalText(W.id))} (${q.prog}/${q.need})</span>`}</div>
      </aside>
    </div>
  </div></div>`;
  Realm.mount();
};
