// Diamondverse — Babylon.js renderer for the open world, with the same API as the classic renderer (gfx.js), so the
// realm, characters and foes draw through either one. The game calls draw() for every part each frame
// (immediate mode); this renderer collects those calls into thin instances, one GPU draw per primitive kind, and
// renders the Babylon scene in end(). It adds real-time shadows, HDR bloom, ACES tone mapping, FXAA, a gradient sky
// dome and linear fog. (Ink outlines stay a Classic-renderer look for now.)
// Babylon.js is loaded from a CDN in index.html. If it is missing (offline, blocked) or fails, the game uses the
// classic renderer instead; the player can also choose it in Menu → Display.
const GfxBabylon = (() => {
  const B = () => window.BABYLON;
  const m4 = GfxClassic.m4, rot = GfxClassic.rot, hex2rgb = GfxClassic.hex2rgb;
  let engine, scene, camera, sun, hemi, shadows, pipeline, sky, canvas, VP, cam, quality = 'high', skyKey = '';
  const masters = new Map(), geos = new Set(), shown = new Set();

  // ---- primitive geometry (same shapes and sizes as gfx.js: base at y=0, 1 unit tall, centre (0,.5,0)) ----
  function arrays(tris, opt = {}) {
    const P = [], N = [], C = opt.centre || [0, .5, 0], up = opt.up;
    tris.forEach(t => {
      let [a, b, c] = t;
      let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const mx = (a[0] + b[0] + c[0]) / 3 - C[0], my = (a[1] + b[1] + c[1]) / 3 - C[1], mz = (a[2] + b[2] + c[2]) / 3 - C[2];
      if ((up ? ny : nx * mx + ny * my + nz * mz) < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
      [a, b, c].forEach(p => {
        P.push(p[0], p[1], p[2]);
        if (opt.smooth) { const d = [p[0] - C[0], p[1] - C[1], p[2] - C[2]], dl = Math.hypot(...d) || 1; N.push(d[0] / dl, d[1] / dl, d[2] / dl); }
        else N.push(nx, ny, nz);
      });
    });
    return { P, N };
  }
  const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];
  const ring = (n, r, y) => Array.from({ length:n }, (_, i) => { const t = i / n * Math.PI * 2; return [Math.cos(t) * r, y, Math.sin(t) * r]; });
  function prism(n, rTop) {
    const lo = ring(n, .5, 0), hi = ring(n, rTop, 1), t = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n;
      if (rTop > 0) t.push(...quad(lo[i], hi[i], hi[j], lo[j])); else t.push([lo[i], [0, 1, 0], lo[j]]);
      t.push([[0, 0, 0], lo[i], lo[j]]); if (rTop > 0) t.push([[0, 1, 0], hi[j], hi[i]]); }
    return t;
  }
  function gem(n) { const g = ring(n, .5, .38), t = []; for (let i = 0; i < n; i++) { const j = (i + 1) % n; t.push([[0, 1, 0], g[j], g[i]], [[0, 0, 0], g[i], g[j]]); } return t; }
  function box() {
    const p = (x, y, z) => [x - .5, y, z - .5], v = [p(0,0,0), p(1,0,0), p(1,0,1), p(0,0,1), p(0,1,0), p(1,1,0), p(1,1,1), p(0,1,1)];
    return [...quad(v[0], v[1], v[2], v[3]), ...quad(v[4], v[7], v[6], v[5]), ...quad(v[0], v[4], v[5], v[1]), ...quad(v[1], v[5], v[6], v[2]), ...quad(v[2], v[6], v[7], v[3]), ...quad(v[3], v[7], v[4], v[0])];
  }
  function sphere(seg, rings) {
    const P = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / rings * Math.PI; return [Math.cos(th) * Math.sin(ph) * .5, .5 + Math.cos(ph) * .5, Math.sin(th) * Math.sin(ph) * .5]; };
    const t = []; for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); if (j) t.push([a, b, c]); if (j < rings - 1) t.push([a, c, d]); }
    return t;
  }
  let SHAPES = null;
  const shapes = () => SHAPES || (SHAPES = {
    box:arrays(box()), cyl:arrays(prism(10, .5)), hex:arrays(prism(6, .5)), cone:arrays(prism(7, 0)), gem:arrays(gem(6)), gem8:arrays(gem(8)),
    disc:arrays(prism(24, .5)), sphere:arrays(sphere(16, 10), { smooth:true }), ball:arrays(sphere(8, 5), { smooth:true }), post:arrays(prism(5, .42)),
    ground:arrays(quad([-1, 0, -1], [-1, 0, 1], [1, 0, 1], [1, 0, -1]), { up:true }) });

  function meshFrom(name, P, N, C) {
    const X = B(), m = new X.Mesh(name, scene), vd = new X.VertexData();
    vd.positions = P instanceof Float32Array ? P : new Float32Array(P); vd.normals = N instanceof Float32Array ? N : new Float32Array(N);
    if (C) vd.colors = C;
    const n = vd.positions.length / 3, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i;
    vd.indices = idx; vd.applyToMesh(m, false);
    m.isPickable = false;
    return m;
  }
  const mats = {};
  function material(kind) {
    if (mats[kind]) return mats[kind];
    const X = B(), m = new X.StandardMaterial('m-' + kind, scene);
    m.diffuseColor = new X.Color3(1, 1, 1); m.specularColor = new X.Color3(.06, .06, .08); m.backFaceCulling = false;
    if (kind === 'glow') { m.disableLighting = true; }
    if (kind.startsWith('alpha')) { m.alpha = { alpha1:.14, alpha2:.38, alpha3:.75 }[kind]; m.specularColor = new X.Color3(0, 0, 0); }
    if (kind === 'sky') { m.disableLighting = true; m.fogEnabled = false; }
    return (mats[kind] = m);
  }
  // One master mesh per primitive and look ('lit', 'glow' = unlit and bright enough to bloom, 'alpha1..3' = see-through).
  function master(mesh, look) {
    const key = mesh + ':' + look; let M = masters.get(key); if (M) return M;
    const X = B(), s = shapes()[mesh] || shapes().box, m = meshFrom(key, s.P, s.N);
    m.material = material(look);
    m.alwaysSelectAsActiveMesh = true; m.doNotSyncBoundingInfo = true;
    if (!look.startsWith('alpha') && look !== 'glow') { m.receiveShadows = true; if (shadows) shadows.addShadowCaster(m, false); }
    M = { m, cap:0, n:0, mat:null, col:null };
    grow(M, 64); masters.set(key, M);
    return M;
  }
  function grow(M, cap) {
    const mat = new Float32Array(cap * 16), col = new Float32Array(cap * 4);
    if (M.mat) { mat.set(M.mat); col.set(M.col); }
    M.mat = mat; M.col = col; M.cap = cap;
    M.m.thinInstanceSetBuffer('matrix', mat, 16, false); M.m.thinInstanceSetBuffer('color', col, 4, false);
  }

  function init(cv) {
    const X = B(); if (!X || !X.Engine) return false;
    canvas = cv;
    engine = new X.Engine(cv, true, { stencil:true, preserveDrawingBuffer:false, powerPreference:'high-performance' }, false);
    const phone = typeof isPhone === 'function' && isPhone();
    quality = (typeof S !== 'undefined' && S && S.settings && S.settings.gfx) || (phone ? 'medium' : 'high');
    engine.setHardwareScalingLevel(1 / Math.min(phone ? 2 : 2, window.devicePixelRatio || 1));
    scene = new X.Scene(engine);
    scene.useRightHandedSystem = true; scene.skipPointerMovePicking = true; scene.autoClearDepthAndStencil = true;
    scene.clearColor = new X.Color4(.1, .1, .15, 1); scene.ambientColor = new X.Color3(0, 0, 0);
    camera = new X.FreeCamera('cam', new X.Vector3(0, 5, 10), scene); camera.fov = .9; camera.minZ = .3; camera.maxZ = 420;
    hemi = new X.HemisphericLight('hemi', new X.Vector3(0, 1, 0), scene); hemi.intensity = .62; hemi.specular = new X.Color3(0, 0, 0);
    const L = new X.Vector3(.45, .8, .35).normalize();
    sun = new X.DirectionalLight('sun', L.scale(-1), scene); sun.intensity = 1.05; sun.diffuse = new X.Color3(1, .96, .88);
    sun.autoUpdateExtends = false; sun.autoCalcShadowZBounds = false;
    sun.orthoLeft = -48; sun.orthoRight = 48; sun.orthoTop = 48; sun.orthoBottom = -48; sun.shadowMinZ = 1; sun.shadowMaxZ = 320;
    if (quality !== 'low') {
      shadows = new X.ShadowGenerator(quality === 'high' ? 2048 : 1024, sun);
      if (engine.webGLVersion >= 2) { shadows.usePercentageCloserFiltering = true; shadows.filteringQuality = X.ShadowGenerator.QUALITY_MEDIUM; }
      else shadows.usePoissonSampling = true;
      shadows.bias = .0015; shadows.normalBias = .03; shadows.darkness = .35;
    }
    scene.fogMode = X.Scene.FOGMODE_LINEAR;
    // sky: a dome with a vertical gradient, re-coloured when the realm changes
    sky = X.MeshBuilder.CreateSphere('sky', { diameter:760, segments:20, sideOrientation:X.Mesh.BACKSIDE }, scene);
    sky.infiniteDistance = true; sky.material = material('sky'); sky.isPickable = false; sky.applyFog = false;
    if (quality !== 'low') {
      pipeline = new X.DefaultRenderingPipeline('dp', true, scene, [camera]);
      pipeline.samples = engine.webGLVersion >= 2 && quality === 'high' ? 4 : 1;
      pipeline.fxaaEnabled = true;
      pipeline.bloomEnabled = true; pipeline.bloomThreshold = .82; pipeline.bloomWeight = .32; pipeline.bloomKernel = 48; pipeline.bloomScale = .5;
      pipeline.imageProcessingEnabled = true;
      const ip = pipeline.imageProcessing;
      ip.toneMappingEnabled = true; ip.toneMappingType = X.ImageProcessingConfiguration.TONEMAPPING_ACES;
      ip.exposure = 1.15; ip.contrast = 1.12; ip.vignetteEnabled = true; ip.vignetteWeight = 1.4; ip.vignetteColor = new X.Color4(0, 0, 0, 0);
    }
    return true;
  }

  const c3 = (a) => new (B().Color3)(a[0], a[1], a[2]);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function paintSky(top, hor) {
    const key = top + hor; if (key === skyKey) return; skyKey = key;
    const X = B(), T = hex2rgb(top), Hh = hex2rgb(hor), pos = sky.getVerticesData(X.VertexBuffer.PositionKind), n = pos.length / 3, col = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const y = pos[i * 3 + 1] / 380, t = Math.max(0, Math.min(1, (y - .02) / .55)), s = t * t * (3 - 2 * t), c = mix(Hh, T, s);
      col.set([c[0], c[1], c[2], 1], i * 4);
    }
    sky.setVerticesData(X.VertexBuffer.ColorKind, col, true);
  }

  function frame(eye, target, skyCols, fogRange) {
    const X = B(), w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    if (engine.getRenderWidth() !== Math.round(w / engine.getHardwareScalingLevel()) || engine.getRenderHeight() !== Math.round(h / engine.getHardwareScalingLevel())) engine.resize();
    const top = hex2rgb(skyCols.top), hor = hex2rgb(skyCols.horizon);
    scene.clearColor = new X.Color4(hor[0], hor[1], hor[2], 1);
    scene.fogColor = c3(hor); scene.fogStart = fogRange[0] * 1.1; scene.fogEnd = fogRange[1] * 1.05;
    hemi.diffuse = c3(mix(top, [1, 1, 1], .45)); hemi.groundColor = c3(mix(hor, [0, 0, 0], .45));
    paintSky(skyCols.top, skyCols.horizon);
    camera.position.set(eye[0], eye[1], eye[2]); camera.setTarget(new X.Vector3(target[0], target[1], target[2]));
    const L = new X.Vector3(.45, .8, .35).normalize();
    sun.position = new X.Vector3(target[0] + L.x * 150, target[1] + L.y * 150, target[2] + L.z * 150);
    VP = m4.mul(m4.persp(.9, w / h, .3, 420), m4.lookAt(eye, target, [0, 1, 0])); cam = eye;
    masters.forEach(M => { M.n = 0; });
    shown.clear();
  }
  function draw(o) {
    if (o.geo) { shown.add(o.geo); return; }
    const a = o.a ?? 1, e = o.e || 0;
    const look = a < 1 ? (a < .2 ? 'alpha1' : a < .5 ? 'alpha2' : 'alpha3') : e >= .6 ? 'glow' : 'lit';
    const M = master(o.mesh || 'box', look);
    if (M.n >= M.cap) grow(M, M.cap * 2);
    const mat = o.M || m4.model(o.x || 0, o.y || 0, o.z || 0, o.ry || 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1, o.rx || 0, o.rz || 0);
    M.mat.set(mat, M.n * 16);
    const c = o.rgb || (o.rgb = hex2rgb(o.color || '#ffffff')), k = look === 'glow' ? 1 + e * .9 : 1 + e * .5;
    M.col[M.n * 4] = c[0] * k; M.col[M.n * 4 + 1] = c[1] * k; M.col[M.n * 4 + 2] = c[2] * k; M.col[M.n * 4 + 3] = 1;
    M.n++;
  }
  function end() {
    masters.forEach(M => {
      M.m.isVisible = M.n > 0;
      if (!M.n) return;
      M.m.thinInstanceCount = M.n;
      M.m.thinInstanceBufferUpdated('matrix'); M.m.thinInstanceBufferUpdated('color');
    });
    geos.forEach(g => { g.mesh.isVisible = shown.has(g); });
    scene.render();
  }
  function project(x, y, z) {
    const c = m4.xform(VP, [x, y, z]); if (c[3] <= .1) return null;
    return { x:(c[0] / c[3] * .5 + .5) * canvas.clientWidth, y:(-c[1] / c[3] * .5 + .5) * canvas.clientHeight, d:c[3] };
  }
  // Terrain chunk: vertex-coloured, faceted, receives shadows.
  function terrain(x0, z0, size, n, h, col) {
    const step = size / n, Hs = [], Cs = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + i * step, z = z0 + j * step, y = h(x, z); Hs.push([x, y, z]); Cs.push(col(x, z, y)); }
    const id = (i, j) => j * (n + 1) + i, P = [], N = [], C = [];
    const tri = (a, b, c) => {
      const A = Hs[a], Bv = Hs[b], Cv = Hs[c];
      let ux = Bv[0] - A[0], uy = Bv[1] - A[1], uz = Bv[2] - A[2], vx = Cv[0] - A[0], vy = Cv[1] - A[1], vz = Cv[2] - A[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      let order = [a, b, c]; if (ny < 0) { order = [a, c, b]; nx = -nx; ny = -ny; nz = -nz; }
      order.forEach(k => { P.push(...Hs[k]); N.push(nx / l, ny / l, nz / l); C.push(...Cs[k], 1); });
    };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1); tri(a, c, b); tri(a, d, c); }
    const m = meshFrom('terrain', P, N, new Float32Array(C));
    m.material = material('lit'); m.receiveShadows = true; m.isVisible = false;
    const g = { mesh:m }; geos.add(g); return g;
  }
  // Many static objects baked into one vertex-coloured mesh (trees, rocks, houses in one 50-unit cell).
  function bake(list) {
    const S0 = shapes(); let total = 0; list.forEach(o => total += (S0[o.mesh] || S0.box).P.length / 3);
    const P = new Float32Array(total * 3), N = new Float32Array(total * 3), C = new Float32Array(total * 4); let k = 0;
    list.forEach(o => {
      const s = S0[o.mesh] || S0.box, M = m4.model(o.x || 0, o.y || 0, o.z || 0, o.ry || 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1, o.rx || 0, o.rz || 0);
      const sx = o.sx ?? 1, sy = o.sy ?? 1, sz = o.sz ?? 1, c = hex2rgb(o.color || '#ffffff'), gl = 1 + (o.e || 0) * 1.3, n = s.P.length / 3;
      for (let i = 0; i < n; i++, k++) {
        const w = m4.xform(M, [s.P[i * 3], s.P[i * 3 + 1], s.P[i * 3 + 2]]); P[k * 3] = w[0]; P[k * 3 + 1] = w[1]; P[k * 3 + 2] = w[2];
        const nn = rot([s.N[i * 3] / sx, s.N[i * 3 + 1] / sy, s.N[i * 3 + 2] / sz], o.ry, o.rx, o.rz), l = Math.hypot(...nn) || 1;
        N[k * 3] = nn[0] / l; N[k * 3 + 1] = nn[1] / l; N[k * 3 + 2] = nn[2] / l;
        C[k * 4] = Math.min(1.6, c[0] * gl); C[k * 4 + 1] = Math.min(1.6, c[1] * gl); C[k * 4 + 2] = Math.min(1.6, c[2] * gl); C[k * 4 + 3] = 1;
      }
    });
    const m = meshFrom('baked', P, N, C);
    m.material = material('lit'); m.receiveShadows = true; m.isVisible = false;
    if (shadows) shadows.addShadowCaster(m, false);
    const g = { mesh:m }; geos.add(g); return g;
  }
  function free(g) { if (!g || !g.mesh) return; geos.delete(g); if (shadows) shadows.removeShadowCaster(g.mesh, false); g.mesh.dispose(); g.mesh = null; }
  return { name:'Babylon.js', init, frame, draw, end, project, hex2rgb, terrain, bake, free, rot, m4, get quality() { return quality; } };
})();

// The renderer the game draws through. Picks Babylon.js when it loaded and the player has not chosen Classic.
const Gfx = (() => {
  let impl = GfxClassic;
  const pref = () => (typeof S !== 'undefined' && S && S.settings && S.settings.renderer) || 'babylon';
  const api = {
    init(cv) {
      if (pref() !== 'classic' && window.BABYLON) {
        try { if (GfxBabylon.init(cv)) { impl = GfxBabylon; return true; } }
        catch (e) { console.error('Babylon.js renderer failed to start', e); api.fail(); return false; }
      }
      impl = GfxClassic; return GfxClassic.init(cv);
    },
    // A Babylon.js error mid-game: remember to use Classic and reload once, so the player is never left with a black view.
    fail() {
      if (impl !== GfxBabylon && pref() === 'classic') return;
      try { S.settings.renderer = 'classic'; save(); } catch (e) {}
      try { if (sessionStorage.getItem('dv.gfxreload')) return; sessionStorage.setItem('dv.gfxfail', '1'); sessionStorage.setItem('dv.gfxreload', '1'); } catch (e) { return; }
      location.reload();   // at most once per browser session
    },
    get name() { return impl === GfxBabylon ? 'Babylon.js' : 'Classic WebGL'; },
    get babylonAvailable() { return !!window.BABYLON; },
    frame:(...a) => impl.frame(...a), draw:o => impl.draw(o), end:() => impl.end && impl.end(), project:(...a) => impl.project(...a),
    terrain:(...a) => impl.terrain(...a), bake:l => impl.bake(l), free:g => impl.free(g),
    hex2rgb:GfxClassic.hex2rgb, rot:GfxClassic.rot, m4:GfxClassic.m4
  };
  return api;
})();
