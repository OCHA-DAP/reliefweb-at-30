import ai from '$lib/data/ai_referrals.json';
import { fmt } from '$lib/chart.js';

const docs = ai.documents;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mon = (ym) => `${MON[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;

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
const TIMES = ['', '', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times', 'nine times', 'ten times'];
const times = (r) => TIMES[Math.round(r)] ?? `${Math.round(r)} times`;
export const aiDocsBrief =
  `AI assistants and chatbots sent about ${round100(aiTotals[aiNow])} visits to ReliefWeb documents in ${aiMonth(aiNow)}, ` +
  `about ${times(aiTotals[aiNow] / aiTotals[0])} those in ${aiMonth(0)}, but down from a peak of ${round100(aiTotals[aiPeak])} in ${aiMonth(aiPeak)}.`;
export const aiDocsSpan = `${mon(aiMonths[0])} – ${mon(aiMonths[aiNow])}`;
