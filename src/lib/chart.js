import { format } from 'd3-format';
import { tickStep } from 'd3-array';

// The monochrome UN Blue ramp, dark to light. This is the default: six bands of
// one hue read as one quantity divided six ways, which is what a stacked or
// sequential series is. Anything that is not overlapping lines wants this.
const RAMP = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)'];

// UN Blue plus the five accents, in fixed order. Reserved for the one case the
// brand carves out: series that overlap inside a single plot, where a single-hue
// ramp cannot keep them apart. A chart reaching for this should be able to say
// why the ramp failed it.
const CATEGORY = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];

// Neither set is cycled: past six the honest move is to split the chart, not to
// reuse a colour and let two series claim the same ink. See ocha-palette.md.
function slot(set, i, which) {
  if (i >= set.length) {
    throw new Error(
      `${which} slot ${i} exceeds the six defined colors — split the chart rather than cycling`
    );
  }
  return set[i];
}

export const rampColor = (i) => slot(RAMP, i, 'ramp');
export const seriesColor = (i) => slot(CATEGORY, i, 'categorical');

export const fmt = format(',');
export const f1 = (v) => v.toFixed(1) + '%';
export const f2 = (v) => v.toFixed(2) + '%';

export function kfmt(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(Math.round(v));
}

// vocab.json holds raw document counts; every series is a share of the
// body-bearing documents in that year.
export function share(counts, denominator) {
  return counts.map((c, i) => (denominator[i] ? (c / denominator[i]) * 100 : 0));
}

// Index a series to a share of its own total. The framework's presentation rule:
// documents and page views are different quantities and must never share an axis.
export function indexToTotal(values) {
  const total = values.reduce((a, b) => a + b, 0);
  return total ? values.map((v) => (v / total) * 100) : values.map(() => 0);
}

// Centered moving average. Centered rather than trailing because the result is
// drawn as a curve and a trailing window would shift the whole shape right by
// half the window. The cost is at the edges: the window shrinks to what exists,
// so day 0 of a sudden-onset spike is averaged over days 0..3 and reads lower
// than the raw count. Peaks taken off this series are therefore SMOOTHED peaks
// and can differ from the raw peak by several days — see smoothedPeakIndex.
export function movingAverage(values, window = 7) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length, i + half + 1);
    let sum = 0;
    for (let k = lo; k < hi; k++) sum += values[k];
    return sum / (hi - lo);
  });
}

// Pointer x -> nearest data index. The four interactive charts each carried their
// own copy of this; the viewBox correction (clientX is in CSS pixels, the scale is
// in viewBox units) is the part that was easy to get subtly wrong. The capture
// rect spans the plot only, exactly the scale's range, so the pointer's fraction
// across the rect maps onto that range. Scaling by the whole svg width instead
// ran the index ahead of the pointer by the width of the margins.
export function nearestIndex(ev, { scale, count }) {
  const box = ev.currentTarget.getBoundingClientRect();
  const [r0, r1] = scale.range();
  const px = r0 + ((ev.clientX - box.left) / box.width) * (r1 - r0);
  return Math.max(0, Math.min(count - 1, Math.round(scale.invert(px))));
}

// The peak of the smoothed, own-total-indexed series — i.e. the peak of the curve
// actually drawn, which is what a marker on that curve has to point at. The raw
// per-day peak is a different quantity and comes from the pipeline; a figure
// showing both must label which is which.
export function smoothedPeakIndex(values, window = 7) {
  const smooth = movingAverage(indexToTotal(values), window);
  return smooth.indexOf(Math.max(...smooth));
}

// Push labels apart so direct end-labels stay readable — the secondary encoding
// the palette validation depends on.
export function decollide(entries, minGap = 30, bounds = null) {
  const sorted = [...entries].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
  }
  if (bounds) {
    const [lo, hi] = bounds;
    // Spreading downwards can push the last label past the axis; shift the whole
    // stack back up, then clamp from the top so nothing leaves the plot.
    const overflow = sorted[sorted.length - 1].y - hi;
    if (overflow > 0) for (const e of sorted) e.y -= overflow;
    if (sorted[0].y < lo) {
      sorted[0].y = lo;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
      }
    }
  }
  return sorted;
}

// Like decollide, but a label moves only if it overlaps another. Overlapping
// labels form a cluster stacked `minGap` apart and centered on their own targets;
// clusters that then touch merge and re-center; each is kept inside `bounds`.
// decollide pushes downward and then shifts the whole stack when the bottom
// overflows, which drags labels with room of their own off their line ends.
export function spreadLabels(entries, minGap, [lo, hi]) {
  const sorted = [...entries].sort((a, b) => a.y - b.y);
  const place = (c) => {
    const mean = c.items.reduce((a, e) => a + e.y, 0) / c.items.length;
    const span = (c.items.length - 1) * minGap;
    c.top = Math.max(lo, Math.min(hi - span, mean - span / 2));
  };
  const clusters = sorted.map((e) => ({ items: [e] }));
  clusters.forEach(place);
  for (let i = 1; i < clusters.length; ) {
    const a = clusters[i - 1];
    const b = clusters[i];
    if (a.top + a.items.length * minGap > b.top) {
      a.items.push(...b.items);
      clusters.splice(i, 1);
      place(a);
      i = Math.max(1, i - 1);
    } else i++;
  }
  for (const c of clusters) c.items.forEach((e, k) => (e.y = c.top + k * minGap));
  return sorted;
}

// Round a scale's top up to a whole tick, so the highest plotted point always
// sits below the top gridline rather than above it. The charts pair this with a
// pixel pad on the range, which puts visible space above the top tick without
// inflating the domain into an ugly round number.
export function niceTop(max, maxTicks = 8, minHeadroom = 0.03, minTicks = 2) {
  if (!(max > 0) || !Number.isFinite(max)) return { top: 1, ticks: [0, 1] };

  // Candidate steps: what d3 would choose for a range of tick counts, plus
  // coarser multiples of each. The multiples matter — tickStep only ever
  // proposes 1/2/5 x 10^k for a given count, so without them a chart asking
  // for 4 gridlines over a 0.4 range has no candidate below 6 and silently
  // gets a denser axis than it asked for.
  const steps = new Set();
  for (const count of [8, 6, 5, 4, 3, 2]) {
    const base = tickStep(0, max, count);
    if (base > 0) for (const m of [1, 2, 5]) steps.add(base * m);
  }

  const options = [];
  for (const step of steps) {
    let top = Math.ceil(max / step) * step;
    // Clear the peak by a margin, not just by a hair: markers and annotation
    // dots are drawn on the top point and would otherwise cross the gridline.
    while (top < max * (1 + minHeadroom)) top += step;
    const ticks = [];
    for (let t = 0; t <= top + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
    if (ticks.length >= 2) options.push({ top, ticks });
  }

  // minTicks is the floor a caller sets when the tightest-top rule would
  // otherwise leave a series with nothing but a zero line and a top line, which
  // reads as no axis at all on a tall panel.
  const usable = options.filter(
    (o) => o.ticks.length <= maxTicks && o.ticks.length >= minTicks
  );
  if (usable.length) {
    // Tightest top wins. On a tie, the DENSER axis within budget: two options
    // reaching the same top differ only in how readable the interval is, and
    // an axis of nothing but a zero line and a top line is not worth the space.
    usable.sort((a, b) => a.top - b.top || b.ticks.length - a.ticks.length);
    return usable[0];
  }
  // Nothing fits the budget. Come as close to it as possible rather than
  // falling through to the tightest top.
  options.sort((a, b) => a.ticks.length - b.ticks.length || a.top - b.top);
  return options[0];
}

// Plot margins. These were six sets of magic numbers, one per component, and the
// right gutter in particular is not free choice: it is the width of the direct
// end-labels, so the label decision and the margin have to move together.
export const GUTTER_END_LABELS = 144;   // series name + value, at 11.5px
export const GUTTER_OVERLAY_LABELS = 176; // crisis names in the attention band
export const GUTTER_PLAIN = 20;

export const MARGIN = {
  // y tick labels are right-aligned at -9, so 46 clears five digits plus a unit
  series: { t: 18, r: GUTTER_END_LABELS, b: 32, l: 46 },
  plain: { t: 18, r: GUTTER_PLAIN, b: 32, l: 46 },
  daily: { t: 20, r: GUTTER_PLAIN, b: 30, l: 42 },
  band: { t: 18, r: GUTTER_OVERLAY_LABELS, b: 34, l: 46 },
  // y labels here are at most four characters (4k, 9.8%), 7px off the plot
  spark: { t: 6, r: 12, b: 20, l: 32 }
};

// Pixels reserved above the top gridline. Charts that annotate near the top
// pass a larger value so labels sit in the pad rather than over the plot.
export const TOP_PAD = 12;

// Left gutter wide enough for the longest category label at 11px.
export function labelGutter(labels, extra = 14, max = 300) {
  const longest = labels.reduce((a, b) => (String(b).length > a.length ? String(b) : a), '');
  return Math.min(max, Math.ceil(longest.length * 6.1) + extra);
}

// The pipeline output runs 1996..2026, but 2026 is a part year, so no year axis
// on the site plots it. Every year-indexed series is sliced to completeCount()
// before it reaches a chart, which is why no annual chart passes partialFrom.
export const LAST_COMPLETE_YEAR = '2025';

// How many leading entries of a year axis are complete years. Labels and values
// are sliced with the same number so they cannot fall out of step.
export function completeCount(years) {
  const i = years.indexOf(LAST_COMPLETE_YEAR);
  if (i < 0) throw new Error(`year axis has no ${LAST_COMPLETE_YEAR} to cut at`);
  return i + 1;
}

// The part year itself. It survives only as the label on the sources snapshot,
// which the pipeline produces for the current year rather than as a series.
export const PARTIAL_YEAR = '2026';
