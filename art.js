// Diamondverse — procedural art (hero, foes, speakers) and small shared UI helpers.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2400);
}
// Every view lives in normal page flow (no fixed, internally scrolling layers), so it scrolls
// and taps the same way inside any app frame. While a full-screen view (#layer) or a panel (#sheet)
// is showing, the main app is hidden.
let appScroll = 0, viewOpen = false;
function syncViews() {
  const open = !!($('#layer').innerHTML || $('#sheet').innerHTML);
  if (open === viewOpen) return;
  if (open) appScroll = window.scrollY;
  viewOpen = open; $('#app').hidden = open;
  window.scrollTo(0, open ? 0 : appScroll);
}
new MutationObserver(syncViews).observe($('#layer'), { childList:true });
new MutationObserver(syncViews).observe($('#sheet'), { childList:true });

function openSheet(html, bind) {
  $('#sheet').innerHTML = `<div class="sheet-bg"><div class="sheet" role="dialog">
    <button class="btn sm" id="sheetx" style="align-self:flex-start">← Back</button>${html}</div></div>`;
  $('#sheetx').onclick = closeSheet;
  if (bind) bind($('#sheet'));
}
function closeSheet() { $('#sheet').innerHTML = ''; }
function bar(cls, v, max, h) { return `<div class="bar ${cls}" ${h ? `style="height:${h}px"` : ''}><i style="width:${max ? Math.max(0, Math.min(100, v / max * 100)) : 0}%"></i></div>`; }
function gemNum(kind, n) { return `<span class="cur num"><i class="gem ${kind}"></i>${n.toLocaleString()}</span>`; }

const HAIR = [
  'M37 50 Q38 25 60 25 Q82 25 83 50 Q76 37 60 37 Q44 37 37 50Z',
  'M37 50 Q38 25 60 25 Q82 25 83 50 Q76 37 60 37 Q44 37 37 50Z M36 46 Q32 82 42 96 L49 94 Q41 72 43 50Z M84 46 Q88 82 78 96 L71 94 Q79 72 77 50Z',
  'M36 52 L32 28 L46 35 L49 17 L60 31 L71 15 L74 33 L88 27 L84 52 Q76 37 60 37 Q44 37 36 52Z',
  'M37 50 Q38 25 60 25 Q82 25 83 50 Q76 37 60 37 Q44 37 37 50Z M80 22 a10 10 0 1 1 1 20 a10 10 0 1 1 -1 -20Z'
];
function avatarSVG(look, cls, size) {
  const L = DV.LOOK, skin = L.skin[look.skin], hair = L.hair[look.hair], eye = L.eyes[look.eyes], fit = L.outfit[look.outfit];
  const cc = cls ? DV.CLASSES[cls].color : '#7ef2ff';
  return `<svg viewBox="0 0 120 140" width="${size}" height="${size * 140 / 120}" role="img" aria-label="Hero portrait">
    <polygon points="60,4 112,62 60,136 8,62" fill="none" stroke="${cc}" stroke-opacity=".35" stroke-width="1.5"/>
    <path d="M24 140 Q26 94 60 86 Q94 94 96 140Z" fill="${fit}"/>
    <path d="M44 88 L60 112 L76 88" fill="none" stroke="${cc}" stroke-width="2"/>
    <polygon points="60,100 67,109 60,120 53,109" fill="${cc}"/>
    <rect x="53" y="70" width="14" height="18" rx="5" fill="${skin}"/>
    <circle cx="60" cy="52" r="22" fill="${skin}"/>
    <ellipse cx="52" cy="55" rx="3.2" ry="3.8" fill="${eye}"/><ellipse cx="68" cy="55" rx="3.2" ry="3.8" fill="${eye}"/>
    <circle cx="53" cy="53.6" r="1" fill="#fff"/><circle cx="69" cy="53.6" r="1" fill="#fff"/>
    <path d="M55 65 Q60 68 65 65" stroke="#00000055" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="${HAIR[look.hairStyle]}" fill="${hair}"/>
  </svg>`;
}
function hashStr(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function enemySVG(name, hue, boss, size) {
  const h = hashStr(name), sides = 5 + h % 4, r = boss ? 40 : 34, pts = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / sides, rr = r * (i % 2 ? .82 + (h >> i & 3) * .05 : 1);
    pts.push(`${(50 + Math.cos(a) * rr).toFixed(1)},${(54 + Math.sin(a) * rr).toFixed(1)}`);
  }
  const crown = boss ? `<path d="M30 20 L36 4 L44 16 L50 0 L56 16 L64 4 L70 20Z" fill="${hue}"/>` : '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <polygon points="${pts.join(' ')}" fill="#1a0f22" stroke="${hue}" stroke-width="2.5"/>
    <path d="M50 22 L44 44 L56 52 L46 78" stroke="#ff4d7a" stroke-width="2" fill="none" opacity=".8"/>
    <ellipse cx="40" cy="52" rx="4" ry="5.5" fill="#ff4d7a"/><ellipse cx="60" cy="52" rx="4" ry="5.5" fill="#ff4d7a"/>
    ${crown}</svg>`;
}
const SPEAKER_COLOR = { lumeria:'#7ef2ff', mira:'#8fe3b0', vaelith:'#b8d86b', brann:'#ff9a5b', pyrrhos:'#ff6a3d',
  isla:'#4fc3f7', nereon:'#3d8bff', riku:'#c3a6ff', zephyra:'#a98cff', nyxos:'#9b8cff', kael:'#e8f4ff', narr:'#8e95c6' };
