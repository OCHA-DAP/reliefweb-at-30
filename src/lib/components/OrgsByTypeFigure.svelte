<script module>
  import rw30 from '$lib/data/rw30.json';
  import sources from '$lib/data/sources.json';
  import { fmt, completeCount } from '$lib/chart.js';

  const n = completeCount(rw30.years);
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);

  // Distinct organizations publishing each year, by registry type. Each has one
  // type, so the lines, with "Other", sum to the year's publishers. Colors and short names
  // follow figure 3b so a type looks the same wherever it appears.
  const TYPE_COLOR = {
    'International Organization': 'var(--b4)',
    'Non-governmental Organization': 'var(--a-orange)',
    'Government': 'var(--a-purple)',
    'Media': '#D4D4D4',
    'Red Cross/Red Crescent Movement': 'var(--a-green)',
    'Academic and Research Institution': 'var(--a-slate)',
    'Other': 'var(--impact-other, #b0b0b0)'
  };
  const TYPE_SHORT = {
    'International Organization': 'UN & int’l orgs',
    'Non-governmental Organization': 'NGOs',
    'Government': 'Government',
    'Media': 'Media',
    'Red Cross/Red Crescent Movement': 'Red Cross / Crescent',
    'Academic and Research Institution': 'Academic',
    'Other': 'Other'
  };
  const orgYears = rw30.years.slice(0, n);
  const orgTypeSeries = sources.orgs_by_type.map((t) => ({
    name: TYPE_SHORT[t.label] ?? t.label,
    values: t.values.slice(0, n),
    color: TYPE_COLOR[t.label] ?? 'var(--rule-strong)',
    // Media's light gray line is too pale for its number; a darker gray reads.
    ...(t.label === 'Media' && { labelColor: '#767676' })
  }));
  // "Other" counts toward the facts below but is not drawn.
  const drawnSeries = orgTypeSeries.filter((t) => t.name !== TYPE_SHORT['Other']);
  const orgsOf = (label) => orgTypeSeries.find((t) => t.name === TYPE_SHORT[label]).values;
  const ngoOrgs = orgsOf('Non-governmental Organization');
  const ioOrgs = orgsOf('International Organization');
  const lastOrgYear = orgYears.length - 1;
  const orgsLast = sum(orgTypeSeries.map((t) => t.values[lastOrgYear]));
  // The first year from which NGOs are the largest type in every later year.
  const ngoLeads = (i) => orgTypeSeries.every((t) => t.values === ngoOrgs || ngoOrgs[i] > t.values[i]);
  const ngoLeadFrom = orgYears[orgYears.findLastIndex((_, i) => !ngoLeads(i)) + 1];

  // The figure's intro.
  export const orgsIntro = `ReliefWeb brings together information from a wide range of organizations and institutions. NGOs have been the largest group of publishers every year since ${ngoLeadFrom}, with ${fmt(ngoOrgs[lastOrgYear])} NGOs publishing in ${orgYears[lastOrgYear]}.`;
  // The facts behind it, for the story's own wording.
  export const ngoFacts = { since: ngoLeadFrom, count: ngoOrgs[lastOrgYear], year: orgYears[lastOrgYear] };
</script>

<script>
  import Figure from './Figure.svelte';
  import LineChart from './LineChart.svelte';

  // Publishing organizations per year by type; anything passed as children
  // renders under the chart. `intro=""` leaves the intro out.
  let {
    id = 'impact-orgsbytype',
    num = 'B2',
    title = 'Publishing organizations per year by type',
    sub = null,
    intro = orgsIntro,
    children
  } = $props();
</script>

<Figure
  {id}
  {num}
  source="ReliefWeb API"
  {title}
  {sub}
  {intro}
>
  {#snippet chart()}
    <LineChart
      labels={orgYears}
      series={drawnSeries}
      height={320}
      format={fmt}
      tipFormat={fmt}
      yUnit="organizations"
      inlineTicks
      endLeader={32}
      inlineEndLabels
      alignEndLabels
      endLabelSize={13}
      endLabelMinWidth={0}
      maxTicks={6}
      ariaLabel="Line chart of distinct organizations publishing on ReliefWeb each year by type, {orgYears[0]} to {orgYears[lastOrgYear]}. NGOs are the largest type every year since {ngoLeadFrom}; in {orgYears[lastOrgYear]}, {fmt(ngoOrgs[lastOrgYear])} NGOs and {fmt(ioOrgs[lastOrgYear])} international organizations published."
    />
  {/snippet}
  {#if children}{@render children()}{/if}
</Figure>
