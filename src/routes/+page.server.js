import cs from '$lib/data/crisis_swarm.json';
import { swarm, yearRowY, sizedR, round1, inRange, SW_R, SW_MID, SW_ROW } from '$lib/story/layouts.js';

// The two chapter 2 swarms, computed once at build time: thousands of nodes take
// over a second, too long to spend in a reader's browser mid-scroll. Only
// disasters with onset in 1996–2025 are drawn. Shipped as flat
// [x0, y0, x1, y1, ...] arrays, in crisis_swarm.json's order after the filter.
const flat = (pts) => pts.flatMap((p) => [round1(p.x), round1(p.y)]);

export function load() {
  const crises = cs.crises.filter(inRange);
  const max = Math.max(...crises.map((c) => c[0]));
  const at = crises.map((c) => yearRowY(c[4]));
  return {
    swarm: {
      uniform: flat(swarm(at.map((ty) => ({ ty, r: SW_R })), SW_MID, 160, SW_ROW)),
      sized: flat(swarm(crises.map((c, i) => ({ ty: at[i], r: sizedR(c[0], max) })), SW_MID, 160, SW_ROW))
    }
  };
}
