// Diamondverse — characters: anime-style portraits (SVG) and 3D models for the hero, companions and townsfolk.
// A "look" is { sex, race, skin, hair, eyes, outfit, hairStyle, physique, height } — indexes into DV.LOOK.
const LOOK_DEFAULT = { sex:0, race:0, skin:1, hair:0, eyes:0, outfit:0, hairStyle:0, physique:1, height:1 };
function normLook(l) { const o = { ...LOOK_DEFAULT, ...(l || {}) }; for (const k in LOOK_DEFAULT) if (typeof o[k] !== 'number') o[k] = LOOK_DEFAULT[k]; return o; }
const raceId = l => DV.LOOK.race[l.race] ? DV.LOOK.race[l.race].id : 'human';
function shade(hex, f) {   // f < 1 darkens, > 1 lightens
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const t = v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))).toString(16).padStart(2, '0');
  return '#' + t(r) + t(g) + t(b);
}

// ---------- portrait (SVG, 120 × 140) ----------
// Hair is drawn in two layers: `back` behind the head and body, `front` over the forehead.
const HAIR_SVG = [
  { front:'M37 52 Q36 26 60 23 Q84 26 83 52 L79 42 L74 48 L70 38 L64 46 L60 36 L55 46 L49 38 L45 48 L40 42Z' },                                   // Short
  { back:'M34 50 Q28 98 40 112 L80 112 Q92 98 86 50Z', front:'M37 54 Q35 25 60 22 Q85 25 83 54 L80 44 Q70 40 62 46 L60 38 L57 46 Q48 40 40 44Z M37 50 Q33 80 40 100 L46 98 Q42 76 44 52Z M83 50 Q87 80 80 100 L74 98 Q78 76 76 52Z' }, // Long
  { front:'M36 54 L27 30 L42 34 L40 13 L54 28 L60 7 L67 27 L80 13 L79 34 L93 30 L84 54 L79 42 L72 47 L66 38 L60 45 L54 38 L48 47 L41 42Z' },        // Spiked
  { back:'M76 32 Q102 38 98 78 Q94 96 84 106 Q90 80 82 56Z', front:'M37 52 Q36 25 60 22 Q84 25 83 52 L79 43 Q62 38 50 46 L46 40 L40 46Z' },          // Ponytail
  { back:'M40 36 Q12 50 16 96 Q20 112 30 114 Q22 86 38 56Z M80 36 Q108 50 104 96 Q100 112 90 114 Q98 86 82 56Z', front:'M37 52 Q36 25 60 22 Q84 25 83 52 L80 42 L72 46 L66 39 L60 45 L54 39 L48 46 L40 42Z M36 34 l-6 -4 l2 8Z M84 34 l6 -4 l-2 8Z' }, // Twin tails
  { back:'M35 50 Q31 78 42 84 L78 84 Q89 78 85 50Z', front:'M36 58 Q33 24 60 22 Q87 24 84 58 L81 46 Q60 50 39 46Z' },                                // Bob
  { front:'M36 56 Q34 23 62 21 Q87 24 84 52 L80 42 Q69 45 55 62 Q51 52 47 54 Q42 52 36 56Z' },                                                     // Swept
  { front:'M53 40 L50 10 L58 16 L61 5 L65 16 L72 9 L69 40Z', stubble:true },                                                                       // Mohawk
  { back:'M35 50 Q32 64 40 68Z', front:'M37 52 Q36 25 60 22 Q84 25 83 52 L79 43 L70 40 L62 46 L58 38 L50 45 L40 43Z', braid:true },               // Braid
  { back:'M31 50 Q21 90 33 114 L47 101 L53 116 L61 101 L69 116 L75 101 L89 114 Q99 90 89 50Z', front:'M33 60 L29 36 L38 38 L35 16 L50 28 L56 9 L64 26 L77 11 L77 30 L91 31 L87 60 L79 44 L73 51 L66 40 L60 49 L54 40 L48 51 L41 43Z' }, // Wild mane
  { front:'M38 46 Q38 26 60 25 Q82 26 82 46 Q76 36 60 35 Q44 36 38 46Z' },                                                                         // Buzz
  { back:'M35 50 Q29 102 37 118 L83 118 Q91 102 85 50Z', front:'M37 54 Q36 24 60 22 Q84 24 83 54 L83 44 L37 44Z M37 44 L33 80 L42 80 L43 50Z M83 44 L87 80 L78 80 L77 50Z' } // Hime cut
];
function avatarSVG(lookRaw, cls, size) {
  const l = normLook(lookRaw), L = DV.LOOK, race = raceId(l), fem = l.sex === 1;
  const skin = L.skin[l.skin] || L.skin[1], hair = L.hair[l.hair] || L.hair[0], eye = L.eyes[l.eyes] || L.eyes[0], fit = L.outfit[l.outfit] || L.outfit[0];
  const cc = cls ? DV.CLASSES[cls].color : '#7ef2ff', H = HAIR_SVG[l.hairStyle] || HAIR_SVG[0], hd = shade(hair, .7), uid = 'a' + Math.abs(hashStr(JSON.stringify(l) + cls) % 1e6);
  const sw = (fem ? [25, 28, 31, 33] : [30, 34, 38, 39])[l.physique] * (race === 'dwarf' ? 1.1 : 1);
  const round = l.physique === 3 ? 14 : 0, neck = fem ? 6 : l.physique === 2 ? 10 : 8;
  const jaw = race === 'dwarf' ? 1.08 : 1, chin = fem ? 78 : 80;
  const face = `M${60 - 22 * jaw} 50 Q${60 - 22 * jaw} 28 60 28 Q${60 + 22 * jaw} 28 ${60 + 22 * jaw} 50 Q${60 + 22 * jaw} 66 ${fem ? 69 : 71} 73 Q64 ${chin - 1} 60 ${chin} Q56 ${chin - 1} ${fem ? 51 : 49} 73 Q${60 - 22 * jaw} 66 ${60 - 22 * jaw} 50Z`;
  const ew = fem ? 10 : 9, eh = fem ? 9 : 7;
  const eyeSvg = (cx, dir) => `
    <ellipse cx="${cx}" cy="56" rx="${ew / 2}" ry="${eh / 2}" fill="#fff"/>
    <ellipse cx="${cx}" cy="56.6" rx="${ew * .36}" ry="${eh * .5}" fill="url(#ir${uid})"/>
    <ellipse cx="${cx}" cy="57" rx="${ew * .15}" ry="${eh * .27}" fill="#1a1424"/>
    <circle cx="${cx - ew * .13}" cy="${56 - eh * .2}" r="1.4" fill="#fff"/><circle cx="${cx + ew * .14}" cy="${56 + eh * .22}" r=".6" fill="#fff"/>
    <path d="M${cx - ew / 2 - 1} ${56 - eh * .2} Q${cx} ${56 - eh * .85} ${cx + ew / 2 + 1} ${56 - eh * .3}${fem ? ` l${dir * 2} -2` : ''}" stroke="#1a1424" stroke-width="${fem ? 2.2 : 1.8}" fill="none" stroke-linecap="round"/>`;
  const ears = race === 'elf' ? `<path d="M40 52 L20 38 L39 63Z M80 52 L100 38 L81 63Z" fill="${skin}" stroke="${shade(skin, .8)}" stroke-width=".8"/>`
    : race === 'human' || race === 'dragonkin' ? `<ellipse cx="38.5" cy="57" rx="3" ry="5" fill="${shade(skin, .92)}"/><ellipse cx="81.5" cy="57" rx="3" ry="5" fill="${shade(skin, .92)}"/>` : '';
  const topper = race === 'beastkin' ? `<path d="M40 34 L33 8 L54 26Z M80 34 L87 8 L66 26Z" fill="${hair}" stroke="${hd}" stroke-width="1"/><path d="M41 30 L37 14 L50 26Z M79 30 L83 14 L70 26Z" fill="#ffb3c4"/>`
    : race === 'dragonkin' ? `<path d="M46 32 Q36 18 30 6 Q40 14 50 28Z M74 32 Q84 18 90 6 Q80 14 70 28Z" fill="#e8dcc0" stroke="#8a7a5a" stroke-width="1"/>
        <path d="M43 64 l3 -2 l3 2 l-3 2Z M71 64 l3 -2 l3 2 l-3 2Z" fill="${cc}" opacity=".7"/>` : '';
  const beard = race === 'dwarf' && !fem ? `<path d="M41 64 Q42 98 60 104 Q78 98 79 64 Q72 78 60 80 Q48 78 41 64Z" fill="${hair}" stroke="${hd}" stroke-width="1"/><path d="M52 71 Q60 66 68 71 Q60 69 52 71Z" fill="${hd}"/>` : '';
  const braid = H.braid ? Array.from({ length:7 }, (_, i) => `<ellipse cx="${38 - i * .6}" cy="${72 + i * 7}" rx="4.6" ry="4.2" fill="${hair}" stroke="${hd}" stroke-width=".8"/>`).join('') + `<rect x="33" y="118" width="8" height="3" rx="1" fill="${cc}"/>` : '';
  const shoulders = `M${60 - sw} 140 Q${60 - sw - round * .3} ${100 - round * .2} ${60 - sw * .55} 92 L60 88 L${60 + sw * .55} 92 Q${60 + sw + round * .3} ${100 - round * .2} ${60 + sw} 140Z`;
  return `<svg viewBox="0 0 120 140" width="${size}" height="${size * 140 / 120}" role="img" aria-label="Character portrait">
    <defs><radialGradient id="ir${uid}" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="${shade(eye, 1.35)}"/><stop offset=".6" stop-color="${eye}"/><stop offset="1" stop-color="${shade(eye, .45)}"/></radialGradient></defs>
    <polygon points="60,4 112,62 60,136 8,62" fill="none" stroke="${cc}" stroke-opacity=".35" stroke-width="1.5"/>
    ${H.back ? `<path d="${H.back}" fill="${hair}" stroke="${hd}" stroke-width="1"/>` : ''}
    <path d="${shoulders}" fill="${fit}"/>
    <path d="M${60 - sw * .5} 93 L60 ${fem ? 108 : 114} L${60 + sw * .5} 93" fill="none" stroke="${cc}" stroke-width="2"/>
    <polygon points="60,100 66,108 60,117 54,108" fill="${cc}"/>
    <rect x="${60 - neck / 2}" y="70" width="${neck}" height="20" rx="3" fill="${shade(skin, .9)}"/>
    ${ears}
    <path d="${face}" fill="${skin}"/>
    ${H.stubble ? `<path d="M38 46 Q38 26 60 25 Q82 26 82 46 Q76 36 60 35 Q44 36 38 46Z" fill="${hair}" opacity=".35"/>` : ''}
    ${eyeSvg(50.5, -1)}${eyeSvg(69.5, 1)}
    <path d="M44 ${fem ? 47 : 46} Q50 ${fem ? 44 : 43} 56 ${fem ? 46 : 46}" stroke="${hd}" stroke-width="${fem ? 1.4 : 2}" fill="none" stroke-linecap="round"/>
    <path d="M64 ${fem ? 46 : 46} Q70 ${fem ? 44 : 43} 76 ${fem ? 47 : 46}" stroke="${hd}" stroke-width="${fem ? 1.4 : 2}" fill="none" stroke-linecap="round"/>
    <path d="M60.5 62 L59.3 65.5" stroke="${shade(skin, .7)}" stroke-width="1" stroke-linecap="round"/>
    <path d="M56.5 ${fem ? 70 : 71} Q60 ${fem ? 72.5 : 72.5} 63.5 ${fem ? 70 : 71}" stroke="#7a3a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    ${fem ? '<ellipse cx="46" cy="65" rx="3.6" ry="1.6" fill="#ff7a9a" opacity=".35"/><ellipse cx="74" cy="65" rx="3.6" ry="1.6" fill="#ff7a9a" opacity=".35"/>' : ''}
    ${beard}
    <path d="${H.front}" fill="${hair}" stroke="${hd}" stroke-width="1" stroke-linejoin="round"/>
    ${braid}${topper}
  </svg>`;
}
// Companions get real portraits now.
function compBadge(id, size) { const C = DV.COMPANIONS[id]; return avatarSVG(C.look, C.cls, size); }

// ---------- townsfolk looks ----------
function villagerLook(seed) {
  const r = townRand(seed), p = n => Math.floor(r() * n);
  return { sex:p(2), race:p(10) < 6 ? 0 : p(5), skin:p(8), hair:p(12), eyes:p(8), outfit:p(8), hairStyle:p(12), physique:p(4), height:p(3) };
}

// ---------- 3D characters ----------
// Draws a character standing at (x, y, z) facing ry. opts: { cls, moving 0..1, t, ink, weapon:false }
function drawCharacter(x, y, z, ry, lookRaw, opts = {}) {
  const l = normLook(lookRaw), L = DV.LOOK, race = raceId(l), fem = l.sex === 1, t = opts.t || 0, mv = opts.moving || 0;
  const skin = L.skin[l.skin] || L.skin[1], hair = L.hair[l.hair] || L.hair[0], eye = L.eyes[l.eyes] || L.eyes[0], fit = opts.outfit || L.outfit[l.outfit] || L.outfit[0];
  const cc = opts.cls ? DV.CLASSES[opts.cls].color : (opts.accent || '#7ef2ff'), dark = shade(fit, .55), ink = opts.ink ?? .07;
  const Hs = [.88, 1, 1.1][l.height] * (race === 'dwarf' ? .8 : 1) * (opts.scale || 1);
  const Wd = [.85, 1, 1.18, 1.32][l.physique] * (race === 'dwarf' ? 1.2 : 1);
  const sh = fem ? .86 : 1, hip = fem ? 1.06 : .92;
  const swing = Math.sin(t * 9) * .55 * mv, bob = Math.abs(Math.sin(t * 9)) * .05 * mv + Math.sin(t * 2) * .01;
  const W = (dx, dy, dz) => { const v = Gfx.rot([dx * Hs, dy * Hs, dz * Hs], ry); return [x + v[0], y + v[1], z + v[2]]; };
  const part = (mesh, c, dx, dy, dz, sx, sy, sz, color, extra = {}) => {   // c: local centre of the part
    const p = W(c ? dx : dx, dy, dz);
    Gfx.draw({ mesh, x:p[0], y:p[1] - (c ? sy * Hs / 2 : 0), z:p[2], ry, sx:sx * Hs, sy:sy * Hs, sz:sz * Hs, color, ink, ...extra });
  };
  const limb = (top, len, rad, rx, rz, color) => {   // cylinder hanging from `top` (local), rotated rx (swing) and rz (spread)
    const tp = W(...top), d = Gfx.rot([0, len * Hs, 0], ry, rx, rz);
    Gfx.draw({ mesh:'cyl', x:tp[0] - d[0], y:tp[1] - d[1], z:tp[2] - d[2], ry, rx, rz, sx:rad * 2 * Hs, sy:len * Hs, sz:rad * 2 * Hs, color, ink });
    return [tp[0] - d[0], tp[1] - d[1], tp[2] - d[2]];
  };
  Gfx.draw({ mesh:'disc', x, y:y + .03, z, sx:1.1 * Wd * Hs, sy:.01, sz:1.1 * Wd * Hs, color:'#000000', a:.32 });
  // legs and boots
  [-1, 1].forEach(s => {
    const f = limb([s * .13 * Wd * hip, .8 + bob, 0], .78, .095 * Wd, s * swing, 0, dark);
    Gfx.draw({ mesh:'box', x:f[0], y:f[1], z:f[2], ry, sx:.2 * Wd * Hs, sy:.12 * Hs, sz:.3 * Hs, color:shade(dark, .7), ink });
  });
  // torso: waist + chest, belt with class colour
  part('box', true, 0, .95 + bob, 0, .44 * Wd * hip, .34, .3 * Wd, fit);
  part('box', true, 0, 1.24 + bob, 0, .56 * Wd * sh, .32, .32 * Wd, fit);
  part('box', true, 0, 1.08 + bob, 0, .46 * Wd * hip, .06, .31 * Wd, cc, { ink:0, e:.2 });
  part('gem', true, 0, 1.26 + bob, .17 * Wd, .1, .14, .06, cc, { ink:0, e:.6 });
  if (race === 'dragonkin' || race === 'beastkin') {   // tail
    const tp = W(0, .95 + bob, -.16 * Wd), sway = Math.sin(t * 3) * .4;
    Gfx.draw({ mesh:'cone', x:tp[0], y:tp[1] - .55 * Hs, z:tp[2], ry:ry + sway, rx:-1.1, sx:.16 * Hs, sy:.7 * Hs, sz:.16 * Hs, color: race === 'dragonkin' ? shade(skin, .8) : hair, ink });
  }
  // arms and hands
  [-1, 1].forEach(s => {
    const hnd = limb([s * (.31 * Wd * sh + .05), 1.36 + bob, 0], .58, .075 * Wd, -s * swing * .8, s * .12, fit);
    Gfx.draw({ mesh:'sphere', x:hnd[0], y:hnd[1] - .07 * Hs, z:hnd[2], sx:.14 * Hs, sy:.14 * Hs, sz:.14 * Hs, color:skin, ink });
    if (s === 1 && opts.weapon !== false && opts.cls) weapon(hnd, ry, opts.cls, cc, Hs, ink);
  });
  // neck and head
  part('cyl', true, 0, 1.45 + bob, 0, .14, .14, .14, shade(skin, .9));
  const hy = 1.78 + bob, R = .3;
  part('sphere', true, 0, hy, 0, R * 2, R * 2 * 1.04, R * 2 * .96, skin);
  // anime eyes: tall dark ovals with a highlight
  [-1, 1].forEach(s => {
    const ec = W(s * .105, hy - .03, R * .9);
    Gfx.draw({ mesh:'sphere', x:ec[0], y:ec[1] - .065 * Hs, z:ec[2], ry, sx:.085 * Hs, sy:(fem ? .14 : .12) * Hs, sz:.04 * Hs, color:eye, e:.25 });
    const hl = W(s * .105 - .02, hy + .01, R * .93);
    Gfx.draw({ mesh:'sphere', x:hl[0], y:hl[1] - .02 * Hs, z:hl[2], sx:.035 * Hs, sy:.035 * Hs, sz:.02 * Hs, color:'#ffffff', e:1 });
  });
  if (race === 'elf') [-1, 1].forEach(s => { const p = W(s * (R + .02), hy, 0); Gfx.draw({ mesh:'cone', x:p[0], y:p[1], z:p[2], ry, rz:-s * 1.2, sx:.09 * Hs, sy:.32 * Hs, sz:.05 * Hs, color:skin, ink }); });
  if (race === 'dwarf' && !fem) part('sphere', true, 0, hy - .3, .16, .4, .38, .26, hair);
  drawHair3D(W, ry, Hs, hy, R, l.hairStyle, hair, ink, t);
  if (race === 'beastkin') [-1, 1].forEach(s => { const p = W(s * .17, hy + .2, -.02); Gfx.draw({ mesh:'cone', x:p[0], y:p[1], z:p[2], ry, rz:-s * .25, sx:.16 * Hs, sy:.26 * Hs, sz:.08 * Hs, color:hair, ink }); });
  if (race === 'dragonkin') [-1, 1].forEach(s => { const p = W(s * .14, hy + .16, .05); Gfx.draw({ mesh:'cone', x:p[0], y:p[1], z:p[2], ry, rx:-.6, rz:-s * .35, sx:.09 * Hs, sy:.34 * Hs, sz:.09 * Hs, color:'#e8dcc0', ink }); });
}
function weapon(hand, ry, cls, cc, Hs, ink) {
  const [x, y, z] = hand, P = (dx, dy, dz) => { const v = Gfx.rot([dx * Hs, dy * Hs, dz * Hs], ry); return [x + v[0], y + v[1], z + v[2]]; };
  if (cls === 'mage' || cls === 'priest') {
    const b = P(0, -.35, .05); Gfx.draw({ mesh:'cyl', x:b[0], y:b[1], z:b[2], ry, sx:.05 * Hs, sy:1.5 * Hs, sz:.05 * Hs, color:'#6b4a2a', ink });
    const g = P(0, 1.12, .05); Gfx.draw({ mesh: cls === 'mage' ? 'gem' : 'sphere', x:g[0], y:g[1], z:g[2], ry, sx:.18 * Hs, sy:.26 * Hs, sz:.18 * Hs, color:cc, e:.8, ink });
  } else if (cls === 'assassin') {
    const b = P(0, -.05, .1); Gfx.draw({ mesh:'box', x:b[0], y:b[1], z:b[2], ry, rx:1.4, sx:.05 * Hs, sy:.45 * Hs, sz:.02 * Hs, color:'#d8dde8', e:.15, ink });
  } else if (cls === 'guardian') {
    const b = P(0, -.05, .14); Gfx.draw({ mesh:'box', x:b[0], y:b[1], z:b[2], ry, rx:1.3, sx:.07 * Hs, sy:.7 * Hs, sz:.03 * Hs, color:'#d8dde8', ink });
  } else {
    const b = P(0, -.1, .12); Gfx.draw({ mesh:'box', x:b[0], y:b[1], z:b[2], ry, rx:1.2, sx:.12 * Hs, sy:1.1 * Hs, sz:.04 * Hs, color:'#d8dde8', e:.1, ink });
  }
}
// Hair styles in 3D (same order as DV.LOOK.hairStyle).
function drawHair3D(W, ry, Hs, hy, R, style, col, ink, t) {
  const dk = shade(col, .75);
  const blob = (dx, dy, dz, sx, sy, sz, c = col, extra = {}) => { const p = W(dx, dy, dz); Gfx.draw({ mesh:'sphere', x:p[0], y:p[1] - sy * Hs / 2, z:p[2], ry, sx:sx * Hs, sy:sy * Hs, sz:sz * Hs, color:c, ink, ...extra }); };
  const spike = (dx, dy, dz, rx, rz, len, w = .14, c = col) => { const p = W(dx, dy, dz); Gfx.draw({ mesh:'cone', x:p[0], y:p[1], z:p[2], ry, rx, rz, sx:w * Hs, sy:len * Hs, sz:w * Hs, color:c, ink }); };
  const cap = (s = 1.12, back = .1, lift = .07) => blob(0, hy + lift, -back, R * 2 * s, R * 2 * .98 * s, R * 2 * s);
  const bangs = (n = 5, len = .2) => { for (let i = 0; i < n; i++) { const a = (i / (n - 1) - .5) * 1.5; spike(Math.sin(a) * R * .8, hy + .2, Math.cos(a) * R * .72, Math.PI - .5, -a * .5, len, .12); } };
  const sway = Math.sin(t * 2.2) * .12;
  switch (style) {
    case 0: cap(); bangs(); break;
    case 1: cap(); bangs(); blob(0, hy - .25, -.2, .62, .9, .3); break;
    case 2: cap(1.06); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; spike(Math.cos(a) * .16, hy + .2, Math.sin(a) * .16 - .04, Math.sin(a) * -.9, Math.cos(a) * -.9, .36, .16); } spike(0, hy + .26, 0, 0, 0, .34, .18); bangs(4, .16); break;
    case 3: cap(); bangs(); { const p = W(0, hy + .14, -.3); Gfx.draw({ mesh:'cone', x:p[0], y:p[1] - .62 * Hs, z:p[2], ry, rx:Math.PI + .35 + sway, sx:.2 * Hs, sy:.66 * Hs, sz:.2 * Hs, color:col, ink }); } break;
    case 4: cap(); bangs(); [-1, 1].forEach(s => { const p = W(s * .3, hy + .12, -.05); Gfx.draw({ mesh:'cone', x:p[0], y:p[1] - .7 * Hs, z:p[2], ry, rx:Math.PI + sway * s, rz:s * .2, sx:.18 * Hs, sy:.72 * Hs, sz:.18 * Hs, color:col, ink }); }); break;
    case 5: cap(1.18, .06, .02); bangs(6, .17); break;
    case 6: cap(); for (let i = 0; i < 5; i++) spike(-.22 + i * .1, hy + .2, R * .7, Math.PI - .6, .9, .26, .13); blob(.16, hy - .02, .22, .14, .3, .1); break;
    case 7: blob(0, hy + .05, -.06, R * 2.03, R * 2 * .9, R * 2.03, col, { a:.35, ink:0 }); for (let i = 0; i < 6; i++) spike(0, hy + .24 - i * .04, .18 - i * .1, -.2 - i * .25, 0, .3, .1); break;
    case 8: cap(); bangs(); for (let i = 0; i < 6; i++) blob(-.24 - i * .015, hy - .2 - i * .14, .1 + i * .02, .13, .13, .13, i % 2 ? dk : col); break;
    case 9: cap(1.22, .12, .1); for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * 2.6; spike(Math.sin(a) * .26, hy + .1, -Math.cos(a) * .2, Math.PI - .7 - Math.abs(a) * .1, a * .4, .55, .2); } bangs(5, .22); break;
    case 10: blob(0, hy + .06, -.08, R * 2.04, R * 2 * .9, R * 2.04); break;
    case 11: cap(); { const p = W(0, hy + .14, R * .82); Gfx.draw({ mesh:'box', x:p[0], y:p[1] - .16 * Hs, z:p[2], ry, sx:.52 * Hs, sy:.16 * Hs, sz:.06 * Hs, color:col, ink }); }
      [-1, 1].forEach(s => { const p = W(s * .27, hy, .14); Gfx.draw({ mesh:'box', x:p[0], y:p[1] - .5 * Hs, z:p[2], ry, sx:.08 * Hs, sy:.5 * Hs, sz:.08 * Hs, color:col, ink }); });
      blob(0, hy - .3, -.2, .62, 1, .3); break;
    default: cap(); bangs();
  }
}
