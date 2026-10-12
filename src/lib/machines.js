import epilogue from '$lib/data/epilogue.json';
import ai from '$lib/data/ai_referrals.json';
import archive from '$lib/data/archive.json';
import { fmt, kfmt } from '$lib/chart.js';
import { readWindowShort } from '$lib/readwindow.js';

// Jobs and training are out of scope, so the two AI-referral stats count only
// visits that start on a report or map, computed from the pipeline's report/map
// series rather than the site-wide figures curated in epilogue.json.
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const docs = ai.documents;
const chatgpt = docs.series.find((s) => s.label === 'ChatGPT').values;
// ChatGPT visits are summed over the same months as every other readership
// figure (readwindow.js), so the key figures share one window.
const [from, to] = archive.still_worth.window;
const COMPUTED = {
  'chatgpt.com referrals': sum(chatgpt.slice(ai.months.indexOf(from), ai.months.indexOf(to) + 1)),
  // Complete months only; the channel first reports in 2026.
  '“AI Assistant” channel': sum(docs.channel.slice(0, -1))
};
// The channel's months, from its first month with data to the last complete one,
// so the label says which months the figure sums.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mon = (ym) => `${MON[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const chFirst = ai.months[docs.channel.findIndex((v) => v > 0)];
const chLast = ai.months[ai.months.length - 2];
const chSpan = chFirst.slice(0, 4) === chLast.slice(0, 4)
  ? `${MON[+chFirst.slice(5, 7) - 1]} – ${mon(chLast)}`
  : `${mon(chFirst)} – ${mon(chLast)}`;

// The machine-reader stat row for the Machines section.
// Display numbers are rounded hard (359k, not 358,787). The pipeline stores
// them written out in full, so round the plain counts on the way in and leave
// anything already carrying a unit — the 96% — as it is.
// Plain-language labels for a general reader, keyed by the pipeline's own
// labels. The technical detail (referrer names, user agents, page paths) lives
// in the source notes, not on the page.
const PLAIN = {
  'chatgpt.com referrals': {
    k: 'Visits from ChatGPT',
    n: `Visits to documents from ChatGPT links, ${readWindowShort}`
  },
  '“AI Assistant” channel': {
    k: 'Visits from AI assistants',
    n: `Visits to documents that Google Analytics counts as coming from AI tools, ${chSpan}, the months since it added the category`
  },
  "ReliefWeb's own AI chat": {
    k: 'Uses of ReliefWeb’s AI chat',
    n: 'Times the chat assistant built into ReliefWeb was opened, Aug 2025 – Jun 2026; use stops in Jul 2026'
  }
};
// The fourth figure is API reach, not the unattributed-traffic share curated in
// epilogue.json: that 96% was of a sample of anonymous calls only, and read as
// if it were all API traffic. This is the share of calls made outside OCHA in
// the latest log window, with the months the logs actually cover.
const api = epilogue.external_share[epilogue.external_share.length - 1];
const spanOf = ([a, b]) =>
  a.slice(0, 4) === b.slice(0, 4)
    ? `${MON[+a.slice(5, 7) - 1]}–${mon(b)}`
    : `${mon(a)} – ${mon(b)}`;
const apiSpan = api.segments.map(spanOf).join(' and ');
const apiStat = {
  k: 'Data requests from outside OCHA',
  v: `${api.all_ocha}%`,
  n: `Share of ReliefWeb API calls, including those for jobs and training, made from outside OCHA, in logs covering ${apiSpan}`
};

export const machineStats = [
  ...epilogue.stats
    .filter((s) => s.k !== 'Unattributed API traffic')
    .map((s) => {
      const n = COMPUTED[s.k] ?? Number(String(s.v).replace(/,/g, ''));
      return { ...s, ...PLAIN[s.k], v: Number.isFinite(n) ? kfmt(n) : s.v };
    }),
  apiStat
];

// AI referrals to reports and maps: the rise, the peak and where they stand now,
// from the data, complete months only, the five named assistants summed, for the
// intro to the AI referrals chart in the close.
const aiMonths = ai.months.slice(0, -1);
const aiTotals = aiMonths.map((_, i) => docs.series.reduce((a, s) => a + s.values[i], 0));
const aiPeak = aiTotals.indexOf(Math.max(...aiTotals));
const aiNow = aiTotals.length - 1;
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const aiMonth = (i) => `${FULL[+aiMonths[i].slice(5, 7) - 1]} ${aiMonths[i].slice(0, 4)}`;
const round100 = (v) => fmt(Math.round(v / 100) * 100);
export const aiDocsBrief =
  `AI assistants sent about ${round100(aiTotals[aiNow])} visits to ReliefWeb documents in ${aiMonth(aiNow)}, ` +
  `up from ${round100(aiTotals[0])} in ${aiMonth(0)} but down from a peak of ${round100(aiTotals[aiPeak])} in ${aiMonth(aiPeak)}, mostly because ChatGPT now sends fewer visits.`;
export const aiDocsSpan = `${mon(aiMonths[0])} – ${mon(aiMonths[aiNow])}`;
