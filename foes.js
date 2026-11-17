// Diamondverse — corrupted creatures. A foe's body type comes from keywords in its name, so all 200 foes across
// the 50 realms get a fitting silhouette in the open world (3D) and on the battle screen (SVG).
// Tiers (DV.FOE_TIERS) change size, colours and trappings: Veterans wear bronze plate and horns, Champions grow
// crystal armour with orbiting shards, and Dread foes are twice the size, crowned in gold with a haloed aura.
const FOE_TYPES = [
  ['crawler', /spider|crawler|scorpion|tick|mite|beetle|scarab|mantis|crab|weaver|skitter|web/i],
  ['knight', /knight|templar|sentinel|duelist|myrmidon|soldier|veteran|guard|reaver|noble|berserker|warden|paladin|lancer|blade/i],
  ['elemental', /elemental|core|spark|ember|cinder|storm|frost|shard|prism|glass|mirror|cog|clock|gear|flame|magma|tempest|static|ice/i],
  ['serpent', /eel|wyrm|serpent|wyvern|dragon|drake|kraken|leviathan|shark|worm|salamander|maw|gulper/i],
  ['flyer', /sprite|wisp|moth|bat|harpy|roc|vulture|swarm|imp|lure|siren|djinn|lantern|drone|leech|raven|crow|seraph|angel/i],
  ['wraith', /wraith|shade|ghost|phantom|specter|spirit|revenant|shadow|self|choir|chorister|saint|pilgrim|husk|ghoul|unmade|devoured|hollow|echo|ash|silence|hush|insomnia|nightmare|dread/i],
  ['beast', /wolf|hound|stallion|stalker|ram|fox|yeti|hunter|alpha|stag|cat|thornwolf|rider|boar|bear|lion|hoof/i],
  ['brute', /brute|golem|troll|hulk|colossus|giant|titan|automaton|thrall|totem|engineer|collector|devil|ogre|treant|oni/i],
  ['horror', /horror|bloom|strangler|lurker|hag|spawn|mind|mother|matron|incarnate|plot|redacted|paradox|hunger|null|logic|proof|recursion|cocoon|lie|thief|faceless|eater|swallower|angler|changeling/i]
];
function foeType(name) { for (const [t, re] of FOE_TYPES) if (re.test(name)) return t; return 'golem'; }
const TIER_SCALE = [1, 1.25, 1.55, 2.1];
const foeScale = e => TIER_SCALE[(e.tier || 1) - 1];
function foePalette(tier, hue) {
  return [
    { body:'#2a1530', mid:shade(hue, .45), glow:'#ff4d7a', trim:shade(hue, .7) },
    { body:'#3a2618', mid:shade(hue, .5), glow:'#ffb347', trim:'#c8913a' },
    { body:'#18223c', mid:shade('#5a7ab8', .9), glow:'#7ef2ff', trim:'#cfefff' },
    { body:'#120a14', mid:'#3a1f3a', glow:'#ffd166', trim:'#ffd166' }
  ][tier - 1];
}
// Height of the head (local units) for each body type: where horns, crowns and halos go.
const HEAD_AT = { beast:[1.05, .85], brute:[2.05, .12], wraith:[2.15, .05], serpent:[.95, 1.25], flyer:[1.85, 0], horror:[1.2, 0], golem:[1.9, 0], crawler:[.8, .5], knight:[2.15, 0], elemental:[2.1, 0], hydra:[2.6, .8] };

// ---------- open world (3D) ----------
function drawFoe(e, t, hue, y) {
  const tier = e.tier || 1, k = TIER_SCALE[tier - 1], C = foePalette(tier, hue), ink = .06, ry = e.ry || 0, ph = t + e.hx;
  let type = e.type || (e.type = foeType(e.foe)); if (tier === 4 && type === 'serpent') type = 'hydra';
  const W = (dx, dy, dz) => { const v = Gfx.rot([dx * k, dy * k, dz * k], ry); return [e.x + v[0], y + v[1], e.z + v[2]]; };
  const P = (mesh, dx, dy, dz, sx, sy, sz, color, ex = {}) => { const p = W(dx, dy, dz); Gfx.draw({ mesh, x:p[0], y:p[1], z:p[2], ry, sx:sx * k, sy:sy * k, sz:sz * k, color, ink, ...ex }); };
  // a limb (cylinder) from local point a to local point b
  const bone = (a, b, w, color, mesh = 'cyl', ex = {}) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz) || .001;
    const rz = Math.asin(clamp(-dx / len, -1, 1)), rx = Math.atan2(dz, dy);
    P(mesh, a[0], a[1], a[2], w, len, w, color, { rx, rz, ...ex });
  };
  const eyes = (dy, dz, gap = .14, s = .1, dx = 0) => [-1, 1].forEach(q => P('sphere', dx + q * gap, dy, dz, s, s, s, C.glow, { e:1, ink:0 }));
  Gfx.draw({ mesh:'disc', x:e.x, y:y + .03, z:e.z, sx:1.5 * k, sy:.01, sz:1.5 * k, color:'#000000', a:.32 });
  const walk = Math.sin(ph * 8) * .5, { body, mid, glow, trim } = C;

  if (type === 'beast') {
    [[-.25, .45], [.25, .45], [-.25, -.45], [.25, -.45]].forEach(([dx, dz], i) => { const sw = (i % 3 === 0 ? 1 : -1) * walk; bone([dx + 0, .02, dz + Math.sin(sw) * .4], [dx, .62, dz], .16, body); });
    P('box', 0, .55, 0, .62, .48, 1.2, body);
    P('box', 0, .78, .7, .42, .4, .44, mid);
    P('box', 0, .72, .98, .24, .2, .26, body);
    [-1, 1].forEach(q => P('cone', q * .13, 1.12, .66, .12, .22, .1, body));
    bone([0, .75, -.55], [0, 1.1 + Math.sin(ph * 4) * .1, -1.05], .1, body, 'cone');
    for (let i = 0; i < 3; i++) P('gem', 0, 1.0, .3 - i * .32, .16, .3, .16, hue, { e:.6, ink:0 });
    eyes(.9, .92, .1, .08);
  } else if (type === 'brute') {
    [-1, 1].forEach(q => bone([q * .3, 0, Math.sin(walk * q) * .35], [q * .3, .9, 0], .32, body));
    P('box', 0, .88, 0, 1.15, .95, .7, mid);
    P('sphere', 0, 1.78, .12, .5, .5, .5, body);
    [-1, 1].forEach(q => { const hand = [q * .85, .75, -q * walk * .4]; bone(hand, [q * .72, 1.72, 0], .3, body); P('sphere', hand[0], hand[1] - .2, hand[2], .42, .42, .42, mid); });
    [-1, 1].forEach(q => P('gem8', q * .62, 1.78, 0, .32, .55, .32, hue, { e:.55, ink:0 }));
    eyes(2.0, .34, .1, .08);
  } else if (type === 'knight') {
    [-1, 1].forEach(q => { bone([q * .2, 0, Math.sin(walk * q) * .3], [q * .2, .85, 0], .22, body); P('box', q * .2, .02, Math.sin(walk * q) * .3 + .05, .26, .18, .36, trim); });
    P('box', 0, .85, 0, .78, .9, .46, mid); P('box', 0, 1.25, .02, .84, .4, .5, trim, { e:.05 });
    P('box', 0, .78, 0, .82, .14, .5, body);
    [-1, 1].forEach(q => P('sphere', q * .5, 1.6, 0, .38, .3, .38, trim));
    P('sphere', 0, 1.78, 0, .46, .52, .46, mid);
    P('box', 0, 1.86, .2, .3, .06, .1, glow, { e:1, ink:0 });
    P('cone', 0, 2.0, -.05, .08, .5, .5, glow, { e:.5, ink:0 });
    P('box', 0, .95, -.3, .7, 1.0, .06, shade(hue, .55), { rx:.15 + Math.sin(ph * 3) * .05 });
    const sw = Math.sin(ph * 4) * .25;
    bone([.6, 1.0, .25], [.52, 1.5, 0], .16, body);
    P('box', .62, 1.0, .5, .07, .14, .5, '#3a2a1a');
    P('box', .62, 1.0, .55, .06, 1.25, .16, '#d8dce8', { rx:1.4 + sw, ink:.04 });
    bone([-.6, 1.05, .2], [-.52, 1.5, 0], .16, body);
    P('box', -.68, .7, .25, .12, .85, .62, trim, { e:.05 });
    P('gem', -.75, 1.0, .25, .18, .26, .18, glow, { e:.8, ink:0, rz:Math.PI / 2 });
  } else if (type === 'crawler') {
    P('sphere', 0, .4, -.45, 1.0, .75, 1.15, body);
    P('sphere', 0, .45, .3, .62, .5, .6, mid);
    P('sphere', 0, .42, .68, .38, .34, .36, body);
    [-1, 1].forEach(q => bone([q * .12, .32, .82], [q * .2, .12, 1.05], .06, trim, 'cone'));
    for (let i = 0; i < 4; i++) [-1, 1].forEach(q => {
      const z = .45 - i * .3, lift = Math.max(0, Math.sin(ph * 9 + i * 1.6 + (q > 0 ? Math.PI : 0))) * .25;
      const hip = [q * .25, .48, z], knee = [q * .78, .85 + lift, z + (i - 1.5) * .12], foot = [q * 1.15, .02 + lift * .3, z + (i - 1.5) * .25];
      bone(hip, knee, .08, body); bone(foot, knee, .06, mid);
    });
    for (let i = 0; i < 3; i++) P('gem', 0, .8, -.2 - i * .3, .14, .3, .14, hue, { e:.6, ink:0 });
    eyes(.5, .82, .09, .07); eyes(.58, .78, .17, .05);
  } else if (type === 'elemental') {
    const h = 1.2 + Math.sin(ph * 2) * .15;
    P('gem8', 0, h - .4, 0, .9, 1.4, .9, mid, { ry:ph * .6 });
    P('gem', 0, h - .1, 0, .55, .8, .55, glow, { e:1, ink:0 });
    for (let i = 0; i < 6; i++) { const a = ph * 1.4 + i / 6 * Math.PI * 2, r = .95 + Math.sin(ph * 2 + i) * .1;
      P('gem8', Math.cos(a) * r, h - .2 + Math.sin(a * 2) * .25, Math.sin(a) * r, .38, .46, .38, i % 2 ? body : mid, { ry:a }); }
    for (let i = 0; i < 4; i++) { const a = -ph * 2 + i / 4 * Math.PI * 2; P('cone', Math.cos(a) * .3, .1, Math.sin(a) * .3, .2, .7, .2, glow, { e:.6, ink:0, a:.7 }); }
    eyes(h + .3, .32, .12, .08);
  } else if (type === 'wraith') {
    const f = .35 + Math.sin(ph * 2) * .15;
    P('cone', 0, f, 0, 1.1, 2.0, 1.1, body);
    P('sphere', 0, f + 1.45, .05, .55, .6, .55, mid);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + ph; P('cone', Math.cos(a) * .35, f + .05, Math.sin(a) * .35, .22, .55, .22, body, { rx:Math.PI }); }
    [-1, 1].forEach(q => bone([q * .5, f + 1.25, 0], [q * .85, f + .55, .45 + Math.sin(ph * 3 + q) * .2], .12, body, 'cone'));
    eyes(f + 1.72, .27, .1, .09);
    P('sphere', 0, f + .9, .3, .22, .22, .22, hue, { e:.9, ink:0 });
  } else if (type === 'serpent') {
    for (let i = 5; i >= 0; i--) { const s = .7 - i * .07; P('sphere', Math.sin(ph * 3 - i * .8) * .35, .25 + Math.sin(ph * 2 - i) * .08, .9 - i * .45, s, s * .85, s, i % 2 ? body : mid); }
    P('sphere', Math.sin(ph * 3) * .35, .55, 1.25, .62, .5, .7, body);
    P('cone', Math.sin(ph * 3) * .35, .9, .9, .1, .45, .25, hue, { e:.5, ink:0 });
    eyes(.85, 1.55, .14, .1, Math.sin(ph * 3) * .35);
  } else if (type === 'hydra') {
    P('sphere', 0, .1, -.2, 1.6, 1.2, 1.9, body);
    for (let i = 0; i < 4; i++) P('gem', 0, 1.0, .3 - i * .35, .22, .5, .22, trim, { e:.5, ink:0 });
    bone([0, .5, -1.0], [0, .3 + Math.sin(ph * 3) * .2, -1.9], .3, body, 'cone');
    [-1, 0, 1].forEach(q => {
      const sway = Math.sin(ph * 2.2 + q * 1.3) * .25, neck = [q * .55 + sway, 1.9 + Math.cos(ph * 2 + q) * .15, .9 + Math.abs(q) * -.15];
      bone([q * .3, .7, .5], neck, .28, mid);
      P('sphere', neck[0], neck[1] - .05, neck[2] + .15, .5, .4, .6, body);
      [-1, 1].forEach(s2 => P('cone', neck[0] + s2 * .14, neck[1] + .22, neck[2], .08, .32, .08, trim));
      [-1, 1].forEach(s2 => P('sphere', neck[0] + s2 * .12, neck[1] + .05, neck[2] + .4, .08, .08, .08, glow, { e:1, ink:0 }));
    });
  } else if (type === 'flyer') {
    const h = 1.4 + Math.sin(ph * 3) * .2, flap = Math.sin(ph * 14) * .7;
    P('sphere', 0, h, 0, .55, .55, .7, body);
    [-1, 1].forEach(q => P('box', q * .22, h + .3, 0, .08, .9, .55, mid, { rz:q * (1.2 + flap) }));
    P('gem', 0, h - .25, 0, .25, .35, .25, hue, { e:.8, ink:0, rx:Math.PI });
    eyes(h + .35, .3, .1, .09);
  } else if (type === 'horror') {
    const p = Math.sin(ph * 2) * .06;
    P('sphere', 0, .1, 0, 1.3 + p, 1.1 - p, 1.3 + p, body);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; P('cone', Math.cos(a) * .4, .7, Math.sin(a) * .4, .18, .6, .18, i % 2 ? hue : mid, { rx:Math.sin(a) * .9, rz:-Math.cos(a) * .9, e: i % 2 ? .5 : 0 }); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .4; bone([Math.cos(a) * .55, .3, Math.sin(a) * .55], [Math.cos(a) * 1.2, .05 + Math.max(0, Math.sin(ph * 3 + i)) * .5, Math.sin(a) * 1.2], .12, body); }
    P('sphere', 0, .75, .5, .32, .32, .2, glow, { e:1, ink:0 });
  } else {   // crystal golem
    const bob = Math.sin(ph * 3) * .12;
    P('gem8', 0, .25 + bob, 0, 1.2, 1.7, 1.2, body, { ry:ph * .8 });
    P('gem', 0, .75 + bob, 0, .6, .8, .6, glow, { e:.9, ink:0 });
    eyes(1.25 + bob, .5, .2, .1);
  }

  // ---- tier trappings ----
  const [hy, hz] = HEAD_AT[type] || [1.8, 0];
  if (tier === 2) {
    [-1, 1].forEach(q => P('cone', q * .2, hy, hz, .1, .42, .1, trim, { rz:-q * .5, rx:-.3 }));
    [-1, 1].forEach(q => P('box', q * .26, hy * .62, hz - .25, .3, .14, .45, trim, { rz:q * .35, e:.05 }));
  } else if (tier === 3) {
    P('disc', 0, .05, 0, 2.2, .02, 2.2, glow, { e:.6, a:.3, ink:0 });
    for (let i = 0; i < 3; i++) { const a = ph * 1.2 + i / 3 * Math.PI * 2; P('gem', Math.cos(a) * 1.05, hy * .65 + Math.sin(ph * 2 + i) * .15, Math.sin(a) * 1.05, .2, .45, .2, trim, { e:.6, ink:.04, ry:a }); }
    for (let i = 0; i < 3; i++) P('gem', (i - 1) * .22, hy * .75, hz - .35, .16, .5, .16, trim, { e:.3, rx:-.5, rz:(i - 1) * .4 });
  } else if (tier === 4) {
    P('disc', 0, .05, 0, 3.2, .02, 3.2, glow, { e:.7, a:.35, ink:0 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; P('cone', Math.cos(a) * .2, hy + .2, hz + Math.sin(a) * .2, .1, .34, .1, trim, { e:.6, ink:.03 }); }
    for (let i = 0; i < 10; i++) { const a = ph * .8 + i / 10 * Math.PI * 2; P('gem', Math.cos(a) * .48, hy + .55, hz + Math.sin(a) * .48, .08, .14, .08, trim, { e:1, ink:0 }); }
    for (let i = 0; i < 4; i++) { const a = -ph + i / 4 * Math.PI * 2; P('sphere', Math.cos(a) * 1.4, hy * .5 + Math.sin(ph * 2 + i) * .3, Math.sin(a) * 1.4, .18, .18, .18, glow, { e:1, ink:0 }); }
    P('sphere', 0, hy * .1, 0, 2.4, hy * 1.15, 2.4, glow, { e:.8, a:.08, ink:0 });
  }
}

// ---------- battle screen (SVG) ----------
function enemySVG(name, hue, boss, size, tier = 1) {
  const type = foeType(name), id = 'f' + (hashStr(name + tier) % 1e6), dark = '#1a0f22', g = `url(#${id})`;
  const TC = [null, { trim:'#c8913a', eye:'#ffb347' }, { trim:'#cfefff', eye:'#7ef2ff' }, { trim:'#ffd166', eye:'#ffd166' }][tier - 1];
  const edge = TC ? TC.trim : hue, eye = TC ? TC.eye : '#ff4d7a';
  const shapes = {
    beast:`<path d="M14 66 Q16 48 34 44 L64 42 Q74 30 86 36 L92 46 Q96 52 88 56 L82 58 L80 76 L72 76 L70 62 L40 62 L36 78 L28 78 L28 62 Q18 64 8 54 Q12 62 14 66Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <path d="M78 36 L80 24 L86 34Z" fill="${hue}"/><path d="M40 44 L44 32 L48 44 M52 43 L56 30 L60 43" stroke="${hue}" stroke-width="3" fill="none"/>
      <circle cx="84" cy="44" r="2.6" fill="${eye}"/>`,
    brute:`<path d="M30 92 L34 66 L22 60 Q18 40 30 34 L40 32 Q42 18 50 16 Q58 18 60 32 L70 34 Q82 40 78 60 L66 66 L70 92 L56 92 L52 70 L48 70 L44 92Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <path d="M26 36 L22 22 L34 32Z M74 36 L78 22 L66 32Z" fill="${hue}"/><circle cx="46" cy="25" r="2.2" fill="${eye}"/><circle cx="54" cy="25" r="2.2" fill="${eye}"/>`,
    knight:`<path d="M38 94 L40 66 L30 62 L28 38 Q34 30 42 30 L42 20 Q50 10 58 20 L58 30 Q66 30 72 38 L70 62 L60 66 L62 94 L54 94 L50 72 L46 94Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <rect x="44" y="21" width="12" height="3" fill="${eye}"/><path d="M50 10 L48 2 L56 8Z" fill="${hue}"/>
      <path d="M76 18 L80 18 L80 66 L76 66Z" fill="#d8dce8" stroke="${dark}" stroke-width="1"/><path d="M71 64 L85 64" stroke="${edge}" stroke-width="3"/>
      <path d="M14 42 L30 40 L30 70 Q22 78 14 70Z" fill="${dark}" stroke="${edge}" stroke-width="2"/><circle cx="22" cy="54" r="3" fill="${eye}"/>`,
    crawler:`<ellipse cx="42" cy="62" rx="22" ry="16" fill="${g}" stroke="${edge}" stroke-width="2"/><ellipse cx="66" cy="60" rx="12" ry="10" fill="${dark}" stroke="${edge}" stroke-width="2"/>
      <path d="M36 50 L24 34 L12 58 M44 48 L38 28 L22 52 M52 50 L56 30 L74 46 M58 54 L72 36 L88 62 M36 72 L26 80 L14 90 M48 76 L46 86 L36 96 M56 74 L64 86 L74 94 M62 70 L76 78 L90 86" stroke="${dark}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>
      <circle cx="70" cy="57" r="2.2" fill="${eye}"/><circle cx="75" cy="60" r="1.6" fill="${eye}"/><circle cx="66" cy="55" r="1.6" fill="${eye}"/>`,
    elemental:`<path d="M50 14 L66 40 L58 76 L42 76 L34 40Z" fill="${g}" stroke="${edge}" stroke-width="2"/><path d="M50 30 L57 44 L50 60 L43 44Z" fill="${eye}" opacity=".9"/>
      <path d="M18 34 L28 28 L30 40 L20 44Z M78 30 L88 38 L82 48 L72 42Z M14 64 L24 60 L26 72 L16 74Z M80 64 L90 66 L86 78 L76 74Z" fill="${dark}" stroke="${edge}" stroke-width="1.5"/>
      <path d="M40 80 Q50 96 60 80" stroke="${eye}" stroke-width="2" fill="none" opacity=".7"/>`,
    wraith:`<path d="M50 10 Q70 12 72 36 Q74 60 84 90 L74 82 L68 92 L60 82 L50 94 L40 82 L32 92 L26 82 L16 90 Q26 60 28 36 Q30 12 50 10Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <path d="M36 32 Q50 20 64 32 Q60 46 50 48 Q40 46 36 32Z" fill="${dark}"/><circle cx="44" cy="35" r="2.6" fill="${eye}"/><circle cx="56" cy="35" r="2.6" fill="${eye}"/>`,
    serpent: tier === 4
      ? `<path d="M20 90 Q30 70 50 68 Q70 70 80 90Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
        <path d="M36 72 Q20 50 22 30 M50 68 Q50 44 50 20 M64 72 Q80 50 78 30" stroke="${dark}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <ellipse cx="22" cy="26" rx="9" ry="7" fill="${g}" stroke="${edge}" stroke-width="2"/><ellipse cx="50" cy="16" rx="9" ry="7" fill="${g}" stroke="${edge}" stroke-width="2"/><ellipse cx="78" cy="26" rx="9" ry="7" fill="${g}" stroke="${edge}" stroke-width="2"/>
        <circle cx="25" cy="24" r="2" fill="${eye}"/><circle cx="53" cy="14" r="2" fill="${eye}"/><circle cx="81" cy="24" r="2" fill="${eye}"/>`
      : `<path d="M20 86 Q6 70 22 60 Q40 50 30 38 Q22 26 40 18 Q58 12 68 22 Q76 30 70 36 Q64 40 58 34 Q54 28 46 30 Q38 34 46 44 Q58 58 42 70 Q30 78 40 86Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
        <path d="M44 18 L46 8 L52 16 M56 15 L60 6 L62 16" stroke="${hue}" stroke-width="3" fill="none"/><circle cx="64" cy="26" r="2.4" fill="${eye}"/>`,
    flyer:`<path d="M50 34 Q60 34 62 48 Q62 62 50 66 Q38 62 38 48 Q40 34 50 34Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <path d="M40 44 Q20 22 6 30 Q18 38 14 50 Q28 44 40 52Z M60 44 Q80 22 94 30 Q82 38 86 50 Q72 44 60 52Z" fill="${dark}" stroke="${edge}" stroke-width="1.5" opacity=".9"/>
      <circle cx="45" cy="44" r="2.4" fill="${eye}"/><circle cx="55" cy="44" r="2.4" fill="${eye}"/><path d="M50 66 L46 74 L54 74Z" fill="${hue}"/>`,
    horror:`<path d="M50 20 Q78 22 80 50 Q80 72 50 74 Q20 72 20 50 Q22 22 50 20Z" fill="${g}" stroke="${edge}" stroke-width="2"/>
      <path d="M28 66 Q20 82 12 88 M40 72 Q38 86 30 96 M60 72 Q62 86 70 96 M72 66 Q80 82 88 88" stroke="${dark}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M50 20 L48 8 L54 18 M30 28 L20 18 L32 24 M70 28 L80 18 L68 24" stroke="${hue}" stroke-width="3" fill="none"/>
      <ellipse cx="50" cy="46" rx="10" ry="7" fill="${eye}"/><ellipse cx="50" cy="46" rx="3" ry="6" fill="${dark}"/>`
  };
  let body = shapes[type];
  if (!body) {   // crystal golem
    const h = hashStr(name), sides = 5 + h % 4, pts = [];
    for (let i = 0; i < sides; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / sides, rr = (boss ? 40 : 34) * (i % 2 ? .82 + (h >> i & 3) * .05 : 1); pts.push(`${(50 + Math.cos(a) * rr).toFixed(1)},${(54 + Math.sin(a) * rr).toFixed(1)}`); }
    body = `<polygon points="${pts.join(' ')}" fill="${g}" stroke="${edge}" stroke-width="2.5"/><path d="M50 22 L44 44 L56 52 L46 78" stroke="${eye}" stroke-width="2" fill="none" opacity=".8"/>
      <ellipse cx="40" cy="52" rx="4" ry="5.5" fill="${eye}"/><ellipse cx="60" cy="52" rx="4" ry="5.5" fill="${eye}"/>`;
  }
  const deco = tier === 2 ? `<path d="M34 14 L26 0 L40 10Z M66 14 L74 0 L60 10Z" fill="${TC.trim}" stroke="${dark}" stroke-width="1"/>`
    : tier === 3 ? `<path d="M8 30 L12 18 L16 30 L12 36Z M84 22 L88 10 L92 22 L88 28Z M88 70 L92 60 L96 70 L92 76Z" fill="${TC.trim}" opacity=".9"/><ellipse cx="50" cy="98" rx="34" ry="4" fill="${TC.eye}" opacity=".35"/>`
    : tier === 4 ? `<ellipse cx="50" cy="2" rx="22" ry="5" fill="none" stroke="${TC.trim}" stroke-width="2" opacity=".8"/>` : '';
  const crown = boss || tier === 4 ? `<path d="M30 14 L36 0 L44 10 L50 -4 L56 10 L64 0 L70 14Z" fill="${tier === 4 ? TC.trim : hue}" stroke="${dark}" stroke-width="1"/>` : '';
  const grad = tier === 4 ? '#3a1f3a' : tier === 3 ? '#2a4070' : tier === 2 ? '#5a3a1c' : shade(hue, .38);
  return `<svg viewBox="0 -6 100 106" width="${size}" height="${size}" aria-hidden="true" style="overflow:visible">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${grad}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${tier >= 3 ? 3.5 : 2.5}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${deco}<g filter="url(#${id}g)">${body}</g>${crown}</svg>`;
}
