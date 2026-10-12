import { describe, it, expect } from 'vitest';
import {
  seriesColor, rampColor, share, indexToTotal, movingAverage, smoothedPeakIndex,
  decollide, spreadLabels, niceTop, labelGutter, kfmt, nearestIndex
} from './chart.js';

// The palette rule is load-bearing: the OCHA ramp is the default and the
// categorical set is the exception, both in a fixed order, and cycling either
// would let two series claim the same ink.
describe('palettes', () => {
  it('ramps through the monochrome slots in order', () => {
    expect([0, 1, 2, 3, 4, 5].map(rampColor))
      .toEqual(['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)']);
  });

  it('returns the categorical slots in order', () => {
    expect([0, 1, 2, 3, 4, 5].map(seriesColor))
      .toEqual(['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)']);
  });

  it('throws on a seventh series rather than wrapping', () => {
    expect(() => seriesColor(6)).toThrow(/split the chart/);
    expect(() => rampColor(6)).toThrow(/split the chart/);
  });
});

// The axis rule the browser audit checks at the pixel level, checked here at the
// scale level: the top tick must clear the data, so a marker drawn on the peak
// still falls below the top gridline.
describe('niceTop', () => {
  const cases = [0.4, 1, 7, 12.1, 59_241, 100, 193, 1_141_174, 0.0001, 2 / 3];

  it('always clears the max by at least the headroom', () => {
    for (const max of cases) expect(niceTop(max).top).toBeGreaterThanOrEqual(max * 1.03);
  });

  it('respects the tick budget', () => {
    for (const max of cases) expect(niceTop(max).ticks.length).toBeLessThanOrEqual(8);
    for (const max of cases) expect(niceTop(max, 4).ticks.length).toBeLessThanOrEqual(4);
  });

  it('honors a tick floor, at the cost of a looser top', () => {
    // The users series: the tightest top leaves 0-and-25M, which reads as no
    // axis, so the chart asks for three.
    expect(niceTop(19_973_647, 4).ticks.length).toBe(2);
    expect(niceTop(19_973_647, 4, 0.03, 3).ticks).toEqual([0, 10e6, 20e6, 30e6]);
    for (const max of cases) {
      expect(niceTop(max, 8, 0.03, 3).ticks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('emits evenly spaced ticks starting at zero', () => {
    for (const max of cases) {
      const { ticks, top } = niceTop(max);
      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeCloseTo(top, 9);
      const step = ticks[1] - ticks[0];
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i] - ticks[i - 1]).toBeCloseTo(step, 9);
      }
    }
  });

  it('guards degenerate input instead of producing NaN scales', () => {
    for (const bad of [0, -5, NaN, Infinity, undefined]) {
      expect(niceTop(bad)).toEqual({ top: 1, ticks: [0, 1] });
    }
  });
});

// Direct end-labels are one of the secondary encodings the palette floor
// depends on, so they have to stay both readable and inside the plot.
describe('decollide', () => {
  const ys = (rows) => rows.map((r) => r.y);

  it('holds the minimum gap between labels', () => {
    const out = decollide([{ y: 100 }, { y: 104 }, { y: 106 }], 30);
    for (let i = 1; i < out.length; i++) expect(out[i].y - out[i - 1].y).toBeGreaterThanOrEqual(30);
  });

  it('leaves already-separated labels untouched', () => {
    expect(ys(decollide([{ y: 0 }, { y: 50 }, { y: 100 }], 30))).toEqual([0, 50, 100]);
  });

  it('returns entries sorted by position', () => {
    expect(ys(decollide([{ y: 90 }, { y: 10 }, { y: 50 }], 5))).toEqual([10, 50, 90]);
  });

  it('keeps the whole stack inside bounds when spreading overflows', () => {
    // Three labels needing 30px each cannot fit in 0..40 without clamping.
    const out = decollide([{ y: 38 }, { y: 39 }, { y: 40 }], 30, [0, 100]);
    expect(out[0].y).toBeGreaterThanOrEqual(0);
    expect(out[out.length - 1].y).toBeLessThanOrEqual(100);
  });

  it('shifts the stack up rather than pushing the last label past the axis', () => {
    const out = decollide([{ y: 95 }, { y: 96 }], 30, [10, 100]);
    expect(out[out.length - 1].y).toBeLessThanOrEqual(100);
    expect(out[1].y - out[0].y).toBeGreaterThanOrEqual(30);
  });
});

describe('share', () => {
  it('expresses counts as a percentage of the denominator', () => {
    expect(share([50, 25], [100, 100])).toEqual([50, 25]);
  });

  it('returns zero rather than Infinity for an empty year', () => {
    expect(share([5, 5], [0, 10])).toEqual([0, 50]);
  });
});

// Documents and page views are different quantities and must never share an
// axis; indexing each to its own total is what makes them comparable at all.
describe('indexToTotal', () => {
  it('sums to 100', () => {
    const out = indexToTotal([1, 2, 3, 4]);
    expect(out.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 9);
  });

  it('returns zeros for an all-zero series instead of NaN', () => {
    expect(indexToTotal([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('movingAverage', () => {
  it('leaves a flat series flat', () => {
    expect(movingAverage([5, 5, 5, 5, 5], 3)).toEqual([5, 5, 5, 5, 5]);
  });

  it('averages over a shrinking window at the edges', () => {
    // window 3 at index 0 covers [0,1] only — two values, not three.
    expect(movingAverage([0, 3, 3, 3, 3], 3)[0]).toBeCloseTo(1.5, 9);
  });

  it('preserves length and never introduces NaN', () => {
    const out = movingAverage([1, 0, 0, 9, 2, 0, 0], 7);
    expect(out).toHaveLength(7);
    for (const v of out) expect(Number.isFinite(v)).toBe(true);
  });
});

// The bug this guards: the chart marked the peak of the smoothed curve while the
// table printed the raw daily peak, in the same figure.
describe('smoothedPeakIndex', () => {
  it('differs from the raw peak when a spike is isolated', () => {
    const v = [0, 0, 0, 100, 0, 0, 0, 20, 20, 20, 20, 20];
    expect(v.indexOf(Math.max(...v))).toBe(3);
    expect(smoothedPeakIndex(v, 7)).not.toBe(3);
  });

  it('agrees with the raw peak on a broad hump', () => {
    const v = [1, 2, 4, 8, 16, 8, 4, 2, 1];
    expect(smoothedPeakIndex(v, 3)).toBe(4);
  });
});

describe('spreadLabels', () => {
  const at = (ys) => ys.map((y) => ({ y }));
  it('leaves labels that do not overlap on their own lines', () => {
    expect(spreadLabels(at([20, 60, 100]), 15, [10, 200]).map((e) => e.y)).toEqual([20, 60, 100]);
  });
  it('moves only the overlapping cluster, not labels with room of their own', () => {
    // A tight pack on the floor must not drag the labels above it.
    const ys = spreadLabels(at([40, 80, 190, 192, 199]), 15, [10, 200]).map((e) => e.y);
    expect(ys.slice(0, 2)).toEqual([40, 80]);
    expect(ys.slice(2)).toEqual([170, 185, 200]);
  });
  it('merges clusters that touch once spread', () => {
    const ys = spreadLabels(at([100, 104, 118]), 15, [10, 200]).map((e) => e.y);
    expect(ys[1] - ys[0]).toBe(15);
    expect(ys[2] - ys[1]).toBe(15);
  });
});

describe('nearestIndex', () => {
  // Eleven points across a 100-unit plot; the capture rect spans exactly that plot.
  const scale = { range: () => [0, 100], invert: (px) => px / 10 };
  const ev = (clientX, left = 0, width = 100) => ({
    clientX,
    currentTarget: { getBoundingClientRect: () => ({ left, width }) }
  });
  const params = { scale, count: 11 };

  it('maps a pointer position to the nearest index', () => {
    expect(nearestIndex(ev(50), params)).toBe(5);
    expect(nearestIndex(ev(52), params)).toBe(5);
  });

  it('clamps outside the plot instead of returning an out-of-range index', () => {
    expect(nearestIndex(ev(-500), params)).toBe(0);
    expect(nearestIndex(ev(9999), params)).toBe(10);
  });

  it('corrects for the viewBox when CSS width differs from user units', () => {
    // Rendered at half scale: a pointer at CSS x=25 is user-unit x=50 -> index 5.
    expect(nearestIndex(ev(25, 0, 50), params)).toBe(5);
  });

  it('tracks the pointer across the plot, not the whole svg with its margins', () => {
    // Plot starts 46px in; its left edge, middle and right edge are the first,
    // middle and last points. Scaling by the svg width ran ahead of the pointer.
    expect(nearestIndex(ev(46, 46), params)).toBe(0);
    expect(nearestIndex(ev(96, 46), params)).toBe(5);
    expect(nearestIndex(ev(137, 46), params)).toBe(9);
    expect(nearestIndex(ev(146, 46), params)).toBe(10);
  });
});

describe('formatting helpers', () => {
  it('abbreviates without trailing zeros', () => {
    expect(kfmt(1_141_174)).toBe('1.1M');
    expect(kfmt(59_241)).toBe('59k');
    expect(kfmt(1000)).toBe('1k');
    expect(kfmt(193)).toBe('193');
  });

  it('sizes the label gutter to the longest category', () => {
    const short = labelGutter(['a', 'bb']);
    const long = labelGutter(['a', 'Non-governmental Organization']);
    expect(long).toBeGreaterThan(short);
    expect(labelGutter(['x'.repeat(500)])).toBeLessThanOrEqual(300);
  });
});
