// The attribution rule: every figure carries a source line. A new figure without
// one is a bug, so this fails rather than just reporting.
import { openPage } from './cdp.mjs';

const page = await openPage({ settle: 4000 });

const cards = await page.eval('document.querySelectorAll(".card").length');
const sourced = await page.eval(
  '[...document.querySelectorAll(".card")].filter(c=>c.querySelector(".source")).length'
);
// The sticky graphics in the story are not cards, so they are counted on their own.
const graphics = await page.eval('document.querySelectorAll(".graphic").length');
const graphicsSourced = await page.eval('document.querySelectorAll(".graphic:has(.source)").length');
const statRows = await page.eval('document.querySelectorAll(".stats").length');
const lines = await page.eval('document.querySelectorAll(".source").length');

console.log(`page               ${page.url}`);
console.log('cards on page      ', cards);
console.log('cards with source  ', sourced);
console.log('sticky graphics    ', graphics);
console.log('  with source      ', graphicsSourced);
console.log('stat rows          ', statRows);
console.log('total source lines ', lines);

console.log('\nevery attribution:');
console.log(
  await page.eval(
    '[...document.querySelectorAll(".source")].map((p,i)=>(i+1)+". "+p.textContent.replace(/\\s+/g," ").trim()).join("\\n")'
  )
);

const missing = cards - sourced + (graphics - graphicsSourced);
if (missing) console.log(`\nFAIL: ${missing} card(s) or graphic(s) without a source line`);
page.close();
process.exit(missing ? 1 : 0);
