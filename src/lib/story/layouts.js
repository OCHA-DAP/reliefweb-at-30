import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

// Positions for the three sticky graphics in the story. Pure functions of the data,
// so the prerendered page and the browser compute the same layout: d3-force
// seeds its own random source, which makes a simulation deterministic.

// Positions are written into every mark's inline style, so a tenth of a pixel
// is plenty and keeps the prerendered page small.
export const round1 = (v) => Math.round(v * 10) / 10;

// ---- Chapter 1: the archive as a waffle ---------------------------------------------
// One square per 1,000 documents, one column per year, stacked from the baseline,
// COLS squares across. Squares per year are rounded on the running total, so they
// sum to the rounded total rather than drifting by one per year.
export const UNIT = 1000;
export const SQ = 6;
export const GAP = 1.5;
export const PITCH = SQ + GAP;
export const COLS = 2;
export const COL_GAP = 4;
export const COL_W = COLS * PITCH + COL_GAP;

export function squareCounts(byYear) {
  let cum = 0;
  return byYear.map((v) => {
    const before = Math.round(cum / UNIT);
    cum += v;
    return Math.round(cum / UNIT) - before;
  });
}

export function waffle(byYear, baseline) {
  const out = [];
  squareCounts(byYear).forEach((n, yi) => {
    for (let k = 0; k < n; k++) {
      out.push({
        yi,
        k,
        x: yi * COL_W + (k % COLS) * PITCH,
        y: baseline - (Math.floor(k / COLS) + 1) * PITCH + GAP
      });
    }
  });
  return out;
}

// Per year, the square index at which each category starts, plus the column
// height at the end: square k of year yi takes category c when
// cuts[yi][c] <= k < cuts[yi][c + 1]. Counts are shares of the categories' own
// sum, so documents with no category do not leave a gap at the top.
export function categoryCuts(countsByCategory, squaresPerYear) {
  return squaresPerYear.map((n, yi) => {
    const vals = countsByCategory.map((c) => c[yi]);
    const total = vals.reduce((a, b) => a + b, 0);
    const cuts = [0];
    let cum = 0;
    for (const v of vals) {
      cum += v;
      cuts.push(total ? Math.round((cum / total) * n) : n);
    }
    return cuts;
  });
}

export function categoryAt(cuts, k) {
  for (let c = 0; c < cuts.length - 1; c++) if (k < cuts[c + 1]) return c;
  return cuts.length - 2;
}

// ---- Chapter 2: one dot per disaster -------------------------------------------------
// A sunflower spiral: dense, round, and needs no simulation, so it is what the
// prerendered page paints before the swarm is computed.
export function packed(n, cx, cy, radius) {
  const c = radius / Math.sqrt(n);
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => ({
    x: round1(cx + c * Math.sqrt(i + 0.5) * Math.cos(i * golden)),
    y: round1(cy + c * Math.sqrt(i + 0.5) * Math.sin(i * golden))
  }));
}

// The timeline runs down the page, 1996 at the top: the pinned graphic is taller
// than it is wide, and a vertical timeline lets each year's disasters spread
// across the width. Disasters whose onset falls in 1996–2025, ReliefWeb's
// complete years, on one scale. Onsets are fractional years (2004.92), so a
// disaster that began in 2025 is anything below 2026.
export const SW_W = 600;
export const SW_H = 640;
export const SW_FIRST = 1996;
export const SW_LAST = 2025;
// Year labels sit left of the axis; the dots spread around the middle of the rest.
export const SW_AXIS = 48;
export const SW_MID = SW_AXIS + (SW_W - SW_AXIS) / 2;
const TIME = [14, SW_H - 14];
export const inRange = (c) => c[4] >= SW_FIRST && c[4] < SW_LAST + 1;
export function swarmY(onset) {
  return TIME[0] + ((onset - SW_FIRST) / (SW_LAST + 1 - SW_FIRST)) * (TIME[1] - TIME[0]);
}
// Each year is a row: a disaster sits on the middle of its onset year's row.
export const SW_ROW = (TIME[1] - TIME[0]) / (SW_LAST + 1 - SW_FIRST);
export const yearRowY = (onset) => swarmY(Math.floor(onset) + 0.5);

// The fewest disasters that together hold at least half of all the documents.
export function halfCount(docs) {
  const sorted = [...docs].sort((a, b) => b - a);
  const total = sorted.reduce((a, b) => a + b, 0);
  let cum = 0;
  for (let k = 0; k < sorted.length; k++) {
    cum += sorted[k];
    if (2 * cum >= total) return k + 1;
  }
  return sorted.length;
}

// Beeswarm: each node pulled to its own y (its year's row), loosely to the
// middle line, and kept apart by its radius. After every tick a node is held
// inside its row (`band` tall), so a crowded year spreads sideways rather than
// into the next year: the row's width is then the year's count. A dot bigger
// than the row stays centred on it. Thousands of nodes take over a second, so
// The story runs this at build time (+page.server.js) rather than in the reader's
// browser.
export function swarm(nodes, mid, ticks = 160, band = Infinity) {
  const sim = forceSimulation(nodes.map((d) => ({ ty: d.ty, r: d.r, x: mid, y: d.ty })))
    .force('y', forceY((d) => d.ty).strength(0.9))
    .force('x', forceX(mid).strength(0.05))
    .force('collide', forceCollide((d) => d.r + 0.6))
    .stop();
  for (let k = 0; k < ticks; k++) {
    sim.tick();
    for (const d of sim.nodes()) {
      const room = Math.max(0, band / 2 - d.r);
      if (d.y > d.ty + room) (d.y = d.ty + room), (d.vy = 0);
      if (d.y < d.ty - room) (d.y = d.ty - room), (d.vy = 0);
    }
  }
  return sim.nodes().map((d) => ({ x: d.x, y: d.y }));
}

// ---- Chapter 3: choropleth -------------------------------------------------------
// One path per ISO3 from the fieldmaps adm0 TopoJSON (world_geo.py), on Web
// Mercator, the projection readers know from ReliefWeb, HDX and every web map.
// The frame is cropped to where the countries are, 56°S–75°N: the far Arctic
// (Svalbard, northern Greenland, the Canadian and Russian Arctic islands) is cut,
// so the poles do not balloon and the countries fill the frame, and Antarctica
// is dropped (nothing is filed under it, and no one reads from it). The map is
// fitted to that box, so its height follows from the width. Features sharing a
// code (West Bank and Gaza) join into one path.
export const MAP_W = 960;
const LAT = [-56, 75];

// d3-geo reads rings clockwise, GeoJSON writes them anticlockwise; a ring read
// the wrong way round covers the rest of the globe, so it is turned over.
function rewind(f) {
  const g = f.geometry;
  for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    if (geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI) for (const ring of poly) ring.reverse();
  }
  return f;
}

export function worldPaths(topo, W = MAP_W) {
  const land = feature(topo, topo.objects.countries);
  land.features = land.features.filter((f) => f.geometry && f.properties.iso3 !== 'ATA').map(rewind);
  const box = { type: 'MultiPoint', coordinates: [[-180, LAT[0]], [180, LAT[1]]] };
  const proj = geoMercator().fitWidth(W, box);
  const H = Math.ceil(proj([0, LAT[0]])[1]);
  proj.clipExtent([[0, 0], [W, H]]);
  const path = geoPath(proj).digits(1);
  const byIso = new Map();
  for (const f of land.features) {
    const d = path(f);
    if (d) byIso.set(f.properties.iso3, (byIso.get(f.properties.iso3) ?? '') + d);
  }
  return {
    paths: [...byIso].map(([iso3, d]) => ({ iso3, d })),
    proj,
    W,
    H
  };
}

// Five classes of share (%), for both maps, so the morph is a change of fill on
// the same scale.
export const SHARE_BREAKS = [0.5, 1, 2, 5];
export const shareClass = (v) => SHARE_BREAKS.filter((b) => v >= b).length;

// Sized dots: area by documents, the largest crisis at SW_RMAX.
export const SW_RMAX = 23;
export const sizedR = (docs, max) => Math.max(1.6, SW_RMAX * Math.sqrt(docs / max));
export const SW_R = 2.6;
