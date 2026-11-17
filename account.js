// Diamondverse — accounts and cloud saves (client side of server/server.js).
// Progress always saves on the device first. When the game is served by the Diamondverse server and you are signed in,
// every save is also uploaded a few seconds later. Each cloud save has a version number; if another device uploaded
// in between, you choose which save to keep instead of one silently overwriting the other.
const Account = (() => {
  const TOKEN_KEY = 'diamondverse.token', META_KEY = 'diamondverse.cloud';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  let online = null, user = null, token = get(TOKEN_KEY), timer = null, busy = false, status = '', pending = false;
  let meta = (() => { try { return JSON.parse(get(META_KEY)) || {}; } catch (e) { return {}; } })();   // { username, version, syncedAt }
  const keepMeta = () => set(META_KEY, JSON.stringify(meta));

  async function api(method, url, body) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { method, signal:ctl.signal, headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const out = await r.json().catch(() => ({}));
      return { status:r.status, ...out };
    } catch (e) { return { status:0, error:'Could not reach the server.' }; } finally { clearTimeout(to); }
  }
  const summary = s => ({ name:s.name, level:s.level, cls:s.cls, worldsCleared:s.worldsCleared, created:!!s.created });
  const describe = (s, when) => !s || !s.created ? 'No hero yet' :
    `${esc(s.name || 'Hero')} · Lv ${s.level} ${s.cls && DV.CLASSES[s.cls] ? DV.CLASSES[s.cls].name : ''} · ${s.worldsCleared || 0}/50 realms saved${when ? ` · ${new Date(when).toLocaleString()}` : ''}`;

  // ---------- start-up ----------
  async function init() {
    if (!/^https?:$/.test(location.protocol)) { online = false; return refresh(); }
    const h = await api('GET', 'api/health');
    online = h.status === 200 && h.ok;
    if (online && token) {
      const me = await api('GET', 'api/me');
      if (me.status === 200) { user = me.user; await reconcile(); }
      else if (me.status === 401) signOutLocal();
    }
    refresh();
  }
  function refresh() {
    let f = document.getElementById('acctFloat');
    const want = online && !user && (!S || !S.created);
    if (want && !f) { f = document.createElement('button'); f.id = 'acctFloat'; f.className = 'btn sm acct-float'; f.textContent = '☁ Sign in'; f.onclick = sheet; document.body.appendChild(f); }
    if (!want && f) f.remove();
    const b = document.getElementById('acctBtn'); if (b) { b.textContent = user ? '☁ ' + user.username : '☁'; b.classList.toggle('on', !!user); }
  }

  // ---------- sync ----------
  // After signing in, decide which save wins: an empty side takes the other; if the cloud hasn't changed since this
  // device last synced, this device's (newer) save goes up; otherwise the player picks.
  async function reconcile() {
    const c = await api('GET', 'api/save');
    if (c.status !== 200) return;
    const local = S && S.created;
    if (!c.data || !c.data.created) { if (local) await push(c.version || 0); return; }
    if (!local) return applyCloud(c.data, c.version);
    if (meta.username === user.username && meta.version === c.version) return push(c.version);
    if (JSON.stringify(c.data) === JSON.stringify(S)) { meta = { username:user.username, version:c.version, syncedAt:Date.now() }; keepMeta(); return; }
    choose(c);
  }
  async function push(version, force) {
    if (!user || !S || !S.created) return;
    if (busy) { pending = true; return; }
    busy = true; status = 'Saving…';
    const r = await api('PUT', 'api/save', { data:S, version: version ?? (meta.username === user.username ? meta.version : 0), force:!!force });
    busy = false;
    if (r.status === 200) { meta = { username:user.username, version:r.version, syncedAt:Date.now() }; keepMeta(); status = ''; }
    else if (r.status === 409) { status = ''; const c = await api('GET', 'api/save'); if (c.status === 200) choose(c); }
    else if (r.status === 401) { signOutLocal(); toast('Signed out. Sign in again to keep cloud saving.'); }
    else status = r.error || 'Cloud save failed. It will retry on your next save.';
    if (pending) { pending = false; schedule(); }
  }
  function schedule() { if (!user) return; clearTimeout(timer); timer = setTimeout(() => push(), 3000); }
  function choose(c) {
    openSheet(`<div class="eyebrow">Cloud save</div><h2>Two different saves</h2>
      <div class="small muted">Your account's cloud save and this device's save are different. Pick the one to keep; the other is replaced.</div>
      <button class="opt" id="useCloud"><b>Keep the cloud save</b><span class="small muted">${describe(c.data, c.updated)}</span></button>
      <button class="opt" id="useLocal"><b>Keep this device's save</b><span class="small muted">${describe(S)}</span></button>`, el => {
      el.querySelector('#useCloud').onclick = () => applyCloud(c.data, c.version);
      el.querySelector('#useLocal').onclick = () => { closeSheet(); push(c.version, true).then(() => toast('This device\'s save is now in the cloud.')); };
    });
  }
  function applyCloud(data, version) {
    meta = { username:user.username, version, syncedAt:Date.now() }; keepMeta();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
    closeSheet(); $('#layer').innerHTML = '';
    if (typeof B !== 'undefined' && B) B = null;
    boot(JSON.parse(JSON.stringify(data)));
    if (typeof Realm !== 'undefined') Realm.reload();
    if (tab === 'world') render();
    refresh(); toast(`Cloud save loaded: ${S.name}, Lv ${S.level}.`);
  }
  function signOutLocal() { user = null; token = null; set(TOKEN_KEY, null); refresh(); }

  // ---------- account sheet ----------
  function sheet() {
    if (online === false) return openSheet(`<div class="eyebrow">Account</div><h2>Cloud saves</h2>
      <div class="small">Your progress is saved on this device.</div>
      <div class="card small muted">Accounts and cloud saves work when the game is played from the Diamondverse server
        (<code>node server/server.js</code>, see the README). This copy is running without it.</div>`);
    if (online === null) return toast('Checking the server…');
    if (user) return openSheet(`<div class="eyebrow">Account</div><h2>☁ ${esc(user.username)}</h2>
      <div class="card small"><b>This device:</b> ${describe(S)}<div class="muted">${status ? esc(status) : meta.syncedAt ? `Last cloud save ${new Date(meta.syncedAt).toLocaleString()} (version ${meta.version}).` : 'Not uploaded yet.'}</div></div>
      <div class="small muted">Every save uploads automatically a few seconds after you play. Sign in on another device to continue there.</div>
      <div class="row" style="gap:8px"><button class="btn primary" id="acSync">Save to cloud now</button><button class="btn" id="acOut">Sign out</button></div>`, el => {
      el.querySelector('#acSync').onclick = async () => { clearTimeout(timer); await push(); closeSheet(); toast(status || 'Saved to the cloud.'); };
      el.querySelector('#acOut').onclick = async () => { clearTimeout(timer); await push(); await api('POST', 'api/logout'); signOutLocal(); closeSheet(); toast('Signed out. Your progress stays on this device.'); };
    });
    let mode = 'in';
    const draw = () => openSheet(`<div class="eyebrow">Account</div><h2>${mode === 'in' ? 'Sign in' : 'Create an account'}</h2>
      <div class="small muted">${mode === 'in' ? 'Sign in to load your cloud save or keep this device\'s progress safe.' : 'An account keeps your hero in the cloud so you can play on any device.'}</div>
      <form id="acForm" class="stack" style="gap:10px" autocomplete="on">
        <label class="stack small"><span class="eyebrow">Username</span><input type="text" id="acUser" name="username" autocomplete="username" maxlength="20" required pattern="[A-Za-z0-9_]{3,20}" value="${esc(meta.username || '')}"></label>
        <label class="stack small"><span class="eyebrow">Password</span><input type="password" id="acPass" name="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" minlength="8" maxlength="200" required></label>
        ${mode === 'up' ? '<div class="small muted">3–20 letters, numbers or _. Password at least 8 characters.</div>' : ''}
        <div class="small" id="acErr" style="color:var(--bad, #ff6b81)" role="alert"></div>
        <button class="btn primary" type="submit">${mode === 'in' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button class="btn sm" id="acSwap">${mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>`, el => {
      el.querySelector('#acSwap').onclick = () => { mode = mode === 'in' ? 'up' : 'in'; draw(); };
      el.querySelector('#acForm').onsubmit = async e => {
        e.preventDefault();
        const btn = el.querySelector('[type=submit]'), err = el.querySelector('#acErr'); btn.disabled = true; err.textContent = '';
        const r = await api('POST', mode === 'in' ? 'api/login' : 'api/register', { username:el.querySelector('#acUser').value.trim(), password:el.querySelector('#acPass').value });
        btn.disabled = false;
        if (!r.token) { err.textContent = r.error || 'Something went wrong.'; return; }
        token = r.token; set(TOKEN_KEY, token); user = r.user;
        closeSheet(); toast(mode === 'in' ? `Signed in as ${user.username}.` : `Account created. Welcome, ${user.username}!`);
        await reconcile(); refresh();
      };
    });
    draw();
  }

  return { init, sheet, onSave:schedule, push, get user() { return user; }, get online() { return online; }, refresh };
})();
Account.init();
