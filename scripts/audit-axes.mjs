// The axis rule: for every chart, find the topmost gridline and assert no drawn
// geometry (line/area path, bar rect, marker) rises above it. niceTop() in
// chart.js is what makes this hold; this is the check that it still does.
import { openPage } from './cdp.mjs';

const page = await openPage();

const rows = await page.eval(`
(() => {
  const out = [];
  document.querySelectorAll('svg').forEach((svg, i) => {
    const grid = [...svg.querySelectorAll('line.gridline')];
    if (!grid.length) return;
    const topY = Math.min(...grid.map(g => +g.getAttribute('y1')));
    const marks = [...svg.querySelectorAll('path[stroke], path[fill]:not([fill="none"]), rect[fill]:not([fill="transparent"]):not(.partial), polygon, circle')];
    let worst = Infinity, tag = '';
    for (const m of marks) {
      if (m.classList.contains('partial') || m.classList.contains('leader')) continue;
      let box; try { box = m.getBBox(); } catch { continue; }
      if (!box || box.height === 0 && box.width === 0) continue;
      if (box.y < worst) { worst = box.y; tag = m.tagName + (m.getAttribute('class')||''); }
    }
    const label = svg.getAttribute('aria-label')||'';
    out.push({ i, topY: +topY.toFixed(1), worst: +worst.toFixed(1),
               over: +(topY - worst).toFixed(1), tag, label: label.slice(0,52) });
  });
  return out;
})()
`);

const bad = rows.filter((x) => x.over > 0.6);
console.log(`charts with gridlines: ${rows.length}`);
console.log(`violations (geometry above top tick): ${bad.length}`);
for (const b of bad) console.log(`  +${b.over}px  ${b.tag}  ${b.label}`);

console.log('\ntightest clearances:');
rows
  .sort((a, b) => b.over - a.over)
  .slice(0, 6)
  .forEach((x) => console.log(`  ${(-x.over).toFixed(1)}px  ${x.tag.padEnd(12)} ${x.label}`));

page.close();
process.exit(bad.length ? 1 : 0);
