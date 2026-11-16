// Diamondverse — tiny WebGL renderer for the open world. Flat-shaded low-poly meshes, one light, distance fog.
// No dependencies. Every primitive sits on y=0, is 1 unit tall and 1 unit wide, so scale = size.
const Gfx = (() => {
  let gl, prog, loc = {}, meshes = {}, canvas;

  // ---- tiny mat4 (column-major) ----
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
    // translate * rotY * rotX * scale
    model(x, y, z, ry, sx, sy, sz, rx) {
      const cy = Math.cos(ry || 0), syn = Math.sin(ry || 0), cx = Math.cos(rx || 0), sxn = Math.sin(rx || 0);
      return [cy * sx, 0, -syn * sx, 0,
        syn * sxn * sy, cx * sy, cy * sxn * sy, 0,
        syn * cx * sz, -sxn * sz, cy * cx * sz, 0,
        x, y, z, 1];
    },
    xform(m, p) {
      const x = p[0], y = p[1], z = p[2];
      return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], m[3] * x + m[7] * y + m[11] * z + m[15]];
    }
  };

  // ---- geometry (flat normals: every triangle gets its own face normal) ----
  function build(tris) {
    const pos = [], nor = [];
    tris.forEach(([a, b, c]) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      [a, b, c].forEach(p => { pos.push(...p); nor.push(nx, ny, nz); });
    });
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    const nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nor), gl.STATIC_DRAW);
    return { vb, nb, n: pos.length / 3 };
  }
  const quad = (a, b, c, d) => [[a, b, c], [a, c, d]];
  function ring(n, r, y, rot = 0) { return Array.from({ length:n }, (_, i) => { const t = rot + i / n * Math.PI * 2; return [Math.cos(t) * r, y, Math.sin(t) * r]; }); }
  function prism(n, rTop, rot) {          // cylinder (rTop=.5) or cone (rTop=0) with n sides
    const lo = ring(n, .5, 0, rot), hi = ring(n, rTop, 1, rot), t = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (rTop > 0) t.push(...quad(lo[i], hi[i], hi[j], lo[j])); else t.push([lo[i], [0, 1, 0], lo[j]]);
      t.push([[0, 0, 0], lo[i], lo[j]]);
      if (rTop > 0) t.push([[0, 1, 0], hi[j], hi[i]]);
    }
    return t;
  }
  function gem(n) {                       // diamond: apex top, girdle at .38, point bottom
    const g = ring(n, .5, .38), t = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; t.push([[0, 1, 0], g[j], g[i]], [[0, 0, 0], g[i], g[j]]); }
    return t;
  }
  function box() {
    const p = (x, y, z) => [x - .5, y, z - .5];
    const v = [p(0,0,0), p(1,0,0), p(1,0,1), p(0,0,1), p(0,1,0), p(1,1,0), p(1,1,1), p(0,1,1)];
    return [...quad(v[0], v[1], v[2], v[3]), ...quad(v[4], v[7], v[6], v[5]), ...quad(v[0], v[4], v[5], v[1]),
      ...quad(v[1], v[5], v[6], v[2]), ...quad(v[2], v[6], v[7], v[3]), ...quad(v[3], v[7], v[4], v[0])];
  }

  function init(cv) {
    canvas = cv;
    gl = cv.getContext('webgl', { antialias:true, alpha:false }) || cv.getContext('experimental-webgl');
    if (!gl) return false;
    const vs = `attribute vec3 p;attribute vec3 n;uniform mat4 uVP;uniform mat4 uM;varying vec3 vN;varying vec3 vW;
      void main(){vec4 w=uM*vec4(p,1.0);vW=w.xyz;vN=mat3(uM)*n;gl_Position=uVP*w;}`;
    const fs = `precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform vec3 uL;uniform vec3 uCam;
      uniform vec3 uFog;uniform vec2 uFogR;uniform float uE;uniform float uA;
      void main(){float d=max(dot(normalize(vN),uL),0.0);vec3 c=uC*(0.42+0.68*d)+uC*uE;
      float f=smoothstep(uFogR.x,uFogR.y,distance(vW,uCam));gl_FragColor=vec4(mix(c,uFog,f),uA);}`;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    ['uVP','uM','uC','uL','uCam','uFog','uFogR','uE','uA'].forEach(k => loc[k] = gl.getUniformLocation(prog, k));
    loc.p = gl.getAttribLocation(prog, 'p'); loc.n = gl.getAttribLocation(prog, 'n');
    gl.enableVertexAttribArray(loc.p); gl.enableVertexAttribArray(loc.n);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    meshes = { box: build(box()), cyl: build(prism(10, .5, 0)), hex: build(prism(6, .5, 0)), cone: build(prism(7, 0, 0)),
      gem: build(gem(6)), gem8: build(gem(8)), disc: build(prism(20, .5, 0)),
      ground: build(quad([-1, 0, -1], [-1, 0, 1], [1, 0, 1], [1, 0, -1])) };
    // Faces must wind counter-clockwise when seen from outside. Build helpers above use outward winding; disable culling if unsure.
    gl.disable(gl.CULL_FACE);
    return true;
  }
  const hex2rgb = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

  let VP, cam;
  function frame(eye, target, fog, fogRange) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const f = hex2rgb(fog); gl.clearColor(f[0], f[1], f[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    VP = m4.mul(m4.persp(.9, w / h, .3, 220), m4.lookAt(eye, target, [0, 1, 0])); cam = eye;
    gl.uniformMatrix4fv(loc.uVP, false, VP); gl.uniform3fv(loc.uCam, eye); gl.uniform3fv(loc.uFog, f);
    gl.uniform2fv(loc.uFogR, fogRange); const L = [.45, .8, .35], l = Math.hypot(...L); gl.uniform3fv(loc.uL, L.map(v => v / l));
  }
  // o = { mesh, x, y, z, ry, rx, sx, sy, sz, color:'#rrggbb', e: emissive 0..1, a: alpha }
  function draw(o) {
    const me = meshes[o.mesh];
    gl.bindBuffer(gl.ARRAY_BUFFER, me.vb); gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, me.nb); gl.vertexAttribPointer(loc.n, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(loc.uM, false, m4.model(o.x || 0, o.y || 0, o.z || 0, o.ry || 0, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1, o.rx || 0));
    gl.uniform3fv(loc.uC, o.rgb || (o.rgb = hex2rgb(o.color)));
    gl.uniform1f(loc.uE, o.e || 0); gl.uniform1f(loc.uA, o.a ?? 1);
    if ((o.a ?? 1) < 1) gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, me.n);
    if ((o.a ?? 1) < 1) gl.depthMask(true);
  }
  // world point -> CSS pixel position on the canvas (null if behind camera)
  function project(x, y, z) {
    const c = m4.xform(VP, [x, y, z]); if (c[3] <= .1) return null;
    return { x: (c[0] / c[3] * .5 + .5) * canvas.clientWidth, y: (-c[1] / c[3] * .5 + .5) * canvas.clientHeight, d: c[3] };
  }
  return { init, frame, draw, project, hex2rgb };
})();
