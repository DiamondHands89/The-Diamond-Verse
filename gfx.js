// Diamondverse — tiny WebGL renderer for the open world. No dependencies.
// Cel ("toon") shading in three light bands, a hemisphere sky light, a rim light, ink outlines for characters
// (inverted-hull pass), a gradient sky, vertex colours for terrain, and distance fog.
// Every primitive sits on y=0, is 1 unit tall and 1 unit wide (centre at y=.5), so scale = size.
const GfxClassic = (() => {
  let gl, prog, sky, loc = {}, sloc = {}, meshes = {}, canvas, white;

  const m4 = {
    persp(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return [f / aspect,0,0,0, 0,f,0,0, 0,0,(far + near) * nf,-1, 0,0,2 * far * near * nf,0];
    },
    lookAt(e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return [xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
    },
    mul(a, b) {
      const o = new Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      return o;
    },
    // translate * rotY * rotX * rotZ * scale
    model(x, y, z, ry, sx, sy, sz, rx, rz) {
      const cy = Math.cos(ry || 0), syn = Math.sin(ry || 0), cx = Math.cos(rx || 0), sxn = Math.sin(rx || 0), cz = Math.cos(rz || 0), szn = Math.sin(rz || 0);
      // R = Ry * Rx * Rz, columns are images of the unit axes
      const c0 = [cy * cz + syn * sxn * szn, cx * szn, -syn * cz + cy * sxn * szn];
      const c1 = [-cy * szn + syn * sxn * cz, cx * cz, syn * szn + cy * sxn * cz];
      const c2 = [syn * cx, -sxn, cy * cx];
      return [c0[0] * sx, c0[1] * sx, c0[2] * sx, 0, c1[0] * sy, c1[1] * sy, c1[2] * sy, 0, c2[0] * sz, c2[1] * sz, c2[2] * sz, 0, x, y, z, 1];
    },
    xform(m, p) {
      const x = p[0], y = p[1], z = p[2];
      return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], m[3] * x + m[7] * y + m[11] * z + m[15]];
    }
  };
  // Rotate a local offset by the same Ry·Rx·Rz used in model().
  function rot(v, ry, rx, rz) {
    let [x, y, z] = v; const cz = Math.cos(rz || 0), sz = Math.sin(rz || 0), cx = Math.cos(rx || 0), sx = Math.sin(rx || 0), cy = Math.cos(ry || 0), sy = Math.sin(ry || 0);
    [x, y] = [x * cz - y * sz, x * sz + y * cz];
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    return [x, y, z];
  }

  // ---- geometry ----
  // tris: [[a,b,c], ...] with optional per-vertex colours. Faces are wound to point away from the mesh centre
  // (all primitives are convex), so back-face culling and the outline pass work.
  function build(tris, opt = {}) {
    const pos = [], nor = [], col = [], C = opt.centre || [0, .5, 0], up = opt.up;
    tris.forEach(t => {
      let [a, b, c] = t, cols = t[3];
      let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      const mx = (a[0] + b[0] + c[0]) / 3 - C[0], my = (a[1] + b[1] + c[1]) / 3 - C[1], mz = (a[2] + b[2] + c[2]) / 3 - C[2];
      const out = up ? ny : nx * mx + ny * my + nz * mz;
      if (out < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; if (cols) cols = [cols[0], cols[2], cols[1]]; }
      [a, b, c].forEach((p, i) => {
        pos.push(...p);
        if (opt.smooth) { const d = [p[0] - C[0], p[1] - C[1], p[2] - C[2]], dl = Math.hypot(...d) || 1; nor.push(d[0] / dl, d[1] / dl, d[2] / dl); }
        else nor.push(nx, ny, nz);
        col.push(...(cols ? cols[i] : [1, 1, 1]));
      });
    });
    const buf = arr => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return b; };
    return { vb:buf(pos), nb:buf(nor), cb:buf(col), n:pos.length / 3, P:pos, N:nor };
  }
  const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];
  function ring(n, r, y, rot = 0) { return Array.from({ length:n }, (_, i) => { const t = rot + i / n * Math.PI * 2; return [Math.cos(t) * r, y, Math.sin(t) * r]; }); }
  function prism(n, rTop, rot) {
    const lo = ring(n, .5, 0, rot), hi = ring(n, rTop, 1, rot), t = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (rTop > 0) t.push(...quad(lo[i], hi[i], hi[j], lo[j])); else t.push([lo[i], [0, 1, 0], lo[j]]);
      t.push([[0, 0, 0], lo[i], lo[j]]);
      if (rTop > 0) t.push([[0, 1, 0], hi[j], hi[i]]);
    }
    return t;
  }
  function gem(n) { const g = ring(n, .5, .38), t = []; for (let i = 0; i < n; i++) { const j = (i + 1) % n; t.push([[0, 1, 0], g[j], g[i]], [[0, 0, 0], g[i], g[j]]); } return t; }
  function box() {
    const p = (x, y, z) => [x - .5, y, z - .5];
    const v = [p(0,0,0), p(1,0,0), p(1,0,1), p(0,0,1), p(0,1,0), p(1,1,0), p(1,1,1), p(0,1,1)];
    return [...quad(v[0], v[1], v[2], v[3]), ...quad(v[4], v[7], v[6], v[5]), ...quad(v[0], v[4], v[5], v[1]),
      ...quad(v[1], v[5], v[6], v[2]), ...quad(v[2], v[6], v[7], v[3]), ...quad(v[3], v[7], v[4], v[0])];
  }
  function sphere(seg, rings) {
    const P = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / rings * Math.PI; return [Math.cos(th) * Math.sin(ph) * .5, .5 + Math.cos(ph) * .5, Math.sin(th) * Math.sin(ph) * .5]; };
    const t = [];
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      if (j) t.push([a, b, c]); if (j < rings - 1) t.push([a, c, d]);
    }
    return t;
  }

  function init(cv) {
    canvas = cv;
    gl = cv.getContext('webgl', { antialias:true, alpha:false }) || cv.getContext('experimental-webgl');
    if (!gl) return false;
    const vs = `attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 uVP;uniform mat4 uM;uniform float uOut;
      varying vec3 vN;varying vec3 vW;varying vec3 vC;
      void main(){vec3 q=p+(p-vec3(0.0,0.5,0.0))*uOut;vec4 w=uM*vec4(q,1.0);vW=w.xyz;vN=mat3(uM)*n;vC=c;gl_Position=uVP*w;}`;
    const fs = `precision mediump float;varying vec3 vN;varying vec3 vW;varying vec3 vC;
      uniform vec3 uC;uniform vec3 uL;uniform vec3 uCam;uniform vec3 uFog;uniform vec2 uFogR;uniform float uE;uniform float uA;
      uniform vec3 uSky;uniform vec3 uGround;uniform float uInk;
      void main(){
        float f=smoothstep(uFogR.x,uFogR.y,distance(vW,uCam));
        if(uInk>0.5){gl_FragColor=vec4(mix(vec3(0.05,0.04,0.08),uFog,f),uA);return;}
        vec3 n=normalize(vN);float d=dot(n,uL);
        float band=0.58+0.27*smoothstep(0.02,0.08,d)+0.15*smoothstep(0.55,0.62,d);
        vec3 hemi=mix(uGround,uSky,n.y*0.5+0.5);
        float rim=pow(1.0-max(dot(n,normalize(uCam-vW)),0.0),3.0)*0.22;
        vec3 base=uC*vC;
        vec3 col=base*band*(0.72+0.38*hemi)+base*uE+rim*uSky;
        gl_FragColor=vec4(mix(col,uFog,f),uA);}`;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    ['uVP','uM','uC','uL','uCam','uFog','uFogR','uE','uA','uOut','uSky','uGround','uInk'].forEach(k => loc[k] = gl.getUniformLocation(prog, k));
    loc.p = gl.getAttribLocation(prog, 'p'); loc.n = gl.getAttribLocation(prog, 'n'); loc.c = gl.getAttribLocation(prog, 'c');
    // sky: one full-screen triangle with a vertical gradient
    sky = gl.createProgram();
    gl.attachShader(sky, sh(gl.VERTEX_SHADER, 'attribute vec2 a;varying float v;void main(){v=a.y*0.5+0.5;gl_Position=vec4(a,0.999,1.0);}'));
    gl.attachShader(sky, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying float v;uniform vec3 uTop;uniform vec3 uHor;void main(){gl_FragColor=vec4(mix(uHor,uTop,smoothstep(0.35,1.0,v)),1.0);}'));
    gl.linkProgram(sky); sloc.a = gl.getAttribLocation(sky, 'a'); sloc.top = gl.getUniformLocation(sky, 'uTop'); sloc.hor = gl.getUniformLocation(sky, 'uHor');
    sloc.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sloc.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    meshes = { box: build(box()), cyl: build(prism(10, .5, 0)), hex: build(prism(6, .5, 0)), cone: build(prism(7, 0, 0)),
      gem: build(gem(6)), gem8: build(gem(8)), disc: build(prism(24, .5, 0)), sphere: build(sphere(14, 9), { smooth:true }),
      ball: build(sphere(8, 5), { smooth:true }), post: build(prism(5, .42, 0)),
      ground: build(quad([-1, 0, -1], [-1, 0, 1], [1, 0, 1], [1, 0, -1]), { up:true }) };
    return true;
  }
  const hex2rgb = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  let VP, cam, pass = 'main';
  // sky: { top, horizon } hex colours; fog defaults to the horizon colour
  function frame(eye, target, skyCols, fogRange) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const top = hex2rgb(skyCols.top), hor = hex2rgb(skyCols.horizon);
    gl.clearColor(hor[0], hor[1], hor[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(sky); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.bindBuffer(gl.ARRAY_BUFFER, sloc.buf); gl.enableVertexAttribArray(sloc.a); gl.vertexAttribPointer(sloc.a, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(sloc.top, top); gl.uniform3fv(sloc.hor, hor); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(sloc.a);
    gl.useProgram(prog); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    [loc.p, loc.n, loc.c].forEach(a => gl.enableVertexAttribArray(a));
    VP = m4.mul(m4.persp(.9, w / h, .3, 400), m4.lookAt(eye, target, [0, 1, 0])); cam = eye;
    gl.uniformMatrix4fv(loc.uVP, false, VP); gl.uniform3fv(loc.uCam, eye); gl.uniform3fv(loc.uFog, hor);
    gl.uniform2fv(loc.uFogR, fogRange); const L = [.45, .8, .35], l = Math.hypot(...L); gl.uniform3fv(loc.uL, L.map(v => v / l));
    gl.uniform3fv(loc.uSky, mix3(top, [1, 1, 1], .35)); gl.uniform3fv(loc.uGround, mix3(hor, [0, 0, 0], .5));
    gl.uniform1f(loc.uOut, 0); gl.uniform1f(loc.uInk, 0);
  }
  function bind(me) {
    gl.bindBuffer(gl.ARRAY_BUFFER, me.vb); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, me.nb); gl.vertexAttribPointer(loc.n, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, me.cb); gl.vertexAttribPointer(loc.c, 3, gl.FLOAT, false, 0, 0);
  }
  // o = { mesh | geo, x, y, z, ry, rx, rz, sx, sy, sz, color:'#rrggbb', e: emissive, a: alpha, ink: outline width (0 = none) }
  function draw(o) {
    const me = o.geo || meshes[o.mesh];
    bind(me);
    gl.uniformMatrix4fv(loc.uM, false, o.M || m4.model(o.x || 0, o.y || 0, o.z || 0, o.ry || 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1, o.rx || 0, o.rz || 0));
    gl.uniform3fv(loc.uC, o.rgb || (o.rgb = hex2rgb(o.color || '#ffffff')));
    gl.uniform1f(loc.uE, o.e || 0); gl.uniform1f(loc.uA, o.a ?? 1);
    const transparent = (o.a ?? 1) < 1;
    if (transparent) { gl.depthMask(false); gl.disable(gl.CULL_FACE); }
    gl.drawArrays(gl.TRIANGLES, 0, me.n);
    if (transparent) { gl.depthMask(true); gl.enable(gl.CULL_FACE); }
    if (o.ink) {   // inverted hull: the same shape, slightly swollen, back faces only, drawn in ink
      gl.cullFace(gl.FRONT); gl.uniform1f(loc.uOut, o.ink); gl.uniform1f(loc.uInk, 1);
      gl.drawArrays(gl.TRIANGLES, 0, me.n);
      gl.cullFace(gl.BACK); gl.uniform1f(loc.uOut, 0); gl.uniform1f(loc.uInk, 0);
    }
  }
  function project(x, y, z) {
    const c = m4.xform(VP, [x, y, z]); if (c[3] <= .1) return null;
    return { x: (c[0] / c[3] * .5 + .5) * canvas.clientWidth, y: (-c[1] / c[3] * .5 + .5) * canvas.clientHeight, d: c[3] };
  }
  // Build a terrain chunk: grid of (n+1)² heights h(x,z) and colours col(x,z,y) → [r,g,b] 0..1. Faceted light, blended colour.
  function terrain(x0, z0, size, n, h, col) {
    const step = size / n, H = [], C = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + i * step, z = z0 + j * step, y = h(x, z); H.push([x, y, z]); C.push(col(x, z, y)); }
    const id = (i, j) => j * (n + 1) + i, tris = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
      tris.push([H[a], H[c], H[b], [C[a], C[c], C[b]]], [H[a], H[d], H[c], [C[a], C[d], C[c]]]);
    }
    const g = build(tris, { up:true }); delete g.P; delete g.N; return g;
  }
  // Bake many static, opaque objects into one vertex-coloured mesh so a whole area draws in a single call.
  // Emissive glow is folded into the colour (brighter), which is close enough for scenery.
  function bake(list) {
    let total = 0; list.forEach(o => total += meshes[o.mesh].n);
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
    let k = 0;
    list.forEach(o => {
      const me = meshes[o.mesh], M = m4.model(o.x || 0, o.y || 0, o.z || 0, o.ry || 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1, o.rx || 0, o.rz || 0);
      const sx = o.sx ?? 1, sy = o.sy ?? 1, sz = o.sz ?? 1, c = hex2rgb(o.color || '#ffffff'), g = 1 + (o.e || 0) * 1.3;
      for (let i = 0; i < me.n; i++, k++) {
        const q = [me.P[i * 3], me.P[i * 3 + 1], me.P[i * 3 + 2]], w = m4.xform(M, q);
        pos[k * 3] = w[0]; pos[k * 3 + 1] = w[1]; pos[k * 3 + 2] = w[2];
        const n = rot([me.N[i * 3] / sx, me.N[i * 3 + 1] / sy, me.N[i * 3 + 2] / sz], o.ry, o.rx, o.rz), l = Math.hypot(...n) || 1;
        nor[k * 3] = n[0] / l; nor[k * 3 + 1] = n[1] / l; nor[k * 3 + 2] = n[2] / l;
        col[k * 3] = Math.min(1.6, c[0] * g); col[k * 3 + 1] = Math.min(1.6, c[1] * g); col[k * 3 + 2] = Math.min(1.6, c[2] * g);
      }
    });
    const buf = arr => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return b; };
    return { vb:buf(pos), nb:buf(nor), cb:buf(col), n:total };
  }
  // Free GPU buffers of baked meshes when a realm is rebuilt.
  function free(me) { if (me && me.vb) { gl.deleteBuffer(me.vb); gl.deleteBuffer(me.nb); gl.deleteBuffer(me.cb); me.vb = null; } }
  return { name:'Classic WebGL', init, frame, draw, end() {}, project, hex2rgb, terrain, bake, free, rot, m4 };
})();
