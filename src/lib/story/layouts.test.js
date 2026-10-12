import { describe, it, expect } from 'vitest';
import rw30 from '$lib/data/rw30.json';
import { completeCount } from '$lib/chart.js';
import cs from '$lib/data/crisis_swarm.json';
import dots from '$lib/data/country_dots.json';
import topo from '$lib/data/world.topo.json';
import { waffle, squareCounts, categoryCuts, categoryAt, packed, inRange, halfCount, swarmY, worldPaths, shareClass, MAP_W } from './layouts.js';

const n = completeCount(rw30.years);
const byYear = rw30.by_year.slice(0, n);

describe('waffle', () => {
  it('draws one square per 1,000 documents, 1996–2025', () => {
    const total = byYear.reduce((a, b) => a + b, 0);
    expect(waffle(byYear, 300)).toHaveLength(Math.round(total / 1000));
    expect(waffle(byYear, 300)).toHaveLength(1122);
  });

  it('stacks every column from the baseline', () => {
    const sq = waffle(byYear, 300);
    for (const s of sq) expect(s.y).toBeLessThan(300);
    expect(Math.max(...sq.map((s) => s.y))).toBeGreaterThan(290);
  });
});

describe('categoryCuts', () => {
  const counts = rw30.format_year.map((f) => f.values.slice(0, n));
  const squares = squareCounts(byYear);
  const cuts = categoryCuts(counts, squares);

  it('ends every year at its column height', () => {
    cuts.forEach((c, yi) => expect(c[c.length - 1]).toBe(squares[yi]));
  });

  it('never runs backwards', () => {
    for (const c of cuts) for (let i = 1; i < c.length; i++) expect(c[i]).toBeGreaterThanOrEqual(c[i - 1]);
  });

  it('gives every square a category', () => {
    const c = cuts[29];
    for (let k = 0; k < squares[29]; k++) {
      const cat = categoryAt(c, k);
      expect(cat).toBeGreaterThanOrEqual(0);
      expect(cat).toBeLessThan(counts.length);
    }
  });
});

describe('packed', () => {
  it('keeps every point inside its radius, to the rounding', () => {
    for (const p of packed(3583, 0, 0, 200)) expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(200.1);
  });
});

describe('swarm filter', () => {
  const kept = cs.crises.filter(inRange);
  it('keeps onsets from 1996 to the end of 2025 only', () => {
    expect(kept.length).toBeLessThan(cs.crises.length);
    for (const c of kept) {
      expect(c[4]).toBeGreaterThanOrEqual(1996);
      expect(c[4]).toBeLessThan(2026);
    }
    expect(cs.crises.some((c) => c[4] >= 2025 && c[4] < 2026 && !inRange(c))).toBe(false);
  });
  it('places every kept onset inside the axis', () => {
    for (const c of kept) {
      expect(swarmY(c[4])).toBeGreaterThanOrEqual(swarmY(1996));
      expect(swarmY(c[4])).toBeLessThan(swarmY(2026));
    }
  });
});

describe('halfCount', () => {
  it('is the fewest that reach half', () => {
    expect(halfCount([50, 30, 20])).toBe(1);
    expect(halfCount([40, 30, 30])).toBe(2);
    expect(halfCount([1, 1, 1, 1])).toBe(2);
  });
  it('is recomputed over the filtered disasters, not the catalog', () => {
    const docs = cs.crises.filter(inRange).map((c) => c[0]);
    const k = halfCount(docs);
    const sorted = [...docs].sort((a, b) => b - a);
    const total = docs.reduce((a, b) => a + b, 0);
    const sum = (n) => sorted.slice(0, n).reduce((a, b) => a + b, 0);
    expect(2 * sum(k)).toBeGreaterThanOrEqual(total);
    expect(2 * sum(k - 1)).toBeLessThan(total);
  });
});

describe('worldPaths', () => {
  const map = worldPaths(topo);
  it('draws one path per ISO3', () => {
    const isos = map.paths.map((p) => p.iso3);
    expect(new Set(isos).size).toBe(isos.length);
    expect(map.paths.length).toBeGreaterThan(200);
  });
  it('has a path for every country with documents, bar the hand-placed islands', () => {
    const drawn = new Set(map.paths.map((p) => p.iso3));
    const missing = dots.countries.filter((c) => c.docs > 0 && !drawn.has(c.iso3)).map((c) => c.iso3);
    expect(missing.filter((i) => !['GLI', 'CAI', 'MDR', 'EAI'].includes(i))).toEqual([]);
  });
  it('fits the width, at the cropped Mercator aspect (56°S–75°N)', () => {
    expect(map.W).toBe(MAP_W);
    expect(map.W / map.H).toBeGreaterThan(1.8);
    expect(map.W / map.H).toBeLessThan(2.1);
  });
  it('leaves out Antarctica', () => {
    expect(map.paths.some((p) => p.iso3 === 'ATA')).toBe(false);
  });
});

describe('shareClass', () => {
  it('bins shares into five classes', () => {
    expect([0, 0.49, 0.5, 0.7, 1, 3, 5, 15].map(shareClass)).toEqual([0, 0, 1, 1, 2, 3, 4, 4]);
  });
});
