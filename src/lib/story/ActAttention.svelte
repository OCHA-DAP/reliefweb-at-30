<script>
  import { onMount } from 'svelte';
  import cs from '$lib/data/crisis_swarm.json';
  import peaks from '$lib/data/epidemic_peaks.json';
  import { fmt } from '$lib/chart.js';
  import SmallMultiples from '$lib/components/SmallMultiples.svelte';
  import { crisisGroups, complete, monthLabels, shortK } from '$lib/components/CrisisShapeFigure.svelte';
  import Scrolly from './Scrolly.svelte';
  import Step from './Step.svelte';
  import { packed, round1, swarmY, yearRowY, sizedR, inRange, halfCount, SW_W, SW_H, SW_R, SW_AXIS, SW_ROW, SW_MID, SW_FIRST, SW_LAST } from './layouts.js';

  // Chapter 2: one dot per disaster ReliefWeb has tagged documents to, onset
  // 1996–2025. The swarms are computed at build time over the same filter and
  // arrive as `layouts`; the spiral is cheap and is computed here.
  let { layouts } = $props();

  // A phone pins the graphic over half the screen: panels as tall as half the
  // screen allows, so both rows fit. Otherwise as tall as the screen allows, up to 130px: two rows of
  // panels plus up to 330px of titles, headings, axes and source.
  let panelH = $state(130);
  let phone = $state(false);
  onMount(() => {
    const size = () => {
      phone = matchMedia('(max-width: 699px)').matches;
      panelH = phone
        ? Math.max(54, Math.min(100, Math.floor((innerHeight / 2 - 190) / 2)))
        : Math.max(60, Math.min(130, Math.floor((innerHeight - 330) / 2)));
    };
    size();
    addEventListener('resize', size);
    return () => removeEventListener('resize', size);
  });

  const crises = cs.crises.filter(inRange);
  const n = crises.length;
  const max = Math.max(...crises.map((c) => c[0]));

  const at = (flat, i) => [flat[2 * i], flat[2 * i + 1]];
  const spiral = packed(n, SW_W / 2, SW_H / 2, 170);

  // The five commonest disaster types by number of crises, then the rest.
  const typeCount = new Map();
  for (const c of crises) typeCount.set(c[2], (typeCount.get(c[2]) ?? 0) + 1);
  const topTypes = [...typeCount].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  // Brand hues at full brightness: the dots carry no text.
  const TYPE_COLOURS = ['var(--b4)', 'var(--a-orange)', 'var(--a-purple)', 'var(--a-green)', 'var(--a-red)', '#AEA29A'];
  const typeSlot = (t) => (topTypes.includes(t) ? topTypes.indexOf(t) : 5);
  const TYPE_LABEL = { 'Flood': 'Floods', 'Tropical Cyclone': 'Tropical cyclones', 'Earthquake': 'Earthquakes', 'Flash Flood': 'Flash floods', 'Epidemic': 'Epidemics' };
  const typeLegend = [...topTypes.map((t) => TYPE_LABEL[cs.types[t]] ?? cs.types[t]), 'Other types'];
  const floodType = cs.types.indexOf('Flood');
  const nFlood = typeCount.get(floodType);
  const nextThree = topTypes.slice(1, 4).reduce((a, t) => a + typeCount.get(t), 0);

  // Half of all the documents, over the disasters drawn here.
  const half = halfCount(crises.map((c) => c[0]));
  // The busiest year.
  const perYear = new Map();
  for (const c of crises) perYear.set(Math.floor(c[4]), (perYear.get(Math.floor(c[4])) ?? 0) + 1);
  const [busiestYear, busiest] = [...perYear].sort((a, b) => b[1] - a[1])[0];

  // The coverage curves, as small multiples: only crises with all 24 months,
  // since the chapter stops at 2025.
  // Three sudden disasters against three epidemics. Each curve takes its dot's
  // color, so the panels read as the dots they came from.
  const PANELS = [
    ['Sudden onset', ['South Asia: Earthquake and Tsunami - Dec 2004', 'Haiti: Earthquakes - Jan 2010', 'Typhoon Haiyan - Nov 2013']],
    ['Epidemics', ['West Africa: Ebola Outbreak - Mar 2014', 'DR Congo: Ebola Outbreak - Aug 2018', 'Nigeria: Yellow Fever Outbreak - Sep 2017']]
  ];
  const byName = new Map(crises.map((c) => [c[3], c]));
  const allPanels = new Map(crisisGroups(complete, { brief: true }).flatMap((g) => g.panels).map((p) => [p.key, p]));
  const groups = PANELS.map(([label, keys]) => ({
    label,
    panels: keys.map((k) => ({ ...allPanels.get(k), color: TYPE_COLOURS[typeSlot(byName.get(k)[2])] }))
  }));


  const VIEWS = [
    { layout: 'packed', colour: 'none', sized: false },
    // Colored by type as the dots move onto the timeline, so the flood step that
    // follows picks floods out of a mix the reader has already seen.
    { layout: 'timeline', colour: 'type', sized: false },
    { layout: 'timeline', colour: 'type', sized: false, focusType: floodType },
    // The disasters holding half of all documents at full color, the rest faded.
    { layout: 'timeline', colour: 'type', sized: true, focusHead: true }
  ];
  let step = $state(0);
  const view = $derived(VIEWS[Math.min(step, VIEWS.length - 1)]);

  const pos = (i, v) => {
    if (v.layout === 'packed') return [spiral[i].x, spiral[i].y];
    return at(v.sized ? layouts.sized : layouts.uniform, i);
  };
  const radius = (c, v) => (v.sized ? round1(sizedR(c[0], max)) : SW_R);
  const colour = (c, i, v) => {
    if (v.colour === 'type') return TYPE_COLOURS[typeSlot(c[2])];
    return 'var(--b4)';
  };
  // crisis_swarm lists disasters by documents, most first, so the first `half`
  // are the ones holding half of all documents.
  const dim = (c, i, v) =>
    (v.focusType != null && c[2] !== v.focusType) ||
    (v.focusHead && i >= half)
      ? 0.15
      : 1;

  // The five disasters with the most documents, named on the sizing step. Each
  // label sits level with its dot, out to the side it is on, on a straight
  // horizontal leader to a fixed column.
  const BIG_NAME = {
    'Sahel Crisis: 2011-2017': 'Sahel crisis',
    'South Asia: Earthquake and Tsunami - Dec 2004': 'Indian Ocean tsunami',
    'Somalia: Drought - 2015-2026': 'Somalia drought',
    'Haiti: Earthquakes - Jan 2010': 'Haiti earthquake',
    'West Africa: Ebola Outbreak - Mar 2014': 'West Africa Ebola'
  };
  // On a phone, where the chart is narrow, each name stands a short leader off
  // its own dot instead of at the shared column, which would push the longest
  // ones into the year labels. The tsunami does so everywhere: its dot sits
  // apart from the others, so it needs no column to line up with.
  const SHORT_LEAD = 30;
  const OWN_LEAD = new Set(['South Asia: Earthquake and Tsunami - Dec 2004']);
  const shortDocs = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
  const BIG_COL = { left: SW_AXIS + 162, right: SW_W - 165 };
  const big = $derived(
    crises.slice(0, 5).map((c, i) => {
      const [x, y] = at(layouts.sized, i);
      const r = sizedR(c[0], max);
      const left = x < SW_MID;
      return {
        key: c[3],
        x,
        y,
        x0: left ? x - r : x + r,
        col:
          phone || OWN_LEAD.has(c[3])
            ? left ? x - r - SHORT_LEAD : x + r + SHORT_LEAD
            : left ? BIG_COL.left : BIG_COL.right,
        left,
        name: BIG_NAME[c[3]] ?? c[3].split(':')[0],
        detail: `${Math.floor(c[4])}, ${shortDocs(c[0])} docs`
      };
    })
  );

  // One row per year, every other one shaded so a dot's year can be read off;
  // 1996 and every fifth year labeled in black, as the documents chart in
  // chapter 1 is, the years between in light gray (dropped on a phone).
  const yearsAll = Array.from({ length: SW_LAST - SW_FIRST + 1 }, (_, k) => SW_FIRST + k);

  // The dots fade in the first time the chapter's first step text is about to
  // come up the screen, so the circle beside it, whose top is already in view,
  // is there before the words. On a phone the chart pins at the top while the
  // text comes up far below it, so there the chart itself coming into view is
  // the cue. The prerendered page draws them; they are hidden
  // on load (the chapter starts below the fold) unless the reader asks for
  // reduced motion.
  let swarmEl = $state();
  let shown = $state(true);
  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = matchMedia('(max-width: 699px)').matches;
    const cue = narrow ? swarmEl : document.querySelector('#a2-s0 p');
    // Due once the cue's top is within reach of the screen, or anywhere above it:
    // a fast scroll or a link to a later step can jump past it entirely.
    const due = () => {
      const top = cue.getBoundingClientRect().top;
      return narrow ? top < innerHeight * 0.7 : top < innerHeight + 120;
    };
    if (due()) return;
    shown = false;
    const check = () => {
      if (!due()) return;
      shown = true;
      removeEventListener('scroll', check);
    };
    addEventListener('scroll', check, { passive: true });
    return () => removeEventListener('scroll', check);
  });
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
</script>

<section class="act" id="disasters" aria-labelledby="h-a2">
  <header class="ahead">
    <p class="anum">Chapter 2</p>
    <h2 id="h-a2">How disasters are covered</h2>
  </header>

  <Scrolly id="a2" bind:step>
    {#snippet graphic()}
      <div class="swarmwrap">
        <svg
          bind:this={swarmEl}
          class="swarm"
          viewBox="0 0 {SW_W} {SW_H}"
          width="100%"
          role="img"
          aria-label="One dot for each of the {fmt(n)} disasters ReliefWeb has tagged documents to that began between {SW_FIRST} and {SW_LAST}."
        >
          <g class="axis" class:on={view.layout === 'timeline'}>
            {#each yearsAll as t (t)}
              {#if (t - SW_FIRST) % 2 === 1}
                <rect class="band" x={SW_AXIS} y={swarmY(t)} width={SW_W - SW_AXIS} height={SW_ROW} />
              {/if}
              <text class="tick" class:minor={t % 5 !== 0 && t !== SW_FIRST} x={SW_AXIS - 8} y={yearRowY(t) + 4} text-anchor="end">{t}</text>
            {/each}
          </g>
          {#each crises as c, i (i)}
            {@const [x, y] = pos(i, view)}
            <circle
              class="dot"
              r="1"
              style="transform:translate({x}px,{y}px) scale({radius(c, view)}); fill:{colour(c, i, view)}; opacity:{shown ? dim(c, i, view) : 0}"
            >{#if i < half}<title>{c[3]}: {fmt(c[0])} documents</title>{/if}</circle>
          {/each}
          {#each big as b (b.key)}
            <g class="biglab" class:on={view.focusHead}>
              <path d="M{b.x0},{b.y}H{b.col}" />
              <text x={b.left ? b.col - 4 : b.col + 4} y={b.y - 3} text-anchor={b.left ? 'end' : 'start'}>
                <tspan class="bname">{b.name}</tspan><tspan x={b.left ? b.col - 4 : b.col + 4} dy="1.15em">{b.detail}</tspan>
              </text>
            </g>
          {/each}
        </svg>
        <p class="rownote" class:on={view.layout === 'timeline'}>
          Each row is one year. The wider the row, the more disasters began that year.
        </p>
        <div class="legend key" class:on={view.colour === 'type'} aria-hidden={view.colour !== 'type'}>
          {#each typeLegend as l, i (l)}
            <span class="lg"><i style="background:{TYPE_COLOURS[i]}; border-radius:50%"></i>{l}</span>
          {/each}
        </div>
        <p class="source"><span>Source</span>ReliefWeb API</p>
      </div>
    {/snippet}

    <Step id="a2-s0" i={0}>
      ReliefWeb has tagged documents to {fmt(n)} disasters. Each dot represents a disaster that began between
      {SW_FIRST} and {SW_LAST}.
    </Step>
    <Step id="a2-s1" i={1}>
      Lined up by the year each disaster began and colored by disaster type, the dots cluster more densely after 2005,
      with the most in one year, {busiest}, in {busiestYear}.
    </Step>
    <Step id="a2-s2" i={2}>
      Floods are the most common type of disaster: {fmt(nFlood)} in all{nFlood > nextThree && topTypes[0] === floodType
        ? ', occurring more frequently than the next three types of disaster combined'
        : ''}.
    </Step>
    <Step id="a2-s3" i={3}>
      Sized by the number of documents about each disaster, a few dots stand out. The {fmt(half)} disasters at full color hold
      half of all documents; the other {fmt(n - half)} disasters share the other half.
    </Step>
  </Scrolly>

  <!-- The small multiples follow as a pinned graphic of their own, so they
       scroll in under the dots and push them up. -->
  <Scrolly id="a2c">
    {#snippet graphic()}
      <div class="html">
        <p class="ptitle">Number of documents published in the first 24 months of a disaster</p>
        <p class="psub">Each chart is on its own scale.</p>
        <SmallMultiples {groups} labels={monthLabels} format={shortK} xTicks={['0', '12', '23']} min="160px" gutter={26} height={panelH} />
        <p class="source"><span>Source</span>ReliefWeb API</p>
      </div>
    {/snippet}

    <Step id="a2-s4" i={0}>
      The total number of documents says how much was written about a disaster, but not when. Counted month by month
      over the first 24 months, the documents about three sudden disasters and three epidemics show how coverage
      rises and falls.
    </Step>
    <Step id="a2-s5" i={1}>
      Coverage of a sudden disaster like an earthquake or storm peaks within a month of onset. Epidemics like Ebola
      usually build more slowly. Though some peak in the first month, coverage of epidemics typically peaks around
      month {NUM[peaks.median_peak] ?? peaks.median_peak}.
    </Step>
  </Scrolly>
</section>

<style>
  /* Clear air between the dots and the small multiples, so the second chart is
     seen to start as the first leaves. */
  :global(#a2c) {
    margin-top: 120px;
  }
  /* Colors change at once: fading the fill of over a thousand circles stalls
     the browser for most of a second, so the dots would sit still while they
     should be moving. */
  .dot {
    transition:
      transform 0.8s cubic-bezier(0.2, 0, 0, 1),
      opacity 0.9s;
  }
  .axis,
  .key {
    transition: opacity 0.5s;
  }
  .axis,
  .key {
    opacity: 0;
  }
  .axis.on,
  .key.on {
    opacity: 1;
  }
  .swarm .tick {
    font-size: 12px;
  }
  .band {
    fill: #f2f2f2;
  }
  .swarm .tick.minor {
    fill: #a6a6a6;
  }
  .biglab {
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }
  .biglab.on {
    opacity: 1;
    transition-delay: 0.8s;
  }
  .biglab path {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }
  .biglab text {
    font-size: 12px;
    fill: var(--ink);
    paint-order: stroke;
    stroke: #fff;
    stroke-width: 3px;
    stroke-linejoin: round;
  }
  .biglab .bname {
    font-weight: 700;
  }
  .rownote {
    margin: 6px 0 0;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.5s;
  }
  .rownote.on {
    opacity: 1;
  }
  /* The vertical timeline gives way on a short screen, so its legend and source
     stay inside the pinned graphic. */
  .swarm {
    max-height: min(100svh - 160px, 640px);
  }
  .swarmwrap,
  .html {
    min-width: 0;
  }
  /* Title and subtitle sized like the story's figure cards. */
  .ptitle {
    margin: 0 0 6px;
    font-size: 19px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.005em;
  }
  .psub {
    margin: 0 0 12px;
    font-size: 12.5px;
    color: var(--muted);
  }
  /* Three panels a row even in the narrow sticky column. */
  .html :global(.sm:has(.grp)) {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 6px 12px;
  }
  /* Room between a group's rule and its panels. */
  .html :global(.grp) {
    margin-bottom: 4px;
  }
  .key {
    min-height: 44px;
  }
  .source {
    margin-top: 8px;
  }
  @media (max-width: 699px) {
    :global(#a2c) {
      margin-top: 64px;
    }
    .key {
      gap: 2px 10px;
      min-height: 0;
    }
    .key :global(.lg) {
      font-size: 11px;
    }
    .swarm .tick {
      font-size: 24px;
    }
    .swarm .tick.minor {
      display: none;
    }
    .biglab text {
      font-size: 17px;
      stroke-width: 4px;
    }
    .rownote {
      font-size: 10.5px;
      margin-top: 2px;
    }
    /* Half the screen less the row note, a two-line key and the source. */
    .swarm {
      max-height: calc(50svh - 160px);
    }
    .ptitle {
      font-size: 14px;
      margin-bottom: 2px;
    }
    .psub {
      font-size: 11px;
      margin-bottom: 4px;
    }
    /* No room for group headings in half a phone screen. */
    .html :global(.grp) {
      display: none;
    }
    .html :global(.panel .ptitle) {
      font-size: 11px;
      line-height: 1.25;
    }
  }
</style>
