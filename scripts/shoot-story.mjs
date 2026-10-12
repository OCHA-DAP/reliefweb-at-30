// Walks the story step by step: scrolls each step onto the reading line, waits
// for the marks to settle, screenshots, and checks that the graphic beside it
// is showing that step. Also checks every step has text and
// every sticky graphic has drawn something. Exits non-zero on any failure.
//
//   AUDIT_URL=http://localhost:4173/ SHOTS=/tmp/shots node scripts/shoot-story.mjs [width] [height]
import { mkdirSync, writeFileSync } from 'node:fs';
import { openPage } from './cdp.mjs';

const width = +(process.argv[2] ?? 1280);
const height = +(process.argv[3] ?? 1200);
const out = process.env.SHOTS ?? 'shots';
mkdirSync(out, { recursive: true });

const page = await openPage({ width, height, settle: 3000 });
const steps = await page.eval('[...document.querySelectorAll(".step[data-step]")].map(s => s.id)');
let fails = 0;
const fail = (m) => (fails++, console.log(`FAIL ${m}`));

const empty = await page.eval('[...document.querySelectorAll(".step")].filter(s => !s.textContent.trim()).map(s => s.id)');
if (empty.length) fail(`steps without text: ${empty.join(', ')}`);
const blank = await page.eval('[...document.querySelectorAll(".graphic svg")].filter(s => !s.children.length).length');
if (blank) fail(`${blank} sticky svg(s) with no children`);
const paths = await page.eval('document.querySelectorAll("#a3 .graphic path").length');
if (paths <= 200) fail(`map has ${paths} paths, expected over 200`);
// Every series stops at 2025. 2026 may appear only as a month in a
// measurement window (the readership window, its excluded months, the API
// logs), never as a year of data.
const late = await page.eval(`(() => {
  const text = document.querySelector('.story').innerText.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* 2026/g, '');
  return [/2026/.test(text), /before 1996/i.test(text)];
})()`);
if (late[0]) fail('"2026" outside the readership window');
if (late[1]) fail('"before 1996" in the page');
// The first step of each chapter should sit level with its graphic.
const offset = await page.eval(`[...document.querySelectorAll('.scrolly')].map((sc) => {
  const st = sc.querySelector('.step');
  st.scrollIntoView({ block: 'center' });
  const g = sc.querySelector('.graphic').getBoundingClientRect();
  const p = st.querySelector('p').getBoundingClientRect();
  return Math.round(p.top + p.height / 2 - (g.top + g.height / 2));
})`);
console.log(`first step center minus graphic center, px: ${offset.join(', ')}`);

for (const id of steps) {
  // Onto the reading line steps.js uses: mid-screen, or three quarters down on
  // a phone, below the pinned graphic.
  await page.eval(`(() => {
    const r = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
    const line = innerHeight * (matchMedia('(max-width: 699px)').matches ? 0.75 : 0.5);
    scrollBy(0, r.top + r.height / 2 - line);
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  const [want, got] = await page.eval(`(() => {
    const s = document.getElementById(${JSON.stringify(id)});
    return [s.dataset.step, s.closest('.scrolly').querySelector('.graphic').dataset.step];
  })()`);
  const file = `${out}/${width}-${id}.png`;
  writeFileSync(file, await page.screenshot());
  // Once pinned, the graphic's center should sit on the reading line (desktop).
  const off = await page.eval(`(() => {
    if (matchMedia('(max-width: 699px)').matches) return 0;
    const g = document.getElementById(${JSON.stringify(id)}).closest('.scrolly').querySelector('.graphic').getBoundingClientRect();
    return Math.round(g.top + g.height / 2 - innerHeight / 2);
  })()`);
  if (Math.abs(off) > 2) fail(`${id}: graphic center is ${off}px off the reading line`);
  // One step's text on screen at a time (desktop; on a phone the pinned
  // graphic covers the text above the reading line).
  const shown = await page.eval(`matchMedia('(max-width: 699px)').matches ? 1 : [...document.querySelectorAll('.step p')].filter((p) => {
    const r = p.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  }).length`);
  if (shown > 1) fail(`${id}: ${shown} step texts on screen`);
  const wide = await page.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  if (wide > 0) fail(`${id}: page scrolls sideways by ${wide}px`);
  if (want !== got) fail(`${id}: graphic shows step ${got}, expected ${want}`);
  else console.log(`ok   ${id} → ${file}`);
}

console.log(`\n${steps.length} steps at ${width}×${height}, ${fails} failure(s)`);
page.close();
process.exit(fails ? 1 : 0);
