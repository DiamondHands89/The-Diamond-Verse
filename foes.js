// Diamondverse — corrupted creatures. A foe's body type comes from keywords in its name, so all 200 foes across
// the 50 realms get a fitting silhouette in the open world (3D) and on the battle screen (SVG).
const FOE_TYPES = [
  ['serpent', /eel|wyrm|serpent|wyvern|dragon|drake|kraken|leviathan|shark|worm|salamander|maw|gulper/i],
  ['flyer', /sprite|wisp|moth|bat|harpy|roc|vulture|swarm|imp|mite|elemental|lure|beetle|scarab|siren|djinn|lantern|drone|leech/i],
  ['wraith', /wraith|shade|ghost|phantom|specter|spirit|revenant|shadow|self|choir|chorister|saint|pilgrim|husk|ghoul|unmade|devoured|hollow|echo|ash|silence|hush|insomnia|nightmare|dread/i],
  ['beast', /wolf|hound|stallion|stalker|ram|fox|scorpion|yeti|hunter|alpha|stag|mantis|crawler|cat|thornwolf|rider/i],
  ['brute', /brute|golem|troll|hulk|colossus|giant|titan|guard|knight|templar|sentinel|veteran|berserker|myrmidon|soldier|automaton|duelist|noble|thrall|totem|reaver|engineer|collector|devil|reaver/i],
  ['horror', /horror|bloom|strangler|lurker|hag|spawn|mind|mother|matron|incarnate|plot|redacted|paradox|hunger|null|logic|proof|recursion|cocoon|lie|thief|faceless/i]
];
function foeType(name) { for (const [t, re] of FOE_TYPES) if (re.test(name)) return t; return 'golem'; }

// ---------- open world (3D) ----------
function drawFoe(e, t, hue, y) {
  const type = e.type || (e.type = foeType(e.foe)), body = '#2a1530', mid = shade(hue, .45), glow = '#ff4d7a', ink = .07, ry = e.ry, ph = t + e.hx;
  const W = (dx, dy, dz) => { const v = Gfx.rot([dx, dy, dz], ry); return [e.x + v[0], y + v[1], e.z + v[2]]; };
  const P = (mesh, dx, dy, dz, sx, sy, sz, color, extra = {}) => { const p = W(dx, dy, dz); Gfx.draw({ mesh, x:p[0], y:p[1], z:p[2], ry, sx, sy, sz, color, ink, ...extra }); };
  const eyes = (dy, dz, gap = .14, s = .1) => [-1, 1].forEach(k => P('sphere', k * gap, dy, dz, s, s, s, glow, { e:1, ink:0 }));
  Gfx.draw({ mesh:'disc', x:e.x, y:y + .03, z:e.z, sx:1.5, sy:.01, sz:1.5, color:'#000000', a:.32 });
  const walk = Math.sin(ph * 8) * .5;
  if (type === 'beast') {
    [[-.25, .45], [.25, .45], [-.25, -.45], [.25, -.45]].forEach(([dx, dz], i) => {
      const sw = (i % 3 === 0 ? 1 : -1) * walk, top = W(dx, .62, dz), d = Gfx.rot([0, .62, 0], ry, sw);
      Gfx.draw({ mesh:'cyl', x:top[0] - d[0], y:top[1] - d[1], z:top[2] - d[2], ry, rx:sw, sx:.16, sy:.62, sz:.16, color:body, ink });
    });
    P('box', 0, .55, 0, .62, .48, 1.2, body);
    P('box', 0, .78, .7, .42, .4, .44, mid);
    P('box', 0, .72, .98, .24, .2, .26, body);
    [-1, 1].forEach(k => P('cone', k * .13, 1.12, .66, .12, .22, .1, body));
    P('cone', 0, .7, -.62, .14, .55, .14, body, { rx:-2.1 });
    for (let i = 0; i < 3; i++) P('gem', 0, 1.0, .3 - i * .32, .16, .3, .16, hue, { e:.6, ink:0 });
    eyes(.9, .92, .1, .08);
  } else if (type === 'brute') {
    [-1, 1].forEach(k => { const sw = k * walk * .6, top = W(k * .3, .9, 0), d = Gfx.rot([0, .9, 0], ry, sw); Gfx.draw({ mesh:'cyl', x:top[0] - d[0], y:top[1] - d[1], z:top[2] - d[2], ry, rx:sw, sx:.32, sy:.9, sz:.32, color:body, ink }); });
    P('box', 0, .88, 0, 1.15, .95, .7, mid);
    P('sphere', 0, 1.78, .12, .5, .5, .5, body);
    [-1, 1].forEach(k => { const sw = -k * walk * .5, top = W(k * .72, 1.72, 0), d = Gfx.rot([0, 1, 0], ry, sw, k * .15);
      Gfx.draw({ mesh:'cyl', x:top[0] - d[0], y:top[1] - d[1], z:top[2] - d[2], ry, rx:sw, rz:k * .15, sx:.3, sy:1, sz:.3, color:body, ink });
      Gfx.draw({ mesh:'sphere', x:top[0] - d[0], y:top[1] - d[1] - .25, z:top[2] - d[2], sx:.42, sy:.42, sz:.42, color:mid, ink }); });
    [-1, 1].forEach(k => P('gem8', k * .62, 1.78, 0, .32, .55, .32, hue, { e:.55, ink:0 }));
    eyes(2.0, .34, .1, .08);
  } else if (type === 'wraith') {
    const f = .35 + Math.sin(ph * 2) * .15;
    P('cone', 0, f, 0, 1.1, 2.0, 1.1, body);
    P('sphere', 0, f + 1.45, .05, .55, .6, .55, mid);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + ph; P('cone', Math.cos(a) * .35, f + .05, Math.sin(a) * .35, .22, .55, .22, body, { rx:Math.PI }); }
    [-1, 1].forEach(k => P('cone', k * .5, f + 1.1, .2, .16, .7, .16, body, { rx:-1.1 + Math.sin(ph * 3 + k) * .2, rz:-k * .5 }));
    eyes(f + 1.72, .27, .1, .09);
    P('sphere', 0, f + .9, .3, .22, .22, .22, hue, { e:.9, ink:0 });
  } else if (type === 'serpent') {
    for (let i = 5; i >= 0; i--) { const s = .7 - i * .07; P('sphere', Math.sin(ph * 3 - i * .8) * .35, .25 + Math.sin(ph * 2 - i) * .08, .9 - i * .45, s, s * .85, s, i % 2 ? body : mid); }
    P('sphere', Math.sin(ph * 3) * .35, .55, 1.25, .62, .5, .7, body);
    P('cone', Math.sin(ph * 3) * .35, .9, .9, .1, .45, .25, hue, { e:.5, ink:0 });
    eyes(.85, 1.55, .14, .1);
  } else if (type === 'flyer') {
    const h = 1.4 + Math.sin(ph * 3) * .2, flap = Math.sin(ph * 14) * .7;
    P('sphere', 0, h, 0, .55, .55, .7, body);
    [-1, 1].forEach(k => { const p = W(k * .22, h + .3, 0); Gfx.draw({ mesh:'box', x:p[0], y:p[1], z:p[2], ry, rz:k * (1.2 + flap), sx:.08, sy:.9, sz:.55, color:mid, ink }); });
    P('gem', 0, h - .25, 0, .25, .35, .25, hue, { e:.8, ink:0, rx:Math.PI });
    eyes(h + .35, .3, .1, .09);
  } else if (type === 'horror') {
    const p = Math.sin(ph * 2) * .06;
    P('sphere', 0, .1, 0, 1.3 + p, 1.1 - p, 1.3 + p, body);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; P('cone', Math.cos(a) * .4, .7, Math.sin(a) * .4, .18, .6, .18, i % 2 ? hue : mid, { rx:Math.sin(a) * .9, rz:-Math.cos(a) * .9, e: i % 2 ? .5 : 0 }); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; const q = W(Math.cos(a) * .6, .35, Math.sin(a) * .6);
      Gfx.draw({ mesh:'cyl', x:q[0], y:q[1] - .1, z:q[2], ry, rx:Math.sin(ph * 3 + i) * .8, rz:Math.cos(a) * 1.2, sx:.12, sy:.8, sz:.12, color:body, ink }); }
    P('sphere', 0, .75, .5, .32, .32, .2, glow, { e:1, ink:0 });
  } else {
    const bob = Math.sin(ph * 3) * .12;
    P('gem8', 0, .25 + bob, 0, 1.2, 1.7, 1.2, body, { ry:ph * .8 });
    P('gem', 0, .75 + bob, 0, .6, .8, .6, glow, { e:.9, ink:0 });
    eyes(1.25 + bob, .5, .2, .1);
  }
}

// ---------- battle screen (SVG) ----------
function enemySVG(name, hue, boss, size) {
  const type = foeType(name), id = 'f' + (hashStr(name) % 1e6), dark = '#1a0f22', g = `url(#${id})`;
  const shapes = {
    beast:`<path d="M14 66 Q16 48 34 44 L64 42 Q74 30 86 36 L92 46 Q96 52 88 56 L82 58 L80 76 L72 76 L70 62 L40 62 L36 78 L28 78 L28 62 Q18 64 8 54 Q12 62 14 66Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M78 36 L80 24 L86 34Z" fill="${hue}"/><path d="M40 44 L44 32 L48 44 M52 43 L56 30 L60 43" stroke="${hue}" stroke-width="3" fill="none"/>
      <circle cx="84" cy="44" r="2.6" fill="#ff4d7a"/>`,
    brute:`<path d="M30 92 L34 66 L22 60 Q18 40 30 34 L40 32 Q42 18 50 16 Q58 18 60 32 L70 34 Q82 40 78 60 L66 66 L70 92 L56 92 L52 70 L48 70 L44 92Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M26 36 L22 22 L34 32Z M74 36 L78 22 L66 32Z" fill="${hue}"/><circle cx="46" cy="25" r="2.2" fill="#ff4d7a"/><circle cx="54" cy="25" r="2.2" fill="#ff4d7a"/>`,
    wraith:`<path d="M50 10 Q70 12 72 36 Q74 60 84 90 L74 82 L68 92 L60 82 L50 94 L40 82 L32 92 L26 82 L16 90 Q26 60 28 36 Q30 12 50 10Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M36 32 Q50 20 64 32 Q60 46 50 48 Q40 46 36 32Z" fill="${dark}"/><circle cx="44" cy="35" r="2.6" fill="#ff4d7a"/><circle cx="56" cy="35" r="2.6" fill="#ff4d7a"/>`,
    serpent:`<path d="M20 86 Q6 70 22 60 Q40 50 30 38 Q22 26 40 18 Q58 12 68 22 Q76 30 70 36 Q64 40 58 34 Q54 28 46 30 Q38 34 46 44 Q58 58 42 70 Q30 78 40 86Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M44 18 L46 8 L52 16 M56 15 L60 6 L62 16" stroke="${hue}" stroke-width="3" fill="none"/><circle cx="64" cy="26" r="2.4" fill="#ff4d7a"/>`,
    flyer:`<path d="M50 34 Q60 34 62 48 Q62 62 50 66 Q38 62 38 48 Q40 34 50 34Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M40 44 Q20 22 6 30 Q18 38 14 50 Q28 44 40 52Z M60 44 Q80 22 94 30 Q82 38 86 50 Q72 44 60 52Z" fill="${dark}" stroke="${hue}" stroke-width="1.5" opacity=".9"/>
      <circle cx="45" cy="44" r="2.4" fill="#ff4d7a"/><circle cx="55" cy="44" r="2.4" fill="#ff4d7a"/><path d="M50 66 L46 74 L54 74Z" fill="${hue}"/>`,
    horror:`<path d="M50 20 Q78 22 80 50 Q80 72 50 74 Q20 72 20 50 Q22 22 50 20Z" fill="${g}" stroke="${hue}" stroke-width="2"/>
      <path d="M28 66 Q20 82 12 88 M40 72 Q38 86 30 96 M60 72 Q62 86 70 96 M72 66 Q80 82 88 88" stroke="${dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M50 20 L48 8 L54 18 M30 28 L20 18 L32 24 M70 28 L80 18 L68 24" stroke="${hue}" stroke-width="3" fill="none"/>
      <ellipse cx="50" cy="46" rx="10" ry="7" fill="#ff4d7a"/><ellipse cx="50" cy="46" rx="3" ry="6" fill="${dark}"/>`
  };
  let body = shapes[type];
  if (!body) {   // crystal golem (original look)
    const h = hashStr(name), sides = 5 + h % 4, pts = [];
    for (let i = 0; i < sides; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / sides, rr = (boss ? 40 : 34) * (i % 2 ? .82 + (h >> i & 3) * .05 : 1); pts.push(`${(50 + Math.cos(a) * rr).toFixed(1)},${(54 + Math.sin(a) * rr).toFixed(1)}`); }
    body = `<polygon points="${pts.join(' ')}" fill="${g}" stroke="${hue}" stroke-width="2.5"/><path d="M50 22 L44 44 L56 52 L46 78" stroke="#ff4d7a" stroke-width="2" fill="none" opacity=".8"/>
      <ellipse cx="40" cy="52" rx="4" ry="5.5" fill="#ff4d7a"/><ellipse cx="60" cy="52" rx="4" ry="5.5" fill="#ff4d7a"/>`;
  }
  const crown = boss ? `<path d="M30 14 L36 0 L44 10 L50 -4 L56 10 L64 0 L70 14Z" fill="${hue}" stroke="${dark}" stroke-width="1"/>` : '';
  return `<svg viewBox="0 -6 100 106" width="${size}" height="${size}" aria-hidden="true" style="overflow:visible">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hue, .38)}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g filter="url(#${id}g)">${body}</g>${crown}</svg>`;
}
