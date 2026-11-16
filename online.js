// Diamondverse — online layer (offline today). Everything the game needs from a server goes through `Online`,
// so connecting a backend later means writing one adapter, not touching game code.
//
// PLANNED MODES
//   presence  Shared open world: see other Facetborn walking the same realm (realm.js calls Online.presence.update)
//   arena     PvP: async duels against other players' saved party snapshots, then live PvP
//   raids     Online boss team-ups: up to 3 players + companions vs a raid version of a realm boss
//
// ADAPTER SHAPE  (assign to Online.adapter, then call Online.connect())
//   {
//     name: 'my-backend',
//     async connect({ playerId, name }) -> { ok:true, features:{ presence, arena, raids } }
//     presence: { join(realmId), leave(), update({ x, z, ry }), onPeers(cb) }      // cb([{ id, name, cls, x, z, ry }])
//     arena:    { async findMatch(snapshot) -> opponentSnapshot, async report(result) }
//     raids:    { async list(realmId) -> [{ id, boss, players }], async join(id, snapshot) -> raidSession }
//   }
// The combat engine works on generic party units (combat.js heroUnit/compUnit), so an opponent's snapshot
// or a raid partner's hero can be dropped into B.party / B.enemies as just another unit.
const Online = {
  adapter: null,
  status: 'offline',
  features: { presence:false, arena:false, raids:false },
  peers: [],
  modes() {
    return [
      { id:'presence', name:'Shared realms', desc:'See other Facetborn exploring the same realm, wave, and trade routes.', status: this.features.presence ? 'Live' : 'Coming soon' },
      { id:'arena', name:'Arena (PvP)', desc:'Duel other players\' parties for Arena ranks and seasonal rewards.', status: this.features.arena ? 'Live' : 'Coming soon' },
      { id:'raids', name:'Raid team-ups', desc:'Team up with up to two other players to fight empowered realm bosses.', status: this.features.raids ? 'Live' : 'Coming soon' }
    ];
  },
  async connect() {
    if (!this.adapter) return { ok:false, message:'Online play is not available yet.' };
    try {
      const r = await this.adapter.connect({ playerId:S.playerId, name:S.name });
      if (r && r.ok) { this.status = 'online'; this.features = { ...this.features, ...r.features }; }
      if (this.features.presence) this.adapter.presence.onPeers(list => { this.peers = list || []; });
      return r;
    } catch (e) { this.status = 'offline'; return { ok:false, message:'Could not reach the server.' }; }
  },
  // Portable copy of the hero + party for PvP and raids. Plain data only.
  snapshot() {
    return { v:1, playerId:S.playerId, name:S.name, cls:S.cls, cls2:S.cls2, level:S.level, look:S.look,
      stats:calcStats(), skills:S.loadout.map(id => ({ id, rank:S.skills[id] || 1 })),
      party:S.party.map(id => ({ id, bond:bondLevel(id), stats:compStats(id) })) };
  },
  presence: {
    join(realmId) { if (Online.features.presence) Online.adapter.presence.join(realmId); else Online.peers = []; },
    update(pos) { if (Online.features.presence) Online.adapter.presence.update(pos); }
  }
};
