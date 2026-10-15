<script>
  import dots from '$lib/data/country_dots.json';
  import byCountry from '$lib/data/readership_country.json';
  import archive from '$lib/data/archive.json';
  import rp from '$lib/data/readership_page.json';
  import search from '$lib/data/search_terms.json';
  import topo from '$lib/data/world.topo.json';
  import active from '$lib/data/ga_active_12m.json';
  import { fmt } from '$lib/chart.js';
  import { readTimes, readWindowText, readWindowShort } from '$lib/readwindow.js';
  import Figure from '$lib/components/Figure.svelte';
  import ArchiveAgeFigure from '$lib/components/ArchiveAgeFigure.svelte';
  import Scrolly from './Scrolly.svelte';
  import Step from './Step.svelte';
  import { worldPaths, shareClass, SHARE_BREAKS } from './layouts.js';

  // Chapter 3: which countries the documents are about, then where their readers are. One
  // choropleth, two shares on the same classes, so the step between them is a
  // change of fill on the same paths. Countries whose traffic reads as data
  // centers rather than people are left out of the visits view.
  const map = worldPaths(topo);
  const byIso = new Map(dots.countries.map((c) => [c.iso3, c]));
  const by = (iso) => byIso.get(iso);
  const same = (iso) => byCountry.countries.find((c) => c.iso3 === iso);
  const COD = by('COD');
  const USA = by('USA');
  const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const NAME = { USA: 'the United States', CHN: 'China', VNM: 'Viet Nam', BRA: 'Brazil', SGP: 'Singapore', PSE: 'the State of Palestine', PHL: 'the Philippines', GBR: 'the United Kingdom' };
  const LABEL = { PSE: 'State of Palestine', USA: 'United States', GBR: 'United Kingdom' };
  const nameOf = (iso) => NAME[iso] ?? by(iso).rw_short;
  const labelOf = (iso) => LABEL[iso] ?? by(iso).rw_short;
  const capFirst = (t) => t[0].toUpperCase() + t.slice(1);
  // Whole percentages in the text, except where rounding would say 0%.
  // Round shares said in words.
  const PERCENT_WORDS = { 20: 'one fifth', 25: 'a quarter', 50: 'half' };
  const pct = (v) => (v >= 1 ? String(Math.round(v)) : v >= 0.1 ? v.toFixed(1) : 'under 0.1');

  // How concentrated the documents are, over the countries the map shades.
  const ranked = dots.countries.filter((c) => c.docs > 0).sort((a, b) => b.docs - a.docs);
  const placed = ranked.length;
  const cum = (k) => Math.round((100 * ranked.slice(0, k).reduce((a, c) => a + c.docs, 0)) / dots.docs_total);
  const top5 = ranked.slice(0, 5).map((c) => c.iso3);
  const next4 = ranked.slice(1, 5);

  // Readers: the five countries sending the most visits (data-center traffic
  // left out), and among them the one ReliefWeb also writes about heavily, the
  // exception to the inversion as figure 5a finds it.
  const readers = byCountry.countries.filter((c) => !c.not_readers).sort((a, b) => b.read_share - a.read_share);
  const top5Readers = readers.slice(0, 5);
  const alsoWritten = top5Readers.filter((c) => c.doc_share >= 1 && c.read_share > c.doc_share);
  const millions = (n) => `${(n / 1e6).toFixed(1)} million`;

  // The UN Blue ramp, lightest to darkest; gray for no data or excluded.
  const RAMP = ['var(--b7)', 'var(--b5)', 'var(--b4)', 'var(--b3)', 'var(--b1)'];
  const NONE = '#D4D4D4';
  const b = SHARE_BREAKS;
  // The legend is one stepped bar with the breaks written at the joins; a class
  // includes its lower bound, so 2.0% is in the class that starts at 2%.
  const rampLabel = `Under ${b[0]}%, ${b.slice(0, -1).map((v, i) => `${v} to ${b[i + 1]}%`).join(', ')}, ${b[b.length - 1]}% or more`;
  const share = (iso, metric) => {
    const c = byIso.get(iso);
    if (!c || (metric === 'visits' && c.not_readers)) return null;
    return metric === 'docs' ? c.doc_share : c.read_share;
  };
  const fill = (iso, metric) => {
    const v = share(iso, metric);
    return v == null ? NONE : RAMP[shareClass(v)];
  };

  // What each of the two maps is, said above it.
  const TITLES = {
    docs: {
      title: 'Which countries the documents are about',
      sub: `Share of all documents, ${dots.docs_window[0]}–${dots.docs_window[1]}, by the country each document is filed under`,
      key: 'Share of documents'
    },
    visits: {
      title: 'Which countries the readers are in',
      sub: `Share of visits to documents, ${readWindowShort}, by the country of the reader's browser`,
      key: 'Share of visits'
    }
  };

  const VIEWS = [
    { metric: 'docs', labels: top5, highlight: false },
    { metric: 'docs', labels: top5, highlight: true, values: true },
    { metric: 'visits', labels: top5Readers.map((c) => c.iso3), highlight: false, values: true },
    { metric: 'visits', labels: ['COD', 'USA'], highlight: true }
  ];
  let step = $state(0);
  const view = $derived(VIEWS[Math.min(step, VIEWS.length - 1)]);
  const dim = (iso, v) => v.highlight && !v.labels.includes(iso);
  const labelAt = (iso) => {
    const c = by(iso);
    return map.proj([c.lon, c.lat]);
  };
  const LABELLED = [...new Set(VIEWS.flatMap((v) => v.labels))];
  // Names sit just above their country; the State of Palestine's hangs left and
  // Afghanistan's right, so neither runs into Iraq's.
  const ANCHOR = { PSE: 'end', AFG: 'start' };
  // On the step that quotes the shares, each name carries its share and stands
  // off its country on a short right-angled leader that keeps the five clear of
  // each other: [dx, dy, text-anchor] from the centroid, in map units.
  // dy 0 is a straight horizontal leader, dx 0 a straight vertical one.
  // About 45 map units, so a leader stays at least 25px long on screen down to a
  // 1000px-wide window.
  const LEADER = {
    COD: [-45, 0, 'end'],
    SDN: [-45, 0, 'end'],
    PSE: [-45, 0, 'end'],
    IRQ: [0, -50, 'middle'],
    AFG: [45, 0, 'start'],
    USA: [0, -50, 'middle'],
    GBR: [0, -50, 'middle'],
    IND: [0, 50, 'middle'],
    PHL: [0, -50, 'middle'],
    AUS: [0, 50, 'middle']
  };
  // On a phone there is no room for both Middle East names without leaders.
  const CROWDED = new Set(['PSE', 'IRQ']);
  // The share the shading shows, on the label, to one decimal: rounded to whole
  // numbers, a 4.6% country would read 5% while shaded in the 2–5% class.
  const valueOf = (iso, metric) => {
    const v = share(iso, metric);
    return v == null ? '' : v >= 0.1 ? `${v.toFixed(1)}%` : 'under 0.1%';
  };
  const tip = (iso) => {
    const c = byIso.get(iso);
    if (!c) return null;
    const docs = `${c.rw_short}: ${c.doc_share.toFixed(1)}% of documents ${dots.docs_window[0]}–${dots.docs_window[1]}`;
    return c.not_readers ? `${docs}, visits excluded` : `${docs}, ${c.read_share.toFixed(1)}% of document visits, ${readWindowShort}`;
  };

  // ---- In flow: the archive is still viewed --------------------------------------
  const sw = archive.still_worth.by_year;
  const tsunami = rp.archive.find((a) => a.name.startsWith('South Asia: Earthquake and Tsunami'));
  // Opens on the least-viewed year, at the bottom of the valley.
  let year = $state(sw.reduce((m, r) => (r.read_rate < m.read_rate ? r : m), sw[0]).year);
  const yearRow = $derived(sw.find((r) => r.year === +year));
  const yearTop = $derived(archive.still_worth.top_by_year[String(year)] ?? []);
  // The marker's label sits above the top gridline; near either end a centered
  // label would run off the plot, so it hangs inward.
  const yearMarks = $derived.by(() => {
    const i = sw.indexOf(yearRow);
    const anchor = i < 3 ? 'start' : i > sw.length - 4 ? 'end' : 'middle';
    return [
      {
        label: `${yearRow.year}: ${Math.round(yearRow.read_rate)}% of ${fmt(yearRow.docs)} documents viewed`,
        at: String(yearRow.year),
        anchor
      }
    ];
  });

  // ---- In flow: what readers search for ------------------------------------------
  const terms = search.all_time;
  const maxShare = terms[0].share;
  // How much of all searching the listed terms account for: every share is small
  // because searches spread thinly across terms.
  const topShare = Math.round(terms.reduce((a, t) => a + t.share, 0));
  const places = terms.filter((t) => t.country).length;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = (d) => `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
  const searchSpan = `${mon(search.window[0])} – ${mon(search.window[1])}`;
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
</script>

<section class="act" id="readers" aria-labelledby="h-a3">
  <header class="ahead">
    <p class="anum">Chapter 3</p>
    <h2 id="h-a3">Which countries the documents cover, and where readers are</h2>
  </header>

  <Scrolly
    id="a3"
    bind:step
    wide
    source="ReliefWeb full document export and Google Analytics 4, boundaries: fieldmaps, Global International Boundaries (OSM), via HDX"
  >
    {#snippet graphic()}
      <p class="mtitle">{TITLES[view.metric].title}</p>
      <p class="msub">{TITLES[view.metric].sub}</p>
      <svg class="map" viewBox="0 0 {map.W} {map.H}" width="100%" role="img" aria-label={view.metric === 'docs'
        ? `World map shaded by each country's share of documents, ${dots.docs_window[0]}–${dots.docs_window[1]}.`
        : `World map shaded by each country's share of visits to documents, ${readWindowShort}.`}>
        {#each map.paths as p (p.iso3)}
          {@const t = tip(p.iso3)}
          <path class="ctry" class:dim={dim(p.iso3, view)} d={p.d} style="fill:{fill(p.iso3, view.metric)}">{#if t}<title>{t}</title>{/if}</path>
        {/each}
        {#each LABELLED as iso (iso)}
          {@const [x, y] = labelAt(iso)}
          {@const a = ANCHOR[iso]}
          <g class="clab" class:on={view.labels.includes(iso) && !view.values} class:crowd={CROWDED.has(iso)}>
            <circle cx={x} cy={y} r="3" />
            <text x={x + (a === 'end' ? -6 : a === 'start' ? 6 : 0)} y={a ? y + 5 : y - 9} text-anchor={a ?? 'middle'}>{labelOf(iso)}</text>
          </g>
          {#if LEADER[iso]}
            {@const [dx, dy, la] = LEADER[iso]}
            {@const tx = x + dx}
            <g class="clab" class:on={view.labels.includes(iso) && view.values}>
              <path d={la === 'middle'
                ? `M${x},${y}V${dy < 0 ? y + dy + 5 : y + dy}`
                : `M${x},${y}V${y + dy}H${tx + (la === 'end' ? 4 : -4)}`} />
              <circle cx={x} cy={y} r="3" />
              <text x={tx} y={la === 'middle' ? (dy < 0 ? y + dy : y + dy + 16) : y + dy + 6} text-anchor={la}>{labelOf(iso)} <tspan class="cval">{valueOf(iso, view.metric)}</tspan></text>
            </g>
          {/if}
        {/each}
      </svg>
      <p class="disclaimer">
        The boundaries and names shown and the designations used on this map do not imply official endorsement or
        acceptance by the United Nations.
      </p>
      <div class="legend mkey">
        <span class="kcap">{TITLES[view.metric].key}</span>
        <span class="ramp" role="img" aria-label={rampLabel}>
          {#each RAMP as c (c)}<i style="background:{c}"></i>{/each}
          {#each b as v, i (v)}<span class="brk" style="left:{(100 * (i + 1)) / RAMP.length}%">{v}%</span>{/each}
        </span>
        <span class="lg"><i style="background:{NONE}"></i>{view.metric === 'docs' ? 'no data' : 'no data or excluded'}</span>
      </div>
      <p class="gnote">
        {#if view.metric === 'docs'}
          {fmt(dots.world_docs)} documents filed under no single country are not counted.
        {:else}
          The map shows estimated usage by human readers, excluding automated bots and indexers.
        {/if}
      </p>
    {/snippet}

    <Step id="a3-s0" i={0}>
      Documents on ReliefWeb have covered {placed} countries and territories. Of the documents about a single country,
      {cum(25)} per&nbsp;cent focus on just 25 of them, and {PERCENT_WORDS[cum(5)] ?? `${cum(5)} per\u00a0cent`} are about five countries.
    </Step>
    <Step id="a3-s1" i={1}>
      DR Congo has the most documents of any country, {fmt(COD.docs)}; then {list(next4.map((c) => nameOf(c.iso3)))},
      each between {Math.floor(Math.min(...next4.map((c) => c.doc_share)))} and
      {Math.ceil(Math.max(...next4.map((c) => c.doc_share)))} per&nbsp;cent of the archive.
    </Step>
    <Step id="a3-s2" i={2}>
      This map shows which countries the readers are in. {millions(active.active_users)} people viewed ReliefWeb's
      documents in the past year, {active.window_display.replace(' – ', ' to ')}. {capFirst(nameOf(top5Readers[0].iso3))} had the most visits,
      {pct(top5Readers[0].read_share)} per&nbsp;cent, followed by {list(top5Readers.slice(1).map((c) => nameOf(c.iso3)))}.{#if alsoWritten.length === 1}{' '}{capFirst(
          nameOf(alsoWritten[0].iso3)
        )} is frequently the subject of reports, as well as having a strong audience for ReliefWeb content in general.{/if}
    </Step>
    <Step id="a3-s3" i={3}>
      DR Congo and the United States are opposites. In those same months, DR Congo was {pct(same('COD').doc_share)} per&nbsp;cent of
      the documents and {pct(same('COD').read_share)} per&nbsp;cent of the readers. In contrast, the United States represented
      {pct(same('USA').doc_share)} per&nbsp;cent of documents but {pct(same('USA').read_share)} per&nbsp;cent of readers.
    </Step>
  </Scrolly>

  <div class="inflow">
    <p class="lede">
      Documents are still viewed long after a crisis has passed. For example, {Math.round(tsunami.read_rate)} per&nbsp;cent of
      documents about the 2004 tsunami were {readTimes} {readWindowText},
      {tsunami.age} years on.
    </p>
    <ArchiveAgeFigure
      id="a3-still"
      num={null}
      title="Every year of the archive is still viewed"
      intro=""
      marks={yearMarks}
      hideAt={year}
      hoverable={false}
    >
      <!-- Under the year axis and across the same span as the plot, so the handle
           sits under its year; the marker and the result say which year it is. -->
      <label class="scrub">
        <span class="sr-only">Year published</span>
        <input type="range" min={sw[0].year} max={sw[sw.length - 1].year} step="1" bind:value={year} />
      </label>
      <div class="result">
        <!-- The marker on the chart says this; screen readers hear it here. -->
        <p class="sr-only" aria-live="polite">{yearMarks[0].label}</p>
        {#if yearTop.length}
          <div class="top">
            <p class="toph"><span>Most-viewed documents from {yearRow.year}</span><span>Engaged visits</span></p>
            <!-- One line each: a long title is cut short, with the whole of it
                 on hover and in the link. -->
            <ol>
              {#each yearTop as d, i (d.url)}
                <li>
                  <span class="rk">{i + 1}</span>
                  <span class="doc" title="{d.title}, {d.source}"
                    ><a href={d.url} target="_blank" rel="noopener">{d.title}</a>, {d.source}</span
                  >
                  <span class="n">{fmt(d.visits)}</span>
                </li>
              {/each}
            </ol>
          </div>
        {/if}
      </div>
    </ArchiveAgeFigure>

    <p class="lede">
      Readers mostly search for places. “{cap(terms[0].term)}” is the most common search, and {places} of the
      {search.top_n} most common searches are the names of countries or territories.
    </p>
    <Figure
      id="a3-search"
      num={null}
      title="What readers search for"
      sub="Top {search.top_n} searches of ReliefWeb's documents, by engaged visits, {searchSpan}"
      source="Google Analytics 4 and ReliefWeb full document export"
      footnote="Searches of job and training material are excluded. Documents are filed by primary country."
    >
      {#snippet chart()}
        <p class="tnote">
          Searches are spread thinly: together, the {search.top_n} most common terms make up {topShare} per&nbsp;cent of all
          searches.<br /><b>Share of searches</b>: how often this was searched, out of all searches of ReliefWeb's
          documents.<br /><b>Share of docs</b>: how much of the archive consists of documents about a given country. Blank means the
          search is not a country.
        </p>
        <ol class="terms">
          <li class="thead" aria-hidden="true">
            <span class="term">Search term</span><span class="bar"></span><span class="num">Share of searches</span><span class="ds">Share of docs</span>
          </li>
          {#each terms as t (t.term)}
            <li>
              <span class="term">{t.term}</span>
              <span class="bar"><i style="width:{(100 * t.share) / maxShare}%"></i></span>
              <span class="num">{t.share.toFixed(1)}%</span>
              <span class="ds">{t.doc_share != null ? `${t.doc_share.toFixed(1)}%` : ''}</span>
            </li>
          {/each}
        </ol>
      {/snippet}
    </Figure>
  </div>
</section>

<style>
  /* The map gives way on a short screen, so its title, legend and notes stay
     inside the pinned graphic. */
  .map {
    max-height: calc(min(88svh, 760px) - 200px);
  }
  .ctry {
    stroke: #fff;
    stroke-width: 0.5px;
    vector-effect: non-scaling-stroke;
    transition:
      fill 0.8s,
      opacity 0.6s;
  }
  .ctry.dim {
    opacity: 0.35;
  }
  .clab {
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }
  .clab.on {
    opacity: 1;
  }
  .clab path {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }
  .clab .cval {
    font-weight: 400;
  }
  .clab circle {
    fill: var(--ink);
    stroke: #fff;
    stroke-width: 1.5px;
  }
  .clab text {
    font-size: 18px;
    font-weight: 700;
    fill: var(--ink);
    paint-order: stroke;
    stroke: #fff;
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  /* Which map this is, sized like the story's figure titles. */
  .mtitle {
    margin: 0;
    font-size: 19px;
    line-height: 1.25;
    font-weight: 700;
  }
  .msub {
    margin: 2px 0 8px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .mkey {
    margin-top: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
    align-items: flex-start;
  }
  /* The classes side by side as one bar, the breaks written under the joins. */
  .ramp {
    position: relative;
    display: inline-flex;
    width: 220px;
    height: 12px;
    margin: 2px 0 16px;
  }
  .ramp i {
    flex: 1;
  }
  .brk {
    position: absolute;
    top: 14px;
    transform: translateX(-50%);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .brk::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -4px;
    height: 4px;
    border-left: 1px solid var(--ink);
  }
  .kcap {
    font-size: 11px;
    font-weight: 700;
    margin-right: 2px;
    line-height: 16px;
  }
  .gnote {
    font-size: 12px;
    margin: 6px 0 0;
  }
  /* Lighter than the notes, but still 4.5:1 on white. */
  .disclaimer {
    font-size: 11px;
    font-style: italic;
    color: #767676;
    margin: 2px 0 8px;
  }
  /* LineChart's plot runs from 46px in on the left to 20px in on the right when
     it has no end labels; the slider spans the same, less half its 18px thumb. */
  .scrub {
    display: block;
    margin: -8px 11px 0 37px;
  }
  /* Drawn the same in every browser: a thin gray track and a blue handle, with
     a focus ring for the keyboard. 24px tall, so it is easy to grab on a phone. */
  .scrub input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 24px;
    margin: 0;
    background: transparent;
    cursor: pointer;
  }
  .scrub input:focus {
    outline: none;
  }
  .scrub input:focus-visible {
    outline: 2px solid var(--b3);
    outline-offset: 2px;
    border-radius: 12px;
  }
  .scrub input::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: #ccc;
  }
  .scrub input::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: #ccc;
  }
  .scrub input::-webkit-slider-thumb {
    -webkit-appearance: none;
    margin-top: -7px;
    box-sizing: border-box;
    width: 18px;
    height: 18px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--b3);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  .scrub input::-moz-range-thumb {
    box-sizing: border-box;
    width: 18px;
    height: 18px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--b3);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  :global(#a3-still .annot:not(.plabel)) {
    font-size: 14px;
    font-weight: 600;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  /* The reader's result sits under the chart, explanation then links, so a
     longer or shorter result never moves the chart. */
  .result {
    margin: 14px 0 0;
    max-width: 70ch;
  }
  .top {
    margin: 10px 0 0;
    max-width: 70ch;
    font-size: 13.5px;
  }
  .toph {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .top ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .top li {
    display: grid;
    grid-template-columns: 1.2em minmax(0, 1fr) 3.4em;
    gap: 0 12px;
    align-items: baseline;
    padding: 3px 0;
    line-height: 1.35;
  }
  .top .doc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .top li a {
    color: var(--accent-text);
  }
  .top .rk,
  .top .n {
    font-variant-numeric: tabular-nums;
  }
  .top .n {
    text-align: right;
    font-weight: 600;
  }
  .tnote {
    font-size: 12.5px;
    line-height: 1.5;
    max-width: 640px;
    margin: 0 0 10px;
  }
  .terms {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 13.5px;
    max-width: 640px;
  }
  /* Header and rows share one grid, so each header sits over its column. */
  .terms li {
    display: grid;
    grid-template-columns: minmax(0, 13em) minmax(0, 1fr) 7em 6em;
    gap: 12px;
    align-items: center;
    padding: 3px 0;
    border-bottom: 1px solid var(--rule);
  }
  .terms .thead {
    align-items: end;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom-color: var(--rule-strong);
  }
  .term {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar i {
    display: block;
    height: 12px;
    background: var(--b4);
    border-radius: 0 2px 2px 0;
  }
  .num,
  .ds {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-size: 12.5px;
  }
  .thead .num,
  .thead .ds {
    font-size: inherit;
  }
  @media (max-width: 699px) {
    .top li {
      gap: 0 8px;
      font-size: 13px;
    }
    .clab text {
      font-size: 30px;
      stroke-width: 6px;
    }
    .mkey {
      gap: 2px 8px;
      margin-top: 4px;
    }
    .mkey :global(.lg) {
      font-size: 10.5px;
    }
    .ramp {
      width: 160px;
    }
    .brk {
      font-size: 10px;
    }
    .mtitle {
      font-size: 14px;
    }
    .map {
      max-height: calc(50svh - 180px);
    }
    .clab.crowd {
      display: none;
    }
    .msub {
      font-size: 10px;
    }
    /* No room in half a phone screen; the methods text carries these notes. */
    .gnote {
      display: none;
    }
    .disclaimer {
      font-size: 10px;
      line-height: 1.35;
      margin-top: 4px;
    }
    .msub {
      margin-bottom: 4px;
    }
    .mkey {
      flex-wrap: wrap;
      white-space: normal;
    }
    .terms li {
      grid-template-columns: minmax(0, 7em) minmax(0, 1fr) 5.5em 5em;
      gap: 8px;
    }
    .terms .thead {
      font-size: 9.5px;
    }
    /* The header's term runs over the empty bar column, so it is never cut. */
    .thead .term {
      grid-column: 1 / 3;
    }
    .thead .bar {
      display: none;
    }
  }
</style>
