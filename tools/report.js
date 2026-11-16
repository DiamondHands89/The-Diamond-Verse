// Turns tools/sim.js output into a compact difficulty table.
// Usage: node tools/report.js story.json explorer.json out.json
// Difficulty score per stage (0–100): 60 × (1 − lowest hero HP during the win) + 30 × min(1, losses ÷ 2) + 10 × min(1, companions KO'd ÷ 2)
// Bands: under 20 Easy · 20–39 Fair · 40–59 Hard · 60+ Brutal
const fs = require('fs');
const [a, b, out] = process.argv.slice(2);
const score = x => Math.round(Math.min(100, 60 * (1 - x.lo) + 30 * Math.min(1, (x.tries - 1) / 2) + 10 * Math.min(1, x.ko / 2)));
function pack(file) {
  const r = JSON.parse(fs.readFileSync(file)), res = {};
  const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
  for (const k in r) {
    const runs = r[k].map(run => run.rows.filter(x => !x.stuck));
    res[k] = { runs: runs.length, level: Math.round(mean(r[k].map(x => x.level))), comps: Math.round(mean(r[k].map(x => x.comps))),
      losses: +mean(runs.map(rows => rows.reduce((t, x) => t + x.tries - 1, 0))).toFixed(1),
      // per realm (averaged over runs): stage scores s1..s5, stage losses s1..s5, boss rounds, hero level at the boss
      realms: Array.from({ length: 50 }, (_, i) => {
        const per = runs.map(rows => rows.filter(x => x.w === i + 1));
        const at = (s, f) => +mean(per.map(w => f(w[s]))).toFixed(2);
        return { sc: [0,1,2,3,4].map(s => Math.round(at(s, score))), lo: [0,1,2,3,4].map(s => at(s, x => x.tries - 1)),
          br: Math.round(at(4, x => x.rounds)), lv: Math.round(at(4, x => x.lvl)) };
      }) };
  }
  return res;
}
fs.writeFileSync(out, JSON.stringify({ story: pack(a), explorer: pack(b) }));
console.log('wrote', out);
