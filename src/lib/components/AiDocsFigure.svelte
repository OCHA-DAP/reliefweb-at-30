<script>
  import ai from '$lib/data/ai_referrals.json';
  import Figure from './Figure.svelte';
  import LineChart from './LineChart.svelte';
  import { fmt, kfmt } from '$lib/chart.js';

  // AI referrals to reports and maps, by assistant, with its own `intro` and
  // `title`; anything passed as children renders under the chart. `docsNote` puts the documents
  // definition on the source line, for a title that no longer says it.
  // `withLegend` adds a legend, for a page that hides it where the end labels
  // fit and shows it where they do not.
  let {
    id = 'impact-aidocs',
    num = 'B3b',
    title = 'AI is leading people to ReliefWeb (only reports and maps)',
    sub = null,
    intro = 'TBD',
    docsNote = false,
    withLegend = false,
    children
  } = $props();

  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  // Drop the trailing partial month so the line ends on a complete data point.
  const aiMonths = ai.months.slice(0, -1);
  // Explicit hues so the four low, overlapping lines stay apart.
  const AI_COLOR = {
    ChatGPT: 'var(--c1)',
    Perplexity: 'var(--c4)',
    Gemini: 'var(--c3)',
    Copilot: 'var(--c6)',
    Claude: 'var(--c5)'
  };
  const last = (s) => s.values[s.values.length - 1];

  // The same referrals, counting only sessions that start on a report or map.
  // Most ChatGPT referrals start on the jobs board, so this is the series that
  // measures AI sending people to ReliefWeb's documents.
  const docSeries = ai.documents.series.map((s) => ({
    name: s.label,
    values: s.values.slice(0, -1),
    color: AI_COLOR[s.label] ?? 'var(--c1)'
  }));
  const docLast = sum(docSeries.map(last));
  const docShare = ((100 * docLast) / ai.documents.all_sessions[aiMonths.length - 1]).toFixed(1);

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = (m) => {
    const [y, mo] = m.split('-');
    return `${MON[+mo - 1]} ${y}`;
  };
</script>

<Figure
  {id}
  {docsNote}
  {num}
  source="Google Analytics"
  {title}
  {sub}
  {intro}
  legend={withLegend ? docSeries.map(({ name, color }) => ({ name, color })) : null}
>
  {#snippet chart()}
    <LineChart
      labels={aiMonths}
      series={docSeries}
      height={320}
      tickEvery={6}
      format={kfmt}
      tipFormat={fmt}
      xFormat={monthLabel}
      yUnit="visits"
      inlineTicks
      endLeader={32}
      inlineEndLabels
      alignEndLabels
      endLabelSize={13}
      endLabelMinWidth={0}
      ariaLabel="Line chart of monthly visits referred by ChatGPT, Perplexity, Gemini, Copilot and Claude that start on a ReliefWeb report or map, from {monthLabel(aiMonths[0])} to {monthLabel(aiMonths[aiMonths.length - 1])}. In {monthLabel(aiMonths[aiMonths.length - 1])} the five sent {fmt(docLast)} such visits, {docShare}% of all visits starting on a report or map."
    />
  {/snippet}
  {#if children}{@render children()}{/if}
</Figure>
