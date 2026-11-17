// Exports the game's content (story, realms, classes, skills, companions, jobs, gear, foe tiers) as JSON files that
// Unreal Engine can import as DataTables, for the Unreal action fork. Every file is an array of rows with a unique
// "Name" field (the DataTable row key). Nested values stay as JSON objects/arrays; flatten them in the matching
// USTRUCTs or import them as DataAssets instead.
// Usage: node tools/export-content.js [outDir]   (default: export/)
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.resolve(process.argv[2] || path.join(ROOT, 'export'));
const ctx = {};
vm.runInNewContext(['data.js', 'realms/arc1.js', 'realms/arc2.js', 'realms/arc3.js', 'realms/arc4.js', 'realms/arc5.js']
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + ';this.DV = DV;', ctx);
const DV = ctx.DV;
const speaker = s => s === 'narr' ? 'Narration' : s === 'lumeria' ? 'Lumeria' : s;
const write = (name, rows) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(rows, null, 2)); console.log(`${name}: ${rows.length} rows`); };
fs.mkdirSync(OUT, { recursive:true });

// Dialogue: one row per line, IDs match the Story Script doc (P-1, 7-I2, 7-B1, 7-A1, 7-L1, C-mira-1).
const lines = [];
DV.PROLOGUE.forEach((l, i) => lines.push({ Name:`P-${i + 1}`, Realm:0, Scene:'Prologue', Order:i + 1, Speaker:speaker(l[0]), Text:l[1] }));
DV.WORLDS.forEach(W => {
  [['intro', 'I', 'Intro'], ['bossTalk', 'B', 'Boss'], ['after', 'A', 'Aftermath']].forEach(([k, c, scene]) =>
    W[k].forEach((l, i) => lines.push({ Name:`${W.id}-${c}${i + 1}`, Realm:W.id, Scene:scene, Order:i + 1, Speaker:speaker(l[0]), Text:l[1] })));
  if (W.lore) lines.push({ Name:`${W.id}-L1`, Realm:W.id, Scene:'Lore', Order:1, Speaker:W.lore.title, Text:W.lore.text });
});
Object.entries(DV.COMPANIONS).forEach(([id, C]) => C.story.forEach((t, i) =>
  lines.push({ Name:`C-${id}-${i + 1}`, Realm:0, Scene:`Bond:${id}`, Order:i + 1, Speaker:'Narration', Text:t })));
write('dialogue.json', lines);

write('realms.json', DV.WORLDS.map(W => ({
  Name:`R${W.id}`, Id:W.id, Arc:DV.arcOf(W.id), DisplayName:W.name, Subtitle:W.sub, Biome:W.biome, Hue:W.hue,
  People:W.people[0], PeopleText:W.people[1], Custom:W.custom,
  God:W.god.name, GodTitle:W.god.pure, GodCorrupted:W.god.corrupted, Boss:W.boss, Guide:W.guide,
  Foes:W.foes, Landmarks:W.marks, Blessing:{ Stat:W.bless[0], Amount:W.bless[1], Name:W.bless[2] },
  Recruit:W.recruit || '', HiddenCompanion:W.hidden || '',
  SideQuest:W.quest, Lore:W.lore ? { Landmark:W.lore.mark, Title:W.lore.title, Skill:W.lore.skill } : null
})));
write('classes.json', Object.entries(DV.CLASSES).map(([id, k]) => ({ Name:id, DisplayName:k.name, Role:k.role, Weapon:k.weapon, MainStat:k.main, Color:k.color, Description:k.desc, Base:k.base, Growth:k.grow })));
write('skills.json', Object.entries(DV.SKILLS).map(([id, k]) => ({ Name:id, DisplayName:k.name, Class:k.cls || '', Hidden:!!k.hidden, UnlockLevel:k.lvl || 0, MPCost:k.mp, Cooldown:k.cd, Kind:k.kind, Power:k.pow || 0, Stat:k.stat || '', Description:k.desc, Extra:Object.fromEntries(Object.entries(k).filter(([f]) => !['cls','name','lvl','mp','cd','kind','pow','stat','desc','hidden'].includes(f))) })));
write('companions.json', Object.entries(DV.COMPANIONS).map(([id, C]) => ({ Name:id, DisplayName:C.name, Class:C.cls, Species:C.species, JoinRealm:C.from, Join:C.join, HiddenAt:C.mark != null ? DV.WORLDS[C.from - 1].marks[C.mark] : '', Bio:C.bio, StatMultipliers:C.mul || {}, Signature:C.sig, Look:C.look, BondWins:DV.BOND_WINS })));
write('jobs.json', Object.entries(DV.JOBS).map(([id, J]) => ({ Name:id, DisplayName:J.name, Tier:J.tier, Perk:J.perk, Mods:J.mods, Mastery:J.mastery || null, Requirements:J.req || [], Luxury:J.tier === 3 })));
write('gear.json', [
  ...DV.RARITY.map(r => ({ Name:`rarity-${r.id}`, Kind:'Rarity', DisplayName:r.name, Multiplier:r.mult, Color:r.color })),
  ...DV.SLOTS.map(s => ({ Name:`slot-${s}`, Kind:'Slot', DisplayName:DV.SLOT_NAME[s] })),
  ...DV.MATERIAL.map((m, i) => ({ Name:`material-${i + 1}`, Kind:'Material', DisplayName:m, Tier:i + 1 }))
]);
write('foe_tiers.json', DV.FOE_TIERS.map(T => ({ Name:`tier-${T.tier}`, Tier:T.tier, DisplayName:T.name, Title:T.title, Stars:T.stars, LevelsAboveBoss:T.lvl, HP:T.hp, ATK:T.atk, DEF:T.def, XP:T.xp, Gold:T.gold, DropChance:T.drop, Respawn:T.respawn, Where:T.where })));
