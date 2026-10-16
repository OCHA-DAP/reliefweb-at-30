<script>
  import { fade, fly } from 'svelte/transition';
  import rw30 from '$lib/data/rw30.json';
  import crisis from '$lib/data/crisis.json';
  import { fmt, completeCount } from '$lib/chart.js';
  import OrgsByTypeFigure, { ngoFacts } from '$lib/components/OrgsByTypeFigure.svelte';
  import TermShiftFigure from '$lib/components/TermShiftFigure.svelte';
  import { BODY_WORDS } from '$lib/vocab.js';
  import Scrolly from './Scrolly.svelte';
  import Step from './Step.svelte';
  import { waffle, squareCounts, categoryCuts, categoryAt, PITCH, COL_W, COLS, SQ } from './layouts.js';

  // Chapter 1: thirty years of documents as squares, one per thousand, one column a
  // year. The squares never move; each step changes only what is filled and how
  // it is colored.
  const N = completeCount(rw30.years);
  const years = rw30.years.slice(0, N).map(Number);
  const byYear = rw30.by_year.slice(0, N);
  const yi = (y) => years.indexOf(y);
  const pct = (a, b) => Math.round((100 * a) / b);

  // Labels sit in a band above the tallest column, on two tiers, with a leader
  // down to the column they name.
  const BASE = 300;
  const TIER = [12, 30];
  const W = (N - 1) * COL_W + COLS * PITCH;
  const H = BASE + 22;
  const squares = waffle(byYear, BASE);
  const perYear = squareCounts(byYear);
  const top = (i) => BASE - Math.ceil(perYear[i] / COLS) * PITCH;
  const colX = (i) => i * COL_W + (COLS * PITCH - 1.5) / 2;

  // Formats: five named, the rest as Other, in the brand hues at full
  // brightness (they are not ordered, so not the ramp; the squares carry no text).
  const fmts = rw30.format_year.slice(0, 5);
  const fmtOther = byYear.map((t, i) => t - fmts.reduce((a, f) => a + f.values[i], 0));
  const FORMAT = {
    labels: [...fmts.map((f) => f.label), 'Other formats'],
    colors: ['var(--b4)', 'var(--a-orange)', 'var(--a-purple)', 'var(--a-green)', 'var(--a-red)', '#AEA29A'],
    cuts: categoryCuts([...fmts.map((f) => f.values.slice(0, N)), fmtOther], perYear)
  };
  const info = rw30.format_year.find((f) => f.label === 'Infographic').values;
  const total = byYear.reduce((a, b) => a + b, 0);
  const newsAll = rw30.format_year.find((f) => f.label === 'News and Press Release').values.slice(0, N).reduce((a, b) => a + b, 0);
  const infoIdx = fmts.findIndex((f) => f.label === 'Infographic');
  // The year infographics took hold: the first with over a hundred. A few
  // dozen appear earlier, the first in 1999.
  const infoFrom = years[info.findIndex((v) => v >= 100)];

  // Publisher types, in the colors OrgsByTypeFigure gives them just below, so a
  // type looks the same throughout the chapter. Media is drawn, in gray and
  // last, so the column keeps its height, but every share quoted leaves it out:
  // ReliefWeb no longer carrying it would on its own lift everyone else's share.
  const ORDER = [
    'International Organization',
    'Non-governmental Organization',
    'Government',
    'Red Cross/Red Crescent Movement',
    'Academic and Research Institution',
    'Media'
  ];
  const types = ORDER.map((l) => rw30.source_type.find((s) => s.label === l));
  const SHORT = {
    'International Organization': 'UN and international organizations',
    'Non-governmental Organization': 'NGOs',
    'Government': 'Governments',
    'Red Cross/Red Crescent Movement': 'Red Cross and Red Crescent',
    'Academic and Research Institution': 'Academic and research',
    'Media': 'Media'
  };
  const SOURCE = {
    labels: ORDER.map((l) => SHORT[l]),
    colors: ['var(--b4)', 'var(--a-orange)', 'var(--a-purple)', 'var(--a-green)', 'var(--a-slate)', '#D4D4D4'],
    cuts: categoryCuts(types.map((t) => t.values.slice(0, N)), perYear)
  };
  const media = types[5].values;
  const ioShare = (i) => pct(types[0].values[i], types.slice(0, 5).reduce((a, t) => a + t.values[i], 0));
  // The year ReliefWeb stopped republishing media organizations: the first in which media
  // fell below a tenth of its own peak.
  const mediaPeak = Math.max(...media.slice(0, N));
  const mediaGone = years[media.findIndex((v, i) => i < N && i > media.indexOf(mediaPeak) && v < mediaPeak / 10)];

  const peakI = byYear.indexOf(Math.max(...byYear));

  // The two biggest year-on-year jumps before the peak, 2005 and 2014, each
  // labeled with the disaster that drew the most of that year's documents.
  // Documents about a disaster in a calendar year, from its monthly curve.
  const docsIn = (name, year) => {
    const c = crisis.curves.find((x) => x.name === name);
    const start = +c.onset.slice(0, 4) * 12 + +c.onset.slice(5, 7) - 1;
    return c.series.reduce((a, v, i) => a + (Math.floor((start + i) / 12) === year ? v : 0), 0);
  };
  const tsunami2005 = docsIn('South Asia: Earthquake and Tsunami - Dec 2004', 2005);
  const ebola2014 = docsIn('West Africa: Ebola Outbreak - Mar 2014', 2014);
  const last = N - 1;

  // Squares recolor column by column, SWEEP ms apart, each over RECOLOR ms; a
  // step's annotations wait for the squares they name: while columns fill, each
  // label waits for its own column; when the chart recolors, for the whole sweep.
  const SWEEP = 30;
  const RECOLOR = 600;
  const markAfter = (v, m) => (v.colour === 'none' ? yi(m.y) : N - 1) * SWEEP + RECOLOR;

  // The first format step fills the last columns as it recolors them, left
  // to right, so the years after the peak arrive with their colors.
  const VIEWS = [
    { upto: 1996, colour: 'none', marks: [] },
    { upto: 2005, colour: 'none', marks: [{ y: 2005, t: 'Indian Ocean Tsunami, Dec 2004' }] },
    { upto: 2014, colour: 'none', marks: [{ y: 2014, t: 'West Africa Ebola, 2014' }] },
    { upto: years[peakI], colour: 'none', marks: [{ y: years[peakI], t: `Publishing peak, ${years[peakI]}` }] },
    { upto: years[last], colour: 'format', marks: [] },
    { upto: years[last], colour: 'format', focusCat: infoIdx, marks: [] },
    {
      upto: years[last],
      colour: 'source',
      marks: [{ y: mediaGone, t: `ReliefWeb stopped republishing media content, ${mediaGone}` }]
    }
  ];
  let step = $state(0);

  // Annotation labels are left-aligned at their leader; one that would run past
  // the chart's right edge slides left until it fits, with its leader still
  // meeting it from below. Widths are measured in the browser, once laid out and
  // again once the web font loads (the label size also changes on a phone).
  let markW = $state({});
  const measure = (key) => (node) => {
    const f = () => (markW[key] = node.getComputedTextLength());
    requestAnimationFrame(f);
    document.fonts?.ready.then(f);
    addEventListener('resize', f);
    return () => removeEventListener('resize', f);
  };
  const markX = (i, t) => Math.min(colX(i) - 0.5, W - (markW[t] ?? 0));
  const view = $derived(VIEWS[Math.min(step, VIEWS.length - 1)]);
  const scheme = $derived(view.colour === 'format' ? FORMAT : view.colour === 'source' ? SOURCE : null);

  // What the colors mean, said above the chart; the old title fades out as the
  // new one slides in, so a change of coloring is noticed.
  const TITLE = {
    none: 'Documents published each year',
    format: 'Documents by format',
    source: 'Documents by who published them'
  };

  const fill = (s, v, sc) => {
    if (sc) return sc.colors[categoryAt(sc.cuts[s.yi], s.k)];
    return years[s.yi] <= v.upto ? 'var(--b4)' : 'var(--b7)';
  };
  // The words the figure below charts: its own terms plus the two later fallers.
  const TERM_EXTRA = ['reconstruction', 'victims'];

  // One category at full strength, the rest faded behind it.
  const dim = (s, v, sc) => (sc && v.focusCat != null && categoryAt(sc.cuts[s.yi], s.k) !== v.focusCat ? 0.2 : 1);
</script>

<section class="act" id="publishing" aria-labelledby="h-a1">
  <header class="ahead">
    <p class="anum">Chapter 1</p>
    <h2 id="h-a1">Thirty years of publishing</h2>
  </header>

  <Scrolly id="a1" bind:step source="ReliefWeb API, one square = 1,000 documents (reports and maps), 1996–2025">
    {#snippet graphic()}
      <div class="ctitle">
        {#key view.colour}
          <p in:fly={{ y: 8, duration: 400, delay: 150 }} out:fade={{ duration: 150 }}>{TITLE[view.colour]}</p>
        {/key}
      </div>
      <svg viewBox="-2 -4 {W + 4} {H + 4}" width="100%" role="img" aria-label="Documents published on ReliefWeb each year, 1996 to {years[last]}, one square per thousand.">
        {#each squares as s (s.yi * 1000 + s.k)}
          <rect
            class="sq"
            x={s.x}
            y={s.y}
            width={SQ}
            height={SQ}
            style="fill:{fill(s, view, scheme)}; opacity:{dim(s, view, scheme)}; transition-delay:{s.yi * SWEEP}ms"
          />
        {/each}
        {#each VIEWS.flatMap((v) => v.marks).filter((m, i, a) => a.findIndex((n) => n.t === m.t) === i) as m (m.t)}
          {@const i = yi(m.y)}
          {@const on = view.marks.some((n) => n.t === m.t)}
          <g class="mark" class:on style="transition-delay:{on ? markAfter(view, m) : 0}ms">
            <line class="leader-rule" x1={colX(i)} x2={colX(i)} y1={top(i) - 3} y2={TIER[m.tier ?? 0] + 4} />
            <text class="annot" x={markX(i, m.t)} y={TIER[m.tier ?? 0]} {@attach measure(m.t)}>{m.t}</text>
          </g>
        {/each}
        {#each years as y, i (y)}
          {#if y % 5 === 0 || i === 0}
            <text class="tick" x={i === 0 ? 0 : i === N - 1 ? W : colX(i)} y={BASE + 16} text-anchor={i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle'}>{y}</text>
          {/if}
        {/each}
      </svg>
      <div class="legend" class:on={scheme} aria-hidden={!scheme}>
        {#if scheme}
          {#each scheme.labels as l, i (l)}
            <span class="lg"><i style="background:{scheme.colors[i]}"></i>{l}</span>
          {/each}
        {/if}
      </div>
    {/snippet}

    <Step id="a1-s0" i={0}>
      ReliefWeb began in 1996 with {fmt(byYear[0])} documents. Each square here represents one thousand
      documents.
    </Step>
    <Step id="a1-s1" i={1}>
      The biggest jump came in 2005, with {fmt(byYear[yi(2005)])} documents published, up from
      {fmt(byYear[yi(2004)])} the year before. {fmt(tsunami2005)} of them were about the Indian Ocean tsunami of December 2004.
    </Step>
    <Step id="a1-s2" i={2}>
      The next jump came in 2014, the year of the West Africa Ebola outbreak: {fmt(byYear[yi(2014)])} documents, up
      from {fmt(byYear[yi(2013)])}. {fmt(ebola2014)} of them were about the outbreak.
    </Step>
    <Step id="a1-s3" i={3}>
      {years[peakI]} was the peak with {fmt(byYear[peakI])} documents published in one year. In {years[last]}, the
      rate of publishing slowed due to resource constraints on the ReliefWeb team.
    </Step>
    <Step id="a1-s4" i={4}>
      Over thirty years, news and press releases were the most common format, accounting for
      {pct(newsAll, total)} percent of all documents published on ReliefWeb.
    </Step>
    <Step id="a1-s5" i={5}>
      Infographics emerged as a growing format on ReliefWeb around {infoFrom}, and by {years[last]} accounted for
      {pct(info[last], byYear[last])} percent of documents published.
    </Step>
    <Step id="a1-s6" i={6}>
      <!-- TODO(reason): add why media organization content stopped once ReliefWeb confirms it
           (project-354-framework.md §05, §09 ask 2). -->
      Around {mediaGone}, ReliefWeb stopped republishing content from media organizations. Among the other sources
      published, UN agencies and other international organizations published {ioShare(0)} percent of documents in 1996
      and {ioShare(last)} percent in {years[last]}.
    </Step>
  </Scrolly>

  <div class="inflow">
    <p class="lede">
      UN agencies and other international organizations produce most of ReliefWeb's documents, but non-governmental
      organizations (NGOs) are the largest cohort of publishers. They have outnumbered every other type every year
      since {ngoFacts.since}, with {fmt(ngoFacts.count)} NGOs publishing in {ngoFacts.year}.
    </p>
    <OrgsByTypeFigure
      id="a1-orgs"
      num={null}
      title="NGOs are the largest group of publishing organizations on ReliefWeb"
      intro=""
      sub="Organizations publishing at least one document each year, by type, 1996–{years[last]}, labels show {years[last]}"
    />

    <h3 class="subhead">What the documents cover</h3>
    <p class="lede">
      A review of {BODY_WORDS} million words in the archive shows changing attitudes, priorities and terminology in
      the sector.
    </p>
    <TermShiftFigure id="a1-terms" num={null} plain editorial={false} scale={false} count={false} extra={TERM_EXTRA} intro="" />
  </div>
</section>

<style>
  .sq {
    transition:
      fill 0.6s,
      opacity 0.6s;
  }
  /* Sized like the story's figure titles and the chapter 3 map titles. The old
     and new titles share one cell while they cross. */
  .ctitle {
    display: grid;
    margin: 0 0 16px;
    font-size: 19px;
    line-height: 1.25;
    font-weight: 700;
  }
  .ctitle p {
    grid-area: 1 / 1;
    margin: 0;
  }
  .mark {
    opacity: 0;
    transition: opacity 0.4s;
  }
  .mark.on {
    opacity: 1;
  }
  .mark .annot {
    font-size: 12px;
    font-weight: 600;
  }
  .leader-rule {
    stroke: var(--ink);
    stroke-width: 1;
  }
  .legend {
    min-height: 44px;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .legend.on {
    opacity: 1;
  }
  @media (max-width: 699px) {
    .ctitle {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .legend {
      gap: 2px 10px;
      margin-top: 6px;
      min-height: 0;
    }
    .legend :global(.lg) {
      font-size: 11px;
    }
    svg .tick,
    .mark .annot {
      font-size: 17px;
    }
  }
</style>
