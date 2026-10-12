import data from '$lib/data/vocab.json';
import { share, completeCount } from '$lib/chart.js';

// Shared term shares for the Vocabulary section.
// 2026 is a part year: cutting the axis before the shares are computed keeps
// every series on the same 1996-2025 window as the rest of the site.
const n = completeCount(data.years);
export const years = data.years.slice(0, n);
const denominator = data.denominator.slice(0, n);
const toShares = (group) =>
  Object.fromEntries(Object.entries(group).map(([k, v]) => [k, share(v.slice(0, n), denominator)]));

export const shares = toShares(data.derived);
// Fallers added after the derivation (rq7/vocab_data.py ADDED), which the
// term-shift figure can show through its `extra` prop.
const addedShares = toShares(data.added ?? {});
// Event terms (COVID, AIDS, Ebola...) track what happened rather than how the
// sector talks, so the Vocabulary section leaves them out of its ranking.
export const eventShares = toShares(data.event);
export const totalReports = data.total_reports;

// The four terms the derivation could not propose: two never reach minimum
// support as bigrams, one sits below the charting floor, and localisation
// appears in 13 documents of the selection sample. They are measured exactly
// like every other term, but their selection was a judgment, so the panels
// carry the mark rather than leaving it to a note the reader has to open.
export const EDITORIAL = new Set(['affected people', 'relief items', 'explosive ordnance', 'localisation']);

// Document bodies collapsed over this period: the median English situation report
// carried 478 distinct words in 1999 and 151 in 2022, as documents moved to PDF
// attachments with a stub body behind them. A share-of-documents metric is not
// length-neutral, so every term faces a headwind late. Measured again over a
// length-matched band of the local export, these two reverse: they are charted
// as falling but rise once early and late documents carry comparable text. The
// panels therefore carry neither colour, because the direction is not established.
export const UNSETTLED = new Set(['hostilities', 'capacity building']);

// Terms are keyed as the pipeline counts them; shown in American spelling.
const SPELL = { localisation: 'localization' };
export const mark = (label) =>
  (SPELL[label] ?? label) + (EDITORIAL.has(label) ? ' †' : '') + (UNSETTLED.has(label) ? ' ‡' : '');

// Any term, discourse or event, as a share of documents per year.
export const termShare = (term) => shares[term] ?? eventShares[term];

// The terms charted in 2b and 2c, ranked by change in document share 2000 -> 2025.
// Both leave out the terms whose direction is not established (their share falls
// only because documents got shorter; length-matched, they rise) and early
// warning, whose direction flips with the start year and which is largely the
// name of FEWS NET. Neither chart then needs that caveat.
const i00 = years.indexOf('2000');
const i25 = years.indexOf('2025');
const rowOf = ([label, s]) => ({ label, from: s[i00], to: s[i25], change: s[i25] - s[i00] });
export const added = Object.entries(addedShares).map(rowOf);
export const settled = Object.entries(shares)
  .map(rowOf)
  .sort((a, b) => b.change - a.change)
  .filter((r) => !UNSETTLED.has(r.label) && r.label !== 'early warning');
// Both 2b and 2c mark the editorially added terms with †, so each explains them.
export const EDITORIAL_NOTE =
  '† Added by the editors: localization and explosive ordnance for their prominence in current humanitarian debates, and affected people and relief items as counterparts to beneficiaries and cash. The other terms were selected statistically, as those whose use changed most. All terms are counted the same way.';
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const words = (n, cap = false) => {
  const w = NUM[n] ?? String(n);
  return cap ? w[0].toUpperCase() + w.slice(1) : w;
};
