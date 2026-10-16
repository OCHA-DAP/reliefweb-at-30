<script>
  import archive from '$lib/data/archive.json';
  import Figure from './Figure.svelte';
  import LineChart from './LineChart.svelte';
  import { f1 } from '$lib/chart.js';
  import { readWindowShort, readWindowText, readMinWord, readTimes } from '$lib/readwindow.js';

  // Read rate by year published; anything passed as children renders under the
  // chart.
  let {
    id = 'stillworth-age',
    num = '5c',
    title = 'The oldest documents are still viewed',
    intro = null,
    marks = [],
    // A year whose fixed end label to drop, when a mark already names it.
    hideAt = null,
    hoverable = true,
    children
  } = $props();

  const years = archive.years;

  // Still worth: read-rate by publication year, across the whole archive.
  const sw = archive.still_worth.by_year;
  const readRate = sw.map((r) => r.read_rate);
  const trough = sw.reduce((m, r) => (r.read_rate < m.read_rate ? r : m), sw[0]);
  // The bottom of the valley is flat: several years sit within half a point of
  // the minimum, so it is described as a span of years, not a single low year.
  const floorYears = sw.filter((r) => r.read_rate <= trough.read_rate + 0.5).map((r) => r.year);
  const troughSpan = `${Math.min(...floorYears)}–${Math.max(...floorYears)}`;
  const oldest = sw[0];
  const newest = sw[sw.length - 1];
</script>

<Figure
  {id}
  {num}
  source="Google Analytics and ReliefWeb full-text export"
  {title}
  sub="Share of a year's documents {readTimes}, by year published, {readWindowShort}"
  intro={intro ?? `Every year of the archive is still in use. The share viewed is a valley, not a slope: ${oldest.read_rate}% of ${oldest.year}'s documents were ${readTimes} ${readWindowText}, dropping to about ${Math.round(trough.read_rate)}% for documents from ${troughSpan}, then climbing to ${newest.read_rate}% for ${newest.year}. The newest material and the oldest are both viewed more than the twenty years in between.`}
>
  {#snippet chart()}
    <LineChart
      labels={years}
      series={[{ name: `Viewed ${readMinWord} or more times`, values: readRate, color: 'var(--accent)' }]}
      ariaLabel="Line chart of the share of each year's documents {readTimes} {readWindowText}, forming a valley from {oldest.read_rate}% in {oldest.year} down to about {Math.round(trough.read_rate)}% for {troughSpan} and back up to {newest.read_rate}% in {newest.year}."
      format={(v) => v.toFixed(0) + '%'}
      tipFormat={f1}
      yMax={100}
      pointLabels={[
        { at: String(oldest.year), label: `${Math.round(oldest.read_rate)}% viewed` },
        { at: String(trough.year), span: [String(Math.min(...floorYears)), String(Math.max(...floorYears))], wide: true, label: `about ${Math.round(trough.read_rate)}% viewed, ${troughSpan}` },
        { at: String(newest.year), label: `${Math.round(newest.read_rate)}% viewed` }
      ].filter((p) => p.span || p.at !== String(hideAt))}
      headroom={0}
      height={250}
      maxTicks={6}
      endLabels={false}
      fill
      {marks}
      {hoverable}
    />
  {/snippet}
  {#if children}{@render children()}{/if}
</Figure>
