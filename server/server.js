// Diamondverse account server: sign-up, login and cloud saves. No dependencies (Node 22.5+, built-in node:sqlite).
//
//   node server/server.js            → http://localhost:8787 serves the game and the API
//   PORT=9000 DB=/data/dv.sqlite node server/server.js
//
// Passwords are hashed with scrypt (random salt per user). Sessions are random 256-bit bearer tokens; only their SHA-256
// is stored. Saves are versioned: an upload must name the version it replaces, so two devices can't silently overwrite
// each other (the loser gets 409 and the client asks which save to keep).
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = +process.env.PORT || 8787;
const ROOT = path.resolve(__dirname, '..');
const DB_FILE = process.env.DB || path.join(__dirname, 'diamondverse.sqlite');
const SESSION_DAYS = 30, MAX_BODY = 1 << 20, MAX_SAVE = 512 * 1024;

// ---------- database ----------
const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE, hash TEXT NOT NULL, salt TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS saves (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, version INTEGER NOT NULL, updated INTEGER NOT NULL, summary TEXT);
`);
const q = {
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  addUser: db.prepare('INSERT INTO users (username, hash, salt, created) VALUES (?, ?, ?, ?)'),
  addSession: db.prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)'),
  session: db.prepare('SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE token = ? AND expires > ?'),
  dropSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  sweep: db.prepare('DELETE FROM sessions WHERE expires <= ?'),
  getSave: db.prepare('SELECT data, version, updated, summary FROM saves WHERE user_id = ?'),
  saveMeta: db.prepare('SELECT version, updated, summary FROM saves WHERE user_id = ?'),
  insSave: db.prepare('INSERT INTO saves (user_id, data, version, updated, summary) VALUES (?, ?, 1, ?, ?)'),
  updSave: db.prepare('UPDATE saves SET data = ?, version = version + 1, updated = ?, summary = ? WHERE user_id = ? AND version = ?'),
};

// ---------- crypto ----------
const scrypt = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw, salt, 64, { N:16384, r:8, p:1 }, (e, k) => e ? no(e) : ok(k)));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
async function newSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.addSession.run(sha(token), userId, Date.now() + SESSION_DAYS * 864e5);
  return token;
}

// ---------- rate limiting: 10 auth attempts per IP per minute ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
  h.push(now); hits.set(ip, h);
  return h.length > 10;
}
setInterval(() => { const now = Date.now(); hits.forEach((h, ip) => { if (!h.some(t => now - t < 60000)) hits.delete(ip); }); q.sweep.run(now); }, 300000).unref();

// ---------- helpers ----------
function send(res, code, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers });
  res.end(data);
}
function readJson(req) {
  return new Promise((ok, no) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { no(Object.assign(new Error('Too large'), { code:413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { ok(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}); } catch (e) { no(Object.assign(new Error('Bad JSON'), { code:400 })); } });
    req.on('error', no);
  });
}
function auth(req) {
  const m = /^Bearer ([\w-]{20,})$/.exec(req.headers.authorization || '');
  return m ? q.session.get(sha(m[1]), Date.now()) : null;
}
const NAME = /^[A-Za-z0-9_]{3,20}$/;
// A short description of a save, shown when choosing between this device's save and the cloud's.
function summarize(s) {
  return JSON.stringify({ name:String(s.name || '').slice(0, 24), level:+s.level || 1, cls:String(s.cls || ''), worldsCleared:+s.worldsCleared || 0, created:!!s.created });
}

// ---------- API ----------
const API = {
  'GET /api/health': () => [200, { ok:true, service:'diamondverse' }],
  async 'POST /api/register'(req, body, ip) {
    if (limited(ip)) return [429, { error:'Too many attempts. Wait a minute.' }];
    const { username, password } = body;
    if (!NAME.test(username || '')) return [400, { error:'Username: 3–20 letters, numbers or _.' }];
    if (typeof password !== 'string' || password.length < 8 || password.length > 200) return [400, { error:'Password: at least 8 characters.' }];
    if (q.userByName.get(username)) return [409, { error:'That username is taken.' }];
    const salt = crypto.randomBytes(16).toString('hex'), hash = (await scrypt(password, salt)).toString('hex');
    const r = q.addUser.run(username, hash, salt, Date.now());
    return [201, { token:await newSession(Number(r.lastInsertRowid)), user:{ username } }];
  },
  async 'POST /api/login'(req, body, ip) {
    if (limited(ip)) return [429, { error:'Too many attempts. Wait a minute.' }];
    const { username, password } = body, u = typeof username === 'string' && q.userByName.get(username);
    const salt = u ? u.salt : 'no-user-salt-0000', key = await scrypt(String(password || ''), salt);   // same work either way
    if (!u || !crypto.timingSafeEqual(key, Buffer.from(u.hash, 'hex'))) return [401, { error:'Wrong username or password.' }];
    return [200, { token:await newSession(u.id), user:{ username:u.username } }];
  },
  'POST /api/logout'(req) {
    const m = /^Bearer ([\w-]{20,})$/.exec(req.headers.authorization || ''); if (m) q.dropSession.run(sha(m[1]));
    return [200, { ok:true }];
  },
  'GET /api/me'(req, body, ip, user) {
    if (!user) return [401, { error:'Not signed in.' }];
    const s = q.saveMeta.get(user.id);
    return [200, { user:{ username:user.username }, save: s ? { version:s.version, updated:s.updated, summary:JSON.parse(s.summary || '{}') } : null }];
  },
  'GET /api/save'(req, body, ip, user) {
    if (!user) return [401, { error:'Not signed in.' }];
    const s = q.getSave.get(user.id);
    return [200, s ? { data:JSON.parse(s.data), version:s.version, updated:s.updated, summary:JSON.parse(s.summary || '{}') } : { data:null, version:0 }];
  },
  'PUT /api/save'(req, body, ip, user) {
    if (!user) return [401, { error:'Not signed in.' }];
    const { data, version } = body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [400, { error:'Missing save data.' }];
    const text = JSON.stringify(data); if (text.length > MAX_SAVE) return [413, { error:'Save is too large.' }];
    const now = Date.now(), sum = summarize(data), cur = q.saveMeta.get(user.id);
    if (!cur) { q.insSave.run(user.id, text, now, sum); return [200, { version:1, updated:now }]; }
    const r = body.force ? q.updSave.run(text, now, sum, user.id, cur.version) : q.updSave.run(text, now, sum, user.id, +version || 0);
    if (!r.changes) return [409, { error:'The cloud save changed on another device.', version:cur.version, updated:cur.updated, summary:JSON.parse(cur.summary || '{}') }];
    return [200, { version:(body.force ? cur.version : +version) + 1, updated:now }];
  },
};

// ---------- static files (the game itself) ----------
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.md':'text/markdown; charset=utf-8' };
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, '.' + rel);
  const inside = file.startsWith(ROOT + path.sep);
  const hidden = rel.split('/').some(p => p.startsWith('.')) || file.startsWith(path.join(ROOT, 'server') + path.sep) || file.startsWith(path.join(ROOT, 'tools') + path.sep);
  if (!inside || hidden || !TYPES[path.extname(file)]) return send(res, 404, { error:'Not found' });
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error:'Not found' });
    res.writeHead(200, { 'Content-Type':TYPES[path.extname(file)], 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), ip = req.socket.remoteAddress || '?';
  const handler = API[`${req.method} ${url.pathname}`];
  if (url.pathname.startsWith('/api/')) {
    if (!handler) return send(res, 404, { error:'Unknown endpoint.' });
    try {
      if ((req.method === 'POST' || req.method === 'PUT') && !/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error:'Send JSON.' });
      const body = req.method === 'POST' || req.method === 'PUT' ? await readJson(req) : {};
      const [code, out] = await handler(req, body, ip, auth(req));
      send(res, code, out);
    } catch (e) { send(res, e.code || 500, { error: e.code ? e.message : 'Server error.' }); if (!e.code) console.error(e); }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error:'Method not allowed' });
  serveStatic(req, res, url);
});
if (require.main === module) server.listen(PORT, () => console.log(`Diamondverse on http://localhost:${PORT}  (database: ${DB_FILE})`));
module.exports = { server, db };
