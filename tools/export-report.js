// Builds the balance-report datasets from tools/sim.js output.
// Usage: node tools/export-report.js story.json explorer.json outDir
// Writes outDir/combos.json (one row per profile × class pair) and outDir/stages.json (one row per profile × pair × realm × shrine).
// Difficulty score per shrine battle, 0–100, averaged over runs:
//   60 × (1 − lowest hero HP during the winning fight) + 30 × min(1, losses before winning ÷ 2) + 10 × min(1, companions knocked out ÷ 2)
const fs = require('fs'), path = require('path');
const [storyFile, explorerFile, outDir] = process.argv.slice(2);
const SELF = fs.readFileSync(__filename, 'utf8');
const ctx = {}; require('vm').runInNewContext(['data.js', 'realms/arc1.js', 'realms/arc2.js', 'realms/arc3.js', 'realms/arc4.js', 'realms/arc5.js']
  .map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n') + ';this.DV = DV;', ctx);
const DV = ctx.DV, cap = s => s[0].toUpperCase() + s.slice(1);
const score = x => Math.min(100, 60 * (1 - x.lo) + 30 * Math.min(1, (x.tries - 1) / 2) + 10 * Math.min(1, x.ko / 2));
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, r1 = v => Math.round(v * 10) / 10;
const combos = [], stages = [];
for (const [profile, file] of [['Story path', storyFile], ['Explorer', explorerFile]]) {
  const sim = JSON.parse(fs.readFileSync(file)), pid = profile === 'Story path' ? 'story' : 'explorer';
  for (const key of Object.keys(sim)) {
    const [p, s] = key.split('+'), runs = sim[key].map(r => r.rows.filter(x => !x.stuck)), pair = `${cap(p)} + ${cap(s)}`;
    const cell = (w, st) => runs.map(rows => rows.find(x => x.w === w && x.s === st)).filter(Boolean);
    let all = [], boss = [], arcStage = [[], [], [], [], []], arcBoss = [[], [], [], [], []];
    for (let w = 1; w <= 50; w++) for (let st = 0; st < 5; st++) {
      const c = cell(w, st); if (!c.length) continue;
      const sc = r1(mean(c.map(score))), losses = r1(mean(c.map(x => x.tries - 1))), a = DV.arcOf(w) - 1;
      stages.push({ id:`${pid}-${p}-${s}-${w}-${st + 1}`, profile, pair, realm:w, realm_name:DV.WORLDS[w - 1].name, arc:a + 1, shrine:st + 1,
        battle: st === 4 ? 'Boss' : 'Stage', score:sc, losses, rounds:Math.round(mean(c.map(x => x.rounds))), mp_start:Math.round(mean(c.map(x => x.mp ?? 1)) * 100), hero_level:Math.round(mean(c.map(x => x.lvl))) });
      all.push(sc); arcStage[a].push(sc); if (st === 4) { boss.push({ w, sc }); arcBoss[a].push(sc); }
    }
    const hardest = boss.reduce((m, b) => b.sc > m.sc ? b : m, boss[0]);
    combos.push({ id:`${pid}-${p}-${s}`, profile, pair, primary:cap(p), secondary:cap(s), runs:runs.length,
      avg_score:r1(mean(all)), boss_score:r1(mean(boss.map(b => b.sc))),
      boss_arc1:r1(mean(arcBoss[0])), boss_arc2:r1(mean(arcBoss[1])), boss_arc3:r1(mean(arcBoss[2])), boss_arc4:r1(mean(arcBoss[3])), boss_arc5:r1(mean(arcBoss[4])),
      mp_start:Math.round(mean(runs.flat().map(x => x.mp ?? 1)) * 100),
      losses_per_run:r1(mean(runs.map(rows => rows.reduce((t, x) => t + x.tries - 1, 0)))),
      final_level:Math.round(mean(sim[key].map(r => r.level))), hardest_boss_realm:`${hardest.w}. ${DV.WORLDS[hardest.w - 1].name}`, hardest_boss_score:hardest.sc });
  }
}
const meta = [{ label:'export-report.js', value:SELF, type:'code', lang:'javascript' },
  { label:'Input', value:'tools/sim.js output: 3 runs of every primary + secondary class pair (20 pairs) through all 50 realms, for the Story path and Explorer profiles. HP and MP carry between fights; MP recharges 0.4%/s outside battle (40 s of walking between fights); mp_start is the hero\'s MP % entering a shrine fight.' }];
fs.mkdirSync(outDir, { recursive:true });
fs.writeFileSync(path.join(outDir, 'combos.json'), JSON.stringify({ rows:combos, meta }));
fs.writeFileSync(path.join(outDir, 'stages.json'), JSON.stringify({ rows:stages, meta }));
console.log(`combos ${combos.length} rows, stages ${stages.length} rows → ${outDir}`);
